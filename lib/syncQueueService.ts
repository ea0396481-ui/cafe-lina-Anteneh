/**
 * Sync Queue Service for Yeserahut
 * 
 * Manages the offline-first sync queue in the local database.
 * Every create, update, and delete operation is persistently queued here before or alongside
 * cloud synchronization attempts.
 */

import { generateUUID, getClientId, localDatabaseService } from './localDatabaseService';

export type SyncOperationType = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncItemStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface SyncQueueItem {
  id: string;
  entity: string;
  entity_id: string;
  operation: SyncOperationType;
  payload: Record<string, any>;
  created_at: string;
  updated_at: string;
  sync_status: SyncItemStatus;
  retry_count: number;
  last_error: string | null;
  version: number;
  user_id: string | null;
  client_id: string;
}

const SYNC_QUEUE_TABLE = 'sync_queue';
const QUEUE_STORAGE_KEY = 'yeserahut_sync_queue_cache';

class SyncQueueService {
  private inMemoryQueue: SyncQueueItem[] = [];
  private listeners: Set<(items: SyncQueueItem[]) => void> = new Set();

  constructor() {
    this.loadInitialQueue();
  }

  private async loadInitialQueue() {
    try {
      const items = await localDatabaseService.getAll<SyncQueueItem>(SYNC_QUEUE_TABLE, []);
      if (items && items.length > 0) {
        this.inMemoryQueue = items;
      } else {
        const cached = this.getLocalStorageQueue();
        if (cached.length > 0) {
          this.inMemoryQueue = cached;
          await localDatabaseService.putBatch(SYNC_QUEUE_TABLE, cached, 'id');
        }
      }
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to load initial sync queue:', e);
    }
  }

  private getLocalStorageQueue(): SyncQueueItem[] {
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignore
    }
    return [];
  }

  private saveLocalStorageQueue(items: SyncQueueItem[]) {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore
    }
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb([...this.inMemoryQueue]));
  }

  /**
   * Subscribe to queue state updates (for UI badges and monitors)
   */
  public subscribe(cb: (items: SyncQueueItem[]) => void): () => void {
    this.listeners.add(cb);
    cb([...this.inMemoryQueue]);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /**
   * Enqueue a new operation (CREATE, UPDATE, DELETE)
   */
  public async enqueue(
    operation: SyncOperationType,
    entity: string,
    entityId: string,
    payload: Record<string, any>,
    userId: string | null = null
  ): Promise<SyncQueueItem> {
    const now = new Date().toISOString();

    // Check if there is already an existing pending operation for this entity item
    const existingIndex = this.inMemoryQueue.findIndex(
      (item) =>
        item.entity === entity &&
        item.entity_id === entityId &&
        (item.sync_status === 'PENDING' || item.sync_status === 'FAILED')
    );

    let queueItem: SyncQueueItem;

    if (existingIndex >= 0) {
      const existing = this.inMemoryQueue[existingIndex];
      // If original was CREATE and current is UPDATE, keep CREATE with merged payload
      const combinedOp: SyncOperationType =
        existing.operation === 'CREATE' && operation === 'UPDATE' ? 'CREATE' : operation;

      queueItem = {
        ...existing,
        operation: combinedOp,
        payload: operation === 'DELETE' ? {} : { ...existing.payload, ...payload },
        updated_at: now,
        sync_status: 'PENDING',
        retry_count: 0,
        last_error: null,
        version: (existing.version || 1) + 1,
      };

      this.inMemoryQueue[existingIndex] = queueItem;
    } else {
      queueItem = {
        id: generateUUID(),
        entity,
        entity_id: entityId,
        operation,
        payload: operation === 'DELETE' ? {} : payload,
        created_at: now,
        updated_at: now,
        sync_status: 'PENDING',
        retry_count: 0,
        last_error: null,
        version: 1,
        user_id: userId,
        client_id: getClientId(),
      };

      this.inMemoryQueue.push(queueItem);
    }

    this.saveLocalStorageQueue(this.inMemoryQueue);
    this.notifyListeners();

    // Persist to local database
    await localDatabaseService.put(SYNC_QUEUE_TABLE, queueItem, 'id');

    return queueItem;
  }

  /**
   * Get all pending items that require cloud sync
   */
  public async getPendingItems(): Promise<SyncQueueItem[]> {
    return this.inMemoryQueue.filter(
      (item) => item.sync_status === 'PENDING' || item.sync_status === 'FAILED'
    );
  }

  /**
   * Mark an item as currently syncing
   */
  public async markSyncing(id: string): Promise<void> {
    const item = this.inMemoryQueue.find((x) => x.id === id);
    if (item) {
      item.sync_status = 'SYNCING';
      item.updated_at = new Date().toISOString();
      this.saveLocalStorageQueue(this.inMemoryQueue);
      this.notifyListeners();
      await localDatabaseService.put(SYNC_QUEUE_TABLE, item, 'id');
    }
  }

  /**
   * Mark an item as successfully synced to cloud
   */
  public async markSynced(id: string): Promise<void> {
    const item = this.inMemoryQueue.find((x) => x.id === id);
    if (item) {
      item.sync_status = 'SYNCED';
      item.updated_at = new Date().toISOString();
      item.last_error = null;
      this.saveLocalStorageQueue(this.inMemoryQueue);
      this.notifyListeners();
      await localDatabaseService.put(SYNC_QUEUE_TABLE, item, 'id');
    }
  }

  /**
   * Mark an item as failed with error details and backoff
   */
  public async markFailed(id: string, error: string): Promise<void> {
    const item = this.inMemoryQueue.find((x) => x.id === id);
    if (item) {
      item.sync_status = 'FAILED';
      item.retry_count = (item.retry_count || 0) + 1;
      item.last_error = error;
      item.updated_at = new Date().toISOString();
      this.saveLocalStorageQueue(this.inMemoryQueue);
      this.notifyListeners();
      await localDatabaseService.put(SYNC_QUEUE_TABLE, item, 'id');
    }
  }

  /**
   * Get count of pending items
   */
  public getPendingCount(): number {
    return this.inMemoryQueue.filter(
      (item) => item.sync_status === 'PENDING' || item.sync_status === 'FAILED'
    ).length;
  }

  /**
   * Get all items in queue (including historical synced items for audit)
   */
  public getAllItems(): SyncQueueItem[] {
    return [...this.inMemoryQueue];
  }

  /**
   * Clear older synced items to keep memory clean
   */
  public async clearSyncedItems(): Promise<void> {
    const remaining = this.inMemoryQueue.filter((item) => item.sync_status !== 'SYNCED');
    const syncedIds = this.inMemoryQueue
      .filter((item) => item.sync_status === 'SYNCED')
      .map((item) => item.id);

    this.inMemoryQueue = remaining;
    this.saveLocalStorageQueue(this.inMemoryQueue);
    this.notifyListeners();

    for (const id of syncedIds) {
      await localDatabaseService.purgeRecord(SYNC_QUEUE_TABLE, id);
    }
  }
}

export const syncQueueService = new SyncQueueService();
