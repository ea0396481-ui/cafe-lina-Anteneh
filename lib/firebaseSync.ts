/**
 * Unified Firebase & Offline-First Sync Layer
 * 
 * Re-exports core sync methods bridging to LocalDatabaseService, SyncQueueService,
 * and CloudSyncService to maintain full backward compatibility across all ERP modules
 * while guaranteeing true offline-first durability.
 */

import { cloudSyncService } from './cloudSyncService';
import { localDatabaseService } from './localDatabaseService';
import { syncQueueService } from './syncQueueService';
import { connectivityService } from './connectivityService';
import { db, auth, ensureFirebaseAuth } from '../firebase';

export { cloudSyncService, localDatabaseService, syncQueueService, connectivityService };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let hasLoggedQuotaWarning = false;

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isQuotaError =
    errMsg.includes('Quota limit exceeded') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('quota metric');

  if (isQuotaError) {
    if (!hasLoggedQuotaWarning) {
      hasLoggedQuotaWarning = true;
      console.warn(
        '⚠️ Firebase Firestore daily read/write quota notice. ' +
        'Yeserahut is running in Local Resilient Mode. All local data is fully preserved and will sync when quota resets.'
      );
    }
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

/**
 * Recursively removes undefined keys for Firestore compatibility
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Subscribe to an entity collection with instant local loading + automatic two-way cloud sync
 */
export function subscribeToCollection<T extends Record<string, any>>(
  collectionName: string,
  idField: string,
  initialData: T[],
  onData: (data: T[]) => void
): () => void {
  return cloudSyncService.subscribeEntity<T>(collectionName, idField, initialData, onData);
}

/**
 * Save (create or update) a record in Local Database first, queue for sync, and push to Cloud
 */
export async function saveItem<T extends Record<string, any>>(
  collectionName: string,
  item: T,
  idField: string = 'id',
  userId: string | null = null
): Promise<boolean> {
  return cloudSyncService.saveItem<T>(collectionName, item, idField, userId);
}

/**
 * Delete a record in Local Database first (tombstone), queue for sync, and push deletion to Cloud
 */
export async function deleteItem(
  collectionName: string,
  docId: string,
  idField: string = 'id',
  userId: string | null = null
): Promise<boolean> {
  return cloudSyncService.deleteItem(collectionName, docId, idField, userId);
}

/**
 * Direct fetch of a collection from local database (fast & offline)
 */
export async function fetchCollection<T extends Record<string, any>>(
  collectionName: string,
  fallback: T[] = []
): Promise<T[]> {
  return localDatabaseService.getAll<T>(collectionName, fallback);
}

/**
 * Reset a collection back to initial data
 */
export async function resetCollection<T extends Record<string, any>>(
  collectionName: string,
  initialData: T[],
  idField: string = 'id'
): Promise<boolean> {
  return cloudSyncService.resetCollection<T>(collectionName, initialData, idField);
}
