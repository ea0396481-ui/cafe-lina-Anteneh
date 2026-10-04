import React, { useState, useMemo } from 'react';
import { InventoryItem, StoreRecord, SpecialIngredientComponent, SpecialIngredientRecipe } from '../../types';
import {
  Sparkles,
  Search,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  X,
  Building2,
  AlertTriangle,
  Layers,
  Scale,
  CheckCircle2,
  Clock,
  Tag,
  ChefHat,
  Receipt,
  FileSpreadsheet,
  Minus,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Coins,
} from 'lucide-react';

interface SpecialIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  stores: StoreRecord[];
  onProduceSpecialIngredient: (
    specialItem: Partial<InventoryItem>,
    components: SpecialIngredientComponent[],
    options: { deductStock: boolean; notes?: string }
  ) => void;
}

const PRESET_SPECIAL_IMAGES = [
  {
    label: 'Caramel Syrup',
    url: 'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Vanilla Infusion',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Chocolate Ganache',
    url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Artisan Dough',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Garlic Herb Butter',
    url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'House Coffee Blend',
    url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Salad Dressing',
    url: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Pastry Cream',
    url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
  },
];

const YIELD_UNITS = [
  { value: 'kg', label: 'Kilograms (ኪሎ / kg)' },
  { value: 'g', label: 'Grams (ግራም / g)' },
  { value: 'liters', label: 'Liters (ሊትር / L)' },
  { value: 'ml', label: 'Milliliters (ሚሊሊትር / ml)' },
  { value: 'pcs', label: 'Pieces / Portions (ቁራጭ / pcs)' },
  { value: 'btl', label: 'Bottles / Jars (ጠርሙስ / btl)' },
];

