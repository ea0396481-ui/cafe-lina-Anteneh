import React, { useState } from 'react';
import { UserRole } from '../../types';
import { SyncStatusBadge } from '../SyncStatusBadge';
import {
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  BookOpen,
  PackageCheck,
  Truck,
  Calculator,
  Users,
  Recycle,
  BarChart3,
  Settings,
  Shield,
  Coffee,
  LogOut,
  Menu as MenuIcon,
  X,
  Layers,
  Store as StoreIcon,
  Receipt,
  UserCheck,
  ClipboardList,
  ArrowRightLeft,
  Calendar,
  CreditCard,
  ShieldAlert,
  UtensilsCrossed,
  BarChart2,
  QrCode,
} from 'lucide-react';
import { BrandLogo } from '../BrandLogo';

interface ERPLayoutProps {
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
  onExitERP: () => void;
  children: React.ReactNode;
}

export const ERPLayout: React.FC<ERPLayoutProps> = ({
  currentUserRole,
  setCurrentUserRole,
  activeModule,
  setActiveModule,
  onExitERP,
  children,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const erpModules = [
    { id: 'pos', label: 'POS Terminal', icon: ShoppingBag, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'order_vouchers', label: 'Sales Registry', icon: LayoutDashboard, badge: '28', badgeColor: 'bg-[#1E293B] text-slate-300', roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'stock_in', label: 'Order Vouchers', icon: Receipt, roles: ['Admin', 'Manager'] },
    { id: 'kds', label: 'Kitchen Orders (KDS)', icon: Coffee, badge: '4', badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30', roles: ['Admin', 'Manager', 'Kitchen'] },
    { id: 'orders', label: 'Live Orders Queue', icon: ShoppingBag, badge: '2', badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'customers', label: 'Customers', icon: UserCheck, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart2, roles: ['Admin', 'Manager'] },
    { id: 'menu_mgr', label: 'Products', icon: BookOpen, roles: ['Admin', 'Manager'] },
    { id: 'inventory', label: 'Inventory', icon: PackageCheck, roles: ['Admin', 'Manager'] },
    { id: 'bincard', label: 'Bin Card Ledger', icon: CreditCard, roles: ['Admin', 'Manager'] },
    { id: 'store_transfers', label: 'Store Transfers', icon: ArrowRightLeft, roles: ['Admin', 'Manager'] },
    { id: 'damage', label: 'Damage & Spoilage', icon: ShieldAlert, roles: ['Admin', 'Manager', 'Kitchen'] },
    { id: 'product_costing', label: 'Product Costing', icon: Calculator, roles: ['Admin', 'Manager'] },
    { id: 'qr_generator', label: 'QR Generator', icon: QrCode, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'stores', label: 'Stores & Warehouses', icon: StoreIcon, roles: ['Admin', 'Manager'] },
    { id: 'suppliers', label: 'Suppliers & Vendors', icon: Truck, roles: ['Admin', 'Manager'] },
    { id: 'hr', label: 'Users & Roles', icon: Users, roles: ['Admin', 'Manager'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin'] },
  ];

  const allowedModules = erpModules.filter((m) => m.roles.includes(currentUserRole));

  const handleModuleSelect = (id: string) => {
    setActiveModule(id);
    setMobileDrawerOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0B0F17] text-slate-300 font-sans select-none border-r border-slate-800/60">
      {/* Header & Brand Area */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5D061] via-[#E5A93C] to-[#B37D14] flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0 border border-amber-300/40">
            <span className="font-serif font-black text-black text-base tracking-tighter">CL</span>
          </div>
          <div>
            <h1 className="font-serif font-bold text-white text-base tracking-wider leading-none">
              CAFE LINA
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-[#E5A93C] font-semibold mt-1">
              Coffee · Bakery · Breakfast
            </p>
          </div>
        </div>

        {/* Cashier Profile Card */}
        <div className="mt-4 bg-[#141C2B] p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#E5A93C]/20 border border-[#E5A93C]/40 flex items-center justify-center text-[#E5A93C] font-bold text-xs">
                AC
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#141C2B] absolute bottom-0 right-0" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                <span>Abebe Cashier</span>
              </div>
              <span className="text-[10px] text-slate-400 capitalize">{currentUserRole}</span>
            </div>
          </div>

          <select
            value={currentUserRole}
            onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
            className="bg-transparent text-[11px] font-bold text-[#E5A93C] focus:outline-none cursor-pointer pr-1"
            title="Switch User Role"
          >
            <option value="Cashier" className="bg-[#171A21] text-white">Cashier</option>
            <option value="Admin" className="bg-[#171A21] text-white">Admin</option>
            <option value="Manager" className="bg-[#171A21] text-white">Manager</option>
            <option value="Kitchen" className="bg-[#171A21] text-white">Kitchen</option>
          </select>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="p-3.5 space-y-1 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {allowedModules.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;

          return (
            <button
              key={mod.id}
              onClick={() => handleModuleSelect(mod.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#E5A93C] text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:bg-[#141C2B] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={17}
                  className={isActive ? 'text-black' : 'text-slate-400'}
                />
                <span className="truncate">{mod.label}</span>
              </div>
              {mod.badge && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-black text-[#E5A93C]' : mod.badgeColor || 'bg-[#1E293B] text-slate-300'
                  }`}
                >
                  {mod.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Sync Status & Copyright */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0B0F17] space-y-3">
        <div className="flex items-center justify-between bg-[#141C2B] px-3 py-2 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold">Sync Status</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            ✓ Synced
          </span>
        </div>

        <button
          onClick={onExitERP}
          className="w-full bg-[#141C2B] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut size={13} className="text-[#E5A93C]" />
          <span>Exit to Main Site</span>
        </button>

        <p className="text-[10px] text-slate-500 text-center">
          © 2026 CAFE LINA. All rights reserved.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col lg:flex-row text-[#EAEAEA] font-sans antialiased overflow-x-hidden">
      {/* Mobile / Tablet Sticky Header with Hamburger */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#171A21] border-b border-[#262A34] px-4 py-3 flex items-center justify-between shadow-lg no-print print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 text-[#D4AF37] bg-[#1C2029] hover:bg-white/10 rounded-xl border border-[#D4AF37]/30 transition-colors"
            aria-label="Open Navigation Menu"
          >
            <MenuIcon size={22} />
          </button>
          <BrandLogo size="xs" variant="light" />
        </div>

        <div className="flex items-center gap-2">
          <SyncStatusBadge variant="erp" />
          <button
            onClick={onExitERP}
            className="px-3 py-1.5 bg-[#1C2029] text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#D4AF37] hover:text-[#0F1115] transition-all"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-xs z-50 transition-opacity duration-300"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer Off-Canvas */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#171A21] z-50 shadow-2xl transition-transform duration-300 transform no-print print:hidden ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-2 text-[#9CA3AF] hover:text-white rounded-xl bg-[#13151B] border border-white/10"
            aria-label="Close Navigation Menu"
          >
            <X size={20} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-72 bg-[#171A21] text-[#EAEAEA] flex-col justify-between shrink-0 shadow-2xl border-r border-[#262A34] sticky top-0 h-screen z-20 no-print print:hidden">
        <SidebarContent />
      </aside>

      {/* Main Content Area - Full Screen Width */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-57px)] lg:max-h-screen bg-[#111827]">
        <div className="w-full max-w-none space-y-6 sm:space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
};


