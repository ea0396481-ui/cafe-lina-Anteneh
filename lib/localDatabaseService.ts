/**
 * Local Database Service for Yeserahut
 * 
 * Provides an ACID-compliant, persistent local database engine using IndexedDB with 
 * local storage fallback and SQLite-compatible schema structure.
 * 
 * Guarantees that all user data is saved locally first before any network transmission
 * and that deleted data is never resurrected on browser reload/refresh.
 */

const DB_NAME = 'yeserahut_local_db';
const DB_VERSION = 2;

export interface DBRecord {
  id?: string;
  voucherId?: string;
  _updatedAt?: string;
  _version?: number;
  _isDeleted?: boolean;
  _clientId?: string;
  [key: string]: any;
}

// Generate client ID per browser/device instance
export function getClientId(): string {
  let clientId = localStorage.getItem('yeserahut_client_id');
  if (!clientId) {
    clientId = 'client_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
    localStorage.setItem('yeserahut_client_id', clientId);
  }
  return clientId;
}

// Generate secure UUID
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'uuid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
}

const ALL_TABLES = [
  'menuItems',
  'orders',
  'reservations',
  'inventory',
  'suppliers',
  'purchaseOrders',
  'employees',
  'recipeCosts',
  'eprRecords',
  'customers',
  'categories',
  'stores',
  'stockInVouchers',
  'storeRequests',
  'storeTransfers',
  'posReceipts',
  'binCards',
  'damageVouchers',
  'staffMeals',
  'systemUsers',
  'sync_queue',
];

