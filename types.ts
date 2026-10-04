export type Category =
  | 'Coffee'
  | 'Espresso'
  | 'Latte'
  | 'Cappuccino'
  | 'Mocha'
  | 'Macchiato'
  | 'Americano'
  | 'Tea'
  | 'Breakfast'
  | 'Main Course'
  | 'Bakery'
  | 'Cake'
  | 'Dessert'
  | 'Pizza'
  | 'Burger'
  | 'Pasta'
  | 'Salad'
  | 'Sandwich'
  | 'Drinks'
  | 'Fresh Juice'
  | 'Juice'
  | 'Soft Drink'
  | 'Special'
  | (string & {});

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  subcategory?: string;
  price: number;
  currency: string;
  image: string;
  description: string;
  ingredients: string[];
  calories: number;
  prepTimeMinutes: number;
  isAvailable: boolean;
  rating: number;
  reviewsCount: number;
  isSpecial?: boolean;
  isFeatured?: boolean;
  barcode?: string;
  recipeIngredients?: ProductRecipeItem[];
}

export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Out for Delivery' | 'Completed' | 'Cancelled';
export type PaymentMethod = 'Stripe' | 'PayPal' | 'Cash' | 'Bank Transfer';
export type DeliveryType = 'Delivery' | 'Pickup';

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  selectedOptions?: string[];
  specialInstructions?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  storeName?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryMinutes?: number;
  notes?: string;
  couponCode?: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  seatingPreference: 'Indoors' | 'Terrace' | 'Private Booth' | 'Bar Area';
  specialRequests?: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Seated';
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  rewardPoints: number;
  totalSpent: number;
  wishlistIds: string[];
  ordersCount: number;
  joinedDate: string;
}

export type UserRole = 'Admin' | 'Manager' | 'Cashier' | 'Kitchen' | 'Customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: 'Barista' | 'Kitchen' | 'Service' | 'Management' | 'Delivery';
  email: string;
  phone: string;
  salary: number;
  currency: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  shift: 'Morning' | 'Afternoon' | 'Night' | 'Full Day';
  joinDate: string;
  attendanceRate: number; // percentage
}

export interface SpecialIngredientComponent {
  inventoryId: string;
  ingredientName: string;
  sku: string;
  image?: string;
  qty: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  storeName?: string;
}

export interface SpecialIngredientRecipe {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand?: string;
  components: SpecialIngredientComponent[];
  totalBatchCost: number;
  yieldQty: number;
  yieldUnit: string;
  costPerUnit: number;
  reorderLevel: number;
  storeName: string;
  image: string;
  hasExpiry: boolean;
  expiryDays?: number;
  expiryDate?: string;
  notes?: string;
  createdDate: string;
  producedBatchesCount?: number;
  lastProducedDate?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  stockQty: number;
  unit: string;
  reorderLevel: number;
  costPerUnit: number;
  supplierName: string;
  lastRestocked: string;
  expiryDate?: string;
  hasExpiry?: boolean;
  brand?: string;
  image?: string;
  storeName?: string;
  isSpecialIngredient?: boolean;
  recipeComponents?: SpecialIngredientComponent[];
  yieldQty?: number;
  yieldUnit?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  category: string;
  rating: number;
  address: string;
  paymentTerms: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: { itemName: string; qty: number; unitCost: number; total: number }[];
  totalCost: number;
  currency: string;
  status: 'Draft' | 'Sent' | 'Received' | 'Cancelled';
  orderDate: string;
  expectedDelivery: string;
}

export interface RecipeIngredient {
  ingredientName: string;
  qty: number;
  unit: string;
  costPerUnit: number;
}

export interface CategoryRecord {
  id: string;
  name: string;
  type: 'Ingredient' | 'Product';
  description: string;
  itemCount?: number;
}

export interface StoreRecord {
  id: string;
  name: string;
  code: string;
  location: string;
  managerName: string;
  phone: string;
  capacity: string;
  status: 'Active' | 'Inactive';
  notes?: string;
}

export interface ProductRecipeItem {
  inventoryId: string;
  ingredientName: string;
  sku: string;
  qty: number;
  unit: string;
  unitCost: number;
  portionCost: number;
  isMainIngredient: boolean;
  storeName?: string;
}

export interface ProductWithRecipe {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  marginPercent: number;
  image: string;
  description: string;
  ingredients: ProductRecipeItem[];
  barcode: string;
  isAvailable: boolean;
  isSpecial?: boolean;
  isFeatured?: boolean;
}

export interface StockInItem {
  inventoryId: string;
  ingredientName: string;
  sku: string;
  qty: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  hasExpiry?: boolean;
  expiryDate?: string;
}

export interface StockInVoucher {
  voucherId: string;
  date: string;
  supplierName: string;
  receivingStore?: string;
  fsNumber: string;
  remark: string;
  items: StockInItem[];
  grandTotal: number;
  createdTime: string;
}

export interface RecipeCost {
  id: string;
  menuItemId: string;
  menuItemName: string;
  ingredients: RecipeIngredient[];
  laborCost: number;
  overheadCost: number;
  targetMarginPercent: number;
  calculatedCost: number;
  recommendedPrice: number;
  currentPrice: number;
}

export interface FinancialRecord {
  id: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  referenceNumber?: string;
}

export interface EPRRecord {
  id: string;
  month: string;
  packagingType: string;
  weightKg: number;
  recycledKg: number;
  complianceRate: number;
  notes: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  category: string;
  tags: string[];
}

export interface CareerPosting {
  id: string;
  title: string;
  department: string;
  type: 'Full-time' | 'Part-time';
  location: string;
  experience: string;
  description: string;
  requirements: string[];
}

