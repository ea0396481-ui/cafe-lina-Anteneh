import React, { useState, useEffect } from 'react';
import {
  MenuItem,
  Order,
  Reservation,
  Customer,
  Employee,
  InventoryItem,
  Supplier,
  PurchaseOrder,
  RecipeCost,
  EPRRecord,
  BlogPost,
  CareerPosting,
  UserRole,
  OrderItem,
  DeliveryType,
  SpecialIngredientComponent,
} from './types';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_RESERVATIONS,
  INITIAL_CUSTOMERS,
  INITIAL_EMPLOYEES,
  INITIAL_INVENTORY,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_RECIPE_COSTS,
  INITIAL_EPR_RECORDS,
  INITIAL_BLOG_POSTS,
  INITIAL_CAREERS,
  INITIAL_CATEGORIES,
  INITIAL_STORES,
  INITIAL_STOCK_IN_VOUCHERS,
  INITIAL_STORE_REQUESTS,
  INITIAL_STORE_TRANSFERS,
  INITIAL_POS_RECEIPTS,
  INITIAL_BIN_CARDS,
  INITIAL_DAMAGE_VOUCHERS,
  INITIAL_STAFF_MEALS,
  INITIAL_SYSTEM_USERS,
} from './data/mockData';

import {
  CategoryRecord,
  StoreRecord,
  StockInVoucher,
  StoreRequestVoucher,
  StoreTransferVoucher,
  POSReceiptVoucher,
  BinCardEntry,
  DamageVoucher,
  StaffMealRecord,
  SystemUser,
} from './types';

import {
  subscribeToCollection,
  saveItem,
  deleteItem,
  resetCollection,
  localDatabaseService,
} from './lib/firebaseSync';
import {
  executeStoreTransfer,
  updateStoreTransfer,
  deleteStoreTransfer,
} from './lib/stockTransferService';

import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { TodaysSpecials } from './components/TodaysSpecials';
import { MenuView } from './components/MenuView';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ReservationSection } from './components/ReservationSection';
import { CustomerPortal } from './components/CustomerPortal';
import { AboutPage } from './components/AboutPage';
import { GalleryPage } from './components/GalleryPage';
import { BlogPage } from './components/BlogPage';
import { CareerPage } from './components/CareerPage';
import { ContactPage } from './components/ContactPage';
import { PrivacyTermsPages } from './components/PrivacyTermsPages';
import { NotFoundPage } from './components/NotFoundPage';
import { Footer } from './components/Footer';
import { QRGeneratorPage } from './components/QRGenerator/QRGeneratorPage';

// Admin & ERP Modules
import { ERPLayout } from './components/AdminERP/ERPLayout';
import { AdminDashboard } from './components/AdminERP/AdminDashboard';
import { POSSystem } from './components/AdminERP/POSSystem';
import { KitchenDisplaySystem } from './components/AdminERP/KitchenDisplaySystem';
import { MenuManagement } from './components/AdminERP/MenuManagement';
import { InventoryERP } from './components/AdminERP/InventoryERP';
import { SupplierERP } from './components/AdminERP/SupplierERP';
import { RecipeCosting } from './components/AdminERP/RecipeCosting';
import { HRModule } from './components/AdminERP/HRModule';
import { EPRModule } from './components/AdminERP/EPRModule';
import { AnalyticsReports } from './components/AdminERP/AnalyticsReports';
import { SettingsManager } from './components/AdminERP/SettingsManager';
import { LiveOrdersQueue } from './components/AdminERP/LiveOrdersQueue';
import { ProductCostingERP } from './components/AdminERP/ProductCostingERP';
import { StockInVoucherERP } from './components/AdminERP/StockInVoucherERP';
import { CategoriesERP } from './components/AdminERP/CategoriesERP';
import { StoresERP } from './components/AdminERP/StoresERP';
import { CustomersERP } from './components/AdminERP/CustomersERP';
import { OrderVouchersERP } from './components/AdminERP/OrderVouchersERP';
import { StoreRequestERP } from './components/AdminERP/StoreRequestERP';
import { StoreTransferERP } from './components/AdminERP/StoreTransferERP';
import { StoreBalanceExpiryERP } from './components/AdminERP/StoreBalanceExpiryERP';
import { BinCardERP } from './components/AdminERP/BinCardERP';
import { DamageERP } from './components/AdminERP/DamageERP';
import { StaffFoodERP } from './components/AdminERP/StaffFoodERP';
import { ReportsERP } from './components/AdminERP/ReportsERP';
import { SettingsResetERP } from './components/AdminERP/SettingsResetERP';


import { AuthModal } from './components/AuthModal';

