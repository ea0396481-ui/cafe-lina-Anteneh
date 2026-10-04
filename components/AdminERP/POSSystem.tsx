import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, InventoryItem, POSReceiptVoucher, Order, OrderItem, StoreRecord } from '../../types';
import { CurrentBillTicket, CartItem } from './CurrentBillTicket';
import { ShareReceiptButton } from '../ShareReceiptButton';
import { ProfessionalReceiptModal } from '../ProfessionalReceiptModal';
import {
  Search,
  Barcode,
  Printer,
  CheckCircle2,
  ShoppingBag,
  X,
  AlertTriangle,
  RefreshCw,
  Upload,
  Receipt,
  Eye,
  Trash2,
  Edit,
  CreditCard,
  Building2,
  Store,
  Layers,
  Phone,
  DollarSign,
  Plus,
  Filter,
  Calendar,
  User,
  Coins,
  Image as ImageIcon,
  Check,
  ChevronRight,
  Bookmark,
  Clock,
  Utensils,
  Minus,
  Tag,
  UserCheck,
  ChevronDown,
  Edit3,
  Cloud,
} from 'lucide-react';

interface POSSystemProps {
  menuItems: MenuItem[];
  inventory: InventoryItem[];
  stores?: StoreRecord[];
  posReceipts: POSReceiptVoucher[];
  onCompletePOSOrder: (order: Order) => void;
  onSavePOSReceipt: (receipt: POSReceiptVoucher) => void;
  onUpdatePOSReceipt: (receipt: POSReceiptVoucher) => void;
  onDeletePOSReceipt: (voucherId: string) => void;
}

