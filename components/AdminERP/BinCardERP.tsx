import React, { useState, useMemo } from 'react';
import {
  InventoryItem,
  BinCardEntry,
  Order,
  StoreRecord,
  MenuItem,
  RecipeCost,
  StockInVoucher,
  DamageVoucher,
  StoreTransferVoucher,
  StoreRequestVoucher,
} from '../../types';
import {
  CreditCard,
  Search,
  Building2,
  Store,
  CheckCircle2,
  MapPin,
  User,
  Package,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  Download,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  Coffee,
  ChefHat,
  Filter,
  Calendar,
  X,
  Eye,
  Check,
  FileText,
  Tag,
  Info,
  Clock,
  ArrowRightLeft,
  Truck,
  TrendingDown,
  TrendingUp,
  FlaskConical,
} from 'lucide-react';

interface BinCardERPProps {
  inventory: InventoryItem[];
  binCards: BinCardEntry[];
  orders: Order[];
  stores?: StoreRecord[];
  menuItems?: MenuItem[];
  recipeCosts?: RecipeCost[];
  stockInVouchers?: StockInVoucher[];
  damageVouchers?: DamageVoucher[];
  storeTransfers?: StoreTransferVoucher[];
  storeRequests?: StoreRequestVoucher[];
  onAddBinCardEntry?: (entry: Partial<BinCardEntry>) => Promise<void>;
  onDeleteBinCardEntry?: (id: string) => Promise<void>;
  onUpdateStock?: (id: string, change: number, action: 'add' | 'subtract') => Promise<void>;
}