export default function App() {
  // App Navigation & Role State
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Customer');
  const [isERPView, setIsERPView] = useState<boolean>(false);
  const [activeERPModule, setActiveERPModule] = useState<string>('pos');

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authTargetRole, setAuthTargetRole] = useState<UserRole | undefined>(undefined);
  const [loggedInUser, setLoggedInUser] = useState<SystemUser | null>(null);

  const handleOpenAuthModal = (open: boolean, targetRole?: UserRole) => {
    setAuthTargetRole(targetRole);
    setIsAuthModalOpen(open);
  };

  const handleLoginSuccess = (user: SystemUser) => {
    setLoggedInUser(user);
    setCurrentUserRole(user.role);
    setIsERPView(true);
    if (user.role === 'Cashier') {
      setActiveERPModule('pos');
    } else if (user.role === 'Kitchen') {
      setActiveERPModule('kds');
    } else {
      setActiveERPModule('dashboard');
    }
  };

  const handleSignOut = () => {
    setLoggedInUser(null);
    setCurrentUserRole('Customer');
    setIsERPView(false);
  };

  // Core Data States (Initialized from local storage cache with deleted items filtered out)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() =>
    localDatabaseService.getLocalStorageInitialState('menuItems', INITIAL_MENU_ITEMS)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    localDatabaseService.getLocalStorageInitialState('orders', INITIAL_ORDERS)
  );
  const [reservations, setReservations] = useState<Reservation[]>(() =>
    localDatabaseService.getLocalStorageInitialState('reservations', INITIAL_RESERVATIONS)
  );
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    localDatabaseService.getLocalStorageInitialState('inventory', INITIAL_INVENTORY)
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    localDatabaseService.getLocalStorageInitialState('suppliers', INITIAL_SUPPLIERS)
  );
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() =>
    localDatabaseService.getLocalStorageInitialState('purchaseOrders', INITIAL_PURCHASE_ORDERS)
  );
  const [employees, setEmployees] = useState<Employee[]>(() =>
    localDatabaseService.getLocalStorageInitialState('employees', INITIAL_EMPLOYEES)
  );
  const [recipeCosts, setRecipeCosts] = useState<RecipeCost[]>(() =>
    localDatabaseService.getLocalStorageInitialState('recipeCosts', INITIAL_RECIPE_COSTS)
  );
  const [eprRecords, setEprRecords] = useState<EPRRecord[]>(() =>
    localDatabaseService.getLocalStorageInitialState('eprRecords', INITIAL_EPR_RECORDS)
  );
  const [customers, setCustomers] = useState<Customer[]>(() =>
    localDatabaseService.getLocalStorageInitialState('customers', INITIAL_CUSTOMERS)
  );
  const [categories, setCategories] = useState<CategoryRecord[]>(() =>
    localDatabaseService.getLocalStorageInitialState('categories', INITIAL_CATEGORIES)
  );
  const [stores, setStores] = useState<StoreRecord[]>(() =>
    localDatabaseService.getLocalStorageInitialState('stores', INITIAL_STORES)
  );
  const [stockInVouchers, setStockInVouchers] = useState<StockInVoucher[]>(() =>
    localDatabaseService.getLocalStorageInitialState('stockInVouchers', INITIAL_STOCK_IN_VOUCHERS)
  );
  const [storeRequests, setStoreRequests] = useState<StoreRequestVoucher[]>(() =>
    localDatabaseService.getLocalStorageInitialState('storeRequests', INITIAL_STORE_REQUESTS)
  );
  const [storeTransfers, setStoreTransfers] = useState<StoreTransferVoucher[]>(() =>
    localDatabaseService.getLocalStorageInitialState('storeTransfers', INITIAL_STORE_TRANSFERS)
  );
  const [posReceipts, setPosReceipts] = useState<POSReceiptVoucher[]>(() =>
    localDatabaseService.getLocalStorageInitialState('posReceipts', INITIAL_POS_RECEIPTS)
  );
  const [binCards, setBinCards] = useState<BinCardEntry[]>(() =>
    localDatabaseService.getLocalStorageInitialState('binCards', INITIAL_BIN_CARDS)
  );
  const [damageVouchers, setDamageVouchers] = useState<DamageVoucher[]>(() =>
    localDatabaseService.getLocalStorageInitialState('damageVouchers', INITIAL_DAMAGE_VOUCHERS)
  );
  const [staffMeals, setStaffMeals] = useState<StaffMealRecord[]>(() =>
    localDatabaseService.getLocalStorageInitialState('staffMeals', INITIAL_STAFF_MEALS)
  );
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() =>
    localDatabaseService.getLocalStorageInitialState('systemUsers', INITIAL_SYSTEM_USERS)
  );

  // Real-time Firebase Sync Effect across all devices
  useEffect(() => {
    const unsubMenuItems = subscribeToCollection('menuItems', 'id', INITIAL_MENU_ITEMS, setMenuItems);
    const unsubOrders = subscribeToCollection('orders', 'id', INITIAL_ORDERS, setOrders);
    const unsubReservations = subscribeToCollection('reservations', 'id', INITIAL_RESERVATIONS, setReservations);
    const unsubInventory = subscribeToCollection('inventory', 'id', INITIAL_INVENTORY, setInventory);
    const unsubSuppliers = subscribeToCollection('suppliers', 'id', INITIAL_SUPPLIERS, setSuppliers);
    const unsubPO = subscribeToCollection('purchaseOrders', 'id', INITIAL_PURCHASE_ORDERS, setPurchaseOrders);
    const unsubEmployees = subscribeToCollection('employees', 'id', INITIAL_EMPLOYEES, setEmployees);
    const unsubRecipe = subscribeToCollection('recipeCosts', 'id', INITIAL_RECIPE_COSTS, setRecipeCosts);
    const unsubEpr = subscribeToCollection('eprRecords', 'id', INITIAL_EPR_RECORDS, setEprRecords);
    const unsubCustomers = subscribeToCollection('customers', 'id', INITIAL_CUSTOMERS, setCustomers);
    const unsubCategories = subscribeToCollection('categories', 'id', INITIAL_CATEGORIES, setCategories);
    const unsubStores = subscribeToCollection('stores', 'id', INITIAL_STORES, setStores);
    const unsubStockIn = subscribeToCollection('stockInVouchers', 'voucherId', INITIAL_STOCK_IN_VOUCHERS, setStockInVouchers);
    const unsubStoreReq = subscribeToCollection('storeRequests', 'voucherId', INITIAL_STORE_REQUESTS, setStoreRequests);
    const unsubStoreTransfer = subscribeToCollection('storeTransfers', 'voucherId', INITIAL_STORE_TRANSFERS, setStoreTransfers);
    const unsubPosReceipts = subscribeToCollection('posReceipts', 'voucherId', INITIAL_POS_RECEIPTS, setPosReceipts);
    const unsubBinCards = subscribeToCollection('binCards', 'id', INITIAL_BIN_CARDS, setBinCards);
    const unsubDamage = subscribeToCollection('damageVouchers', 'voucherId', INITIAL_DAMAGE_VOUCHERS, setDamageVouchers);
    const unsubStaffMeals = subscribeToCollection('staffMeals', 'id', INITIAL_STAFF_MEALS, setStaffMeals);
    const unsubSystemUsers = subscribeToCollection('systemUsers', 'id', INITIAL_SYSTEM_USERS, setSystemUsers);

    return () => {
      unsubMenuItems();
      unsubOrders();
      unsubReservations();
      unsubInventory();
      unsubSuppliers();
      unsubPO();
      unsubEmployees();
      unsubRecipe();
      unsubEpr();
      unsubCustomers();
      unsubCategories();
      unsubStores();
      unsubStockIn();
      unsubStoreReq();
      unsubStoreTransfer();
      unsubPosReceipts();
      unsubBinCards();
      unsubDamage();
      unsubStaffMeals();
      unsubSystemUsers();
    };
  }, []);

  // Damage Voucher Handlers
  const handleAddDamageVoucher = async (v: DamageVoucher) => {
    await saveItem('damageVouchers', v, 'voucherId');

    // Automatically deduct damaged ingredient quantities from inventory in Firebase!
    const deductions = new Map<string, number>();

    for (const itemDmg of v.items) {
      if (itemDmg.itemType === 'Ingredient') {
        const invItem = inventory.find(
          (i) =>
            i.id === itemDmg.itemId ||
            i.name.toLowerCase().trim() === itemDmg.name.toLowerCase().trim() ||
            i.name.toLowerCase().includes(itemDmg.name.toLowerCase().trim()) ||
            itemDmg.name.toLowerCase().includes(i.name.toLowerCase().trim())
        );
        const targetId = invItem ? invItem.id : itemDmg.itemId;
        const current = deductions.get(targetId) || 0;
        deductions.set(targetId, current + itemDmg.qty);
      } else {
        // Finished Product Damage: Find menu item and deduct raw ingredients according to exact recipe
        const menuItem = menuItems.find(
          (m) => m.id === itemDmg.itemId || m.name.toLowerCase().trim() === itemDmg.name.toLowerCase().trim()
        );

        if (menuItem) {
          if (menuItem.recipeIngredients && menuItem.recipeIngredients.length > 0) {
            for (const rIng of menuItem.recipeIngredients) {
              const current = deductions.get(rIng.inventoryId) || 0;
              deductions.set(rIng.inventoryId, current + rIng.qty * itemDmg.qty);
            }
          } else {
            const rc = recipeCosts.find(
              (r) => r.menuItemId === menuItem.id || r.menuItemName.toLowerCase().trim() === menuItem.name.toLowerCase().trim()
            );
            if (rc && rc.ingredients && rc.ingredients.length > 0) {
              for (const ing of rc.ingredients) {
                const matchedInv = inventory.find(
                  (inv) =>
                    inv.id === ing.inventoryId ||
                    inv.name.toLowerCase().includes(ing.ingredientName.toLowerCase()) ||
                    ing.ingredientName.toLowerCase().includes(inv.name.toLowerCase())
                );
                if (matchedInv) {
                  const current = deductions.get(matchedInv.id) || 0;
                  deductions.set(matchedInv.id, current + ing.qty * itemDmg.qty);
                }
              }
            } else {
              // Heuristic fallback
              const isCoffee =
                menuItem.category?.toLowerCase().includes('coffee') ||
                menuItem.name.toLowerCase().includes('coffee');
              const isMilk =
                menuItem.category?.toLowerCase().includes('milk') ||
                menuItem.name.toLowerCase().includes('latte') ||
                menuItem.name.toLowerCase().includes('cappuccino');
              if (isCoffee) {
                const cInv = inventory.find(
                  (i) => i.category.toLowerCase().includes('coffee') || i.name.toLowerCase().includes('coffee')
                );
                if (cInv) deductions.set(cInv.id, (deductions.get(cInv.id) || 0) + 0.018 * itemDmg.qty);
              }
              if (isMilk) {
                const mInv = inventory.find(
                  (i) => i.category.toLowerCase().includes('milk') || i.name.toLowerCase().includes('milk')
                );
                if (mInv) deductions.set(mInv.id, (deductions.get(mInv.id) || 0) + 0.15 * itemDmg.qty);
              }
            }
          }
        }
      }
    }

    // Update inventory items in Firestore
    for (const [invId, amountToDeduct] of deductions.entries()) {
      const invItem = inventory.find((i) => i.id === invId);
      if (invItem) {
        const updatedStockQty = Math.max(0, Math.round((invItem.stockQty - amountToDeduct) * 1000) / 1000);
        const updatedItem = {
          ...invItem,
          stockQty: updatedStockQty,
        };
        await saveItem('inventory', updatedItem, 'id');

        // Create explicit Bin Card entry for damage tracking
        const binEntry: BinCardEntry = {
          id: `BIN-DMG-${Date.now()}-${invItem.id}`,
          inventoryId: invItem.id,
          storeName: v.storeName || invItem.storeName || 'Bole Main Central Store',
          date: v.date || new Date().toISOString().split('T')[0],
          transactionType: 'Damage Spoilage',
          referenceId: v.voucherId,
          qtyIn: 0,
          qtyOut: amountToDeduct,
          balanceAfter: updatedStockQty,
          unit: invItem.unit,
          notes: `Damage Spoilage Voucher ${v.voucherId} (Recorded by ${v.recordedBy})`,
        };
        await saveItem('binCards', binEntry, 'id');
      }
    }
  };

  const handleUpdateDamageVoucher = async (v: DamageVoucher) => {
    await saveItem('damageVouchers', v, 'voucherId');
  };

  const handleDeleteDamageVoucher = async (voucherId: string) => {
    await deleteItem('damageVouchers', voucherId);
  };

  // Staff Meal Handlers
  const handleAddStaffMeal = async (s: StaffMealRecord) => {
    await saveItem('staffMeals', s, 'id');
  };

  const handleDeleteStaffMeal = async (id: string) => {
    await deleteItem('staffMeals', id);
  };

  // System User Handlers
  const handleAddSystemUser = async (u: SystemUser) => {
    await saveItem('systemUsers', u, 'id');
  };

  const handleUpdateSystemUser = async (u: SystemUser) => {
    await saveItem('systemUsers', u, 'id');
  };

  const handleDeleteSystemUser = async (id: string) => {
    await deleteItem('systemUsers', id);
  };

  // System Factory Reset Handler
  const handleSystemReset = async () => {
    await resetCollection('menuItems', INITIAL_MENU_ITEMS, 'id');
    await resetCollection('orders', INITIAL_ORDERS, 'id');
    await resetCollection('reservations', INITIAL_RESERVATIONS, 'id');
    await resetCollection('inventory', INITIAL_INVENTORY, 'id');
    await resetCollection('suppliers', INITIAL_SUPPLIERS, 'id');
    await resetCollection('purchaseOrders', INITIAL_PURCHASE_ORDERS, 'id');
    await resetCollection('employees', INITIAL_EMPLOYEES, 'id');
    await resetCollection('recipeCosts', INITIAL_RECIPE_COSTS, 'id');
    await resetCollection('eprRecords', INITIAL_EPR_RECORDS, 'id');
    await resetCollection('customers', INITIAL_CUSTOMERS, 'id');
    await resetCollection('categories', INITIAL_CATEGORIES, 'id');
    await resetCollection('stores', INITIAL_STORES, 'id');
    await resetCollection('stockInVouchers', INITIAL_STOCK_IN_VOUCHERS, 'voucherId');
    await resetCollection('storeRequests', INITIAL_STORE_REQUESTS, 'voucherId');
    await resetCollection('storeTransfers', INITIAL_STORE_TRANSFERS, 'voucherId');
    await resetCollection('posReceipts', INITIAL_POS_RECEIPTS, 'voucherId');
    await resetCollection('binCards', INITIAL_BIN_CARDS, 'id');
    await resetCollection('damageVouchers', INITIAL_DAMAGE_VOUCHERS, 'voucherId');
    await resetCollection('staffMeals', INITIAL_STAFF_MEALS, 'id');
    await resetCollection('systemUsers', INITIAL_SYSTEM_USERS, 'id');
  };


  // Cart & Wishlist State
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('Delivery');
  const [wishlistIds, setWishlistIds] = useState<string[]>(['item-1', 'item-2']);

  // Cart Actions
  const handleAddToCart = (item: MenuItem, customOptions?: string[], notes?: string) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((c) => c.menuItem.id === item.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [...prev, { menuItem: item, quantity: 1, selectedOptions: customOptions, specialInstructions: notes }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (index: number, newQty: number) => {
    setCartItems((prev) =>
      prev
        .map((item, i) => (i === index ? { ...item, quantity: newQty } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleWishlist = (itemId: string) => {
    setWishlistIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleAddOrder = async (newOrder: Order) => {
    await saveItem('orders', newOrder, 'id');
    setCartItems([]);
    // Automatically deduct raw ingredients from inventory and log to Bin Card when order is created as Ready/Completed (POS Sales)
    if (newOrder.status === 'Ready' || newOrder.status === 'Completed') {
      await deductIngredientsForOrder(newOrder);
    }
  };

  const handleAddReservation = async (res: Reservation) => {
    await saveItem('reservations', res, 'id');
  };

  // Helper to calculate and deduct all ingredients from inventory when an order is made Ready in KDS or completed via POS
  const deductIngredientsForOrder = async (order: Order) => {
    // Map of inventoryId -> { invItem, totalDeductQty, products: Array<{ name, qty, perServing, unit, image }> }
    const deductionsMap = new Map<
      string,
      {
        invItem: InventoryItem;
        totalDeduct: number;
        products: Array<{ name: string; qty: number; perServing: number; unit: string; image?: string }>;
      }
    >();

    const orderStore = (order as any).storeName || undefined;

    for (const item of order.items) {
      const qty = item.quantity;
      // Look up live menuItem from menuItems state to ensure latest recipeIngredients and photo are used
      const menuItem =
        menuItems.find(
          (m) => m.id === item.menuItem.id || m.name.toLowerCase().trim() === item.menuItem.name.toLowerCase().trim()
        ) || item.menuItem;

      let usedRecipe = false;

      // Check for substitution in special instructions (e.g. "Subst: Oat Milk" or "Subst: Soy Milk")
      let substitutedName: string | undefined;
      if (item.specialInstructions && item.specialInstructions.includes('Subst:')) {
        const parts = item.specialInstructions.split('Subst:');
        if (parts[1]) {
          substitutedName = parts[1].split('|')[0].trim().replace(/^\[|\]$/g, '');
        }
      }

      // Helper function to find matching inventory item in registered store or fallback
      const findInventoryMatch = (
        ingName: string,
        invId?: string,
        sku?: string,
        preferredStore?: string
      ): InventoryItem | undefined => {
        const nameLower = ingName.toLowerCase().trim();
        const skuLower = sku ? sku.toLowerCase().trim() : undefined;
        const targetStore = preferredStore || orderStore;

        // 1. If an exact store is preferred/configured for this ingredient, search within that store first
        if (targetStore) {
          if (invId) {
            const idStoreMatch = inventory.find(
              (i) =>
                i.id === invId &&
                (i.storeName || 'Bole Main Central Store').toLowerCase().trim() === targetStore.toLowerCase().trim()
            );
            if (idStoreMatch) return idStoreMatch;
          }

          const storeMatch = inventory.find((i) => {
            const sameStore =
              (i.storeName || 'Bole Main Central Store').toLowerCase().trim() === targetStore.toLowerCase().trim();
            if (!sameStore) return false;
            const sameSku = skuLower && i.sku && i.sku.toLowerCase().trim() === skuLower;
            const sameName = i.name.toLowerCase().trim() === nameLower;
            const nameContains = i.name.toLowerCase().includes(nameLower) || nameLower.includes(i.name.toLowerCase());
            return sameSku || sameName || nameContains;
          });
          if (storeMatch) return storeMatch;
        }

        // 2. Match exact ID in inventory across any store
        if (invId) {
          const directMatch = inventory.find((i) => i.id === invId);
          if (directMatch) return directMatch;
        }

        // 3. Match SKU in any store
        if (skuLower) {
          const skuMatch = inventory.find((i) => i.sku && i.sku.toLowerCase().trim() === skuLower);
          if (skuMatch) return skuMatch;
        }

        // 4. Match exact name in any store
        const exactNameMatch = inventory.find((i) => i.name.toLowerCase().trim() === nameLower);
        if (exactNameMatch) return exactNameMatch;

        // 5. Match fuzzy / category keywords in any store
        return inventory.find((i) => {
          const iNameLower = i.name.toLowerCase().trim();
          return (
            iNameLower.includes(nameLower) ||
            nameLower.includes(iNameLower) ||
            (nameLower.includes('coffee') && (i.category.toLowerCase().includes('coffee') || iNameLower.includes('bean') || iNameLower.includes('arabica'))) ||
            (nameLower.includes('milk') && (i.category.toLowerCase().includes('milk') || iNameLower.includes('milk') || i.category.toLowerCase().includes('dairy'))) ||
            (nameLower.includes('butter') && iNameLower.includes('butter')) ||
            (nameLower.includes('flour') && iNameLower.includes('flour')) ||
            (nameLower.includes('sugar') && iNameLower.includes('sugar')) ||
            (nameLower.includes('chocolate') && (iNameLower.includes('chocolate') || iNameLower.includes('cocoa'))) ||
            (nameLower.includes('cup') && (i.category.toLowerCase().includes('packaging') || iNameLower.includes('cup')))
          );
        });
      };

      // Helper function for accurate unit conversion into inventory unit
      const convertUnitToInventory = (rawQty: number, sourceUnit: string, invUnit: string): number => {
        const sUnit = (sourceUnit || '').toLowerCase().trim();
        const iUnit = (invUnit || '').toLowerCase().trim();

        // Grams to Kg
        if ((iUnit === 'kg' || iUnit === 'kilo' || iUnit === 'kilogram') && (sUnit === 'g' || sUnit === 'gram' || sUnit === 'grams')) {
          return rawQty / 1000;
        }
        // Kg to Grams
        if ((iUnit === 'g' || iUnit === 'gram' || iUnit === 'grams') && (sUnit === 'kg' || sUnit === 'kilo' || sUnit === 'kilogram')) {
          return rawQty * 1000;
        }
        // Ml to Liters
        if ((iUnit === 'liters' || iUnit === 'liter' || iUnit === 'l') && (sUnit === 'ml' || sUnit === 'milliliter')) {
          return rawQty / 1000;
        }
        // Cl to Liters
        if ((iUnit === 'liters' || iUnit === 'liter' || iUnit === 'l') && (sUnit === 'cl')) {
          return rawQty / 100;
        }
        // Liters to Ml
        if ((iUnit === 'ml' || iUnit === 'milliliter') && (sUnit === 'liters' || sUnit === 'liter' || sUnit === 'l')) {
          return rawQty * 1000;
        }
        // Mg to Kg
        if ((iUnit === 'kg' || iUnit === 'kilo' || iUnit === 'kilogram') && (sUnit === 'mg')) {
          return rawQty / 1000000;
        }
        // Default direct match (pcs, units, same unit)
        return rawQty;
      };

      const recordDeduction = (invItem: InventoryItem, perServing: number, unit: string, customProductName?: string) => {
        const totalAmount = Math.round(perServing * qty * 10000) / 10000;
        const prodDisplayName = customProductName || menuItem.name;
        const existing = deductionsMap.get(invItem.id);
        if (existing) {
          existing.totalDeduct = Math.round((existing.totalDeduct + totalAmount) * 10000) / 10000;
          existing.products.push({
            name: prodDisplayName,
            qty,
            perServing,
            unit,
            image: menuItem.image,
          });
        } else {
          deductionsMap.set(invItem.id, {
            invItem,
            totalDeduct: totalAmount,
            products: [
              {
                name: prodDisplayName,
                qty,
                perServing,
                unit,
                image: menuItem.image,
              },
            ],
          });
        }
      };

      // Helper to process deduction and cascade down to raw components if it's a Special Ingredient
      const processInventoryItemDeduction = (
        matchedInv: InventoryItem,
        deductPerServing: number,
        unit: string,
        parentContext?: string
      ) => {
        // If matchedInv is a Special Ingredient with recipe components, cascade to all raw components
        const isSpecial = Boolean(
          matchedInv.isSpecialIngredient ||
            matchedInv.category === 'Special Ingredients' ||
            (matchedInv.recipeComponents && matchedInv.recipeComponents.length > 0)
        );

        if (isSpecial && matchedInv.recipeComponents && matchedInv.recipeComponents.length > 0) {
          const yieldQ = matchedInv.yieldQty && matchedInv.yieldQty > 0 ? matchedInv.yieldQty : 1;
          const fractionOfBatch = deductPerServing / yieldQ;

          for (const comp of matchedInv.recipeComponents) {
            const rawSubInv = findInventoryMatch(
              comp.ingredientName,
              comp.inventoryId,
              comp.sku,
              comp.storeName || matchedInv.storeName || orderStore
            );

            if (rawSubInv) {
              const rawPortion = comp.qty * fractionOfBatch;
              const convertedRawPortion = convertUnitToInventory(rawPortion, comp.unit, rawSubInv.unit);
              recordDeduction(
                rawSubInv,
                convertedRawPortion,
                rawSubInv.unit,
                `${menuItem.name} [via Special: ${matchedInv.name}]`
              );
            }
          }
        }

        // Deduct the inventory item itself
        recordDeduction(matchedInv, deductPerServing, unit, parentContext);
      };

      // 1. Check configured recipeIngredients directly on menuItem (Highest accuracy)
      if (menuItem.recipeIngredients && menuItem.recipeIngredients.length > 0) {
        for (const rIng of menuItem.recipeIngredients) {
          const ingNameToSearch =
            substitutedName && rIng.isMainIngredient ? substitutedName : rIng.ingredientName;

          const preferredStore = rIng.storeName || (rIng as any).store || orderStore;

          const matchedInv = findInventoryMatch(
            ingNameToSearch,
            rIng.inventoryId,
            rIng.sku,
            preferredStore
          );

          if (matchedInv) {
            const deductPerServing = convertUnitToInventory(rIng.qty, rIng.unit, matchedInv.unit);
            processInventoryItemDeduction(matchedInv, deductPerServing, matchedInv.unit);
            usedRecipe = true;
          }
        }
      }

      // 2. Check if there is an explicit Recipe in recipeCosts table
      if (!usedRecipe) {
        const rc = recipeCosts.find(
          (r) => r.menuItemId === menuItem.id || r.menuItemName.toLowerCase().trim() === menuItem.name.toLowerCase().trim()
        );

        if (rc && rc.ingredients && rc.ingredients.length > 0) {
          for (const ing of rc.ingredients) {
            const matchedInv = findInventoryMatch(
              ing.ingredientName,
              (ing as any).inventoryId,
              (ing as any).sku,
              (ing as any).storeName || orderStore
            );

            if (matchedInv) {
              const deductPerServing = convertUnitToInventory(ing.qty, ing.unit, matchedInv.unit);
              processInventoryItemDeduction(matchedInv, deductPerServing, matchedInv.unit);
              usedRecipe = true;
            }
          }
        }
      }

      // 3. Check menuItem.ingredients text array if recipe is not explicitly structured
      if (!usedRecipe && menuItem.ingredients && Array.isArray(menuItem.ingredients) && menuItem.ingredients.length > 0) {
        for (const ingName of menuItem.ingredients) {
          const ingNameToSearch = substitutedName && ingName.toLowerCase().includes('milk') ? substitutedName : ingName;
          const matchedInv = findInventoryMatch(ingNameToSearch, undefined, undefined, orderStore);

          if (matchedInv) {
            let portion = 0.02;
            const invUnit = (matchedInv.unit || '').toLowerCase().trim();
            const rawNameLower = matchedInv.name.toLowerCase();

            if (invUnit === 'kg' || invUnit === 'kilo') {
              if (rawNameLower.includes('coffee') || rawNameLower.includes('bean') || rawNameLower.includes('arabica')) {
                portion = 0.018;
              } else if (rawNameLower.includes('butter')) {
                portion = 0.03;
              } else if (rawNameLower.includes('chocolate') || rawNameLower.includes('cocoa')) {
                portion = 0.025;
              } else if (rawNameLower.includes('flour') || rawNameLower.includes('sugar')) {
                portion = 0.05;
              } else {
                portion = 0.02;
              }
            } else if (invUnit === 'liters' || invUnit === 'liter' || invUnit === 'l') {
              if (rawNameLower.includes('milk') || rawNameLower.includes('dairy')) {
                portion = menuItem.name.toLowerCase().includes('macchiato') ? 0.05 : 0.15;
              } else if (rawNameLower.includes('syrup')) {
                portion = 0.02;
              } else {
                portion = 0.1;
              }
            } else if (invUnit === 'pcs' || invUnit === 'units' || invUnit === 'unit') {
              portion = 1;
            }

            processInventoryItemDeduction(matchedInv, portion, matchedInv.unit);
            usedRecipe = true;
          }
        }
      }

      // 4. Fallback based on item category & standard portion rates
      if (!usedRecipe) {
        const itemCategory = menuItem.category ? menuItem.category.toLowerCase() : '';
        const itemName = menuItem.name ? menuItem.name.toLowerCase() : '';
        const isCoffeeDrink = ['coffee', 'espresso', 'latte', 'cappuccino', 'mocha', 'macchiato', 'americano', 'frappe'].some(
          (c) => itemCategory.includes(c) || itemName.includes(c)
        );
        const hasMilk = ['latte', 'cappuccino', 'mocha', 'macchiato', 'frappe', 'tea with milk'].some(
          (c) => itemCategory.includes(c) || itemName.includes(c)
        );
        const hasChocolate = itemName.includes('mocha') || itemName.includes('chocolate') || itemName.includes('cake');
        const isBakery = ['bakery', 'croissant', 'cake', 'pastry', 'cookie', 'bread', 'muffin'].some(
          (c) => itemCategory.includes(c) || itemName.includes(c)
        );

        // Coffee Beans (18g = 0.018 kg per serving)
        if (isCoffeeDrink) {
          const coffeeInv = findInventoryMatch('Coffee Beans', undefined, undefined, orderStore);
          if (coffeeInv) {
            const portion = convertUnitToInventory(18, 'g', coffeeInv.unit);
            processInventoryItemDeduction(coffeeInv, portion, coffeeInv.unit);
          }
        }

        // Milk (150ml = 0.15 liters per serving)
        if (hasMilk) {
          const milkToFind = substitutedName || 'Fresh Organic Whole Milk';
          const milkInv = findInventoryMatch(milkToFind, undefined, undefined, orderStore);
          if (milkInv) {
            const mlAmount = itemName.includes('macchiato') ? 50 : 150;
            const portion = convertUnitToInventory(mlAmount, 'ml', milkInv.unit);
            processInventoryItemDeduction(milkInv, portion, milkInv.unit);
          }
        }

        // Chocolate / Cocoa
        if (hasChocolate) {
          const chocInv = findInventoryMatch('Dark Chocolate Sauce', undefined, undefined, orderStore);
          if (chocInv) {
            const portion = convertUnitToInventory(30, 'g', chocInv.unit);
            processInventoryItemDeduction(chocInv, portion, chocInv.unit);
          }
        }

        // Flour & Butter for Bakery
        if (isBakery) {
          const flourInv = findInventoryMatch('Specialty Pastry Flour', undefined, undefined, orderStore || 'Kazanchis Bakery Lab & Cold Room');
          if (flourInv) {
            const portion = convertUnitToInventory(60, 'g', flourInv.unit);
            processInventoryItemDeduction(flourInv, portion, flourInv.unit);
          }
          const butterInv = findInventoryMatch('French Butter', undefined, undefined, orderStore || 'Kazanchis Bakery Lab & Cold Room');
          if (butterInv) {
            const portion = convertUnitToInventory(30, 'g', butterInv.unit);
            processInventoryItemDeduction(butterInv, portion, butterInv.unit);
          }
        }

        // Eco Packaging Cup
        if (isCoffeeDrink || hasMilk) {
          const cupInv = findInventoryMatch('Eco Takeaway Paper Cups', undefined, undefined, orderStore);
          if (cupInv) {
            processInventoryItemDeduction(cupInv, 1, cupInv.unit);
          }
        }
      }
    }

    // Execute atomic inventory updates and record explicit Store Bin Card entries
    for (const [, record] of deductionsMap.entries()) {
      const invItem = record.invItem;
      if (invItem && record.totalDeduct > 0) {
        const roundedDeduction = Math.round(record.totalDeduct * 1000) / 1000;
        const updatedStockQty = Math.max(0, Math.round((invItem.stockQty - roundedDeduction) * 1000) / 1000);
        const updatedItem: InventoryItem = {
          ...invItem,
          stockQty: updatedStockQty,
        };
        await saveItem('inventory', updatedItem, 'id');

        const productSummary = record.products
          .map((p) => `${p.qty}x ${p.name} (${p.perServing} ${p.unit}/serving)`)
          .join(', ');

        const productNamesList = record.products.map((p) => `${p.qty}x ${p.name}`).join(', ');
        const firstImage = record.products[0]?.image;

        // Create explicit Bin Card ledger entry for the POS sales deduction in the exact store with product photo
        const binEntry: BinCardEntry = {
          id: `BIN-ORD-${Date.now()}-${invItem.id.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`,
          inventoryId: invItem.id,
          storeName: invItem.storeName || 'Bole Main Central Store',
          date: new Date().toISOString().split('T')[0],
          transactionType: 'Order Sales Consumption',
          referenceId: order.id,
          productName: productNamesList,
          productImage: firstImage,
          qtyIn: 0,
          qtyOut: roundedDeduction,
          balanceAfter: updatedStockQty,
          unit: invItem.unit,
          notes: `POS Sales Consumption [${order.id}]: ${productSummary} (Deducted from ${invItem.storeName || 'Store'})`,
        };
        await saveItem('binCards', binEntry, 'id');
      }
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: any) => {
    const target = orders.find((o) => o.id === id);
    if (target) {
      // If transitioning to Ready or Completed for the first time, automatically deduct ingredients from inventory!
      if ((status === 'Ready' || status === 'Completed') && target.status !== 'Ready' && target.status !== 'Completed') {
        await deductIngredientsForOrder(target);
      }
      await saveItem('orders', { ...target, status }, 'id');
    }
  };

  const handleUpdateStock = async (id: string, change: number, action: 'add' | 'subtract', newExpiryDate?: string) => {
    const target = inventory.find((i) => i.id === id);
    if (target) {
      const newQty = action === 'add' ? target.stockQty + change : Math.max(0, target.stockQty - change);
      const updated = {
        ...target,
        stockQty: newQty,
        lastRestocked: action === 'add' ? new Date().toISOString().split('T')[0] : target.lastRestocked,
        expiryDate: newExpiryDate !== undefined ? newExpiryDate : target.expiryDate,
      };
      await saveItem('inventory', updated, 'id');
    }
  };

  const handleAddInventoryItem = async (newItemData: Partial<InventoryItem>) => {
    const newItem: InventoryItem = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      name: newItemData.name || 'Raw Material',
      category: newItemData.category || 'Coffee Beans',
      brand: newItemData.brand || 'Local Specialty',
      sku: newItemData.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      stockQty: Number(newItemData.stockQty) || 0,
      unit: newItemData.unit || 'kg',
      reorderLevel: Number(newItemData.reorderLevel) || 10,
      costPerUnit: Number(newItemData.costPerUnit) || 100,
      supplierName: newItemData.supplierName || 'Primary Supplier',
      lastRestocked: new Date().toISOString().split('T')[0],
      hasExpiry: Boolean(newItemData.hasExpiry),
      expiryDate: newItemData.hasExpiry ? newItemData.expiryDate : undefined,
      image: newItemData.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80',
    };
    await saveItem('inventory', newItem, 'id');
  };

  const handleDeleteInventoryItem = async (id: string) => {
    await deleteItem('inventory', id);
    // Cascade delete any orphaned bin card entries for this deleted item
    const orphanedBinCards = binCards.filter((b) => b.inventoryId === id);
    for (const b of orphanedBinCards) {
      await deleteItem('binCards', b.id);
    }
  };

  const handleUpdateInventoryItem = async (updatedItem: InventoryItem) => {
    await saveItem('inventory', updatedItem, 'id');
  };

  const handleProduceSpecialIngredient = async (
    specialItemData: Partial<InventoryItem>,
    components: SpecialIngredientComponent[],
    options: { deductStock: boolean; notes?: string }
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const targetStore = specialItemData.storeName || 'Bole Main Central Store';
    const batchVoucherId = `SPV-${Date.now().toString().slice(-4)}`;

    // 1. Deduct component stocks and log Bin Card ledger entries if requested
    if (options.deductStock) {
      for (const comp of components) {
        const invItem = inventory.find((i) => i.id === comp.inventoryId);
        if (invItem && comp.qty > 0) {
          const newQty = Math.max(0, Math.round((invItem.stockQty - comp.qty) * 1000) / 1000);
          await saveItem('inventory', { ...invItem, stockQty: newQty }, 'id');

          // Add Bin Card Out Entry
          const binOut: BinCardEntry = {
            id: `BIN-SPV-OUT-${Date.now()}-${invItem.id.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`,
            inventoryId: invItem.id,
            storeName: invItem.storeName || targetStore,
            date: today,
            transactionType: 'Special Prep Production',
            referenceId: batchVoucherId,
            productName: specialItemData.name,
            productImage: specialItemData.image,
            qtyIn: 0,
            qtyOut: comp.qty,
            balanceAfter: newQty,
            unit: invItem.unit,
            notes: `Consumed for batch production of ${specialItemData.name} (${specialItemData.stockQty} ${specialItemData.unit})`,
          };
          await saveItem('binCards', binOut, 'id');
        }
      }
    }

    // 2. Check if a special ingredient with the exact same name & store already exists in inventory
    const existingSpecial = inventory.find(
      (i) =>
        i.name.toLowerCase().trim() === (specialItemData.name || '').toLowerCase().trim() &&
        (i.storeName || 'Bole Main Central Store').toLowerCase().trim() === targetStore.toLowerCase().trim()
    );

    let producedInvItem: InventoryItem;

    if (existingSpecial) {
      // Top up stock & update weighted average cost
      const newStock = Math.round((existingSpecial.stockQty + (Number(specialItemData.stockQty) || 0)) * 1000) / 1000;
      const totalOldVal = existingSpecial.stockQty * existingSpecial.costPerUnit;
      const totalNewBatchVal = (Number(specialItemData.stockQty) || 0) * (Number(specialItemData.costPerUnit) || 0);
      const blendedCost =
        newStock > 0
          ? Math.round(((totalOldVal + totalNewBatchVal) / newStock) * 100) / 100
          : Number(specialItemData.costPerUnit) || 0;

      producedInvItem = {
        ...existingSpecial,
        stockQty: newStock,
        costPerUnit: blendedCost,
        lastRestocked: today,
        expiryDate: specialItemData.expiryDate || existingSpecial.expiryDate,
        image: specialItemData.image || existingSpecial.image,
        isSpecialIngredient: true,
        recipeComponents: components,
        yieldQty: specialItemData.yieldQty,
        yieldUnit: specialItemData.yieldUnit,
        reorderLevel: Number(specialItemData.reorderLevel) || existingSpecial.reorderLevel,
      };
      await saveItem('inventory', producedInvItem, 'id');
    } else {
      // Create new InventoryItem
      producedInvItem = {
        id: `INV-SP-${Date.now().toString().slice(-4)}`,
        name: specialItemData.name || 'Special Compound Ingredient',
        category: specialItemData.category || 'Special Ingredients',
        brand: specialItemData.brand || 'In-House Special',
        sku: specialItemData.sku || `SP-${Math.floor(1000 + Math.random() * 9000)}`,
        stockQty: Number(specialItemData.stockQty) || 0,
        unit: specialItemData.unit || 'kg',
        reorderLevel: Number(specialItemData.reorderLevel) || 2,
        costPerUnit: Number(specialItemData.costPerUnit) || 0,
        supplierName: specialItemData.supplierName || 'In-House Kitchen Production',
        lastRestocked: today,
        hasExpiry: Boolean(specialItemData.hasExpiry),
        expiryDate: specialItemData.expiryDate,
        image:
          specialItemData.image ||
          'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=600&q=80',
        storeName: targetStore,
        isSpecialIngredient: true,
        recipeComponents: components,
        yieldQty: specialItemData.yieldQty,
        yieldUnit: specialItemData.yieldUnit,
      };
      await saveItem('inventory', producedInvItem, 'id');
    }

    // 3. Add Bin Card In Entry for the newly created / topped-up special ingredient
    const binIn: BinCardEntry = {
      id: `BIN-SPV-IN-${Date.now()}-${producedInvItem.id.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`,
      inventoryId: producedInvItem.id,
      storeName: targetStore,
      date: today,
      transactionType: 'In-House Batch Production',
      referenceId: batchVoucherId,
      productName: producedInvItem.name,
      productImage: producedInvItem.image,
      qtyIn: Number(specialItemData.stockQty) || 0,
      qtyOut: 0,
      balanceAfter: producedInvItem.stockQty,
      unit: producedInvItem.unit,
      notes: `Batch produced in ${targetStore}. Total Material Cost: ${(
        (Number(specialItemData.stockQty) || 0) * (Number(specialItemData.costPerUnit) || 0)
      ).toFixed(2)} ETB`,
    };
    await saveItem('binCards', binIn, 'id');
  };

  const handleAddBinCardEntry = async (entryData: Partial<BinCardEntry>) => {
    const newEntry: BinCardEntry = {
      id: entryData.id || `BIN-${Date.now().toString().slice(-4)}`,
      inventoryId: entryData.inventoryId || '',
      storeName: entryData.storeName || 'Bole Main Central Store',
      date: entryData.date || new Date().toISOString().split('T')[0],
      transactionType: entryData.transactionType || 'Stock In',
      referenceId: entryData.referenceId || `VOUCHER-${Date.now().toString().slice(-4)}`,
      productName: entryData.productName || undefined,
      productImage: entryData.productImage || undefined,
      qtyIn: Number(entryData.qtyIn) || 0,
      qtyOut: Number(entryData.qtyOut) || 0,
      balanceAfter: Number(entryData.balanceAfter) || 0,
      unit: entryData.unit || 'kg',
      notes: entryData.notes || undefined,
    };
    await saveItem('binCards', newEntry, 'id');

    // Also update the inventory item stock quantity if needed
    if (entryData.inventoryId) {
      const invItem = inventory.find((i) => i.id === entryData.inventoryId);
      if (invItem) {
        let newStock = invItem.stockQty;
        if (newEntry.qtyIn > 0) newStock += newEntry.qtyIn;
        if (newEntry.qtyOut > 0) newStock = Math.max(0, newStock - newEntry.qtyOut);
        await saveItem('inventory', { ...invItem, stockQty: Math.round(newStock * 1000) / 1000 }, 'id');
      }
    }
  };

  const handleDeleteBinCardEntry = async (id: string) => {
    await deleteItem('binCards', id);
  };

  const handleAddMenuItem = async (item: Partial<MenuItem>) => {
    const isSpecialItem = Boolean(item.isSpecial || item.isFeatured);
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: item.name || 'New Coffee Specialty',
      category: item.category || 'Coffee',
      price: item.price || 120,
      currency: 'ETB',
      image: item.image || 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80',
      description: item.description || 'Artisan preparation',
      ingredients: item.ingredients || ['Specialty Beans'],
      recipeIngredients: item.recipeIngredients || [],
      calories: item.calories || 150,
      prepTimeMinutes: item.prepTimeMinutes || 5,
      isAvailable: item.isAvailable ?? true,
      isSpecial: isSpecialItem,
      isFeatured: isSpecialItem,
      rating: 5.0,
      reviewsCount: 1,
      barcode: item.barcode || 'CL-NEW-01',
    };
    await saveItem('menuItems', newItem, 'id');
  };

  const handleDeleteMenuItem = async (id: string) => {
    await deleteItem('menuItems', id);
  };

  const handleUpdateMenuItem = async (item: MenuItem) => {
    await saveItem('menuItems', item, 'id');
  };

  // ERP Category Handlers
  const handleAddCategory = async (newCat: CategoryRecord) => {
    await saveItem('categories', newCat, 'id');
  };

  const handleUpdateCategory = async (cat: CategoryRecord) => {
    await saveItem('categories', cat, 'id');
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteItem('categories', id);
  };

  // ERP Store Handlers
  const handleAddStore = async (newStore: StoreRecord) => {
    await saveItem('stores', newStore, 'id');
  };

  const handleDeleteStore = async (id: string) => {
    await deleteItem('stores', id);
  };

  // ERP Store Request Handlers
  const handleAddStoreRequest = async (req: StoreRequestVoucher) => {
    await saveItem('storeRequests', req, 'voucherId');
  };

  const handleUpdateStoreRequest = async (req: StoreRequestVoucher) => {
    await saveItem('storeRequests', req, 'voucherId');
  };

  const handleDeleteStoreRequest = async (voucherId: string) => {
    await deleteItem('storeRequests', voucherId);
  };

  const handleApproveStoreRequest = async (req: StoreRequestVoucher, approverName?: string) => {
    const transferVoucherId = `TRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDateStr = new Date().toISOString().split('T')[0];

    const fromStore = req.targetStore || 'Bole Main Central Store';
    const toStore = req.requestingStore || req.department || 'Kitchen & Bakery Sub-Store';

    // 1. Create linked Store Transfer Voucher
    const newTransfer: StoreTransferVoucher = {
      voucherId: transferVoucherId,
      date: currentDateStr,
      fromStore,
      toStore,
      transferredBy: approverName || 'Store Manager Dawit',
      driverOrHandler: 'Internal Store Handler',
      remark: `Auto-generated transfer for Approved Requisition ${req.voucherId}: ${req.remark || ''}`,
      createdTime: currentTimeStr,
      linkedRequisitionId: req.voucherId,
      status: 'Completed',
      items: req.items.map((it) => ({
        inventoryId: it.inventoryId,
        ingredientName: it.ingredientName,
        sku: it.sku,
        qtyTransferred: it.qtyRequested,
        unit: it.unit,
      })),
    };

    // Execute atomic 2-way store transfer with bin cards
    const transferResult = await executeStoreTransfer(newTransfer, inventory, { saveItem, deleteItem });

    if (transferResult.success) {
      // 2. Update Store Request status to Approved & linked to Transfer
      const updatedRequest: StoreRequestVoucher = {
        ...req,
        status: 'Approved',
        linkedTransferVoucherId: transferVoucherId,
        approvedBy: approverName || 'Store Manager Dawit',
        approvedAt: `${currentDateStr} ${currentTimeStr}`,
      };
      await saveItem('storeRequests', updatedRequest, 'voucherId');
    } else {
      console.error('Store Request transfer failed:', transferResult.error);
      alert(`Transfer execution failed: ${transferResult.error}`);
    }
  };

  const handleDenyStoreRequest = async (voucherId: string, reason?: string) => {
    const target = storeRequests.find((r) => r.voucherId === voucherId);
    if (target) {
      const updated: StoreRequestVoucher = {
        ...target,
        status: 'Rejected',
        rejectionReason: reason || 'Requisition denied by Store Keeper / Manager',
      };
      await saveItem('storeRequests', updated, 'voucherId');
    }
  };

  // ERP Store Transfer Handlers
  const handleAddStoreTransfer = async (tr: StoreTransferVoucher) => {
    const result = await executeStoreTransfer(tr, inventory, { saveItem, deleteItem });
    if (!result.success) {
      console.error('Transfer failed:', result.error);
      alert(`Transfer failed: ${result.error}`);
    }
  };

  const handleUpdateStoreTransfer = async (tr: StoreTransferVoucher) => {
    const oldTr = storeTransfers.find((t) => t.voucherId === tr.voucherId);
    if (oldTr) {
      const result = await updateStoreTransfer(oldTr, tr, inventory, binCards, { saveItem, deleteItem });
      if (!result.success) {
        console.error('Transfer update failed:', result.error);
        alert(`Transfer update failed: ${result.error}`);
      }
    } else {
      await handleAddStoreTransfer(tr);
    }
  };

  const handleDeleteStoreTransfer = async (voucherId: string) => {
    const targetTr = storeTransfers.find((t) => t.voucherId === voucherId);
    if (targetTr) {
      const result = await deleteStoreTransfer(targetTr, inventory, binCards, { saveItem, deleteItem });
      if (!result.success) {
        console.error('Transfer deletion/reversal failed:', result.error);
        alert(`Transfer cancellation failed: ${result.error}`);
      }
    } else {
      await deleteItem('storeTransfers', voucherId, 'voucherId');
    }
  };

  // ERP POS Receipt Handlers
  const handleSavePOSReceipt = async (rcpt: POSReceiptVoucher) => {
    await saveItem('posReceipts', rcpt, 'voucherId');
  };

  const handleUpdatePOSReceipt = async (rcpt: POSReceiptVoucher) => {
    await saveItem('posReceipts', rcpt, 'voucherId');
  };

  const handleDeletePOSReceipt = async (voucherId: string) => {
    await deleteItem('posReceipts', voucherId);
  };

  // ERP Order Management Handlers
  const handleDeleteOrder = async (orderId: string) => {
    await deleteItem('orders', orderId);
  };

  // Clear Expired Stock Batch Handler
  const handleClearExpiredStock = async (id: string) => {
    const target = inventory.find((i) => i.id === id);
    if (target) {
      await saveItem('inventory', { ...target, stockQty: 0, expiryDate: undefined }, 'id');
    }
  };

  // ERP Customer Handlers
  const handleAddCustomer = async (newCust: Customer) => {
    await saveItem('customers', newCust, 'id');
  };

  // ERP Supplier & PO Handlers
  const handleAddSupplier = async (supplier: Supplier) => {
    await saveItem('suppliers', supplier, 'id');
  };

  const handleCreatePO = async (po: PurchaseOrder) => {
    await saveItem('purchaseOrders', po, 'id');
  };

  // HR Employee Handlers
  const handleAddEmployee = async (emp: Employee) => {
    await saveItem('employees', emp, 'id');
  };

  const handleDeleteEmployee = async (id: string) => {
    await deleteItem('employees', id);
  };

  // Stock In Voucher Intake Handler (Updates stock quantity and dynamic unit cost!)
  const handleAddStockInVoucher = async (voucher: StockInVoucher) => {
    await saveItem('stockInVouchers', voucher, 'voucherId');

    // Update matching inventory items stock quantity AND unit cost in Firebase
    for (const it of voucher.items) {
      const invItem = inventory.find(
        (i) =>
          i.id === it.inventoryId ||
          i.name.toLowerCase().trim() === it.ingredientName.toLowerCase().trim() ||
          (it.sku && i.sku && i.sku.toLowerCase().trim() === it.sku.toLowerCase().trim()) ||
          i.name.toLowerCase().includes(it.ingredientName.toLowerCase()) ||
          it.ingredientName.toLowerCase().includes(i.name.toLowerCase())
      );

      if (invItem) {
        const newStock = Math.round((invItem.stockQty + it.qty) * 1000) / 1000;
        const updated = {
          ...invItem,
          stockQty: newStock,
          costPerUnit: it.unitCost,
          lastRestocked: voucher.date,
          expiryDate: it.hasExpiry && it.expiryDate ? it.expiryDate : invItem.expiryDate,
        };
        await saveItem('inventory', updated, 'id');

        // Create explicit Bin Card ledger entry for Stock In intake
        const binEntry: BinCardEntry = {
          id: `BIN-GRN-${Date.now()}-${invItem.id.slice(-4)}`,
          inventoryId: invItem.id,
          storeName: voucher.receivingStore || invItem.storeName || 'Bole Main Central Store',
          date: voucher.date || new Date().toISOString().split('T')[0],
          transactionType: 'Stock In',
          referenceId: voucher.voucherId,
          qtyIn: it.qty,
          qtyOut: 0,
          balanceAfter: newStock,
          unit: it.unit || invItem.unit,
          notes: `GRN Intake from ${voucher.supplierName || 'Supplier'} (FS: ${voucher.fsNumber || 'Direct'}${voucher.remark ? ` - ${voucher.remark}` : ''})`,
        };
        await saveItem('binCards', binEntry, 'id');
      }
    }
  };

  const handleUpdateStockInVoucher = async (voucher: StockInVoucher) => {
    await saveItem('stockInVouchers', voucher, 'voucherId');
  };

  const handleDeleteStockInVoucher = async (voucherId: string) => {
    await deleteItem('stockInVouchers', voucherId);
  };

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const discountAmount = couponCode === 'LINA10' ? Math.round(subtotal * 0.1) : 0;
  const wishlistedItems = menuItems.filter((i) => wishlistIds.includes(i.id));

  // Render ERP vs Public Website
  if (isERPView) {
    return (
      <ERPLayout
        currentUserRole={currentUserRole}
        setCurrentUserRole={setCurrentUserRole}
        activeModule={activeERPModule}
        setActiveModule={setActiveERPModule}
        onExitERP={() => setIsERPView(false)}
      >
        {activeERPModule === 'dashboard' && (
          <AdminDashboard
            orders={orders}
            menuItems={menuItems}
            eprRecords={eprRecords}
            onNavigateModule={setActiveERPModule}
          />
        )}
        {activeERPModule === 'pos' && (
          <POSSystem
            menuItems={menuItems}
            inventory={inventory}
            stores={stores}
            posReceipts={posReceipts}
            onCompletePOSOrder={handleAddOrder}
            onSavePOSReceipt={handleSavePOSReceipt}
            onUpdatePOSReceipt={handleUpdatePOSReceipt}
            onDeletePOSReceipt={handleDeletePOSReceipt}
          />
        )}
        {activeERPModule === 'order_vouchers' && (
          <OrderVouchersERP
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
          />
        )}
        {activeERPModule === 'kds' && (
          <KitchenDisplaySystem
            orders={orders}
            inventory={inventory}
            recipeCosts={recipeCosts}
            stores={stores}
            storeRequests={storeRequests}
            onAddStoreRequest={handleAddStoreRequest}
            onUpdateStoreRequest={handleUpdateStoreRequest}
            onDeleteStoreRequest={handleDeleteStoreRequest}
            onUpdateStatus={handleUpdateOrderStatus}
            currentUserName={loggedInUser?.name || 'Kitchen Head Chef'}
            currentUserRole={currentUserRole}
          />
        )}
        {activeERPModule === 'orders' && (
          <LiveOrdersQueue
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}
        {activeERPModule === 'inventory' && (
          <InventoryERP
            inventory={inventory}
            stores={stores}
            onUpdateStock={handleUpdateStock}
            onAddInventoryItem={handleAddInventoryItem}
            onUpdateInventoryItem={handleUpdateInventoryItem}
            onDeleteInventoryItem={handleDeleteInventoryItem}
            onProduceSpecialIngredient={handleProduceSpecialIngredient}
          />
        )}
        {activeERPModule === 'bincard' && (
          <BinCardERP
            inventory={inventory}
            binCards={binCards}
            orders={orders}
            stores={stores}
            menuItems={menuItems}
            recipeCosts={recipeCosts}
            stockInVouchers={stockInVouchers}
            damageVouchers={damageVouchers}
            storeTransfers={storeTransfers}
            storeRequests={storeRequests}
            onAddBinCardEntry={handleAddBinCardEntry}
            onDeleteBinCardEntry={handleDeleteBinCardEntry}
            onUpdateStock={handleUpdateStock}
          />
        )}
        {activeERPModule === 'store_balance' && (
          <StoreBalanceExpiryERP
            inventory={inventory}
            stores={stores}
            onDeleteExpiredItem={handleDeleteInventoryItem}
            onClearExpiredStock={handleClearExpiredStock}
          />
        )}
        {activeERPModule === 'store_requests' && (
          <StoreRequestERP
            inventory={inventory}
            stores={stores}
            requests={storeRequests}
            onAddRequest={handleAddStoreRequest}
            onUpdateRequest={handleUpdateStoreRequest}
            onDeleteRequest={handleDeleteStoreRequest}
            onApproveRequest={handleApproveStoreRequest}
            onDenyRequest={handleDenyStoreRequest}
          />
        )}
        {activeERPModule === 'store_transfers' && (
          <StoreTransferERP
            inventory={inventory}
            stores={stores}
            transfers={storeTransfers}
            binCards={binCards}
            onAddTransfer={handleAddStoreTransfer}
            onUpdateTransfer={handleUpdateStoreTransfer}
            onDeleteTransfer={handleDeleteStoreTransfer}
            currentUserRole={currentUserRole}
            currentUserName={loggedInUser?.name || 'Store Manager Dawit'}
            saveItem={saveItem}
            deleteItem={deleteItem}
          />
        )}
        {activeERPModule === 'damage' && (
          <DamageERP
            inventory={inventory}
            menuItems={menuItems}
            stores={stores}
            damageVouchers={damageVouchers}
            onAddDamageVoucher={handleAddDamageVoucher}
            onUpdateDamageVoucher={handleUpdateDamageVoucher}
            onDeleteDamageVoucher={handleDeleteDamageVoucher}
          />
        )}
        {activeERPModule === 'staff_food' && (
          <StaffFoodERP
            menuItems={menuItems}
            staffMeals={staffMeals}
            onAddStaffMeal={handleAddStaffMeal}
            onDeleteStaffMeal={handleDeleteStaffMeal}
          />
        )}
        {activeERPModule === 'product_costing' && (
          <ProductCostingERP
            inventory={inventory}
            menuItems={menuItems}
            stores={stores}
            categories={categories}
            onAddCategory={handleAddCategory}
            onAddMenuItem={handleAddMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
          />
        )}
        {activeERPModule === 'stock_in' && (
          <StockInVoucherERP
            inventory={inventory}
            suppliers={suppliers}
            stores={stores}
            stockInVouchers={stockInVouchers}
            onAddStockInVoucher={handleAddStockInVoucher}
            onUpdateStockInVoucher={handleUpdateStockInVoucher}
            onDeleteStockInVoucher={handleDeleteStockInVoucher}
          />
        )}
        {activeERPModule === 'categories' && (
          <CategoriesERP
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}
        {activeERPModule === 'stores' && (
          <StoresERP
            stores={stores}
            inventory={inventory}
            stockInVouchers={stockInVouchers}
            storeTransfers={storeTransfers}
            storeRequests={storeRequests}
            damageVouchers={damageVouchers}
            binCards={binCards}
            onAddStore={handleAddStore}
            onDeleteStore={handleDeleteStore}
            onNavigateModule={setActiveERPModule}
          />
        )}
        {activeERPModule === 'suppliers' && (
          <SupplierERP
            suppliers={suppliers}
            purchaseOrders={purchaseOrders}
            onAddSupplier={handleAddSupplier}
            onCreatePO={handleCreatePO}
          />
        )}
        {activeERPModule === 'customers' && (
          <CustomersERP
            customers={customers}
            orders={orders}
            onAddCustomer={handleAddCustomer}
          />
        )}
        {activeERPModule === 'menu_mgr' && (
          <MenuManagement
            menuItems={menuItems}
            onAddItem={handleAddMenuItem}
            onUpdateItem={handleUpdateMenuItem}
            onDeleteItem={handleDeleteMenuItem}
          />
        )}
        {activeERPModule === 'recipes' && <RecipeCosting recipeCosts={recipeCosts} />}
        {activeERPModule === 'hr' && (
          <HRModule
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}
        {activeERPModule === 'epr' && <EPRModule records={eprRecords} />}
        {activeERPModule === 'reports' && (
          <ReportsERP
            orders={orders}
            posReceipts={posReceipts}
            damageVouchers={damageVouchers}
            inventory={inventory}
          />
        )}
        {activeERPModule === 'qr_generator' && (
          <QRGeneratorPage onNavigateMenu={() => setActiveTab('menu')} />
        )}
        {activeERPModule === 'settings' && (
          <SettingsResetERP
            users={systemUsers}
            onAddUser={handleAddSystemUser}
            onUpdateUser={handleUpdateSystemUser}
            onDeleteUser={handleDeleteSystemUser}
            onSystemReset={handleSystemReset}
            onSignOut={() => setIsERPView(false)}
          />
        )}

        {/* Staff Authentication Modal inside ERP view */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          targetRole={authTargetRole}
          systemUsers={systemUsers}
          onLoginSuccess={handleLoginSuccess}
        />
      </ERPLayout>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FDFBF7]">
      {/* Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        setIsCartOpen={setIsCartOpen}
        setIsAuthModalOpen={handleOpenAuthModal}
        currentUserRole={currentUserRole}
        setCurrentUserRole={setCurrentUserRole}
        isERPView={isERPView}
        setIsERPView={setIsERPView}
        loggedInUser={loggedInUser}
        onSignOut={handleSignOut}
      />

      {/* Staff Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        targetRole={authTargetRole}
        systemUsers={systemUsers}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Dynamic View Router */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <HeroSection
              onExploreMenu={() => setActiveTab('menu')}
              onReserveTable={() => setActiveTab('reservations')}
            />
            <TodaysSpecials
              specials={menuItems.filter((i) => i.isSpecial || i.isFeatured)}
              onAddToCart={handleAddToCart}
              onQuickView={(item) => handleAddToCart(item)}
              toggleWishlist={toggleWishlist}
              wishlistIds={wishlistIds}
            />
          </>
        )}

        {activeTab === 'menu' && (
          <MenuView
            menuItems={menuItems}
            onAddToCart={handleAddToCart}
            wishlistIds={wishlistIds}
            toggleWishlist={toggleWishlist}
            isAdmin={
              currentUserRole === 'Admin' ||
              currentUserRole === 'Manager' ||
              Boolean(loggedInUser && ['Admin', 'Manager'].includes(loggedInUser.role))
            }
            onAddItem={handleAddMenuItem}
            onUpdateItem={handleUpdateMenuItem}
            onDeleteItem={handleDeleteMenuItem}
            categories={categories}
            onOpenQR={() => setActiveTab('qr')}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'qr' && (
          <QRGeneratorPage onNavigateMenu={() => setActiveTab('menu')} />
        )}

        {activeTab === 'reservations' && (
          <ReservationSection onAddReservation={handleAddReservation} />
        )}

        {activeTab === 'customer' && (
          <CustomerPortal
            customer={customers[0]}
            orders={orders}
            wishlistItems={wishlistedItems}
            onRemoveWishlist={toggleWishlist}
            onAddToCart={handleAddToCart}
          />
        )}

        {activeTab === 'about' && <AboutPage />}
        {activeTab === 'gallery' && <GalleryPage />}
        {activeTab === 'blog' && <BlogPage posts={INITIAL_BLOG_POSTS} />}
        {activeTab === 'careers' && <CareerPage careers={INITIAL_CAREERS} />}
        {activeTab === 'contact' && <ContactPage />}
        {activeTab === 'privacy' && <PrivacyTermsPages type="privacy" />}
        {activeTab === 'terms' && <PrivacyTermsPages type="terms" />}
        {![
          'home',
          'menu',
          'qr',
          'reservations',
          'customer',
          'about',
          'gallery',
          'blog',
          'careers',
          'contact',
          'privacy',
          'terms',
        ].includes(activeTab) && <NotFoundPage onGoHome={() => setActiveTab('home')} />}
      </main>

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        discountAmount={discountAmount}
        deliveryType={deliveryType}
        setDeliveryType={setDeliveryType}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        deliveryType={deliveryType}
        discountAmount={discountAmount}
        couponCode={couponCode}
        onOrderCompleted={handleAddOrder}
      />

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} setIsERPView={setIsERPView} />
    </div>
  );
}
