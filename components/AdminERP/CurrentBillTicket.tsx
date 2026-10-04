import React, { useState, useEffect } from 'react';
import { MenuItem, InventoryItem } from '../../types';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Coins,
  CreditCard,
  Building2,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Upload,
  User,
  Tag,
  Percent,
  Calculator,
  Bookmark,
  Sparkles,
  Utensils,
  Layers,
  Printer,
  ChevronDown,
  ChevronUp,
  Banknote,
} from 'lucide-react';

export interface CartItem {
  item: MenuItem;
  qty: number;
  substitutedIngredient?: string;
  notes?: string;
}

export interface HeldTicket {
  id: string;
  orderType: 'Dine-In' | 'Takeaway' | 'Delivery';
  tableNumber: string;
  customerName: string;
  cashierName: string;
  waiterName: string;
  items: CartItem[];
  savedAt: string;
  discountPercent: number;
  customDiscountEtb: number;
  vatRate: number;
}

interface CurrentBillTicketProps {
  cart: CartItem[];
  onUpdateQty: (id: string, delta: number, substitutedIngredient?: string) => void;
  onRemoveItem: (id: string, substitutedIngredient?: string) => void;
  onUpdateItemNotes: (id: string, notes: string, substitutedIngredient?: string) => void;
  onClearCart: () => void;
  onCheckout: (checkoutData: {
    orderType: 'Dine-In' | 'Takeaway' | 'Delivery';
    tableNumber: string;
    customerName: string;
    cashierName: string;
    waiterName: string;
    paymentType: 'Cash' | 'Card' | 'Bank Transfer' | 'Telebirr' | 'Split Payment';
    selectedBank: string;
    accountOrPhone: string;
    amountTendered: number;
    splitCashAmount?: number;
    splitSecondaryMethod?: 'Telebirr' | 'Bank Transfer' | 'Card';
    splitSecondaryAmount?: number;
    slipPhoto: string;
    subtotal: number;
    discountAmount: number;
    tax: number;
    grandTotal: number;
    isPrintReceipt?: boolean;
    storeName?: string;
  }) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  cashierName: string;
  setCashierName: (name: string) => void;
  activeStoreName?: string;
  availableStores?: string[];
  onSelectStore?: (store: string) => void;
  onCloseMobile?: () => void;
  onCloseTicket?: () => void;
}

