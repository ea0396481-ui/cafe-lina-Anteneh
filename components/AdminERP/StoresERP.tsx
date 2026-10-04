import React, { useState, useMemo } from 'react';
import {
  StoreRecord,
  InventoryItem,
  StockInVoucher,
  StoreTransferVoucher,
  StoreRequestVoucher,
  DamageVoucher,
  BinCardEntry,
} from '../../types';
import {
  Store,
  Plus,
  Trash2,
  Phone,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Package,
  Layers,
  Search,
  Eye,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';

interface StoresERPProps {
  stores: StoreRecord[];
  inventory?: InventoryItem[];
  stockInVouchers?: StockInVoucher[];
  storeTransfers?: StoreTransferVoucher[];
  storeRequests?: StoreRequestVoucher[];
  damageVouchers?: DamageVoucher[];
  binCards?: BinCardEntry[];
  onAddStore: (store: StoreRecord) => void;
  onDeleteStore: (id: string) => void;
  onNavigateModule?: (module: string) => void;
}

export const StoresERP: React.FC<StoresERPProps> = ({
  stores,
  inventory = [],
  stockInVouchers = [],
  storeTransfers = [],
  storeRequests = [],
  damageVouchers = [],
  binCards = [],
  onAddStore,
  onDeleteStore,
  onNavigateModule,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectingStore, setInspectingStore] = useState<StoreRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState(`STR-${Math.floor(100 + Math.random() * 900)}`);
  const [location, setLocation] = useState('Bole Atlas, Addis Ababa');
  const [managerName, setManagerName] = useState('Dawit Solomon');
  const [phone, setPhone] = useState('+251 911 222 333');
  const [capacity, setCapacity] = useState('500 Sq. Meters / 20 Tons');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [notes, setNotes] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newStore: StoreRecord = {
      id: `STR-REC-${Date.now()}`,
      name: name.trim(),
      code: code.trim(),
      location: location.trim(),
      managerName: managerName.trim(),
      phone: phone.trim(),
      capacity: capacity.trim(),
      status,
      notes: notes.trim(),
    };

    onAddStore(newStore);
    setIsModalOpen(false);
    setName('');
    setCode(`STR-${Math.floor(100 + Math.random() * 900)}`);
  };

  // Calculate detailed In/Out, Transfers, and Net Balance for each store
  const storeAnalytics = useMemo(() => {
    return stores.map((store) => {
      const storeNameLower = store.name.toLowerCase().trim();

      // 1. Inward direct supplier GRN / Stock In receipts
      const directStockIns = stockInVouchers.filter((v) => {
        const recStore = (v.receivingStore || 'Bole Main Central Store').toLowerCase().trim();
        return recStore === storeNameLower || recStore.includes(storeNameLower) || storeNameLower.includes(recStore);
      });

      let totalStockInQty = 0;
      let totalStockInVal = 0;
      const stockInItemsMap: { [sku: string]: { name: string; qty: number; unit: string; totalCost: number } } = {};

      directStockIns.forEach((voucher) => {
        voucher.items.forEach((item) => {
          totalStockInQty += item.qty;
          totalStockInVal += item.totalCost || item.qty * item.unitCost;
          if (!stockInItemsMap[item.sku || item.ingredientName]) {
            stockInItemsMap[item.sku || item.ingredientName] = {
              name: item.ingredientName,
              qty: item.qty,
              unit: item.unit,
              totalCost: item.totalCost || item.qty * item.unitCost,
            };
          } else {
            stockInItemsMap[item.sku || item.ingredientName].qty += item.qty;
            stockInItemsMap[item.sku || item.ingredientName].totalCost += item.totalCost || item.qty * item.unitCost;
          }
        });
      });

      // 2. Outward transfers FROM this store
      const transfersOut = storeTransfers.filter((t) => {
        const fromStr = (t.fromStore || '').toLowerCase().trim();
        return fromStr === storeNameLower || fromStr.includes(storeNameLower) || storeNameLower.includes(fromStr);
      });

      let totalTransferOutQty = 0;
      transfersOut.forEach((t) => {
        t.items.forEach((it) => {
          totalTransferOutQty += it.qtyTransferred;
        });
      });

      // 3. Inward transfers TO this store
      const transfersIn = storeTransfers.filter((t) => {
        const toStr = (t.toStore || '').toLowerCase().trim();
        return toStr === storeNameLower || toStr.includes(storeNameLower) || storeNameLower.includes(toStr);
      });

      let totalTransferInQty = 0;
      transfersIn.forEach((t) => {
        t.items.forEach((it) => {
          totalTransferInQty += it.qtyTransferred;
        });
      });

      // 4. Damage / Spoilage Outward deductions
      const damages = damageVouchers.filter((d) => {
        const stName = (d.storeName || 'Bole Main Central Store').toLowerCase().trim();
        return stName === storeNameLower || stName.includes(storeNameLower) || storeNameLower.includes(stName);
      });

      let totalDamageQty = 0;
      let totalDamageCost = 0;
      damages.forEach((d) => {
        d.items.forEach((it) => {
          totalDamageQty += it.quantity;
          totalDamageCost += it.totalLoss;
        });
      });

      // 5. Total Inward Movements vs Total Outward Movements
      const totalInwardMovement = totalStockInQty + totalTransferInQty;
      const totalOutwardMovement = totalTransferOutQty + totalDamageQty;

      // 6. Current active inventory items stored under this warehouse
      const storeInventory = inventory.filter((inv) => {
        const invStore = (inv.storeName || 'Bole Main Central Store').toLowerCase().trim();
        return invStore === storeNameLower || invStore.includes(storeNameLower) || storeNameLower.includes(invStore);
      });

      // If store is Bole Main Central and items have no storeName, also consider them
      const isDefaultCentral = storeNameLower.includes('central') || storeNameLower.includes('bole');
      const effectiveInventory =
        storeInventory.length > 0
          ? storeInventory
          : isDefaultCentral
          ? inventory.filter((i) => !i.storeName || i.storeName.toLowerCase().includes('central') || i.storeName.toLowerCase().includes('bole'))
          : [];

      const currentStockQty = effectiveInventory.reduce((sum, i) => sum + (Number(i.stockQty) || 0), 0);
      const currentStockValuation = effectiveInventory.reduce(
        (sum, i) => sum + (Number(i.stockQty) || 0) * (Number(i.costPerUnit) || 0),
        0
      );

      return {
        store,
        totalStockInQty,
        totalStockInVal,
        directStockInsCount: directStockIns.length,
        transfersOutCount: transfersOut.length,
        totalTransferOutQty,
        transfersInCount: transfersIn.length,
        totalTransferInQty,
        damageCount: damages.length,
        totalDamageQty,
        totalDamageCost,
        totalInwardMovement,
        totalOutwardMovement,
        netMovement: totalInwardMovement - totalOutwardMovement,
        currentStockQty,
        currentStockValuation,
        inventoryItemCount: effectiveInventory.length,
        effectiveInventory,
        recentStockIns: directStockIns.slice(0, 4),
        recentTransfersOut: transfersOut.slice(0, 4),
        recentTransfersIn: transfersIn.slice(0, 4),
      };
    });
  }, [stores, inventory, stockInVouchers, storeTransfers, damageVouchers]);

  // Overall totals across all stores
  const overallMetrics = useMemo(() => {
    const totalStores = stores.length;
    const activeStores = stores.filter((s) => s.status === 'Active').length;
    const totalInwardQty = storeAnalytics.reduce((acc, curr) => acc + curr.totalInwardMovement, 0);
    const totalOutwardQty = storeAnalytics.reduce((acc, curr) => acc + curr.totalOutwardMovement, 0);
    const totalCurrentVal = storeAnalytics.reduce((acc, curr) => acc + curr.currentStockValuation, 0);
    return {
      totalStores,
      activeStores,
      totalInwardQty,
      totalOutwardQty,
      totalCurrentVal,
    };
  }, [stores, storeAnalytics]);

  const filteredStoreAnalytics = storeAnalytics.filter((sa) => {
    return (
      sa.store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sa.store.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sa.store.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sa.store.managerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const selectedStoreData = inspectingStore ? storeAnalytics.find((sa) => sa.store.id === inspectingStore.id) : null;

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
            Multi-Location Warehouse & In/Out Balance Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1 flex items-center gap-2">
            <Store className="text-[#D4AF37]" size={28} />
            Store Locations & Warehouses (Storochen Mmezegbbet)
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Register warehouses, track raw ingredient arrivals (Gebi/Stock In), inter-store transfers (Wochi/Transfer), and live net stock balances across all locations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateModule && (
            <button
              onClick={() => onNavigateModule('bincard')}
              className="px-4 py-2.5 bg-[#1E293B] hover:bg-[#2A3B4C] text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            >
              <FileSpreadsheet size={16} />
              <span>View Bin Cards</span>
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg min-h-[44px] cursor-pointer"
          >
            <Plus size={18} />
            <span>Register New Store</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards: Gebi (In), Wochi (Out), and Net Balance Valuation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#243244] p-5 rounded-[22px] border border-white/10 shadow-md">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold uppercase">
            <span>Registered Warehouses</span>
            <Building2 className="text-[#D4AF37]" size={18} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#F8FAFC]">{overallMetrics.totalStores}</span>
            <span className="text-xs text-[#22C55E] font-bold">({overallMetrics.activeStores} Active)</span>
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Central, Branch & Cold Rooms</p>
        </div>

        <div className="bg-[#243244] p-5 rounded-[22px] border border-emerald-500/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-[#22C55E] font-bold uppercase">
            <span>Total Inward (የገባው / Gebi)</span>
            <div className="p-1.5 bg-[#22C55E]/10 rounded-lg text-[#22C55E]">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-[#22C55E]">{overallMetrics.totalInwardQty.toLocaleString()} Units</span>
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Supplier Stock-Ins & Received Transfers</p>
        </div>

        <div className="bg-[#243244] p-5 rounded-[22px] border border-amber-500/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-[#E5A93C] font-bold uppercase">
            <span>Total Outward (የወጣው / Wochi)</span>
            <div className="p-1.5 bg-[#E5A93C]/10 rounded-lg text-[#E5A93C]">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-[#E5A93C]">{overallMetrics.totalOutwardQty.toLocaleString()} Units</span>
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Outward Transfers & Spoilage Write-offs</p>
        </div>

        <div className="bg-[#243244] p-5 rounded-[22px] border border-[#D4AF37]/40 shadow-md">
          <div className="flex items-center justify-between text-xs text-[#D4AF37] font-bold uppercase">
            <span>Net Stock Valuation</span>
            <div className="p-1.5 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-[#D4AF37]">
              {overallMetrics.totalCurrentVal.toLocaleString()} ETB
            </span>
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Live Net On-Hand Inventory Balance</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#243244] p-4 rounded-[20px] border border-white/10">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search warehouse by name, code, manager, or location..."
            className="w-full h-11 bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-11 pr-4 text-xs focus:outline-none focus:border-[#D4AF37]"
          />
          <Search size={18} className="absolute left-3.5 top-3.5 text-[#94A3B8]" />
        </div>
      </div>

      {/* Stores List with In/Out/Net Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredStoreAnalytics.map((sa) => {
          const st = sa.store;
          return (
            <div
              key={st.id}
              className="bg-[#243244] rounded-[24px] border border-white/10 shadow-lg hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Store Header Info */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#D4AF37] bg-[#1E293B] px-2.5 py-0.5 rounded-md border border-[#D4AF37]/30 font-bold">
                        {st.code}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          st.status === 'Active'
                            ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {st.status === 'Active' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                        {st.status}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-lg text-[#F8FAFC] mt-1.5">{st.name}</h3>
                  </div>

                  <button
                    onClick={() => setInspectingStore(st)}
                    className="p-2 bg-[#1E293B] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#0F172A] rounded-xl transition-all border border-white/5 cursor-pointer"
                    title="Audit Live In/Out Balance"
                  >
                    <Eye size={16} />
                  </button>
                </div>

                {/* Location & Manager Details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-[#CBD5E1]">
                  <div className="flex items-center gap-2 bg-[#1E293B] p-2 rounded-xl border border-white/5">
                    <MapPin size={14} className="text-[#D4AF37] shrink-0" />
                    <span className="truncate">{st.location}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-[#1E293B] p-2 rounded-xl border border-white/5">
                    <User size={14} className="text-[#D4AF37] shrink-0" />
                    <span className="truncate">{st.managerName}</span>
                  </div>
                </div>

                {/* In/Out Movement Breakdown Grid */}
                <div className="bg-[#1E293B] p-4 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Store Movement Balance</span>
                    <span className="text-[10px] text-[#D4AF37] font-bold">{sa.inventoryItemCount} SKU Types</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {/* Inward Movement */}
                    <div className="bg-[#243244] p-2.5 rounded-xl border border-emerald-500/20">
                      <span className="text-[9px] text-[#94A3B8] font-bold uppercase block flex items-center justify-center gap-1">
                        <ArrowDownLeft size={10} className="text-[#22C55E]" /> የገባው (In)
                      </span>
                      <span className="text-sm font-extrabold text-[#22C55E] block mt-0.5">
                        +{sa.totalInwardMovement.toLocaleString()}
                      </span>
                      <span className="text-[8px] text-[#94A3B8] block">
                        {sa.directStockInsCount} GRN / {sa.transfersInCount} Trn
                      </span>
                    </div>

                    {/* Outward Movement */}
                    <div className="bg-[#243244] p-2.5 rounded-xl border border-amber-500/20">
                      <span className="text-[9px] text-[#94A3B8] font-bold uppercase block flex items-center justify-center gap-1">
                        <ArrowUpRight size={10} className="text-[#E5A93C]" /> የወጣው (Out)
                      </span>
                      <span className="text-sm font-extrabold text-[#E5A93C] block mt-0.5">
                        -{sa.totalOutwardMovement.toLocaleString()}
                      </span>
                      <span className="text-[8px] text-[#94A3B8] block">
                        {sa.transfersOutCount} Trn / {sa.damageCount} Dmg
                      </span>
                    </div>

                    {/* Net Balance */}
                    <div className="bg-[#243244] p-2.5 rounded-xl border border-[#D4AF37]/30">
                      <span className="text-[9px] text-[#D4AF37] font-bold uppercase block">
                        ቀሪ Balance
                      </span>
                      <span className="text-sm font-extrabold text-[#D4AF37] block mt-0.5">
                        {sa.currentStockQty.toLocaleString()}
                      </span>
                      <span className="text-[8px] text-[#94A3B8] block">Current Units</span>
                    </div>
                  </div>

                  {/* Valuation */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[#94A3B8]">Stock Valuation:</span>
                    <span className="font-extrabold text-[#D4AF37]">{sa.currentStockValuation.toLocaleString()} ETB</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-[#1E293B]/70 border-t border-white/5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setInspectingStore(st)}
                  className="text-xs text-[#D4AF37] hover:text-[#F6C453] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet size={14} /> Full In/Out Ledger
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteStore(st.id)}
                  className="text-slate-400 hover:text-red-400 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Inspect Store In/Out and Real-Time Deducted Balance */}
      {inspectingStore && selectedStoreData && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#D4AF37] bg-[#243244] px-2.5 py-0.5 rounded border border-[#D4AF37]/30 font-bold">
                    {inspectingStore.code}
                  </span>
                  <span className="text-xs text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-0.5 rounded-full font-bold border border-[#22C55E]/20">
                    {inspectingStore.status}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#F8FAFC] mt-0.5">
                  {inspectingStore.name} — In/Out Balance Breakdown
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Location: {inspectingStore.location} &bull; Manager: {inspectingStore.managerName} ({inspectingStore.phone})
                </p>
              </div>
            </div>

            <button
              onClick={() => setInspectingStore(null)}
              className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#243244] transition-all cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            {/* In / Out / Net Balance Calculation Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-[#1E293B] p-5 rounded-2xl border border-emerald-500/30 shadow-md">
                <span className="text-xs text-[#22C55E] uppercase font-bold flex items-center gap-1.5">
                  <ArrowDownLeft size={14} /> 1. የገባው (Total In)
                </span>
                <span className="text-3xl font-extrabold text-[#22C55E] block mt-2">
                  +{selectedStoreData.totalInwardMovement.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  GRN: {selectedStoreData.totalStockInQty} | Trn In: {selectedStoreData.totalTransferInQty}
                </span>
              </div>

              <div className="bg-[#1E293B] p-5 rounded-2xl border border-amber-500/30 shadow-md">
                <span className="text-xs text-[#E5A93C] uppercase font-bold flex items-center gap-1.5">
                  <ArrowUpRight size={14} /> 2. የወጣው (Total Out)
                </span>
                <span className="text-3xl font-extrabold text-[#E5A93C] block mt-2">
                  -{selectedStoreData.totalOutwardMovement.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  Trn Out: {selectedStoreData.totalTransferOutQty} | Dmg: {selectedStoreData.totalDamageQty}
                </span>
              </div>

              <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#D4AF37] shadow-md">
                <span className="text-xs text-[#D4AF37] uppercase font-bold flex items-center gap-1.5">
                  <Package size={14} /> 3. ትክክለኛ ቀሪ (Net Balance)
                </span>
                <span className="text-3xl font-extrabold text-[#D4AF37] block mt-2">
                  {selectedStoreData.currentStockQty.toLocaleString()} Units
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  In ({selectedStoreData.totalInwardMovement}) - Out ({selectedStoreData.totalOutwardMovement})
                </span>
              </div>

              <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10 shadow-md">
                <span className="text-xs text-[#94A3B8] uppercase font-bold">
                  Total Valuation
                </span>
                <span className="text-3xl font-extrabold text-[#F8FAFC] block mt-2">
                  {selectedStoreData.currentStockValuation.toLocaleString()} ETB
                </span>
                <span className="text-xs text-[#D4AF37] mt-1 block font-semibold">
                  {selectedStoreData.inventoryItemCount} Active SKU Types
                </span>
              </div>
            </div>

            {/* Inventory Items currently in this Store */}
            <div className="space-y-3">
              <h3 className="text-base font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
                <Layers size={18} className="text-[#D4AF37]" />
                Store Raw Material Stock Balances
              </h3>

              <div className="bg-[#1E293B] rounded-2xl border border-white/10 overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs text-[#CBD5E1]">
                  <thead className="bg-[#0B0F17] text-[#94A3B8] uppercase text-[10px] font-extrabold tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3.5 px-5">Ingredient Name & SKU</th>
                      <th className="py-3.5 px-5">Category</th>
                      <th className="py-3.5 px-5">Current Stock Balance</th>
                      <th className="py-3.5 px-5">Unit Cost</th>
                      <th className="py-3.5 px-5">Total Value</th>
                      <th className="py-3.5 px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {selectedStoreData.effectiveInventory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-[#94A3B8]">
                          No individual inventory items linked to this store yet.
                        </td>
                      </tr>
                    ) : (
                      selectedStoreData.effectiveInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-[#243244]/60 transition-colors">
                          <td className="py-3.5 px-5">
                            <span className="font-bold text-white block text-sm">{item.name}</span>
                            <span className="text-[11px] font-mono text-[#D4AF37]">{item.sku}</span>
                          </td>
                          <td className="py-3.5 px-5">{item.category}</td>
                          <td className="py-3.5 px-5 font-extrabold text-[#F8FAFC] text-sm">
                            {item.stockQty} {item.unit}
                          </td>
                          <td className="py-3.5 px-5 font-mono">{item.costPerUnit} ETB</td>
                          <td className="py-3.5 px-5 font-extrabold text-[#D4AF37] text-sm">
                            {(item.stockQty * item.costPerUnit).toLocaleString()} ETB
                          </td>
                          <td className="py-3.5 px-5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                item.stockQty > item.reorderLevel
                                  ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {item.stockQty > item.reorderLevel ? 'In Stock' : 'Low Stock'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent In/Out Logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Recent Stock Ins */}
              <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="font-bold text-[#22C55E] flex items-center gap-1.5 text-sm">
                    <ArrowDownLeft size={16} /> Recent Stock-Ins (GRN)
                  </span>
                  <span className="text-xs text-[#94A3B8] font-semibold">{selectedStoreData.directStockInsCount} Total</span>
                </div>
                {selectedStoreData.recentStockIns.length === 0 ? (
                  <p className="text-[#94A3B8] text-xs py-4 text-center">No recent supplier Stock-Ins logged for this store.</p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {selectedStoreData.recentStockIns.map((grn) => (
                      <div key={grn.voucherId} className="bg-[#243244] p-3 rounded-xl border border-white/5 flex justify-between items-center">
                        <div>
                          <span className="font-mono font-bold text-[#D4AF37] block">{grn.voucherId}</span>
                          <span className="text-xs text-slate-300">{grn.supplierName}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#22C55E] block text-sm">+{grn.items.reduce((s, i) => s + i.qty, 0)} Units</span>
                          <span className="text-[11px] text-slate-500">{grn.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Transfers Out */}
              <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="font-bold text-[#E5A93C] flex items-center gap-1.5 text-sm">
                    <ArrowUpRight size={16} /> Recent Transfers Out (Wochi)
                  </span>
                  <span className="text-xs text-[#94A3B8] font-semibold">{selectedStoreData.transfersOutCount} Total</span>
                </div>
                {selectedStoreData.recentTransfersOut.length === 0 ? (
                  <p className="text-[#94A3B8] text-xs py-4 text-center">No outward transfers logged for this store.</p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {selectedStoreData.recentTransfersOut.map((trn) => (
                      <div key={trn.voucherId} className="bg-[#243244] p-3 rounded-xl border border-white/5 flex justify-between items-center">
                        <div>
                          <span className="font-mono font-bold text-[#D4AF37] block">{trn.voucherId}</span>
                          <span className="text-xs text-slate-300">To: {trn.toStore}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#E5A93C] block text-sm">-{trn.items.reduce((s, i) => s + i.qtyTransferred, 0)} Units</span>
                          <span className="text-[11px] text-slate-500">{trn.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex justify-end gap-3 shrink-0 shadow-xl">
            <button
              type="button"
              onClick={() => setInspectingStore(null)}
              className="px-8 h-12 bg-[#243244] hover:bg-[#2F4158] text-[#F8FAFC] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close Audit View
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add Store (Register Store Location Full Screen) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
                <Store size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#F8FAFC]">Register Store Location</h3>
                <p className="text-xs text-[#94A3B8]">Add a new warehouse, sub-store, or bar stock location</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#243244] transition-all cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Content Form Area */}
          <form onSubmit={handleAdd} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-lg">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Store Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Bole Main Warehouse"
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Store Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Location Address *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Kazanchis Industry Zone, Addis Ababa"
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Manager Name *</label>
                  <input
                    type="text"
                    required
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Manager Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Storage Capacity</label>
                  <input
                    type="text"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 300 Sqm / 15 Tons"
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Store Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sticky Action Buttons */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-6 h-12 rounded-xl bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 h-12 rounded-xl bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <CheckCircle2 size={18} />
                <span>Save Store Location</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