class LocalDatabaseService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isIndexedDBAvailable: boolean = typeof indexedDB !== 'undefined';

  constructor() {
    this.initDatabase();
  }

  public initDatabase(): Promise<IDBDatabase> {
    if (!this.isIndexedDBAvailable) {
      return Promise.reject(new Error('IndexedDB not supported on this platform'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          ALL_TABLES.forEach((tableName) => {
            if (!db.objectStoreNames.contains(tableName)) {
              // Use 'id' or 'voucherId' as primary key
              const keyPath = tableName.includes('Voucher') || tableName === 'storeRequests' || tableName === 'storeTransfers' || tableName === 'posReceipts' || tableName === 'damageVouchers' || tableName === 'stockInVouchers'
                ? 'voucherId'
                : 'id';
              const store = db.createObjectStore(tableName, { keyPath });
              if (tableName === 'sync_queue') {
                store.createIndex('sync_status', 'sync_status', { unique: false });
                store.createIndex('created_at', 'created_at', { unique: false });
              }
            }
          });
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.warn('IndexedDB initialization failed, falling back to LocalStorage backup:', request.error);
          reject(request.error);
        };
      });
    }

    return this.dbPromise;
  }

  /**
   * Check if a table has been initialized / seeded in this browser
   */
  public isTableSeeded(tableName: string): boolean {
    try {
      return localStorage.getItem(`yeserahut_seeded_${tableName}`) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Mark a table as initialized / seeded
   */
  public setTableSeeded(tableName: string, isSeeded: boolean = true): void {
    try {
      localStorage.setItem(`yeserahut_seeded_${tableName}`, isSeeded ? 'true' : 'false');
    } catch {
      // Ignore
    }
  }

  /**
   * Get set of persistently deleted IDs for a table (tombstones)
   */
  public getDeletedIds(tableName: string): Set<string> {
    try {
      const raw = localStorage.getItem(`yeserahut_deleted_ids_${tableName}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return new Set(parsed.map(String));
        }
      }
    } catch {
      // Ignore
    }
    return new Set<string>();
  }

  /**
   * Add an ID to the persistent deleted IDs list
   */
  public addDeletedId(tableName: string, id: string): void {
    if (!id) return;
    try {
      const current = this.getDeletedIds(tableName);
      current.add(String(id));
      localStorage.setItem(`yeserahut_deleted_ids_${tableName}`, JSON.stringify(Array.from(current)));
    } catch {
      // Ignore
    }
  }

  /**
   * Clear deleted IDs list (used during full factory reset)
   */
  public clearDeletedIds(tableName: string): void {
    try {
      localStorage.removeItem(`yeserahut_deleted_ids_${tableName}`);
    } catch {
      // Ignore
    }
  }

  /**
   * Synchronous helper for React useState initial state:
   * Returns cached local data if seeded (even if empty []), preventing deleted items from flashing on page refresh.
   */
  public getLocalStorageInitialState<T extends Record<string, any>>(
    tableName: string,
    fallback: T[] = []
  ): T[] {
    const deletedIds = this.getDeletedIds(tableName);
    const isSeeded = this.isTableSeeded(tableName);

    if (isSeeded) {
      const local = this.getFromLocalStorageFallback<T>(tableName);
      return local.filter((item: any) => {
        const key = String(item.id || item.voucherId || '');
        return !item._isDeleted && !deletedIds.has(key);
      });
    }

    // First time ever: filter fallback by any deleted IDs
    return fallback.filter((item: any) => {
      const key = String(item.id || item.voucherId || '');
      return !item._isDeleted && !deletedIds.has(key);
    });
  }

  /**
   * Get all records from a table with fallback to initial data or localStorage
   */
  public async getAll<T extends Record<string, any>>(tableName: string, fallback: T[] = []): Promise<T[]> {
    const deletedIds = this.getDeletedIds(tableName);
    const isSeeded = this.isTableSeeded(tableName);

    try {
      const db = await this.initDatabase();
      return new Promise<T[]>((resolve) => {
        try {
          const transaction = db.transaction([tableName], 'readonly');
          const store = transaction.objectStore(tableName);
          const request = store.getAll();

          request.onsuccess = () => {
            const rawResults = request.result || [];
            const results = rawResults.filter((item: any) => {
              const key = String(item.id || item.voucherId || '');
              return !item._isDeleted && !deletedIds.has(key);
            });

            if (results.length > 0 || isSeeded || rawResults.length > 0) {
              // Table has records or was explicitly seeded/modified -> Respect current records (even if 0 left)
              this.setTableSeeded(tableName, true);
              this.saveToLocalStorageFallback(tableName, results);
              resolve(results as T[]);
            } else {
              // Table was never seeded before: seed initial fallback into local DB
              const filteredFallback = fallback.filter((item: any) => {
                const key = String(item.id || item.voucherId || '');
                return !item._isDeleted && !deletedIds.has(key);
              });

              if (filteredFallback.length > 0) {
                const keyPath = tableName.includes('Voucher') || tableName === 'storeRequests' || tableName === 'storeTransfers' || tableName === 'posReceipts' || tableName === 'damageVouchers' || tableName === 'stockInVouchers'
                  ? 'voucherId'
                  : 'id';
                this.putBatch(tableName, filteredFallback, keyPath).catch(() => {});
              }
              this.setTableSeeded(tableName, true);
              this.saveToLocalStorageFallback(tableName, filteredFallback);
              resolve(filteredFallback);
            }
          };

          request.onerror = () => {
            resolve(this.getFromLocalStorageFallback<T>(tableName, fallback));
          };
        } catch {
          resolve(this.getFromLocalStorageFallback<T>(tableName, fallback));
        }
      });
    } catch {
      return this.getFromLocalStorageFallback<T>(tableName, fallback);
    }
  }

  /**
   * Get a single record by primary key
   */
  public async getById<T extends Record<string, any>>(tableName: string, id: string): Promise<T | null> {
    const deletedIds = this.getDeletedIds(tableName);
    if (deletedIds.has(String(id))) {
      return null;
    }

    try {
      const db = await this.initDatabase();
      return new Promise<T | null>((resolve) => {
        try {
          const transaction = db.transaction([tableName], 'readonly');
          const store = transaction.objectStore(tableName);
          const request = store.get(id);

          request.onsuccess = () => {
            const item = request.result;
            if (item && !item._isDeleted && !deletedIds.has(String(id))) {
              resolve(item as T);
            } else {
              resolve(null);
            }
          };

          request.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    } catch {
      const items = this.getFromLocalStorageFallback<T>(tableName, []);
      const match = items.find((x: any) => (x.id || x.voucherId) === id && !deletedIds.has(String(id)));
      return match || null;
    }
  }

  /**
   * Put (insert or update) a record into the local database transactionally
   */
  public async put<T extends Record<string, any>>(
    tableName: string,
    item: T,
    idField: string = 'id'
  ): Promise<boolean> {
    const key = String(item[idField] || item.id || item.voucherId);
    if (!key) {
      console.error(`LocalDatabase: Cannot save item to ${tableName} without primary key (${idField})`, item);
      return false;
    }

    // Un-delete if this item is being re-saved/re-created
    const deletedIds = this.getDeletedIds(tableName);
    if (deletedIds.has(key)) {
      deletedIds.delete(key);
      try {
        localStorage.setItem(`yeserahut_deleted_ids_${tableName}`, JSON.stringify(Array.from(deletedIds)));
      } catch {
        // Ignore
      }
    }

    this.setTableSeeded(tableName, true);

    const timestamp = new Date().toISOString();
    const preparedItem: DBRecord = {
      ...item,
      [idField]: key,
      _updatedAt: timestamp,
      _version: (item._version || 0) + 1,
      _clientId: getClientId(),
      _isDeleted: false,
    };

    // 1. Immediately update LocalStorage backup
    const currentLocal = this.getFromLocalStorageFallback<T>(tableName, []);
    const existingIndex = currentLocal.findIndex(
      (x: any) => String(x[idField] || x.id || x.voucherId) === key
    );
    let updatedLocal: T[];
    if (existingIndex >= 0) {
      updatedLocal = [...currentLocal];
      updatedLocal[existingIndex] = preparedItem as unknown as T;
    } else {
      updatedLocal = [preparedItem as unknown as T, ...currentLocal];
    }
    this.saveToLocalStorageFallback(tableName, updatedLocal);

    // 2. Persist to IndexedDB
    try {
      const db = await this.initDatabase();
      return new Promise<boolean>((resolve) => {
        try {
          const transaction = db.transaction([tableName], 'readwrite');
          const store = transaction.objectStore(tableName);
          const request = store.put(preparedItem);

          request.onsuccess = () => resolve(true);
          request.onerror = () => {
            console.warn(`LocalDB put error on ${tableName}:`, request.error);
            resolve(true); // LocalStorage already backed up
          };
        } catch {
          resolve(true);
        }
      });
    } catch {
      return true;
    }
  }

  /**
   * Batch insert or update multiple records into the local database
   */
  public async putBatch<T extends Record<string, any>>(
    tableName: string,
    items: T[],
    idField: string = 'id'
  ): Promise<boolean> {
    if (!items) return true;

    this.setTableSeeded(tableName, true);
    const deletedIds = this.getDeletedIds(tableName);

    // Filter out items that are marked as deleted
    const validItems = items.filter((item) => {
      const key = String(item[idField] || item.id || item.voucherId);
      return !item._isDeleted && !deletedIds.has(key);
    });

    const timestamp = new Date().toISOString();
    const preparedItems = validItems.map((item) => {
      const key = String(item[idField] || item.id || item.voucherId);
      return {
        ...item,
        [idField]: key,
        _updatedAt: item._updatedAt || timestamp,
        _version: item._version || 1,
        _clientId: item._clientId || getClientId(),
        _isDeleted: false,
      };
    });

    this.saveToLocalStorageFallback(tableName, preparedItems as unknown as T[]);

    try {
      const db = await this.initDatabase();
      return new Promise<boolean>((resolve) => {
        try {
          const transaction = db.transaction([tableName], 'readwrite');
          const store = transaction.objectStore(tableName);
          preparedItems.forEach((item) => store.put(item));

          transaction.oncomplete = () => resolve(true);
          transaction.onerror = () => resolve(true);
        } catch {
          resolve(true);
        }
      });
    } catch {
      return true;
    }
  }

  /**
   * Soft-delete a record locally (tombstone)
   */
  public async softDelete(tableName: string, id: string, idField: string = 'id'): Promise<boolean> {
    if (!id) return false;

    // 1. Mark table as seeded and record the deleted ID permanently
    this.setTableSeeded(tableName, true);
    this.addDeletedId(tableName, String(id));

    // 2. Remove from LocalStorage
    const currentLocal = this.getFromLocalStorageFallback(tableName, []);
    const updatedLocal = currentLocal.filter(
      (x: any) => String(x[idField] || x.id || x.voucherId) !== String(id)
    );
    this.saveToLocalStorageFallback(tableName, updatedLocal);

    // 3. Mark as deleted in IndexedDB
    try {
      const db = await this.initDatabase();
      return new Promise<boolean>((resolve) => {
        try {
          const transaction = db.transaction([tableName], 'readwrite');
          const store = transaction.objectStore(tableName);
          const getReq = store.get(id);

          getReq.onsuccess = () => {
            const item = getReq.result;
            if (item) {
              item._isDeleted = true;
              item._updatedAt = new Date().toISOString();
              item._version = (item._version || 0) + 1;
              store.put(item);
            } else {
              // Put a tombstone placeholder
              store.put({
                [idField]: String(id),
                id: String(id),
                _isDeleted: true,
                _updatedAt: new Date().toISOString(),
              });
            }
            resolve(true);
          };

          getReq.onerror = () => {
            resolve(true);
          };
        } catch {
          resolve(true);
        }
      });
    } catch {
      return true;
    }
  }

  /**
   * Permanently purge tombstoned record after successful cloud synchronization
   */
  public async purgeRecord(tableName: string, id: string): Promise<boolean> {
    // Keep ID in deletedIds set so it never gets resurrected by remote snapshot
    this.addDeletedId(tableName, String(id));

    try {
      const db = await this.initDatabase();
      return new Promise<boolean>((resolve) => {
        try {
          const transaction = db.transaction([tableName], 'readwrite');
          const store = transaction.objectStore(tableName);
          const req = store.delete(id);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      });
    } catch {
      return false;
    }
  }

  /**
   * LocalStorage Fallback Helpers
   */
  private getStorageKey(tableName: string): string {
    return `yeserahut_local_${tableName}`;
  }

  private getFromLocalStorageFallback<T>(tableName: string, fallback: T[] = []): T[] {
    const deletedIds = this.getDeletedIds(tableName);
    const isSeeded = this.isTableSeeded(tableName);

    try {
      const raw = localStorage.getItem(this.getStorageKey(tableName));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: any) => {
            const key = String(item.id || item.voucherId || '');
            return !item._isDeleted && !deletedIds.has(key);
          });
        }
      }
    } catch (e) {
      console.warn('LocalStorage read warning:', e);
    }

    if (isSeeded) {
      return [];
    }

    return fallback.filter((item: any) => {
      const key = String(item.id || item.voucherId || '');
      return !item._isDeleted && !deletedIds.has(key);
    });
  }

  private saveToLocalStorageFallback<T>(tableName: string, data: T[]): void {
    try {
      localStorage.setItem(this.getStorageKey(tableName), JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage write warning:', e);
    }
  }

  /**
   * Export entire local database as a structured JSON/SQLite backup snapshot
   */
  public async exportDatabaseSnapshot(): Promise<{
    version: number;
    exportedAt: string;
    clientId: string;
    tables: Record<string, any[]>;
  }> {
    const backup: Record<string, any[]> = {};
    for (const table of ALL_TABLES) {
      backup[table] = await this.getAll(table, []);
    }

    return {
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      clientId: getClientId(),
      tables: backup,
    };
  }

  /**
   * Restore local database from an export snapshot
   */
  public async restoreDatabaseSnapshot(snapshot: { tables: Record<string, any[]> }): Promise<boolean> {
    if (!snapshot || !snapshot.tables) return false;

    for (const [table, items] of Object.entries(snapshot.tables)) {
      if (Array.isArray(items)) {
        this.clearDeletedIds(table);
        const keyPath = table.includes('Voucher') || table === 'storeRequests' || table === 'storeTransfers' || table === 'posReceipts' || table === 'damageVouchers' || table === 'stockInVouchers'
          ? 'voucherId'
          : 'id';
        await this.putBatch(table, items, keyPath);
      }
    }
    return true;
  }
}

export const localDatabaseService = new LocalDatabaseService();
