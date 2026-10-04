/**
 * Connectivity Service for Yeserahut
 * 
 * Provides robust multi-signal network and cloud reachability detection.
 * Does not rely solely on navigator.onLine; performs periodic lightweight backend & cloud pings.
 */

export type AppConnectivityState = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNCED' | 'SYNC_ERROR';

class ConnectivityService {
  private currentState: AppConnectivityState = 'ONLINE';
  private isNetworkOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isCloudReachable: boolean = true;
  private listeners: Set<(state: AppConnectivityState) => void> = new Set();
  private pingIntervalId: any = null;
  private lastSuccessfulPing: string | null = null;
  private lastError: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));

      // Initial check
      this.checkConnectivity();

      // Periodic heartbeat ping every 15 seconds
      this.pingIntervalId = setInterval(() => {
        this.checkConnectivity();
      }, 15000);
    }
  }

  private handleNetworkChange(isOnline: boolean) {
    this.isNetworkOnline = isOnline;
    if (!isOnline) {
      this.isCloudReachable = false;
      this.setState('OFFLINE');
    } else {
      this.checkConnectivity();
    }
  }

  /**
   * Performs an actual HTTP/Cloud health ping to verify true internet reachability
   */
  public async checkConnectivity(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.isNetworkOnline = false;
      this.isCloudReachable = false;
      this.setState('OFFLINE');
      return false;
    }

    try {
      // 1. Try local server health API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        this.isNetworkOnline = true;
        this.isCloudReachable = true;
        this.lastSuccessfulPing = new Date().toISOString();
        if (this.currentState === 'OFFLINE' || this.currentState === 'SYNC_ERROR') {
          this.setState('ONLINE');
        }
        return true;
      }

      // 2. Secondary fallback ping to public CDN or cloud endpoint
      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(() => fallbackController.abort(), 4000);
      const fallbackRes = await fetch('https://www.gstatic.com/generate_204', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: fallbackController.signal,
        cache: 'no-store',
      }).catch(() => null);

      clearTimeout(fallbackTimeout);

      if (fallbackRes) {
        this.isNetworkOnline = true;
        this.isCloudReachable = true;
        this.lastSuccessfulPing = new Date().toISOString();
        if (this.currentState === 'OFFLINE') {
          this.setState('ONLINE');
        }
        return true;
      }

      // If both pings fail, we are truly offline
      this.isCloudReachable = false;
      this.setState('OFFLINE');
      return false;
    } catch (e: any) {
      this.isCloudReachable = false;
      this.lastError = e?.message || 'Network unreachable';
      this.setState('OFFLINE');
      return false;
    }
  }

  /**
   * Set the overall sync/connectivity state and broadcast to all UI listeners
   */
  public setState(newState: AppConnectivityState, error?: string | null) {
    if (error !== undefined) {
      this.lastError = error;
    }
    this.currentState = newState;
    this.notifyListeners();
  }

  public getState(): AppConnectivityState {
    return this.currentState;
  }

  public isOnline(): boolean {
    return this.isNetworkOnline && this.isCloudReachable;
  }

  public getLastSuccessfulPing(): string | null {
    return this.lastSuccessfulPing;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public subscribe(cb: (state: AppConnectivityState) => void): () => void {
    this.listeners.add(cb);
    cb(this.currentState);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.currentState));
  }

  public destroy() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
    }
  }
}

export const connectivityService = new ConnectivityService();
