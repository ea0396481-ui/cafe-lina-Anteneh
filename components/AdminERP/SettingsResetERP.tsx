import React, { useState } from 'react';
import { SystemUser } from '../../types';
import { localDatabaseService } from '../../lib/localDatabaseService';
import { cloudSyncService } from '../../lib/cloudSyncService';
import { syncQueueService } from '../../lib/syncQueueService';
import {
  Settings,
  RotateCcw,
  Users,
  UserPlus,
  Shield,
  Palette,
  Type,
  LogOut,
  Trash2,
  Edit,
  CheckSquare,
  Square,
  X,
  AlertTriangle,
  Upload,
  Database,
  Download,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';

interface SettingsResetERPProps {
  users: SystemUser[];
  onAddUser: (user: SystemUser) => void;
  onUpdateUser: (user: SystemUser) => void;
  onDeleteUser: (userId: string) => void;
  onSystemReset: () => void;
  onSignOut: () => void;
}

const ALL_MODULES = [
  { id: 'dashboard', name: 'Executive Dashboard' },
  { id: 'pos', name: 'POS Cashier Counter' },
  { id: 'order_vouchers', name: 'Order Sales Vouchers' },
  { id: 'kds', name: 'Kitchen KDS Display' },
  { id: 'orders', name: 'Order Management' },
  { id: 'inventory', name: 'Inventory & Raw Materials' },
  { id: 'bincard', name: 'Store Bin Card Ledger' },
  { id: 'store_balance', name: 'Stock Balance & Expiry' },
  { id: 'store_requests', name: 'Store Requisition Vouchers' },
  { id: 'store_transfers', name: 'Store Transfer Vouchers' },
  { id: 'damage', name: 'Damage & Loss Registry' },
  { id: 'staff_food', name: 'Staff Meal Allowances' },
  { id: 'product_costing', name: 'Product Recipe Costing' },
  { id: 'stock_in', name: 'Stock In Vouchers' },
  { id: 'categories', name: 'Categories Manager' },
  { id: 'stores', name: 'Store Locations' },
  { id: 'reports', name: 'Financial & Sales Reports' },
  { id: 'settings', name: 'Settings & Admin' },
];

export const SettingsResetERP: React.FC<SettingsResetERPProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSystemReset,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'database' | 'reset'>('settings');
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbNotice, setDbNotice] = useState<string | null>(null);

  // UI Customization Settings State
  const [accentColor, setAccentColor] = useState('#D4AF37');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [profilePicture, setProfilePicture] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  );

  // User Management Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // User Form
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Manager' | 'Cashier' | 'Kitchen'>('Cashier');
  const [password, setPassword] = useState('');
  const [allowedModules, setAllowedModules] = useState<string[]>([
    'pos',
    'order_vouchers',
    'orders',
  ]);

  // System Reset Confirmation Modal
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleToggleModule = (modId: string) => {
    if (allowedModules.includes(modId)) {
      setAllowedModules((prev) => prev.filter((m) => m !== modId));
    } else {
      setAllowedModules((prev) => [...prev, modId]);
    }
  };

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUsername('');
    setFullName('');
    setRole('Cashier');
    setPassword('');
    setAllowedModules(['pos', 'order_vouchers', 'orders']);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (usr: SystemUser) => {
    setEditingUser(usr);
    setUsername(usr.username);
    setFullName(usr.fullName);
    setRole(usr.role);
    setPassword(usr.passwordHash);
    setAllowedModules(usr.allowedModules);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    if (editingUser) {
      const updated: SystemUser = {
        ...editingUser,
        username,
        fullName,
        role,
        passwordHash: password,
        allowedModules,
      };
      onUpdateUser(updated);
    } else {
      const newUser: SystemUser = {
        id: `USR-${Math.floor(100 + Math.random() * 900)}`,
        username,
        fullName,
        role,
        passwordHash: password,
        allowedModules,
        avatarUrl: profilePicture,
        isActive: true,
      };
      onAddUser(newUser);
    }
    setIsUserModalOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfilePicture(url);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
            System Preferences & Access Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1 flex items-center gap-2">
            <Settings className="text-[#D4AF37]" size={28} />
            Professional Settings & Admin User Management
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Customize UI themes, manage staff permissions, or reset system databases.
          </p>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-2 bg-[#1E293B] p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-[#D4AF37] text-[#0F172A] shadow-md'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Palette size={15} /> UI Settings
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-[#D4AF37] text-[#0F172A] shadow-md'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Users size={15} /> Admin User Mgmt
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'database'
                ? 'bg-[#D4AF37] text-[#0F172A] shadow-md'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Database size={15} /> Local DB & Sync
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'reset'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-[#94A3B8] hover:text-red-400'
            }`}
          >
            <RotateCcw size={15} /> System Reset
          </button>
        </div>
      </div>

      {/* TAB 1: Professional UI Settings */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Picture & Theme Customization */}
          <div className="bg-[#243244] p-6 rounded-[24px] border border-white/10 space-y-6 shadow-xl">
            <h2 className="text-lg font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
              <Palette className="text-[#D4AF37]" size={20} /> Professional UI Customization
            </h2>

            {/* Profile Picture Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#CBD5E1]">Profile Picture</label>
              <div className="flex items-center gap-4">
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37]"
                />
                <label className="px-4 py-2.5 bg-[#1E293B] hover:bg-[#2A3A4E] text-[#F8FAFC] border border-white/10 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all">
                  <Upload size={14} className="text-[#D4AF37]" />
                  <span>Upload New Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            {/* Accent Color Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#CBD5E1]">App Accent Color</label>
              <div className="flex items-center gap-3">
                {['#D4AF37', '#3B82F6', '#22C55E', '#EC4899', '#A855F7'].map((col) => (
                  <button
                    key={col}
                    onClick={() => setAccentColor(col)}
                    className={`w-9 h-9 rounded-full border-2 transition-transform ${
                      accentColor === col ? 'scale-110 border-white shadow-lg' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>

            {/* Typography Font Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#CBD5E1] flex items-center gap-1">
                <Type size={14} className="text-[#D4AF37]" /> Interface Font Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full h-11 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="sans-serif">Plus Jakarta Sans / Standard Sans</option>
                <option value="serif">Playfair Display / Elegant Serif</option>
                <option value="monospace">JetBrains Mono / Code Mono</option>
              </select>
            </div>
          </div>

          {/* Account Security & Sign Out */}
          <div className="bg-[#243244] p-6 rounded-[24px] border border-white/10 space-y-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-lg font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
                <Shield className="text-[#D4AF37]" size={20} /> Active Session & Security
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Currently logged in as <strong className="text-[#F8FAFC]">Lina Executive Admin (admin)</strong>. Your session is protected by encrypted token authentication.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 space-y-3">
              <button
                onClick={onSignOut}
                className="w-full py-3.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md min-h-[44px]"
              >
                <LogOut size={16} />
                <span>Sign Out of ERP System</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Admin User Management */}
      {activeTab === 'users' && (
        <div className="bg-[#243244] p-6 rounded-[24px] border border-white/10 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
                <Users className="text-[#D4AF37]" size={20} /> ADMIN User Registration & Module Permissions
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Create system accounts, assign passwords, and toggle module view/edit rights via tick checkboxes.
              </p>
            </div>

            <button
              onClick={handleOpenCreateUser}
              className="px-5 py-3 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition-all"
            >
              <UserPlus size={16} />
              <span>Create New System User</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#CBD5E1]">
              <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-[10px] font-extrabold tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Allowed Modules</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {users.map((usr) => (
                  <tr key={usr.id} className="hover:bg-[#1E293B]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={usr.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                          alt={usr.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-white/10"
                        />
                        <span className="font-bold text-[#F8FAFC]">{usr.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#D4AF37]">{usr.username}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1E293B] border border-white/10 text-[#F8FAFC]">
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#22C55E]">
                        {usr.allowedModules.length} / {ALL_MODULES.length} Modules Allowed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditUser(usr)}
                          className="p-2 bg-[#1E293B] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white rounded-lg transition-all"
                          title="Edit User Permissions"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteUser(usr.id)}
                          className="p-2 bg-[#1E293B] text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                          title="Delete User"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Local Database & Cloud Synchronization Management */}
      {activeTab === 'database' && (
        <div className="bg-[#243244] p-6 rounded-[24px] border border-white/10 space-y-6 shadow-xl text-[#F8FAFC]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
                <Database className="text-[#D4AF37]" size={20} /> True Offline-First Database & Cloud Synchronization
              </h2>
              <p className="text-xs text-[#94A3B8]">
                All data is permanently written to local storage first, queued transactionally, and synced to Cloud Firestore automatically.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setIsSyncing(true);
                  await cloudSyncService.triggerAutoSync();
                  setIsSyncing(false);
                }}
                disabled={isSyncing}
                className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing Cloud...' : 'Trigger Cloud Sync'}</span>
              </button>
            </div>
          </div>

          {dbNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-300">
              {dbNotice}
            </div>
          )}

          {/* Quick Database Backup & Restore Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center gap-2.5 text-sm font-bold text-[#D4AF37]">
                <Download size={18} />
                <span>Export Local Database Backup (yeserahut.db)</span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Download a complete, offline snapshot containing all raw ingredients, menu costing, POS vouchers, store transfers, and bin cards.
              </p>
              <button
                onClick={async () => {
                  const snapshot = await localDatabaseService.exportDatabaseSnapshot();
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
                  const a = document.createElement('a');
                  a.href = dataStr;
                  a.download = `yeserahut_db_backup_${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  setDbNotice('✅ Database backup exported successfully!');
                  setTimeout(() => setDbNotice(null), 3000);
                }}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-[#F8FAFC] border border-white/10 hover:border-[#D4AF37]/50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download size={15} />
                <span>Download yeserahut.db Backup</span>
              </button>
            </div>

            <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center gap-2.5 text-sm font-bold text-blue-400">
                <Upload size={18} />
                <span>Restore / Import Local Database</span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Restore an exported local database archive or backup file. This will seamlessly merge existing records safely without data loss.
              </p>
              <label className="w-full py-3 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer">
                <Upload size={15} />
                <span>Upload & Restore Database File</span>
                <input
                  type="file"
                  accept=".json,.db"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      try {
                        const parsed = JSON.parse(ev.target?.result as string);
                        const ok = await localDatabaseService.restoreDatabaseSnapshot(parsed);
                        if (ok) {
                          setDbNotice('✅ Database restored successfully! Reloading UI...');
                          setTimeout(() => window.location.reload(), 1500);
                        } else {
                          setDbNotice('❌ Failed to restore: Invalid backup structure.');
                        }
                      } catch (err: any) {
                        setDbNotice('❌ Restore error: ' + err.message);
                      }
                    };
                    reader.readAsText(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Sync Queue Table Overview */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#CBD5E1] flex items-center gap-2">
                <Layers size={14} className="text-[#D4AF37]" /> Persistent Transactional Sync Queue
              </span>
              <button
                onClick={() => syncQueueService.clearSyncedItems()}
                className="text-[11px] text-gray-400 hover:text-red-400 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Clear Synced Log</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-xl max-h-56">
              <table className="w-full text-left text-xs text-[#CBD5E1]">
                <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-[10px] font-extrabold tracking-wider border-b border-white/10 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Operation</th>
                    <th className="py-2.5 px-3">Entity Table</th>
                    <th className="py-2.5 px-3">Record ID</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Retries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {syncQueueService.getAllItems().length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-500 font-sans">
                        Sync queue is clean. All local modifications are synchronized.
                      </td>
                    </tr>
                  ) : (
                    syncQueueService.getAllItems().map((item) => (
                      <tr key={item.id} className="hover:bg-[#1E293B]/40">
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.operation === 'DELETE'
                                ? 'bg-red-500/20 text-red-400'
                                : item.operation === 'CREATE'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {item.operation}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-white">{item.entity}</td>
                        <td className="py-2 px-3 text-gray-400">{item.entity_id.substring(0, 16)}...</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.sync_status === 'SYNCED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : item.sync_status === 'SYNCING'
                                ? 'bg-blue-500/10 text-blue-400'
                                : item.sync_status === 'FAILED'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {item.sync_status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-400">{item.retry_count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Full System Reset */}
      {activeTab === 'reset' && (
        <div className="bg-[#243244] p-8 rounded-[24px] border border-red-500/30 space-y-6 shadow-2xl max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
            <RotateCcw size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-red-400">
              System Factory Reset (Reset)
            </h2>
            <p className="text-xs text-[#94A3B8] max-[#400px] mx-auto">
              Warning! Performing a system reset will wipe all modified inventory stocks, POS receipt vouchers, store transfers, and damage logs, restoring the database to factory initial state.
            </p>
          </div>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-extrabold shadow-xl transition-all flex items-center justify-center gap-2 mx-auto min-h-[48px]"
          >
            <RotateCcw size={18} />
            <span>CONFIRM FULL SYSTEM RESET</span>
          </button>
        </div>
      )}

      {/* User Create/Edit Modal with Module Permissions Checkboxes */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <form
            onSubmit={handleSaveUser}
            className="bg-[#1E293B] border border-white/10 rounded-[24px] max-w-xl w-full p-6 space-y-4 shadow-2xl text-[#F8FAFC]"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-lg text-[#D4AF37]">
                {editingUser ? 'Edit Admin System User & Permissions' : 'Create New Admin System User'}
              </h3>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Abebe Balcha"
                  className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Kitchen">Kitchen</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. abebe1"
                  className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Allowed Modules Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="block text-xs font-extrabold text-[#D4AF37] uppercase">
                Assign Allowed System Modules (Tik Eyareku Mefked Ena Mekelkel)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-[#243244] rounded-xl border border-white/10">
                {ALL_MODULES.map((mod) => {
                  const isChecked = allowedModules.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => handleToggleModule(mod.id)}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                        isChecked
                          ? 'bg-[#1E293B] border-[#D4AF37] text-[#F8FAFC]'
                          : 'bg-[#1E293B]/40 border-white/5 text-[#94A3B8] opacity-60'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare size={16} className="text-[#D4AF37] shrink-0" />
                      ) : (
                        <Square size={16} className="shrink-0" />
                      )}
                      <span className="text-[11px] font-bold truncate">{mod.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="flex-1 h-11 bg-[#243244] text-[#CBD5E1] rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-11 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold shadow-md"
              >
                Save User Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* System Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1E293B] border border-red-500/50 rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-2xl text-[#F8FAFC] text-center">
            <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <h3 className="font-serif font-bold text-lg text-red-400">Are you absolutely sure?</h3>
            <p className="text-xs text-[#94A3B8]">
              This operation will permanently reset all ERP vouchers, inventory adjustments, and order logs back to clean default factory settings.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-3 bg-[#243244] text-[#CBD5E1] rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onSystemReset();
                  setIsResetConfirmOpen(false);
                }}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-extrabold"
              >
                Yes, Reset System
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
