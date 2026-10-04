/**
 * Cloud Sync Service for Yeserahut
 * 
 * Orchestrates two-way automatic synchronization between the Local Database, Sync Queue,
 * and Cloud Firestore.
 * 
 * Flow:
 * - ONLINE: App -> Local Database -> Sync Queue -> Cloud Firestore
 * - OFFLINE: App -> Local Database -> Sync Queue (stays PENDING)
 * - RECONNECT: Local Database -> Sync Queue -> Cloud Firestore automatically
 * - REMOTE CHANGES: Cloud Firestore -> Local Database -> UI
 */

import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db, ensureFirebaseAuth } from '../firebase';
import { localDatabaseService, getClientId, generateUUID } from './localDatabaseService';
import { syncQueueService, SyncQueueItem } from './syncQueueService';
import { connectivityService } from './connectivityService';
import { sanitizeForFirestore } from './firebaseSync';

export interface SyncStatusInfo {
  status: 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNCED' | 'SYNC_ERROR';
  pendingCount: number;
  lastSyncTime: string | null;
  lastError: string | null;
}

class CloudSyncService {
  private isSyncInProgress: boolean = false;
  private lastSuccessfulSyncTime: string | null = null;
  private syncTimerId: any = null;
  private statusListeners: Set<(info: SyncStatusInfo) => void> = new Set();
  private entityListeners: Map<string, Set<(data: any[]) => void>> = new Map();
  private cloudUnsubscribers: Map<string, () => void> = new Map();

  constructor() {
    this.lastSuccessfulSyncTime = localStorage.getItem('yeserahut_last_sync_time');

    // Subscribe to connectivity transitions
    connectivityService.subscribe((connState) => {
      if (connState === 'ONLINE') {
        this.triggerAutoSync();
      }
      this.notifyStatusListeners();
    });

    // Subscribe to queue changes
    syncQueueService.subscribe(() => {
      this.notifyStatusListeners();
      if (connectivityService.isOnline() && !this.isSyncInProgress) {
        this.triggerAutoSync();
      }
    });

    // Periodic sync attempt every 20 seconds when online
    if (typeof window !== 'undefined') {
      this.syncTimerId = setInterval(() => {
        if (connectivityService.isOnline() && !this.isSyncInProgress) {
          const pending = syncQueueService.getPendingCount();
          if (pending > 0) {
            this.triggerAutoSync();
          }
        }
      }, 20000);
    }
  }

  public getStatusInfo(): SyncStatusInfo {
    const connState = connectivityService.getState();
    const pendingCount = syncQueueService.getPendingCount();

    let calculatedStatus: SyncStatusInfo['status'] = connState;
    if (connState === 'ONLINE') {
      if (this.isSyncInProgress) {
        calculatedStatus = 'SYNCING';
      } else if (pendingCount > 0) {
        calculatedStatus = 'ONLINE'; // Has pending items awaiting push
      } else {
        calculatedStatus = 'SYNCED';
      }
    }

    return {
      status: calculatedStatus,
      pendingCount,
      lastSyncTime: this.lastSuccessfulSyncTime,
      lastError: connectivityService.getLastError(),
    };
  }

  public subscribeStatus(cb: (info: SyncStatusInfo) => void): () => void {
    this.statusListeners.add(cb);
    cb(this.getStatusInfo());
    return () => {
      this.statusListeners.delete(cb);
    };
  }

  private notifyStatusListeners() {
    const info = this.getStatusInfo();
    this.statusListeners.forEach((cb) => cb(info));
  }

