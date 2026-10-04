import React, { useState, useMemo, useRef } from 'react';
import { InventoryItem, MenuItem, ProductRecipeItem, StoreRecord, CategoryRecord } from '../../types';
import {
  Utensils,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  DollarSign,
  TrendingUp,
  Image as ImageIcon,
  Upload,
  X,
  Sparkles,
  Calculator,
  Check,
  Tag,
  BookOpen,
  Pencil,
  Edit,
  Store,
  Building2,
  Warehouse,
  Layers,
  MapPin,
  Filter,
  Star,
  Printer,
  Eye,
  Download,
  Loader2,
  FileText,
  QrCode,
} from 'lucide-react';
import { MenuPrintTemplate } from '../MenuPrintTemplate';
import { MenuPreviewModal } from '../MenuPreviewModal';
import { downloadMenuPDF } from '../../lib/pdfGenerator';
import { printMenuContainer } from '../../lib/printHelper';

interface ProductCostingERPProps {
  inventory: InventoryItem[];
  menuItems: MenuItem[];
  stores?: StoreRecord[];
  categories?: CategoryRecord[];
  onAddCategory?: (category: CategoryRecord) => void | Promise<void>;
  onAddMenuItem: (item: Partial<MenuItem>) => void;
  onUpdateMenuItem?: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
}