export const POSSystem: React.FC<POSSystemProps> = ({
  menuItems,
  inventory,
  stores = [],
  posReceipts,
  onCompletePOSOrder,
  onSavePOSReceipt,
  onUpdatePOSReceipt,
  onDeletePOSReceipt,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'terminal' | 'vouchers'>('terminal');

  // Payment State for Terminal
  const [paymentType, setPaymentType] = useState<'Cash' | 'Card' | 'Bank Transfer' | 'Telebirr'>('Cash');
  const [customerName, setCustomerName] = useState('Counter Guest');
  const [cashierName, setCashierName] = useState('Abebe Cashier');
  const [selectedBank, setSelectedBank] = useState('Commercial Bank of Ethiopia (CBE)');
  const [accountOrPhone, setAccountOrPhone] = useState('');
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const [slipPhoto, setSlipPhoto] = useState<string>('');

  // Missing Ingredient Modal State
  const [missingIngModalItem, setMissingIngModalItem] = useState<{
    item: MenuItem;
    missingName: string;
    requiredQty: number;
    availableQty: number;
    unit: string;
  } | null>(null);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string>('');

  // Registry Filter & Search State
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'All' | 'Cash' | 'Card' | 'Bank Transfer' | 'Telebirr'>('All');
  const [registrySearch, setRegistrySearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCashier, setFilterCashier] = useState('All');
  const [filterIngredientStatus, setFilterIngredientStatus] = useState<'All' | 'Fully Available' | 'Substituted' | 'Sold with Current Stock'>('All');

  // Modals & Drawers
  const [receiptModal, setReceiptModal] = useState<POSReceiptVoucher | null>(null);
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<POSReceiptVoucher | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<POSReceiptVoucher | null>(null);
  const [zoomSlipUrl, setZoomSlipUrl] = useState<string | null>(null);
  const [isRegisterNewModalOpen, setIsRegisterNewModalOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Manual New Voucher Registration State
  const [newVoucherForm, setNewVoucherForm] = useState<{
    customerName: string;
    cashierName: string;
    storeName: string;
    date: string;
    createdTime: string;
    paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Telebirr';
    accountNumberOrPhone: string;
    selectedItems: { menuItemId: string; quantity: number }[];
    amountReceived: number;
    slipPhotoUrl: string;
    mainIngredientStatus: 'Fully Available' | 'Substituted' | 'Sold with Current Stock';
    notes: string;
  }>({
    customerName: 'Counter Guest',
    cashierName: 'Abebe Cashier',
    storeName: 'Bole Main Central Store',
    date: new Date().toISOString().split('T')[0],
    createdTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    paymentMethod: 'Cash',
    accountNumberOrPhone: '',
    selectedItems: [{ menuItemId: menuItems[0]?.id || '1', quantity: 1 }],
    amountReceived: 0,
    slipPhotoUrl: '',
    mainIngredientStatus: 'Fully Available',
    notes: '',
  });

  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('All');

  const categories = ['All', 'Coffee', 'Espresso', 'Latte', 'Cappuccino', 'Bakery', 'Breakfast', 'Fresh Juice'];
  const priceRanges = [
    { label: 'All Prices', min: 0, max: Infinity },
    { label: '< 100 ETB', min: 0, max: 99.99 },
    { label: '100 - 200 ETB', min: 100, max: 200 },
    { label: '201 - 350 ETB', min: 201, max: 350 },
    { label: '> 350 ETB', min: 350.01, max: Infinity },
  ];
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

  const filteredMenuItems = useMemo(() => {
    const rawSearch = search.trim().toLowerCase();
    const barcodeQ = barcodeInput.trim().toLowerCase();

    // Check for price comparison patterns: e.g. "<200", "<=150", ">100", ">=300", "100-200", "100 to 200"
    let operatorPriceFilter: ((price: number) => boolean) | null = null;

    if (rawSearch.startsWith('<=')) {
      const val = parseFloat(rawSearch.slice(2).replace(/[^\d.]/g, ''));
      if (!isNaN(val)) operatorPriceFilter = (p) => p <= val;
    } else if (rawSearch.startsWith('<')) {
      const val = parseFloat(rawSearch.slice(1).replace(/[^\d.]/g, ''));
      if (!isNaN(val)) operatorPriceFilter = (p) => p < val;
    } else if (rawSearch.startsWith('>=')) {
      const val = parseFloat(rawSearch.slice(2).replace(/[^\d.]/g, ''));
      if (!isNaN(val)) operatorPriceFilter = (p) => p >= val;
    } else if (rawSearch.startsWith('>')) {
      const val = parseFloat(rawSearch.slice(1).replace(/[^\d.]/g, ''));
      if (!isNaN(val)) operatorPriceFilter = (p) => p > val;
    } else if (rawSearch.includes('-') && /^\d+\s*-\s*\d+/.test(rawSearch)) {
      const parts = rawSearch.split('-').map((s) => parseFloat(s.replace(/[^\d.]/g, '')));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        operatorPriceFilter = (p) => p >= parts[0] && p <= parts[1];
      }
    } else if (rawSearch.includes(' to ') && /^\d+\s+to\s+\d+/.test(rawSearch)) {
      const parts = rawSearch.split(' to ').map((s) => parseFloat(s.replace(/[^\d.]/g, '')));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        operatorPriceFilter = (p) => p >= parts[0] && p <= parts[1];
      }
    }

    // Clean search text without currency labels
    const cleanSearch = rawSearch.replace(/\s*(etb|birr|\$)\s*/gi, '').trim();
    const isPureNumber = /^\d+(\.\d+)?$/.test(cleanSearch);
    const parsedNumber = isPureNumber ? parseFloat(cleanSearch) : null;

    // Price range pill check
    const currentPriceRangeObj = priceRanges.find((r) => r.label === selectedPriceRange);

    return menuItems.filter((i) => {
      // 1. Category Filter
      const matchCat = selectedCategory === 'All' || i.category === selectedCategory;
      if (!matchCat) return false;

      // 2. Price Range Pill Filter
      if (currentPriceRangeObj && selectedPriceRange !== 'All') {
        if (i.price < currentPriceRangeObj.min || i.price > currentPriceRangeObj.max) {
          return false;
        }
      }

      // 3. Barcode Box Filter
      if (barcodeQ && (!i.barcode || !i.barcode.toLowerCase().includes(barcodeQ))) {
        return false;
      }

      // If no text search, matches category & price pill
      if (!rawSearch) return true;

      // 4. Operator Price Filter (e.g. "<200", "100-200")
      if (operatorPriceFilter) {
        return operatorPriceFilter(i.price);
      }

      // 5. Product Name Match (case-insensitive)
      const matchName = i.name.toLowerCase().includes(rawSearch);

      // 6. Product Price Match (by number, string representation, or partial digits)
      const priceString = i.price.toString();
      const matchExactPrice = parsedNumber !== null && Math.abs(i.price - parsedNumber) < 0.01;
      const matchPriceSubstring = priceString.includes(cleanSearch) || `${i.price} etb`.includes(rawSearch) || `${i.price} birr`.includes(rawSearch);

      // 7. Category or Description Match
      const matchCategory = (i.category || '').toLowerCase().includes(rawSearch);
      const matchDescription = (i.description || '').toLowerCase().includes(rawSearch);
      const matchBarcodeInSearch = i.barcode ? i.barcode.toLowerCase().includes(rawSearch) : false;
      const matchIngredients = i.ingredients ? i.ingredients.some((ing) => ing.toLowerCase().includes(rawSearch)) : false;

      return (
        matchName ||
        matchExactPrice ||
        matchPriceSubstring ||
        matchCategory ||
        matchDescription ||
        matchBarcodeInSearch ||
        matchIngredients
      );
    });
  }, [menuItems, selectedCategory, selectedPriceRange, search, barcodeInput]);

  // Calculate Cart Figures
  const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + tax;
  const totalItemCount = cart.reduce((sum, c) => sum + c.qty, 0);
  const changeDue = amountTendered > grandTotal ? amountTendered - grandTotal : 0;

  // Helper to get the Main Ingredient and its Store for a given product
  const getProductMainIngredientInfo = (item: MenuItem) => {
    // 1. If recipeIngredients exist
    if (item.recipeIngredients && item.recipeIngredients.length > 0) {
      const mainRecipe = item.recipeIngredients.find((r) => r.isMainIngredient) || item.recipeIngredients[0];
      const matchedInv = inventory.find(
        (inv) =>
          inv.id === mainRecipe.inventoryId ||
          (mainRecipe.sku && inv.sku === mainRecipe.sku) ||
          inv.name.toLowerCase().trim() === mainRecipe.ingredientName.toLowerCase().trim()
      );
      const resolvedStore = mainRecipe.storeName || matchedInv?.storeName || 'Bole Main Central Store';
      return {
        ingredientName: mainRecipe.ingredientName,
        sku: mainRecipe.sku || matchedInv?.sku || '',
        qty: mainRecipe.qty,
        unit: mainRecipe.unit || matchedInv?.unit || 'kg',
        storeName: resolvedStore.trim(),
        matchedInv,
        isMain: true,
      };
    }

    // 2. If ingredients array exists
    if (item.ingredients && item.ingredients.length > 0) {
      const mainName = item.ingredients[0];
      const matchedInv = inventory.find(
        (inv) =>
          inv.name.toLowerCase().includes(mainName.toLowerCase()) ||
          mainName.toLowerCase().includes(inv.name.toLowerCase()) ||
          (item.category.toLowerCase().includes('coffee') && inv.category.toLowerCase().includes('coffee'))
      );
      const resolvedStore = matchedInv?.storeName || (item.category === 'Bakery' ? 'Kazanchis Bakery Lab & Cold Room' : 'Bole Main Central Store');
      return {
        ingredientName: mainName,
        sku: matchedInv?.sku || '',
        qty: 0.02,
        unit: matchedInv?.unit || 'kg',
        storeName: resolvedStore.trim(),
        matchedInv,
        isMain: true,
      };
    }

    return {
      ingredientName: 'Standard Raw Ingredient',
      sku: '',
      qty: 1,
      unit: 'units',
      storeName: 'Bole Main Central Store',
      matchedInv: undefined,
      isMain: true,
    };
  };

  // Available unique stores from stores prop, inventory, and menu recipes
  const availableStores = useMemo(() => {
    const storeNames = new Set<string>();
    if (stores && stores.length > 0) {
      stores.forEach((s) => {
        if (s.name && s.name.trim()) storeNames.add(s.name.trim());
      });
    }
    inventory.forEach((inv) => {
      if (inv.storeName && inv.storeName.trim()) storeNames.add(inv.storeName.trim());
    });
    menuItems.forEach((m) => {
      if (m.recipeIngredients) {
        m.recipeIngredients.forEach((r) => {
          if (r.storeName && r.storeName.trim()) storeNames.add(r.storeName.trim());
        });
      }
    });

    if (storeNames.size === 0) {
      storeNames.add('Bole Main Central Store');
      storeNames.add('Kazanchis Bakery Lab & Cold Room');
      storeNames.add('Kitchen & Bakery Sub-Store');
    }

    return Array.from(storeNames);
  }, [stores, inventory, menuItems]);

  // Product Counts per Store based on Main Ingredient Location
  const storeProductCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: menuItems.length };
    availableStores.forEach((st) => {
      counts[st] = 0;
    });

    menuItems.forEach((item) => {
      const info = getProductMainIngredientInfo(item);
      const sName = info.storeName;
      if (counts[sName] !== undefined) {
        counts[sName] = (counts[sName] || 0) + 1;
      } else {
        counts[sName] = 1;
      }
    });

    return counts;
  }, [menuItems, availableStores, inventory]);

  // Check Main Ingredient Availability
  const addToCartWithCheck = (item: MenuItem) => {
    const info = getProductMainIngredientInfo(item);
    const matchedInv = info.matchedInv || inventory.find(
      (inv) =>
        (selectedStoreFilter !== 'ALL' ? inv.storeName?.toLowerCase().trim() === selectedStoreFilter.toLowerCase().trim() : true) &&
        (inv.name.toLowerCase().includes(info.ingredientName.toLowerCase()) || info.ingredientName.toLowerCase().includes(inv.name.toLowerCase()))
    );

    const requiredQtyPerUnit = info.qty || 0.02;
    const currentCartQty = cart.filter((c) => c.item.id === item.id).reduce((s, c) => s + c.qty, 0);
    const totalRequired = (currentCartQty + 1) * requiredQtyPerUnit;
    const stockAvailable = matchedInv ? matchedInv.stockQty : 0;

    if (matchedInv && stockAvailable < totalRequired) {
      setMissingIngModalItem({
        item,
        missingName: `${info.ingredientName} (${info.storeName})`,
        requiredQty: totalRequired,
        availableQty: stockAvailable,
        unit: matchedInv ? matchedInv.unit : info.unit || 'kg',
      });
      setSelectedSubstituteId('');
      return;
    }

    // Add directly to cart
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id && !c.substitutedIngredient);
      if (existing) {
        return prev.map((c) => (c.item.id === item.id && !c.substitutedIngredient ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const handleConfirmSubstitute = () => {
    if (!missingIngModalItem || !selectedSubstituteId) return;
    const substItem = inventory.find((i) => i.id === selectedSubstituteId);
    if (!substItem) return;

    setCart((prev) => [
      ...prev,
      {
        item: missingIngModalItem.item,
        qty: 1,
        substitutedIngredient: substItem.name,
      },
    ]);

    setMissingIngModalItem(null);
  };

  const handleForceSellCurrentStock = () => {
    if (!missingIngModalItem) return;
    setCart((prev) => [
      ...prev,
      {
        item: missingIngModalItem.item,
        qty: 1,
        substitutedIngredient: 'Current Partial Stock',
      },
    ]);
    setMissingIngModalItem(null);
  };

  const updateQty = (id: string, delta: number, substitutedIngredient?: string) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === id && c.substitutedIngredient === substitutedIngredient) {
            const newQty = c.qty + delta;
            return newQty > 0 ? { ...c, qty: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (id: string, substitutedIngredient?: string) => {
    setCart((prev) => prev.filter((c) => !(c.item.id === id && c.substitutedIngredient === substitutedIngredient)));
  };

  const updateItemNotes = (id: string, notes: string, substitutedIngredient?: string) => {
    setCart((prev) =>
      prev.map((c) =>
        c.item.id === id && c.substitutedIngredient === substitutedIngredient ? { ...c, notes } : c
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Upload Slip Photo
  const handleSlipFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mode: 'terminal' | 'edit' | 'manualNew') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (mode === 'terminal') setSlipPhoto(base64);
        if (mode === 'edit' && editingVoucher) setEditingVoucher({ ...editingVoucher, slipPhotoUrl: base64 });
        if (mode === 'manualNew') setNewVoucherForm({ ...newVoucherForm, slipPhotoUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Checkout from Current Bill Ticket
  const handleCheckoutFromBillTicket = (checkoutData: {
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
  }) => {
    if (cart.length === 0) return;

    const orderId = `POS-${Math.floor(1000 + Math.random() * 9000)}`;
    const voucherId = `POS-REC-${Math.floor(10000 + Math.random() * 90000)}`;

    let formattedRef = checkoutData.accountOrPhone.trim();
    if (checkoutData.paymentType === 'Bank Transfer' && checkoutData.selectedBank) {
      formattedRef = `${checkoutData.selectedBank} - Ref: ${formattedRef || 'Direct Transfer'}`;
    } else if (checkoutData.paymentType === 'Telebirr') {
      formattedRef = `Telebirr: ${formattedRef || 'Confirmed'}`;
    } else if (checkoutData.paymentType === 'Card') {
      formattedRef = formattedRef ? `Card POS Auth: ${formattedRef}` : 'POS Terminal (Card)';
    } else if (checkoutData.paymentType === 'Cash') {
      formattedRef = `Cash Drawer (Tendered: ${checkoutData.amountTendered} ETB)`;
    } else if (checkoutData.paymentType === 'Split Payment') {
      formattedRef = `Split: Cash ${checkoutData.splitCashAmount} ETB + ${checkoutData.splitSecondaryMethod} ${checkoutData.splitSecondaryAmount} ETB`;
    }

    const mappedPaymentMethod =
      checkoutData.paymentType === 'Card'
        ? 'Card'
        : checkoutData.paymentType === 'Cash'
        ? 'Cash'
        : checkoutData.paymentType === 'Telebirr'
        ? 'Telebirr'
        : checkoutData.paymentType === 'Bank Transfer'
        ? 'Bank Transfer'
        : 'Cash';

    const chosenStore =
      checkoutData.storeName ||
      (selectedStoreFilter !== 'ALL' ? selectedStoreFilter : 'Bole Main Central Store');

    const newOrd: Order = {
      id: orderId,
      customerName: checkoutData.customerName || 'Counter Guest',
      customerEmail: 'guest@cafelina.com',
      customerPhone: '+251 911 000 000',
      deliveryType: checkoutData.orderType === 'Delivery' ? 'Delivery' : 'Pickup',
      deliveryAddress: `${checkoutData.orderType} (${checkoutData.tableNumber})`,
      storeName: chosenStore,
      items: cart.map((c) => ({
        menuItem: c.item,
        quantity: c.qty,
        specialInstructions: c.notes || (c.substitutedIngredient ? `Subst: ${c.substitutedIngredient}` : undefined),
      })),
      subtotal: checkoutData.subtotal,
      discount: checkoutData.discountAmount,
      tax: checkoutData.tax,
      deliveryFee: 0,
      total: checkoutData.grandTotal,
      currency: 'ETB',
      paymentMethod: mappedPaymentMethod === 'Card' ? 'Stripe' : mappedPaymentMethod === 'Cash' ? 'Cash' : 'Bank Transfer',
      paymentStatus: 'Paid',
      status: 'Ready',
      createdAt: new Date().toISOString(),
    };

    const hasSubstitutions = cart.some((c) => c.substitutedIngredient);

    // Construct clean voucher object
    const posVoucher: POSReceiptVoucher = {
      voucherId,
      orderId,
      date: new Date().toISOString().split('T')[0],
      cashierName: checkoutData.cashierName || 'Abebe Cashier',
      customerName: checkoutData.customerName || 'Counter Guest',
      storeName: chosenStore,
      items: cart.map((c) => ({ menuItem: c.item, quantity: c.qty })),
      subtotal: checkoutData.subtotal,
      tax: checkoutData.tax,
      grandTotal: checkoutData.grandTotal,
      paymentMethod: mappedPaymentMethod,
      accountNumberOrPhone: formattedRef,
      amountReceived: checkoutData.amountTendered > 0 ? checkoutData.amountTendered : checkoutData.grandTotal,
      mainIngredientStatus: hasSubstitutions ? 'Substituted' : 'Fully Available',
      substitutionNotes: cart
        .filter((c) => c.substitutedIngredient || c.notes)
        .map((c) => `${c.item.name}: ${c.substitutedIngredient ? `Subst [${c.substitutedIngredient}]` : ''} ${c.notes ? `Note [${c.notes}]` : ''}`.trim())
        .join(' | '),
      createdTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (checkoutData.slipPhoto) {
      posVoucher.slipPhotoUrl = checkoutData.slipPhoto;
    }

    onCompletePOSOrder(newOrd);
    onSavePOSReceipt(posVoucher);

    if (checkoutData.isPrintReceipt) {
      setReceiptModal(posVoucher);
    }

    // Reset Terminal Cart & Form
    setCart([]);
    setSlipPhoto('');
    setAmountTendered(0);
    setAccountOrPhone('');
    setMobileCartOpen(false);
  };

  // Handle Manual Direct Registration
  const handleSaveNewManualVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = `POS-MAN-${Math.floor(1000 + Math.random() * 9000)}`;
    const voucherId = `POS-REC-${Math.floor(10000 + Math.random() * 90000)}`;

    const selectedItemsList: OrderItem[] = newVoucherForm.selectedItems
      .map((it) => {
        const found = menuItems.find((m) => m.id === it.menuItemId);
        if (!found) return null;
        return {
          menuItem: found,
          quantity: it.quantity,
        };
      })
      .filter(Boolean) as OrderItem[];

    const calcSubtotal = selectedItemsList.reduce((sum, it) => sum + it.menuItem.price * it.quantity, 0);
    const calcTax = Math.round(calcSubtotal * 0.05);
    const calcGrandTotal = calcSubtotal + calcTax;
    const manualStore = newVoucherForm.storeName || (selectedStoreFilter !== 'ALL' ? selectedStoreFilter : 'Bole Main Central Store');

    const newVoucher: POSReceiptVoucher = {
      voucherId,
      orderId,
      date: newVoucherForm.date,
      cashierName: newVoucherForm.cashierName,
      customerName: newVoucherForm.customerName || 'Counter Guest',
      storeName: manualStore,
      items: selectedItemsList,
      subtotal: calcSubtotal,
      tax: calcTax,
      grandTotal: calcGrandTotal,
      paymentMethod: newVoucherForm.paymentMethod,
      accountNumberOrPhone: newVoucherForm.accountNumberOrPhone || 'Direct Record',
      amountReceived: newVoucherForm.amountReceived > 0 ? newVoucherForm.amountReceived : calcGrandTotal,
      mainIngredientStatus: newVoucherForm.mainIngredientStatus,
      substitutionNotes: newVoucherForm.notes || '',
      createdTime: newVoucherForm.createdTime,
    };

    if (newVoucherForm.slipPhotoUrl) {
      newVoucher.slipPhotoUrl = newVoucherForm.slipPhotoUrl;
    }

    const newOrd: Order = {
      id: orderId,
      customerName: newVoucherForm.customerName || 'Counter Guest',
      customerEmail: 'guest@cafelina.com',
      customerPhone: '+251 911 000 000',
      deliveryType: 'Pickup',
      deliveryAddress: 'Direct POS Registration',
      storeName: manualStore,
      items: selectedItemsList,
      subtotal: calcSubtotal,
      discount: 0,
      tax: calcTax,
      deliveryFee: 0,
      total: calcGrandTotal,
      currency: 'ETB',
      paymentMethod: newVoucherForm.paymentMethod === 'Card' ? 'Stripe' : newVoucherForm.paymentMethod === 'Cash' ? 'Cash' : 'Bank Transfer',
      paymentStatus: 'Paid',
      status: 'Ready',
      createdAt: new Date().toISOString(),
    };

    onCompletePOSOrder(newOrd);
    onSavePOSReceipt(newVoucher);
    setIsRegisterNewModalOpen(false);
    setSelectedVoucherForView(newVoucher);
  };

  // Payment Breakdown Calculations
  const stats = useMemo(() => {
    const totalCount = posReceipts.length;
    const totalVolume = posReceipts.reduce((sum, v) => sum + v.grandTotal, 0);

    const cashVouchers = posReceipts.filter((v) => v.paymentMethod === 'Cash');
    const cashTotal = cashVouchers.reduce((sum, v) => sum + v.grandTotal, 0);

    const cardVouchers = posReceipts.filter((v) => v.paymentMethod === 'Card');
    const cardTotal = cardVouchers.reduce((sum, v) => sum + v.grandTotal, 0);

    const bankVouchers = posReceipts.filter((v) => v.paymentMethod === 'Bank Transfer');
    const bankTotal = bankVouchers.reduce((sum, v) => sum + v.grandTotal, 0);

    const telebirrVouchers = posReceipts.filter((v) => v.paymentMethod === 'Telebirr');
    const telebirrTotal = telebirrVouchers.reduce((sum, v) => sum + v.grandTotal, 0);

    return {
      totalCount,
      totalVolume,
      cash: { count: cashVouchers.length, total: cashTotal, percent: totalVolume > 0 ? ((cashTotal / totalVolume) * 100).toFixed(1) : '0' },
      card: { count: cardVouchers.length, total: cardTotal, percent: totalVolume > 0 ? ((cardTotal / totalVolume) * 100).toFixed(1) : '0' },
      bank: { count: bankVouchers.length, total: bankTotal, percent: totalVolume > 0 ? ((bankTotal / totalVolume) * 100).toFixed(1) : '0' },
      telebirr: { count: telebirrVouchers.length, total: telebirrTotal, percent: totalVolume > 0 ? ((telebirrTotal / totalVolume) * 100).toFixed(1) : '0' },
    };
  }, [posReceipts]);

  // Live Clock for Header
  const [currentTime, setCurrentTime] = useState({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime({
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Table Management State
  const [selectedTable, setSelectedTable] = useState('Table 1');
  const [orderType, setOrderType] = useState<'Dine-In' | 'Takeaway' | 'Delivery'>('Dine-In');
  const [discountEtb, setDiscountEtb] = useState(0);
  const [paidAmountInput, setPaidAmountInput] = useState<number | ''>('');
  const [activePage, setActivePage] = useState(0);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isHoldOrdersModalOpen, setIsHoldOrdersModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [heldOrders, setHeldOrders] = useState<{ id: string; table: string; customer: string; time: string; items: CartItem[]; total: number }[]>([
    {
      id: 'HOLD-01',
      table: 'Table 4',
      customer: 'Dr. Aster',
      time: '03:15 PM',
      items: menuItems.length >= 2 ? [
        { item: menuItems[0], qty: 2 },
        { item: menuItems[1], qty: 1 }
      ] : [],
      total: 350
    }
  ]);
  const [orderNote, setOrderNote] = useState('');

  const handleResumeHeldOrder = (holdId: string) => {
    const found = heldOrders.find((h) => h.id === holdId);
    if (!found) return;
    setCart(found.items);
    setSelectedTable(found.table);
    setCustomerName(found.customer);
    setHeldOrders((prev) => prev.filter((h) => h.id !== holdId));
    setIsHoldOrdersModalOpen(false);
  };

  const handleDeleteHeldOrder = (holdId: string) => {
    setHeldOrders((prev) => prev.filter((h) => h.id !== holdId));
  };

  // Categories list matching user design
  const terminalCategories = ['All', 'Coffee', 'Espresso', 'Latte', 'Cappuccino', 'Bakery', 'Breakfast', 'Juice'];

  // Table status mock data
  const tableList = [
    { id: 'Table 1', status: 'available' },
    { id: 'Table 2', status: 'occupied' },
    { id: 'Table 3', status: 'occupied' },
    { id: 'Table 4', status: 'reserved' },
    { id: 'Table 5', status: 'cleaning' },
  ];

  // Held Order Actions
  const handleHoldCurrentOrder = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Add items before holding an order.');
      return;
    }
    const newHold = {
      id: `HOLD-${Math.floor(10 + Math.random() * 90)}`,
      table: selectedTable,
      customer: customerName || 'Counter Guest',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      total: grandTotalCalculated
    };
    setHeldOrders((prev) => [newHold, ...prev]);
    clearCart();
    setOrderNote('');
    alert(`Order for ${selectedTable} held successfully!`);
  };

  const handleRestoreHeldOrder = (holdId: string) => {
    const found = heldOrders.find((h) => h.id === holdId);
    if (!found) return;
    setCart(found.items);
    setSelectedTable(found.table);
    setCustomerName(found.customer);
    setHeldOrders((prev) => prev.filter((h) => h.id !== holdId));
    setIsHoldOrdersModalOpen(false);
  };

  const handleNewOrder = () => {
    if (cart.length > 0) {
      if (confirm('Start a new order? Current cart items will be cleared.')) {
        clearCart();
        setOrderNote('');
        setPaidAmountInput('');
        setDiscountEtb(0);
      }
    } else {
      clearCart();
      setOrderNote('');
      setPaidAmountInput('');
      setDiscountEtb(0);
    }
  };

  // Cart Totals Calculation
  const subtotalCalculated = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.item.price * ci.qty, 0);
  }, [cart]);

  const taxCalculated = useMemo(() => {
    const taxableSubtotal = Math.max(0, subtotalCalculated - discountEtb);
    return Math.round(taxableSubtotal * 0.05 * 100) / 100;
  }, [subtotalCalculated, discountEtb]);

  const grandTotalCalculated = useMemo(() => {
    return Math.max(0, subtotalCalculated - discountEtb + taxCalculated);
  }, [subtotalCalculated, discountEtb, taxCalculated]);

  const effectivePaidAmount = paidAmountInput === '' ? 0 : Number(paidAmountInput);
  const changeCalculated = effectivePaidAmount > grandTotalCalculated ? effectivePaidAmount - grandTotalCalculated : 0;

  // Filtered Menu Items based on Store, Category & Search
  const terminalMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      // 1. Store Filter (Check where the product's main ingredient is sourced from)
      if (selectedStoreFilter !== 'ALL') {
        const info = getProductMainIngredientInfo(item);
        if (info.storeName.toLowerCase().trim() !== selectedStoreFilter.toLowerCase().trim()) {
          return false;
        }
      }

      // 2. Category Filter
      const matchCat =
        selectedCategory === 'All' ||
        (selectedCategory === 'Coffee' && (item.category === 'Coffee' || item.category === 'Espresso' || item.category === 'Latte' || item.category === 'Cappuccino' || item.category === 'Macchiato')) ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      // 3. Search Filter (by name, barcode, description, or ingredients)
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.barcode && item.barcode.toLowerCase().includes(search.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
        item.ingredients?.some((ing) => ing.toLowerCase().includes(search.toLowerCase())) ||
        item.recipeIngredients?.some((r) => r.ingredientName.toLowerCase().includes(search.toLowerCase()));

      return matchCat && matchSearch;
    });
  }, [menuItems, selectedStoreFilter, selectedCategory, search, inventory]);

  // Filtered POS Vouchers in Registry
  const filteredVouchers = useMemo(() => {
    return posReceipts.filter((v) => {
      const matchMethod = filterPaymentMethod === 'All' || v.paymentMethod === filterPaymentMethod;
      const matchDate = !filterDate || v.date === filterDate;
      const matchCashier = filterCashier === 'All' || v.cashierName === filterCashier;
      const matchIngredient = filterIngredientStatus === 'All' || v.mainIngredientStatus === filterIngredientStatus;
      const matchSearch =
        v.voucherId.toLowerCase().includes(registrySearch.toLowerCase()) ||
        v.orderId.toLowerCase().includes(registrySearch.toLowerCase()) ||
        v.customerName.toLowerCase().includes(registrySearch.toLowerCase()) ||
        v.cashierName.toLowerCase().includes(registrySearch.toLowerCase()) ||
        (v.accountNumberOrPhone && v.accountNumberOrPhone.toLowerCase().includes(registrySearch.toLowerCase())) ||
        v.items.some((i) => i.menuItem.name.toLowerCase().includes(registrySearch.toLowerCase()));

      return matchMethod && matchDate && matchCashier && matchIngredient && matchSearch;
    });
  }, [posReceipts, filterPaymentMethod, filterDate, filterCashier, filterIngredientStatus, registrySearch]);

  const uniqueCashiers = Array.from(new Set(posReceipts.map((v) => v.cashierName).filter(Boolean)));

  // Render Payment Badge Helper
  const renderPaymentBadge = (method: 'Cash' | 'Card' | 'Bank Transfer' | 'Telebirr') => {
    switch (method) {
      case 'Cash':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <Coins size={13} className="shrink-0" />
            <span>Cash (በጥሬ ገንዘብ)</span>
          </span>
        );
      case 'Card':
        return (
          <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <CreditCard size={13} className="shrink-0" />
            <span>Card / POS (በካርድ)</span>
          </span>
        );
      case 'Bank Transfer':
        return (
          <span className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <Building2 size={13} className="shrink-0" />
            <span>Bank Transfer (በባንክ)</span>
          </span>
        );
      case 'Telebirr':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <Phone size={13} className="shrink-0" />
            <span>Telebirr (ቴሌብር)</span>
          </span>
        );
    }
  };

  // Shared Cart Content for Desktop sidebar & Mobile/Tablet Drawer
  const CartContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <CurrentBillTicket
      cart={cart}
      onUpdateQty={updateQty}
      onRemoveItem={removeItem}
      onUpdateItemNotes={updateItemNotes}
      onClearCart={clearCart}
      cashierName={cashierName}
      setCashierName={setCashierName}
      customerName={customerName}
      setCustomerName={setCustomerName}
      onCheckout={handleCheckoutFromBillTicket}
      onCloseMobile={isMobile ? () => setMobileCartOpen(false) : undefined}
      onCloseTicket={() => {
        clearCart();
        if (isMobile) setMobileCartOpen(false);
      }}
    />
  );

  return (
    <div className="space-y-4 font-sans pb-24 lg:pb-16 text-slate-200">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E5A93C]/10 border border-[#E5A93C]/30 flex items-center justify-center text-[#E5A93C] shadow-sm">
            <ShoppingBag size={20} className="text-[#E5A93C]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                POS Terminal
              </h1>
              <span className="inline-flex items-center gap-1.5 bg-[#141C2B] text-emerald-400 border border-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#141C2B] text-emerald-400 border border-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                <Cloud size={12} />
                Firebase Synced
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions & Live Clock */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tab Switcher */}
          <div className="flex bg-[#141C2B] p-1 rounded-xl border border-slate-800 mr-1">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'terminal'
                  ? 'bg-[#E5A93C] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => setActiveTab('vouchers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'vouchers'
                  ? 'bg-[#E5A93C] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Registry ({posReceipts.length})
            </button>
          </div>

          <button
            onClick={() => setIsHoldOrdersModalOpen(true)}
            className="bg-[#141C2B] hover:bg-slate-800 text-slate-200 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Bookmark size={14} className="text-[#E5A93C]" />
            <span>Hold Orders</span>
            {heldOrders.length > 0 && (
              <span className="bg-[#E5A93C] text-black font-black text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                {heldOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={handleNewOrder}
            className="bg-[#E5A93C] hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={15} className="stroke-[3]" />
            <span>New Order</span>
          </button>

          <div className="bg-[#141C2B] border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-slate-300">
            <Clock size={14} className="text-[#E5A93C]" />
            <span className="font-bold text-white font-mono">{currentTime.time}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 text-[11px]">{currentTime.date}</span>
          </div>
        </div>
      </div>

      {activeTab === 'terminal' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Center/Left Main Product Area (8 cols on lg, 9 on xl) */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-4">
            {/* 🏬 Raw Ingredient Source Store Filter Bar (የምርቱ ጥሬ ዕቃ ግብዓት ስቶር መምረጫ) */}
            <div className="bg-[#141C2B] p-3.5 sm:p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/30 flex items-center justify-center text-[#E5A93C] shrink-0">
                    <Store size={17} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-white">
                        Raw Ingredient Store (የጥሬ ዕቃ ግብዓት ስቶር)
                      </h3>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold hidden sm:inline-block">
                        ዋና ግብዓት ማጣሪያ
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {selectedStoreFilter === 'ALL' ? (
                        <span>Showing all products across all stores (ከሁሉም ስቶሮች)</span>
                      ) : (
                        <span>
                          Showing products whose Main Ingredient is in:{' '}
                          <strong className="text-[#E5A93C] font-bold">{selectedStoreFilter}</strong>
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {selectedStoreFilter !== 'ALL' && (
                  <button
                    onClick={() => setSelectedStoreFilter('ALL')}
                    className="text-[11px] text-slate-300 hover:text-white bg-[#0B0F17] hover:bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} className="text-[#E5A93C]" />
                    <span>Reset Store (ሁሉንም አሳይ)</span>
                  </button>
                )}
              </div>

              {/* Store Selection Buttons / Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                <button
                  onClick={() => setSelectedStoreFilter('ALL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    selectedStoreFilter === 'ALL'
                      ? 'bg-[#E5A93C] text-black shadow-md shadow-amber-500/20 ring-2 ring-[#E5A93C]/40'
                      : 'bg-[#0B0F17] text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Layers size={13} />
                  <span>All Stores (ሁሉም ስቶሮች)</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                      selectedStoreFilter === 'ALL' ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {storeProductCounts['ALL'] || menuItems.length}
                  </span>
                </button>

                {availableStores.map((st) => {
                  const count = storeProductCounts[st] || 0;
                  const isSelected = selectedStoreFilter === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setSelectedStoreFilter(st)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#E5A93C] text-black shadow-md shadow-amber-500/20 ring-2 ring-[#E5A93C]/40'
                          : 'bg-[#0B0F17] text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <Building2 size={13} className={isSelected ? 'text-black' : 'text-[#E5A93C]'} />
                      <span className="truncate max-w-[220px]">{st}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                          isSelected ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search & Barcode Scan Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product by name, barcode or scan..."
                  className="w-full h-11 bg-[#141C2B] text-white placeholder-slate-500 border border-slate-800 rounded-xl pl-10 pr-9 text-xs focus:outline-none focus:border-[#E5A93C]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsBarcodeModalOpen(true)}
                className="bg-[#141C2B] hover:bg-slate-800 text-slate-200 border border-slate-800 px-4 h-11 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
              >
                <Barcode size={16} className="text-[#E5A93C]" />
                <span>Scan Barcode</span>
              </button>
            </div>

            {/* Category Navigation Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {terminalCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#E5A93C] text-black font-bold shadow-md shadow-amber-500/20'
                      : 'bg-[#141C2B] text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                onClick={() => setSelectedCategory('All')}
                className="bg-[#141C2B] text-slate-400 border border-slate-800 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>More</span>
                <ChevronDown size={13} />
              </button>
            </div>

            {/* 5-Column Grid x 3 rows of Products */}
            {terminalMenuItems.length === 0 ? (
              <div className="bg-[#141C2B] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-amber-400">
                  <AlertTriangle size={24} />
                </div>
                <h4 className="text-sm font-bold text-white">No products found for this store selection</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {selectedStoreFilter !== 'ALL'
                    ? `No products currently have their main ingredient sourced from "${selectedStoreFilter}".`
                    : 'No products match your current search or category filter.'}
                </p>
                {selectedStoreFilter !== 'ALL' && (
                  <button
                    onClick={() => setSelectedStoreFilter('ALL')}
                    className="bg-[#E5A93C] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <RefreshCw size={13} />
                    <span>View All Stores (ሁሉንም ምርቶች አሳይ)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {terminalMenuItems.map((item) => {
                  const mainInfo = getProductMainIngredientInfo(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => addToCartWithCheck(item)}
                      className="bg-[#141C2B] p-2.5 rounded-[18px] border border-slate-800/80 hover:border-[#E5A93C]/60 text-left transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between group cursor-pointer relative shadow-sm"
                    >
                      <div className="relative w-full">
                        {/* In-Stock Indicator */}
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 z-10 border-2 border-[#141C2B]" />

                        <div className="overflow-hidden rounded-xl mb-2 aspect-square bg-[#0B0F17] w-full">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-[#E5A93C] transition-colors">
                          {item.name}
                        </h4>

                        {/* Main Ingredient & Store Tag */}
                        <div className="mt-1.5 space-y-1">
                          <div className="text-[10px] text-amber-300/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 font-medium truncate">
                            <Building2 size={10} className="shrink-0 text-[#E5A93C]" />
                            <span className="truncate">{mainInfo.storeName}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">
                            ዋና ግብዓት: <span className="text-slate-300 font-semibold">{mainInfo.ingredientName}</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between w-full">
                        <span className="font-extrabold text-xs sm:text-sm text-[#E5A93C]">
                          {item.price} ETB
                        </span>
                        <span className="text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded group-hover:bg-[#E5A93C] group-hover:text-black font-semibold transition-colors">
                          + Add
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pagination Indicator Dots */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {[0, 1, 2, 3, 4].map((dot) => (
                <button
                  key={dot}
                  onClick={() => setActivePage(dot)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    activePage === dot ? 'w-6 bg-[#E5A93C]' : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Page ${dot + 1}`}
                />
              ))}
            </div>

            {/* Order Type & Table Management Bottom Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Order Type Card */}
              <div className="bg-[#141C2B] p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">Order Type</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'Dine-In', label: '🍽️ Dine-In' },
                    { type: 'Takeaway', label: '🛍️ Takeaway' },
                    { type: 'Delivery', label: '🛵 Delivery' },
                  ].map((ot) => (
                    <button
                      key={ot.type}
                      onClick={() => setOrderType(ot.type as any)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        orderType === ot.type
                          ? 'bg-[#E5A93C] text-black shadow-md shadow-amber-500/20'
                          : 'bg-[#0B0F17] text-slate-300 border border-slate-800 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {ot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Management Card */}
              <div className="bg-[#141C2B] p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-400">Table Management</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {tableList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTable(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedTable === t.id
                          ? 'bg-[#E5A93C] text-black shadow-md shadow-amber-500/20'
                          : 'bg-[#0B0F17] text-slate-300 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {t.id}
                    </button>
                  ))}
                </div>

                {/* Status Legend */}
                <div className="flex items-center gap-3 mt-2.5 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Occupied
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Reserved
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Cleaning
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Current Order (4 cols on lg) */}
          <div className="lg:col-span-4 xl:col-span-4 bg-[#141C2B] p-4 sm:p-5 rounded-[22px] border border-slate-800 shadow-xl flex flex-col justify-between min-h-[580px]">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Current Order</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#E5A93C] border border-[#E5A93C]/40 bg-[#E5A93C]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Utensils size={10} /> {orderType}
                  </span>
                  <button
                    onClick={clearCart}
                    className="text-slate-400 hover:text-rose-400 p-1 rounded-lg cursor-pointer"
                    title="Clear order"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Table & Customer Row */}
              <div className="flex items-center justify-between py-2.5 text-xs border-b border-slate-800/80">
                <button
                  onClick={() => {
                    const nextTable = prompt('Enter table number (e.g. Table 2):', selectedTable);
                    if (nextTable) setSelectedTable(nextTable);
                  }}
                  className="text-[#E5A93C] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Table: {selectedTable}</span>
                  <Edit3 size={11} />
                </button>

                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-slate-300 font-medium hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <User size={12} className="text-slate-400" />
                  <span>{customerName || 'Counter Guest'}</span>
                </button>
              </div>

              {/* Cart Items List */}
              <div className="overflow-y-auto max-h-[220px] py-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <ShoppingBag size={28} className="mx-auto mb-2 opacity-30 text-[#E5A93C]" />
                    <p className="text-xs">No items added to order</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Click any product to add</p>
                  </div>
                ) : (
                      cart.map((ci) => {
                        const itemKey = `${ci.item.id}-${ci.substitutedIngredient || 'orig'}`;
                        return (
                          <div
                            key={itemKey}
                            className="bg-[#0B0F17] p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={ci.item.image}
                                alt={ci.item.name}
                                className="w-9 h-9 rounded-lg object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <h5 className="font-bold text-xs text-white truncate">{ci.item.name}</h5>
                                <span className="text-[10px] text-slate-400">{ci.item.price} ETB</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center bg-[#141C2B] rounded-lg border border-slate-800">
                                <button
                                  onClick={() => updateQty(ci.item.id, -1, ci.substitutedIngredient)}
                                  className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="w-5 text-center text-xs font-bold text-white">{ci.qty}</span>
                                <button
                                  onClick={() => updateQty(ci.item.id, 1, ci.substitutedIngredient)}
                                  className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>

                              <span className="text-xs font-bold text-white min-w-[52px] text-right">
                                {ci.item.price * ci.qty} ETB
                              </span>

                              <button
                                onClick={() => removeItem(ci.item.id, ci.substitutedIngredient)}
                                className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                )}
              </div>

              {/* Add Note Input */}
              <div className="pt-2">
                <input
                  type="text"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Add Note..."
                  className="w-full bg-[#0B0F17] text-white placeholder-slate-500 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] focus:outline-none focus:border-[#E5A93C]"
                />
              </div>
            </div>

            {/* Totals & Calculations */}
            <div className="pt-3 border-t border-slate-800 space-y-2 mt-2">
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-semibold text-white">{subtotalCalculated} ETB</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Discount</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setDiscountEtb((prev) => Math.max(0, prev - 10))}
                      className="w-5 h-5 bg-[#0B0F17] rounded flex items-center justify-center text-slate-400 hover:text-white border border-slate-800 text-[10px] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-semibold text-amber-400">{discountEtb} ETB</span>
                    <button
                      onClick={() => setDiscountEtb((prev) => prev + 10)}
                      className="w-5 h-5 bg-[#0B0F17] rounded flex items-center justify-center text-slate-400 hover:text-white border border-slate-800 text-[10px] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Tax (5%)</span>
                  <span className="font-semibold text-white">{taxCalculated} ETB</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-200">Total</span>
                <span className="text-xl font-black text-[#E5A93C] font-mono">
                  {grandTotalCalculated} ETB
                </span>
              </div>

              {/* Tendered Amount & Change */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="bg-[#0B0F17] p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Paid Amount</span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={grandTotalCalculated.toString()}
                      className="w-full bg-transparent text-white font-bold text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">ETB</span>
                  </div>
                </div>

                <div className="bg-[#0B0F17] p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Change</span>
                  <span className="font-extrabold text-emerald-400 text-xs block">
                    {changeCalculated.toFixed(2)} ETB
                  </span>
                </div>
              </div>

              {/* Primary Checkout CTA */}
              <button
                onClick={() => {
                  if (cart.length === 0) {
                    alert('Please select at least 1 menu item to checkout.');
                    return;
                  }
                  setIsCheckoutModalOpen(true);
                }}
                className="w-full bg-[#E5A93C] hover:bg-amber-400 text-black py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-98 cursor-pointer mt-2"
              >
                <CreditCard size={16} className="text-black" />
                <span>Checkout / Pay</span>
                <ChevronRight size={16} className="stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VOUCHERS REGISTRY TAB (View, Filter, Edit, Record POS Receipt Vouchers by Cash, Card, Bank, Telebirr) */
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Metric Cards by Payment Method */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Sales */}
            <div className="bg-[#243244] p-4 rounded-[20px] border border-white/10 shadow-md col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Total Sales</span>
                <span className="p-2 bg-[#1E293B] text-[#D4AF37] rounded-xl">
                  <Receipt size={16} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-[#F8FAFC] mt-2">{stats.totalVolume.toLocaleString()} ETB</p>
              <span className="text-[11px] text-[#CBD5E1] mt-1 block">{stats.totalCount} Vouchers Issued</span>
            </div>

            {/* Cash Sales */}
            <div className="bg-[#243244] p-4 rounded-[20px] border border-emerald-500/20 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Cash (በጥሬ)</span>
                <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Coins size={16} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-2">{stats.cash.total.toLocaleString()} ETB</p>
              <div className="flex justify-between items-center text-[11px] text-[#94A3B8] mt-1">
                <span>{stats.cash.count} Vouchers</span>
                <span className="font-bold text-emerald-400">{stats.cash.percent}%</span>
              </div>
            </div>

            {/* Card Sales */}
            <div className="bg-[#243244] p-4 rounded-[20px] border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Card / POS (በካርድ)</span>
                <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <CreditCard size={16} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-indigo-400 mt-2">{stats.card.total.toLocaleString()} ETB</p>
              <div className="flex justify-between items-center text-[11px] text-[#94A3B8] mt-1">
                <span>{stats.card.count} Vouchers</span>
                <span className="font-bold text-indigo-400">{stats.card.percent}%</span>
              </div>
            </div>

            {/* Bank Transfer Sales */}
            <div className="bg-[#243244] p-4 rounded-[20px] border border-sky-500/20 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Bank Transfer (በባንክ)</span>
                <span className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                  <Building2 size={16} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-sky-400 mt-2">{stats.bank.total.toLocaleString()} ETB</p>
              <div className="flex justify-between items-center text-[11px] text-[#94A3B8] mt-1">
                <span>{stats.bank.count} Vouchers</span>
                <span className="font-bold text-sky-400">{stats.bank.percent}%</span>
              </div>
            </div>

            {/* Telebirr Sales */}
            <div className="bg-[#243244] p-4 rounded-[20px] border border-amber-500/20 shadow-md col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Telebirr (ቴሌብር)</span>
                <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Phone size={16} />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-2">{stats.telebirr.total.toLocaleString()} ETB</p>
              <div className="flex justify-between items-center text-[11px] text-[#94A3B8] mt-1">
                <span>{stats.telebirr.count} Vouchers</span>
                <span className="font-bold text-amber-400">{stats.telebirr.percent}%</span>
              </div>
            </div>
          </div>

          {/* Registry Filter & Action Bar */}
          <div className="bg-[#243244] p-4 sm:p-5 rounded-[24px] border border-white/10 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[#F8FAFC]">
                  POS Sales Receipt Vouchers Registry (የሽያጭ ደረሰኞች መዝገብ)
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Audit log of all sales by Cash, Card, Bank Transfer, and Telebirr with receipt slips and ingredient verification.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <button
                  onClick={() => setIsRegisterNewModalOpen(true)}
                  className="w-full md:w-auto h-11 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
                >
                  <Plus size={16} />
                  <span>+ Record Sales Voucher (አዲስ መዝግብ)</span>
                </button>
              </div>
            </div>

            {/* Quick Payment Method Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#94A3B8] flex items-center gap-1.5 mr-1">
                <Filter size={14} /> Method:
              </span>

              <button
                onClick={() => setFilterPaymentMethod('All')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterPaymentMethod === 'All'
                    ? 'bg-[#D4AF37] text-[#0F172A] font-extrabold shadow-sm'
                    : 'bg-[#1E293B] text-[#CBD5E1] border border-white/10 hover:bg-[#2F4158]'
                }`}
              >
                All Methods ({posReceipts.length})
              </button>

              <button
                onClick={() => setFilterPaymentMethod('Cash')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterPaymentMethod === 'Cash'
                    ? 'bg-emerald-500 text-white font-extrabold shadow-sm'
                    : 'bg-[#1E293B] text-emerald-400 border border-emerald-500/30 hover:bg-[#2F4158]'
                }`}
              >
                <Coins size={13} />
                <span>Cash ({stats.cash.count})</span>
              </button>

              <button
                onClick={() => setFilterPaymentMethod('Card')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterPaymentMethod === 'Card'
                    ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                    : 'bg-[#1E293B] text-indigo-400 border border-indigo-500/30 hover:bg-[#2F4158]'
                }`}
              >
                <CreditCard size={13} />
                <span>Card ({stats.card.count})</span>
              </button>

              <button
                onClick={() => setFilterPaymentMethod('Bank Transfer')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterPaymentMethod === 'Bank Transfer'
                    ? 'bg-sky-600 text-white font-extrabold shadow-sm'
                    : 'bg-[#1E293B] text-sky-400 border border-sky-500/30 hover:bg-[#2F4158]'
                }`}
              >
                <Building2 size={13} />
                <span>Bank Transfer ({stats.bank.count})</span>
              </button>

              <button
                onClick={() => setFilterPaymentMethod('Telebirr')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterPaymentMethod === 'Telebirr'
                    ? 'bg-amber-500 text-[#0F172A] font-extrabold shadow-sm'
                    : 'bg-[#1E293B] text-amber-400 border border-amber-500/30 hover:bg-[#2F4158]'
                }`}
              >
                <Phone size={13} />
                <span>Telebirr ({stats.telebirr.count})</span>
              </button>
            </div>

            {/* Secondary Search & Dropdown Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3.5 text-[#94A3B8]" />
                <input
                  type="text"
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  placeholder="Search voucher ID, customer, order, phone, ref..."
                  className="w-full h-11 bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-10 pr-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-3.5 text-[#94A3B8]" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full h-11 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-xl pl-10 pr-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <select
                  value={filterCashier}
                  onChange={(e) => setFilterCashier(e.target.value)}
                  className="w-full h-11 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="All">All Cashiers (ሁሉንም ሠራተኞች)</option>
                  {uniqueCashiers.map((c) => (
                    <option key={c} value={c}>
                      Cashier: {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile Cards View (Visible on small screens) */}
            <div className="block md:hidden space-y-3">
              {filteredVouchers.length === 0 ? (
                <div className="text-center py-10 text-[#94A3B8] bg-[#1E293B] rounded-2xl p-4">
                  <Receipt size={32} className="mx-auto mb-2 opacity-40 text-[#D4AF37]" />
                  <p className="font-bold text-[#F8FAFC]">No POS receipt vouchers found.</p>
                </div>
              ) : (
                filteredVouchers.map((v) => (
                  <div key={v.voucherId} className="bg-[#1E293B] p-4 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-extrabold text-[#D4AF37] block text-sm">{v.voucherId}</span>
                        <span className="text-[10px] text-[#94A3B8] font-mono">{v.orderId} • {v.date} {v.createdTime}</span>
                      </div>
                      <div>
                        {renderPaymentBadge(v.paymentMethod)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-white/5">
                      <div>
                        <span className="text-[10px] text-[#94A3B8] block">Customer / Cashier</span>
                        <span className="font-bold text-[#F8FAFC]">{v.customerName || 'Counter Guest'}</span>
                        <span className="text-[10px] text-[#94A3B8] block">by {v.cashierName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#94A3B8] block">Grand Total</span>
                        <span className="font-extrabold text-emerald-400 text-base">{v.grandTotal} ETB</span>
                      </div>
                    </div>

                    <div className="text-xs text-[#CBD5E1]">
                      <span className="text-[10px] text-[#94A3B8] block mb-0.5">Items:</span>
                      <p className="line-clamp-2">
                        {v.items.map((i) => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                      </p>
                    </div>

                    {v.accountNumberOrPhone && (
                      <div className="text-[11px] text-[#94A3B8] font-mono bg-[#243244] p-2 rounded-lg truncate">
                        Ref: {v.accountNumberOrPhone}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      {v.slipPhotoUrl ? (
                        <button
                          onClick={() => setZoomSlipUrl(v.slipPhotoUrl!)}
                          className="flex items-center gap-1.5 text-xs text-[#D4AF37] font-bold"
                        >
                          <img src={v.slipPhotoUrl} alt="Slip" className="w-7 h-7 rounded object-cover border border-white/20" />
                          <span>View Slip</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8] italic">No slip photo</span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedVoucherForView(v)}
                          className="p-2 bg-[#243244] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0F172A] rounded-lg transition-all"
                          title="View Full Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setReceiptModal(v)}
                          className="p-2 bg-[#243244] text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                          title="Print Thermal Receipt"
                        >
                          <Printer size={16} />
                        </button>
                        <ShareReceiptButton
                          receiptData={{
                            title: 'POS Sales Receipt Voucher',
                            voucherId: v.voucherId,
                            customerOrRecipient: `${v.customerName} (Cashier: ${v.cashierName})`,
                            date: `${v.date} ${v.createdTime || ''}`,
                            total: v.grandTotal,
                            paymentMethod: v.paymentMethod,
                            items: v.items.map((it) => ({
                              name: it.menuItem.name,
                              qty: it.quantity,
                              priceOrCost: it.quantity * it.menuItem.price,
                            })),
                            extraDetails: v.accountNumberOrPhone ? `Acc/Ref: ${v.accountNumberOrPhone}` : undefined,
                          }}
                          variant="icon"
                        />
                        <button
                          onClick={() => setEditingVoucher(v)}
                          className="p-2 bg-[#243244] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white rounded-lg transition-all"
                          title="Edit Voucher"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete voucher ${v.voucherId}?`)) {
                              onDeletePOSReceipt(v.voucherId);
                            }
                          }}
                          className="p-2 bg-[#243244] text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                          title="Delete Voucher"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop & Tablet Table View */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs text-[#CBD5E1]">
                <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-[10px] font-extrabold tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3.5 px-4">Voucher ID & Order</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Customer & Cashier</th>
                    <th className="py-3.5 px-4">Items Summary</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Reference / Account</th>
                    <th className="py-3.5 px-4">Slip Photo</th>
                    <th className="py-3.5 px-4">Grand Total</th>
                    <th className="py-3.5 px-4">Ingredient Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium bg-[#243244]">
                  {filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-[#94A3B8]">
                        <Receipt size={32} className="mx-auto mb-2 opacity-40 text-[#D4AF37]" />
                        <p className="font-bold text-[#F8FAFC]">No POS receipt vouchers matched your filters.</p>
                        <p className="text-xs mt-1">Try selecting 'All Methods' or clearing search terms.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVouchers.map((v) => (
                      <tr key={v.voucherId} className="hover:bg-[#1E293B]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-extrabold text-[#D4AF37] block">{v.voucherId}</span>
                          <span className="text-[10px] text-[#94A3B8] font-mono">{v.orderId}</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="block font-bold text-[#F8FAFC]">{v.date}</span>
                          <span className="text-[10px] text-[#94A3B8]">{v.createdTime}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="block font-bold text-[#F8FAFC]">{v.customerName || 'Counter Guest'}</span>
                          <span className="text-[10px] text-[#94A3B8] flex items-center gap-1">
                            <User size={11} /> {v.cashierName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <span className="line-clamp-2 text-xs text-[#CBD5E1]">
                            {v.items.map((i) => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderPaymentBadge(v.paymentMethod)}
                        </td>
                        <td className="py-3.5 px-4 max-w-[180px]">
                          {v.accountNumberOrPhone ? (
                            <span className="text-[11px] text-[#F8FAFC] font-mono block truncate" title={v.accountNumberOrPhone}>
                              {v.accountNumberOrPhone}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#94A3B8]">Direct Sale</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {v.slipPhotoUrl ? (
                            <button
                              onClick={() => setZoomSlipUrl(v.slipPhotoUrl!)}
                              className="group relative block w-10 h-10 rounded-lg overflow-hidden border border-white/20 hover:border-[#D4AF37] cursor-pointer"
                              title="Click to view slip photo"
                            >
                              <img src={v.slipPhotoUrl} alt="Slip" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye size={14} className="text-white" />
                              </div>
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#94A3B8] italic">No slip</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[#22C55E] text-sm">
                          {v.grandTotal} ETB
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              v.mainIngredientStatus === 'Fully Available'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30'
                            }`}
                          >
                            {v.mainIngredientStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedVoucherForView(v)}
                              className="p-2 bg-[#1E293B] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0F172A] rounded-lg transition-all cursor-pointer"
                              title="View Full Voucher Details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => setReceiptModal(v)}
                              className="p-2 bg-[#1E293B] text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Print Thermal Receipt"
                            >
                              <Printer size={15} />
                            </button>
                            <ShareReceiptButton
                              receiptData={{
                                title: 'POS Sales Receipt Voucher',
                                voucherId: v.voucherId,
                                customerOrRecipient: `${v.customerName} (Cashier: ${v.cashierName})`,
                                date: `${v.date} ${v.createdTime || ''}`,
                                total: v.grandTotal,
                                paymentMethod: v.paymentMethod,
                                items: v.items.map((it) => ({
                                  name: it.menuItem.name,
                                  qty: it.quantity,
                                  priceOrCost: it.quantity * it.menuItem.price,
                                })),
                                extraDetails: v.accountNumberOrPhone ? `Acc/Ref: ${v.accountNumberOrPhone}` : undefined,
                              }}
                              variant="icon"
                            />
                            <button
                              onClick={() => setEditingVoucher(v)}
                              className="p-2 bg-[#1E293B] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Edit Voucher"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete voucher ${v.voucherId}?`)) {
                                  onDeletePOSReceipt(v.voucherId);
                                }
                              }}
                              className="p-2 bg-[#1E293B] text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Delete Voucher"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Floating Sticky Bottom Cart Button on Mobile & Tablet */}
      {activeTab === 'terminal' && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            onClick={() => setMobileCartOpen(true)}
            className="w-full h-[58px] bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] font-extrabold rounded-[22px] shadow-[0_10px_25px_rgba(212,175,55,0.4)] flex items-center justify-between px-5 transition-all active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0F172A] text-[#D4AF37] flex items-center justify-center font-black text-xs">
                {totalItemCount}
              </div>
              <div className="text-left">
                <span className="text-xs uppercase tracking-wider font-extrabold block">
                  {cart.length > 0 ? 'Review Bill & Checkout' : 'Open Bill Ticket'}
                </span>
                <span className="text-[10px] text-[#0F172A]/80 font-bold">
                  {paymentType} • {cart.length} item kinds
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base">{grandTotal} ETB</span>
              <ChevronRight size={18} />
            </div>
          </button>
        </div>
      )}

      {/* Mobile/Tablet Slide-up Checkout Drawer */}
      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#243244] w-full max-w-xl rounded-t-[28px] sm:rounded-[28px] border border-white/10 p-4 sm:p-5 shadow-2xl h-[90vh] max-h-[90vh] flex flex-col text-[#F8FAFC]">
            <CartContent isMobile={true} />
          </div>
        </div>
      )}

      {/* MODAL 1: Missing Main Ingredient Verification Modal */}
      {missingIngModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1E293B] border border-red-500/30 rounded-[24px] max-w-lg w-full p-6 space-y-5 shadow-2xl text-[#F8FAFC]">
            <div className="flex justify-between items-start border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 text-red-400 font-serif font-bold text-lg">
                <AlertTriangle size={24} className="shrink-0 animate-bounce" />
                <h3>Main Ingredient Missing / Low (ዋና ግብዓት አልተሟላም)</h3>
              </div>
              <button onClick={() => setMissingIngModalItem(null)} className="p-1 text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-[#243244] rounded-2xl border border-white/10 space-y-2 text-xs">
              <p className="font-bold text-sm text-[#F8FAFC]">Product Selected: {missingIngModalItem.item.name}</p>
              <div className="grid grid-cols-2 gap-2 text-[#CBD5E1]">
                <div>
                  <span className="text-[#94A3B8] block text-[10px] uppercase font-bold">Main Ingredient</span>
                  <span className="font-extrabold text-red-400">{missingIngModalItem.missingName}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] block text-[10px] uppercase font-bold">Stock Status</span>
                  <span className="font-bold text-yellow-400">
                    Required: {missingIngModalItem.requiredQty} | Avail: {missingIngModalItem.availableQty}{' '}
                    {missingIngModalItem.unit}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#D4AF37]">Select Solution Option:</h4>

              <div className="p-3.5 bg-[#243244] rounded-xl border border-white/10 space-y-2">
                <span className="text-xs font-bold text-[#F8FAFC] block">Option 1: Substitute with Available Ingredient</span>
                <select
                  value={selectedSubstituteId}
                  onChange={(e) => setSelectedSubstituteId(e.target.value)}
                  className="w-full h-10 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="">-- Choose Alternative Available Ingredient --</option>
                  {inventory
                    .filter((inv) => inv.stockQty > 0)
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} (Available: {inv.stockQty} {inv.unit})
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleConfirmSubstitute}
                  disabled={!selectedSubstituteId}
                  className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#F6C453] disabled:opacity-40 text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={15} /> Substitute Ingredient & Continue Sale
                </button>
              </div>

              <div className="p-3.5 bg-[#243244] rounded-xl border border-white/10 space-y-2">
                <span className="text-xs font-bold text-[#F8FAFC] block">Option 2: Sell with Current Partial Stock</span>
                <button
                  onClick={handleForceSellCurrentStock}
                  className="w-full py-2.5 bg-[#243244] hover:bg-[#2F4158] text-[#F8FAFC] border border-white/20 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Proceed Sale using Available Partial Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Printable Thermal / Professional Receipt */}
      {receiptModal && (
        <ProfessionalReceiptModal
          receiptData={{
            title: 'POS Sales Receipt Voucher',
            voucherId: receiptModal.voucherId,
            storeName: 'Café Lina - Main POS',
            cashier: receiptModal.cashierName,
            customerOrRecipient: receiptModal.customerName,
            date: receiptModal.date,
            time: receiptModal.createdTime,
            paymentMethod: receiptModal.paymentMethod,
            subtotal: receiptModal.grandTotal,
            total: receiptModal.grandTotal,
            paymentRef: receiptModal.accountNumberOrPhone,
            items: receiptModal.items.map((it) => ({
              name: it.menuItem.name,
              qty: it.quantity,
              unit: 'pcs',
              unitPrice: it.menuItem.price,
              priceOrCost: it.quantity * it.menuItem.price,
            })),
            extraDetails: `Order Ref: ${receiptModal.orderId}${
              receiptModal.accountNumberOrPhone ? ` | Ref: ${receiptModal.accountNumberOrPhone}` : ''
            }`,
          }}
          onClose={() => setReceiptModal(null)}
        />
      )}

      {/* MODAL 3: View Voucher Full Details Modal */}
      {selectedVoucherForView && (
        <ProfessionalReceiptModal
          receiptData={{
            title: 'POS Sales Receipt Voucher',
            voucherId: selectedVoucherForView.voucherId,
            storeName: 'Café Lina - Main POS',
            cashier: selectedVoucherForView.cashierName,
            customerOrRecipient: selectedVoucherForView.customerName,
            date: selectedVoucherForView.date,
            time: selectedVoucherForView.createdTime,
            paymentMethod: selectedVoucherForView.paymentMethod,
            subtotal: selectedVoucherForView.grandTotal,
            total: selectedVoucherForView.grandTotal,
            paymentRef: selectedVoucherForView.accountNumberOrPhone,
            items: selectedVoucherForView.items.map((it) => ({
              name: it.menuItem.name,
              qty: it.quantity,
              unit: 'pcs',
              unitPrice: it.menuItem.price,
              priceOrCost: it.quantity * it.menuItem.price,
            })),
            extraDetails: `Order Ref: ${selectedVoucherForView.orderId}${
              selectedVoucherForView.accountNumberOrPhone ? ` | Ref: ${selectedVoucherForView.accountNumberOrPhone}` : ''
            }`,
          }}
          onClose={() => setSelectedVoucherForView(null)}
          customActions={
            selectedVoucherForView.slipPhotoUrl ? (
              <button
                type="button"
                onClick={() => setZoomSlipUrl(selectedVoucherForView.slipPhotoUrl!)}
                className="px-4 py-2.5 bg-[#243244] hover:bg-[#2F4158] text-[#D4AF37] border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[42px]"
              >
                <ImageIcon size={15} />
                <span>View Slip Photo (ደረሰኝ ፎቶ)</span>
              </button>
            ) : undefined
          }
        />
      )}

      {/* MODAL 4: Edit Voucher Modal */}
      {editingVoucher && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdatePOSReceipt(editingVoucher);
              setEditingVoucher(null);
            }}
            className="bg-[#1E293B] border border-white/10 rounded-[24px] max-w-lg w-full p-6 space-y-4 shadow-2xl text-[#F8FAFC] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#F8FAFC]">Edit POS Voucher</h3>
                <p className="text-xs text-[#94A3B8]">{editingVoucher.voucherId}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingVoucher(null)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Customer Name</label>
              <input
                type="text"
                value={editingVoucher.customerName}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, customerName: e.target.value })}
                className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Cashier Name</label>
              <input
                type="text"
                value={editingVoucher.cashierName}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, cashierName: e.target.value })}
                className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Payment Method</label>
              <select
                value={editingVoucher.paymentMethod}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, paymentMethod: e.target.value as any })}
                className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="Cash">Cash (በጥሬ ገንዘብ)</option>
                <option value="Card">Card / POS Terminal (በካርድ)</option>
                <option value="Bank Transfer">Bank Transfer (በባንክ)</option>
                <option value="Telebirr">Telebirr (ቴሌብር)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Account / Transaction / Phone Reference</label>
              <input
                type="text"
                value={editingVoucher.accountNumberOrPhone || ''}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, accountNumberOrPhone: e.target.value })}
                className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Total Grand Amount (ETB)</label>
              <input
                type="number"
                value={editingVoucher.grandTotal}
                onChange={(e) => setEditingVoucher({ ...editingVoucher, grandTotal: Number(e.target.value) })}
                className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs font-bold text-emerald-400 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Update Payment Slip Photo</label>
              <label className="flex items-center justify-center gap-1.5 h-10 bg-[#243244] hover:bg-[#2F4158] text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl cursor-pointer font-bold text-xs">
                <Upload size={14} />
                <span>Upload New Slip Image</span>
                <input type="file" accept="image/*" onChange={(e) => handleSlipFileUpload(e, 'edit')} className="hidden" />
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingVoucher(null)}
                className="flex-1 h-11 bg-[#243244] text-[#CBD5E1] rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-11 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 5: Manual New Voucher Direct Registration Modal */}
      {isRegisterNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <form
            onSubmit={handleSaveNewManualVoucher}
            className="bg-[#1E293B] border border-white/10 rounded-[28px] max-w-xl w-full p-6 space-y-4 shadow-2xl text-[#F8FAFC] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#F8FAFC]">Record New POS Sales Voucher</h3>
                <p className="text-xs text-[#94A3B8]">Direct manual registration for Cash, Card, Bank, or Telebirr sale.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterNewModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#D4AF37] mb-1">
                  🏬 Inventory Deduction Store (የሚቀነስበት ስቶር)
                </label>
                <select
                  value={newVoucherForm.storeName}
                  onChange={(e) => setNewVoucherForm({ ...newVoucherForm, storeName: e.target.value })}
                  className="w-full h-10 bg-[#243244] text-[#F8FAFC] font-semibold border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                >
                  {availableStores
                    .filter((s) => s !== 'ALL' && s !== 'All')
                    .map((st) => (
                      <option key={st} value={st}>
                        🏬 {st}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Customer Name</label>
                <input
                  type="text"
                  value={newVoucherForm.customerName}
                  onChange={(e) => setNewVoucherForm({ ...newVoucherForm, customerName: e.target.value })}
                  placeholder="e.g. Counter Guest / Walk-in"
                  className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Cashier Name</label>
                <input
                  type="text"
                  value={newVoucherForm.cashierName}
                  onChange={(e) => setNewVoucherForm({ ...newVoucherForm, cashierName: e.target.value })}
                  className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Date</label>
                <input
                  type="date"
                  value={newVoucherForm.date}
                  onChange={(e) => setNewVoucherForm({ ...newVoucherForm, date: e.target.value })}
                  className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Time</label>
                <input
                  type="text"
                  value={newVoucherForm.createdTime}
                  onChange={(e) => setNewVoucherForm({ ...newVoucherForm, createdTime: e.target.value })}
                  className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Payment Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Cash', 'Card', 'Bank Transfer', 'Telebirr'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNewVoucherForm({ ...newVoucherForm, paymentMethod: m })}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        newVoucherForm.paymentMethod === m
                          ? 'bg-[#D4AF37] text-[#0F172A] border-[#D4AF37] font-extrabold shadow'
                          : 'bg-[#243244] text-[#CBD5E1] border-white/10 hover:bg-[#2F4158]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                  Account / Bank / Telebirr Phone / Reference Number
                </label>
                <input
                  type="text"
                  value={newVoucherForm.accountNumberOrPhone}
                  onChange={(e) => setNewVoucherForm({ ...newVoucherForm, accountNumberOrPhone: e.target.value })}
                  placeholder="e.g. 100028391023 (CBE) or +251 911 445566 (Telebirr TB-8821)"
                  className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Items Selector */}
              <div className="sm:col-span-2 space-y-2 p-3 bg-[#243244] rounded-2xl border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#F8FAFC]">Selected Items</span>
                  <button
                    type="button"
                    onClick={() =>
                      setNewVoucherForm({
                        ...newVoucherForm,
                        selectedItems: [...newVoucherForm.selectedItems, { menuItemId: menuItems[0]?.id || '1', quantity: 1 }],
                      })
                    }
                    className="text-[11px] text-[#D4AF37] font-bold hover:underline cursor-pointer"
                  >
                    + Add Item Row
                  </button>
                </div>

                {newVoucherForm.selectedItems.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={row.menuItemId}
                      onChange={(e) => {
                        const updated = [...newVoucherForm.selectedItems];
                        updated[idx].menuItemId = e.target.value;
                        setNewVoucherForm({ ...newVoucherForm, selectedItems: updated });
                      }}
                      className="flex-1 h-9 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-xl px-2 text-xs focus:outline-none focus:border-[#D4AF37]"
                    >
                      {menuItems.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} - {m.price} ETB
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => {
                        const updated = [...newVoucherForm.selectedItems];
                        updated[idx].quantity = Math.max(1, Number(e.target.value));
                        setNewVoucherForm({ ...newVoucherForm, selectedItems: updated });
                      }}
                      className="w-16 h-9 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-xl px-2 text-xs text-center font-bold"
                    />

                    {newVoucherForm.selectedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = newVoucherForm.selectedItems.filter((_, i) => i !== idx);
                          setNewVoucherForm({ ...newVoucherForm, selectedItems: updated });
                        }}
                        className="p-2 text-red-400 hover:text-white cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Upload Slip Option */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Attach Payment Slip Photo</label>
                <label className="flex items-center justify-center gap-1.5 h-10 bg-[#243244] hover:bg-[#2F4158] text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl cursor-pointer font-bold text-xs">
                  <Upload size={15} />
                  <span>{newVoucherForm.slipPhotoUrl ? 'Change Uploaded Slip' : 'Upload Payment Slip / Screenshot'}</span>
                  <input type="file" accept="image/*" onChange={(e) => handleSlipFileUpload(e, 'manualNew')} className="hidden" />
                </label>
                {newVoucherForm.slipPhotoUrl && (
                  <div className="flex items-center gap-2 mt-2">
                    <img src={newVoucherForm.slipPhotoUrl} alt="Slip" className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                    <span className="text-[11px] text-emerald-400 font-bold">Slip image attached successfully!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsRegisterNewModalOpen(false)}
                className="flex-1 h-11 bg-[#243244] text-[#CBD5E1] rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-11 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold shadow-lg cursor-pointer"
              >
                Save & Register Voucher
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Floating Action Toolbar (When on Terminal Tab) */}
      {activeTab === 'terminal' && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0F141F]/95 backdrop-blur-md border-t border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2 shadow-2xl">
          <div className="flex items-center gap-2 mx-auto overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={handleHoldCurrentOrder}
              className="bg-[#141C2B] hover:bg-slate-800 text-slate-200 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Bookmark size={13} className="text-[#E5A93C]" />
              <span>Hold Order</span>
            </button>

            <button
              onClick={clearCart}
              className="bg-[#141C2B] hover:bg-rose-500/20 text-slate-200 hover:text-rose-400 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Trash2 size={13} className="text-rose-400" />
              <span>Clear Cart</span>
            </button>

            <button
              onClick={() => setIsDiscountModalOpen(true)}
              className="bg-[#141C2B] hover:bg-slate-800 text-slate-200 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Tag size={13} className="text-[#E5A93C]" />
              <span>Apply Discount</span>
            </button>

            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="bg-[#141C2B] hover:bg-slate-800 text-slate-200 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95"
            >
              <UserCheck size={13} className="text-[#E5A93C]" />
              <span>Add Customer</span>
            </button>

            <button
              onClick={() => {
                if (cart.length === 0) {
                  alert('Cart is empty. Add items to print preview.');
                  return;
                }
                const mockVoucher: POSReceiptVoucher = {
                  voucherId: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
                  orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
                  date: new Date().toISOString().split('T')[0],
                  cashierName: cashierName || 'Abebe Cashier',
                  customerName: customerName || 'Counter Guest',
                  items: cart.map((c) => ({ menuItem: c.item, quantity: c.qty })),
                  subtotal: subtotalCalculated,
                  tax: taxCalculated,
                  grandTotal: grandTotalCalculated,
                  paymentMethod: 'Cash',
                  accountNumberOrPhone: 'Counter Cash',
                  amountReceived: effectivePaidAmount || grandTotalCalculated,
                  mainIngredientStatus: 'Fully Available',
                  substitutionNotes: orderNote,
                  createdTime: currentTime.time,
                };
                setReceiptModal(mockVoucher);
              }}
              className="bg-[#141C2B] hover:bg-slate-800 text-slate-200 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Printer size={13} className="text-[#E5A93C]" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Hold Orders Viewer */}
      {isHoldOrdersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#141C2B] border border-slate-800 rounded-[24px] max-w-lg w-full p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bookmark size={18} className="text-[#E5A93C]" />
                <h3 className="font-bold text-base text-white">Held Orders ({heldOrders.length})</h3>
              </div>
              <button
                onClick={() => setIsHoldOrdersModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2.5">
              {heldOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No orders currently held on pause.
                </div>
              ) : (
                heldOrders.map((ho) => (
                  <div
                    key={ho.id}
                    className="bg-[#0B0F17] p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{ho.customer}</span>
                        <span className="text-[10px] bg-[#141C2B] text-[#E5A93C] px-2 py-0.5 rounded-md font-bold">
                          {ho.table}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {ho.items.length} items &bull; Total: <span className="font-bold text-white">{ho.total} ETB</span> &bull; <span className="text-slate-500">{ho.time}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleResumeHeldOrder(ho.id)}
                        className="bg-[#E5A93C] hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => handleDeleteHeldOrder(ho.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Barcode Scanner Modal */}
      {isBarcodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#141C2B] border border-slate-800 rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Barcode size={20} className="text-[#E5A93C]" />
                <h3 className="font-bold text-base text-white">Barcode Scanner</h3>
              </div>
              <button
                onClick={() => setIsBarcodeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Type or scan product barcode to instantly add to current order:
              </p>
              <input
                type="text"
                autoFocus
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && barcodeInput.trim()) {
                    const match = menuItems.find(
                      (m) =>
                        m.id.toLowerCase() === barcodeInput.toLowerCase() ||
                        m.name.toLowerCase().includes(barcodeInput.toLowerCase())
                    );
                    if (match) {
                      addToCartWithCheck(match);
                      setBarcodeInput('');
                      setIsBarcodeModalOpen(false);
                    } else {
                      alert('No matching product found for code: ' + barcodeInput);
                    }
                  }
                }}
                placeholder="Scan or enter code (e.g. 1, 2, Coffee)..."
                className="w-full h-11 bg-[#0B0F17] text-white border border-slate-800 rounded-xl px-3 text-xs focus:outline-none focus:border-[#E5A93C]"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBarcodeModalOpen(false)}
                  className="flex-1 h-10 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const match = menuItems.find(
                      (m) =>
                        m.id.toLowerCase() === barcodeInput.toLowerCase() ||
                        m.name.toLowerCase().includes(barcodeInput.toLowerCase())
                    );
                    if (match) {
                      addToCartWithCheck(match);
                      setBarcodeInput('');
                      setIsBarcodeModalOpen(false);
                    } else {
                      alert('No matching product found for code: ' + barcodeInput);
                    }
                  }}
                  className="flex-1 h-10 bg-[#E5A93C] text-black rounded-xl text-xs font-bold cursor-pointer"
                >
                  Find & Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Customer Selection Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#141C2B] border border-slate-800 rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <User size={18} className="text-[#E5A93C]" />
                <h3 className="font-bold text-base text-white">Select / Enter Customer</h3>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Counter Guest, John Doe, Table 4"
                  className="w-full h-10 bg-[#0B0F17] text-white border border-slate-800 rounded-xl px-3 text-xs focus:outline-none focus:border-[#E5A93C]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Cashier in Charge</label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full h-10 bg-[#0B0F17] text-white border border-slate-800 rounded-xl px-3 text-xs focus:outline-none focus:border-[#E5A93C]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="w-full h-10 bg-[#E5A93C] text-black font-bold rounded-xl text-xs cursor-pointer"
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Discount Adjustment Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#141C2B] border border-slate-800 rounded-[24px] max-w-sm w-full p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-[#E5A93C]" />
                <h3 className="font-bold text-base text-white">Order Discount</h3>
              </div>
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Discount Amount (ETB)</label>
                <input
                  type="number"
                  min={0}
                  value={discountEtb}
                  onChange={(e) => setDiscountEtb(Math.max(0, Number(e.target.value)))}
                  className="w-full h-10 bg-[#0B0F17] text-white border border-slate-800 rounded-xl px-3 text-xs font-bold text-amber-400 focus:outline-none focus:border-[#E5A93C]"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[0, 20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDiscountEtb(amt)}
                    className="py-1.5 bg-[#0B0F17] text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {amt} ETB
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="w-full h-10 bg-[#E5A93C] text-black font-bold rounded-xl text-xs cursor-pointer"
                >
                  Apply Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Quick Checkout / Pay Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#141C2B] border border-slate-800 rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#E5A93C]" />
                <h3 className="font-bold text-base text-white">Complete POS Checkout</h3>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-[#0B0F17] p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Table / Order:</span>
                <span className="font-bold text-white">{selectedTable} ({orderType})</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Customer:</span>
                <span className="font-bold text-white">{customerName || 'Counter Guest'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Items ({cart.reduce((s, c) => s + c.qty, 0)} pcs):</span>
                <span className="font-bold text-white">{subtotalCalculated} ETB</span>
              </div>
              {discountEtb > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Discount:</span>
                  <span>-{discountEtb} ETB</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>VAT (5%):</span>
                <span>{taxCalculated} ETB</span>
              </div>
              <div className="border-t border-slate-800 pt-1.5 flex justify-between text-sm font-extrabold text-white">
                <span>Grand Total:</span>
                <span className="text-[#E5A93C]">{grandTotalCalculated} ETB</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block">Select Payment Method:</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Cash Drawer', type: 'Cash' as const, icon: Coins },
                  { label: 'Telebirr QR', type: 'Telebirr' as const, icon: Phone },
                  { label: 'Bank (CBE/BOA)', type: 'Bank Transfer' as const, icon: Building2 },
                  { label: 'Card POS Terminal', type: 'Card' as const, icon: CreditCard },
                ].map((pm) => (
                  <button
                    key={pm.type}
                    type="button"
                    onClick={() => {
                      handleCheckoutFromBillTicket({
                        orderType,
                        tableNumber: selectedTable,
                        customerName: customerName || 'Counter Guest',
                        cashierName: cashierName || 'Abebe Cashier',
                        waiterName: 'Counter Waiter',
                        paymentType: pm.type,
                        selectedBank: 'Commercial Bank of Ethiopia (CBE)',
                        accountOrPhone: pm.type === 'Cash' ? 'Cash Tendered' : pm.type === 'Telebirr' ? 'Telebirr 0911000000' : 'POS 1000293849',
                        amountTendered: effectivePaidAmount || grandTotalCalculated,
                        slipPhoto: slipPhoto || '',
                        subtotal: subtotalCalculated,
                        discountAmount: discountEtb,
                        tax: taxCalculated,
                        grandTotal: grandTotalCalculated,
                        isPrintReceipt: true,
                      });
                      setIsCheckoutModalOpen(false);
                    }}
                    className="p-3 bg-[#0B0F17] hover:bg-[#1E293B] border border-slate-800 hover:border-[#E5A93C] rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer group"
                  >
                    <pm.icon size={16} className="text-[#E5A93C]" />
                    <div>
                      <span className="font-bold text-xs text-white block group-hover:text-[#E5A93C]">{pm.label}</span>
                      <span className="text-[10px] text-slate-500">Pay {grandTotalCalculated} ETB</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel / Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip Image Lightbox Zoom Modal */}
      {zoomSlipUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setZoomSlipUrl(null)}
        >
          <div className="relative max-w-2xl w-full bg-[#1E293B] rounded-2xl overflow-hidden p-2 border border-white/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-2 border-b border-white/10 text-xs">
              <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
                <ImageIcon size={16} className="text-[#D4AF37]" /> Payment Slip Photo Preview
              </span>
              <button onClick={() => setZoomSlipUrl(null)} className="p-1 text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img src={zoomSlipUrl} alt="Slip Full Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