export interface StoreRequestItem {
  inventoryId: string;
  ingredientName: string;
  sku: string;
  qtyRequested: number;
  unit: string;
  availableStock: number;
}

export interface StoreRequestVoucher {
  voucherId: string;
  date: string;
  requestedBy: string;
  requestingStore?: string;
  targetStore: string;
  department: string;
  status: 'Pending' | 'Approved' | 'Issued' | 'Rejected';
  items: StoreRequestItem[];
  remark?: string;
  createdTime: string;
  linkedTransferVoucherId?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export type StoreTransferStatus =
  | 'Draft'
  | 'Pending'
  | 'Approved'
  | 'In Transit'
  | 'Partially Received'
  | 'Received'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export interface TransferAuditLogEntry {
  id: string;
  action:
    | 'TRANSFER_CREATED'
    | 'TRANSFER_SUBMITTED'
    | 'TRANSFER_APPROVED'
    | 'TRANSFER_REJECTED'
    | 'TRANSFER_DISPATCHED'
    | 'TRANSFER_RECEIVED'
    | 'TRANSFER_PARTIAL_RECEIVED'
    | 'TRANSFER_COMPLETED'
    | 'TRANSFER_CANCELLED'
    | 'TRANSFER_EDITED';
  timestamp: string;
  user: string;
  previousStatus?: StoreTransferStatus;
  newStatus: StoreTransferStatus;
  notes?: string;
  store?: string;
}

export interface TransferReceiptItem {
  inventoryId: string;
  ingredientName: string;
  sku?: string;
  qtyExpected: number;
  qtyReceived: number;
  differenceQty: number;
  unit: string;
  unitCost?: number;
  totalCost?: number;
  discrepancyReason?: string;
}

export interface TransferReceiptBatch {
  batchId: string;
  receivedAt: string;
  receivedBy: string;
  items: TransferReceiptItem[];
  notes?: string;
  damageReported?: boolean;
}

export interface StoreTransferItem {
  inventoryId: string;
  ingredientName: string;
  sku: string;
  unit: string;
  requestedQty?: number;
  availableQty?: number;
  qtyTransferred: number;
  qtyReceived?: number;
  qtyRemaining?: number;
  unitCost?: number;
  totalCost?: number;
  discrepancyReason?: string;
}

export interface StoreTransferVoucher {
  voucherId: string;
  date: string;
  fromStore: string;
  toStore: string;
  requestedBy?: string;
  transferredBy: string;
  driverOrHandler?: string;
  approvedBy?: string;
  approvedAt?: string;
  dispatchedBy?: string;
  dispatchedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  completedDate?: string;
  items: StoreTransferItem[];
  totalQuantity?: number;
  totalCost?: number;
  remark?: string;
  createdTime: string;
  linkedRequisitionId?: string;
  status: StoreTransferStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  isSourceDeducted?: boolean;
  isDestCredited?: boolean;
  auditLogs?: TransferAuditLogEntry[];
  receiptBatches?: TransferReceiptBatch[];
}

export interface InventoryTransaction {
  id: string;
  transferId?: string;
  referenceNumber: string;
  productId: string;
  productName: string;
  sku?: string;
  storeId?: string;
  storeName: string;
  movementType:
    | 'PURCHASE'
    | 'SALE'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT'
    | 'RETURN'
    | 'DAMAGE'
    | 'ADJUSTMENT'
    | 'INITIAL_STOCK';
  qtyIn: number;
  qtyOut: number;
  previousBalance: number;
  newBalance: number;
  unit: string;
  unitCost?: number;
  totalCost?: number;
  user: string;
  date: string;
  time?: string;
  notes?: string;
}

export interface POSReceiptVoucher {
  voucherId: string;
  orderId: string;
  date: string;
  cashierName: string;
  customerName: string;
  storeName?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Telebirr';
  accountNumberOrPhone?: string;
  amountReceived?: number;
  slipPhotoUrl?: string; // Uploaded slip photo stored for auditing
  mainIngredientStatus: 'Fully Available' | 'Substituted' | 'Sold with Current Stock';
  substitutionNotes?: string;
  createdTime: string;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  date: string;
  comment: string;
  avatar: string;
  verifiedPurchase: boolean;
}

export interface BinCardEntry {
  id: string;
  inventoryId: string;
  storeName?: string;
  date: string;
  transactionType:
    | 'Stock In'
    | 'Order Sales Consumption'
    | 'Store Transfer'
    | 'Damage Spoilage'
    | 'Initial Stock'
    | 'Special Prep Production'
    | 'In-House Batch Production';
  referenceId: string;
  productName?: string;
  productImage?: string;
  qtyIn: number;
  qtyOut: number;
  balanceAfter: number;
  unit: string;
  notes?: string;
}

export interface DamageItem {
  itemType: 'Ingredient' | 'Finished Product';
  itemId: string;
  name: string;
  image: string;
  qty: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  reason: string;
}

export interface DamageVoucher {
  voucherId: string;
  date: string;
  createdTime: string;
  recordedBy: string;
  storeName: string;
  items: DamageItem[];
  totalLossAmount: number;
  remark?: string;
}

export interface StaffMealRecord {
  id: string;
  date: string;
  createdTime: string;
  staffName: string;
  department: string;
  mealName: string;
  mealImage: string;
  quantity: number;
  totalCost: number;
  approvedBy: string;
  notes?: string;
}

export interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  role: 'Admin' | 'Manager' | 'Cashier' | 'Kitchen';
  passwordHash: string;
  allowedModules: string[]; // List of ERP module IDs allowed for this user
  avatarUrl?: string;
  isActive: boolean;
}