export const BinCardERP: React.FC<BinCardERPProps> = ({
  inventory,
  binCards,
  orders,
  stores = [],
  menuItems = [],
  recipeCosts = [],
  stockInVouchers = [],
  damageVouchers = [],
  storeTransfers = [],
  storeRequests = [],
  onAddBinCardEntry,
  onDeleteBinCardEntry,
  onUpdateStock,
}) => {
  const [selectedStoreName, setSelectedStoreName] = useState<string>('All');
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>(
    inventory[0]?.id || ''
  );
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [isNewVoucherModalOpen, setIsNewVoucherModalOpen] = useState(false);
  const [inspectingMenuItem, setInspectingMenuItem] = useState<MenuItem | null>(null);
  const [inspectingSpecialItem, setInspectingSpecialItem] = useState<InventoryItem | null>(null);
  const [consumingTabFilter, setConsumingTabFilter] = useState<'all' | 'menu' | 'special'>('all');
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{
    productName: string;
    image: string;
    notes?: string;
    referenceId?: string;
    date?: string;
    storeName?: string;
    qtyOut?: number;
    unit?: string;
  } | null>(null);

  // Available store list
  const availableStoreNames = useMemo(() => {
    const storeNames = new Set([
      'All',
      ...stores.map((s) => s.name.trim()),
      ...inventory.map((i) => (i.storeName || '').trim()).filter(Boolean),
      'Bole Main Central Store',
      'Kazanchis Bakery Lab & Cold Room',
    ]);
    return Array.from(storeNames);
  }, [stores, inventory]);

  // Clean and normalize tokens for string matching
  const cleanTokens = (str: string): string[] => {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 0);
  };

  // Helper: check if a menu ingredient string accurately matches the raw inventory item
  const doesIngredientStringMatch = (menuIngStr: string, rawItem: InventoryItem): boolean => {
    if (!menuIngStr || !rawItem) return false;
    const ingLower = menuIngStr.toLowerCase().trim();
    const rawLower = rawItem.name.toLowerCase().trim();

    if (ingLower === rawLower) return true;

    const stopWords = new Set([
      'organic', 'whole', 'fresh', 'french', 'specialty', '100%', 'grade', '1',
      'the', 'and', 'with', 'of', 'for', 'in', 'oz', 'ml', 'g', 'kg', 'pure',
      'dark', 'free-range', 'heirloom', 'artisanal', 'flavor', 'flavour', 'syrup',
      'blend', 'single-origin', 'powder', 'base', 'slice', 'slices', 'dusted',
      'steamed', 'concentrated', 'hot', 'cold', 'iced', 'natural',
    ]);

    const ingTokens = cleanTokens(ingLower).filter((w) => !stopWords.has(w) && w.length >= 3);
    const rawTokens = cleanTokens(rawLower).filter((w) => !stopWords.has(w) && w.length >= 3);

    if (ingTokens.length === 0 || rawTokens.length === 0) {
      return ingLower.includes(rawLower) || rawLower.includes(ingLower);
    }

    const isCoffeeBeanRaw = rawTokens.some((t) =>
      ['coffee', 'yirgacheffe', 'sidamo', 'arabica', 'beans', 'bean'].includes(t)
    );
    const isCoffeeBeanIng = ingTokens.some((t) =>
      ['coffee', 'yirgacheffe', 'sidamo', 'arabica', 'beans', 'bean', 'espresso', 'ristretto'].includes(t)
    );
    if (isCoffeeBeanRaw && isCoffeeBeanIng) return true;

    const isMilkRaw = rawTokens.some((t) => ['milk', 'dairy'].includes(t));
    const isMilkIng = ingTokens.some((t) => ['milk', 'dairy'].includes(t));
    if (isMilkRaw && isMilkIng) return true;

    const isChocRaw = rawTokens.some((t) => ['chocolate', 'cocoa', 'cacao'].includes(t));
    const isChocIng = ingTokens.some((t) => ['chocolate', 'cocoa', 'cacao'].includes(t));
    if (isChocRaw && isChocIng) return true;

    const isButterRaw = rawTokens.some((t) => ['butter'].includes(t));
    const isButterIng = ingTokens.some((t) => ['butter'].includes(t));
    if (isButterRaw && isButterIng) return true;

    const isVanillaRaw = rawTokens.some((t) => ['vanilla'].includes(t));
    const isVanillaIng = ingTokens.some((t) => ['vanilla'].includes(t));
    if (isVanillaRaw && isVanillaIng) return true;

    const isCupRaw = rawTokens.some((t) => ['cup', 'cups', 'lid', 'packaging'].includes(t));
    const isCupIng = ingTokens.some((t) => ['cup', 'cups', 'lid', 'packaging'].includes(t));
    if (isCupRaw && isCupIng) return true;

    return ingTokens.some((ingT) => rawTokens.includes(ingT));
  };

  // Group unique raw ingredients from ACTIVE non-deleted inventory
  const uniqueIngredients = useMemo(() => {
    const map = new Map<string, {
      representativeItem: InventoryItem;
      allStoreItems: InventoryItem[];
      totalStock: number;
    }>();

    inventory.forEach((item) => {
      const key = item.name.toLowerCase().trim();
      const existing = map.get(key);
      if (existing) {
        existing.allStoreItems.push(item);
        existing.totalStock += item.stockQty;
      } else {
        map.set(key, {
          representativeItem: item,
          allStoreItems: [item],
          totalStock: item.stockQty,
        });
      }
    });

    return Array.from(map.values());
  }, [inventory]);

  // Filter inventory items based on search and store
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedStoreName === 'All') return true;
      const itemStore = item.storeName || 'Bole Main Central Store';
      return itemStore.toLowerCase().trim() === selectedStoreName.toLowerCase().trim();
    });
  }, [inventory, search, selectedStoreName]);

  // Active selected inventory item (Strictly from current valid inventory)
  const effectiveSelectedId = useMemo(() => {
    if (filteredInventory.some((i) => i.id === selectedInventoryId)) {
      return selectedInventoryId;
    }
    if (filteredInventory.length > 0) {
      return filteredInventory[0].id;
    }
    if (inventory.some((i) => i.id === selectedInventoryId)) {
      return selectedInventoryId;
    }
    return inventory[0]?.id || '';
  }, [filteredInventory, selectedInventoryId, inventory]);

  const selectedItem = useMemo(() => {
    return inventory.find((i) => i.id === effectiveSelectedId) || inventory[0] || null;
  }, [inventory, effectiveSelectedId]);

  // Find all inventory records across ALL stores for the selected ingredient
  const matchingStoreItems = useMemo(() => {
    if (!selectedItem) return [];
    const targetName = selectedItem.name.toLowerCase().trim();
    const targetSku = (selectedItem.sku || '').toLowerCase().trim();

    return inventory.filter(
      (i) =>
        i.name.toLowerCase().trim() === targetName ||
        (targetSku && i.sku && i.sku.toLowerCase().trim() === targetSku) ||
        i.id === selectedItem.id
    );
  }, [inventory, selectedItem]);

  // Find current store matched item
  const currentStoreMatchedItem = useMemo(() => {
    if (!selectedItem) return null;
    if (selectedStoreName === 'All') return selectedItem;
    return (
      matchingStoreItems.find(
        (i) => (i.storeName || 'Bole Main Central Store').toLowerCase().trim() === selectedStoreName.toLowerCase().trim()
      ) || null
    );
  }, [selectedItem, matchingStoreItems, selectedStoreName]);

  // Effective on-hand stock for the selected view
  const effectiveStockOnHand = useMemo(() => {
    if (!selectedItem) return 0;
    if (selectedStoreName === 'All') {
      return Math.round(matchingStoreItems.reduce((sum, i) => sum + i.stockQty, 0) * 1000) / 1000;
    }
    return currentStoreMatchedItem ? currentStoreMatchedItem.stockQty : 0;
  }, [selectedItem, matchingStoreItems, currentStoreMatchedItem, selectedStoreName]);

  // Breakdown of stock per store location for this ingredient
  const storeStockBreakdown = useMemo(() => {
    if (!selectedItem) return [];
    return availableStoreNames
      .filter((s) => s !== 'All')
      .map((stName) => {
        const match = matchingStoreItems.find(
          (i) => (i.storeName || 'Bole Main Central Store').toLowerCase().trim() === stName.toLowerCase().trim()
        );
        return {
          storeName: stName,
          stockQty: match ? match.stockQty : 0,
          unit: selectedItem.unit,
          hasItem: Boolean(match),
          id: match?.id,
          reorderLevel: match?.reorderLevel || selectedItem.reorderLevel,
        };
      });
  }, [selectedItem, matchingStoreItems, availableStoreNames]);

  // New Voucher Form State
  const [voucherForm, setVoucherForm] = useState({
    date: new Date().toISOString().split('T')[0],
    transactionType: 'Stock In' as BinCardEntry['transactionType'],
    referenceId: `VOUCHER-${Date.now().toString().slice(-4)}`,
    qtyIn: 0,
    qtyOut: 0,
    productName: '',
    productImage: '',
    storeName: 'Bole Main Central Store',
    notes: '',
  });

  // Helper function: Find exact configured portion of raw ingredient for a finished menu item
  const getExactIngredientPortion = (m: MenuItem, rawItem: InventoryItem) => {
    if (!m || !rawItem) return null;
    const rawId = rawItem.id;
    const rawSku = rawItem.sku?.toLowerCase().trim();
    const rawNameLower = rawItem.name.toLowerCase().trim();

    // Look up live menu item from menuItems array in case m is a snapshot from an order object
    const currentMenuItem =
      menuItems.find(
        (item) => item.id === m.id || item.name.toLowerCase().trim() === m.name.toLowerCase().trim()
      ) || m;

    // 1. Direct configured recipe ingredients on the product (Highest priority)
    if (currentMenuItem.recipeIngredients && currentMenuItem.recipeIngredients.length > 0) {
      const match = currentMenuItem.recipeIngredients.find(
        (r) =>
          r.inventoryId === rawId ||
          matchingStoreItems.some((msi) => msi.id === r.inventoryId) ||
          (rawSku && r.sku && r.sku.toLowerCase().trim() === rawSku) ||
          (r.ingredientName && r.ingredientName.toLowerCase().trim() === rawNameLower) ||
          (r.ingredientName && rawNameLower.includes(r.ingredientName.toLowerCase().trim())) ||
          (r.ingredientName && r.ingredientName.toLowerCase().trim().includes(rawNameLower)) ||
          doesIngredientStringMatch(r.ingredientName, rawItem)
      );
      if (match && match.qty > 0) {
        let normalizedQty = match.qty;
        const rUnit = (match.unit || '').toLowerCase().trim();
        const rawUnit = (rawItem.unit || '').toLowerCase().trim();

        // Unit conversion if portion was entered in grams/ml/cl/mg but stock is in kg/liters
        if ((rawUnit === 'kg' || rawUnit === 'kilo' || rawUnit === 'kilogram') && (rUnit === 'g' || rUnit === 'gram' || rUnit === 'grams')) {
          normalizedQty = match.qty / 1000;
        } else if ((rawUnit === 'g' || rawUnit === 'gram' || rawUnit === 'grams') && (rUnit === 'kg' || rUnit === 'kilo' || rUnit === 'kilogram')) {
          normalizedQty = match.qty * 1000;
        } else if ((rawUnit === 'liters' || rawUnit === 'liter' || rawUnit === 'l') && (rUnit === 'ml' || rUnit === 'milliliter')) {
          normalizedQty = match.qty / 1000;
        } else if ((rawUnit === 'liters' || rawUnit === 'liter' || rawUnit === 'l') && (rUnit === 'cl')) {
          normalizedQty = match.qty / 100;
        } else if ((rawUnit === 'ml' || rawUnit === 'milliliter') && (rUnit === 'liters' || rUnit === 'liter' || rUnit === 'l')) {
          normalizedQty = match.qty * 1000;
        } else if ((rawUnit === 'kg' || rawUnit === 'kilo' || rawUnit === 'kilogram') && (rUnit === 'mg')) {
          normalizedQty = match.qty / 1000000;
        }

        return {
          qty: Math.round(normalizedQty * 10000) / 10000,
          unit: rawItem.unit,
          isConfigured: true,
          matchedIngredientName: match.ingredientName,
          configuredStore: match.storeName || (match as any).store || undefined,
        };
      }

      // 1b. Check if any recipe ingredient is a Special Ingredient that contains this raw item
      for (const r of currentMenuItem.recipeIngredients) {
        const specMatch = inventory.find(
          (inv) =>
            (inv.isSpecialIngredient ||
              inv.category === 'Special Ingredients' ||
              (inv.recipeComponents && inv.recipeComponents.length > 0)) &&
            (inv.id === r.inventoryId ||
              (r.sku && inv.sku && inv.sku.toLowerCase().trim() === r.sku.toLowerCase().trim()) ||
              inv.name.toLowerCase().trim() === (r.ingredientName || '').toLowerCase().trim())
        );

        if (specMatch && specMatch.recipeComponents && specMatch.recipeComponents.length > 0) {
          const compMatch = specMatch.recipeComponents.find(
            (c) =>
              c.inventoryId === rawId ||
              matchingStoreItems.some((msi) => msi.id === c.inventoryId) ||
              (rawSku && c.sku && c.sku.toLowerCase().trim() === rawSku) ||
              c.ingredientName.toLowerCase().trim() === rawNameLower ||
              (c.ingredientName &&
                (c.ingredientName.toLowerCase().includes(rawNameLower) ||
                  rawNameLower.includes(c.ingredientName.toLowerCase()))) ||
              doesIngredientStringMatch(c.ingredientName, rawItem)
          );

          if (compMatch && compMatch.qty > 0) {
            const specYield = specMatch.yieldQty && specMatch.yieldQty > 0 ? specMatch.yieldQty : 1;
            const fraction = r.qty / specYield;
            const rawNeeded = compMatch.qty * fraction;
            let normalizedQty = rawNeeded;
            const cUnit = (compMatch.unit || '').toLowerCase().trim();
            const rawUnit = (rawItem.unit || '').toLowerCase().trim();

            if ((rawUnit === 'kg' || rawUnit === 'kilo') && (cUnit === 'g' || cUnit === 'gram')) {
              normalizedQty = rawNeeded / 1000;
            } else if ((rawUnit === 'liters' || rawUnit === 'l') && (cUnit === 'ml')) {
              normalizedQty = rawNeeded / 1000;
            }

            return {
              qty: Math.round(normalizedQty * 10000) / 10000,
              unit: rawItem.unit,
              isConfigured: true,
              matchedIngredientName: `${compMatch.ingredientName} (via Special: ${specMatch.name})`,
              configuredStore: r.storeName || specMatch.storeName || undefined,
            };
          }
        }
      }
    }

    // 2. Recipe in recipeCosts table
    const rc = recipeCosts.find(
      (r) =>
        r.menuItemId === currentMenuItem.id ||
        r.menuItemName.toLowerCase().trim() === currentMenuItem.name.toLowerCase().trim()
    );
    if (rc && rc.ingredients && rc.ingredients.length > 0) {
      const match = rc.ingredients.find(
        (ing) =>
          (ing as any).inventoryId === rawId ||
          matchingStoreItems.some((msi) => msi.id === (ing as any).inventoryId) ||
          ing.ingredientName.toLowerCase().trim() === rawNameLower ||
          ing.ingredientName.toLowerCase().includes(rawNameLower) ||
          rawNameLower.includes(ing.ingredientName.toLowerCase().trim()) ||
          doesIngredientStringMatch(ing.ingredientName, rawItem)
      );
      if (match && match.qty > 0) {
        let normalizedQty = match.qty;
        const rUnit = (match.unit || '').toLowerCase().trim();
        const rawUnit = (rawItem.unit || '').toLowerCase().trim();

        if ((rawUnit === 'kg' || rawUnit === 'kilo') && (rUnit === 'g' || rUnit === 'gram')) {
          normalizedQty = match.qty / 1000;
        } else if ((rawUnit === 'liters' || rawUnit === 'liter' || rawUnit === 'l') && (rUnit === 'ml')) {
          normalizedQty = match.qty / 1000;
        }

        return {
          qty: Math.round(normalizedQty * 10000) / 10000,
          unit: rawItem.unit,
          isConfigured: true,
          matchedIngredientName: match.ingredientName,
          configuredStore: (match as any).storeName || undefined,
        };
      }
    }

    // 3. Heuristic fallback based on standard category consumption (only when no explicit recipe)
    if (currentMenuItem.ingredients && Array.isArray(currentMenuItem.ingredients) && currentMenuItem.ingredients.length > 0) {
      const matchedIngStr = currentMenuItem.ingredients.find((ingStr) => doesIngredientStringMatch(ingStr, rawItem));
      if (matchedIngStr) {
        let qty = 0.02;
        if (rawItem.unit === 'kg') {
          if (rawNameLower.includes('coffee') || rawNameLower.includes('bean')) {
            qty = 0.018;
          } else if (rawNameLower.includes('butter')) {
            qty = 0.03;
          } else if (rawNameLower.includes('chocolate') || rawNameLower.includes('cocoa')) {
            qty = matchedIngStr.toLowerCase().includes('powder') ? 0.005 : 0.03;
          } else if (rawNameLower.includes('sugar') || rawNameLower.includes('flour')) {
            qty = 0.06;
          } else {
            qty = 0.02;
          }
        } else if (rawItem.unit === 'liters') {
          if (rawNameLower.includes('milk') || rawNameLower.includes('dairy')) {
            qty = currentMenuItem.name.toLowerCase().includes('macchiato') ? 0.05 : 0.15;
          } else if (rawNameLower.includes('syrup')) {
            qty = 0.02;
          } else {
            qty = 0.1;
          }
        } else {
          qty = 1;
        }

        return {
          qty,
          unit: rawItem.unit,
          isConfigured: false,
          matchedIngredientName: matchedIngStr,
          configuredStore: rawItem.storeName || (currentMenuItem.category === 'Bakery' ? 'Kazanchis Bakery Lab & Cold Room' : 'Bole Main Central Store'),
        };
      }
    }

    return null;
  };

  // Derive products that use this ingredient (with photos and exact usage rates)
  const productsUsingIngredient = useMemo(() => {
    if (!selectedItem) return [];

    return menuItems
      .map((m) => {
        const portion = getExactIngredientPortion(m, selectedItem);
        if (!portion || portion.qty <= 0) return null;
        return {
          ...m,
          portionQty: portion.qty,
          portionUnit: portion.unit,
          isConfigured: portion.isConfigured,
          matchedIngredientName: portion.matchedIngredientName,
          configuredStore: portion.configuredStore,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [selectedItem, menuItems, recipeCosts, inventory, matchingStoreItems]);

  // Derive in-house Special Ingredients that consume this raw ingredient
  const specialIngredientsUsingRaw = useMemo(() => {
    if (!selectedItem) return [];
    const rawId = selectedItem.id;
    const rawSku = (selectedItem.sku || '').toLowerCase().trim();
    const rawNameLower = selectedItem.name.toLowerCase().trim();
    const matchingIds = new Set(matchingStoreItems.map((i) => i.id));

    return inventory
      .filter(
        (item) =>
          (item.isSpecialIngredient ||
            item.category === 'Special Ingredients' ||
            (item.recipeComponents && item.recipeComponents.length > 0)) &&
          item.id !== selectedItem.id
      )
      .map((spec) => {
        const comps = spec.recipeComponents || [];
        const matchedComp = comps.find(
          (c) =>
            matchingIds.has(c.inventoryId) ||
            c.inventoryId === rawId ||
            (rawSku && c.sku && c.sku.toLowerCase().trim() === rawSku) ||
            (c.ingredientName && c.ingredientName.toLowerCase().trim() === rawNameLower) ||
            (c.ingredientName &&
              (c.ingredientName.toLowerCase().includes(rawNameLower) ||
                rawNameLower.includes(c.ingredientName.toLowerCase()))) ||
            doesIngredientStringMatch(c.ingredientName, selectedItem)
        );

        if (!matchedComp) return null;

        const yieldQ = spec.yieldQty && spec.yieldQty > 0 ? spec.yieldQty : 1;
        const yieldU = spec.yieldUnit || spec.unit || 'Units';
        const compQtyPerBatch = matchedComp.qty;
        const compUnit = matchedComp.unit || selectedItem.unit;

        // Calculate unit normalized portion per 1 unit of yield
        let normalizedCompQty = compQtyPerBatch;
        const cUnit = (compUnit || '').toLowerCase().trim();
        const rawUnit = (selectedItem.unit || '').toLowerCase().trim();

        if ((rawUnit === 'kg' || rawUnit === 'kilo') && (cUnit === 'g' || cUnit === 'gram')) {
          normalizedCompQty = compQtyPerBatch / 1000;
        } else if ((rawUnit === 'liters' || rawUnit === 'l') && (cUnit === 'ml')) {
          normalizedCompQty = compQtyPerBatch / 1000;
        }

        const totalBatchCost = comps.reduce(
          (sum, c) => sum + (c.totalCost || c.qty * (c.unitCost || 0)),
          0
        );

        return {
          ...spec,
          matchedComp,
          compQtyPerBatch,
          compUnit,
          yieldQ,
          yieldU,
          portionPerYieldUnit: Math.round((normalizedCompQty / yieldQ) * 10000) / 10000,
          totalBatchCost,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [selectedItem, inventory, matchingStoreItems]);

  // Derive order sales consumption statistics for this ingredient
  const orderUsageStats = useMemo(() => {
    if (!selectedItem) return { totalServings: 0, totalDeducted: 0, usages: [] };

    let totalServings = 0;
    let totalDeducted = 0;
    const usages: {
      orderId: string;
      date: string;
      productName: string;
      productImage: string;
      qtyOrdered: number;
      ingredientUsedQty: number;
      unit: string;
      perServingQty: number;
      isConfigured: boolean;
      storeName: string;
    }[] = [];

    const defaultStore = selectedItem.storeName || 'Bole Main Central Store';

    orders.forEach((ord) => {
      ord.items.forEach((it) => {
        const m = it.menuItem;
        const portion = getExactIngredientPortion(m, selectedItem);

        if (portion && portion.qty > 0) {
          const itemStore = portion.configuredStore || (ord as any).storeName || defaultStore;

          if (selectedStoreName !== 'All' && itemStore.toLowerCase().trim() !== selectedStoreName.toLowerCase().trim()) {
            return;
          }

          totalServings += it.quantity;
          const consumed = Math.round(portion.qty * it.quantity * 1000) / 1000;
          totalDeducted += consumed;

          usages.push({
            orderId: ord.id,
            date: ord.createdAt,
            productName: m.name,
            productImage: m.image,
            qtyOrdered: it.quantity,
            ingredientUsedQty: consumed,
            unit: selectedItem.unit,
            perServingQty: portion.qty,
            isConfigured: portion.isConfigured,
            storeName: itemStore,
          });
        }
      });
    });

    return { totalServings, totalDeducted: Math.round(totalDeducted * 1000) / 1000, usages };
  }, [selectedItem, orders, menuItems, recipeCosts, selectedStoreName]);

  // Derive Damage & Spoilage deductions for this ingredient
  const damageUsageStats = useMemo(() => {
    if (!selectedItem) return { totalDamagedQty: 0, usages: [] };

    let totalDamagedQty = 0;
    const usages: {
      voucherId: string;
      date: string;
      productName: string;
      productImage: string;
      qtyDamaged: number;
      ingredientUsedQty: number;
      unit: string;
      reason: string;
      recordedBy: string;
      storeName: string;
      isDirectRawMaterial: boolean;
    }[] = [];

    const rawId = selectedItem.id;
    const rawName = selectedItem.name.toLowerCase().trim();
    const matchingIds = new Set(matchingStoreItems.map((i) => i.id));

    damageVouchers.forEach((v) => {
      const voucherStore = (v as any).storeName || (v as any).damageStore || selectedItem.storeName || 'Bole Main Central Store';
      if (selectedStoreName !== 'All' && voucherStore.toLowerCase().trim() !== selectedStoreName.toLowerCase().trim()) {
        return;
      }

      v.items.forEach((itemDmg) => {
        if (
          itemDmg.itemType === 'Ingredient' &&
          (matchingIds.has(itemDmg.itemId) ||
            itemDmg.itemId === rawId ||
            itemDmg.name.toLowerCase().trim() === rawName ||
            itemDmg.name.toLowerCase().includes(rawName) ||
            rawName.includes(itemDmg.name.toLowerCase().trim()))
        ) {
          totalDamagedQty += itemDmg.qty;
          usages.push({
            voucherId: v.voucherId,
            date: v.date,
            productName: itemDmg.name,
            productImage: itemDmg.image || selectedItem.image,
            qtyDamaged: itemDmg.qty,
            ingredientUsedQty: itemDmg.qty,
            unit: itemDmg.unit || selectedItem.unit,
            reason: itemDmg.reason || 'Spoilage / Damage loss',
            recordedBy: v.recordedBy || 'Storekeeper',
            storeName: voucherStore,
            isDirectRawMaterial: true,
          });
        } else if (itemDmg.itemType === 'Finished Product') {
          const matchedMenuItem = menuItems.find(
            (m) => m.id === itemDmg.itemId || m.name.toLowerCase().trim() === itemDmg.name.toLowerCase().trim()
          );

          if (matchedMenuItem) {
            const portion = getExactIngredientPortion(matchedMenuItem, selectedItem);
            if (portion && portion.qty > 0) {
              const consumed = Math.round(portion.qty * itemDmg.qty * 1000) / 1000;
              totalDamagedQty += consumed;
              usages.push({
                voucherId: v.voucherId,
                date: v.date,
                productName: matchedMenuItem.name,
                productImage: itemDmg.image || matchedMenuItem.image,
                qtyDamaged: itemDmg.qty,
                ingredientUsedQty: consumed,
                unit: selectedItem.unit,
                reason: `${itemDmg.reason || 'Product Spoilage'} (${itemDmg.qty}x ${matchedMenuItem.name})`,
                recordedBy: v.recordedBy || 'Storekeeper',
                storeName: voucherStore,
                isDirectRawMaterial: false,
              });
            }
          }
        }
      });
    });

    return {
      totalDamagedQty: Math.round(totalDamagedQty * 1000) / 1000,
      usages,
    };
  }, [selectedItem, matchingStoreItems, damageVouchers, menuItems, recipeCosts, selectedStoreName]);

  // Derive Store Transfers accurately: Source Store (OUT) and Destination Store (IN)
  const transferUsageStats = useMemo(() => {
    if (!selectedItem) {
      return { totalTransferredOut: 0, totalTransferredIn: 0, netTransferImpact: 0, usages: [] };
    }

    let totalTransferredOut = 0;
    let totalTransferredIn = 0;
    const rawName = selectedItem.name.toLowerCase().trim();
    const rawSku = (selectedItem.sku || '').toLowerCase().trim();
    const matchingIds = new Set(matchingStoreItems.map((i) => i.id));

    const usages: {
      voucherId: string;
      date: string;
      fromStore: string;
      toStore: string;
      type: 'Out' | 'In';
      storeName: string;
      qty: number;
      unit: string;
      transferredBy: string;
      driverOrHandler?: string;
      remark?: string;
      isRequisition: boolean;
      status: string;
    }[] = [];

    // 1. Direct and requisitioned store transfers
    storeTransfers.forEach((tr) => {
      const isEffective =
        tr.isSourceDeducted ||
        tr.isDestCredited ||
        tr.status === 'Completed' ||
        tr.status === 'In Transit' ||
        tr.status === 'Partially Received';

      if (!isEffective) return;
      if (tr.status === 'Cancelled' || tr.status === 'Rejected') return;

      tr.items.forEach((it) => {
        const matches =
          (it.inventoryId && matchingIds.has(it.inventoryId)) ||
          it.ingredientName.toLowerCase().trim() === rawName ||
          it.ingredientName.toLowerCase().includes(rawName) ||
          rawName.includes(it.ingredientName.toLowerCase().trim()) ||
          (it.sku && rawSku && it.sku.toLowerCase().trim() === rawSku);

        if (matches && it.qtyTransferred > 0) {
          const fromStore = tr.fromStore || 'Bole Main Central Store';
          const toStore = tr.toStore || 'Kazanchis Bakery Lab & Cold Room';
          const qtyOut = it.qtyTransferred;
          const qtyIn =
            it.qtyReceived !== undefined && it.qtyReceived > 0
              ? it.qtyReceived
              : tr.status === 'Completed'
              ? it.qtyTransferred
              : 0;

          // Source Store Transfer OUT (Deduction)
          if (
            tr.isSourceDeducted ||
            tr.status === 'Completed' ||
            tr.status === 'In Transit' ||
            tr.status === 'Partially Received'
          ) {
            if (
              selectedStoreName === 'All' ||
              fromStore.toLowerCase().trim() === selectedStoreName.toLowerCase().trim()
            ) {
              totalTransferredOut += qtyOut;
            }

            usages.push({
              voucherId: tr.voucherId,
              date: tr.date,
              fromStore,
              toStore,
              type: 'Out',
              storeName: fromStore,
              qty: qtyOut,
              unit: it.unit || selectedItem.unit,
              transferredBy: tr.transferredBy,
              driverOrHandler: tr.driverOrHandler,
              remark: tr.remark,
              isRequisition: Boolean(tr.linkedRequisitionId),
              status: tr.status,
            });
          }

          // Destination Store Transfer IN (Credit)
          if (
            (tr.isDestCredited || tr.status === 'Completed' || tr.status === 'Partially Received') &&
            qtyIn > 0
          ) {
            if (
              selectedStoreName === 'All' ||
              toStore.toLowerCase().trim() === selectedStoreName.toLowerCase().trim()
            ) {
              totalTransferredIn += qtyIn;
            }

            usages.push({
              voucherId: tr.voucherId,
              date: tr.completedDate || tr.date,
              fromStore,
              toStore,
              type: 'In',
              storeName: toStore,
              qty: qtyIn,
              unit: it.unit || selectedItem.unit,
              transferredBy: tr.receivedBy || tr.transferredBy,
              driverOrHandler: tr.driverOrHandler,
              remark: tr.remark,
              isRequisition: Boolean(tr.linkedRequisitionId),
              status: tr.status,
            });
          }
        }
      });
    });

    return {
      totalTransferredOut: Math.round(totalTransferredOut * 1000) / 1000,
      totalTransferredIn: Math.round(totalTransferredIn * 1000) / 1000,
      netTransferImpact: Math.round((totalTransferredIn - totalTransferredOut) * 1000) / 1000,
      usages,
    };
  }, [selectedItem, matchingStoreItems, storeTransfers, selectedStoreName]);

  // Combine manual Bin Card entries with live Order Sales, Damage, and Store Transfers for a complete ledger
  const combinedLedgerEntries = useMemo(() => {
    if (!selectedItem) return [];

    const matchingIds = new Set(matchingStoreItems.map((i) => i.id));
    const targetName = selectedItem.name.toLowerCase().trim();

    // Track existing voucher/ref IDs to prevent double counting
    const trackedRefKeys = new Set<string>();

    // 1. Filter stored manual/service bin card entries belonging strictly to this active ingredient
    const manualEntries = binCards
      .filter((b) => {
        // Exclude entries of deleted ingredients
        const idMatch = b.inventoryId && matchingIds.has(b.inventoryId);
        const nameMatch = b.productName && b.productName.toLowerCase().trim() === targetName;
        return idMatch || nameMatch;
      })
      .map((b) => {
        const store = b.storeName || selectedItem.storeName || 'Bole Main Central Store';
        const key = `${(b.referenceId || b.id).toLowerCase().trim()}-${store.toLowerCase().trim()}-${b.transactionType}`;
        trackedRefKeys.add(key);

        return {
          id: b.id,
          date: b.date,
          storeName: store,
          transactionType: b.transactionType,
          referenceId: b.referenceId,
          productName: b.productName,
          productImage: b.productImage,
          qtyIn: b.qtyIn || 0,
          qtyOut: b.qtyOut || 0,
          balanceAfter: b.balanceAfter || 0,
          unit: b.unit || selectedItem.unit,
          notes: b.notes || 'Store ledger entry',
          isManual: true,
        };
      });

    // 2. Auto-generate entries from Completed/Ready Orders (if not already recorded in manual bin cards)
    const orderEntries = orderUsageStats.usages
      .filter((u) => {
        const key = `${u.orderId.toLowerCase().trim()}-${u.storeName.toLowerCase().trim()}-Order Sales Consumption`;
        return !trackedRefKeys.has(key);
      })
      .map((u, idx) => ({
        id: `ORD-DED-${u.orderId}-${idx}`,
        date: u.date.split('T')[0] || u.date,
        storeName: u.storeName,
        transactionType: 'Order Sales Consumption' as const,
        referenceId: u.orderId,
        productName: u.productName,
        productImage: u.productImage,
        qtyIn: 0,
        qtyOut: u.ingredientUsedQty,
        balanceAfter: 0,
        unit: u.unit,
        notes: `Sales: ${u.qtyOrdered}x ${u.productName} (${u.perServingQty} ${u.unit}/serving)`,
        isManual: false,
      }));

    // 3. Auto-generate entries from Damage Vouchers
    const damageEntries = damageUsageStats.usages
      .filter((d) => {
        const key = `${d.voucherId.toLowerCase().trim()}-${d.storeName.toLowerCase().trim()}-Damage Spoilage`;
        return !trackedRefKeys.has(key);
      })
      .map((d, idx) => ({
        id: `DMG-DED-${d.voucherId}-${idx}`,
        date: d.date,
        storeName: d.storeName,
        transactionType: 'Damage Spoilage' as const,
        referenceId: d.voucherId,
        productName: d.productName,
        productImage: d.productImage,
        qtyIn: 0,
        qtyOut: d.ingredientUsedQty,
        balanceAfter: 0,
        unit: d.unit,
        notes: d.isDirectRawMaterial
          ? `Damage/Loss: ${d.reason} (Recorded by ${d.recordedBy})`
          : `Finished Loss: ${d.reason} (Used: ${d.ingredientUsedQty} ${d.unit})`,
        isManual: false,
      }));

    // 4. Auto-generate entries from Store Transfers Out & In
    const transferEntries = transferUsageStats.usages
      .filter((t) => {
        const key = `${t.voucherId.toLowerCase().trim()}-${t.storeName.toLowerCase().trim()}-Store Transfer`;
        return !trackedRefKeys.has(key);
      })
      .map((t, idx) => ({
        id: `TRN-SYN-${t.voucherId}-${t.type}-${idx}`,
        date: t.date,
        storeName: t.storeName,
        transactionType: 'Store Transfer' as const,
        referenceId: t.voucherId,
        productName: undefined,
        productImage: undefined,
        qtyIn: t.type === 'In' ? t.qty : 0,
        qtyOut: t.type === 'Out' ? t.qty : 0,
        balanceAfter: 0,
        unit: t.unit,
        notes:
          t.type === 'Out'
            ? `Store Transfer OUT -> ${t.toStore} (Handler: ${t.driverOrHandler || t.transferredBy})${t.remark ? ` - ${t.remark}` : ''}`
            : `Store Transfer IN <- ${t.fromStore} (Handler: ${t.driverOrHandler || t.transferredBy})${t.remark ? ` - ${t.remark}` : ''}`,
        isManual: false,
      }));

    // 5. Stock In Vouchers entries for this ingredient only
    const stockInEntries: typeof manualEntries = [];
    stockInVouchers.forEach((v) => {
      const vStore = v.receivingStore || (v as any).storeName || selectedItem.storeName || 'Bole Main Central Store';
      const key = `${v.voucherId.toLowerCase().trim()}-${vStore.toLowerCase().trim()}-Stock In`;
      if (trackedRefKeys.has(key)) return;

      v.items.forEach((it) => {
        const matches =
          (it.inventoryId && matchingIds.has(it.inventoryId)) ||
          it.inventoryId === selectedItem.id ||
          (it.ingredientName && doesIngredientStringMatch(it.ingredientName, selectedItem)) ||
          (it.sku && selectedItem.sku && it.sku.toLowerCase().trim() === selectedItem.sku.toLowerCase().trim());

        if (matches) {
          const receivedQty = (it as any).receivedQty ?? it.qty ?? 0;
          if (receivedQty > 0) {
            stockInEntries.push({
              id: `GRN-${v.voucherId}-${it.inventoryId || selectedItem.id}`,
              date: v.date,
              storeName: vStore,
              transactionType: 'Stock In' as const,
              referenceId: v.voucherId,
              productName: undefined,
              productImage: undefined,
              qtyIn: receivedQty,
              qtyOut: 0,
              balanceAfter: 0,
              unit: it.unit || selectedItem.unit,
              notes: `GRN Intake from ${v.supplierName || 'Supplier'} (FS: ${v.fsNumber || 'Direct'}${v.remark ? ` - ${v.remark}` : ''})`,
              isManual: false,
            });
          }
        }
      });
    });

    // Merge all unified entries
    const allRaw = [
      ...manualEntries,
      ...orderEntries,
      ...damageEntries,
      ...transferEntries,
      ...stockInEntries,
    ];

    // Filter by selectedStoreName
    const storeFiltered = allRaw.filter((e) => {
      if (selectedStoreName === 'All') return true;
      return e.storeName.toLowerCase().trim() === selectedStoreName.toLowerCase().trim();
    });

    // Sort chronologically
    const sorted = [...storeFiltered].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate dynamic running balance accurately for this store view
    const totalIn = sorted.reduce((sum, e) => sum + e.qtyIn, 0);
    const totalOut = sorted.reduce((sum, e) => sum + e.qtyOut, 0);

    // Calculate initial opening balance based on the current on-hand stock
    let runningBalance = Math.max(0, effectiveStockOnHand - totalIn + totalOut);

    const calculated = sorted.map((entry) => {
      runningBalance = runningBalance + entry.qtyIn - entry.qtyOut;
      return {
        ...entry,
        balanceAfter: Math.max(0, Math.round(runningBalance * 1000) / 1000),
      };
    });

    // If transaction type filter is applied
    if (filterType !== 'All') {
      return calculated.filter((e) => e.transactionType === filterType);
    }

    return calculated;
  }, [
    selectedItem,
    matchingStoreItems,
    binCards,
    orderUsageStats,
    damageUsageStats,
    transferUsageStats,
    stockInVouchers,
    filterType,
    selectedStoreName,
    effectiveStockOnHand,
  ]);

  // Totals for top statistics cards (strictly for this selected ingredient only)
  const totalStockInSum = useMemo(() => {
    if (!selectedItem) return 0;
    const matchingIds = new Set(matchingStoreItems.map((i) => i.id));

    const manualIn = binCards
      .filter((b) => {
        const idMatch = b.inventoryId && matchingIds.has(b.inventoryId);
        const nameMatch = b.productName && b.productName.toLowerCase().trim() === selectedItem.name.toLowerCase().trim();
        const storeMatch = selectedStoreName === 'All' || (b.storeName || '').toLowerCase().trim() === selectedStoreName.toLowerCase().trim();
        return (idMatch || nameMatch) && b.qtyIn > 0 && storeMatch;
      })
      .reduce((sum, b) => sum + b.qtyIn, 0);

    let stockInSum = 0;
    stockInVouchers.forEach((v) => {
      const vStore = v.receivingStore || (v as any).storeName || selectedItem.storeName || 'Bole Main Central Store';
      if (selectedStoreName !== 'All' && vStore.toLowerCase().trim() !== selectedStoreName.toLowerCase().trim()) return;

      v.items.forEach((it) => {
        const matches =
          (it.inventoryId && matchingIds.has(it.inventoryId)) ||
          it.inventoryId === selectedItem.id ||
          (it.ingredientName && doesIngredientStringMatch(it.ingredientName, selectedItem)) ||
          (it.sku && selectedItem.sku && it.sku.toLowerCase().trim() === selectedItem.sku.toLowerCase().trim());
        if (matches) {
          const qty = (it as any).receivedQty ?? it.qty ?? 0;
          stockInSum += qty;
        }
      });
    });

    return Math.round((manualIn + stockInSum) * 1000) / 1000;
  }, [binCards, matchingStoreItems, stockInVouchers, selectedItem, selectedStoreName]);

  // Handle Save New Voucher
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const qtyIn = Number(voucherForm.qtyIn) || 0;
    const qtyOut = Number(voucherForm.qtyOut) || 0;
    const currentStock = effectiveStockOnHand;
    const balanceAfter = Math.max(0, currentStock + qtyIn - qtyOut);

    const targetStore = voucherForm.storeName || selectedItem.storeName || 'Bole Main Central Store';
    const storeItem = matchingStoreItems.find(
      (i) => (i.storeName || 'Bole Main Central Store').toLowerCase().trim() === targetStore.toLowerCase().trim()
    );

    const entry: Partial<BinCardEntry> = {
      inventoryId: storeItem?.id || selectedItem.id,
      storeName: targetStore,
      date: voucherForm.date,
      transactionType: voucherForm.transactionType,
      referenceId: voucherForm.referenceId || `VOUCHER-${Date.now().toString().slice(-4)}`,
      productName: voucherForm.productName || selectedItem.name,
      productImage: voucherForm.productImage || selectedItem.image,
      qtyIn,
      qtyOut,
      balanceAfter,
      unit: selectedItem.unit,
      notes: voucherForm.notes || undefined,
    };

    if (onAddBinCardEntry) {
      await onAddBinCardEntry(entry);
    }

    setIsNewVoucherModalOpen(false);
    // Reset form
    setVoucherForm({
      date: new Date().toISOString().split('T')[0],
      transactionType: 'Stock In',
      referenceId: `VOUCHER-${Date.now().toString().slice(-4)}`,
      qtyIn: 0,
      qtyOut: 0,
      productName: '',
      productImage: '',
      storeName: targetStore,
      notes: '',
    });
  };

  // Trigger Print View
  const handlePrint = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!selectedItem) return;
    const headers = 'Date,Store Location,Transaction Type,Reference/Product,Qty In (+),Qty Out (-),Balance After,Unit,Notes\n';
    const rows = combinedLedgerEntries
      .map(
        (e) =>
          `"${e.date}","${e.storeName}","${e.transactionType}","${e.productName || e.referenceId}",${e.qtyIn},${e.qtyOut},${e.balanceAfter},"${e.unit}","${e.notes}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `BinCard_${selectedItem.name.replace(/\s+/g, '_')}_${selectedStoreName}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30 inline-flex items-center gap-1.5">
            <CreditCard size={12} />
            Warehouse & Multi-Branch Store Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1 flex items-center gap-2.5">
            Store Bin Card Ledger (የስቶር ቢን ካርድ)
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Real-time stock ledger with automatic store-to-store transfer deduction, menu recipe consumption, and multi-branch balance tracking.
          </p>
        </div>

        {/* Action Buttons: Print, Export, New Voucher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="h-10 px-3.5 bg-[#1E293B] hover:bg-[#243244] text-[#CBD5E1] hover:text-white rounded-xl border border-white/10 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Printer size={15} className="text-[#D4AF37]" />
            <span>Print Bin Card (ፕሪንት)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-10 px-3.5 bg-[#1E293B] hover:bg-[#243244] text-[#CBD5E1] hover:text-white rounded-xl border border-white/10 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Download size={15} className="text-[#22C55E]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewVoucherModalOpen(true)}
            className="h-10 px-4 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Plus size={16} />
            <span>+ New Voucher (አዲስ ሰነድ መዝግብ)</span>
          </button>
        </div>
      </div>

      {/* STORE SELECTION BAR */}
      <div className="bg-[#243244] p-4 rounded-[22px] border border-[#D4AF37]/30 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Building2 className="text-[#D4AF37]" size={22} />
            <div>
              <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                Store Location Filter (ስቶር መምረጫ)
              </h3>
              <p className="text-[11px] text-[#94A3B8]">
                Audit bin cards for a specific store branch or view consolidated warehouse balance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#CBD5E1] hidden sm:inline">Store:</span>
            <select
              value={selectedStoreName}
              onChange={(e) => setSelectedStoreName(e.target.value)}
              className="bg-[#1E293B] text-[#D4AF37] border border-[#D4AF37]/50 rounded-xl px-3.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
            >
              {availableStoreNames.map((st) => (
                <option key={st} value={st} className="bg-[#1E293B] text-white">
                  {st === 'All' ? '🏬 All Store Locations (Overall Warehouse)' : `🏬 ${st}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Store Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
          {availableStoreNames.map((st) => {
            const isSelected = selectedStoreName === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStoreName(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#D4AF37] text-[#0F172A] shadow-md'
                    : 'bg-[#1E293B] text-[#CBD5E1] hover:bg-[#2A3B50] hover:text-white border border-white/10'
                }`}
              >
                <Store size={13} />
                <span>{st === 'All' ? 'All Stores (ሁሉንም ስቶር)' : st}</span>
                {isSelected && <CheckCircle2 size={13} className="ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Ingredient Selector & Search, Right Detailed Official Bin Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Active Ingredient Search & Fast Selector */}
        <div className="bg-[#243244] p-5 rounded-[24px] border border-white/10 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
                <Package size={16} className="text-[#D4AF37]" />
                Select Ingredient (የግብዓቱ ስም)
              </h2>
              <p className="text-[10px] text-[#94A3B8]">Choose active raw material to inspect ledger</p>
            </div>
            <span className="text-[10px] text-[#D4AF37] bg-[#1E293B] px-2.5 py-0.5 rounded-full font-mono font-bold border border-[#D4AF37]/30">
              {uniqueIngredients.length} Active Raw Materials
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type ingredient name (e.g. Coffee, Milk, Chocolate)..."
              className="w-full h-11 bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-9 pr-3 text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
            />
            <Search size={16} className="absolute left-3 top-3 text-[#94A3B8]" />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Ingredient List Items */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredInventory.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs bg-[#1E293B]/50 rounded-2xl border border-white/5 p-4">
                <Package size={32} className="mx-auto text-gray-500 mb-2" />
                <p className="font-bold text-[#F8FAFC]">No Active Raw Ingredients Found</p>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  Try clearing search keyword or select a different store location.
                </p>
              </div>
            ) : (
              filteredInventory.map((inv) => {
                const isSelected = inv.id === effectiveSelectedId;
                const isLow = inv.stockQty <= (inv.reorderLevel || 10);
                const isOut = inv.stockQty <= 0;
                const itemStore = inv.storeName || 'Bole Main Central Store';

                return (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => setSelectedInventoryId(inv.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E293B] border-[#D4AF37] shadow-lg ring-2 ring-[#D4AF37]/50'
                        : 'bg-[#1E293B]/50 border-white/5 hover:bg-[#1E293B] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={inv.image}
                        alt={inv.name}
                        className="w-12 h-12 object-cover rounded-xl shrink-0 border border-white/10 shadow-sm"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-[#F8FAFC] truncate block">
                          {inv.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] mt-0.5">
                          <span className="font-mono text-[#D4AF37]">SKU: {inv.sku}</span>
                          <span>•</span>
                          <span>{inv.category}</span>
                        </div>
                        <span className="text-[9px] text-[#CBD5E1] bg-white/5 px-2 py-0.5 rounded-full mt-1 inline-block truncate max-w-[150px]">
                          🏬 {itemStore}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-black block ${
                          isOut
                            ? 'text-red-400'
                            : isLow
                            ? 'text-amber-400'
                            : 'text-[#22C55E]'
                        }`}
                      >
                        {inv.stockQty} {inv.unit}
                      </span>
                      <span className="text-[9px] text-[#94A3B8] uppercase font-bold">
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Official Store Bin Card, Multi-Store Breakdown & Deductions Ledger */}
        <div className="lg:col-span-2 space-y-6">
          {selectedItem ? (
            <>
              {/* MASTER OFFICIAL BIN CARD HEADER (Form 10 / Warehouse Standard) */}
              <div className="bg-[#243244] p-6 rounded-[28px] border-2 border-[#D4AF37]/40 shadow-2xl space-y-5 text-[#F8FAFC]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-start gap-4">
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      className="w-20 h-20 object-cover rounded-2xl border-2 border-[#D4AF37] shadow-md shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black text-[#D4AF37] bg-[#1E293B] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30 uppercase">
                          Official Form • Bin Card # {selectedItem.sku}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            effectiveStockOnHand <= 0
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : effectiveStockOnHand <= selectedItem.reorderLevel
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {effectiveStockOnHand <= 0
                            ? '● Out of Stock (ያለቀ)'
                            : effectiveStockOnHand <= selectedItem.reorderLevel
                            ? '⚠️ Reorder Warning (ማዘዣ የደረሰ)'
                            : '✓ Stock Level Healthy (አጥጋቢ)'}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#F8FAFC] mt-1.5">
                        {selectedItem.name}
                      </h2>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#94A3B8] mt-1">
                        <span>
                          Viewing Store:{' '}
                          <strong className="text-[#D4AF37]">
                            {selectedStoreName === 'All' ? 'All Branches (ጠቅላላ ስቶሮች)' : selectedStoreName}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Supplier: <strong>{selectedItem.supplierName}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Unit Cost: <strong className="text-[#F8FAFC]">{selectedItem.costPerUnit} ETB</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Big Remaining Balance Card & Live Ledger Audit KPI Strip */}
                  <div className="bg-[#1E293B] p-4 px-6 rounded-2xl border border-white/10 text-center shrink-0 shadow-inner">
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider block">
                      {selectedStoreName === 'All' ? 'Total On-Hand Stock (ጠቅላላ ክምችት)' : `${selectedStoreName} Stock`}
                    </span>
                    <span className="text-3xl font-serif font-black text-[#22C55E] block mt-0.5">
                      {effectiveStockOnHand} <span className="text-sm font-sans font-normal text-[#CBD5E1]">{selectedItem.unit}</span>
                    </span>
                    <span className="text-[11px] text-[#D4AF37] font-mono font-bold block mt-1">
                      Valuation: {(effectiveStockOnHand * selectedItem.costPerUnit).toLocaleString()} ETB
                    </span>
                  </div>
                </div>

                {/* MULTI-BRANCH STORE BALANCE BREAKDOWN MATRIX */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-wider block">
                    Branch Store Balances for "{selectedItem.name}" (በእያንዳንዱ ስቶር ያለው ቀሪ ክምችት)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {storeStockBreakdown.map((sb) => {
                      const isCurrentSelected =
                        selectedStoreName.toLowerCase().trim() === sb.storeName.toLowerCase().trim();

                      return (
                        <div
                          key={sb.storeName}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                            isCurrentSelected
                              ? 'bg-[#1E293B] border-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]/50'
                              : 'bg-[#1E293B]/60 border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={12} className={isCurrentSelected ? 'text-[#D4AF37]' : 'text-gray-400'} />
                              <span className="text-xs font-bold text-[#F8FAFC] truncate block">
                                {sb.storeName}
                              </span>
                            </div>
                            <span className="text-[9px] text-[#94A3B8] block mt-0.5">
                              {sb.hasItem ? 'Registered Store Item' : 'Zero Balance in this Store'}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-xs font-black ${
                                sb.stockQty <= 0
                                  ? 'text-gray-400'
                                  : sb.stockQty <= sb.reorderLevel
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {sb.stockQty} {sb.unit}
                            </span>
                            {isCurrentSelected && (
                              <span className="text-[8px] bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.2 rounded block font-bold mt-0.5">
                                Active View
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5 LIVE AUDIT DEDUCTION SUMMARY METRIC CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs pt-1">
                  <div className="bg-[#1E293B] p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-[#94A3B8] block font-medium">Total Received (+ ገቢ)</span>
                    <span className="text-base font-bold text-[#22C55E] block">
                      +{totalStockInSum} {selectedItem.unit}
                    </span>
                    <span className="text-[9px] text-[#94A3B8]">Stock In & GRN Intake</span>
                  </div>

                  <div className="bg-[#1E293B] p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-[#94A3B8] block font-medium">Sales Consumed (- ሽያጭ)</span>
                    <span className="text-base font-bold text-amber-400 block">
                      -{orderUsageStats.totalDeducted} {selectedItem.unit}
                    </span>
                    <span className="text-[9px] text-[#94A3B8]">{orderUsageStats.totalServings} portions sold</span>
                  </div>

                  <div className="bg-[#1E293B] p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-[#94A3B8] block font-medium">
                      {selectedStoreName === 'All' ? 'Store Transfers (⇄)' : 'Transfers Out (- ዝውውር)'}
                    </span>
                    <span className="text-base font-bold text-sky-400 block">
                      {selectedStoreName === 'All'
                        ? `${transferUsageStats.usages.length} Moves`
                        : `-${transferUsageStats.totalTransferredOut} ${selectedItem.unit}`}
                    </span>
                    <span className="text-[9px] text-[#94A3B8]">
                      {selectedStoreName === 'All'
                        ? 'Inter-store dispatches'
                        : `+${transferUsageStats.totalTransferredIn} in / -${transferUsageStats.totalTransferredOut} out`}
                    </span>
                  </div>

                  <div className="bg-[#1E293B] p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-[#94A3B8] block font-medium">Damage & Loss (- ብልሽት)</span>
                    <span className="text-base font-bold text-rose-400 block">
                      -{damageUsageStats.totalDamagedQty} {selectedItem.unit}
                    </span>
                    <span className="text-[9px] text-[#94A3B8]">{damageUsageStats.usages.length} damage records</span>
                  </div>

                  <div className="bg-[#1E293B] p-3 rounded-2xl border border-[#D4AF37]/30 space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-[#D4AF37] block font-bold">On-Hand Stock (ቀሪ ክምችት)</span>
                    <span className="text-base font-black text-[#F8FAFC] block">
                      {effectiveStockOnHand} {selectedItem.unit}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-semibold">
                      {selectedStoreName === 'All' ? 'Consolidated Total' : `${selectedStoreName} Stock`}
                    </span>
                  </div>
                </div>
              </div>

              {/* PRODUCTS & SPECIAL INGREDIENTS MADE FROM THIS RAW MATERIAL WITH PHOTOS */}
              <div className="bg-[#243244] p-6 rounded-[28px] border border-white/10 space-y-5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-base font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
                      <ChefHat size={20} className="text-[#D4AF37]" />
                      <span>Formulas & Products Consuming this Raw Material (የተዘጋጁበት ምርቶችና ስፔሻል ጥሬ ዕቃዎች)</span>
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Finished menu items and in-house special compound preparations consuming <strong className="text-[#F8FAFC]">{selectedItem.name}</strong>.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-[#1E293B] p-1 rounded-xl border border-white/10 self-start md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setConsumingTabFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        consumingTabFilter === 'all'
                          ? 'bg-[#D4AF37] text-[#0F172A] shadow-xs'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      All ({productsUsingIngredient.length + specialIngredientsUsingRaw.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsumingTabFilter('menu')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        consumingTabFilter === 'menu'
                          ? 'bg-[#D4AF37] text-[#0F172A] shadow-xs'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <Coffee size={12} /> Menu Items ({productsUsingIngredient.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsumingTabFilter('special')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        consumingTabFilter === 'special'
                          ? 'bg-[#D4AF37] text-[#0F172A] shadow-xs'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <FlaskConical size={12} /> Special Ingredients ({specialIngredientsUsingRaw.length})
                    </button>
                  </div>
                </div>

                {/* SPECIAL INGREDIENTS CONSUMING THIS RAW MATERIAL */}
                {(consumingTabFilter === 'all' || consumingTabFilter === 'special') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FlaskConical size={16} className="text-purple-400" />
                        <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                          Special Compound Ingredients (ስፔሻል ጥሬ ዕቃዎች)
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-purple-300 bg-purple-950/50 border border-purple-800/40 px-2 py-0.5 rounded-md">
                        {specialIngredientsUsingRaw.length} Special Formulas Use this Raw Item
                      </span>
                    </div>

                    {specialIngredientsUsingRaw.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-400 bg-[#1E293B]/40 rounded-2xl border border-white/5 space-y-1">
                        <p className="font-semibold text-[#CBD5E1]">No Special Compound Ingredients Using this Item</p>
                        <p className="text-[11px] text-[#94A3B8]">
                          Currently, no registered Special Ingredients in the system use <strong className="text-[#D4AF37]">{selectedItem.name}</strong> as a batch recipe component.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {specialIngredientsUsingRaw.map((spec) => (
                          <div
                            key={spec.id}
                            className="bg-[#1E293B] p-4 rounded-2xl border border-purple-500/30 hover:border-purple-400/60 transition-all flex items-center justify-between gap-3 shadow-md relative overflow-hidden"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                {spec.image ? (
                                  <img
                                    src={spec.image}
                                    alt={spec.name}
                                    className="w-14 h-14 object-cover rounded-xl border border-purple-500/30 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300">
                                    <FlaskConical size={24} />
                                  </div>
                                )}
                                <span className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                                  PREP
                                </span>
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                <span className="font-bold text-xs text-[#F8FAFC] truncate block">
                                  {spec.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-purple-300 font-semibold block">
                                    Yield: {spec.yieldQ} {spec.yieldU}
                                  </span>
                                  <span className="text-[10px] text-[#94A3B8]">•</span>
                                  <span className="text-[10px] text-emerald-400 font-semibold block">
                                    Stock: {spec.stockQty} {spec.unit}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  <span className="text-[10px] text-[#CBD5E1] bg-purple-900/30 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono">
                                    Batch Component: <strong className="text-[#D4AF37]">{spec.compQtyPerBatch} {spec.compUnit}</strong>
                                  </span>
                                  <span className="text-[9px] text-[#94A3B8]">
                                    ({spec.portionPerYieldUnit} {spec.compUnit}/{spec.yieldU})
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setInspectingSpecialItem(spec as any)}
                              className="p-2.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 hover:text-white rounded-xl text-xs border border-purple-700/40 shrink-0 cursor-pointer shadow-xs transition-colors"
                              title="Inspect Special Formulation Details"
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MENU PRODUCTS CONSUMING THIS RAW MATERIAL */}
                {(consumingTabFilter === 'all' || consumingTabFilter === 'menu') && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coffee size={16} className="text-[#D4AF37]" />
                        <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                          Finished Menu Products (የተዘጋጁበት የመኑ ምርቶች)
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#D4AF37] bg-[#1E293B] border border-[#D4AF37]/30 px-2 py-0.5 rounded-md">
                        {productsUsingIngredient.length} Menu Items Linked
                      </span>
                    </div>

                    {productsUsingIngredient.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-400 bg-[#1E293B]/40 rounded-2xl border border-white/5 space-y-1">
                        <p className="font-semibold text-[#CBD5E1]">No Menu Products Linked to this Ingredient</p>
                        <p className="text-[11px] text-[#94A3B8]">
                          Currently, no active recipes or menu items in the system require <strong className="text-[#D4AF37]">{selectedItem.name}</strong> as an ingredient.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {productsUsingIngredient.map((prod) => {
                          return (
                            <div
                              key={prod.id}
                              className="bg-[#1E293B] p-4 rounded-2xl border border-white/10 hover:border-[#D4AF37]/50 transition-all flex items-center justify-between gap-3 shadow-md"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-14 h-14 object-cover rounded-xl border border-white/10 shadow-sm shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-[#F8FAFC] truncate block">
                                    {prod.name}
                                  </span>
                                  <span className="text-[10px] text-[#D4AF37] font-semibold block">
                                    {prod.category} • {prod.price} ETB
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <span className="text-[10px] text-[#94A3B8]">
                                      Portion: <strong className="text-emerald-400">{prod.portionQty} {prod.portionUnit}</strong>
                                    </span>
                                    {prod.isConfigured ? (
                                      <span className="text-[8px] bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-1.5 py-0.2 rounded font-bold">
                                        Recipe Configured
                                      </span>
                                    ) : (
                                      <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">
                                        {prod.matchedIngredientName || 'Matched Ingredient'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setInspectingMenuItem(prod)}
                                className="p-2 bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] rounded-xl text-xs border border-white/10 shrink-0 cursor-pointer"
                                title="Inspect Product & Recipe"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* STORE TO STORE TRANSFERS AUDIT CARD */}
              {transferUsageStats.usages.length > 0 && (
                <div className="bg-[#243244] p-6 rounded-[28px] border border-white/10 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <h3 className="text-base font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
                        <Truck size={20} className="text-sky-400" />
                        <span>Store-to-Store Transfers Audit (የስቶር ወደ ስቶር ዝውውር መዝገብ)</span>
                      </h3>
                      <p className="text-xs text-[#94A3B8]">
                        Exact quantities transferred out or received across branch stores for <strong className="text-[#F8FAFC]">{selectedItem.name}</strong>.
                      </p>
                    </div>
                    <span className="text-xs text-sky-400 font-bold bg-[#1E293B] px-3 py-1 rounded-full border border-sky-400/30 shrink-0">
                      {transferUsageStats.usages.length} Transfer Movements
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {transferUsageStats.usages.map((u, idx) => (
                      <div
                        key={`${u.voucherId}-${u.type}-${idx}`}
                        className="bg-[#1E293B] p-4 rounded-2xl border border-white/10 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-sky-400">{u.voucherId}</span>
                          <span className="text-[10px] text-[#94A3B8]">{u.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#F8FAFC]">
                          <span className="text-[#94A3B8]">{u.fromStore}</span>
                          <ArrowRightLeft size={12} className="text-sky-400 shrink-0" />
                          <span className="font-bold text-emerald-400">{u.toStore}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                          <span className="text-[11px] text-[#94A3B8]">
                            Type: <strong className={u.type === 'Out' ? 'text-sky-400' : 'text-emerald-400'}>
                              {u.type === 'Out' ? 'Transfer OUT (-)' : 'Transfer IN (+)'}
                            </strong>
                          </span>
                          <span className={`font-extrabold ${u.type === 'Out' ? 'text-sky-400' : 'text-emerald-400'}`}>
                            {u.type === 'Out' ? `-${u.qty}` : `+${u.qty}`} {u.unit}
                          </span>
                        </div>
                        {u.remark && (
                          <p className="text-[10px] text-[#94A3B8] italic">{u.remark}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DEDUCTIONS LEDGER & MOVEMENT TABLE */}
              <div className="bg-[#243244] p-6 rounded-[28px] border border-white/10 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-serif font-bold text-[#F8FAFC] flex flex-wrap items-center gap-2">
                      <FileText size={20} className="text-[#D4AF37]" />
                      <span>Bin Card Movement & Deductions Ledger (የእንቅስቃሴ እና ቅነሳ ዝርዝር)</span>
                      <span className="text-xs font-sans font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-full">
                        {selectedItem.name} ({selectedItem.unit})
                      </span>
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      Chronological ledger of Stock In (+), Production Deductions (-), Store Transfers (⇄), and Damage Spoilage (-) strictly for <strong className="text-[#D4AF37]">{selectedItem.name}</strong>.
                    </p>
                  </div>

                  {/* Filter Transaction Type */}
                  <div className="flex items-center gap-2">
                    <Filter size={14} className="text-[#D4AF37]" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                    >
                      <option value="All">All Transactions (ሁሉንም)</option>
                      <option value="Stock In">Stock In / GRN (+ ገቢ)</option>
                      <option value="Order Sales Consumption">Order Production / KDS (- ወጪ)</option>
                      <option value="Store Transfer">Store Transfer (⇄ ዝውውር)</option>
                      <option value="Damage Spoilage">Damage / Spoilage (- ብልሽት)</option>
                      <option value="Initial Stock">Initial Opening Stock</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {combinedLedgerEntries.length === 0 ? (
                    <div className="text-center py-12 bg-[#1E293B]/40 rounded-2xl border border-white/5 space-y-2">
                      <CreditCard className="mx-auto text-gray-500" size={36} />
                      <p className="text-xs text-gray-300 font-bold">
                        No movement entries found for {selectedItem.name} under current filter.
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Click "+ New Voucher" above to record a stock entry or clear filters.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs text-[#CBD5E1]">
                      <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-[10px] font-extrabold tracking-wider border-b border-white/10">
                        <tr>
                          <th className="py-3 px-3">Date (ቀን)</th>
                          <th className="py-3 px-3">Store Branch (ስቶር)</th>
                          <th className="py-3 px-3">Ref / Voucher #</th>
                          <th className="py-3 px-3">Type (ዓይነት)</th>
                          <th className="py-3 px-3">Product / Details (ምርት / ዝርዝር ማስታወሻ)</th>
                          <th className="py-3 px-3 text-right">In (+)</th>
                          <th className="py-3 px-3 text-right">Out (-)</th>
                          <th className="py-3 px-3 text-right">Balance (ቀሪ)</th>
                          <th className="py-3 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {combinedLedgerEntries.map((e, idx) => {
                          const isStockIn = e.qtyIn > 0;
                          const isDamage = e.transactionType === 'Damage Spoilage';
                          const isSales = e.transactionType === 'Order Sales Consumption';
                          const isTransfer = e.transactionType === 'Store Transfer';

                          return (
                            <tr
                              key={e.id || idx}
                              className="hover:bg-[#1E293B]/60 transition-colors"
                            >
                              <td className="py-3.5 px-3 text-[11px] font-mono text-[#F8FAFC]">
                                {e.date}
                              </td>

                              <td className="py-3.5 px-3">
                                <span className="text-[10px] text-[#CBD5E1] bg-white/5 px-2 py-0.5 rounded-full font-bold">
                                  🏬 {e.storeName}
                                </span>
                              </td>

                              <td className="py-3.5 px-3 text-[11px] font-mono text-[#D4AF37] font-bold">
                                {e.referenceId}
                              </td>

                              <td className="py-3.5 px-3">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                    isStockIn
                                      ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
                                      : isDamage
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : isTransfer
                                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                      : isSales
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}
                                >
                                  {isStockIn ? (
                                    <ArrowDownRight size={11} />
                                  ) : isDamage ? (
                                    <AlertTriangle size={11} />
                                  ) : isTransfer ? (
                                    <ArrowRightLeft size={11} />
                                  ) : (
                                    <ArrowUpRight size={11} />
                                  )}
                                  {e.transactionType}
                                </span>
                              </td>

                              <td className="py-3.5 px-3">
                                {e.productName ? (
                                  <div className="flex items-center gap-3">
                                    {e.productImage ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreviewPhotoModal({
                                            productName: e.productName || 'Sold Product',
                                            image: e.productImage!,
                                            notes: e.notes,
                                            referenceId: e.referenceId,
                                            date: e.date,
                                            storeName: e.storeName,
                                            qtyOut: e.qtyOut,
                                            unit: e.unit,
                                          })
                                        }
                                        className="relative group shrink-0 cursor-pointer focus:outline-none"
                                        title="Click to view full product photo"
                                      >
                                        <img
                                          src={e.productImage}
                                          alt={e.productName}
                                          className="w-10 h-10 object-cover rounded-xl border border-amber-500/30 shadow-md group-hover:border-amber-400 group-hover:scale-105 transition-all"
                                        />
                                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                          <Eye size={14} className="text-white drop-shadow" />
                                        </div>
                                      </button>
                                    ) : (
                                      <div className="w-10 h-10 rounded-xl bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                                        <Coffee size={16} />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-[#F8FAFC] text-xs leading-tight">{e.productName}</span>
                                        {e.productImage && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setPreviewPhotoModal({
                                                productName: e.productName || 'Sold Product',
                                                image: e.productImage!,
                                                notes: e.notes,
                                                referenceId: e.referenceId,
                                                date: e.date,
                                                storeName: e.storeName,
                                                qtyOut: e.qtyOut,
                                                unit: e.unit,
                                              })
                                            }
                                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer flex items-center gap-1"
                                          >
                                            <Eye size={10} /> Photo
                                          </button>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-[#94A3B8] block line-clamp-1 mt-0.5">{e.notes}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    {isTransfer ? (
                                      <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                                        <Truck size={14} />
                                      </div>
                                    ) : isDamage ? (
                                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                                        <AlertTriangle size={14} />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-xl bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                                        <Package size={14} />
                                      </div>
                                    )}
                                    <span className="text-xs text-[#CBD5E1]">{e.notes || 'Store Transaction'}</span>
                                  </div>
                                )}
                              </td>

                              {/* In (+) */}
                              <td className="py-3.5 px-3 text-right font-black text-[#22C55E] text-xs">
                                {e.qtyIn > 0 ? `+${e.qtyIn} ${e.unit}` : '-'}
                              </td>

                              {/* Out (-) */}
                              <td className={`py-3.5 px-3 text-right font-black text-xs ${isDamage ? 'text-rose-400' : isTransfer ? 'text-sky-400' : 'text-red-400'}`}>
                                {e.qtyOut > 0 ? `-${e.qtyOut} ${e.unit}` : '-'}
                              </td>

                              {/* Balance */}
                              <td className="py-3.5 px-3 text-right font-black text-[#D4AF37] text-xs font-mono">
                                {e.balanceAfter} {e.unit}
                              </td>

                              {/* Delete button if manual */}
                              <td className="py-3.5 px-3 text-center">
                                {e.isManual && onDeleteBinCardEntry && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteBinCardEntry(e.id)}
                                    className="p-1 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                                    title="Delete Entry"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#243244] p-12 rounded-[28px] border border-white/10 text-center text-gray-400 space-y-3">
              <Package size={48} className="mx-auto text-gray-500" />
              <h3 className="text-lg font-bold text-[#F8FAFC]">No Raw Ingredient Selected</h3>
              <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                Please search or click any active raw ingredient on the left menu to view its official Store Bin Card ledger, product consumption list, and branch store balances.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NEW VOUCHER / BIN CARD TRANSACTION ENTRY */}
      {isNewVoucherModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1E293B] border border-white/10 rounded-[28px] max-w-lg w-full p-6 space-y-5 shadow-2xl text-[#F8FAFC]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#D4AF37] font-bold uppercase">
                  Store Transaction Recording
                </span>
                <h3 className="font-serif font-bold text-xl text-[#F8FAFC]">
                  + Record Voucher for {selectedItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewVoucherModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">
                    Date (ቀን)
                  </label>
                  <input
                    type="date"
                    required
                    value={voucherForm.date}
                    onChange={(e) => setVoucherForm({ ...voucherForm, date: e.target.value })}
                    className="w-full h-10 bg-[#243244] border border-white/10 rounded-xl px-3 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">
                    Transaction Type (ዓይነት)
                  </label>
                  <select
                    value={voucherForm.transactionType}
                    onChange={(e) =>
                      setVoucherForm({
                        ...voucherForm,
                        transactionType: e.target.value as BinCardEntry['transactionType'],
                      })
                    }
                    className="w-full h-10 bg-[#243244] border border-white/10 rounded-xl px-3 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    <option value="Stock In">Stock In (+ ዕቃ ገቢ)</option>
                    <option value="Order Sales Consumption">Issue to Kitchen / Barista (- ወጪ)</option>
                    <option value="Store Transfer">Store Transfer (⇄ ዝውውር)</option>
                    <option value="Damage Spoilage">Damage / Spoilage (- ብልሽት)</option>
                    <option value="Initial Stock">Initial Stock Balance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">
                    Voucher / Ref # (የሰነድ ቁጥር)
                  </label>
                  <input
                    type="text"
                    required
                    value={voucherForm.referenceId}
                    onChange={(e) => setVoucherForm({ ...voucherForm, referenceId: e.target.value })}
                    className="w-full h-10 bg-[#243244] border border-white/10 rounded-xl px-3 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">
                    Store Location (ስቶር)
                  </label>
                  <select
                    value={voucherForm.storeName}
                    onChange={(e) => setVoucherForm({ ...voucherForm, storeName: e.target.value })}
                    className="w-full h-10 bg-[#243244] border border-white/10 rounded-xl px-3 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {availableStoreNames
                      .filter((s) => s !== 'All')
                      .map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Quantity in or out */}
              {voucherForm.transactionType === 'Stock In' || voucherForm.transactionType === 'Initial Stock' ? (
                <div>
                  <label className="text-[10px] font-bold text-[#22C55E] uppercase block mb-1">
                    Qty Received In (+ የገባ መጠን) in {selectedItem.unit}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={voucherForm.qtyIn || ''}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, qtyIn: parseFloat(e.target.value) || 0, qtyOut: 0 })
                    }
                    className="w-full h-10 bg-[#243244] border border-emerald-500/50 rounded-xl px-3 text-[#22C55E] font-bold focus:outline-none focus:border-emerald-400"
                    placeholder="e.g. 50"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-red-400 uppercase block mb-1">
                    Qty Issued / Deducted Out (- የወጣ መጠን) in {selectedItem.unit}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={voucherForm.qtyOut || ''}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, qtyOut: parseFloat(e.target.value) || 0, qtyIn: 0 })
                    }
                    className="w-full h-10 bg-[#243244] border border-red-500/50 rounded-xl px-3 text-red-400 font-bold focus:outline-none focus:border-red-400"
                    placeholder="e.g. 15"
                  />
                </div>
              )}

              {/* Link Product for Issue */}
              {voucherForm.transactionType === 'Order Sales Consumption' && (
                <div>
                  <label className="text-[10px] font-bold text-[#D4AF37] uppercase block mb-1">
                    Link Produced Menu Item (የተሠራበት ምርት)
                  </label>
                  <select
                    value={voucherForm.productName}
                    onChange={(e) => {
                      const matched = menuItems.find((m) => m.name === e.target.value);
                      setVoucherForm({
                        ...voucherForm,
                        productName: e.target.value,
                        productImage: matched ? matched.image : '',
                      });
                    }}
                    className="w-full h-10 bg-[#243244] border border-white/10 rounded-xl px-3 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    <option value="">-- Choose Menu Product --</option>
                    {productsUsingIngredient.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">
                  Notes / Supplier / Purpose (ማስታወሻ)
                </label>
                <input
                  type="text"
                  value={voucherForm.notes}
                  onChange={(e) => setVoucherForm({ ...voucherForm, notes: e.target.value })}
                  placeholder="e.g. Received from Abyssinia Coffee / Issued for Morning rush"
                  className="w-full h-10 bg-[#243244] border border-white/10 rounded-xl px-3 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 h-11 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0F172A] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check size={16} /> Record & Save to Ledger
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewVoucherModalOpen(false)}
                  className="flex-1 h-11 bg-[#243244] text-[#CBD5E1] rounded-xl text-xs font-bold border border-white/10 hover:bg-[#2F4158] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRODUCT RECIPE INSPECTION */}
      {inspectingMenuItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1E293B] border border-white/10 rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl text-[#F8FAFC]">
            <div className="flex justify-between items-start border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={inspectingMenuItem.image}
                  alt={inspectingMenuItem.name}
                  className="w-14 h-14 object-cover rounded-xl border border-white/10 shrink-0"
                />
                <div>
                  <span className="text-[10px] font-bold text-[#D4AF37] uppercase">
                    {inspectingMenuItem.category}
                  </span>
                  <h3 className="font-serif font-bold text-lg text-[#F8FAFC]">
                    {inspectingMenuItem.name}
                  </h3>
                  <span className="text-xs text-[#22C55E] font-bold">
                    {inspectingMenuItem.price} ETB
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingMenuItem(null)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-[#D4AF37]">Ingredients in Recipe</h4>
              <div className="bg-[#243244] p-3.5 rounded-2xl border border-white/10 space-y-2 max-h-56 overflow-y-auto">
                {inspectingMenuItem.recipeIngredients && inspectingMenuItem.recipeIngredients.length > 0 ? (
                  inspectingMenuItem.recipeIngredients.map((rIng, idx) => {
                    const isMatch = selectedItem && doesIngredientStringMatch(rIng.ingredientName, selectedItem);
                    return (
                      <div
                        key={idx}
                        className={`flex justify-between items-center text-xs pb-1.5 border-b border-white/5 last:border-0 p-1.5 rounded-lg ${
                          isMatch ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/40' : ''
                        }`}
                      >
                        <div>
                          <span className="font-bold text-[#F8FAFC] block">{rIng.ingredientName}</span>
                          <span className="text-[10px] text-[#94A3B8]">
                            Portion: {rIng.qty} {rIng.unit}
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold ${isMatch ? 'text-[#D4AF37]' : 'text-emerald-400'}`}>
                          {isMatch ? '● Selected Ingredient' : `${rIng.portionCost || 0} ETB`}
                        </span>
                      </div>
                    );
                  })
                ) : inspectingMenuItem.ingredients && inspectingMenuItem.ingredients.length > 0 ? (
                  inspectingMenuItem.ingredients.map((ing, idx) => {
                    const isMatch = selectedItem && doesIngredientStringMatch(ing, selectedItem);
                    return (
                      <div
                        key={idx}
                        className={`flex justify-between items-center text-xs pb-1.5 border-b border-white/5 last:border-0 p-1.5 rounded-lg ${
                          isMatch ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/40' : ''
                        }`}
                      >
                        <span className="font-bold text-[#F8FAFC]">{ing}</span>
                        <span className={`text-[11px] font-bold ${isMatch ? 'text-[#D4AF37]' : 'text-[#94A3B8]'}`}>
                          {isMatch ? '● Matched Raw Material' : 'Component'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400">Specialty blend recipe ingredients.</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInspectingMenuItem(null)}
              className="w-full h-10 bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] rounded-xl text-xs font-bold border border-white/10 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: SOLD PRODUCT PHOTO PREVIEW */}
      {previewPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1E293B] border border-white/10 rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl text-[#F8FAFC]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Sparkles size={18} />
                <h3 className="font-serif font-bold text-base text-[#F8FAFC]">
                  Sold Product Information
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 aspect-video flex items-center justify-center shadow-lg">
                <img
                  src={previewPhotoModal.image}
                  alt={previewPhotoModal.productName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10">
                  <p className="font-bold text-white text-sm">{previewPhotoModal.productName}</p>
                </div>
              </div>

              <div className="bg-[#243244] p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
                {previewPhotoModal.referenceId && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#94A3B8]">Reference Order:</span>
                    <span className="font-mono font-bold text-[#F8FAFC]">{previewPhotoModal.referenceId}</span>
                  </div>
                )}
                {previewPhotoModal.storeName && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#94A3B8]">Deducted Store:</span>
                    <span className="font-bold text-amber-300">{previewPhotoModal.storeName}</span>
                  </div>
                )}
                {previewPhotoModal.qtyOut !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#94A3B8]">Raw Material Deducted:</span>
                    <span className="font-bold text-rose-400">
                      -{previewPhotoModal.qtyOut} {previewPhotoModal.unit || ''}
                    </span>
                  </div>
                )}
                {previewPhotoModal.date && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#94A3B8]">Transaction Date:</span>
                    <span className="text-[#CBD5E1]">{previewPhotoModal.date}</span>
                  </div>
                )}
                {previewPhotoModal.notes && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[#94A3B8] block text-[10px] uppercase font-bold mb-0.5">Details:</span>
                    <span className="text-[#F8FAFC] text-[11px] leading-relaxed">{previewPhotoModal.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPreviewPhotoModal(null)}
              className="w-full h-11 bg-[#D4AF37] hover:bg-[#B3902D] text-[#0F172A] rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* MODAL: SPECIAL INGREDIENT FORMULATION BREAKDOWN */}
      {inspectingSpecialItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1E293B] border border-purple-500/30 rounded-[28px] max-w-lg w-full p-6 space-y-4 shadow-2xl text-[#F8FAFC]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-purple-400">
                <FlaskConical size={20} />
                <h3 className="font-serif font-bold text-base text-[#F8FAFC]">
                  Special Compound Formulation (የስፔሻል ጥሬ ዕቃ ዝርዝር መረጃ)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSpecialItem(null)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-[#243244] p-3 rounded-2xl border border-purple-500/20">
              {inspectingSpecialItem.image ? (
                <img
                  src={inspectingSpecialItem.image}
                  alt={inspectingSpecialItem.name}
                  className="w-16 h-16 object-cover rounded-xl border border-purple-500/30 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-purple-950/70 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <FlaskConical size={28} />
                </div>
              )}
              <div className="min-w-0 space-y-1">
                <h4 className="font-bold text-sm text-[#F8FAFC] truncate">
                  {inspectingSpecialItem.name}
                </h4>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-md font-semibold border border-purple-700/30">
                    Yield: {inspectingSpecialItem.yieldQty || inspectingSpecialItem.yieldQ || 1} {inspectingSpecialItem.yieldUnit || inspectingSpecialItem.yieldU || inspectingSpecialItem.unit || 'Units'}
                  </span>
                  <span className="bg-emerald-950/50 text-emerald-300 px-2 py-0.5 rounded-md font-semibold border border-emerald-800/30">
                    Stock: {inspectingSpecialItem.stockQty} {inspectingSpecialItem.unit}
                  </span>
                  <span className="text-[#94A3B8]">
                    {inspectingSpecialItem.storeName || 'Bole Main Central Store'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">
                  Raw Material Recipe Components (ጥሬ ዕቃዎች ውህድ):
                </span>
                <span className="text-xs font-bold text-[#D4AF37]">
                  Unit Cost:{' '}
                  {(
                    (inspectingSpecialItem.costPerUnit ||
                      (inspectingSpecialItem.totalBatchCost && inspectingSpecialItem.yieldQty
                        ? inspectingSpecialItem.totalBatchCost / inspectingSpecialItem.yieldQty
                        : inspectingSpecialItem.costPrice) ||
                      0)
                  ).toFixed(2)}{' '}
                  ETB / {inspectingSpecialItem.yieldUnit || inspectingSpecialItem.unit}
                </span>
              </div>

              <div className="bg-[#243244] p-3 rounded-2xl border border-white/10 max-h-56 overflow-y-auto space-y-2">
                {inspectingSpecialItem.recipeComponents && inspectingSpecialItem.recipeComponents.length > 0 ? (
                  inspectingSpecialItem.recipeComponents.map((comp: any, idx: number) => {
                    const isCurrentRaw =
                      selectedItem &&
                      (comp.inventoryId === selectedItem.id ||
                        comp.ingredientName?.toLowerCase().trim() === selectedItem.name.toLowerCase().trim() ||
                        doesIngredientStringMatch(comp.ingredientName, selectedItem));

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                          isCurrentRaw
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 shadow-xs'
                            : 'bg-[#1E293B]/70 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {comp.image ? (
                            <img
                              src={comp.image}
                              alt={comp.ingredientName}
                              className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-[#CBD5E1] font-bold text-xs shrink-0">
                              {comp.ingredientName?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-[#F8FAFC] block truncate">
                              {comp.ingredientName}
                            </span>
                            <span className="text-[10px] text-[#94A3B8]">
                              Portion: <strong className="text-emerald-400">{comp.qty} {comp.unit}</strong>
                              {comp.unitCost ? ` @ ${comp.unitCost} ETB/${comp.unit}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-[#F8FAFC] block">
                            {((comp.totalCost || comp.qty * (comp.unitCost || 0)) || 0).toFixed(2)} ETB
                          </span>
                          {isCurrentRaw && (
                            <span className="text-[9px] font-black text-[#D4AF37] bg-[#D4AF37]/20 px-1.5 py-0.2 rounded border border-[#D4AF37]/40 block mt-0.5">
                              ★ Current Ingredient
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 py-3 text-center">
                    No individual recipe component items registered for this special ingredient.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInspectingSpecialItem(null)}
              className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close Formulation View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
