import React, { useState, useEffect } from 'react';
import {
  cloudSyncService,
  SyncStatusInfo,
} from '../lib/cloudSyncService';
import { syncQueueService, SyncQueueItem } from '../lib/syncQueueService';
import { localDatabaseService } from '../lib/localDatabaseService';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Upload,
  Database,
  Trash2,
  X,
  Layers,
} from 'lucide-react';

interface SyncStatusBadgeProps {
  variant?: 'navbar' | 'erp';
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ variant = 'navbar' }) => {
  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo>(cloudSyncService.getStatusInfo());
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>(syncQueueService.getAllItems());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncingManually, setIsSyncingManually] = useState(false);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubStatus = cloudSyncService.subscribeStatus((info) => {
      setSyncInfo(info);
    });

    const unsubQueue = syncQueueService.subscribe((items) => {
      setQueueItems(items);
    });

    return () => {
      unsubStatus();
      unsubQueue();
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncingManually(true);
    await cloudSyncService.triggerAutoSync();
    setIsSyncingManually(false);
  };

  const handleExportBackup = async () => {
    const snapshot = await localDatabaseService.exportDatabaseSnapshot();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `yeserahut_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const success = await localDatabaseService.restoreDatabaseSnapshot(parsed);
        if (success) {
          setRestoreNotice('✅ Local database backup successfully restored!');
          setTimeout(() => {
            setRestoreNotice(null);
            window.location.reload();
          }, 1500);
        } else {
          setRestoreNotice('❌ Invalid backup file format.');
        }
      } catch (err: any) {
        setRestoreNotice('❌ Error restoring database: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const formatTimeAgo = (isoString: string | null) => {
    if (!isoString) return 'Never';
    const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Render Status Configurations
  const getBadgeConfig = () => {
    switch (syncInfo.status) {
      case 'SYNCING':
        return {
          icon: <RefreshCw size={13} className="animate-spin text-[#60A5FA]" />,
          text: 'Syncing...',
          colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          dotClass: 'bg-blue-500 animate-pulse',
        };
      case 'OFFLINE':
        return {
          icon: <CloudOff size={13} className="text-gray-400" />,
          text: syncInfo.pendingCount > 0 ? `Offline (${syncInfo.pendingCount} Pending)` : 'Offline Mode',
          colorClass: 'bg-gray-800 text-gray-300 border-gray-700',
          dotClass: 'bg-gray-400',
        };
      case 'SYNC_ERROR':
        return {
          icon: <AlertCircle size={13} className="text-red-400" />,
          text: syncInfo.pendingCount > 0 ? `${syncInfo.pendingCount} Pending` : 'Sync Error',
          colorClass: 'bg-red-500/10 text-red-400 border-red-500/30',
          dotClass: 'bg-red-500',
        };
      case 'ONLINE':
        return {
          icon: <Cloud size={13} className="text-amber-400" />,
          text: syncInfo.pendingCount > 0 ? `${syncInfo.pendingCount} Pending` : 'Online',
          colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dotClass: 'bg-amber-400',
        };
      case 'SYNCED':
      default:
        return {
          icon: <CheckCircle2 size={13} className="text-emerald-400" />,
          text: 'Synced',
          colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dotClass: 'bg-emerald-400',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer hover:opacity-90 active:scale-95 ${config.colorClass}`}
        title={`Sync Status: ${syncInfo.status} (Click to open Sync Dashboard)`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
        {config.icon}
        <span className="hidden sm:inline">{config.text}</span>
      </button>

      {/* Sync Diagnostics & Offline Database Manager Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#171A21] border border-[#262A34] text-[#EAEAEA] w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#262A34]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Offline Database & Cloud Synchronization</h3>
                  <p className="text-xs text-[#9CA3AF]">
                    Local-First SQLite & Firestore Multi-Device Sync Engine
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#13151B] p-3.5 rounded-2xl border border-[#262A34]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                  Connectivity
                </span>
                <div className="flex items-center gap-2 mt-1 font-semibold text-sm">
                  <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
                  <span>{syncInfo.status}</span>
                </div>
              </div>

              <div className="bg-[#13151B] p-3.5 rounded-2xl border border-[#262A34]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                  Sync Queue
                </span>
                <div className="flex items-center gap-2 mt-1 font-semibold text-sm text-[#D4AF37]">
                  <Layers size={15} />
                  <span>{syncInfo.pendingCount} Pending</span>
                </div>
              </div>

              <div className="bg-[#13151B] p-3.5 rounded-2xl border border-[#262A34]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                  Last Cloud Sync
                </span>
                <div className="flex items-center gap-2 mt-1 font-semibold text-sm text-[#9CA3AF]">
                  <Clock size={15} />
                  <span>{formatTimeAgo(syncInfo.lastSyncTime)}</span>
                </div>
              </div>
            </div>

            {restoreNotice && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-300">
                {restoreNotice}
              </div>
            )}

            {/* Queue Item Inspector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">
                  Active Queue Operations ({queueItems.length})
                </span>
                {queueItems.some((q) => q.sync_status === 'SYNCED') && (
                  <button
                    onClick={() => syncQueueService.clearSyncedItems()}
                    className="text-[11px] text-gray-400 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Clear Synced History</span>
                  </button>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {queueItems.length === 0 ? (
                  <div className="text-center py-6 text-[#9CA3AF] bg-[#13151B] rounded-2xl border border-[#262A34]">
                    All local changes are fully synchronized to the cloud.
                  </div>
                ) : (
                  queueItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#13151B] border border-[#262A34]"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                            item.operation === 'DELETE'
                              ? 'bg-red-500/20 text-red-400'
                              : item.operation === 'CREATE'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {item.operation}
                        </span>
                        <span className="font-semibold text-white">{item.entity}</span>
                        <span className="text-gray-500 font-mono text-[10px]">
                          ({item.entity_id.substring(0, 12)}...)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.sync_status === 'SYNCED'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : item.sync_status === 'SYNCING'
                              ? 'bg-blue-500/10 text-blue-400 animate-pulse'
                              : item.sync_status === 'FAILED'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {item.sync_status}
                        </span>
                        {item.retry_count > 0 && (
                          <span className="text-gray-500 text-[10px]">({item.retry_count} retries)</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#262A34]">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportBackup}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 border border-white/10 transition-colors"
                >
                  <Download size={14} />
                  <span>Backup DB (yeserahut.db)</span>
                </button>

                <label className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 border border-white/10 cursor-pointer transition-colors">
                  <Upload size={14} />
                  <span>Restore DB</span>
                  <input
                    type="file"
                    accept=".json,.db"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualSync}
                  disabled={isSyncingManually || syncInfo.status === 'OFFLINE'}
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F1115] font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  <RefreshCw size={14} className={isSyncingManually ? 'animate-spin' : ''} />
                  <span>{isSyncingManually ? 'Syncing...' : 'Sync Cloud Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