export const SpecialIngredientModal: React.FC<SpecialIngredientModalProps> = ({
  isOpen,
  onClose,
  inventory,
  stores,
  onProduceSpecialIngredient,
}) => {
  // Form State
  const [specialName, setSpecialName] = useState('');
  const [brand, setBrand] = useState('In-House House Special');
  const [category, setCategory] = useState('Special Ingredients');
  const [sku, setSku] = useState(`SP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedStore, setSelectedStore] = useState<string>(
    stores[0]?.name || inventory[0]?.storeName || 'Bole Main Central Store'
  );
  const [yieldQty, setYieldQty] = useState<string>('1');
  const [yieldUnit, setYieldUnit] = useState<string>('kg');
  const [reorderLevel, setReorderLevel] = useState<string>('2');
  const [shelfLifeDays, setShelfLifeDays] = useState<string>('14');
  const [hasExpiry, setHasExpiry] = useState<boolean>(true);
  const [previewImage, setPreviewImage] = useState<string>(PRESET_SPECIAL_IMAGES[0].url);
  const [notes, setNotes] = useState<string>('');

  // Custom Price / Cost Adjustment State (መጨመርም መቀነስም)
  const [isCustomCost, setIsCustomCost] = useState<boolean>(false);
  const [customCostPerUnit, setCustomCostPerUnit] = useState<string>('');

  // Search & Raw Ingredients Selection State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<string>('All');
  const [selectedComponents, setSelectedComponents] = useState<SpecialIngredientComponent[]>([]);
  const [candidatePortions, setCandidatePortions] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available stores list
  const storeOptions = useMemo(() => {
    const sSet = new Set<string>();
    if (stores && stores.length > 0) {
      stores.forEach((s) => s.name && sSet.add(s.name.trim()));
    }
    inventory.forEach((i) => i.storeName && sSet.add(i.storeName.trim()));
    if (sSet.size === 0) sSet.add('Bole Main Central Store');
    return Array.from(sSet);
  }, [stores, inventory]);

  // Categories available among existing raw inventory
  const availableRawCategories = useMemo(() => {
    const catSet = new Set<string>();
    inventory.forEach((i) => i.category && catSet.add(i.category.trim()));
    return ['All', ...Array.from(catSet)];
  }, [inventory]);

  // Filter raw ingredients for component picker
  const filteredRawIngredients = useMemo(() => {
    return inventory.filter((item) => {
      const matchesStore = !selectedStore || (item.storeName || 'Bole Main Central Store') === selectedStore;
      const matchesCat = searchCategoryFilter === 'All' || item.category === searchCategoryFilter;
      const matchesText =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesStore && matchesCat && matchesText;
    });
  }, [inventory, selectedStore, searchCategoryFilter, searchQuery]);

  // Helper calculation for converting units accurately
  const computeUnitCostForPortion = (invItem: InventoryItem, qtyNumber: number): number => {
    return Math.round(qtyNumber * invItem.costPerUnit * 100) / 100;
  };

  // Add a raw ingredient component to the formula
  const handleAddComponent = (item: InventoryItem) => {
    const rawPortionStr = candidatePortions[item.id] || '1';
    const parsedQty = parseFloat(rawPortionStr);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMsg(`Please enter a valid quantity for ${item.name}`);
      return;
    }

    // Check if already added
    const existingIndex = selectedComponents.findIndex((c) => c.inventoryId === item.id);
    const cost = computeUnitCostForPortion(item, parsedQty);

    if (existingIndex >= 0) {
      // Update existing
      const updated = [...selectedComponents];
      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: parsedQty,
        totalCost: cost,
      };
      setSelectedComponents(updated);
    } else {
      // Add new
      const newComp: SpecialIngredientComponent = {
        inventoryId: item.id,
        ingredientName: item.name,
        sku: item.sku,
        image: item.image,
        qty: parsedQty,
        unit: item.unit,
        unitCost: item.costPerUnit,
        totalCost: cost,
        storeName: item.storeName,
      };
      setSelectedComponents([...selectedComponents, newComp]);
    }

    setErrorMsg(null);
  };

  // Remove component from formula
  const handleRemoveComponent = (inventoryId: string) => {
    setSelectedComponents((prev) => prev.filter((c) => c.inventoryId !== inventoryId));
  };

  // Update component quantity in formula table
  const handleUpdateComponentQty = (inventoryId: string, newQtyStr: string) => {
    const parsedQty = parseFloat(newQtyStr);
    setSelectedComponents((prev) =>
      prev.map((c) => {
        if (c.inventoryId === inventoryId) {
          const qty = isNaN(parsedQty) || parsedQty < 0 ? 0 : parsedQty;
          const totalCost = Math.round(qty * c.unitCost * 100) / 100;
          return { ...c, qty, totalCost };
        }
        return c;
      })
    );
  };

  // Total Batch Cost & Unit Cost Calculations
  const totalBatchCost = useMemo(() => {
    return selectedComponents.reduce((sum, c) => sum + (c.totalCost || 0), 0);
  }, [selectedComponents]);

  const parsedYieldQty = useMemo(() => {
    const val = parseFloat(yieldQty);
    return isNaN(val) || val <= 0 ? 1 : val;
  }, [yieldQty]);

  // Base raw material cost per unit
  const costPerProducedUnit = useMemo(() => {
    return parsedYieldQty > 0 ? Math.round((totalBatchCost / parsedYieldQty) * 100) / 100 : 0;
  }, [totalBatchCost, parsedYieldQty]);

  // Effective cost per unit (reflects manual adjustment/override)
  const effectiveCostPerUnit = useMemo(() => {
    if (isCustomCost && customCostPerUnit !== '') {
      const parsed = parseFloat(customCostPerUnit);
      return !isNaN(parsed) && parsed >= 0 ? parsed : costPerProducedUnit;
    }
    return costPerProducedUnit;
  }, [isCustomCost, customCostPerUnit, costPerProducedUnit]);

  // Difference between custom price and raw material cost
  const costDifference = useMemo(() => {
    return Math.round((effectiveCostPerUnit - costPerProducedUnit) * 100) / 100;
  }, [effectiveCostPerUnit, costPerProducedUnit]);

  // Price adjustment handlers (መጨመር / መቀነስ / ወደነበረበት መመለስ)
  const handleAdjustCost = (delta: number) => {
    const current = isCustomCost && customCostPerUnit !== '' ? (parseFloat(customCostPerUnit) || 0) : costPerProducedUnit;
    const nextVal = Math.max(0, Math.round((current + delta) * 100) / 100);
    setIsCustomCost(true);
    setCustomCostPerUnit(String(nextVal));
  };

  const handleAdjustPercentage = (percent: number) => {
    const base = costPerProducedUnit > 0 ? costPerProducedUnit : 100;
    const current = isCustomCost && customCostPerUnit !== '' ? (parseFloat(customCostPerUnit) || 0) : costPerProducedUnit;
    const delta = (base * percent) / 100;
    const nextVal = Math.max(0, Math.round((current + delta) * 100) / 100);
    setIsCustomCost(true);
    setCustomCostPerUnit(String(nextVal));
  };

  const handleResetCost = () => {
    setIsCustomCost(false);
    setCustomCostPerUnit('');
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Check if enough stock exists for all components
  const stockValidation = useMemo(() => {
    const shortages: { name: string; required: number; available: number; unit: string }[] = [];

    for (const comp of selectedComponents) {
      const invItem = inventory.find((i) => i.id === comp.inventoryId);
      const available = invItem ? invItem.stockQty : 0;
      if (comp.qty > available) {
        shortages.push({
          name: comp.ingredientName,
          required: comp.qty,
          available,
          unit: comp.unit,
        });
      }
    }

    return shortages;
  }, [selectedComponents, inventory]);

  // Quick Preset Selection Template
  const handleApplyPreset = (presetName: string) => {
    if (presetName === 'caramel') {
      setSpecialName('House Caramel Sauce (ካራሜል ሶስ)');
      setCategory('Syrups & Flavors');
      setYieldQty('2');
      setYieldUnit('liters');
      setReorderLevel('1');
      setPreviewImage(PRESET_SPECIAL_IMAGES[0].url);
      setShelfLifeDays('30');
    } else if (presetName === 'dough') {
      setSpecialName('Artisan Pizza Dough (የፒዛ ሊጥ)');
      setCategory('Bakery & Flour');
      setYieldQty('5');
      setYieldUnit('kg');
      setReorderLevel('2');
      setPreviewImage(PRESET_SPECIAL_IMAGES[3].url);
      setShelfLifeDays('4');
    } else if (presetName === 'garlic_butter') {
      setSpecialName('Garlic Herb Butter Compound (የነጭ ሽንኩርት ቅቤ)');
      setCategory('Dairy & Milk');
      setYieldQty('1.5');
      setYieldUnit('kg');
      setReorderLevel('0.5');
      setPreviewImage(PRESET_SPECIAL_IMAGES[4].url);
      setShelfLifeDays('14');
    } else if (presetName === 'coffee_blend') {
      setSpecialName('Lina Signature Espresso Blend (የቡና ቅልቅል)');
      setCategory('Coffee Beans');
      setYieldQty('5');
      setYieldUnit('kg');
      setReorderLevel('2');
      setPreviewImage(PRESET_SPECIAL_IMAGES[5].url);
      setShelfLifeDays('60');
    }
  };

  // Submit Handler: Produce Batch & Deduct Stock
  const handleSubmit = (deductStock: boolean) => {
    if (!specialName.trim()) {
      setErrorMsg('Please enter a Special Ingredient Name (የስፔሻል ጥሬ ዕቃውን ስም ያስገቡ)');
      return;
    }

    if (selectedComponents.length === 0) {
      setErrorMsg('Please select at least 1 raw ingredient for this recipe formula (ቢያንስ አንድ ጥሬ ዕቃ ይምረጡ)');
      return;
    }

    if (deductStock && stockValidation.length > 0) {
      const shortageNames = stockValidation
        .map((s) => `${s.name} (Need: ${s.required} ${s.unit}, Available: ${s.available} ${s.unit})`)
        .join(', ');
      setErrorMsg(`Insufficient raw material stock to produce batch: ${shortageNames}`);
      return;
    }

    const calculatedExpiry = hasExpiry
      ? new Date(Date.now() + (parseInt(shelfLifeDays) || 14) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : undefined;

    const specialItemData: Partial<InventoryItem> = {
      name: specialName.trim(),
      brand: brand.trim() || 'In-House Special',
      category: category.trim() || 'Special Ingredients',
      sku: sku.trim() || `SP-${Math.floor(1000 + Math.random() * 9000)}`,
      unit: yieldUnit,
      stockQty: parsedYieldQty,
      storeName: selectedStore,
      reorderLevel: parseFloat(reorderLevel) || 2,
      costPerUnit: effectiveCostPerUnit,
      supplierName: 'In-House Kitchen Production',
      image: previewImage,
      hasExpiry,
      expiryDate: calculatedExpiry,
      isSpecialIngredient: true,
      recipeComponents: selectedComponents,
      yieldQty: parsedYieldQty,
      yieldUnit,
    };

    onProduceSpecialIngredient(specialItemData, selectedComponents, {
      deductStock,
      notes: notes.trim() || `In-House Batch Formulation of ${specialName.trim()}`,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn font-sans text-[#F8FAFC]">
      {/* Modal Header Bar */}
      <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#F6C453] text-[#0F172A] flex items-center justify-center shadow-lg shrink-0">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-full">
                Special In-House Formulation (ስፔሻል ጥሬ ዕቃ ማዘጋጃ)
              </span>
            </div>
            <h2 className="font-serif font-bold text-lg sm:text-2xl text-[#F8FAFC] mt-0.5">
              Create & Produce Special Ingredient
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Formulate compound ingredients, blends, syrups & sauces from existing raw materials with live cost calculation.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="self-end sm:self-center px-4 py-2 bg-[#243244] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <X size={18} />
          <span>Close Form</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Quick Recipe Templates */}
          <div className="bg-[#1E293B] p-4 rounded-2xl border border-white/10 flex flex-wrap items-center gap-2 text-xs shadow-md">
            <span className="text-[11px] font-bold text-[#D4AF37] flex items-center gap-1.5 mr-2">
              <ChefHat size={16} /> Quick Templates (ፈጣን ምሳሌዎች):
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('caramel')}
              className="px-3.5 py-1.5 bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] hover:text-white rounded-xl border border-white/10 text-xs font-semibold transition-all cursor-pointer"
            >
              🍯 Caramel Syrup
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('dough')}
              className="px-3.5 py-1.5 bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] hover:text-white rounded-xl border border-white/10 text-xs font-semibold transition-all cursor-pointer"
            >
              🍕 Artisan Pizza Dough
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('garlic_butter')}
              className="px-3.5 py-1.5 bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] hover:text-white rounded-xl border border-white/10 text-xs font-semibold transition-all cursor-pointer"
            >
              🧄 Garlic Herb Butter
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('coffee_blend')}
              className="px-3.5 py-1.5 bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] hover:text-white rounded-xl border border-white/10 text-xs font-semibold transition-all cursor-pointer"
            >
              ☕ Espresso Blend Mix
            </button>
          </div>

        {/* Main Grid: Left (Form & Component Search) vs Right (Formula Summary & Cost Breakdown) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Metadata & Raw Material Search (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Step 1: Basic Special Info */}
            <div className="bg-[#243244] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <Tag size={15} /> 1. Special Ingredient Details (የስፔሻል ጥሬ ዕቃው መረጃ)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#CBD5E1] mb-1">
                    Special Ingredient Name (የስፔሻል ጥሬ ዕቃው ስም) *
                  </label>
                  <input
                    type="text"
                    value={specialName}
                    onChange={(e) => setSpecialName(e.target.value)}
                    placeholder="e.g. Vanilla Bean Syrup, Pizza Dough, Garlic Butter"
                    className="w-full h-11 bg-[#1E293B] border border-white/15 rounded-xl px-3.5 text-xs text-[#F8FAFC] font-bold focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#CBD5E1] mb-1">Category (ምድብ)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 bg-[#1E293B] border border-white/15 rounded-xl px-3 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    <option value="Special Ingredients">Special Ingredients</option>
                    <option value="Syrups & Flavors">Syrups & Flavors</option>
                    <option value="Dairy & Milk">Dairy & Milk</option>
                    <option value="Bakery & Flour">Bakery & Flour</option>
                    <option value="Coffee Beans">Coffee Beans</option>
                    <option value="Sauces & Creams">Sauces & Creams</option>
                    <option value="Teas & Spices">Teas & Spices</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#CBD5E1] mb-1">
                    Target Store Warehouse (የሚመረትበት ስቶር)
                  </label>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full h-10 bg-[#1E293B] border border-white/15 rounded-xl px-3 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {storeOptions.map((st) => (
                      <option key={st} value={st}>
                        🏢 {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Yield, Reorder Level & Expiry */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5">
                <div>
                  <label className="block text-[10px] font-bold text-[#CBD5E1] mb-1">
                    Produced Yield (የሚመረተው ብዛት)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={yieldQty}
                    onChange={(e) => setYieldQty(e.target.value)}
                    className="w-full h-10 bg-[#1E293B] border border-white/15 rounded-xl px-3 text-xs font-extrabold text-[#22C55E] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#CBD5E1] mb-1">
                    Yield Unit (መለኪያ ዩኒት)
                  </label>
                  <select
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    className="w-full h-10 bg-[#1E293B] border border-white/15 rounded-xl px-2 text-xs font-bold text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {YIELD_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#CBD5E1] mb-1">
                    Reorder Alert Level (ዝቅተኛ ማስጠንቀቂያ)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    placeholder="2"
                    className="w-full h-10 bg-[#1E293B] border border-white/15 rounded-xl px-3 text-xs font-bold text-[#F59E0B] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#CBD5E1] mb-1">
                    Shelf Life (የሚያገለግልበት ቀናት)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={shelfLifeDays}
                    onChange={(e) => setShelfLifeDays(e.target.value)}
                    placeholder="14"
                    className="w-full h-10 bg-[#1E293B] border border-white/15 rounded-xl px-3 text-xs font-bold text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Unit Price Adjustment Section (ዋጋ ማስተካከያ - መጨመርም መቀነስም) */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-[11px] font-extrabold text-[#D4AF37] flex items-center gap-1.5">
                      <Coins size={14} className="text-[#D4AF37]" />
                      <span>Special Ingredient Unit Price (የስፔሻል ጥሬ ዕቃው የአንዱ ዩኒት ዋጋ ማስተካከያ)</span>
                    </label>
                    <p className="text-[10px] text-[#94A3B8]">
                      Auto-calculated from raw materials or custom adjust (መጨመርም መቀነስም ይችላሉ)
                    </p>
                  </div>

                  {isCustomCost && (
                    <button
                      type="button"
                      onClick={handleResetCost}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-[#CBD5E1] hover:text-[#D4AF37] bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition-all cursor-pointer self-start sm:self-auto"
                      title="Reset to raw material formula cost"
                    >
                      <RefreshCw size={11} className="text-[#D4AF37]" />
                      <span>Reset to Formula Cost (ወደተሰላው ዋጋ መልስ)</span>
                    </button>
                  )}
                </div>

                <div className="bg-[#1E293B] p-3.5 rounded-xl border border-white/15 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Auto Cost Info */}
                    <div className="sm:col-span-4 bg-[#243244] p-2.5 rounded-lg border border-white/10">
                      <span className="text-[9px] font-bold text-[#94A3B8] uppercase block">
                        Raw Material Cost (የጥሬ ዕቃ ድምር ዋጋ)
                      </span>
                      <span className="text-xs font-black text-[#CBD5E1]">
                        {costPerProducedUnit.toFixed(2)} ETB <span className="text-[10px] font-normal text-[#94A3B8]">/{yieldUnit}</span>
                      </span>
                    </div>

                    {/* Manual Price Input */}
                    <div className="sm:col-span-8 flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-[9px] font-bold text-[#CBD5E1] uppercase mb-1">
                          Final Unit Price (የተስተካከለ ዋጋ በ {yieldUnit}) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={isCustomCost && customCostPerUnit !== '' ? customCostPerUnit : costPerProducedUnit > 0 ? costPerProducedUnit : ''}
                            onChange={(e) => {
                              setIsCustomCost(true);
                              setCustomCostPerUnit(e.target.value);
                            }}
                            placeholder={costPerProducedUnit.toFixed(2)}
                            className="w-full h-10 bg-[#243244] border-2 border-[#D4AF37]/60 focus:border-[#D4AF37] rounded-xl pl-3 pr-14 text-sm font-black text-[#22C55E] focus:outline-none"
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] font-bold text-[#94A3B8]">
                            ETB/{yieldUnit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stepper Increase / Decrease Buttons */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#CBD5E1] mr-1 flex items-center gap-1">
                        <SlidersHorizontal size={12} className="text-[#D4AF37]" />
                        <span>Quick Adjust (በቀላሉ ጨምር / ቀንስ):</span>
                      </span>

                      {/* Decrease Buttons */}
                      <div className="inline-flex items-center rounded-lg bg-[#243244] border border-rose-500/30 p-0.5 gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustCost(-1)}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded text-[10px] font-extrabold transition-all cursor-pointer"
                          title="Decrease 1 ETB"
                        >
                          -1 ETB
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustCost(-5)}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded text-[10px] font-extrabold transition-all cursor-pointer"
                          title="Decrease 5 ETB"
                        >
                          -5 ETB
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustCost(-10)}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded text-[10px] font-extrabold transition-all cursor-pointer"
                          title="Decrease 10 ETB"
                        >
                          -10 ETB
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustPercentage(-10)}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded text-[10px] font-extrabold transition-all cursor-pointer"
                          title="Discount 10%"
                        >
                          -10%
                        </button>
                      </div>

                      {/* Increase Buttons */}
                      <div className="inline-flex items-center rounded-lg bg-[#243244] border border-emerald-500/30 p-0.5 gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustCost(1)}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-extrabold transition-all cursor-pointer"
                          title="Increase 1 ETB"
                        >
                          +1 ETB
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustCost(5)}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-extrabold transition-all cursor-pointer"
                          title="Increase 5 ETB"
                        >
                          +5 ETB
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustCost(10)}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-extrabold transition-all cursor-pointer"
                          title="Increase 10 ETB"
                        >
                          +10 ETB
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustCost(50)}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-extrabold transition-all cursor-pointer"
                          title="Increase 50 ETB"
                        >
                          +50 ETB
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustPercentage(10)}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-extrabold transition-all cursor-pointer"
                          title="Markup +10%"
                        >
                          +10%
                        </button>
                      </div>
                    </div>

                    {/* Adjustment Badge / Difference Explainer */}
                    {isCustomCost && (
                      <div className="flex items-center gap-2 pt-1 text-[10px]">
                        {costDifference > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                            <TrendingUp size={12} />
                            <span>
                              +{costDifference.toFixed(2)} ETB / {yieldUnit} (+
                              {costPerProducedUnit > 0 ? ((costDifference / costPerProducedUnit) * 100).toFixed(1) : '100'}%)
                              Labor/Markup Added (ተጨምሯል)
                            </span>
                          </span>
                        ) : costDifference < 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md">
                            <TrendingDown size={12} />
                            <span>
                              {costDifference.toFixed(2)} ETB / {yieldUnit} (
                              {costPerProducedUnit > 0 ? ((costDifference / costPerProducedUnit) * 100).toFixed(1) : '-100'}%)
                              Subsidized/Discounted (ተቀንሷል)
                            </span>
                          </span>
                        ) : (
                          <span className="text-[#94A3B8] font-medium">
                            Exact formula cost (ተጨማሪ ወጪ የሌለው)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo Upload & Gallery */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <label className="block text-[11px] font-bold text-[#CBD5E1]">
                  Special Ingredient Photo (የጥሬ ዕቃው ፎቶ)
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-xl border border-white/20 shadow-md shrink-0"
                  />
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1E293B] hover:bg-[#2F4158] text-[#CBD5E1] hover:text-white border border-white/15 rounded-xl text-xs font-bold cursor-pointer transition-all">
                      <Upload size={14} className="text-[#D4AF37]" />
                      <span>Upload Custom Photo (ፎቶ ስቀል)</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <span className="block text-[10px] text-[#94A3B8] mt-1">
                      Select below or upload high-res image
                    </span>
                  </div>
                </div>

                {/* Preset Photos Bar */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
                  {PRESET_SPECIAL_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewImage(img.url)}
                      className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        previewImage === img.url ? 'border-[#D4AF37] scale-105 shadow-md' : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                      title={img.label}
                    >
                      <img src={img.url} alt={img.label} className="w-10 h-10 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Component Raw Materials Search & Picker */}
            <div className="bg-[#243244] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                  <Search size={15} /> 2. Search & Select Raw Ingredients (ጥሬ ዕቃ ፈልግና ምረጥ)
                </h3>
                <span className="text-[10px] text-[#94A3B8]">
                  From: <strong>{selectedStore}</strong>
                </span>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search raw material name, SKU, brand..."
                    className="w-full h-10 bg-[#1E293B] border border-white/15 rounded-xl pl-9 pr-3 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]"
                  />
                  <Search size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
                </div>
                <select
                  value={searchCategoryFilter}
                  onChange={(e) => setSearchCategoryFilter(e.target.value)}
                  className="h-10 bg-[#1E293B] border border-white/15 rounded-xl px-2.5 text-xs text-[#F8FAFC] font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  {availableRawCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Raw Ingredients Candidate Cards */}
              <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {filteredRawIngredients.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#94A3B8] bg-[#1E293B] rounded-xl border border-white/5">
                    No raw materials found in {selectedStore} matching "{searchQuery}".
                  </div>
                ) : (
                  filteredRawIngredients.map((item) => {
                    const portionVal = candidatePortions[item.id] ?? '1';
                    const numPortion = parseFloat(portionVal) || 0;
                    const calculatedCost = computeUnitCostForPortion(item, numPortion);
                    const isAlreadyAdded = selectedComponents.some((c) => c.inventoryId === item.id);

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isAlreadyAdded
                            ? 'bg-[#1E293B] border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/20'
                            : 'bg-[#1E293B] border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Ingredient Photo & Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              item.image ||
                              'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-xl border border-white/15 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-[#F8FAFC] truncate block">{item.name}</span>
                              {item.brand && (
                                <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-[#D4AF37] font-medium shrink-0">
                                  {item.brand}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] mt-0.5">
                              <span className="font-mono">{item.sku}</span>
                              <span>•</span>
                              <span>In Stock: <strong className="text-[#CBD5E1]">{item.stockQty} {item.unit}</strong></span>
                              <span>•</span>
                              <span className="text-[#D4AF37] font-bold">{item.costPerUnit} ETB/{item.unit}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity & Live Calculated Cost & Add Button */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="any"
                              min="0.001"
                              value={portionVal}
                              onChange={(e) =>
                                setCandidatePortions({
                                  ...candidatePortions,
                                  [item.id]: e.target.value,
                                })
                              }
                              className="w-16 h-8 bg-[#243244] border border-white/15 rounded-lg px-2 text-xs font-extrabold text-[#F8FAFC] text-center focus:outline-none focus:border-[#D4AF37]"
                            />
                            <span className="text-[11px] font-bold text-[#CBD5E1]">{item.unit}</span>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <span className="text-[9px] text-[#94A3B8] block">Cost (ዋጋ):</span>
                            <span className="text-xs font-black text-[#D4AF37]">{calculatedCost.toFixed(2)} ETB</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddComponent(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow transition-all cursor-pointer ${
                              isAlreadyAdded
                                ? 'bg-[#D4AF37] text-[#0F172A] hover:bg-[#F6C453]'
                                : 'bg-[#22C55E] text-[#0F172A] hover:bg-[#16A34A]'
                            }`}
                          >
                            <Plus size={14} />
                            <span>{isAlreadyAdded ? 'Update' : 'Add'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Active Formula, Cost Breakdown & Production (5 cols) */}
          <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
            {/* Step 3: Selected Formula Table */}
            <div className="bg-[#243244] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4 flex-1">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                  <Scale size={15} /> 3. Recipe Components List ({selectedComponents.length})
                </h3>
                {selectedComponents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedComponents([])}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Selected Items List */}
              <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {selectedComponents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#94A3B8] bg-[#1E293B] rounded-xl border border-dashed border-white/10 space-y-2">
                    <Sparkles size={24} className="mx-auto text-[#D4AF37]/50" />
                    <p>No ingredients added yet.</p>
                    <p className="text-[10px] text-gray-500">
                      Search raw ingredients on the left and click "Add" to compose your special recipe.
                    </p>
                  </div>
                ) : (
                  selectedComponents.map((comp) => (
                    <div
                      key={comp.inventoryId}
                      className="p-2.5 bg-[#1E293B] rounded-xl border border-white/10 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={
                            comp.image ||
                            'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=200&q=80'
                          }
                          alt={comp.ingredientName}
                          className="w-9 h-9 object-cover rounded-lg border border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-[#F8FAFC] truncate block">{comp.ingredientName}</span>
                          <span className="text-[10px] text-[#94A3B8] font-mono">
                            {comp.unitCost} ETB/{comp.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          value={comp.qty}
                          onChange={(e) => handleUpdateComponentQty(comp.inventoryId, e.target.value)}
                          className="w-14 h-7 bg-[#243244] border border-white/15 rounded-md px-1.5 text-xs font-bold text-[#F8FAFC] text-center focus:outline-none focus:border-[#D4AF37]"
                        />
                        <span className="text-[10px] text-[#CBD5E1] font-bold w-6">{comp.unit}</span>
                        <span className="font-black text-[#D4AF37] text-xs min-w-[55px] text-right">
                          {(comp.totalCost || 0).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(comp.inventoryId)}
                          className="p-1 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Calculation Display Card */}
              <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#D4AF37]/30 space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#94A3B8] font-bold">Raw Material Cost (የጥሬ ዕቃ ድምር):</span>
                  <span className="font-mono font-black text-base text-[#D4AF37]">{totalBatchCost.toFixed(2)} ETB</span>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                  <span className="text-[#94A3B8] font-bold">Produced Quantity (የተመረተው መጠን):</span>
                  <span className="font-extrabold text-[#22C55E]">
                    {parsedYieldQty} {yieldUnit}
                  </span>
                </div>

                {isCustomCost && costDifference !== 0 && (
                  <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                    <span className="text-[#94A3B8] font-bold">Price Adjustment (የዋጋ ማስተካከያ):</span>
                    <span
                      className={`font-bold text-xs ${
                        costDifference > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {costDifference > 0 ? `+${costDifference.toFixed(2)} ETB (Markup)` : `${costDifference.toFixed(2)} ETB (Discount)`}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs border-t border-dashed border-white/10 pt-2 bg-[#243244] -mx-4 -mb-4 p-3.5 rounded-b-2xl">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block font-bold">
                      {isCustomCost ? 'Final Adjusted Price (የተስተካከለ ዋጋ)' : 'Calculated Cost Per Unit (የአንዱ ዩኒት ዋጋ)'}
                    </span>
                    <span className="text-[11px] font-medium text-[#CBD5E1]">
                      Total Value: {((effectiveCostPerUnit * parsedYieldQty) || 0).toFixed(2)} ETB
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-xl text-[#22C55E]">
                      {effectiveCostPerUnit.toFixed(2)} ETB
                    </span>
                    <span className="text-[10px] text-[#94A3B8] block font-bold">per {yieldUnit}</span>
                  </div>
                </div>
              </div>

              {/* Error / Warning Notification */}
              {errorMsg && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Stock Shortage Warning */}
              {stockValidation.length > 0 && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle size={14} className="text-amber-400" />
                    <span>Raw Material Shortage Alert:</span>
                  </div>
                  {stockValidation.map((s, idx) => (
                    <p key={idx} className="text-[11px] text-amber-200/90 pl-5">
                      • {s.name}: Needs {s.required} {s.unit}, only {s.available} {s.unit} in stock.
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Step 4: Action Production Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={selectedComponents.length === 0}
                className="w-full h-12 bg-gradient-to-r from-[#D4AF37] to-[#F6C453] hover:from-[#F6C453] hover:to-[#D4AF37] text-[#0F172A] rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xl hover:shadow-[#D4AF37]/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={18} />
                <span>Produce & Deduct Raw Stock (አዘጋጅና ከስቶክ ቀንስ)</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={selectedComponents.length === 0}
                  className="flex-1 h-10 bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] hover:text-white rounded-xl text-xs font-bold border border-white/10 transition-all cursor-pointer disabled:opacity-50"
                  title="Save the formula without subtracting inventory"
                >
                  Save Formula Only (ቀመር አስቀምጥ)
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 h-10 bg-[#1E293B] hover:bg-[#243244] text-[#94A3B8] hover:text-white rounded-xl text-xs font-bold border border-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