  /**
   * Main Automatic Sync Worker (Local Sync Queue -> Cloud Firestore)
   */
  public async triggerAutoSync(): Promise<boolean> {
    if (this.isSyncInProgress) {
      return false;
    }

    if (!connectivityService.isOnline()) {
      return false;
    }

    const pendingItems = await syncQueueService.getPendingItems();
    if (pendingItems.length === 0) {
      this.lastSuccessfulSyncTime = new Date().toISOString();
      localStorage.setItem('yeserahut_last_sync_time', this.lastSuccessfulSyncTime);
      connectivityService.setState('SYNCED');
      this.notifyStatusListeners();
      return true;
    }

    this.isSyncInProgress = true;
    connectivityService.setState('SYNCING');
    this.notifyStatusListeners();

    let allSucceeded = true;
    let syncError: string | null = null;

    try {
      await ensureFirebaseAuth();

      for (const item of pendingItems) {
        // Calculate exponential backoff delay based on retry count
        if (item.retry_count > 0) {
          const backoffDelay = Math.min(1000 * Math.pow(2, item.retry_count - 1), 30000);
          const itemAge = Date.now() - new Date(item.updated_at).getTime();
          if (itemAge < backoffDelay) {
            // Not ready for retry yet, skip in this cycle
            continue;
          }
        }

        await syncQueueService.markSyncing(item.id);

        try {
          if (item.operation === 'DELETE') {
            const docRef = doc(db, item.entity, item.entity_id);
            await deleteDoc(docRef);
            await syncQueueService.markSynced(item.id);
            // Permanently purge local tombstone now that cloud delete is confirmed
            await localDatabaseService.purgeRecord(item.entity, item.entity_id);
          } else {
            // CREATE or UPDATE
            const docRef = doc(db, item.entity, item.entity_id);
            const sanitized = sanitizeForFirestore({
              ...item.payload,
              _updatedAt: item.updated_at,
              _version: item.version,
              _clientId: item.client_id,
            });
            await setDoc(docRef, sanitized, { merge: true });
            await syncQueueService.markSynced(item.id);
          }
        } catch (err: any) {
          allSucceeded = false;
          const errMsg = err?.message || String(err);
          syncError = errMsg;
          await syncQueueService.markFailed(item.id, errMsg);
          console.warn(`Sync queue item ${item.id} (${item.entity}) failed:`, errMsg);
        }
      }

      if (allSucceeded) {
        this.lastSuccessfulSyncTime = new Date().toISOString();
        localStorage.setItem('yeserahut_last_sync_time', this.lastSuccessfulSyncTime);
        connectivityService.setState('SYNCED');
      } else {
        connectivityService.setState('SYNC_ERROR', syncError);
      }
    } catch (generalErr: any) {
      allSucceeded = false;
      const errMsg = generalErr?.message || 'Sync failed';
      connectivityService.setState('SYNC_ERROR', errMsg);
      console.warn('Auto sync execution error:', generalErr);
    } finally {
      this.isSyncInProgress = false;
      this.notifyStatusListeners();
    }

    return allSucceeded;
  }

  /**
   * Save a record locally first, update UI immediately, queue for sync, and attempt push
   */
  public async saveItem<T extends Record<string, any>>(
    entity: string,
    item: T,
    idField: string = 'id',
    userId: string | null = null
  ): Promise<boolean> {
    const key = String(item[idField] || item.id || item.voucherId || generateUUID());
    const preparedItem = {
      ...item,
      [idField]: key,
      _updatedAt: new Date().toISOString(),
      _clientId: getClientId(),
    };

    // Step 1: Write to Local Database first
    await localDatabaseService.put(entity, preparedItem, idField);

    // Step 2: Update UI immediately via registered entity listeners
    this.broadcastLocalEntityUpdate(entity, preparedItem, idField, false);

    // Step 3: Add to Sync Queue
    await syncQueueService.enqueue('UPDATE', entity, key, preparedItem, userId);

    // Step 4: If online, trigger cloud sync in background without blocking UI
    if (connectivityService.isOnline()) {
      this.triggerAutoSync().catch((e) => console.warn('Background sync error:', e));
    }

    return true;
  }

  /**
   * Delete a record locally first (tombstone), update UI immediately, queue for sync
   */
  public async deleteItem(
    entity: string,
    id: string,
    idField: string = 'id',
    userId: string | null = null
  ): Promise<boolean> {
    if (!id) return false;

    // Step 1: Soft-delete in Local Database
    await localDatabaseService.softDelete(entity, id, idField);

    // Step 2: Update UI immediately
    this.broadcastLocalEntityDelete(entity, id, idField);

    // Step 3: Add DELETE operation to Sync Queue
    await syncQueueService.enqueue('DELETE', entity, id, {}, userId);

    // Step 4: If online, trigger cloud sync
    if (connectivityService.isOnline()) {
      this.triggerAutoSync().catch((e) => console.warn('Background sync error:', e));
    }

    return true;
  }

  /**
   * Subscribe to an entity collection with instant local loading + automatic cloud sync
   */
  public subscribeEntity<T extends Record<string, any>>(
    entity: string,
    idField: string,
    initialData: T[],
    onData: (data: T[]) => void
  ): () => void {
    // 1. Immediately load and emit local database data (ZERO LATENCY)
    localDatabaseService.getAll<T>(entity, initialData).then((localItems) => {
      onData(localItems);
    });

    // 2. Register UI callback in local broadcaster
    if (!this.entityListeners.has(entity)) {
      this.entityListeners.set(entity, new Set());
    }
    const listeners = this.entityListeners.get(entity)!;
    listeners.add(onData);

    // 3. Connect to remote Cloud Firestore for Two-Way Inbound Sync
    if (!this.cloudUnsubscribers.has(entity)) {
      this.connectInboundCloudListener(entity, idField, initialData);
    }

    return () => {
      listeners.delete(onData);
      if (listeners.size === 0) {
        this.entityListeners.delete(entity);
        const unsub = this.cloudUnsubscribers.get(entity);
        if (unsub) {
          unsub();
          this.cloudUnsubscribers.delete(entity);
        }
      }
    };
  }

