import React, { useState } from 'react';
import { Order } from '../../types';
import { ShareReceiptButton } from '../ShareReceiptButton';
import { ProfessionalReceiptModal } from '../ProfessionalReceiptModal';
import {
  ShoppingBag,
  Calendar,
  Layers,
  Search,
  Eye,
  Printer,
  Trash2,
  X,
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface OrderVouchersERPProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onDeleteOrder: (orderId: string) => void;
}

export const OrderVouchersERP: React.FC<OrderVouchersERPProps> = ({
  orders,
  onUpdateOrderStatus,
  onDeleteOrder,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [selectedOrderForView, setSelectedOrderForView] = useState<Order | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ id: string; message: string } | null>(null);

  const categories = [
    'All',
    'Coffee',
    'Espresso',
    'Latte',
    'Cappuccino',
    'Bakery',
    'Breakfast',
    'Fresh Juice',
  ];

  // Helper to show transient feedback toast
  const triggerKitchenToast = (orderId: string, message: string) => {
    setFeedbackToast({ id: orderId, message });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  // Send single order to Kitchen (sets status to 'Preparing')
  const handleSendToKitchen = (orderId: string) => {
    onUpdateOrderStatus(orderId, 'Preparing');
    triggerKitchenToast(orderId, `Order #${orderId} successfully dispatched to Kitchen (KDS)! (ወደ ኪችን ተልኳል)`);
    if (selectedOrderForView && selectedOrderForView.id === orderId) {
      setSelectedOrderForView({
        ...selectedOrderForView,
        status: 'Preparing',
      });
    }
  };

  // Mark single order as Ready
  const handleMarkAsReady = (orderId: string) => {
    onUpdateOrderStatus(orderId, 'Ready');
    triggerKitchenToast(orderId, `Order #${orderId} marked as Ready! Stock automatically deducted. (ደርሷል)`);
    if (selectedOrderForView && selectedOrderForView.id === orderId) {
      setSelectedOrderForView({
        ...selectedOrderForView,
        status: 'Ready',
      });
    }
  };

  // Batch send all pending orders to kitchen
  const pendingOrders = orders.filter((o) => o.status === 'Pending');
  const handleSendAllPendingToKitchen = () => {
    if (pendingOrders.length === 0) return;
    pendingOrders.forEach((o) => {
      onUpdateOrderStatus(o.id, 'Preparing');
    });
    triggerKitchenToast('all', `All ${pendingOrders.length} pending orders dispatched to Kitchen! (ሁሉም ወደ ኪችን ተልከዋል)`);
  };

  // Filter logic: Filter by search, Date, Category, and Status
  const filteredOrders = orders.filter((ord) => {
    const matchSearch =
      ord.id.toLowerCase().includes(search.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(search.toLowerCase()) ||
      ord.customerPhone.includes(search);

    const matchDate = !selectedDate || ord.createdAt.startsWith(selectedDate);

    const matchCat =
      selectedCategory === 'All' ||
      ord.items.some((it) => it.menuItem.category === selectedCategory);

    const matchStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'In Kitchen' && ord.status === 'Preparing') ||
      (selectedStatus === 'Pending' && ord.status === 'Pending') ||
      (selectedStatus === 'Ready' && ord.status === 'Ready') ||
      (selectedStatus === 'Completed' && ord.status === 'Completed');

    return matchSearch && matchDate && matchCat && matchStatus;
  });

  const totalSalesVolume = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Toast Banner */}
      {feedbackToast && (
        <div className="fixed top-20 right-5 z-50 bg-[#0F172A] border-2 border-[#D4AF37] text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideIn">
          <div className="p-2 bg-[#D4AF37] text-[#0F172A] rounded-xl font-black">
            <ChefHat size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-[#D4AF37] block">
              Kitchen Dispatch Update
            </span>
            <span className="text-xs font-bold text-[#F8FAFC]">{feedbackToast.message}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="p-1 text-gray-400 hover:text-white rounded-lg ml-2"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
            Sales & Orders Audit & Kitchen Dispatch
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1 flex items-center gap-2">
            <ShoppingBag className="text-[#D4AF37]" size={28} />
            Order Vouchers & Sales Breakdown (Order Vouchers)
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Filter, inspect total placed product orders, and dispatch tickets directly to the Kitchen Display System (ወደ ኪችን ላክ).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {pendingOrders.length > 0 && (
            <button
              onClick={handleSendAllPendingToKitchen}
              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-102"
            >
              <ChefHat size={16} />
              <span>Send All ({pendingOrders.length}) to Kitchen (ሁሉንም ወደ ኪችን ላክ)</span>
            </button>
          )}

          <div className="bg-[#243244] p-3 px-5 rounded-2xl border border-white/10 shadow-md flex items-center gap-3">
            <div>
              <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">Filtered Sales Volume</span>
              <span className="text-lg font-extrabold text-[#D4AF37]">{totalSalesVolume.toLocaleString()} ETB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar: Date, Category & Status Selectors */}
      <div className="bg-[#243244] p-4 rounded-[22px] border border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, customer name, phone..."
            className="w-full h-11 bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-10 pr-3 text-xs focus:outline-none focus:border-[#D4AF37]"
          />
          <Search size={16} className="absolute left-3.5 top-3.5 text-[#94A3B8]" />
        </div>

        {/* Date Filter (Beken Filter) */}
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full h-11 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-xl pl-10 pr-3 text-xs focus:outline-none focus:border-[#D4AF37]"
          />
          <Calendar size={16} className="absolute left-3.5 top-3.5 text-[#D4AF37]" />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-11 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-xl pl-10 pr-3 text-xs focus:outline-none focus:border-[#D4AF37]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>
          <Layers size={16} className="absolute left-3.5 top-3.5 text-[#D4AF37]" />
        </div>

        {/* Kitchen / Order Status Filter */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full h-11 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-xl pl-10 pr-3 text-xs focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="All">All Statuses (ሁሉንም)</option>
            <option value="Pending">Pending (ያልተላከ)</option>
            <option value="In Kitchen">In Kitchen / Preparing (ኪችን ውስጥ)</option>
            <option value="Ready">Ready (የደረሰ)</option>
            <option value="Completed">Completed (ያለቀ)</option>
          </select>
          <ChefHat size={16} className="absolute left-3.5 top-3.5 text-[#D4AF37]" />
        </div>
      </div>

      {/* Orders Vouchers Grid with Photos, Prices & Kitchen Dispatch Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-[#94A3B8] bg-[#243244] rounded-[24px] border border-white/10">
            No order vouchers matched your date, status, or category filter.
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isPending = ord.status === 'Pending';
            const isPreparing = ord.status === 'Preparing';
            const isReady = ord.status === 'Ready';
            const isCompleted = ord.status === 'Completed';

            return (
              <div
                key={ord.id}
                className="bg-[#243244] p-5 rounded-[22px] border border-white/10 shadow-md space-y-4 hover:border-[#D4AF37]/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#D4AF37]">{ord.id}</span>
                      <h3 className="font-serif font-bold text-sm text-[#F8FAFC]">{ord.customerName}</h3>
                      <span className="text-[10px] text-[#94A3B8]">{ord.customerPhone}</span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          isReady || isCompleted
                            ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                            : isPreparing
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {isPreparing && <Flame size={12} className="animate-pulse text-amber-400" />}
                        {isReady && <CheckCircle2 size={12} />}
                        {ord.status === 'Preparing'
                          ? 'In Kitchen (ኪችን ውስጥ)'
                          : ord.status === 'Pending'
                          ? 'Pending (ያልተላከ)'
                          : ord.status}
                      </span>
                    </div>
                  </div>

                  {/* Ordered Items List with Product Photos & Prices */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {ord.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2 bg-[#1E293B] rounded-xl border border-white/5 text-xs"
                      >
                        <img
                          src={it.menuItem.image}
                          alt={it.menuItem.name}
                          className="w-11 h-11 object-cover rounded-lg shrink-0 border border-white/10"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-[#F8FAFC] block truncate">{it.menuItem.name}</span>
                          <span className="text-[10px] text-[#94A3B8]">
                            {it.quantity}x @ {it.menuItem.price} ETB ({it.menuItem.category})
                          </span>
                        </div>
                        <span className="font-extrabold text-[#D4AF37] text-xs shrink-0">
                          {it.quantity * it.menuItem.price} ETB
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs text-[#CBD5E1]">
                    <span>Date: {new Date(ord.createdAt).toLocaleDateString()}</span>
                    <span className="font-extrabold text-base text-[#22C55E]">{ord.total} ETB</span>
                  </div>
                </div>

                {/* Action Buttons: Send to Kitchen, View, Delete */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  {/* Primary Kitchen Dispatch Action Button */}
                  {isPending && (
                    <button
                      onClick={() => handleSendToKitchen(ord.id)}
                      className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <ChefHat size={16} />
                      <span>Send to Kitchen (ወደ ኪችን ላክ)</span>
                    </button>
                  )}

                  {isPreparing && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMarkAsReady(ord.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Check size={15} /> Mark Ready (ደርሷል)
                      </button>
                      <button
                        onClick={() => handleSendToKitchen(ord.id)}
                        className="px-2.5 py-2 bg-[#1E293B] hover:bg-[#2F4158] text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="Re-send alert to Kitchen"
                      >
                        <RotateCcw size={13} /> Re-send
                      </button>
                    </div>
                  )}

                  {(isReady || isCompleted) && (
                    <button
                      onClick={() => handleSendToKitchen(ord.id)}
                      className="w-full py-2 bg-[#1E293B] hover:bg-[#2F4158] text-[#CBD5E1] hover:text-white border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={14} className="text-[#D4AF37]" />
                      <span>Re-send to Kitchen (እንደገና ወደ ኪችን ላክ)</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrderForView(ord)}
                      className="flex-1 py-2 bg-[#1E293B] hover:bg-[#D4AF37] hover:text-[#0F172A] text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye size={14} /> View Ticket
                    </button>
                    <button
                      onClick={() => onDeleteOrder(ord.id)}
                      className="p-2 bg-[#1E293B] hover:bg-red-500 hover:text-white text-gray-400 rounded-xl transition-all cursor-pointer"
                      title="Delete Order"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View Order Voucher Ticket Modal */}
      {selectedOrderForView && (
        <ProfessionalReceiptModal
          receiptData={{
            title: 'Order Processing Ticket',
            voucherId: selectedOrderForView.id,
            storeName: 'Main Restaurant / Dining',
            customerOrRecipient: `${selectedOrderForView.customerName} (${selectedOrderForView.customerPhone})`,
            date: new Date(selectedOrderForView.createdAt).toLocaleDateString(),
            time: new Date(selectedOrderForView.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            paymentMethod: selectedOrderForView.paymentMethod,
            subtotal: selectedOrderForView.subtotal || selectedOrderForView.total,
            tax: selectedOrderForView.tax || 0,
            serviceCharge: selectedOrderForView.serviceCharge || 0,
            deliveryFee: selectedOrderForView.deliveryFee || 0,
            total: selectedOrderForView.total,
            items: selectedOrderForView.items.map((it) => ({
              name: it.menuItem.name,
              qty: it.quantity,
              unit: 'pcs',
              unitPrice: it.menuItem.price,
              priceOrCost: it.quantity * it.menuItem.price,
              notes: it.specialInstructions,
            })),
            extraDetails: `Status: ${selectedOrderForView.status} | Order Type: ${selectedOrderForView.orderType || 'Dine-In'}${
              selectedOrderForView.tableNumber ? ` | Table: ${selectedOrderForView.tableNumber}` : ''
            }`,
            notesOrRemarks: selectedOrderForView.specialInstructions,
          }}
          onClose={() => setSelectedOrderForView(null)}
          customActions={
            selectedOrderForView.status !== 'Preparing' ? (
              <button
                type="button"
                onClick={() => handleSendToKitchen(selectedOrderForView.id)}
                className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer min-h-[42px]"
              >
                <ChefHat size={16} />
                <span>Send to Kitchen (ትዕዛዝ ላክ)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleMarkAsReady(selectedOrderForView.id)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer min-h-[42px]"
              >
                <CheckCircle2 size={16} />
                <span>Mark Ready (ደርሷል)</span>
              </button>
            )
          }
        />
      )}
    </div>
  );
};