export const CurrentBillTicket: React.FC<CurrentBillTicketProps> = ({
  cart,
  onUpdateQty,
  onRemoveItem,
  onUpdateItemNotes,
  onClearCart,
  onCheckout,
  customerName,
  setCustomerName,
  cashierName,
  setCashierName,
  activeStoreName = 'Bole Main Central Store',
  availableStores = [],
  onSelectStore,
  onCloseMobile,
  onCloseTicket,
}) => {
  // Order Settings
  const [orderType, setOrderType] = useState<'Dine-In' | 'Takeaway' | 'Delivery'>('Dine-In');
  const [tableNumber, setTableNumber] = useState<string>('Table 1');
  const [waiterName, setWaiterName] = useState<string>('Abebe Server');
  const [selectedStore, setSelectedStore] = useState<string>(activeStoreName || 'Bole Main Central Store');
  const [editingItemNoteId, setEditingItemNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  // Keep selectedStore synced if activeStoreName prop changes
  useEffect(() => {
    if (activeStoreName && activeStoreName !== 'ALL') {
      setSelectedStore(activeStoreName);
    }
  }, [activeStoreName]);

  // Discount & Tax Settings
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscountEtb, setCustomDiscountEtb] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(5); // 0, 5%, 15%
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);

  // Payment State
  const [paymentType, setPaymentType] = useState<'Cash' | 'Card' | 'Bank Transfer' | 'Telebirr' | 'Split Payment'>('Cash');
  const [selectedBank, setSelectedBank] = useState('Commercial Bank of Ethiopia (CBE)');
  const [accountOrPhone, setAccountOrPhone] = useState('');
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const [slipPhoto, setSlipPhoto] = useState<string>('');

  // Split Payment specifics
  const [splitCashAmount, setSplitCashAmount] = useState<number>(0);
  const [splitSecondaryMethod, setSplitSecondaryMethod] = useState<'Telebirr' | 'Bank Transfer' | 'Card'>('Telebirr');

  // Keypad View Mode: 'banknotes' | 'keypad'
  const [cashInputMode, setCashInputMode] = useState<'banknotes' | 'keypad'>('banknotes');

  // Held Tickets Storage (Draft Bills)
  const [heldTickets, setHeldTickets] = useState<HeldTicket[]>([]);
  const [showHeldTicketsModal, setShowHeldTicketsModal] = useState<boolean>(false);

  const ethiopianBanks = [
    'Commercial Bank of Ethiopia (CBE)',
    'Awash Bank S.C.',
    'Bank of Abyssinia (BOA)',
    'Dashen Bank',
    'Hibret Bank',
    'Nib International Bank',
    'Cooperative Bank of Oromia (Coop)',
    'Zemen Bank',
  ];

  const quickTables = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'VIP 1', 'VIP 2'];
  const quickNotesPresets = ['No Sugar (ያለ ስኳር)', 'Hot (በጣም የሞቀ)', 'Less Ice (በረዶ የቀነሰ)', 'Extra Shot (እጥፍ)', 'Takeaway Pack'];

  // Financial Calculations
  const rawSubtotal = cart.reduce((sum, c) => sum + c.item.price * c.qty, 0);
  const percentDiscountAmount = discountPercent > 0 ? Math.round((rawSubtotal * discountPercent) / 100) : 0;
  const totalDiscount = Math.min(rawSubtotal, percentDiscountAmount + customDiscountEtb);
  const discountedSubtotal = Math.max(0, rawSubtotal - totalDiscount);
  const tax = Math.round((discountedSubtotal * vatRate) / 100);
  const grandTotal = discountedSubtotal + tax;
  const totalItemCount = cart.reduce((sum, c) => sum + c.qty, 0);

  // Cash change logic
  const effectiveTendered = paymentType === 'Cash' ? amountTendered : paymentType === 'Split Payment' ? splitCashAmount : grandTotal;
  const changeDue = effectiveTendered > (paymentType === 'Split Payment' ? splitCashAmount : grandTotal) ? effectiveTendered - grandTotal : 0;
  const remainingDue = grandTotal > effectiveTendered ? grandTotal - effectiveTendered : 0;

  // Keypad handlers for Numpad
  const handleNumpadInput = (char: string) => {
    let currentStr = amountTendered === 0 ? '' : amountTendered.toString();
    if (char === 'CLEAR') {
      setAmountTendered(0);
      return;
    }
    if (char === 'BACK') {
      currentStr = currentStr.slice(0, -1);
      setAmountTendered(currentStr === '' ? 0 : parseFloat(currentStr) || 0);
      return;
    }
    if (char === 'EXACT') {
      setAmountTendered(grandTotal);
      return;
    }
    if (char === '.' && currentStr.includes('.')) return;
    if (char === '00' && (currentStr === '' || currentStr === '0')) return;

    currentStr += char;
    const num = parseFloat(currentStr);
    setAmountTendered(isNaN(num) ? 0 : num);
  };

  // Upload Slip Photo
  const handleSlipFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Hold current ticket
  const handleHoldTicket = () => {
    if (cart.length === 0) return;
    const newHeld: HeldTicket = {
      id: `DRAFT-${Math.floor(1000 + Math.random() * 9000)}`,
      orderType,
      tableNumber,
      customerName: customerName || 'Counter Guest',
      cashierName: cashierName || 'Abebe Cashier',
      waiterName,
      items: [...cart],
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      discountPercent,
      customDiscountEtb,
      vatRate,
    };
    setHeldTickets((prev) => [newHeld, ...prev]);
    onClearCart();
  };

  // Restore held ticket
  const handleRestoreHeldTicket = (t: HeldTicket) => {
    setOrderType(t.orderType);
    setTableNumber(t.tableNumber);
    setCustomerName(t.customerName);
    setCashierName(t.cashierName);
    setWaiterName(t.waiterName);
    setDiscountPercent(t.discountPercent);
    setCustomDiscountEtb(t.customDiscountEtb);
    setVatRate(t.vatRate);
    setHeldTickets((prev) => prev.filter((item) => item.id !== t.id));
    setShowHeldTicketsModal(false);
  };

  // Trigger Checkout
  const handleProceedCheckout = (isPrint: boolean = false) => {
    if (cart.length === 0) return;

    onCheckout({
      orderType,
      tableNumber: orderType === 'Dine-In' ? tableNumber : orderType,
      customerName: customerName || 'Counter Guest',
      cashierName: cashierName || 'Abebe Cashier',
      waiterName,
      paymentType,
      selectedBank,
      accountOrPhone,
      amountTendered: paymentType === 'Cash' ? (amountTendered > 0 ? amountTendered : grandTotal) : grandTotal,
      splitCashAmount: paymentType === 'Split Payment' ? splitCashAmount : undefined,
      splitSecondaryMethod: paymentType === 'Split Payment' ? splitSecondaryMethod : undefined,
      splitSecondaryAmount: paymentType === 'Split Payment' ? Math.max(0, grandTotal - splitCashAmount) : undefined,
      slipPhoto,
      subtotal: rawSubtotal,
      discountAmount: totalDiscount,
      tax,
      grandTotal,
      isPrintReceipt: isPrint,
      storeName: selectedStore,
    });
  };

  return (
    <div className="flex flex-col h-full max-h-full font-sans text-[#F8FAFC]">
      {/* 1. STICKY HEADER */}
      <div className="shrink-0 pb-3 border-b border-white/10 flex justify-between items-center bg-[#243244]">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl border border-[#D4AF37]/30">
            <ShoppingBag size={18} />
          </span>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-[#F8FAFC] leading-tight">
              Current Bill Ticket
            </h2>
            <p className="text-[11px] text-[#94A3B8]">
              {totalItemCount} items &bull; Total <strong className="text-[#D4AF37] font-mono">{grandTotal} ETB</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {heldTickets.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHeldTicketsModal(true)}
              className="px-2.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-amber-500/30 cursor-pointer"
              title="View Held Bills"
            >
              <Bookmark size={13} />
              <span>Held ({heldTickets.length})</span>
            </button>
          )}

          {cart.length > 0 && (
            <button
              type="button"
              onClick={handleHoldTicket}
              className="px-2.5 py-1.5 bg-[#1E293B] text-[#CBD5E1] border border-white/10 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Hold / Save Draft Ticket"
            >
              <Bookmark size={13} />
              <span className="hidden sm:inline">Hold</span>
            </button>
          )}

          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="px-2.5 py-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Clear Ticket Items"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {/* Close 'X' Button */}
          <button
            type="button"
            onClick={() => {
              if (onCloseMobile) {
                onCloseMobile();
              } else if (onCloseTicket) {
                onCloseTicket();
              } else {
                onClearCart();
              }
            }}
            className="p-2 bg-[#1E293B] hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-xl border border-white/10 transition-all cursor-pointer shadow-sm flex items-center justify-center"
            title="Close / Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 2. SCROLLABLE MIDDLE BODY */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
        {/* ORDER TYPE SELECTOR CHIPS */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { type: 'Dine-In' as const, label: '🍽️ Dine-In', icon: Utensils },
            { type: 'Takeaway' as const, label: '🛍️ Takeaway', icon: ShoppingBag },
            { type: 'Delivery' as const, label: '🛵 Delivery', icon: Sparkles },
          ].map((ot) => (
            <button
              key={ot.type}
              type="button"
              onClick={() => setOrderType(ot.type)}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                orderType === ot.type
                  ? 'bg-[#D4AF37] text-[#0F172A] border-[#D4AF37] shadow-sm font-black'
                  : 'bg-[#1E293B] text-[#CBD5E1] border-white/10 hover:bg-[#2F4158]'
              }`}
            >
              <span>{ot.label}</span>
            </button>
          ))}
        </div>

        {/* DINE-IN TABLE SELECTION */}
        {orderType === 'Dine-In' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] text-[#94A3B8] font-bold shrink-0">Table:</span>
            {quickTables.map((tbl) => (
              <button
                key={tbl}
                type="button"
                onClick={() => setTableNumber(tbl)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border shrink-0 transition-all cursor-pointer ${
                  tableNumber === tbl
                    ? 'bg-[#D4AF37] text-[#0F172A] border-[#D4AF37] font-black'
                    : 'bg-[#1E293B] text-[#CBD5E1] border-white/10 hover:bg-[#2F4158]'
                }`}
              >
                {tbl}
              </button>
            ))}
          </div>
        )}

        {/* STORE LOCATION ROW */}
        <div className="bg-[#1E293B]/60 p-2.5 rounded-xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Building2 size={12} className="text-[#D4AF37]" />
              <span>Deduction Store (የሚቀነስበት ስቶር)</span>
            </label>
            <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
              Inventory Linked
            </span>
          </div>
          {availableStores && availableStores.length > 0 ? (
            <select
              value={selectedStore}
              onChange={(e) => {
                const st = e.target.value;
                setSelectedStore(st);
                if (onSelectStore) onSelectStore(st);
              }}
              className="w-full bg-[#243244] text-[#F8FAFC] text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              {availableStores
                .filter((s) => s !== 'ALL' && s !== 'All')
                .map((st) => (
                  <option key={st} value={st}>
                    🏬 {st}
                  </option>
                ))}
            </select>
          ) : (
            <div className="text-xs font-bold text-slate-200 bg-[#243244] px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5">
              <Building2 size={13} className="text-[#D4AF37]" />
              <span className="truncate">{selectedStore}</span>
            </div>
          )}
        </div>

        {/* CUSTOMER & CASHIER ROW */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-[#1E293B]/40 p-2.5 rounded-xl border border-white/5">
          <div>
            <label className="text-[10px] text-[#94A3B8] block mb-0.5 font-bold">Customer</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Guest Name..."
              className="w-full bg-[#1E293B] text-white text-xs px-2 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#94A3B8] block mb-0.5 font-bold">Cashier</label>
            <input
              type="text"
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              placeholder="Cashier..."
              className="w-full bg-[#1E293B] text-white text-xs px-2 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* CART ITEMS LIST */}
        <div className="space-y-2 divide-y divide-white/5 bg-[#1E293B]/40 p-2.5 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold uppercase text-[#94A3B8] tracking-wider">
              Order Items ({cart.reduce((s, c) => s + c.qty, 0)})
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="text-center text-xs text-[#94A3B8] py-6 space-y-1.5">
              <ShoppingBag size={28} className="mx-auto text-[#94A3B8]/40" />
              <p className="font-semibold text-[#CBD5E1]">Ticket is empty</p>
              <p className="text-[10px]">Select items from menu to add</p>
            </div>
          ) : (
            cart.map((c) => {
              const itemKey = `${c.item.id}-${c.substitutedIngredient || 'orig'}`;
              return (
                <div key={itemKey} className="pt-2 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img
                        src={c.item.image}
                        alt={c.item.name}
                        className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-[#F8FAFC] block truncate">{c.item.name}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
                          <span>{c.item.price} ETB</span>
                          <span>x</span>
                          <span className="text-[#F8FAFC] font-extrabold">{c.qty}</span>
                          <span>=</span>
                          <span className="text-[#D4AF37] font-black">{c.item.price * c.qty} ETB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(c.item.id, -1, c.substitutedIngredient)}
                        className="w-6 h-6 bg-[#1E293B] text-[#F8FAFC] rounded-lg font-bold hover:bg-slate-700 flex items-center justify-center text-xs border border-white/10 cursor-pointer active:scale-95"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="font-bold text-xs text-[#F8FAFC] min-w-[18px] text-center">{c.qty}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(c.item.id, 1, c.substitutedIngredient)}
                        className="w-6 h-6 bg-[#D4AF37] text-[#0F172A] rounded-lg font-bold hover:bg-[#F6C453] flex items-center justify-center text-xs cursor-pointer active:scale-95"
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(c.item.id, c.substitutedIngredient)}
                        className="w-6 h-6 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg flex items-center justify-center text-xs border border-rose-500/20 cursor-pointer ml-1"
                        title="Remove"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {c.substitutedIngredient && (
                    <div className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-lg border border-[#D4AF37]/20 flex items-center gap-1">
                      <RefreshCw size={10} className="shrink-0" />
                      <span className="truncate">Ingredient: {c.substitutedIngredient}</span>
                    </div>
                  )}

                  {/* Note Row */}
                  <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
                    {c.notes ? (
                      <div className="flex items-center gap-1 text-emerald-400 font-medium">
                        <span>📝 {c.notes}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItemNoteId(itemKey);
                            setTempNoteText(c.notes || '');
                          }}
                          className="text-[#D4AF37] hover:underline ml-1 cursor-pointer"
                        >
                          (Edit)
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemNoteId(itemKey);
                          setTempNoteText('');
                        }}
                        className="text-[#94A3B8] hover:text-[#D4AF37] flex items-center gap-1 cursor-pointer"
                      >
                        <Tag size={10} />
                        <span>+ Add note</span>
                      </button>
                    )}
                  </div>

                  {editingItemNoteId === itemKey && (
                    <div className="p-2 bg-[#1E293B] rounded-xl border border-white/10 space-y-1.5 mt-1 animate-fadeIn">
                      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                        {quickNotesPresets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setTempNoteText(preset)}
                            className="px-2 py-0.5 bg-[#243244] hover:bg-[#2F4158] text-[9px] text-[#CBD5E1] rounded-md shrink-0 border border-white/5 cursor-pointer"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={tempNoteText}
                          onChange={(e) => setTempNoteText(e.target.value)}
                          placeholder="e.g. Less sugar / Extra hot..."
                          className="flex-1 bg-[#243244] text-white text-[11px] px-2 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-[#D4AF37]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateItemNotes(c.item.id, tempNoteText, c.substitutedIngredient);
                            setEditingItemNoteId(null);
                          }}
                          className="px-2 py-1 bg-[#D4AF37] text-[#0F172A] text-[10px] font-bold rounded-lg cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItemNoteId(null)}
                          className="px-2 py-1 bg-[#243244] text-[#CBD5E1] text-[10px] rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* DISCOUNT & VAT ACCORDION */}
        <div className="space-y-1.5 text-xs">
          <button
            type="button"
            onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
            className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 font-bold cursor-pointer"
          >
            <Percent size={12} />
            <span>{showAdvancedPricing ? 'Hide Discount & Tax Controls' : '+ Add Discount / VAT'}</span>
            {showAdvancedPricing ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showAdvancedPricing && (
            <div className="p-2.5 bg-[#1E293B] rounded-xl border border-white/10 space-y-2 text-xs animate-fadeIn">
              <div>
                <span className="text-[10px] text-[#94A3B8] font-bold block mb-1">Discount (%):</span>
                <div className="grid grid-cols-6 gap-1">
                  {[0, 5, 10, 15, 20, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercent(pct)}
                      className={`py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        discountPercent === pct
                          ? 'bg-emerald-500 text-white border-emerald-400 font-black'
                          : 'bg-[#243244] text-[#CBD5E1] border-white/5 hover:bg-[#2F4158]'
                      }`}
                    >
                      {pct === 0 ? '0%' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#94A3B8] font-bold block mb-1">VAT Rate:</span>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 5, 15].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVatRate(v)}
                      className={`py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        vatRate === v
                          ? 'bg-[#D4AF37] text-[#0F172A] border-[#D4AF37] font-black'
                          : 'bg-[#243244] text-[#CBD5E1] border-white/5 hover:bg-[#2F4158]'
                      }`}
                    >
                      {v === 0 ? 'No VAT (0%)' : v === 5 ? '5% VAT' : '15% Full VAT'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CALCULATION SUMMARY BOX */}
        <div className="space-y-1 text-xs text-[#CBD5E1] bg-[#1E293B]/70 p-3 rounded-xl border border-white/10">
          <div className="flex justify-between">
            <span className="text-[#94A3B8]">Subtotal:</span>
            <span className="font-semibold text-white">{rawSubtotal} ETB</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-amber-400 font-bold">
              <span>Discount ({discountPercent}%):</span>
              <span>-{totalDiscount} ETB</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#94A3B8]">VAT ({vatRate}%):</span>
            <span className="font-semibold text-white">{tax} ETB</span>
          </div>
          <div className="flex justify-between font-extrabold text-sm text-[#F8FAFC] pt-1.5 border-t border-white/10 items-baseline">
            <span>Grand Total:</span>
            <span className="text-lg text-[#D4AF37] font-black font-mono">{grandTotal} ETB</span>
          </div>
        </div>

        {/* PAYMENT METHOD SELECTOR */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#CBD5E1] uppercase">
            <span>Payment Method</span>
            <span className="text-[#D4AF37] text-[10px] font-bold">{paymentType}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-bold">
            {[
              { type: 'Cash' as const, label: 'Cash (በጥሬ)', icon: Coins, activeBg: 'bg-emerald-500 text-white border-emerald-400' },
              { type: 'Telebirr' as const, label: 'Telebirr (ቴሌብር)', icon: Phone, activeBg: 'bg-amber-500 text-[#0F172A] border-amber-300 font-black' },
              { type: 'Bank Transfer' as const, label: 'Bank (ባንክ)', icon: Building2, activeBg: 'bg-sky-600 text-white border-sky-400' },
              { type: 'Card' as const, label: 'Card (ካርድ)', icon: CreditCard, activeBg: 'bg-indigo-600 text-white border-indigo-400' },
              { type: 'Split Payment' as const, label: 'Split (ጥምር)', icon: Layers, activeBg: 'bg-purple-600 text-white border-purple-400' },
            ].map((pm) => (
              <button
                key={pm.type}
                type="button"
                onClick={() => {
                  setPaymentType(pm.type);
                  if (pm.type === 'Split Payment') setSplitCashAmount(Math.round(grandTotal / 2));
                }}
                className={`py-2 px-1.5 rounded-xl border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  paymentType === pm.type
                    ? `${pm.activeBg} font-extrabold shadow-md`
                    : 'bg-[#1E293B] text-[#CBD5E1] border-white/10 hover:bg-[#2F4158]'
                }`}
              >
                <pm.icon size={12} className="shrink-0" />
                <span className="truncate">{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CASH TENDERED CONTROLS */}
        {paymentType === 'Cash' && (
          <div className="p-3 bg-[#1E293B] rounded-2xl border border-emerald-500/30 space-y-2.5 text-xs animate-fadeIn shadow-inner">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Coins size={14} />
                Cash Tendered (የተቀበሉት ብር)
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAmountTendered(grandTotal)}
                  className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-bold hover:bg-emerald-500/30 cursor-pointer transition-all active:scale-95"
                >
                  Exact ({grandTotal} ETB)
                </button>

                <div className="flex bg-[#243244] p-0.5 rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => setCashInputMode('banknotes')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      cashInputMode === 'banknotes' ? 'bg-emerald-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashInputMode('keypad')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      cashInputMode === 'keypad' ? 'bg-emerald-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    Keypad
                  </button>
                </div>
              </div>
            </div>

            {/* Input Box */}
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={amountTendered === 0 ? '' : amountTendered}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setAmountTendered(isNaN(val) ? 0 : val);
                }}
                onFocus={(e) => e.target.select()}
                placeholder={`Enter received amount (${grandTotal} ETB)...`}
                className="w-full h-11 bg-[#243244] text-[#F8FAFC] placeholder-gray-500 border border-emerald-500/40 rounded-xl pl-3.5 pr-20 text-base font-extrabold text-emerald-400 focus:outline-none focus:border-emerald-400"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                {amountTendered > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmountTendered(0)}
                    className="px-2 py-1 bg-[#1E293B] hover:bg-[#2F4158] text-[10px] text-gray-300 hover:text-white rounded-md font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <span className="text-xs text-slate-400 font-bold px-1">ETB</span>
              </div>
            </div>

            {/* BANKNOTE PRESETS */}
            {cashInputMode === 'banknotes' && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                  {[50, 100, 200, 500, 1000, 2000].map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setAmountTendered(note)}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        amountTendered === note
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm font-black'
                          : 'bg-[#243244] text-[#CBD5E1] border-white/10 hover:bg-[#2F4158] hover:text-white'
                      }`}
                    >
                      {note} ETB
                    </button>
                  ))}
                </div>

                {/* Stacking Increments */}
                <div className="flex items-center gap-1 pt-1 overflow-x-auto pb-0.5 scrollbar-none">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0 mr-1">Add (+):</span>
                  {[50, 100, 200, 500, 1000].map((addVal) => (
                    <button
                      key={`add-${addVal}`}
                      type="button"
                      onClick={() => setAmountTendered((prev) => (prev || 0) + addVal)}
                      className="px-2.5 py-1 bg-[#243244] hover:bg-emerald-500/20 text-[10px] font-extrabold text-emerald-300 rounded-lg border border-white/10 shrink-0 cursor-pointer transition-all active:scale-95"
                    >
                      +{addVal}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TOUCH KEYPAD */}
            {cashInputMode === 'keypad' && (
              <div className="p-2 bg-[#243244] rounded-xl border border-white/10 space-y-1 animate-fadeIn">
                <div className="grid grid-cols-4 gap-1 text-xs font-bold">
                  {['1', '2', '3', '+50'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => (k.startsWith('+') ? setAmountTendered((prev) => prev + 50) : handleNumpadInput(k))}
                      className="h-8 bg-[#1E293B] hover:bg-[#2F4158] text-[#F8FAFC] rounded-lg border border-white/5 flex items-center justify-center font-extrabold text-xs active:scale-95 cursor-pointer"
                    >
                      {k}
                    </button>
                  ))}
                  {['4', '5', '6', '+100'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => (k.startsWith('+') ? setAmountTendered((prev) => prev + 100) : handleNumpadInput(k))}
                      className="h-8 bg-[#1E293B] hover:bg-[#2F4158] text-[#F8FAFC] rounded-lg border border-white/5 flex items-center justify-center font-extrabold text-xs active:scale-95 cursor-pointer"
                    >
                      {k}
                    </button>
                  ))}
                  {['7', '8', '9', '+500'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => (k.startsWith('+') ? setAmountTendered((prev) => prev + 500) : handleNumpadInput(k))}
                      className="h-8 bg-[#1E293B] hover:bg-[#2F4158] text-[#F8FAFC] rounded-lg border border-white/5 flex items-center justify-center font-extrabold text-xs active:scale-95 cursor-pointer"
                    >
                      {k}
                    </button>
                  ))}
                  {['.', '0', '00', 'BACK'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleNumpadInput(k)}
                      className={`h-8 rounded-lg border border-white/5 flex items-center justify-center font-extrabold text-xs active:scale-95 cursor-pointer ${
                        k === 'BACK' ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30' : 'bg-[#1E293B] hover:bg-[#2F4158] text-[#F8FAFC]'
                      }`}
                    >
                      {k === 'BACK' ? '⌫' : k}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CHANGE DUE OR REMAINING BANNER */}
            {amountTendered > 0 && (
              <div className="p-2.5 bg-[#243244] rounded-xl border border-white/10 flex justify-between items-center text-xs font-bold animate-fadeIn">
                {amountTendered >= grandTotal ? (
                  <>
                    <span className="text-[#94A3B8] flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-400" />
                      <span>Change Due (መልስ):</span>
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
                      {(amountTendered - grandTotal).toFixed(2)} ETB
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle size={15} />
                      <span>Remaining Balance:</span>
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-amber-400 font-mono">
                      {(grandTotal - amountTendered).toFixed(2)} ETB
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* SPLIT PAYMENT */}
        {paymentType === 'Split Payment' && (
          <div className="p-3 bg-[#1E293B] rounded-2xl border border-purple-500/30 space-y-2.5 text-xs animate-fadeIn">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
              Split Bill Configuration
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[#94A3B8] block mb-1">Cash Part (በጥሬ):</label>
                <input
                  type="number"
                  min="0"
                  max={grandTotal}
                  value={splitCashAmount === 0 ? '' : splitCashAmount}
                  onChange={(e) => setSplitCashAmount(Number(e.target.value) || 0)}
                  className="w-full h-10 bg-[#243244] text-white font-bold px-3 rounded-xl border border-white/10"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#94A3B8] block mb-1">Secondary Method:</label>
                <select
                  value={splitSecondaryMethod}
                  onChange={(e) => setSplitSecondaryMethod(e.target.value as any)}
                  className="w-full h-10 bg-[#243244] text-white font-bold px-2 rounded-xl border border-white/10 text-xs"
                >
                  <option value="Telebirr">Telebirr</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>
            <div className="p-2 bg-[#243244] rounded-xl flex justify-between items-center text-xs font-bold">
              <span className="text-purple-300">{splitSecondaryMethod} Balance:</span>
              <span className="text-emerald-400 font-extrabold font-mono">
                {Math.max(0, grandTotal - splitCashAmount)} ETB
              </span>
            </div>
          </div>
        )}

        {/* TELEBIRR FIELDS */}
        {paymentType === 'Telebirr' && (
          <div className="p-3 bg-[#1E293B] rounded-2xl border border-amber-500/20 space-y-2 text-xs animate-fadeIn">
            <div>
              <label className="block text-[10px] font-bold text-amber-400 uppercase mb-1">
                Telebirr Phone / Reference Code
              </label>
              <input
                type="text"
                value={accountOrPhone}
                onChange={(e) => setAccountOrPhone(e.target.value)}
                placeholder="e.g. 0911000000 (Ref: TB-9921)"
                className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="flex items-center justify-center gap-1.5 h-9 bg-[#243244] hover:bg-[#2F4158] text-amber-300 border border-amber-500/30 rounded-xl cursor-pointer font-bold text-[11px]">
                <Upload size={13} />
                <span>{slipPhoto ? 'Change Screenshot' : 'Upload Telebirr Screenshot'}</span>
                <input type="file" accept="image/*" onChange={handleSlipFileUpload} className="hidden" />
              </label>
              {slipPhoto && (
                <div className="flex items-center gap-2 mt-1">
                  <img src={slipPhoto} alt="Slip" className="w-8 h-8 object-cover rounded-lg border border-white/10" />
                  <span className="text-[10px] text-emerald-400 font-bold">Slip attached</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BANK TRANSFER FIELDS */}
        {paymentType === 'Bank Transfer' && (
          <div className="p-3 bg-[#1E293B] rounded-2xl border border-sky-500/20 space-y-2 text-xs animate-fadeIn">
            <div>
              <label className="block text-[10px] font-bold text-sky-400 uppercase mb-1">Bank Name</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-2 text-xs focus:outline-none focus:border-sky-400"
              >
                {ethiopianBanks.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] mb-1">Transaction Ref / Account</label>
              <input
                type="text"
                value={accountOrPhone}
                onChange={(e) => setAccountOrPhone(e.target.value)}
                placeholder="e.g. 100028312093 or CBE-88219"
                className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="flex items-center justify-center gap-1.5 h-9 bg-[#243244] hover:bg-[#2F4158] text-sky-300 border border-sky-500/30 rounded-xl cursor-pointer font-bold text-[11px]">
                <Upload size={13} />
                <span>{slipPhoto ? 'Change Bank Slip' : 'Upload Bank Transfer Slip'}</span>
                <input type="file" accept="image/*" onChange={handleSlipFileUpload} className="hidden" />
              </label>
              {slipPhoto && (
                <div className="flex items-center gap-2 mt-1">
                  <img src={slipPhoto} alt="Slip" className="w-8 h-8 object-cover rounded-lg border border-white/10" />
                  <span className="text-[10px] text-emerald-400 font-bold">Slip attached</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CARD FIELDS */}
        {paymentType === 'Card' && (
          <div className="p-3 bg-[#1E293B] rounded-2xl border border-indigo-500/20 space-y-1.5 text-xs animate-fadeIn">
            <label className="block text-[10px] font-bold text-indigo-400 uppercase">POS Terminal / Auth Ref</label>
            <input
              type="text"
              value={accountOrPhone}
              onChange={(e) => setAccountOrPhone(e.target.value)}
              placeholder="e.g. POS-TERM-01 (Visa/Mastercard Auth #)"
              className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-indigo-400"
            />
          </div>
        )}
      </div>

      {/* 3. STICKY FOOTER ACTION BUTTONS */}
      <div className="shrink-0 pt-3 border-t border-white/10 space-y-2 bg-[#243244]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleProceedCheckout(false)}
            disabled={cart.length === 0}
            className="h-11 bg-[#D4AF37] hover:bg-[#F6C453] disabled:opacity-40 text-[#0F172A] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            <CheckCircle2 size={16} />
            <span>Complete ({paymentType})</span>
          </button>

          <button
            type="button"
            onClick={() => handleProceedCheckout(true)}
            disabled={cart.length === 0}
            className="h-11 bg-[#1E293B] hover:bg-[#2F4158] disabled:opacity-40 text-[#F8FAFC] border border-white/15 font-bold text-xs uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            <Printer size={16} className="text-[#D4AF37]" />
            <span>Pay & Print Receipt</span>
          </button>
        </div>
      </div>

      {/* HELD TICKETS MODAL */}
      {showHeldTicketsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1E293B] border border-white/10 rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-2xl text-[#F8FAFC]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark size={18} className="text-amber-400" />
                <h3 className="font-bold text-base text-[#F8FAFC]">Held Bills / Drafts ({heldTickets.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHeldTicketsModal(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {heldTickets.map((t) => {
                const total = t.items.reduce((s, it) => s + it.item.price * it.qty, 0);
                return (
                  <div
                    key={t.id}
                    className="p-3 bg-[#243244] rounded-2xl border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-mono text-xs text-[#D4AF37] font-bold block">{t.id}</span>
                      <span className="text-xs font-bold text-white block">
                        {t.orderType} &bull; {t.tableNumber}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {t.items.length} items &bull; Saved at {t.savedAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-emerald-400">{total} ETB</span>
                      <button
                        type="button"
                        onClick={() => handleRestoreHeldTicket(t)}
                        className="px-2.5 py-1.5 bg-[#D4AF37] text-[#0F172A] text-xs font-bold rounded-xl cursor-pointer hover:bg-[#F6C453]"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
