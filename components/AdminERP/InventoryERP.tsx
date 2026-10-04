import React, { useState } from 'react';
import { InventoryItem, StoreRecord, SpecialIngredientComponent } from '../../types';
import { SpecialIngredientModal } from './SpecialIngredientModal';
import {
  PackageCheck,
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  Tag,
  Box,
  Trash2,
  Upload,
  X,
  CheckCircle2,
  Layers,
  Building2,
  Clock,
  Sparkles,
  Check,
  Image as ImageIcon,
  Edit,
  Pencil,
  Printer,
  Share2,
  Copy,
  Download,
  ChefHat,
  Scale,
  RefreshCw,
  ExternalLink,
  FileText,
  Eye,
} from 'lucide-react';

interface InventoryERPProps {
  inventory: InventoryItem[];
  stores?: StoreRecord[];
  onUpdateStock: (id: string, change: number, action: 'add' | 'subtract', newExpiryDate?: string) => void;
  onAddInventoryItem: (item: Partial<InventoryItem>) => void;
  onUpdateInventoryItem?: (item: InventoryItem) => void;
  onDeleteInventoryItem: (id: string) => void;
  onProduceSpecialIngredient?: (
    specialItem: Partial<InventoryItem>,
    components: SpecialIngredientComponent[],
    options: { deductStock: boolean; notes?: string }
  ) => void;
}

const DEFAULT_CATEGORIES = [
  'Coffee Beans',
  'Dairy & Milk',
  'Bakery & Flour',
  'Syrups & Flavors',
  'Special Ingredients',
  'Teas & Spices',
  'Packaging & Bio-Compost',
  'Produce & Fruit',
  'Oils & Condiments',
  'Beverages',
];

