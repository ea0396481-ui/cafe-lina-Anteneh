import React, { useState } from 'react';
import {
  Order,
  OrderStatus,
  InventoryItem,
  RecipeCost,
  StoreRecord,
  StoreRequestVoucher,
  StoreRequestItem,
} from '../../types';
import {
  Clock,
  CheckCircle2,
  Coffee,
  Layers,
  AlertTriangle,
  Flame,
  Check,
  ChefHat,
  Sparkles,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  Eye,
  X,
  Plus,
  Search,
  FileText,
  Send,
  Boxes,
  ArrowRight,
  AlertCircle,
  Building2,
  User,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';

interface KitchenDisplaySystemProps {
  orders: Order[];
  inventory: InventoryItem[];
  recipeCosts?: RecipeCost[];
  stores?: StoreRecord[];
  storeRequests?: StoreRequestVoucher[];
  onAddStoreRequest?: (req: StoreRequestVoucher) => void;
  onUpdateStoreRequest?: (req: StoreRequestVoucher) => void;
  onDeleteStoreRequest?: (voucherId: string) => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  currentUserName?: string;
  currentUserRole?: string;
}

export const KitchenDisplaySystem: React.FC<KitchenDisplaySystemProps> = ({
  orders,
  inventory,
  recipeCosts = [],
  stores = [],
  storeRequests = [],
  onAddStoreRequest,
  onUpdateStoreRequest,
  onDeleteStoreRequest,
  onUpdateStatus,
  currentUserName = 'Kitchen Head Chef',
  currentUserRole = 'Kitchen',
}) => {
  // Main view navigation: 'orders' or 'requests'
  const [mainView, setMainView] = useState<'orders' | 'requests'>('orders');

  // Orders Filter
  const [activeFilter, setActiveFilter] = useState<'Active' | 'Pending' | 'Preparing' | 'Ready' | 'All'>('Active');
  const [expandedIngredientsOrderId, setExpandedIngredientsOrderId] = useState<string | null>(null);
  const [justDeductedOrderId, setJustDeductedOrderId] = useState<string | null>(null);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<Order | null>(null);

  // Requests Filter
  const [requestFilter, setRequestFilter] = useState<'All' | 'Pending' | 'Approved' | 'Issued' | 'Rejected'>('All');
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<StoreRequestVoucher | null>(null);

  // New Request Modal State (Full Screen)
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqLocation, setReqLocation] = useState('Kitchen & Bakery Sub-Store');
  const [reqTargetStore, setReqTargetStore] = useState(
    stores.length > 0 ? stores[0].name : 'Bole Main Central Store'
  );
  const [reqRequestedBy, setReqRequestedBy] = useState(currentUserName);
  const [reqDepartment, setReqDepartment] = useState('Kitchen');
  const [reqRemark, setReqRemark] = useState('');
  const [selectedRawItems, setSelectedRawItems] = useState<{ [invId: string]: number }>({});
  const [rawItemSearch, setRawItemSearch] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Helper to calculate exact ingredients used for an order
  const getOrderIngredientsBreakdown = (ord: Order) => {
    const list: {
      name: string;
      qtyNeeded: number;
      unit: string;
      stockAvailable: number;
      matchedInvId?: string;
      isLowStock: boolean;
      invItem?: InventoryItem;
    }[] = [];

    for (const item of ord.items) {
      const qty = item.quantity;
      const menuItem = item.menuItem;

      // Check explicit RecipeCost
      const rc = recipeCosts.find(
        (r) => r.menuItemId === menuItem.id || r.menuItemName.toLowerCase() === menuItem.name.toLowerCase()
      );

      let found = false;

      if (rc && rc.ingredients && rc.ingredients.length > 0) {
        for (const ing of rc.ingredients) {
          const matchedInv = inventory.find(
            (inv) =>
              inv.name.toLowerCase().includes(ing.ingredientName.toLowerCase()) ||
              ing.ingredientName.toLowerCase().includes(inv.name.toLowerCase()) ||
              (ing.ingredientName.toLowerCase().includes('coffee') && inv.category.toLowerCase().includes('coffee')) ||
              (ing.ingredientName.toLowerCase().includes('milk') && inv.category.toLowerCase().includes('milk')) ||
              (ing.ingredientName.toLowerCase().includes('chocolate') && inv.name.toLowerCase().includes('chocolate')) ||
              (ing.ingredientName.toLowerCase().includes('cup') && inv.category.toLowerCase().includes('packaging'))
          );

          const totalQty = Math.round(ing.qty * qty * 1000) / 1000;
          const avail = matchedInv ? matchedInv.stockQty : 100;
          list.push({
            name: matchedInv ? matchedInv.name : ing.ingredientName,
            qtyNeeded: totalQty,
            unit: ing.unit,
            stockAvailable: avail,
            matchedInvId: matchedInv?.id,
            isLowStock: avail <= (matchedInv?.reorderLevel || 10),
            invItem: matchedInv,
          });
          found = true;
        }
      }

      if (!found) {
        const itemCategory = menuItem.category ? menuItem.category.toLowerCase() : '';
        const itemName = menuItem.name ? menuItem.name.toLowerCase() : '';
        const isCoffeeDrink = ['coffee', 'espresso', 'latte', 'cappuccino', 'mocha', 'macchiato', 'americano'].some(
          (c) => itemCategory.includes(c) || itemName.includes(c)
        );
        const hasMilk = ['latte', 'cappuccino', 'mocha', 'macchiato'].some(
          (c) => itemCategory.includes(c) || itemName.includes(c)
        );
        const hasChocolate = itemName.includes('mocha') || itemName.includes('chocolate') || itemName.includes('cake');

        if (isCoffeeDrink) {
          const coffeeInv = inventory.find(
            (i) => i.category.toLowerCase().includes('coffee') || i.name.toLowerCase().includes('coffee')
          );
          const avail = coffeeInv ? coffeeInv.stockQty : 150;
          list.push({
            name: coffeeInv ? coffeeInv.name : 'Yirgacheffe Specialty Coffee Beans',
            qtyNeeded: Math.round(0.018 * qty * 1000) / 1000,
            unit: 'kg',
            stockAvailable: avail,
            matchedInvId: coffeeInv?.id,
            isLowStock: avail <= (coffeeInv?.reorderLevel || 20),
            invItem: coffeeInv,
          });
        }

        if (hasMilk) {
          const milkInv = inventory.find(
            (i) =>
              i.category.toLowerCase().includes('milk') ||
              i.category.toLowerCase().includes('dairy') ||
              i.name.toLowerCase().includes('milk')
          );
          const avail = milkInv ? milkInv.stockQty : 80;
          list.push({
            name: milkInv ? milkInv.name : 'Organic Whole Milk',
            qtyNeeded: Math.round(0.15 * qty * 1000) / 1000,
            unit: 'liters',
            stockAvailable: avail,
            matchedInvId: milkInv?.id,
            isLowStock: avail <= (milkInv?.reorderLevel || 15),
            invItem: milkInv,
          });
        }

        if (hasChocolate) {
          const chocInv = inventory.find((i) => i.name.toLowerCase().includes('chocolate'));
          const avail = chocInv ? chocInv.stockQty : 30;
          list.push({
            name: chocInv ? chocInv.name : 'Belgian Dark Chocolate 70%',
            qtyNeeded: Math.round(0.05 * qty * 1000) / 1000,
            unit: 'kg',
            stockAvailable: avail,
            matchedInvId: chocInv?.id,
            isLowStock: avail <= (chocInv?.reorderLevel || 10),
            invItem: chocInv,
          });
        }

        const cupInv = inventory.find(
          (i) => i.category.toLowerCase().includes('packaging') || i.name.toLowerCase().includes('cup')
        );
        const avail = cupInv ? cupInv.stockQty : 1000;
        list.push({
          name: cupInv ? cupInv.name : 'Eco Coffee Cups & Lids',
          qtyNeeded: qty,
          unit: 'units',
          stockAvailable: avail,
          matchedInvId: cupInv?.id,
          isLowStock: avail <= (cupInv?.reorderLevel || 100),
          invItem: cupInv,
        });
      }
    }

    return list;
  };

  // Handle Mark Ready click with auto inventory deduction
  const handleMarkReady = (orderId: string) => {
    onUpdateStatus(orderId, 'Ready');
    setJustDeductedOrderId(orderId);
    setTimeout(() => {
      setJustDeductedOrderId(null);
    }, 4000);
  };

  // Filter Tickets
  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'Active') return o.status === 'Pending' || o.status === 'Preparing';
    if (activeFilter === 'Pending') return o.status === 'Pending';
    if (activeFilter === 'Preparing') return o.status === 'Preparing';
    if (activeFilter === 'Ready') return o.status === 'Ready' || o.status === 'Completed';
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const preparingCount = orders.filter((o) => o.status === 'Preparing').length;
  const readyCount = orders.filter((o) => o.status === 'Ready' || o.status === 'Completed').length;

  // Filter Requests
  const filteredRequests = storeRequests.filter((r) => {
    if (requestFilter === 'All') return true;
    return r.status === requestFilter;
  });

  const pendingRequestsCount = storeRequests.filter((r) => r.status === 'Pending').length;
  const approvedRequestsCount = storeRequests.filter((r) => r.status === 'Approved' || r.status === 'Issued').length;

  // Identify low-stock inventory items for quick requisition
  const lowStockItems = inventory.filter((i) => i.stockQty <= i.reorderLevel);

  // Quick Open Modal with preselected ingredient
  const handleQuickRequestItem = (inv: InventoryItem) => {
    setSelectedRawItems({ [inv.id]: Math.max(1, Math.round(inv.reorderLevel * 2)) });
    setShowRequestModal(true);
  };

  // Toggle item selection in requisition modal
  const handleToggleItem = (inv: InventoryItem) => {
    if (selectedRawItems[inv.id] !== undefined) {
      const next = { ...selectedRawItems };
      delete next[inv.id];
      setSelectedRawItems(next);
    } else {
      setSelectedRawItems({ ...selectedRawItems, [inv.id]: 10 });
    }
  };

  const handleQtyChange = (invId: string, qty: number) => {
    setSelectedRawItems({ ...selectedRawItems, [invId]: Math.max(0.1, qty) });
  };

  // Submit Requisition
  const handleSubmitRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    const itemKeys = Object.keys(selectedRawItems);
    if (itemKeys.length === 0) return;

    const requestItems: StoreRequestItem[] = itemKeys.map((invId) => {
      const inv = inventory.find((i) => i.id === invId);
      return {
        inventoryId: invId,
        ingredientName: inv ? inv.name : 'Raw Material',
        sku: inv ? inv.sku : 'SKU-RAW',
        qtyRequested: selectedRawItems[invId],
        unit: inv ? inv.unit : 'kg',
        availableStock: inv ? inv.stockQty : 0,
      };
    });

    const newVoucherId = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const today = new Date().toISOString().split('T')[0];

    const newRequest: StoreRequestVoucher = {
      voucherId: newVoucherId,
      date: today,
      requestedBy: reqRequestedBy || currentUserName,
      requestingStore: reqLocation,
      targetStore: reqTargetStore,
      department: reqDepartment,
      status: 'Pending',
      items: requestItems,
      remark: reqRemark || 'Kitchen raw material supply requisition',
      createdTime: currentTime,
    };

    if (onAddStoreRequest) {
      onAddStoreRequest(newRequest);
    }

    setShowRequestModal(false);
    setSelectedRawItems({});
    setReqRemark('');
    setSuccessToast(`Requisition voucher ${newVoucherId} successfully submitted to Store!`);
    setTimeout(() => {
      setSuccessToast(null);
    }, 5000);
  };

  const filteredInventoryForModal = inventory.filter(
    (inv) =>
      inv.name.toLowerCase().includes(rawItemSearch.toLowerCase()) ||
      inv.sku.toLowerCase().includes(rawItemSearch.toLowerCase()) ||
      inv.category.toLowerCase().includes(rawItemSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
              Kitchen Operations & Material Procurement
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1.5 flex items-center gap-2.5">
            <ChefHat className="text-[#D4AF37]" size={28} />
            Kitchen Display & Store Requisition (KDS)
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl">
            Real-time kitchen order preparation and direct Store Requisition (የጥሬ ዕቃ መጠየቂያ) from the central warehouse.
          </p>
        </div>

        {/* Action Controls & Modal Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="h-11 px-5 bg-gradient-to-r from-[#D4AF37] to-[#F6C453] hover:from-[#F6C453] hover:to-[#D4AF37] text-[#0F172A] rounded-xl font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={18} className="stroke-[3]" />
            <span>Request Material from Store (የዕቃ መጠየቂያ)</span>
          </button>
        </div>
      </div>

      {/* Main View Mode Selector (Orders vs Store Requests) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#1E293B] p-2 rounded-2xl border border-white/10">
        <button
          type="button"
          onClick={() => setMainView('orders')}
          className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            mainView === 'orders'
              ? 'bg-[#D4AF37] text-[#0F172A] shadow-md font-extrabold'
              : 'text-[#CBD5E1] hover:bg-[#243244] hover:text-white'
          }`}
        >
          <Flame size={18} />
          <span>Kitchen Orders Queue (የትዕዛዞች ማዘዣ)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              mainView === 'orders' ? 'bg-[#0F172A] text-[#D4AF37]' : 'bg-[#243244] text-[#CBD5E1]'
            }`}
          >
            {pendingCount + preparingCount} Active
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainView('requests')}
          className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            mainView === 'requests'
              ? 'bg-[#D4AF37] text-[#0F172A] shadow-md font-extrabold'
              : 'text-[#CBD5E1] hover:bg-[#243244] hover:text-white'
          }`}
        >
          <FileText size={18} />
          <span>Kitchen Store Requests (የጥሬ ዕቃ መጠየቂያዎች)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              mainView === 'requests' ? 'bg-[#0F172A] text-[#D4AF37]' : 'bg-[#243244] text-[#CBD5E1]'
            }`}
          >
            {storeRequests.length} Vouchers
          </span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 p-4 rounded-2xl flex items-center justify-between gap-3 text-emerald-300 animate-fadeIn shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCheck size={24} className="text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-[#F8FAFC]">Requisition Submitted Successfully</p>
              <p className="text-xs text-emerald-300">{successToast}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="p-1 text-emerald-300 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Quick Low Stock Alert Bar */}
      {lowStockItems.length > 0 && (
        <div className="bg-[#1E293B] border border-amber-500/30 rounded-2xl p-4 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Kitchen Low Stock Alert ({lowStockItems.length} items low)
              </h3>
            </div>
            <span className="text-[11px] text-[#94A3B8]">Directly request restock from central store</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {lowStockItems.slice(0, 5).map((inv) => (
              <div
                key={inv.id}
                className="bg-[#243244] border border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-[#F8FAFC] block">{inv.name}</span>
                  <span className="text-[10px] text-amber-400">
                    Remaining: {inv.stockQty} {inv.unit} (Min: {inv.reorderLevel} {inv.unit})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickRequestItem(inv)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-[#0F172A] rounded-lg font-black text-[10px] cursor-pointer transition-all shrink-0 flex items-center gap-1"
                >
                  <Plus size={12} /> Request
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 1: ORDERS QUEUE */}
      {mainView === 'orders' && (
        <div className="space-y-6">
          {/* Order Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-[#1E293B] p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveFilter('Active')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeFilter === 'Active'
                  ? 'bg-[#D4AF37] text-[#0F172A] shadow-md'
                  : 'text-[#CBD5E1] hover:text-white'
              }`}
            >
              <Flame size={15} />
              <span>Active Queue ({pendingCount + preparingCount})</span>
            </button>

            <button
              onClick={() => setActiveFilter('Pending')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeFilter === 'Pending'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-red-400 hover:bg-red-500/10'
              }`}
            >
              <span>● New Pending ({pendingCount})</span>
            </button>

            <button
              onClick={() => setActiveFilter('Preparing')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeFilter === 'Preparing'
                  ? 'bg-amber-500 text-[#0F172A] shadow-md'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <span>☕ In Preparation ({preparingCount})</span>
            </button>

            <button
              onClick={() => setActiveFilter('Ready')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeFilter === 'Ready'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <CheckCircle2 size={15} />
              <span>Completed & Deducted ({readyCount})</span>
            </button>

            <button
              onClick={() => setActiveFilter('All')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'All'
                  ? 'bg-[#2F4158] text-white shadow-md'
                  : 'text-[#CBD5E1] hover:text-white'
              }`}
            >
              All Tickets ({orders.length})
            </button>
          </div>

          {/* Just Deducted Confirmation Banner */}
          {justDeductedOrderId && (
            <div className="bg-emerald-500/20 border border-emerald-500/50 p-4 rounded-2xl flex items-center justify-between gap-3 text-emerald-300 animate-fadeIn">
              <div className="flex items-center gap-3">
                <PackageCheck size={24} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="font-extrabold text-sm text-[#F8FAFC]">
                    Order {justDeductedOrderId} Marked as Ready!
                  </p>
                  <p className="text-xs text-emerald-300">
                    All recipe ingredients have been automatically deducted from Firebase Inventory Balance.
                  </p>
                </div>
              </div>
              <span className="text-xs bg-emerald-500 text-white font-black px-3 py-1 rounded-full shrink-0">
                Stock Updated
              </span>
            </div>
          )}

          {/* Kitchen Ticket Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-[#243244] rounded-[24px] border border-white/10 shadow-xl text-[#CBD5E1]">
                <CheckCircle2 size={56} className="mx-auto text-[#22C55E] mb-3 opacity-90" />
                <p className="font-bold text-xl text-[#F8FAFC]">Kitchen Queue Clear!</p>
                <p className="text-xs text-[#94A3B8] mt-1 max-w-sm mx-auto">
                  There are no orders matching this filter. New counter or online orders will immediately appear here.
                </p>
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isExpanded = expandedIngredientsOrderId === ord.id;
                const ingredientsUsed = getOrderIngredientsBreakdown(ord);
                const isReady = ord.status === 'Ready' || ord.status === 'Completed';

                return (
                  <div
                    key={ord.id}
                    className={`bg-[#243244] rounded-[24px] p-6 border shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-5 ${
                      ord.status === 'Pending'
                        ? 'border-red-500/80 shadow-red-500/5'
                        : ord.status === 'Preparing'
                        ? 'border-amber-500/80 shadow-amber-500/5'
                        : 'border-emerald-500/60 shadow-emerald-500/5 opacity-90'
                    }`}
                  >
                    {/* Card Top: Order ID, Time, Status */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-start border-b border-white/10 pb-3">
                        <div>
                          <span className="text-[10px] font-mono text-[#D4AF37] font-extrabold uppercase block">
                            Kitchen Ticket
                          </span>
                          <h3 className="text-lg font-mono font-black text-[#F8FAFC]">{ord.id}</h3>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider block ${
                              ord.status === 'Pending'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : ord.status === 'Preparing'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            }`}
                          >
                            {ord.status === 'Pending'
                              ? '● New Order'
                              : ord.status === 'Preparing'
                              ? '☕ In Prep'
                              : '✓ Ready & Deducted'}
                          </span>
                          <span className="text-[10px] text-[#94A3B8] flex items-center justify-end gap-1 mt-1 font-mono">
                            <Clock size={11} />
                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="flex justify-between items-center text-xs bg-[#1E293B] p-2.5 rounded-xl border border-white/5">
                        <div>
                          <span className="text-[10px] text-[#94A3B8] block">Customer</span>
                          <span className="font-bold text-[#F8FAFC]">{ord.customerName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#94A3B8] block">Type</span>
                          <span className="font-bold text-[#D4AF37]">{ord.deliveryType}</span>
                        </div>
                      </div>

                      {/* Purchased Items List */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8] block">
                          Ordered Products ({ord.items.reduce((s, i) => s + i.quantity, 0)} items)
                        </span>
                        <div className="bg-[#1E293B] p-3 rounded-2xl border border-white/10 space-y-2">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-bold text-[#F8FAFC]">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-[#D4AF37] text-[#0F172A] flex items-center justify-center text-xs font-black shrink-0">
                                  {it.quantity}x
                                </span>
                                <span className="truncate">{it.menuItem.name}</span>
                              </div>
                              <span className="text-[11px] text-[#D4AF37] font-mono shrink-0">
                                {it.menuItem.category}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ingredients Breakdown Section */}
                      <div className="space-y-2 bg-[#1E293B]/70 p-3 rounded-2xl border border-white/10 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-[#CBD5E1] flex items-center gap-1.5">
                            <Layers size={13} className="text-[#D4AF37]" />
                            <span>Recipe Ingredients ({ingredientsUsed.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedIngredientsOrderId(isExpanded ? null : ord.id)}
                            className="text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                <span>Hide Details</span>
                                <ChevronUp size={12} />
                              </>
                            ) : (
                              <>
                                <span>Show Deductions</span>
                                <ChevronDown size={12} />
                              </>
                            )}
                          </button>
                        </div>

                        {/* Collapsed Preview */}
                        {!isExpanded && (
                          <p className="text-[11px] text-[#94A3B8] line-clamp-1 italic">
                            Deducts: {ingredientsUsed.map((i) => `${i.qtyNeeded} ${i.unit} ${i.name}`).join(' • ')}
                          </p>
                        )}

                        {/* Expanded Ingredients Table with Stock Quantities */}
                        {isExpanded && (
                          <div className="space-y-1.5 pt-1.5 border-t border-white/10 animate-fadeIn">
                            {ingredientsUsed.map((ing, iIdx) => (
                              <div
                                key={iIdx}
                                className="flex justify-between items-center text-[11px] bg-[#243244] p-2 rounded-xl border border-white/5"
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-[#F8FAFC]">{ing.name}</span>
                                    {ing.isLowStock && (
                                      <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                        LOW
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-[#94A3B8]">
                                    In Inventory: <strong className={ing.isLowStock ? 'text-amber-400' : 'text-emerald-400'}>{ing.stockAvailable} {ing.unit}</strong>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <span className="font-black text-[#D4AF37] block">
                                      -{ing.qtyNeeded} {ing.unit}
                                    </span>
                                    <span className="text-[9px] text-[#94A3B8]">deduction</span>
                                  </div>
                                  {ing.invItem && (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickRequestItem(ing.invItem!)}
                                      className="p-1 bg-[#1E293B] hover:bg-[#D4AF37] hover:text-[#0F172A] text-[#D4AF37] rounded-lg transition-all cursor-pointer"
                                      title="Request restock"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions: Start Prep & Make Ready */}
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      {ord.status === 'Pending' && (
                        <button
                          onClick={() => onUpdateStatus(ord.id, 'Preparing')}
                          className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
                        >
                          <Flame size={16} />
                          <span>Start Preparation (ወደ ዝግጅት አስገባ)</span>
                        </button>
                      )}

                      {ord.status === 'Preparing' && (
                        <button
                          onClick={() => handleMarkReady(ord.id)}
                          className="w-full h-12 bg-[#22C55E] hover:bg-[#16A34A] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98 animate-pulse"
                        >
                          <CheckCircle2 size={18} />
                          <span>Make Ready & Deduct Stock (አዘጋጅቶ ጨርስ እና ክምችት ቀንስ)</span>
                        </button>
                      )}

                      {isReady && (
                        <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs font-extrabold text-emerald-400 flex items-center justify-center gap-2">
                          <Check size={16} />
                          <span>✓ Order Ready & Ingredients Deducted from Stock</span>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedTicketForDetail(ord)}
                        className="w-full py-2 bg-[#1E293B] hover:bg-[#2F4158] text-[#CBD5E1] rounded-xl text-[11px] font-bold border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>View Ticket & Full Recipe Breakdown</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: STORE REQUESTS / REQUISITIONS */}
      {mainView === 'requests' && (
        <div className="space-y-6">
          {/* Request Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1E293B] p-4 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRequestFilter('All')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  requestFilter === 'All'
                    ? 'bg-[#D4AF37] text-[#0F172A] font-extrabold shadow-md'
                    : 'text-[#CBD5E1] hover:bg-[#243244]'
                }`}
              >
                All Requisitions ({storeRequests.length})
              </button>

              <button
                type="button"
                onClick={() => setRequestFilter('Pending')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  requestFilter === 'Pending'
                    ? 'bg-amber-500 text-[#0F172A] font-extrabold shadow-md'
                    : 'text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                ⏳ Pending ({pendingRequestsCount})
              </button>

              <button
                type="button"
                onClick={() => setRequestFilter('Approved')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  requestFilter === 'Approved'
                    ? 'bg-emerald-500 text-white font-extrabold shadow-md'
                    : 'text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                ✓ Approved & Dispatched ({approvedRequestsCount})
              </button>

              <button
                type="button"
                onClick={() => setRequestFilter('Rejected')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  requestFilter === 'Rejected'
                    ? 'bg-red-500 text-white font-extrabold shadow-md'
                    : 'text-red-400 hover:bg-red-500/10'
                }`}
              >
                ✕ Rejected ({storeRequests.filter((r) => r.status === 'Rejected').length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowRequestModal(true)}
              className="h-10 px-5 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>Create New Request Voucher</span>
            </button>
          </div>

          {/* Requests List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-[#243244] rounded-[24px] border border-white/10 shadow-xl text-[#CBD5E1]">
                <FileText size={48} className="mx-auto text-[#D4AF37] mb-3 opacity-80" />
                <p className="font-bold text-lg text-[#F8FAFC]">No Store Requests Found</p>
                <p className="text-xs text-[#94A3B8] mt-1 max-w-sm mx-auto">
                  No material requisition vouchers matching this filter. Click the button above to request supplies from the main warehouse.
                </p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const totalItemsQty = req.items.reduce((s, i) => s + i.qtyRequested, 0);

                return (
                  <div
                    key={req.voucherId}
                    className="bg-[#243244] rounded-2xl p-5 border border-white/10 shadow-lg hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start border-b border-white/10 pb-3">
                        <div>
                          <span className="text-[10px] font-mono text-[#D4AF37] font-bold uppercase block">
                            Requisition Voucher
                          </span>
                          <h3 className="font-mono font-bold text-base text-[#F8FAFC]">{req.voucherId}</h3>
                          <span className="text-[10px] text-[#94A3B8] flex items-center gap-1 mt-0.5">
                            <Clock size={11} /> {req.date} at {req.createdTime}
                          </span>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            req.status === 'Pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : req.status === 'Approved' || req.status === 'Issued'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-400 border border-red-500/40'
                          }`}
                        >
                          {req.status === 'Pending'
                            ? '⏳ Pending Approval'
                            : req.status === 'Approved' || req.status === 'Issued'
                            ? '✓ Approved / Issued'
                            : '✕ Rejected'}
                        </span>
                      </div>

                      {/* Route Info */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#1E293B] p-2.5 rounded-xl border border-white/5">
                        <div>
                          <span className="text-[10px] text-[#94A3B8] block">From Store (Source)</span>
                          <span className="font-bold text-[#F8FAFC] truncate block">{req.targetStore}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#94A3B8] block">To (Kitchen / Unit)</span>
                          <span className="font-bold text-[#D4AF37] truncate block">
                            {req.requestingStore || req.department}
                          </span>
                        </div>
                      </div>

                      {/* Requester Info */}
                      <div className="flex items-center justify-between text-xs text-[#CBD5E1]">
                        <span className="flex items-center gap-1.5">
                          <User size={13} className="text-[#D4AF37]" />
                          <span>Requested by: <strong className="text-[#F8FAFC]">{req.requestedBy}</strong></span>
                        </span>
                        <span className="text-[10px] text-[#94A3B8]">
                          {req.items.length} material lines
                        </span>
                      </div>

                      {/* Items Preview */}
                      <div className="space-y-1.5 bg-[#1E293B] p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase block">
                          Requested Materials:
                        </span>
                        <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                          {req.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs text-[#F8FAFC]">
                              <span className="truncate">{it.ingredientName}</span>
                              <span className="font-bold text-[#D4AF37] font-mono shrink-0">
                                {it.qtyRequested} {it.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {req.remark && (
                        <p className="text-[11px] text-[#94A3B8] italic bg-[#1E293B]/40 p-2 rounded-lg border border-white/5">
                          "{req.remark}"
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] text-[#94A3B8]">
                        Total Quantity: <strong className="text-[#F8FAFC]">{totalItemsQty} units/kg</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedRequestForDetail(req)}
                        className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#2F4158] text-[#CBD5E1] hover:text-white rounded-lg text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye size={13} /> View Voucher
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* FULL SCREEN REQUISITION MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
                <Boxes size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#F8FAFC]">
                  Kitchen Material Requisition (የዕቃ መጠየቂያ ቫውቸር)
                </h3>
                <p className="text-xs text-[#CBD5E1]">
                  Issue store request ticket to restock raw ingredients and packaging supplies
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              className="p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#243244] transition-all cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmitRequisition} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
              {/* Location & Requester Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#1E293B] p-6 rounded-2xl border border-white/10 shadow-lg">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Requesting Location / Station *</label>
                  <input
                    type="text"
                    required
                    value={reqLocation}
                    onChange={(e) => setReqLocation(e.target.value)}
                    placeholder="e.g. Kitchen & Bakery Sub-Store"
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Target Issuing Warehouse *</label>
                  <select
                    value={reqTargetStore}
                    onChange={(e) => setReqTargetStore(e.target.value)}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    {stores.length > 0 ? (
                      stores.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.code})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Bole Main Central Store">Bole Main Central Store</option>
                        <option value="Kazanchis Bakery Lab & Cold Room">Kazanchis Bakery Lab & Cold Room</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Requested By (Chef / Barista) *</label>
                  <input
                    type="text"
                    required
                    value={reqRequestedBy}
                    onChange={(e) => setReqRequestedBy(e.target.value)}
                    placeholder="e.g. Head Chef Dawit"
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Raw Materials Selection Box */}
              <div className="bg-[#1E293B] p-6 rounded-2xl border border-white/10 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <label className="block text-sm font-bold text-[#D4AF37] uppercase tracking-wider">
                      Select Raw Materials ({Object.keys(selectedRawItems).length} Selected)
                    </label>
                    <p className="text-xs text-[#CBD5E1]">
                      Choose beans, milk, syrups, flour, cups, and ingredients needed in the kitchen
                    </p>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={rawItemSearch}
                      onChange={(e) => setRawItemSearch(e.target.value)}
                      placeholder="Search ingredient, SKU, category..."
                      className="w-full sm:w-64 h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl pl-9 pr-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                    <Search size={16} className="absolute left-3 top-3 text-[#94A3B8]" />
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto border border-white/10 rounded-xl p-3 bg-[#243244] space-y-2.5">
                  {filteredInventoryForModal.map((inv) => {
                    const isChecked = selectedRawItems[inv.id] !== undefined;
                    const isLow = inv.stockQty <= inv.reorderLevel;

                    return (
                      <div
                        key={inv.id}
                        className={`p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border transition-all ${
                          isChecked
                            ? 'bg-[#1E293B] border-[#D4AF37] text-[#F8FAFC]'
                            : 'bg-[#1E293B]/60 border-white/5 text-[#CBD5E1] hover:bg-[#1E293B]'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItem(inv)}
                            className="w-5 h-5 accent-[#D4AF37] rounded cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#F8FAFC] block">{inv.name}</span>
                              <span className="text-[10px] bg-[#243244] text-[#D4AF37] px-2 py-0.5 rounded border border-white/10">
                                {inv.category}
                              </span>
                              {isLow && (
                                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black px-2 py-0.5 rounded-full">
                                  LOW STOCK
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#94A3B8]">
                              SKU: {inv.sku} | In Central Store: <strong className="text-[#F8FAFC]">{inv.stockQty} {inv.unit}</strong> | Min: {inv.reorderLevel} {inv.unit}
                            </span>
                          </div>
                        </label>

                        {isChecked && (
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="text-[11px] text-[#94A3B8] font-bold">Requested Qty:</span>
                            <input
                              type="number"
                              min={0.1}
                              step="any"
                              value={selectedRawItems[inv.id]}
                              onChange={(e) => handleQtyChange(inv.id, Number(e.target.value))}
                              className="w-24 h-9 bg-[#243244] text-[#D4AF37] font-extrabold border border-[#D4AF37]/50 rounded-lg px-2 text-sm focus:outline-none"
                            />
                            <span className="text-xs text-[#CBD5E1] font-bold">{inv.unit}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Purpose / Remarks */}
              <div className="bg-[#1E293B] p-6 rounded-2xl border border-white/10 shadow-lg space-y-1.5">
                <label className="block text-xs font-bold text-[#CBD5E1]">Requisition Purpose / Reason *</label>
                <input
                  type="text"
                  value={reqRemark}
                  onChange={(e) => setReqRemark(e.target.value)}
                  placeholder="e.g. Daily morning service prep & bakery station restock"
                  className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="w-full sm:w-auto px-6 h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 hover:bg-[#2F4158] rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Object.keys(selectedRawItems).length === 0}
                className="w-full sm:w-auto px-8 h-12 bg-[#D4AF37] hover:bg-[#F6C453] disabled:opacity-40 text-[#0F172A] rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <Send size={16} />
                <span>Submit Material Requisition (ቫውቸሩን ላክ)</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket Full Detail Modal */}
      {selectedTicketForDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1E293B] border border-white/10 rounded-[28px] max-w-lg w-full p-6 space-y-4 shadow-2xl text-[#F8FAFC]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#D4AF37] font-bold uppercase">Kitchen Order Dispatch</span>
                <h3 className="font-serif font-bold text-xl text-[#F8FAFC]">Ticket {selectedTicketForDetail.id}</h3>
                <p className="text-xs text-[#94A3B8]">
                  Customer: {selectedTicketForDetail.customerName} • {selectedTicketForDetail.deliveryType}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicketForDetail(null)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Ordered Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-[#D4AF37]">Ordered Products</h4>
              <div className="bg-[#243244] p-3 rounded-2xl border border-white/10 space-y-2">
                {selectedTicketForDetail.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-bold text-[#F8FAFC]">
                    <span>
                      {it.quantity}x {it.menuItem.name}
                    </span>
                    <span className="text-[#D4AF37]">{it.menuItem.price * it.quantity} ETB</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingredients Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-[#D4AF37]">
                Ingredients Deducted from Live Inventory Balance
              </h4>
              <div className="bg-[#243244] p-3 rounded-2xl border border-white/10 space-y-2 max-h-48 overflow-y-auto">
                {getOrderIngredientsBreakdown(selectedTicketForDetail).map((ing, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs pb-1.5 border-b border-white/5 last:border-0">
                    <div>
                      <span className="font-bold text-[#F8FAFC] block">{ing.name}</span>
                      <span className="text-[10px] text-[#94A3B8]">
                        Available in Store: <strong className="text-emerald-400">{ing.stockAvailable} {ing.unit}</strong>
                      </span>
                    </div>
                    <span className="font-black text-red-400">
                      -{ing.qtyNeeded} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {selectedTicketForDetail.status === 'Preparing' && (
                <button
                  onClick={() => {
                    handleMarkReady(selectedTicketForDetail.id);
                    setSelectedTicketForDetail(null);
                  }}
                  className="flex-1 h-11 bg-[#22C55E] hover:bg-[#16A34A] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={16} /> Mark Ready & Deduct Stock
                </button>
              )}
              <button
                onClick={() => setSelectedTicketForDetail(null)}
                className="flex-1 h-11 bg-[#243244] text-[#CBD5E1] rounded-xl text-xs font-bold border border-white/10 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Request Detail Modal */}
      {selectedRequestForDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1E293B] border border-white/10 rounded-[28px] max-w-lg w-full p-6 space-y-4 shadow-2xl text-[#F8FAFC]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#D4AF37] font-bold uppercase">Store Requisition Voucher</span>
                <h3 className="font-mono font-bold text-xl text-[#F8FAFC]">{selectedRequestForDetail.voucherId}</h3>
                <p className="text-xs text-[#94A3B8]">
                  Date: {selectedRequestForDetail.date} at {selectedRequestForDetail.createdTime}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequestForDetail(null)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#243244] p-3 rounded-2xl border border-white/10">
              <div>
                <span className="text-[10px] text-[#94A3B8] block">Issuing Source Store</span>
                <span className="font-bold text-[#F8FAFC]">{selectedRequestForDetail.targetStore}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] block">Requesting Station</span>
                <span className="font-bold text-[#D4AF37]">
                  {selectedRequestForDetail.requestingStore || selectedRequestForDetail.department}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] block">Requested By</span>
                <span className="font-bold text-[#F8FAFC]">{selectedRequestForDetail.requestedBy}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] block">Status</span>
                <span className="font-bold text-amber-400">{selectedRequestForDetail.status}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-[#D4AF37]">Requested Raw Materials</h4>
              <div className="bg-[#243244] p-3 rounded-2xl border border-white/10 space-y-2 max-h-48 overflow-y-auto">
                {selectedRequestForDetail.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs pb-1.5 border-b border-white/5 last:border-0">
                    <div>
                      <span className="font-bold text-[#F8FAFC] block">{it.ingredientName}</span>
                      <span className="text-[10px] text-[#94A3B8]">SKU: {it.sku}</span>
                    </div>
                    <span className="font-bold text-[#D4AF37] font-mono">
                      {it.qtyRequested} {it.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedRequestForDetail.remark && (
              <p className="text-xs text-[#94A3B8] italic bg-[#243244] p-3 rounded-xl border border-white/5">
                Remark: "{selectedRequestForDetail.remark}"
              </p>
            )}

            <button
              onClick={() => setSelectedRequestForDetail(null)}
              className="w-full h-11 bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] rounded-xl text-xs font-bold border border-white/10 cursor-pointer transition-all"
            >
              Close Voucher View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