const SAMPLE_PRODUCT_PHOTOS = [
  { label: 'Cappuccino', url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Breakfast Spread', url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80' },
  { label: 'Belgian Cake', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80' },
  { label: 'Fresh Juice', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80' },
  { label: 'Macchiato', url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=800&q=80' },
  { label: 'Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80' },
  { label: 'Caffe Latte', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80' },
  { label: 'Gourmet Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
];

export const ProductCostingERP: React.FC<ProductCostingERPProps> = ({
  inventory,
  menuItems,
  stores,
  categories,
  onAddCategory,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
}) => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Professional Menu Print & A4 Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfToast, setPdfToast] = useState('');
  const printCanvasRef = useRef<HTMLDivElement>(null);

  const handlePrintMenu = () => {
    printMenuContainer({
      containerId: 'cafelina-product-costing-print-target',
      documentTitle: 'Cafe Lina Menu',
      onSuccess: () => {
        setPdfToast('Print dialog initiated successfully!');
        setTimeout(() => setPdfToast(''), 2000);
      },
      onError: (err) => {
        console.warn('Print helper error, opening A4 preview:', err);
        setIsPreviewOpen(true);
      },
    });
  };

  const handleDownloadPDF = async () => {
    try {
      setIsExportingPDF(true);
      setPdfToast('Generating high-resolution printable A4 PDF...');

      await downloadMenuPDF('cafelina-product-costing-print-target', {
        restaurantName: 'Cafe Lina Luxury Coffee & Restaurant',
        phone: '+251 900 123 456',
        address: 'Bole Road, Addis Ababa, Ethiopia',
        website: 'www.cafelina.com',
        menuItems: menuItems,
        onProgress: (_p, msg) => {
          setPdfToast(msg);
        },
      });

      setPdfToast('A4 Menu PDF downloaded successfully!');
      setTimeout(() => {
        setIsExportingPDF(false);
        setPdfToast('');
      }, 2500);
    } catch (err) {
      console.error('PDF export error:', err);
      setPdfToast('Failed to export PDF.');
      setTimeout(() => {
        setIsExportingPDF(false);
        setPdfToast('');
      }, 3000);
    }
  };

  // Quick Add Category Modal state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [categoryTargetField, setCategoryTargetField] = useState<'register' | 'edit'>('register');
  const [customCreatedCategories, setCustomCreatedCategories] = useState<string[]>([]);
  const [categorySuccessToast, setCategorySuccessToast] = useState<string>('');

  // Extract all available stores dynamically from stores prop and inventory items
  const availableStores = useMemo(() => {
    const storeSet = new Set<string>();
    if (stores && stores.length > 0) {
      stores.forEach((s) => {
        if (s.name && s.name.trim()) storeSet.add(s.name.trim());
      });
    }
    inventory.forEach((item) => {
      if (item.storeName && item.storeName.trim()) {
        storeSet.add(item.storeName.trim());
      }
    });
    if (storeSet.size === 0) {
      storeSet.add('Bole Main Central Store');
      storeSet.add('Kazanchis Bakery Lab & Cold Room');
      storeSet.add('Airport VIP Lounge Store');
      storeSet.add('CMC Sub-Store');
    }
    return Array.from(storeSet);
  }, [stores, inventory]);

  // Selected Store filter for Raw Ingredient Selection (New Product)
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('ALL');

  // Editing Product state
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<string>('Coffee');
  const [editPrice, setEditPrice] = useState<number>(100);
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState<string>(SAMPLE_PRODUCT_PHOTOS[0].url);
  const [editBarcode, setEditBarcode] = useState('');
  const [editIsAvailable, setEditIsAvailable] = useState<boolean>(true);
  const [editIsSpecial, setEditIsSpecial] = useState<boolean>(false);
  const [editIngredients, setEditIngredients] = useState<ProductRecipeItem[]>([]);
  const [editIngredientSearch, setEditIngredientSearch] = useState('');
  const [editSelectedStoreFilter, setEditSelectedStoreFilter] = useState<string>('ALL');
  const [editTargetMarginPercent, setEditTargetMarginPercent] = useState<number>(60);

  // New Product Form State
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState<string>('Coffee');
  const [productDescription, setProductDescription] = useState('');
  const [previewImage, setPreviewImage] = useState<string>(SAMPLE_PRODUCT_PHOTOS[0].url);
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(60); // % margin
  const [isSpecialProduct, setIsSpecialProduct] = useState<boolean>(false);

  // Dynamic Unified Categories List (merging standard, prop categories, menu items, and user created)
  const allCategoryOptions = useMemo(() => {
    const defaultList: { value: string; label: string }[] = [
      { value: 'Coffee', label: 'Coffee & Espresso' },
      { value: 'Latte', label: 'Latte Drinks' },
      { value: 'Cappuccino', label: 'Cappuccino' },
      { value: 'Macchiato', label: 'Macchiato' },
      { value: 'Tea', label: 'Teas & Infusions' },
      { value: 'Bakery', label: 'Bakery & Pastry' },
      { value: 'Cake', label: 'Cakes & Desserts' },
      { value: 'Breakfast', label: 'Breakfast & Meals' },
      { value: 'Fresh Juice', label: 'Fresh Juices' },
      { value: 'Burger', label: 'Burgers & Sandwiches' },
      { value: 'Pizza', label: 'Wood-fired Pizzas' },
      { value: 'Main Course', label: 'Main Courses & Steaks' },
      { value: 'Pasta', label: 'Handmade Pastas' },
      { value: 'Salad', label: 'Fresh Salads' },
      { value: 'Dessert', label: 'Desserts & Sweets' },
      { value: 'Drinks', label: 'Drinks & Mocktails' },
    ];

    const seen = new Set<string>();
    defaultList.forEach((c) => {
      seen.add(c.value.toLowerCase().trim());
      seen.add(c.label.toLowerCase().trim());
    });

    const merged = [...defaultList];

    // Merge categories from categories prop
    if (categories && categories.length > 0) {
      categories.forEach((cat) => {
        const key = cat.name.toLowerCase().trim();
        if (cat.name && !seen.has(key)) {
          seen.add(key);
          merged.push({ value: cat.name, label: cat.name });
        }
      });
    }

    // Merge categories from existing menuItems
    menuItems.forEach((item) => {
      if (item.category) {
        const key = item.category.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({ value: item.category, label: item.category });
        }
      }
    });

    // Merge custom created categories from current session
    customCreatedCategories.forEach((catName) => {
      const key = catName.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({ value: catName, label: catName });
      }
    });

    return merged;
  }, [categories, menuItems, customCreatedCategories]);

  // Handler to create a brand new category on the fly
  const handleCreateNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    const newRecord: CategoryRecord = {
      id: `CAT-${Date.now()}`,
      name: trimmed,
      type: 'Product',
      description: newCatDescription.trim() || 'Menu product category registered from Recipe Costing',
      itemCount: 0,
    };

    if (onAddCategory) {
      await onAddCategory(newRecord);
    }

    setCustomCreatedCategories((prev) => [...prev, trimmed]);

    if (categoryTargetField === 'register') {
      setProductCategory(trimmed);
    } else {
      setEditCategory(trimmed);
    }

    setCategorySuccessToast(`Category "${trimmed}" successfully created & selected! (አዲስ ካቴጎሪ ተፈጥሮ ተመርጧል)`);
    setTimeout(() => setCategorySuccessToast(''), 3500);

    setNewCatName('');
    setNewCatDescription('');
    setIsAddCategoryOpen(false);
  };

  // Recipe ingredients selected for this product
  const [selectedIngredients, setSelectedIngredients] = useState<ProductRecipeItem[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [searchPortionQtys, setSearchPortionQtys] = useState<Record<string, string>>({});
  const [editSearchPortionQtys, setEditSearchPortionQtys] = useState<Record<string, string>>({});

  // Helper to determine reasonable default quantities based on unit
  const getDefaultQty = (unit: string) => {
    const u = (unit || '').toLowerCase().trim();
    if (u === 'kg' || u === 'kilo' || u === 'kilogram') return 0.02;
    if (u === 'g' || u === 'gram' || u === 'grams') return 20;
    if (u === 'liters' || u === 'liter' || u === 'l') return 0.15;
    if (u === 'ml' || u === 'milliliter') return 150;
    return 1;
  };

  const getDefaultQtyString = (unit: string) => {
    return String(getDefaultQty(unit));
  };

  // Handle Photo File Upload for New Product
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Photo File Upload for Edit Product
  const handleEditPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenEditProduct = (item: MenuItem) => {
    setEditingProduct(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrice(item.price);
    setEditDescription(item.description || '');
    setEditImage(item.image || SAMPLE_PRODUCT_PHOTOS[0].url);
    setEditBarcode(item.barcode || '');
    setEditIsAvailable(item.isAvailable ?? true);
    setEditIsSpecial(Boolean(item.isSpecial || item.isFeatured));
    setEditIngredientSearch('');

    // Load and populate ingredients for this product
    if (item.recipeIngredients && item.recipeIngredients.length > 0) {
      // Use existing detailed recipe items and refresh unit costs from live inventory
      const refreshedList = item.recipeIngredients.map((rcItem) => {
        const liveInv = inventory.find((inv) => inv.id === rcItem.inventoryId);
        const liveCost = liveInv?.costPerUnit ?? rcItem.unitCost;
        return {
          ...rcItem,
          unitCost: liveCost,
          portionCost: rcItem.qty * liveCost,
        };
      });
      setEditIngredients(refreshedList);
    } else if (item.ingredients && item.ingredients.length > 0) {
      // Map string ingredient names to inventory
      const matchedList: ProductRecipeItem[] = [];
      item.ingredients.forEach((ingName, idx) => {
        const foundInv = inventory.find(
          (inv) =>
            inv.name.toLowerCase().includes(ingName.toLowerCase()) ||
            ingName.toLowerCase().includes(inv.name.toLowerCase())
        );
        if (foundInv) {
          const defQty = foundInv.unit === 'kg' ? 0.02 : foundInv.unit === 'liters' ? 0.15 : 1;
          matchedList.push({
            inventoryId: foundInv.id,
            ingredientName: foundInv.name,
            sku: foundInv.sku,
            qty: defQty,
            unit: foundInv.unit,
            unitCost: foundInv.costPerUnit,
            portionCost: defQty * foundInv.costPerUnit,
            isMainIngredient: idx === 0,
          });
        } else {
          matchedList.push({
            inventoryId: `ing-${idx}-${Date.now()}`,
            ingredientName: ingName,
            sku: 'RAW-MATERIAL',
            qty: 1,
            unit: 'portion',
            unitCost: 10,
            portionCost: 10,
            isMainIngredient: idx === 0,
          });
        }
      });
      setEditIngredients(matchedList);
    } else {
      setEditIngredients([]);
    }
  };

  // Helper to provide quick portion quantity presets based on measurement unit
  const getQuickPresets = (unit: string) => {
    const u = (unit || '').toLowerCase().trim();
    if (u === 'kg' || u === 'kilo' || u === 'kilogram') {
      return [
        { label: '18g', val: '0.018' },
        { label: '20g', val: '0.02' },
        { label: '50g', val: '0.05' },
        { label: '100g', val: '0.1' },
        { label: '250g', val: '0.25' },
        { label: '500g', val: '0.5' },
      ];
    }
    if (u === 'liters' || u === 'liter' || u === 'l') {
      return [
        { label: '30ml', val: '0.03' },
        { label: '50ml', val: '0.05' },
        { label: '100ml', val: '0.1' },
        { label: '150ml', val: '0.15' },
        { label: '200ml', val: '0.2' },
        { label: '250ml', val: '0.25' },
        { label: '1L', val: '1' },
      ];
    }
    if (u === 'g' || u === 'gram' || u === 'grams') {
      return [
        { label: '10g', val: '10' },
        { label: '20g', val: '20' },
        { label: '50g', val: '50' },
        { label: '100g', val: '100' },
        { label: '200g', val: '200' },
      ];
    }
    if (u === 'ml') {
      return [
        { label: '30ml', val: '30' },
        { label: '50ml', val: '50' },
        { label: '150ml', val: '150' },
        { label: '250ml', val: '250' },
      ];
    }
    return [
      { label: '1 pc', val: '1' },
      { label: '2 pcs', val: '2' },
      { label: '3 pcs', val: '3' },
      { label: '5 pcs', val: '5' },
    ];
  };

  // Add ingredient in Edit Mode with exact custom filled portion quantity
  const handleAddIngredientToEditRecipe = (invItem: InventoryItem, customQty?: number | string) => {
    if (editIngredients.some((i) => i.inventoryId === invItem.id)) return;

    let finalQty = getDefaultQty(invItem.unit);
    if (customQty !== undefined && customQty !== null && customQty !== '') {
      const parsed = typeof customQty === 'number' ? customQty : parseFloat(String(customQty));
      if (!isNaN(parsed) && parsed > 0) {
        finalQty = parsed;
      }
    }
    const itemCost = invItem.costPerUnit;

    const newItem: ProductRecipeItem = {
      inventoryId: invItem.id,
      ingredientName: invItem.name,
      sku: invItem.sku,
      qty: finalQty,
      unit: invItem.unit,
      unitCost: itemCost,
      portionCost: finalQty * itemCost,
      isMainIngredient: editIngredients.length === 0,
      storeName: invItem.storeName || (editSelectedStoreFilter !== 'ALL' ? editSelectedStoreFilter : 'Bole Main Central Store'),
    };

    setEditIngredients((prev) => [...prev, newItem]);
  };

  // Update portion quantity in Edit Mode
  const handleUpdateEditPortionQty = (invId: string, newQty: number) => {
    setEditIngredients((prev) =>
      prev.map((item) => {
        if (item.inventoryId === invId) {
          const liveUnitCost = inventory.find((i) => i.id === invId)?.costPerUnit || item.unitCost;
          return {
            ...item,
            qty: newQty,
            unitCost: liveUnitCost,
            portionCost: newQty * liveUnitCost,
          };
        }
        return item;
      })
    );
  };

  // Toggle Wana Gbat in Edit Mode (Multi-select allowed)
  const handleToggleEditMainIngredient = (invId: string) => {
    setEditIngredients((prev) =>
      prev.map((item) =>
        item.inventoryId === invId
          ? { ...item, isMainIngredient: !item.isMainIngredient }
          : item
      )
    );
  };

  // Remove ingredient in Edit Mode
  const handleRemoveEditIngredient = (invId: string) => {
    setEditIngredients((prev) => prev.filter((i) => i.inventoryId !== invId));
  };

  // Total raw ingredient cost in Edit Mode
  const editTotalIngredientCost = editIngredients.reduce((sum, item) => {
    const liveUnitCost = inventory.find((i) => i.id === item.inventoryId)?.costPerUnit || item.unitCost;
    return sum + item.qty * liveUnitCost;
  }, 0);

  // Recommended price in Edit Mode
  const editRecommendedPrice = Math.ceil(
    editTotalIngredientCost * (1 + (editTargetMarginPercent || 0) / 100)
  );

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editName.trim()) return;

    const updated: MenuItem = {
      ...editingProduct,
      name: editName.trim(),
      category: editCategory as any,
      price: Number(editPrice),
      description: editDescription,
      image: editImage,
      barcode: editBarcode || editingProduct.barcode,
      ingredients: editIngredients.map((i) => i.ingredientName),
      recipeIngredients: editIngredients,
      isAvailable: editIsAvailable,
      isSpecial: editIsSpecial,
      isFeatured: editIsSpecial,
    };

    if (onUpdateMenuItem) {
      onUpdateMenuItem(updated);
    }
    setEditingProduct(null);
  };

  // Add ingredient from inventory list into product recipe with exact custom filled portion quantity
  const handleAddIngredientToRecipe = (invItem: InventoryItem, customQty?: number | string) => {
    if (selectedIngredients.some((i) => i.inventoryId === invItem.id)) return;

    let finalQty = getDefaultQty(invItem.unit);
    if (customQty !== undefined && customQty !== null && customQty !== '') {
      const parsed = typeof customQty === 'number' ? customQty : parseFloat(String(customQty));
      if (!isNaN(parsed) && parsed > 0) {
        finalQty = parsed;
      }
    }
    const itemCost = invItem.costPerUnit;

    const newItem: ProductRecipeItem = {
      inventoryId: invItem.id,
      ingredientName: invItem.name,
      sku: invItem.sku,
      qty: finalQty,
      unit: invItem.unit,
      unitCost: itemCost,
      portionCost: finalQty * itemCost,
      isMainIngredient: selectedIngredients.length === 0, // First added defaults to main
      storeName: invItem.storeName || (selectedStoreFilter !== 'ALL' ? selectedStoreFilter : 'Bole Main Central Store'),
    };

    setSelectedIngredients((prev) => [...prev, newItem]);
  };

  // Update quantity of an ingredient portion in recipe
  const handleUpdatePortionQty = (invId: string, newQty: number) => {
    setSelectedIngredients((prev) =>
      prev.map((item) => {
        if (item.inventoryId === invId) {
          const liveUnitCost = inventory.find((i) => i.id === invId)?.costPerUnit || item.unitCost;
          return {
            ...item,
            qty: newQty,
            unitCost: liveUnitCost,
            portionCost: newQty * liveUnitCost,
          };
        }
        return item;
      })
    );
  };

  // Toggle "Main Ingredient" (Wana Gbat) - allows multiple ingredients to be selected as main ingredients
  const handleToggleMainIngredient = (invId: string) => {
    setSelectedIngredients((prev) =>
      prev.map((item) =>
        item.inventoryId === invId
          ? { ...item, isMainIngredient: !item.isMainIngredient }
          : item
      )
    );
  };

  // Remove ingredient portion from recipe
  const handleRemoveIngredientFromRecipe = (invId: string) => {
    setSelectedIngredients((prev) => prev.filter((i) => i.inventoryId !== invId));
  };

  // Live Auto-calculated total raw ingredient cost
  const totalIngredientCost = selectedIngredients.reduce((sum, item) => {
    const liveUnitCost = inventory.find((i) => i.id === item.inventoryId)?.costPerUnit || item.unitCost;
    return sum + item.qty * liveUnitCost;
  }, 0);

  // Auto-calculated recommended selling price based on profit margin %
  const recommendedSellingPrice = Math.ceil(
    totalIngredientCost * (1 + (targetMarginPercent || 0) / 100)
  );

  // Submit product registration
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    onAddMenuItem({
      name: productName,
      category: productCategory as any,
      price: recommendedSellingPrice > 0 ? recommendedSellingPrice : 150,
      currency: 'ETB',
      description: productDescription || `Crafted with ${selectedIngredients.map((i) => i.ingredientName).join(', ')}`,
      image: previewImage,
      ingredients: selectedIngredients.map((i) => i.ingredientName),
      recipeIngredients: selectedIngredients,
      barcode: `CL-REC-${Math.floor(100 + Math.random() * 900)}`,
      calories: 220,
      prepTimeMinutes: 5,
      isAvailable: true,
      isSpecial: isSpecialProduct,
      isFeatured: isSpecialProduct,
    });

    // Reset & close modal
    setIsRegisterModalOpen(false);
    setProductName('');
    setProductDescription('');
    setSelectedIngredients([]);
    setSelectedStoreFilter('ALL');
    setIngredientSearch('');
    setTargetMarginPercent(60);
    setIsSpecialProduct(false);
    setPreviewImage(SAMPLE_PRODUCT_PHOTOS[0].url);
  };

  // Search filtered inventory for new product dropdown (Strictly filtered by selected store if specified)
  const filteredInventoryToAdd = inventory.filter((item) => {
    // 1. Exclude already selected
    if (selectedIngredients.some((s) => s.inventoryId === item.id)) return false;

    // 2. Filter by store if not 'ALL'
    if (selectedStoreFilter && selectedStoreFilter !== 'ALL') {
      const itemStore = (item.storeName || '').toLowerCase().trim();
      const targetStore = selectedStoreFilter.toLowerCase().trim();
      if (itemStore !== targetStore) return false;
    }

    // 3. Filter by search query if typed
    const searchLower = ingredientSearch.toLowerCase().trim();
    if (!searchLower) return true;

    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.sku.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      (item.brand && item.brand.toLowerCase().includes(searchLower))
    );
  });

  // Search filtered inventory for edit product dropdown (Strictly filtered by selected store if specified)
  const filteredInventoryToAddToEdit = inventory.filter((item) => {
    // 1. Exclude already added to edit
    if (editIngredients.some((s) => s.inventoryId === item.id)) return false;

    // 2. Filter by store if not 'ALL'
    if (editSelectedStoreFilter && editSelectedStoreFilter !== 'ALL') {
      const itemStore = (item.storeName || '').toLowerCase().trim();
      const targetStore = editSelectedStoreFilter.toLowerCase().trim();
      if (itemStore !== targetStore) return false;
    }

    // 3. Filter by search query if typed
    const searchLower = editIngredientSearch.toLowerCase().trim();
    if (!searchLower) return true;

    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.sku.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      (item.brand && item.brand.toLowerCase().includes(searchLower))
    );
  });

  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10 no-print">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
            Product Recipe & Cost Calculator
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1 flex items-center gap-2">
            <BookOpen className="text-[#D4AF37]" size={28} />
            Product Registration & Dynamic Cost Engine
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Register products, select raw ingredients from inventory, flag Main Ingredient (Wana Gbat), enter profit margin %, and auto-calculate selling price.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Professional Menu Print Button */}
          <button
            onClick={handlePrintMenu}
            className="px-4 py-2.5 bg-[#6B1D1D] hover:bg-[#852323] text-white border border-[#D4AF37]/60 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-[#D4AF37]/20 active:scale-95 cursor-pointer min-h-[44px]"
            title="Print Professional Restaurant Menu (A4 Printable Menu)"
          >
            <Printer size={16} className="text-[#D4AF37]" />
            <span>Print Menu</span>
          </button>

          {/* Preview Menu Button */}
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2.5 bg-[#1E293B] hover:bg-[#2A374A] text-[#FDF5E6] border border-[#D4AF37]/40 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer min-h-[44px]"
            title="Open interactive A4 preview with zoom & print"
          >
            <Eye size={16} className="text-[#D4AF37]" />
            <span>Preview Menu</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className="px-4 py-2.5 bg-[#1E293B] hover:bg-[#2A374A] text-[#FDF5E6] border border-white/10 hover:border-[#D4AF37]/40 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer min-h-[44px]"
            title="Download Professional A4 Menu PDF"
          >
            {isExportingPDF ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#D4AF37]" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={16} className="text-[#D4AF37]" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* Register Product Button */}
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-5 py-3 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg hover:shadow-[#D4AF37]/20 active:scale-95 min-h-[44px]"
          >
            <Plus size={18} />
            <span>Register Product (Product Mmezegbbet)</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="bg-[#243244] p-5 rounded-[20px] border border-white/10 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[#94A3B8] text-xs font-semibold block uppercase tracking-wider">Registered Products</span>
            <span className="text-2xl font-extrabold text-[#F8FAFC]">{menuItems.length} Items</span>
          </div>
          <Utensils className="text-[#D4AF37]" size={28} />
        </div>

        <div className="bg-[#243244] p-5 rounded-[20px] border border-white/10 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[#94A3B8] text-xs font-semibold block uppercase tracking-wider">Available Raw Ingredients</span>
            <span className="text-2xl font-extrabold text-[#22C55E]">{inventory.length} SKUs</span>
          </div>
          <Calculator className="text-[#22C55E]" size={28} />
        </div>

        <div className="bg-[#243244] p-5 rounded-[20px] border border-white/10 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[#94A3B8] text-xs font-semibold block uppercase tracking-wider">Dynamic Cost Syncing</span>
            <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
              Active Auto Update
            </span>
          </div>
          <TrendingUp className="text-[#D4AF37]" size={28} />
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-[#243244] p-4 rounded-[20px] border border-white/10 shadow-md no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search registered product name or category..."
              className="w-full h-[48px] bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-11 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
            />
            <Search size={18} className="absolute left-3.5 top-3.5 text-[#94A3B8]" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrintMenu}
              className="h-[48px] px-4 bg-[#6B1D1D] hover:bg-[#852323] text-white border border-[#D4AF37]/50 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Print Professional Restaurant Menu"
            >
              <Printer size={16} className="text-[#D4AF37]" />
              <span>Print Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 no-print">
        {filteredMenuItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#243244] rounded-[22px] border border-white/10 overflow-hidden shadow-lg flex flex-col justify-between hover:border-[#D4AF37]/40 transition-all group"
          >
            <div>
              <div className="relative h-44 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-transparent to-transparent" />
                
                {/* Special Tag */}
                {(item.isSpecial || item.isFeatured) && (
                  <span className="absolute top-3 left-3 bg-[#6B1D1D] text-[#FDF5E6] border border-[#D4AF37]/50 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Star size={10} className="fill-[#D4AF37] text-[#D4AF37]" />
                    <span>Our Special</span>
                  </span>
                )}

                <span className="absolute top-3 right-3 bg-[#D4AF37] text-[#0F172A] font-extrabold text-xs px-3 py-1 rounded-full shadow-md">
                  {item.price} ETB
                </span>
                <span className="absolute bottom-3 left-3 bg-[#1E293B]/90 backdrop-blur-xs text-[#CBD5E1] border border-white/10 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                  {item.category}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="font-serif font-bold text-lg text-[#F8FAFC]">{item.name}</h3>
                <p className="text-xs text-[#94A3B8] line-clamp-2">{item.description}</p>

                {item.ingredients && item.ingredients.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                      Ingredients Recipe:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.ingredients.map((ing, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-[#1E293B] text-[#CBD5E1] px-2 py-0.5 rounded border border-white/5"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#1E293B] border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-[#94A3B8] font-mono text-[11px]">{item.barcode || 'CL-PRODUCT'}</span>
              <div className="flex items-center gap-1.5">
                {/* Quick Toggle Special */}
                {onUpdateMenuItem && (
                  <button
                    onClick={() => {
                      const isNow = !(item.isSpecial || item.isFeatured);
                      onUpdateMenuItem({
                        ...item,
                        isSpecial: isNow,
                        isFeatured: isNow,
                      });
                    }}
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all ${
                      item.isSpecial || item.isFeatured
                        ? 'bg-[#6B1D1D] text-[#FDF5E6] border-[#D4AF37]/50 hover:bg-[#8B2626]'
                        : 'bg-[#243244] text-gray-400 border-white/10 hover:text-[#D4AF37]'
                    }`}
                    title={item.isSpecial || item.isFeatured ? 'Remove from Specials' : 'Add to Specials (Our Specials ላይ አድርግ)'}
                  >
                    <Star size={12} className={item.isSpecial || item.isFeatured ? 'fill-[#D4AF37] text-[#D4AF37]' : ''} />
                    <span>{item.isSpecial || item.isFeatured ? 'Special' : '+ Special'}</span>
                  </button>
                )}
                <button
                  onClick={() => handleOpenEditProduct(item)}
                  className="px-2.5 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg transition-all flex items-center gap-1 font-bold text-[11px]"
                  title="Edit Product (Edit Mareg)"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => onDeleteMenuItem(item.id)}
                  className="p-1.5 text-gray-400 hover:text-[#EF4444] rounded-lg transition-colors"
                  title="Delete product"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Register Product (Product Mmezegbbet) - Fullscreen */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn font-sans text-[#F8FAFC]">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-[#D4AF37]">
                <Utensils size={24} />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-serif font-bold text-[#F8FAFC]">
                  Product Registration & Recipe Costing (Product Mmezegbbet)
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Select raw ingredients, set quantities in liter/gram/kilo, flag Wana Gbat & auto-calculate selling price!
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 bg-[#243244] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <X size={18} />
              <span>Close</span>
            </button>
          </div>

          <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto space-y-6">
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                    Product Name (Product Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Special Yirgacheffe Latte, Belgian Cake"
                    className="w-full h-[48px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#CBD5E1]">
                      Product Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryTargetField('register');
                        setIsAddCategoryOpen(true);
                      }}
                      className="px-2.5 py-1 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] hover:text-[#F6C453] border border-[#D4AF37]/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
                      title="Create a new product category on the fly"
                    >
                      <Plus size={13} />
                      <span>Add New Category</span>
                    </button>
                  </div>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="w-full h-[48px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {allCategoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Image Selection & Upload */}
              <div className="bg-[#243244] p-4 rounded-xl border border-white/10 space-y-3">
                <label className="block text-xs font-bold text-[#CBD5E1] flex items-center gap-2">
                  <ImageIcon size={16} className="text-[#D4AF37]" />
                  Product Photo Upload (Photo Upload Maregbet)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-xl border-2 border-[#D4AF37] shrink-0"
                  />

                  <div className="space-y-2 flex-1 w-full">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E293B] hover:bg-[#2F4158] text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs font-bold cursor-pointer transition-all">
                      <Upload size={16} /> Upload Custom Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileChange}
                        className="hidden"
                      />
                    </label>

                    <p className="text-[11px] text-[#94A3B8]">Or select from preset photos:</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {SAMPLE_PRODUCT_PHOTOS.map((preset, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setPreviewImage(preset.url)}
                          className={`p-1 rounded-lg border text-[10px] font-semibold whitespace-nowrap flex items-center gap-1 shrink-0 ${
                            previewImage === preset.url
                              ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]'
                              : 'border-white/10 bg-[#1E293B] text-gray-300'
                          }`}
                        >
                          <img src={preset.url} alt="" className="w-5 h-5 object-cover rounded" />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Our Specials Checkbox / Feature in Specials (በዋናው ሜኑ 'Our Specials' ላይ እንዲታይ) */}
              <div className="bg-[#1E293B] p-4 rounded-xl border border-[#D4AF37]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    isSpecialProduct
                      ? 'bg-[#6B1D1D] text-[#D4AF37] border-[#D4AF37]/50 shadow-md'
                      : 'bg-[#243244] text-gray-400 border-white/10'
                  }`}>
                    <Star size={22} className={isSpecialProduct ? 'fill-[#D4AF37]' : ''} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-[#F8FAFC] flex items-center gap-1.5">
                      <span>Feature in "Our Specials" (በዋናው ሜኑ 'Our Specials' ላይ እንዲታይ)</span>
                      {isSpecialProduct && (
                        <span className="text-[10px] bg-[#D4AF37] text-[#0F172A] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Active Special
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      ይህን መርጠው ቲክ (Tik) ሲያደርጉት ምርቱ በዋናው ድረ-ገጽ እና በሜኑ "Our Specials" ገጽ ላይ በቀጥታ ጎልቶ ይታያል።
                    </p>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none bg-[#243244] hover:bg-[#2F4158] px-4 py-2.5 rounded-xl border border-white/10 hover:border-[#D4AF37]/50 transition-all shrink-0">
                  <input
                    type="checkbox"
                    checked={isSpecialProduct}
                    onChange={(e) => setIsSpecialProduct(e.target.checked)}
                    className="w-5 h-5 accent-[#D4AF37] rounded cursor-pointer"
                  />
                  <span className={`text-xs font-bold ${isSpecialProduct ? 'text-[#D4AF37]' : 'text-gray-300'}`}>
                    {isSpecialProduct ? '✓ Tik የተደረገ (Special)' : 'Tik አድርግ (Add Special)'}
                  </span>
                </label>
              </div>

              {/* RAW INGREDIENTS RECIPE PICKER SECTION */}
              <div className="bg-[#243244] p-4 rounded-xl border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={16} className="text-[#D4AF37]" />
                      Select Raw Ingredients for Recipe (Gbat Search Arge Memret)
                    </h3>
                    <p className="text-[11px] text-[#94A3B8]">
                      Filter by store, search ingredients, add portions (liters, grams, kg), and tick Main Ingredient (Wana Gbat).
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-lg border border-[#D4AF37]/30 shrink-0">
                    {selectedIngredients.length} Ingredients Added
                  </span>
                </div>

                {/* STORE SELECTION FILTER BAR (የስቶር መምረጫ) */}
                <div className="bg-[#1E293B] p-3 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-[#D4AF37] flex items-center gap-1.5 uppercase tracking-wide">
                      <Store size={14} className="text-[#D4AF37]" />
                      <span>Select Ingredient Store (ግብዓቱን የሚወስዱበት ስቶር):</span>
                    </label>
                    <span className="text-[10px] text-[#94A3B8]">
                      {selectedStoreFilter === 'ALL'
                        ? 'All Stores Active'
                        : `Showing from: ${selectedStoreFilter}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedStoreFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        selectedStoreFilter === 'ALL'
                          ? 'bg-[#D4AF37] text-[#0F172A] shadow-md'
                          : 'bg-[#243244] text-[#CBD5E1] hover:bg-[#2F4158] border border-white/10'
                      }`}
                    >
                      <Layers size={13} />
                      <span>All Stores (ሁሉም ስቶሮች)</span>
                      <span className="text-[10px] opacity-75 font-mono">({inventory.length})</span>
                    </button>

                    {availableStores.map((st) => {
                      const countInStore = inventory.filter(
                        (i) => (i.storeName || '').toLowerCase().trim() === st.toLowerCase().trim()
                      ).length;
                      const isSelected = selectedStoreFilter === st;

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSelectedStoreFilter(st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#D4AF37] text-[#0F172A] shadow-md ring-2 ring-[#D4AF37]/50'
                              : 'bg-[#243244] text-[#CBD5E1] hover:bg-[#2F4158] border border-white/10'
                          }`}
                        >
                          <Building2 size={13} />
                          <span>{st}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              isSelected
                                ? 'bg-[#0F172A]/20 text-[#0F172A] font-extrabold'
                                : 'bg-[#1E293B] text-[#94A3B8]'
                            }`}
                          >
                            {countInStore}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search Box to Pick Ingredients from Selected Store */}
                <div className="relative">
                  <input
                    type="text"
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                    placeholder={
                      selectedStoreFilter === 'ALL'
                        ? 'Search all inventory ingredients (e.g. Yirgacheffe Coffee, Fresh Milk, Butter)...'
                        : `Search ingredients in "${selectedStoreFilter}" (or leave blank to see all ${selectedStoreFilter} items)...`
                    }
                    className="w-full h-[46px] bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                  <Search size={16} className="absolute left-3.5 top-3.5 text-[#94A3B8]" />
                </div>

                {/* Filtered Search Dropdown List with Direct Portion Quantity Input */}
                {(ingredientSearch.trim() || selectedStoreFilter !== 'ALL') && (
                  <div className="bg-[#1E293B] border border-white/15 rounded-2xl max-h-80 overflow-y-auto p-2.5 space-y-2 shadow-2xl">
                    <div className="text-[11px] font-bold text-[#D4AF37] px-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Filter size={12} />
                        {selectedStoreFilter !== 'ALL'
                          ? `Ingredients available in "${selectedStoreFilter}" (${filteredInventoryToAdd.length} items)`
                          : `Search Results (${filteredInventoryToAdd.length} items)`}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] font-normal">
                        Type exact portion & click "+ Add Portion"
                      </span>
                    </div>

                    {filteredInventoryToAdd.length === 0 ? (
                      <div className="text-center py-6 text-xs text-[#94A3B8] space-y-1">
                        <p>No matching ingredients found in this store.</p>
                        {selectedStoreFilter !== 'ALL' && (
                          <button
                            type="button"
                            onClick={() => setSelectedStoreFilter('ALL')}
                            className="text-[#D4AF37] hover:underline text-[11px] font-bold"
                          >
                            Switch to "All Stores" to find in other warehouses
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredInventoryToAdd.map((inv) => {
                        const currentFilledQty = searchPortionQtys[inv.id] ?? getDefaultQtyString(inv.unit);
                        const parsedVal = parseFloat(currentFilledQty) || 0;
                        const livePortionCost = parsedVal * inv.costPerUnit;
                        const presets = getQuickPresets(inv.unit);
                        const invStore = inv.storeName || 'Bole Main Central Store';

                        return (
                          <div
                            key={inv.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#243244] hover:bg-[#2A3B4F] p-3 rounded-xl border border-white/10 transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-extrabold text-[#F8FAFC] text-xs sm:text-sm">{inv.name}</span>
                                <span className="text-[10px] text-[#D4AF37] bg-[#1E293B] px-2 py-0.5 rounded-md font-bold border border-[#D4AF37]/30">
                                  {inv.costPerUnit} ETB / {inv.unit}
                                </span>
                                <span className="text-[10px] text-[#94A3B8] font-mono">({inv.sku})</span>
                                
                                {/* Store Origin Badge */}
                                <span className="text-[10px] text-[#38BDF8] bg-[#0284C7]/15 px-2 py-0.5 rounded-md font-bold border border-[#38BDF8]/30 flex items-center gap-1">
                                  <Store size={10} />
                                  <span>{invStore}</span>
                                </span>
                                <span className="text-[10px] text-[#4ADE80] font-semibold">
                                  Stock: {inv.currentStock} {inv.unit}
                                </span>
                              </div>

                              {/* Quick Clickable Portion Presets */}
                              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                <span className="text-[10px] text-[#94A3B8] font-semibold">Quick:</span>
                                {presets.map((p, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => {
                                      setSearchPortionQtys((prev) => ({ ...prev, [inv.id]: p.val }));
                                    }}
                                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                      currentFilledQty === p.val
                                        ? 'bg-[#D4AF37] text-[#0F172A] border-[#D4AF37] font-black'
                                        : 'bg-[#1E293B] text-[#CBD5E1] border-white/10 hover:border-[#D4AF37]'
                                    }`}
                                  >
                                    {p.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Portion Quantity Input & Add Button */}
                            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                              <div className="flex items-center gap-1.5 bg-[#1E293B] px-2.5 py-1.5 rounded-xl border border-white/15">
                                <div className="text-right">
                                  <span className="text-[9px] text-[#CBD5E1] block uppercase font-bold">Portion Qty</span>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      min="0.0001"
                                      value={currentFilledQty}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSearchPortionQtys((prev) => ({ ...prev, [inv.id]: val }));
                                      }}
                                      placeholder="0.00"
                                      className="w-20 h-7 bg-[#243244] text-[#F8FAFC] text-center font-extrabold text-xs rounded-lg border border-white/20 focus:outline-none focus:border-[#D4AF37]"
                                    />
                                    <span className="text-[11px] text-[#D4AF37] font-bold">{inv.unit}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right min-w-[70px] hidden sm:block">
                                <span className="text-[9px] text-[#94A3B8] block font-semibold">Cost</span>
                                <span className="text-xs font-black text-[#22C55E]">
                                  {livePortionCost.toFixed(2)} ETB
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  handleAddIngredientToRecipe(inv, currentFilledQty);
                                  setIngredientSearch('');
                                }}
                                className="px-3.5 py-2 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                              >
                                <Plus size={15} />
                                <span>+ Add Portion</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Selected Ingredients Portions Table */}
                {selectedIngredients.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-white/10 rounded-xl text-xs text-[#94A3B8]">
                    No ingredients added yet. Select a store, search above, and specify portion quantities to add raw ingredients to this product recipe.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#1E293B] text-[#CBD5E1] text-[10px] uppercase font-bold tracking-wider">
                        <tr>
                          <th className="p-3">Raw Ingredient</th>
                          <th className="p-3">Store (ስቶር)</th>
                          <th className="p-3">Portion Quantity (መጠን)</th>
                          <th className="p-3">Live Unit Price</th>
                          <th className="p-3">Portion Cost</th>
                          <th className="p-3 text-center">Wana Gbat (Main Ingredients)</th>
                          <th className="p-3 text-right">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 bg-[#243244]/60">
                        {selectedIngredients.map((item) => {
                          const liveCost = inventory.find((i) => i.id === item.inventoryId)?.costPerUnit || item.unitCost;
                          const portionTotal = item.qty * liveCost;
                          const storeLabel = item.storeName || inventory.find((i) => i.id === item.inventoryId)?.storeName || 'Bole Main Central Store';

                          return (
                            <tr
                              key={item.inventoryId}
                              className={`transition-colors ${
                                item.isMainIngredient ? 'bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10' : 'hover:bg-[#1E293B]/50'
                              }`}
                            >
                              <td className="p-3 font-bold text-[#F8FAFC]">
                                <div className="flex items-center gap-1.5">
                                  <span>{item.ingredientName}</span>
                                  {item.isMainIngredient && (
                                    <span className="text-[9px] bg-[#D4AF37] text-[#0F172A] font-extrabold px-1.5 py-0.2 rounded shadow-xs">
                                      Wana
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#94A3B8] block font-mono">{item.sku}</span>
                              </td>

                              <td className="p-3">
                                <span className="text-[10px] text-[#38BDF8] bg-[#0284C7]/15 px-2 py-0.5 rounded-md font-bold border border-[#38BDF8]/30 inline-flex items-center gap-1 whitespace-nowrap">
                                  <Store size={10} />
                                  {storeLabel}
                                </span>
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0.0001"
                                    value={item.qty}
                                    onChange={(e) =>
                                      handleUpdatePortionQty(item.inventoryId, parseFloat(e.target.value) || 0)
                                    }
                                    className="w-24 h-9 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-lg text-center text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                                  />
                                  <span className="text-[#CBD5E1] text-xs font-semibold">{item.unit}</span>
                                </div>
                              </td>

                              <td className="p-3 text-[#CBD5E1] font-semibold">
                                {liveCost} ETB/{item.unit}
                              </td>

                              <td className="p-3 font-extrabold text-[#22C55E]">
                                {portionTotal.toFixed(2)} ETB
                              </td>

                              <td className="p-3 text-center">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none bg-[#1E293B] px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-[#D4AF37]/40 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={item.isMainIngredient}
                                    onChange={() => handleToggleMainIngredient(item.inventoryId)}
                                    className="w-4 h-4 accent-[#D4AF37] rounded cursor-pointer"
                                  />
                                  <span
                                    className={`text-[10px] font-bold ${
                                      item.isMainIngredient ? 'text-[#D4AF37]' : 'text-[#94A3B8]'
                                    }`}
                                  >
                                    {item.isMainIngredient ? 'Wana Gbat' : 'Normal'}
                                  </span>
                                </label>
                              </td>

                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngredientFromRecipe(item.inventoryId)}
                                  className="text-gray-400 hover:text-[#EF4444] p-1.5 rounded-lg transition-colors cursor-pointer"
                                  title="Remove ingredient"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* PROFIT MARGIN & SELLING PRICE ENGINE */}
              <div className="bg-[#1E293B] p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/40 space-y-4">
                <h3 className="text-xs font-extrabold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                  <Calculator size={18} />
                  Automatic Pricing Engine (Ye Product Waga Sira)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Step 1: Total Raw Material Cost */}
                  <div className="bg-[#243244] p-3.5 rounded-xl border border-white/10">
                    <span className="text-[#94A3B8] text-[10px] uppercase font-bold block mb-1">
                      Total Ingredient Cost (Teklala Gbat Waga)
                    </span>
                    <span className="text-xl font-extrabold text-[#F8FAFC]">
                      {totalIngredientCost.toFixed(2)} ETB
                    </span>
                  </div>

                  {/* Step 2: Target Profit Margin % */}
                  <div className="bg-[#243244] p-3.5 rounded-xl border border-white/10">
                    <label className="text-[#94A3B8] text-[10px] uppercase font-bold block mb-1">
                      Desired Profit Margin % (Materfewn %)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={targetMarginPercent}
                        onChange={(e) => setTargetMarginPercent(parseFloat(e.target.value) || 0)}
                        className="w-full h-10 bg-[#1E293B] text-[#D4AF37] border border-white/10 rounded-lg px-3 text-sm font-extrabold focus:outline-none focus:border-[#D4AF37]"
                      />
                      <span className="text-xs font-bold text-[#D4AF37]">%</span>
                    </div>
                  </div>

                  {/* Step 3: Auto Recommended Selling Price */}
                  <div className="bg-[#D4AF37]/20 p-3.5 rounded-xl border border-[#D4AF37]">
                    <span className="text-[#D4AF37] text-[10px] uppercase font-bold block mb-1">
                      Calculated Selling Price (Meshecha Waga)
                    </span>
                    <span className="text-2xl font-black text-[#F8FAFC]">
                      {recommendedSellingPrice} ETB
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons Sticky Footer */}
              </div>
              <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="w-full sm:w-auto px-6 h-12 rounded-xl bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 h-12 rounded-xl bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCircle2 size={18} />
                  <span>Save Product & Price (Save Mareg)</span>
                </button>
              </div>
            </form>
        </div>
      )}

      {/* MODAL: Edit Registered Product (Ye Product Data Edit Mareg) - Fullscreen */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn font-sans text-[#F8FAFC]">
          {/* Modal Header */}
          <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-[#D4AF37]">
                <Pencil size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-serif font-bold text-[#F8FAFC]">
                  Edit Registered Product (Product Data Edit Mareg)
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Editing: <span className="text-[#D4AF37] font-semibold">{editingProduct.name}</span> | ID: {editingProduct.id}
                </p>
              </div>
            </div>

            <button
              onClick={() => setEditingProduct(null)}
              className="px-4 py-2 bg-[#243244] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <X size={18} />
              <span>Close</span>
            </button>
          </div>

          <form onSubmit={handleEditProductSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto space-y-6">
              {/* SECTION 1: Basic Information */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-extrabold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                  <Tag size={15} /> 1. General Product Information (ጠቅላላ የምርት መረጃ)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                      Product Name (የምርት ስም) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#CBD5E1]">
                        Category (የምርት ምድብ) *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryTargetField('edit');
                          setIsAddCategoryOpen(true);
                        }}
                        className="px-2.5 py-1 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] hover:text-[#F6C453] border border-[#D4AF37]/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
                        title="Create a new product category on the fly"
                      >
                        <Plus size={13} />
                        <span>Add New Category</span>
                      </button>
                    </div>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                    >
                      {allCategoryOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                      Selling Price (የመሸጫ ዋጋ ETB) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                      className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs sm:text-sm font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                      Barcode / SKU Code (ባርኮድ)
                    </label>
                    <input
                      type="text"
                      value={editBarcode}
                      onChange={(e) => setEditBarcode(e.target.value)}
                      placeholder="e.g. CL-REC-101"
                      className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                      Product Status (የሽያጭ ሁኔታ)
                    </label>
                    <div
                      onClick={() => setEditIsAvailable(!editIsAvailable)}
                      className={`h-[46px] px-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        editIsAvailable
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      <span className="text-xs font-bold">
                        {editIsAvailable ? 'Available (ይገኛል)' : 'Unavailable (አልቋል)'}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          editIsAvailable ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        }`}
                      >
                        {editIsAvailable ? <Check size={12} /> : <X size={12} />}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                    Product Description (ዝርዝር ማብራሪያ)
                  </label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Taste profile, roast type, serving details..."
                    className="w-full bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* SECTION 2: Product Photo / Image Editor */}
              <div className="bg-[#243244] p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <label className="text-xs font-extrabold text-[#D4AF37] flex items-center gap-2 uppercase tracking-wider">
                    <ImageIcon size={16} />
                    2. Product Photo / Image (የምርት ፎቶ ማስተካከያ)
                  </label>
                  <span className="text-[10px] text-[#94A3B8]">Upload file or choose preset</span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative group">
                    <img
                      src={editImage}
                      alt="Edit Preview"
                      className="w-24 h-24 object-cover rounded-2xl border-2 border-[#D4AF37] shrink-0 shadow-lg bg-[#1E293B]"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">
                      Live
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1E293B] hover:bg-[#2F4158] text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm">
                        <Upload size={15} /> Upload Photo (ፎቶ ስቀል)
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditPhotoFileChange}
                          className="hidden"
                        />
                      </label>

                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="url"
                          value={editImage}
                          onChange={(e) => setEditImage(e.target.value)}
                          placeholder="Or paste image URL here..."
                          className="w-full h-9 bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] text-[#94A3B8] mb-1.5 font-semibold">
                        Or select from presets (ከነባር ፎቶዎች ምረጥ):
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {SAMPLE_PRODUCT_PHOTOS.map((photo, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setEditImage(photo.url)}
                            className={`p-1 rounded-lg border text-[10px] font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                              editImage === photo.url
                                ? 'border-[#D4AF37] bg-[#D4AF37]/25 text-[#D4AF37] shadow-sm'
                                : 'border-white/10 bg-[#1E293B] text-gray-300 hover:bg-[#2F4158]'
                            }`}
                          >
                            <img src={photo.url} alt="" className="w-5 h-5 object-cover rounded" />
                            <span>{photo.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Our Specials Checkbox / Feature in Specials for Edit Mode */}
              <div className="bg-[#1E293B] p-4 rounded-xl border border-[#D4AF37]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    editIsSpecial
                      ? 'bg-[#6B1D1D] text-[#D4AF37] border-[#D4AF37]/50 shadow-md'
                      : 'bg-[#243244] text-gray-400 border-white/10'
                  }`}>
                    <Star size={22} className={editIsSpecial ? 'fill-[#D4AF37]' : ''} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-[#F8FAFC] flex items-center gap-1.5">
                      <span>Feature in "Our Specials" (በዋናው ሜኑ 'Our Specials' ላይ እንዲታይ)</span>
                      {editIsSpecial && (
                        <span className="text-[10px] bg-[#D4AF37] text-[#0F172A] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Active Special
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      ይህን ቲክ (Tik) ሲያደርጉት ምርቱ በዋናው ድረ-ገጽ እና በሜኑ "Our Specials" ገጽ ላይ በቀጥታ ይመጣል።
                    </p>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none bg-[#243244] hover:bg-[#2F4158] px-4 py-2.5 rounded-xl border border-white/10 hover:border-[#D4AF37]/50 transition-all shrink-0">
                  <input
                    type="checkbox"
                    checked={editIsSpecial}
                    onChange={(e) => setEditIsSpecial(e.target.checked)}
                    className="w-5 h-5 accent-[#D4AF37] rounded cursor-pointer"
                  />
                  <span className={`text-xs font-bold ${editIsSpecial ? 'text-[#D4AF37]' : 'text-gray-300'}`}>
                    {editIsSpecial ? '✓ Tik የተደረገ (Special)' : 'Tik አድርግ (Add Special)'}
                  </span>
                </label>
              </div>

              {/* SECTION 3: Raw Ingredients Recipe Editor (Gbatochun Edit Mareg) */}
              <div className="bg-[#243244] p-4 rounded-xl border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={16} />
                      3. Ingredients & Recipe Formulation (የግብዓትና አዘገጃጀት ማስተካከያ)
                    </h3>
                    <p className="text-[11px] text-[#94A3B8]">
                      Filter by store, search inventory, adjust portion sizes, and tick <strong>Main Ingredient (ዋና ግብዓት)</strong>.
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-lg border border-[#D4AF37]/30 shrink-0">
                    {editIngredients.length} Ingredients Active
                  </span>
                </div>

                {/* STORE SELECTION FILTER BAR FOR EDIT MODE (የስቶር መምረጫ) */}
                <div className="bg-[#1E293B] p-3 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-[#D4AF37] flex items-center gap-1.5 uppercase tracking-wide">
                      <Store size={14} className="text-[#D4AF37]" />
                      <span>Select Ingredient Store (ግብዓቱን የሚወስዱበት ስቶር):</span>
                    </label>
                    <span className="text-[10px] text-[#94A3B8]">
                      {editSelectedStoreFilter === 'ALL'
                        ? 'All Stores Active'
                        : `Showing from: ${editSelectedStoreFilter}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditSelectedStoreFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        editSelectedStoreFilter === 'ALL'
                          ? 'bg-[#D4AF37] text-[#0F172A] shadow-md'
                          : 'bg-[#243244] text-[#CBD5E1] hover:bg-[#2F4158] border border-white/10'
                      }`}
                    >
                      <Layers size={13} />
                      <span>All Stores (ሁሉም ስቶሮች)</span>
                      <span className="text-[10px] opacity-75 font-mono">({inventory.length})</span>
                    </button>

                    {availableStores.map((st) => {
                      const countInStore = inventory.filter(
                        (i) => (i.storeName || '').toLowerCase().trim() === st.toLowerCase().trim()
                      ).length;
                      const isSelected = editSelectedStoreFilter === st;

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setEditSelectedStoreFilter(st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#D4AF37] text-[#0F172A] shadow-md ring-2 ring-[#D4AF37]/50'
                              : 'bg-[#243244] text-[#CBD5E1] hover:bg-[#2F4158] border border-white/10'
                          }`}
                        >
                          <Building2 size={13} />
                          <span>{st}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              isSelected
                                ? 'bg-[#0F172A]/20 text-[#0F172A] font-extrabold'
                                : 'bg-[#1E293B] text-[#94A3B8]'
                            }`}
                          >
                            {countInStore}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inventory search bar to add new ingredients to this product */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#CBD5E1]">
                    + Add New Raw Ingredient from Inventory (ግብዓት ከስቶክ ፈልገህ ጨምር):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editIngredientSearch}
                      onChange={(e) => setEditIngredientSearch(e.target.value)}
                      placeholder={
                        editSelectedStoreFilter === 'ALL'
                          ? 'Search inventory ingredients (e.g. Coffee Beans, Fresh Milk, Sugar, Flour)...'
                          : `Search ingredients in "${editSelectedStoreFilter}" (or leave blank to see all ${editSelectedStoreFilter} items)...`
                      }
                      className="w-full h-[46px] bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-10 pr-4 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                    <Search size={16} className="absolute left-3.5 top-3.5 text-[#94A3B8]" />
                  </div>

                  {/* Filtered Dropdown list with direct Portion Quantity */}
                  {(editIngredientSearch.trim() || editSelectedStoreFilter !== 'ALL') && (
                    <div className="bg-[#1E293B] border border-white/15 rounded-2xl max-h-80 overflow-y-auto p-2.5 space-y-2 shadow-2xl">
                      <div className="text-[11px] font-bold text-[#D4AF37] px-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Filter size={12} />
                          {editSelectedStoreFilter !== 'ALL'
                            ? `Ingredients in "${editSelectedStoreFilter}" (${filteredInventoryToAddToEdit.length} items)`
                            : `Available Inventory Ingredients (${filteredInventoryToAddToEdit.length} items)`}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] font-normal">
                          Type exact portion & click "+ Add Portion"
                        </span>
                      </div>

                      {filteredInventoryToAddToEdit.length === 0 ? (
                        <div className="text-center py-6 text-xs text-[#94A3B8] space-y-1">
                          <p>No matching ingredients found in this store.</p>
                          {editSelectedStoreFilter !== 'ALL' && (
                            <button
                              type="button"
                              onClick={() => setEditSelectedStoreFilter('ALL')}
                              className="text-[#D4AF37] hover:underline text-[11px] font-bold"
                            >
                              Switch to "All Stores" to view items in other warehouses
                            </button>
                          )}
                        </div>
                      ) : (
                        filteredInventoryToAddToEdit.map((inv) => {
                          const currentFilledQty = editSearchPortionQtys[inv.id] ?? getDefaultQtyString(inv.unit);
                          const parsedVal = parseFloat(currentFilledQty) || 0;
                          const livePortionCost = parsedVal * inv.costPerUnit;
                          const presets = getQuickPresets(inv.unit);
                          const invStore = inv.storeName || 'Bole Main Central Store';

                          return (
                            <div
                              key={inv.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#243244] hover:bg-[#2A3B4F] p-3 rounded-xl border border-white/10 transition-all"
                            >
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-extrabold text-[#F8FAFC] text-xs sm:text-sm">{inv.name}</span>
                                  <span className="text-[10px] text-[#D4AF37] bg-[#1E293B] px-2 py-0.5 rounded-md font-bold border border-[#D4AF37]/30">
                                    {inv.costPerUnit} ETB / {inv.unit}
                                  </span>
                                  <span className="text-[10px] text-[#94A3B8] font-mono">({inv.sku})</span>

                                  {/* Store badge */}
                                  <span className="text-[10px] text-[#38BDF8] bg-[#0284C7]/15 px-2 py-0.5 rounded-md font-bold border border-[#38BDF8]/30 flex items-center gap-1">
                                    <Store size={10} />
                                    <span>{invStore}</span>
                                  </span>
                                  <span className="text-[10px] text-[#4ADE80] font-semibold">
                                    Stock: {inv.currentStock} {inv.unit}
                                  </span>
                                </div>

                                {/* Quick Presets */}
                                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                  <span className="text-[10px] text-[#94A3B8] font-semibold">Quick:</span>
                                  {presets.map((p, pIdx) => (
                                    <button
                                      key={pIdx}
                                      type="button"
                                      onClick={() => {
                                        setEditSearchPortionQtys((prev) => ({ ...prev, [inv.id]: p.val }));
                                      }}
                                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                        currentFilledQty === p.val
                                          ? 'bg-[#D4AF37] text-[#0F172A] border-[#D4AF37] font-black'
                                          : 'bg-[#1E293B] text-[#CBD5E1] border-white/10 hover:border-[#D4AF37]'
                                      }`}
                                    >
                                      {p.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Portion Quantity Input and Add Button */}
                              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                                <div className="flex items-center gap-1.5 bg-[#1E293B] px-2.5 py-1.5 rounded-xl border border-white/15">
                                  <div className="text-right">
                                    <span className="text-[9px] text-[#CBD5E1] block uppercase font-bold">Portion Qty</span>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        step="any"
                                        min="0.0001"
                                        value={currentFilledQty}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditSearchPortionQtys((prev) => ({ ...prev, [inv.id]: val }));
                                        }}
                                        placeholder="0.00"
                                        className="w-20 h-7 bg-[#243244] text-[#F8FAFC] text-center font-extrabold text-xs rounded-lg border border-white/20 focus:outline-none focus:border-[#D4AF37]"
                                      />
                                      <span className="text-[11px] text-[#D4AF37] font-bold">{inv.unit}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right min-w-[70px] hidden sm:block">
                                  <span className="text-[9px] text-[#94A3B8] block font-semibold">Cost</span>
                                  <span className="text-xs font-black text-[#22C55E]">
                                    {livePortionCost.toFixed(2)} ETB
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAddIngredientToEditRecipe(inv, currentFilledQty);
                                    setEditIngredientSearch('');
                                  }}
                                  className="px-3.5 py-2 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                                >
                                  <Plus size={15} />
                                  <span>+ Add Portion</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Table of selected recipe ingredients */}
                {editIngredients.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-white/10 rounded-xl text-xs text-[#94A3B8]">
                    No raw ingredients assigned to this product yet. Use the store selector or search bar above to link inventory ingredients.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#1E293B] text-[#CBD5E1] text-[10px] uppercase font-bold tracking-wider">
                        <tr>
                          <th className="p-3">Raw Ingredient (ግብዓት)</th>
                          <th className="p-3">Store (ስቶር)</th>
                          <th className="p-3">Portion Qty (መጠን)</th>
                          <th className="p-3">Live Unit Cost</th>
                          <th className="p-3">Portion Cost</th>
                          <th className="p-3 text-center">Main (ዋና ግብዓት)</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-[#243244]/60">
                        {editIngredients.map((item) => {
                          const liveCost = inventory.find((i) => i.id === item.inventoryId)?.costPerUnit || item.unitCost;
                          const calculatedPortionCost = item.qty * liveCost;
                          const storeLabel = item.storeName || inventory.find((i) => i.id === item.inventoryId)?.storeName || 'Bole Main Central Store';

                          return (
                            <tr key={item.inventoryId} className="hover:bg-[#2F4158]/50 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-[#F8FAFC]">{item.ingredientName}</div>
                                <div className="text-[10px] text-[#94A3B8] font-mono">{item.sku}</div>
                              </td>

                              <td className="p-3">
                                <span className="text-[10px] text-[#38BDF8] bg-[#0284C7]/15 px-2 py-0.5 rounded-md font-bold border border-[#38BDF8]/30 inline-flex items-center gap-1 whitespace-nowrap">
                                  <Store size={10} />
                                  {storeLabel}
                                </span>
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0.0001"
                                    value={item.qty}
                                    onChange={(e) =>
                                      handleUpdateEditPortionQty(item.inventoryId, parseFloat(e.target.value) || 0)
                                    }
                                    className="w-24 h-9 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-lg px-2 text-xs font-bold text-center focus:outline-none focus:border-[#D4AF37]"
                                  />
                                  <span className="text-[11px] text-[#CBD5E1] font-semibold">{item.unit}</span>
                                </div>
                              </td>

                              <td className="p-3 text-[#CBD5E1] font-mono">
                                {liveCost} ETB/{item.unit}
                              </td>

                              <td className="p-3 font-mono font-extrabold text-[#22C55E]">
                                {calculatedPortionCost.toFixed(2)} ETB
                              </td>

                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleEditMainIngredient(item.inventoryId)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                                    item.isMainIngredient
                                      ? 'bg-[#D4AF37] text-[#0F172A] border-[#D4AF37] shadow-sm font-black'
                                      : 'bg-[#1E293B] text-[#94A3B8] border-white/10 hover:text-white'
                                  }`}
                                  title="Toggle Wana Gbat (Multiple selection allowed)"
                                >
                                  {item.isMainIngredient && <Check size={11} />}
                                  {item.isMainIngredient ? 'Wana Gbat' : 'Normal'}
                                </button>
                              </td>

                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditIngredient(item.inventoryId)}
                                  className="p-1.5 text-gray-400 hover:text-[#EF4444] rounded-lg transition-colors cursor-pointer"
                                  title="Remove from recipe"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Live Recipe Cost & Margin Calculator */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#1E293B] rounded-xl border border-white/10 text-xs">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block uppercase font-bold">
                      Total Raw Material Cost (የጥሬ እቃ ወጪ)
                    </span>
                    <span className="text-base font-extrabold text-[#22C55E] mt-0.5 block">
                      {editTotalIngredientCost.toFixed(2)} ETB
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#94A3B8] block uppercase font-bold">
                      Target Profit Margin % (የትርፍ ምጣኔ)
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={editTargetMarginPercent}
                        onChange={(e) => setEditTargetMarginPercent(parseFloat(e.target.value) || 0)}
                        className="w-16 h-7 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-md px-1.5 text-xs font-bold text-center"
                      />
                      <span className="text-xs text-[#CBD5E1] font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#94A3B8] block uppercase font-bold">
                      Recommended Price (የሚመከር ዋጋ)
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-base font-extrabold text-[#D4AF37]">
                        {editRecommendedPrice} ETB
                      </span>
                      {editRecommendedPrice > 0 && editPrice !== editRecommendedPrice && (
                        <button
                          type="button"
                          onClick={() => setEditPrice(editRecommendedPrice)}
                          className="px-2 py-0.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold rounded border border-[#D4AF37]/30 transition-all cursor-pointer"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Sticky Footer */}
              </div>
              <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="w-full sm:w-auto px-6 h-12 rounded-xl bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel (ሰርዝ)
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 h-12 rounded-xl bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <CheckCircle2 size={18} />
                  <span>Save Changes (የተስተካከለውን መዝግብ)</span>
                </button>
              </div>
            </form>
        </div>
      )}

      {/* CATEGORY CREATED SUCCESS TOAST */}
      {categorySuccessToast && (
        <div className="fixed top-6 right-6 z-[80] bg-[#1E293B] border border-[#22C55E] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
          <span>{categorySuccessToast}</span>
        </div>
      )}

      {/* QUICK ADD CATEGORY MODAL DIALOG */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1E293B] border border-[#D4AF37]/50 text-[#F8FAFC] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#243244]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#F8FAFC]">
                    Add New Product Category
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    አዲስ የምርት ካቴጎሪ መፍጠር (Auto-saves & selects)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-1.5">
                  Category Name (የካቴጎሪው ስም) *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Seafood & Grills, Traditional Meals, Smoothies..."
                  className="w-full h-11 bg-[#0F172A] border border-white/15 focus:border-[#D4AF37] text-[#F8FAFC] rounded-xl px-3.5 text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                  Description / Subtitle (ማብራሪያ - Optional)
                </label>
                <input
                  type="text"
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  placeholder="e.g. Fresh ocean fish, shrimp, and seasonal grills"
                  className="w-full h-10 bg-[#0F172A] border border-white/15 focus:border-[#D4AF37] text-[#F8FAFC] rounded-xl px-3.5 text-xs focus:outline-none"
                />
              </div>

              <div className="bg-[#0F172A]/60 p-3 rounded-xl border border-white/5 text-[11px] text-[#94A3B8] flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#22C55E] shrink-0" />
                <span>
                  ይህ ካቴጎሪ ሲፈጠር ወዲያውኑ በProduct Category dropdown ውስጥ ይመረጣል፤ በዳታቤዝ እና በሜኑ ላይም ይካተታል።
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 py-2 bg-[#243244] hover:bg-[#334155] text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel (ሰርዝ)
                </button>
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Create Category (ካቴጎሪ ፍጠር)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification for PDF */}
      {pdfToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-[#6B1D1D] text-white px-5 py-3 rounded-2xl border border-[#D4AF37] shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fadeIn no-print">
          {isExportingPDF ? (
            <Loader2 size={16} className="animate-spin text-[#D4AF37]" />
          ) : (
            <CheckCircle2 size={16} className="text-green-400" />
          )}
          <span>{pdfToast}</span>
        </div>
      )}

      {/* Container for @media print (Cleanly displayed during print, hidden on screen) */}
      <div className="menu-print-container-wrapper">
        <MenuPrintTemplate
          id="cafelina-product-costing-print-target"
          menuItems={menuItems}
        />
      </div>

      {/* Off-screen container kept in DOM for html2canvas rendering with 100% opacity */}
      <div
        ref={printCanvasRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0px',
          width: '794px',
          zIndex: -9999,
          pointerEvents: 'none',
          overflow: 'visible',
          background: '#FFFDF9',
        }}
      >
        <MenuPrintTemplate menuItems={menuItems} />
      </div>

      {/* A4 Menu Preview Modal */}
      <MenuPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        menuItems={menuItems}
        onPrint={handlePrintMenu}
      />
    </div>
  );
};