const PRESET_IMAGES = [
  { label: 'Coffee Beans', url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80' },
  { label: 'Fresh Milk', url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80' },
  { label: 'Chocolate', url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=400&q=80' },
  { label: 'Butter', url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Caramel Syrup', url: 'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=400&q=80' },
  { label: 'Vanilla Mix', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80' },
  { label: 'Pizza Dough', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
  { label: 'Garlic Butter', url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Eco Cups', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=400&q=80' },
  { label: 'Spices & Tea', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Flour & Grain', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
];

export interface SpecialProductionVoucher {
  voucherId: string;
  date: string;
  time: string;
  storeName: string;
  operator: string;
  producedItem: {
    name: string;
    sku: string;
    category: string;
    qty: number;
    unit: string;
    costPerUnit: number;
    totalBatchCost: number;
    image?: string;
  };
  components: SpecialIngredientComponent[];
  notes?: string;
}

export const InventoryERP: React.FC<InventoryERPProps> = ({
  inventory,
  stores = [],
  onUpdateStock,
  onAddInventoryItem,
  onUpdateInventoryItem,
  onDeleteInventoryItem,
  onProduceSpecialIngredient,
}) => {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStore, setSelectedStore] = useState<string>('All');
  const [filterType, setFilterType] = useState<'All' | 'LowStock' | 'ExpiringSoon' | 'SpecialIngredients'>('All');
  const [search, setSearch] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  // Special Ingredient Modal state
  const [isSpecialModalOpen, setIsSpecialModalOpen] = useState<boolean>(false);
  const [lastProducedVoucher, setLastProducedVoucher] = useState<SpecialProductionVoucher | null>(null);

  // Reproduce batch state for existing special ingredient
  const [reproducingItem, setReproducingItem] = useState<InventoryItem | null>(null);
  const [reproduceBatchCount, setReproduceBatchCount] = useState<number>(1);
  const [viewingFormulaItem, setViewingFormulaItem] = useState<InventoryItem | null>(null);

  // Editing Ingredient State
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    brand: '',
    category: 'Coffee Beans',
    sku: '',
    unit: 'kg',
    stockQty: '0',
    storeName: 'Bole Main Central Store',
    reorderLevel: '5',
    costPerUnit: '100',
    supplierName: '',
    image: PRESET_IMAGES[0].url,
    hasExpiry: true,
    expiryDate: '',
  });
  const [editPreviewImage, setEditPreviewImage] = useState<string>(PRESET_IMAGES[0].url);

  // Stock In Modal
  const [stockInItem, setStockInItem] = useState<InventoryItem | null>(null);
  const [stockInQty, setStockInQty] = useState<number>(10);
  const [stockInExpiry, setStockInExpiry] = useState<string>('');

  // New Ingredient Form state
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'Coffee Beans',
    sku: '',
    unit: 'kg',
    stockQty: '10',
    storeName: stores.length > 0 ? stores[0].name : 'Bole Main Central Store',
    reorderLevel: '5',
    costPerUnit: '150',
    supplierName: 'Abyssinia Coffee Traders',
    image: PRESET_IMAGES[0].url,
    hasExpiry: true,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [previewImage, setPreviewImage] = useState<string>(PRESET_IMAGES[0].url);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Helper calculation for expiry status
  const getExpiryStatus = (item: InventoryItem) => {
    if (!item.hasExpiry || !item.expiryDate) {
      return { status: 'none', label: 'No Expiry', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(item.expiryDate);
    expDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', label: `Expired (${Math.abs(diffDays)}d ago)`, color: 'bg-red-500/20 text-red-400 border-red-500/30 font-bold animate-pulse' };
    }
    if (diffDays <= 30) {
      return { status: 'expiring', label: `Expires in ${diffDays}d`, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold' };
    }
    return { status: 'valid', label: `Exp: ${item.expiryDate}`, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  };

  // Image Upload Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setFormData((prev) => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditPreviewImage(result);
        setEditFormData((prev) => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const cleanCat = newCategoryName.trim();
    if (!categories.includes(cleanCat)) {
      setCategories((prev) => [...prev, cleanCat]);
      setFormData((prev) => ({ ...prev, category: cleanCat }));
    }
    setNewCategoryName('');
    setIsCategoryModalOpen(false);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      brand: item.brand || '',
      category: item.category || 'Coffee Beans',
      sku: item.sku,
      unit: item.unit,
      stockQty: String(item.stockQty),
      storeName: item.storeName || 'Bole Main Central Store',
      reorderLevel: String(item.reorderLevel),
      costPerUnit: String(item.costPerUnit),
      supplierName: item.supplierName,
      image: item.image || PRESET_IMAGES[0].url,
      hasExpiry: Boolean(item.hasExpiry),
      expiryDate: item.expiryDate || '',
    });
    setEditPreviewImage(item.image || PRESET_IMAGES[0].url);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updatedItem: InventoryItem = {
      ...editingItem,
      name: editFormData.name,
      brand: editFormData.brand,
      category: editFormData.category,
      sku: editFormData.sku,
      unit: editFormData.unit,
      stockQty: parseFloat(editFormData.stockQty) || 0,
      storeName: editFormData.storeName,
      reorderLevel: parseFloat(editFormData.reorderLevel) || 0,
      costPerUnit: parseFloat(editFormData.costPerUnit) || 0,
      supplierName: editFormData.supplierName,
      image: editFormData.image || editPreviewImage,
      hasExpiry: editFormData.hasExpiry,
      expiryDate: editFormData.hasExpiry ? editFormData.expiryDate : undefined,
    };

    if (onUpdateInventoryItem) {
      onUpdateInventoryItem(updatedItem);
    }
    setEditingItem(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddInventoryItem({
      ...formData,
      stockQty: parseFloat(formData.stockQty) || 0,
      reorderLevel: parseFloat(formData.reorderLevel) || 0,
      costPerUnit: parseFloat(formData.costPerUnit) || 0,
      image: previewImage,
      expiryDate: formData.hasExpiry ? formData.expiryDate : undefined,
    });
    setIsAddModalOpen(false);
    // Reset form
    setFormData({
      name: '',
      brand: '',
      category: 'Coffee Beans',
      sku: '',
      unit: 'kg',
      stockQty: '10',
      storeName: stores.length > 0 ? stores[0].name : 'Bole Main Central Store',
      reorderLevel: '5',
      costPerUnit: '150',
      supplierName: 'Abyssinia Coffee Traders',
      image: PRESET_IMAGES[0].url,
      hasExpiry: true,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stockInItem && stockInQty > 0) {
      onUpdateStock(stockInItem.id, stockInQty, 'add', stockInExpiry || undefined);
      setStockInItem(null);
      setStockInQty(10);
      setStockInExpiry('');
    }
  };

  // Special Ingredient Production Trigger & Voucher Generator
  const handleSpecialIngredientProduced = (
    specialItemData: Partial<InventoryItem>,
    components: SpecialIngredientComponent[],
    options: { deductStock: boolean; notes?: string }
  ) => {
    if (onProduceSpecialIngredient) {
      onProduceSpecialIngredient(specialItemData, components, options);
    } else {
      // Fallback local production
      if (options.deductStock) {
        for (const comp of components) {
          onUpdateStock(comp.inventoryId, comp.qty, 'subtract');
        }
      }
      onAddInventoryItem(specialItemData);
    }

    // Build the production voucher for display, printing & sharing
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const voucher: SpecialProductionVoucher = {
      voucherId: `SPV-${Date.now().toString().slice(-4)}`,
      date: today,
      time: timeNow,
      storeName: specialItemData.storeName || 'Bole Main Central Store',
      operator: 'Chef / Barista Lead',
      producedItem: {
        name: specialItemData.name || 'House Special Mix',
        sku: specialItemData.sku || `SP-${Math.floor(1000 + Math.random() * 9000)}`,
        category: specialItemData.category || 'Special Ingredients',
        qty: Number(specialItemData.stockQty) || 1,
        unit: specialItemData.unit || 'kg',
        costPerUnit: Number(specialItemData.costPerUnit) || 0,
        totalBatchCost: (Number(specialItemData.stockQty) || 1) * (Number(specialItemData.costPerUnit) || 0),
        image: specialItemData.image,
      },
      components,
      notes: options.notes,
    };

    setLastProducedVoucher(voucher);
  };

  // Re-batch existing special ingredient
  const handleConfirmReproduceBatch = () => {
    if (!reproducingItem || !reproducingItem.recipeComponents || reproducingItem.recipeComponents.length === 0) {
      return;
    }

    const multiplier = Math.max(1, reproduceBatchCount);
    const scaledYield = (reproducingItem.yieldQty || 1) * multiplier;

    // Scale components
    const scaledComponents: SpecialIngredientComponent[] = reproducingItem.recipeComponents.map((c) => ({
      ...c,
      qty: Math.round(c.qty * multiplier * 1000) / 1000,
      totalCost: Math.round(c.unitCost * c.qty * multiplier * 100) / 100,
    }));

    const totalCost = scaledComponents.reduce((sum, c) => sum + c.totalCost, 0);
    const unitCost = Math.round((totalCost / scaledYield) * 100) / 100;

    const specialItemData: Partial<InventoryItem> = {
      name: reproducingItem.name,
      brand: reproducingItem.brand || 'In-House Special',
      category: reproducingItem.category || 'Special Ingredients',
      sku: reproducingItem.sku,
      unit: reproducingItem.unit,
      stockQty: scaledYield,
      storeName: reproducingItem.storeName || 'Bole Main Central Store',
      reorderLevel: reproducingItem.reorderLevel,
      costPerUnit: unitCost,
      supplierName: 'In-House Kitchen Production',
      image: reproducingItem.image,
      hasExpiry: reproducingItem.hasExpiry,
      expiryDate: reproducingItem.expiryDate,
      isSpecialIngredient: true,
      recipeComponents: reproducingItem.recipeComponents,
      yieldQty: scaledYield,
      yieldUnit: reproducingItem.unit,
    };

    handleSpecialIngredientProduced(specialItemData, scaledComponents, {
      deductStock: true,
      notes: `Batch Re-production (${multiplier}x Batch = ${scaledYield} ${reproducingItem.unit})`,
    });

    setReproducingItem(null);
    setReproduceBatchCount(1);
  };

  // Copy Voucher text to clipboard
  const handleCopyVoucherText = () => {
    if (!lastProducedVoucher) return;
    const v = lastProducedVoucher;
    const text = `================================================
LINA CAFE & RESTAURANT ERP
SPECIAL PREPARATION VOUCHER [${v.voucherId}]
================================================
Date: ${v.date} ${v.time}
Kitchen/Store: ${v.storeName}
Operator: ${v.operator}
------------------------------------------------
PRODUCED SPECIAL ITEM:
Name: ${v.producedItem.name} (${v.producedItem.sku})
Quantity: ${v.producedItem.qty} ${v.producedItem.unit}
Unit Cost: ${v.producedItem.costPerUnit.toFixed(2)} ETB/${v.producedItem.unit}
Total Material Cost: ${v.producedItem.totalBatchCost.toFixed(2)} ETB
------------------------------------------------
RAW MATERIALS CONSUMED:
${v.components
  .map(
    (c, i) =>
      `${i + 1}. ${c.ingredientName} (${c.sku}): ${c.qty} ${c.unit} @ ${c.unitCost} ETB = ${c.totalCost.toFixed(2)} ETB`
  )
  .join('\n')}
================================================
Total Batch Expense: ${v.producedItem.totalBatchCost.toFixed(2)} ETB
Notes: ${v.notes || 'In-House Batch Preparation'}
================================================`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Download Voucher TXT
  const handleDownloadVoucherTxt = () => {
    if (!lastProducedVoucher) return;
    const v = lastProducedVoucher;
    const text = `================================================
LINA CAFE & RESTAURANT ERP
SPECIAL PREPARATION VOUCHER [${v.voucherId}]
================================================
Date: ${v.date} ${v.time}
Kitchen/Store: ${v.storeName}
Operator: ${v.operator}
------------------------------------------------
PRODUCED SPECIAL ITEM:
Name: ${v.producedItem.name} (${v.producedItem.sku})
Quantity: ${v.producedItem.qty} ${v.producedItem.unit}
Unit Cost: ${v.producedItem.costPerUnit.toFixed(2)} ETB/${v.producedItem.unit}
Total Material Cost: ${v.producedItem.totalBatchCost.toFixed(2)} ETB
------------------------------------------------
RAW MATERIALS CONSUMED:
${v.components
  .map(
    (c, i) =>
      `${i + 1}. ${c.ingredientName} (${c.sku}): ${c.qty} ${c.unit} @ ${c.unitCost} ETB = ${c.totalCost.toFixed(2)} ETB`
  )
  .join('\n')}
================================================
Total Batch Expense: ${v.producedItem.totalBatchCost.toFixed(2)} ETB
Notes: ${v.notes || 'In-House Batch Preparation'}
================================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Voucher-${v.voucherId}-${v.producedItem.name.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Share to Telegram
  const handleShareTelegram = () => {
    if (!lastProducedVoucher) return;
    const v = lastProducedVoucher;
    const summary = `✨ *Lina ERP - Special Ingredient Voucher [${v.voucherId}]*\n\n📦 *Produced Item:* ${v.producedItem.name}\n📊 *Yield:* ${v.producedItem.qty} ${v.producedItem.unit} (@ ${v.producedItem.costPerUnit} ETB/${v.producedItem.unit})\n💰 *Total Batch Cost:* ${v.producedItem.totalBatchCost.toFixed(2)} ETB\n🏢 *Store:* ${v.storeName}\n📅 *Date:* ${v.date} ${v.time}\n\n*Raw Ingredients Deducted:*\n${v.components.map((c) => `• ${c.qty} ${c.unit} ${c.ingredientName} (${c.totalCost.toFixed(2)} ETB)`).join('\n')}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://linacafe.et')}&text=${encodeURIComponent(summary)}`;
    window.open(url, '_blank');
  };

  // Share to WhatsApp
  const handleShareWhatsApp = () => {
    if (!lastProducedVoucher) return;
    const v = lastProducedVoucher;
    const summary = `*Lina ERP - Special Prep Voucher [${v.voucherId}]*\n\nProduced: *${v.producedItem.name}*\nYield: ${v.producedItem.qty} ${v.producedItem.unit} (@ ${v.producedItem.costPerUnit} ETB)\nBatch Cost: ${v.producedItem.totalBatchCost.toFixed(2)} ETB\nStore: ${v.storeName}\n\nRaw Materials Used:\n${v.components.map((c) => `• ${c.qty} ${c.unit} ${c.ingredientName} (${c.totalCost.toFixed(2)} ETB)`).join('\n')}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(summary)}`;
    window.open(url, '_blank');
  };

  // Filter logic
  const availableStores = ['All', ...Array.from(new Set(inventory.map((i) => i.storeName || 'Bole Main Central Store')))];

  const filteredInventory = inventory.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(search.toLowerCase())) ||
      item.supplierName.toLowerCase().includes(search.toLowerCase());

    const itemStore = item.storeName || 'Bole Main Central Store';
    const matchesStore = selectedStore === 'All' || itemStore === selectedStore;

    const expStatus = getExpiryStatus(item);
    let matchesFilter = true;
    if (filterType === 'LowStock') {
      matchesFilter = item.stockQty <= item.reorderLevel;
    } else if (filterType === 'ExpiringSoon') {
      matchesFilter = expStatus.status === 'expired' || expStatus.status === 'expiring';
    } else if (filterType === 'SpecialIngredients') {
      matchesFilter = Boolean(item.isSpecialIngredient || item.category === 'Special Ingredients');
    }

    return matchesCategory && matchesSearch && matchesStore && matchesFilter;
  });

  const lowStockCount = inventory.filter((i) => i.stockQty <= i.reorderLevel).length;
  const expiringCount = inventory.filter((i) => {
    const status = getExpiryStatus(i).status;
    return status === 'expired' || status === 'expiring';
  }).length;
  const specialIngredientsCount = inventory.filter(
    (i) => i.isSpecialIngredient || i.category === 'Special Ingredients'
  ).length;

  const totalValue = inventory.reduce((sum, item) => sum + item.stockQty * item.costPerUnit, 0);

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
              Warehouse & Raw Materials ERP
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1.5 flex items-center gap-2.5">
            <PackageCheck className="text-[#D4AF37]" size={28} />
            Raw Ingredients & Inventory ERP
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Register raw materials, units (kg, liters, grams), calculate compound special ingredients, and track expiration dates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Produce Special Ingredient Button */}
          <button
            onClick={() => setIsSpecialModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] via-[#F6C453] to-[#D4AF37] hover:from-[#F6C453] hover:to-[#D4AF37] text-[#0F172A] rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg hover:shadow-[#D4AF37]/30 active:scale-95 min-h-[44px] cursor-pointer"
          >
            <Sparkles size={18} className="animate-pulse" />
            <span>✨ Create Special Ingredient (ስፔሻል ጥሬ ዕቃ አዘጋጅ)</span>
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2.5 bg-[#1E293B] hover:bg-[#2F4158] text-[#CBD5E1] hover:text-white border border-white/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-all min-h-[44px] cursor-pointer"
          >
            <Layers size={16} className="text-[#D4AF37]" />
            <span>Categories</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-[#1E293B] hover:bg-[#2F4158] text-[#F8FAFC] border border-white/15 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 min-h-[44px] cursor-pointer"
          >
            <Plus size={18} className="text-[#D4AF37]" />
            <span>Register Raw Material</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <div className="bg-[#243244] p-4 sm:p-5 rounded-[20px] border border-white/10 shadow-md">
          <span className="text-[11px] font-semibold text-[#94A3B8] block mb-1 uppercase tracking-wider">Total Raw SKUs</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">{inventory.length}</span>
            <span className="text-xs font-mono text-[#D4AF37]">{totalValue.toLocaleString()} ETB</span>
          </div>
        </div>

        <div className="bg-[#243244] p-4 sm:p-5 rounded-[20px] border border-white/10 shadow-md">
          <span className="text-[11px] font-semibold text-[#94A3B8] block mb-1 uppercase tracking-wider">Special In-House Mixes</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37]">{specialIngredientsCount}</span>
            <Sparkles className="text-[#D4AF37]" size={22} />
          </div>
        </div>

        <div className="bg-[#243244] p-4 sm:p-5 rounded-[20px] border border-white/10 shadow-md">
          <span className="text-[11px] font-semibold text-[#94A3B8] block mb-1 uppercase tracking-wider">Low Stock Alerts</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F59E0B]">{lowStockCount}</span>
            <AlertTriangle className="text-[#F59E0B]" size={22} />
          </div>
        </div>

        <div className="bg-[#243244] p-4 sm:p-5 rounded-[20px] border border-white/10 shadow-md">
          <span className="text-[11px] font-semibold text-[#94A3B8] block mb-1 uppercase tracking-wider">Expiry Risks</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#EF4444]">{expiringCount}</span>
            <Clock className="text-[#EF4444]" size={22} />
          </div>
        </div>
      </div>

      {/* Search & Category Filter bar */}
      <div className="bg-[#243244] p-4 rounded-[20px] border border-white/10 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredient by name, brand, SKU, formula, or supplier..."
              className="w-full h-[48px] bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-11 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
            />
            <Search size={18} className="absolute left-3.5 top-3.5 text-[#94A3B8]" />
          </div>

          {/* Store Location Filter */}
          <div className="flex items-center gap-2 bg-[#1E293B] border border-white/10 rounded-xl px-3 py-1.5 shrink-0">
            <Building2 size={16} className="text-[#D4AF37]" />
            <span className="text-[11px] font-bold text-[#94A3B8] whitespace-nowrap">Store:</span>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-transparent text-[#F8FAFC] text-xs font-bold focus:outline-none cursor-pointer pr-1"
            >
              {availableStores.map((s) => (
                <option key={s} value={s} className="bg-[#1E293B] text-white">
                  {s === 'All' ? '🏢 All Stores & Warehouses' : s}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Filter Status Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setFilterType('All')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                filterType === 'All'
                  ? 'bg-[#D4AF37] text-[#0F172A] border-[#D4AF37]'
                  : 'bg-[#1E293B] text-[#CBD5E1] border-white/10 hover:bg-[#2F4158]'
              }`}
            >
              All SKUs ({inventory.length})
            </button>
            <button
              onClick={() => setFilterType('SpecialIngredients')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'SpecialIngredients'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#F6C453] text-[#0F172A] font-black border-[#D4AF37]'
                  : 'bg-[#1E293B] text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#2F4158]'
              }`}
            >
              <Sparkles size={13} />
              <span>Special Mixes ({specialIngredientsCount})</span>
            </button>
            <button
              onClick={() => setFilterType('LowStock')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                filterType === 'LowStock'
                  ? 'bg-[#F59E0B] text-[#0F172A] border-[#F59E0B]'
                  : 'bg-[#1E293B] text-[#CBD5E1] border-white/10 hover:bg-[#2F4158]'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              onClick={() => setFilterType('ExpiringSoon')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                filterType === 'ExpiringSoon'
                  ? 'bg-[#EF4444] text-white border-[#EF4444]'
                  : 'bg-[#1E293B] text-[#CBD5E1] border-white/10 hover:bg-[#2F4158]'
              }`}
            >
              Expiring Risks ({expiringCount})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-white/5">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold'
                : 'bg-[#1E293B] text-[#94A3B8] border border-white/5 hover:text-white'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold'
                  : 'bg-[#1E293B] text-[#94A3B8] border border-white/5 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table / Mobile Grid */}
      <div className="bg-[#243244] rounded-[22px] border border-white/10 overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1E293B] border-b border-white/10 text-[#CBD5E1] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Raw Ingredient & Brand</th>
                <th className="p-4">Category & Formula</th>
                <th className="p-4">Stock Level & Unit</th>
                <th className="p-4">Unit Cost</th>
                <th className="p-4">Expiration Status</th>
                <th className="p-4">Source / Supplier</th>
                <th className="p-4 text-center">Actions / Stock In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#94A3B8] text-xs">
                    No raw ingredients match your query. Click "Register Ingredient" or "Create Special Ingredient" to add items.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const expInfo = getExpiryStatus(item);
                  const isSpecial = Boolean(item.isSpecialIngredient || item.category === 'Special Ingredients');
                  const hasFormula = item.recipeComponents && item.recipeComponents.length > 0;

                  return (
                    <tr key={item.id} className="hover:bg-[#2F4158] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || PRESET_IMAGES[0].url}
                            alt={item.name}
                            className="w-11 h-11 object-cover rounded-xl border border-white/10 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#F8FAFC] text-sm block">{item.name}</span>
                              {isSpecial && (
                                <span className="text-[9px] bg-gradient-to-r from-[#D4AF37] to-[#F6C453] text-[#0F172A] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs shrink-0">
                                  <Sparkles size={10} /> Special Mix
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.brand && (
                                <span className="text-[10px] text-[#D4AF37] font-semibold bg-[#1E293B] px-1.5 py-0.5 rounded border border-[#D4AF37]/30">
                                  {item.brand}
                                </span>
                              )}
                              <span className="text-[10px] text-[#94A3B8] font-mono">{item.sku}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-[#CBD5E1]">
                        <span className="bg-[#1E293B] px-2.5 py-1 rounded-lg text-xs border border-white/5 font-medium inline-block">
                          {item.category}
                        </span>
                        {hasFormula && (
                          <button
                            type="button"
                            onClick={() => setViewingFormulaItem(item)}
                            className="block mt-1 text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <ChefHat size={11} /> Formula ({item.recipeComponents!.length} ingredients)
                          </button>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#F8FAFC]">
                            {item.stockQty} {item.unit}
                          </span>
                          {item.stockQty <= item.reorderLevel && (
                            <span className="text-[10px] bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 font-bold px-2 py-0.5 rounded-full">
                              Low Stock
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#94A3B8] block mt-0.5">Reorder at {item.reorderLevel} {item.unit}</span>
                        <span className="text-[10px] text-[#D4AF37] font-semibold flex items-center gap-1 mt-1">
                          <Building2 size={11} /> {item.storeName || 'Bole Main Central Store'}
                        </span>
                      </td>

                      <td className="p-4 font-extrabold text-[#D4AF37] text-sm">
                        {item.costPerUnit.toFixed(2)} ETB/{item.unit}
                      </td>

                      <td className="p-4">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full border ${expInfo.color} inline-block font-semibold`}>
                          {expInfo.label}
                        </span>
                      </td>

                      <td className="p-4 text-[#CBD5E1]">
                        <span className="text-xs">{item.supplierName}</span>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* If Special Ingredient with formula, provide 1-click Re-batch */}
                          {hasFormula ? (
                            <button
                              onClick={() => {
                                setReproducingItem(item);
                                setReproduceBatchCount(1);
                              }}
                              className="bg-gradient-to-r from-[#D4AF37] to-[#F6C453] text-[#0F172A] text-xs font-black px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                              title="Produce more batches of this formula (ድጋሚ አዘጋጅ)"
                            >
                              <Sparkles size={13} /> Batch Produce
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setStockInItem(item);
                                setStockInQty(10);
                                setStockInExpiry(item.expiryDate || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0]);
                              }}
                              className="bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                              title="Add stock in"
                            >
                              <Plus size={13} /> Stock In
                            </button>
                          )}

                          <button
                            onClick={() => onUpdateStock(item.id, 1, 'subtract')}
                            className="bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 text-xs font-bold px-2 py-1.5 rounded-xl transition-all cursor-pointer"
                            title="Subtract 1 unit from stock"
                          >
                            - Out
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            title="Edit Ingredient Details"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          <button
                            onClick={() => onDeleteInventoryItem(item.id)}
                            className="p-1.5 text-gray-400 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete SKU"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View (< 768px) */}
        <div className="md:hidden divide-y divide-white/10">
          {filteredInventory.length === 0 ? (
            <div className="p-8 text-center text-[#94A3B8] text-xs">
              No raw ingredients match your search query.
            </div>
          ) : (
            filteredInventory.map((item) => {
              const expInfo = getExpiryStatus(item);
              const isSpecial = Boolean(item.isSpecialIngredient || item.category === 'Special Ingredients');
              const hasFormula = item.recipeComponents && item.recipeComponents.length > 0;

              return (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={item.image || PRESET_IMAGES[0].url}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-xl border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-[#F8FAFC] text-sm leading-tight truncate">{item.name}</h3>
                        {isSpecial && (
                          <span className="text-[9px] bg-gradient-to-r from-[#D4AF37] to-[#F6C453] text-[#0F172A] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                            <Sparkles size={10} /> Special
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.brand && (
                          <span className="text-[10px] text-[#D4AF37] font-semibold bg-[#1E293B] px-1.5 py-0.5 rounded border border-[#D4AF37]/30">
                            {item.brand}
                          </span>
                        )}
                        <span className="text-[10px] text-[#94A3B8] font-mono">{item.sku}</span>
                        <span className="text-[10px] bg-[#1E293B] text-[#CBD5E1] px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteInventoryItem(item.id)}
                      className="p-2 text-gray-400 hover:text-[#EF4444] cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#1E293B] p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[#94A3B8] text-[10px] uppercase block">Current Stock</span>
                      <span className="font-extrabold text-[#F8FAFC] text-sm">{item.stockQty} {item.unit}</span>
                      <span className="text-[10px] text-[#94A3B8] block mt-0.5">{item.storeName || 'Bole Main Central Store'}</span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] text-[10px] uppercase block">Unit Cost</span>
                      <span className="font-extrabold text-[#D4AF37] text-sm">{item.costPerUnit.toFixed(2)} ETB/{item.unit}</span>
                      {hasFormula && (
                        <button
                          type="button"
                          onClick={() => setViewingFormulaItem(item)}
                          className="text-[10px] text-[#22C55E] underline block mt-0.5 cursor-pointer"
                        >
                          View Formula ({item.recipeComponents!.length})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-[#94A3B8] block">Expiration Status</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${expInfo.color} font-semibold inline-block mt-0.5`}>
                        {expInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasFormula ? (
                        <button
                          onClick={() => {
                            setReproducingItem(item);
                            setReproduceBatchCount(1);
                          }}
                          className="bg-gradient-to-r from-[#D4AF37] to-[#F6C453] text-[#0F172A] text-xs font-black px-3 py-1.5 rounded-xl shadow cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles size={13} /> Produce
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setStockInItem(item);
                            setStockInQty(10);
                            setStockInExpiry(item.expiryDate || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0]);
                          }}
                          className="bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 text-xs font-bold px-2.5 py-1.5 rounded-xl active:scale-95 transition-all cursor-pointer"
                        >
                          + In
                        </button>
                      )}
                      <button
                        onClick={() => onUpdateStock(item.id, 1, 'subtract')}
                        className="bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 text-xs font-bold px-2.5 py-1.5 rounded-xl active:scale-95 transition-all cursor-pointer"
                      >
                        - Out
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold px-2.5 py-1.5 rounded-xl active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SPECIAL INGREDIENT CREATION MODAL */}
      <SpecialIngredientModal
        isOpen={isSpecialModalOpen}
        onClose={() => setIsSpecialModalOpen(false)}
        inventory={inventory}
        stores={stores}
        onProduceSpecialIngredient={handleSpecialIngredientProduced}
      />

      {/* REPRODUCE BATCH MODAL (1-Click Re-Batch for existing special ingredients) */}
      {reproducingItem && reproducingItem.recipeComponents && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-[#1E293B] border border-[#D4AF37]/30 rounded-[28px] max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-[#F8FAFC] my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#F6C453] text-[#0F172A] flex items-center justify-center font-black">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#F8FAFC]">Produce More Batches</h3>
                  <p className="text-xs text-[#94A3B8]">{reproducingItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setReproducingItem(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-[#243244] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Batch multiplier selector */}
            <div className="bg-[#243244] p-4 rounded-2xl border border-white/10 space-y-3">
              <label className="block text-xs font-bold text-[#CBD5E1]">
                Number of Batches to Produce (የምርት ዙሮች ብዛት):
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setReproduceBatchCount(num)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      reproduceBatchCount === num
                        ? 'bg-[#D4AF37] text-[#0F172A] border-[#D4AF37]'
                        : 'bg-[#1E293B] text-[#CBD5E1] border-white/10 hover:bg-[#2F4158]'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-[#94A3B8]">Total Output Yield:</span>
                <span className="font-extrabold text-[#22C55E] text-sm">
                  {((reproducingItem.yieldQty || 1) * reproduceBatchCount).toFixed(1)} {reproducingItem.unit}
                </span>
              </div>
            </div>

            {/* Ingredient deductions breakdown & stock check */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block">
                Required Raw Deductions:
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {reproducingItem.recipeComponents.map((comp) => {
                  const reqQty = Math.round(comp.qty * reproduceBatchCount * 1000) / 1000;
                  const invSource = inventory.find((i) => i.id === comp.inventoryId);
                  const avail = invSource ? invSource.stockQty : 0;
                  const hasEnough = avail >= reqQty;

                  return (
                    <div
                      key={comp.inventoryId}
                      className="p-2.5 bg-[#243244] rounded-xl border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-[#F8FAFC] truncate block">{comp.ingredientName}</span>
                        <span className="text-[10px] text-[#94A3B8]">
                          Need: {reqQty} {comp.unit} | Available: {avail} {comp.unit}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hasEnough
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {hasEnough ? 'Available' : 'Shortage'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setReproducingItem(null)}
                className="px-4 py-2.5 rounded-xl bg-[#243244] text-[#CBD5E1] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReproduceBatch}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F6C453] text-[#0F172A] text-xs font-black flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Sparkles size={16} /> Confirm & Deduct Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW FORMULA MODAL */}
      {viewingFormulaItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1E293B] border border-white/15 rounded-[28px] max-w-lg w-full p-6 space-y-4 shadow-2xl text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={viewingFormulaItem.image || PRESET_IMAGES[0].url}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#F8FAFC]">{viewingFormulaItem.name} Formula</h3>
                  <span className="text-[10px] text-[#94A3B8]">
                    Yields {viewingFormulaItem.yieldQty || viewingFormulaItem.stockQty} {viewingFormulaItem.unit} @ {viewingFormulaItem.costPerUnit} ETB/{viewingFormulaItem.unit}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingFormulaItem(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-[#243244] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#D4AF37]">Recipe Ingredients Breakdown:</span>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {viewingFormulaItem.recipeComponents?.map((comp, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#243244] rounded-xl border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1E293B] text-[10px] font-bold text-[#D4AF37] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-[#F8FAFC] block">{comp.ingredientName}</span>
                        <span className="text-[10px] text-[#94A3B8] font-mono">{comp.sku}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#22C55E]">
                        {comp.qty} {comp.unit}
                      </span>
                      <span className="text-[10px] text-[#D4AF37] block font-mono">
                        {(comp.totalCost || comp.qty * comp.unitCost).toFixed(2)} ETB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setViewingFormulaItem(null)}
                className="px-4 py-2 bg-[#243244] text-[#CBD5E1] hover:text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPECIAL PRODUCTION VOUCHER / RECEIPT TICKET MODAL */}
      {lastProducedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-[#1E293B] border border-[#D4AF37]/40 rounded-[28px] max-w-xl w-full p-6 space-y-5 shadow-2xl text-[#F8FAFC] my-auto">
            {/* Voucher Header & Actions */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#F6C453] text-[#0F172A] flex items-center justify-center font-black shadow-lg">
                  <ChefHat size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                    Official Production Voucher (SPV)
                  </span>
                  <h3 className="font-serif font-bold text-lg text-[#F8FAFC] mt-0.5">
                    Special Preparation Completed!
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setLastProducedVoucher(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full bg-[#243244] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Voucher Printable Ticket Content */}
            <div
              id="printable-special-voucher"
              className="bg-[#243244] p-5 rounded-2xl border border-white/10 space-y-4 text-xs font-sans text-[#F8FAFC]"
            >
              <div className="text-center border-b border-dashed border-white/20 pb-3 space-y-1">
                <h4 className="font-serif font-black text-base text-[#D4AF37] tracking-wider uppercase">
                  Lina Cafe & Restaurant ERP
                </h4>
                <p className="text-[10px] text-[#94A3B8]">Compound Special Ingredient Production Ledger</p>
                <div className="flex justify-between items-center text-[10px] text-[#CBD5E1] pt-1">
                  <span className="font-mono font-bold text-[#D4AF37]">VOUCHER: {lastProducedVoucher.voucherId}</span>
                  <span>{lastProducedVoucher.date} {lastProducedVoucher.time}</span>
                </div>
              </div>

              {/* Produced Product Details */}
              <div className="bg-[#1E293B] p-3.5 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={lastProducedVoucher.producedItem.image || PRESET_IMAGES[0].url}
                    alt=""
                    className="w-12 h-12 object-cover rounded-xl border border-white/15"
                  />
                  <div>
                    <span className="font-extrabold text-sm text-[#F8FAFC] block">
                      {lastProducedVoucher.producedItem.name}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] font-mono">
                      SKU: {lastProducedVoucher.producedItem.sku} • {lastProducedVoucher.storeName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-base text-[#22C55E] block">
                    +{lastProducedVoucher.producedItem.qty} {lastProducedVoucher.producedItem.unit}
                  </span>
                  <span className="text-[10px] text-[#D4AF37] font-bold">
                    @{lastProducedVoucher.producedItem.costPerUnit.toFixed(2)} ETB/{lastProducedVoucher.producedItem.unit}
                  </span>
                </div>
              </div>

              {/* Deducted Raw Ingredients Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-[#CBD5E1] uppercase tracking-wider">
                  <span>Consumed Raw Materials</span>
                  <span>Deducted Cost (ETB)</span>
                </div>
                <div className="divide-y divide-white/5 bg-[#1E293B] rounded-xl border border-white/5 overflow-hidden">
                  {lastProducedVoucher.components.map((comp, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#94A3B8]">{idx + 1}.</span>
                        <span className="font-medium text-[#F8FAFC]">{comp.ingredientName}</span>
                        <span className="text-[10px] text-[#94A3B8]">({comp.qty} {comp.unit})</span>
                      </div>
                      <span className="font-mono font-bold text-[#D4AF37]">
                        {(comp.totalCost || comp.qty * comp.unitCost).toFixed(2)} ETB
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Batch Cost Banner */}
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-white/20">
                <span className="font-extrabold text-xs text-[#CBD5E1]">Total Batch Formulation Expense:</span>
                <span className="font-mono font-black text-base text-[#D4AF37]">
                  {lastProducedVoucher.producedItem.totalBatchCost.toFixed(2)} ETB
                </span>
              </div>
            </div>

            {/* Sharing & Printing Action Buttons */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 px-3 bg-[#243244] hover:bg-[#2F4158] text-[#F8FAFC] rounded-xl border border-white/10 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer size={15} className="text-[#D4AF37]" />
                  <span>Print (A4/Thermal)</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="py-2.5 px-3 bg-[#243244] hover:bg-[#0088cc]/20 text-[#F8FAFC] hover:text-[#0088cc] rounded-xl border border-white/10 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Share2 size={15} className="text-[#0088cc]" />
                  <span>Telegram</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-3 bg-[#243244] hover:bg-[#25D366]/20 text-[#F8FAFC] hover:text-[#25D366] rounded-xl border border-white/10 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Share2 size={15} className="text-[#25D366]" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyVoucherText}
                  className="py-2.5 px-3 bg-[#243244] hover:bg-[#2F4158] text-[#F8FAFC] rounded-xl border border-white/10 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  {copySuccess ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Copy size={15} className="text-[#D4AF37]" />}
                  <span>{copySuccess ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadVoucherTxt}
                  className="flex-1 py-2.5 bg-[#1E293B] hover:bg-[#243244] text-[#CBD5E1] hover:text-white rounded-xl border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download .txt Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLastProducedVoucher(null)}
                  className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-black cursor-pointer shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Register New Ingredient (Gbatochen Mmezegbbet) - Fullscreen */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn font-sans text-[#F8FAFC]">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-[#D4AF37]">
                <PackageCheck size={24} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg sm:text-2xl text-[#F8FAFC]">Register Raw Material SKU (ጥሬ ዕቃ መዝግብ)</h3>
                <p className="text-xs text-[#94A3B8]">Add raw material item, default store, unit, cost, and alert level.</p>
              </div>
            </div>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-[#243244] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <X size={18} />
              <span>Close</span>
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Ingredient Name (yegbatu sm) *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Yirgacheffe Washed Grade 1"
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Brand / Roastery Name</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Tomoca / Local Farm"
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">SKU / Barcode Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. SKU-COFF-001"
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Store / Warehouse Location *</label>
                  <select
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
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
                        <option value="Kazanchis Bakery Lab">Kazanchis Bakery Lab</option>
                        <option value="Sarbet Cold Storage">Sarbet Cold Storage</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Initial Stock *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.stockQty}
                      onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
                      className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Unit *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                    >
                      <option value="kg">kg (Kilogram)</option>
                      <option value="g">g (Gram)</option>
                      <option value="liters">liters (Liters)</option>
                      <option value="ml">ml (Milliliters)</option>
                      <option value="pcs">pcs (Pieces)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Cost Per Unit (ETB) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Reorder Alert Level *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    placeholder="e.g. Abyssinia Coffee Roasters PLC"
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Expiry Tracking Section */}
              <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-[#D4AF37]" />
                    <span className="text-sm font-bold text-[#CBD5E1]">Expiration Tracking (የማብቂያ ቀን ክትትል)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasExpiry}
                      onChange={(e) => setFormData({ ...formData, hasExpiry: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#243244] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                  </label>
                </div>

                {formData.hasExpiry && (
                  <div className="max-w-xs">
                    <label className="block text-xs text-[#94A3B8] mb-1">Expected Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full h-[44px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                )}
              </div>

              {/* Photo selection */}
              <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10 space-y-4">
                <label className="block text-sm font-bold text-[#CBD5E1]">Ingredient Photo</label>
                <div className="flex items-center gap-4">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-xl border border-white/10 shrink-0"
                  />
                  <label className="px-4 py-2.5 bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] hover:text-white border border-white/10 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all">
                    <Upload size={16} className="text-[#D4AF37]" />
                    <span>Upload Custom Photo</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                  {PRESET_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPreviewImage(img.url)}
                      className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        previewImage === img.url ? 'border-[#D4AF37] scale-105 shadow-md shadow-[#D4AF37]/20' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-14 h-14 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-full sm:w-auto px-6 h-12 rounded-xl bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 h-12 rounded-xl bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle2 size={18} />
                <span>Save Raw Material SKU (መዝግብ)</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Edit Ingredient Modal - Fullscreen */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn font-sans text-[#F8FAFC]">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-[#D4AF37]">
                <Pencil size={24} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg sm:text-2xl text-[#F8FAFC]">Edit Ingredient Details (ጥሬ ዕቃ አርትዕ)</h3>
                <p className="text-xs text-[#94A3B8]">Modify raw ingredient information, inventory quantities and pricing.</p>
              </div>
            </div>
            <button
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 bg-[#243244] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <X size={18} />
              <span>Close</span>
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Ingredient Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Brand / Source</label>
                  <input
                    type="text"
                    value={editFormData.brand}
                    onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Category *</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={editFormData.sku}
                    onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Store / Warehouse *</label>
                  <select
                    value={editFormData.storeName}
                    onChange={(e) => setEditFormData({ ...editFormData, storeName: e.target.value })}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
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
                        <option value="Kazanchis Bakery Lab">Kazanchis Bakery Lab</option>
                        <option value="Sarbet Cold Storage">Sarbet Cold Storage</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Current Stock *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editFormData.stockQty}
                      onChange={(e) => setEditFormData({ ...editFormData, stockQty: e.target.value })}
                      className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Unit *</label>
                    <select
                      value={editFormData.unit}
                      onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                      className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                    >
                      <option value="kg">kg (Kilogram)</option>
                      <option value="g">g (Gram)</option>
                      <option value="liters">liters (Liters)</option>
                      <option value="ml">ml (Milliliters)</option>
                      <option value="pcs">pcs (Pieces)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Cost Per Unit (ETB) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editFormData.costPerUnit}
                    onChange={(e) => setEditFormData({ ...editFormData, costPerUnit: e.target.value })}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Reorder Alert Level *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editFormData.reorderLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, reorderLevel: e.target.value })}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.supplierName}
                    onChange={(e) => setEditFormData({ ...editFormData, supplierName: e.target.value })}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Photo selection for Edit */}
              <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10 space-y-4">
                <label className="block text-sm font-bold text-[#CBD5E1]">Update Photo</label>
                <div className="flex items-center gap-4">
                  <img
                    src={editPreviewImage}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-xl border border-white/10 shrink-0"
                  />
                  <label className="px-4 py-2.5 bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] hover:text-white border border-white/10 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all">
                    <Upload size={16} className="text-[#D4AF37]" />
                    <span>Upload Custom Photo</span>
                    <input type="file" accept="image/*" onChange={handleEditImageFileChange} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-full sm:w-auto px-6 h-12 rounded-xl bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 h-12 rounded-xl bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={18} />
                <span>Save Changes (አዘምን)</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Stock In Batch Receipt */}
      {stockInItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-[#1E293B] border border-white/10 rounded-[28px] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-[#F8FAFC] my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 rounded-xl">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#F8FAFC]">Stock In Batch Receipt</h3>
                  <p className="text-xs text-[#94A3B8]">{stockInItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setStockInItem(null)}
                className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg bg-[#243244] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStockInSubmit} className="space-y-4">
              <div className="bg-[#243244] p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
                <img
                  src={stockInItem.image || PRESET_IMAGES[0].url}
                  alt=""
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#F8FAFC] block">{stockInItem.name}</span>
                  <span className="text-[#94A3B8]">Current Stock: <strong className="text-[#D4AF37]">{stockInItem.stockQty} {stockInItem.unit}</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                  Quantity to Add ({stockInItem.unit}) *
                </label>
                <div className="flex gap-2 mb-2">
                  {[10, 25, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setStockInQty(num)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        stockInQty === num
                          ? 'bg-[#D4AF37] text-[#0F172A] border-[#D4AF37]'
                          : 'bg-[#243244] text-[#CBD5E1] border-white/10'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="any"
                  required
                  min="0.1"
                  value={stockInQty}
                  onChange={(e) => setStockInQty(parseFloat(e.target.value) || 0)}
                  className="w-full h-[48px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {stockInItem.hasExpiry && (
                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1 flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#D4AF37]" />
                    Batch Expiration Date
                  </label>
                  <input
                    type="date"
                    value={stockInExpiry}
                    onChange={(e) => setStockInExpiry(e.target.value)}
                    className="w-full h-[48px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                  <p className="text-[10px] text-[#94A3B8] mt-1">Updates expiry tracking for this restock batch.</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStockInItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#243244] text-[#CBD5E1] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Check size={16} /> Complete Stock In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Manage Categories */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-[#1E293B] border border-white/10 rounded-[28px] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-[#F8FAFC] my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="text-[#D4AF37]" size={20} />
                <h3 className="font-serif font-bold text-lg text-[#F8FAFC]">Manage Categories</h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg bg-[#243244] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Add New Category</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Syrups & Purees"
                    className="flex-1 h-[42px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-2">Existing Categories</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                  {categories.map((c) => (
                    <span
                      key={c}
                      className="bg-[#243244] px-3 py-1.5 rounded-lg text-xs border border-white/5 font-medium text-[#CBD5E1]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