  /**
   * Inbound Cloud Sync Listener (Cloud -> Local DB -> UI) with Conflict Resolution
   */
  private connectInboundCloudListener<T extends Record<string, any>>(
    entity: string,
    idField: string,
    initialData: T[]
  ) {
    try {
      const colRef = collection(db, entity);

      const unsub = onSnapshot(
        colRef,
        async (snapshot) => {
          if (snapshot.empty) {
            // If cloud is empty and we have local records, do NOT clear local records
            return;
          }

          const deletedIds = localDatabaseService.getDeletedIds(entity);
          const remoteItems: any[] = [];
          
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const key = String(data[idField] || data.id || data.voucherId || docSnap.id);
            // If this item was deleted locally, clean it up on cloud and skip local re-addition
            if (deletedIds.has(key) || data._isDeleted) {
              if (connectivityService.isOnline()) {
                deleteDoc(doc(db, entity, docSnap.id)).catch(() => {});
              }
            } else {
              remoteItems.push({ ...data, [idField]: key });
            }
          });

          // Perform conflict-safe merge into local database
          const localItems = await localDatabaseService.getAll<any>(entity, initialData);
          const pendingQueue = await syncQueueService.getPendingItems();
          const pendingEntityKeys = new Set(
            pendingQueue.filter((q) => q.entity === entity).map((q) => q.entity_id)
          );

          const mergedMap = new Map<string, any>();

          // Add local items first
          localItems.forEach((loc) => {
            const k = String(loc[idField] || loc.id || loc.voucherId);
            if (k && !deletedIds.has(k) && !loc._isDeleted) {
              mergedMap.set(k, loc);
            }
          });

          // Merge remote items with conflict handling
          remoteItems.forEach((rem) => {
            const k = String(rem[idField] || rem.id || rem.voucherId);
            if (!k || deletedIds.has(k) || rem._isDeleted) return;

            const existingLocal = mergedMap.get(k);

            if (!existingLocal) {
              // New remote item created on another device -> Add to local DB
              mergedMap.set(k, rem);
            } else if (pendingEntityKeys.has(k)) {
              // Local device has pending unpushed edits -> Keep local version until synced!
              // Do not overwrite dirty local edits
            } else {
              // Compare timestamps / versions for conflict resolution
              const remTime = new Date(rem._updatedAt || 0).getTime();
              const locTime = new Date(existingLocal._updatedAt || 0).getTime();

              if (remTime >= locTime) {
                mergedMap.set(k, rem);
              }
            }
          });

          const mergedList = Array.from(mergedMap.values()).filter(
            (item) => !deletedIds.has(String(item[idField] || item.id || item.voucherId || ''))
          );

          // Save merged results to local database
          await localDatabaseService.putBatch(entity, mergedList, idField);

          // Broadcast to active UI listeners
          const listeners = this.entityListeners.get(entity);
          if (listeners) {
            listeners.forEach((cb) => cb(mergedList));
          }
        },
        (error) => {
          // Cloud read failed (e.g. offline, quota exhausted) -> keep working with local DB
          console.warn(`Inbound cloud sync notice for ${entity}:`, error.message);
        }
      );

      this.cloudUnsubscribers.set(entity, unsub);
    } catch (e) {
      console.warn(`Could not attach cloud listener for ${entity}:`, e);
    }
  }

  private async broadcastLocalEntityUpdate(
    entity: string,
    updatedItem: any,
    idField: string,
    isDelete: boolean
  ) {
    const listeners = this.entityListeners.get(entity);
    if (!listeners || listeners.size === 0) return;

    const currentItems = await localDatabaseService.getAll(entity, []);
    listeners.forEach((cb) => cb(currentItems));
  }

  private async broadcastLocalEntityDelete(entity: string, id: string, idField: string) {
    const listeners = this.entityListeners.get(entity);
    if (!listeners || listeners.size === 0) return;

    const currentItems = await localDatabaseService.getAll(entity, []);
    listeners.forEach((cb) => cb(currentItems));
  }

  /**
   * Reset collection locally and push to cloud
   */
  public async resetCollection<T extends Record<string, any>>(
    entity: string,
    initialData: T[],
    idField: string = 'id'
  ): Promise<boolean> {
    localDatabaseService.clearDeletedIds(entity);
    await localDatabaseService.putBatch(entity, initialData, idField);
    const listeners = this.entityListeners.get(entity);
    if (listeners) {
      listeners.forEach((cb) => cb(initialData));
    }

    for (const item of initialData) {
      const key = String(item[idField] || item.id || item.voucherId || generateUUID());
      await syncQueueService.enqueue('UPDATE', entity, key, item);
    }

    if (connectivityService.isOnline()) {
      this.triggerAutoSync().catch((e) => console.warn('Sync error on reset:', e));
    }

    return true;
  }
}

export const cloudSyncService = new CloudSyncService();
