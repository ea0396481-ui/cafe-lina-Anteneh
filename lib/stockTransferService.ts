import {
  InventoryItem,
  StoreTransferVoucher,
  StoreTransferItem,
  StoreTransferStatus,
  TransferReceiptBatch,
  TransferReceiptItem,
  TransferAuditLogEntry,
  BinCardEntry,
  InventoryTransaction,
} from '../types';

export interface TransferResult {
  success: boolean;
  error?: string;
  updatedInventory?: InventoryItem[];
  createdBinCards?: BinCardEntry[];
  createdTransactions?: InventoryTransaction[];
  voucher?: StoreTransferVoucher;
}

export interface StockTransferServiceDeps {
  saveItem: <T extends Record<string, any>>(
    collectionName: string,
    item: T,
    idField?: string
  ) => Promise<boolean>;
  deleteItem: (
    collectionName: string,
    docId: string,
    idField?: string
  ) => Promise<boolean>;
}

/**
 * Normalize store names for reliable comparison
 */
export function normalizeStoreName(name?: string): string {
  if (!name) return 'Bole Main Central Store';
  return name.trim();
}

/**
 * Match an inventory item in a specific store by ID, SKU, or Name
 */
export function findItemInStore(
  inventory: InventoryItem[],
  storeName: string,
  itemId?: string,
  sku?: string,
  name?: string
): InventoryItem | undefined {
  const normStore = normalizeStoreName(storeName).toLowerCase();

  return inventory.find((i) => {
    const itemStore = normalizeStoreName(i.storeName).toLowerCase();
    if (itemStore !== normStore) return false;

    if (itemId && i.id === itemId) return true;
    if (sku && i.sku && i.sku.toLowerCase().trim() === sku.toLowerCase().trim()) return true;
    if (name && i.name.toLowerCase().trim() === name.toLowerCase().trim()) return true;
    return false;
  });
}

/**
 * Find source inventory item in a specific store
 */
export function findSourceItem(
  inventory: InventoryItem[],
  fromStore: string,
  item: StoreTransferItem | { inventoryId: string; sku?: string; ingredientName: string }
): InventoryItem | undefined {
  // 1. Match in fromStore
  const inStore = findItemInStore(inventory, fromStore, item.inventoryId, item.sku, item.ingredientName);
  if (inStore) return inStore;

  // 2. Direct by ID if no store restriction on item yet
  const byId = inventory.find((i) => i.id === item.inventoryId);
  if (byId) {
    const itemStore = normalizeStoreName(byId.storeName).toLowerCase();
    if (itemStore === normalizeStoreName(fromStore).toLowerCase()) return byId;
  }

  // 3. Fallback matching name/SKU in fromStore
  return inventory.find(
    (i) =>
      normalizeStoreName(i.storeName).toLowerCase() === normalizeStoreName(fromStore).toLowerCase() &&
      ((item.sku && i.sku && i.sku.toLowerCase().trim() === item.sku.toLowerCase().trim()) ||
        (item.ingredientName && i.name.toLowerCase().trim() === item.ingredientName.toLowerCase().trim()))
  );
}

/**
 * Validates transfer parameters and source store available stock
 */
export function validateStoreTransfer(
  items: StoreTransferItem[],
  fromStore: string,
  toStore: string,
  currentInventory: InventoryItem[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const normFrom = normalizeStoreName(fromStore);
  const normTo = normalizeStoreName(toStore);

  if (normFrom.toLowerCase() === normTo.toLowerCase()) {
    errors.push('Source store and destination store cannot be the same location.');
  }

  if (!items || items.length === 0) {
    errors.push('Please select at least one item to transfer.');
  }

  for (const it of items) {
    if (!it.qtyTransferred || it.qtyTransferred <= 0) {
      errors.push(`Invalid quantity for ${it.ingredientName}: must be greater than 0.`);
      continue;
    }

    const sourceItem = findSourceItem(currentInventory, normFrom, it);
    if (!sourceItem) {
      errors.push(`"${it.ingredientName}" was not found in source store "${normFrom}".`);
      continue;
    }

    if (sourceItem.stockQty < it.qtyTransferred) {
      errors.push(
        `Insufficient stock for "${sourceItem.name}" in "${normFrom}". Available: ${sourceItem.stockQty} ${sourceItem.unit}, Requested: ${it.qtyTransferred} ${it.unit}.`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Creates a new transfer voucher in Draft / Pending / Approved state without moving stock yet
 */
export async function createStoreTransferVoucher(
  transferData: Partial<StoreTransferVoucher>,
  currentInventory: InventoryItem[],
  deps: StockTransferServiceDeps,
  user: string = 'Store Manager Dawit'
): Promise<TransferResult> {
  const fromStore = normalizeStoreName(transferData.fromStore);
  const toStore = normalizeStoreName(transferData.toStore);
  const items = transferData.items || [];

  const validation = validateStoreTransfer(items, fromStore, toStore, currentInventory);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join(' | '),
    };
  }

  const now = new Date();
  const dateStr = transferData.date || now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const voucherId = transferData.voucherId || `TR-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Enrich items with unit costs and remaining balances
  const enrichedItems: StoreTransferItem[] = items.map((it) => {
    const src = findSourceItem(currentInventory, fromStore, it);
    const unitCost = it.unitCost || src?.costPerUnit || 0;
    const totalCost = Math.round(unitCost * it.qtyTransferred * 100) / 100;
    return {
      ...it,
      availableQty: src?.stockQty || 0,
      requestedQty: it.requestedQty || it.qtyTransferred,
      qtyReceived: 0,
      qtyRemaining: it.qtyTransferred,
      unitCost,
      totalCost,
    };
  });

  const totalQuantity = enrichedItems.reduce((sum, i) => sum + i.qtyTransferred, 0);
  const totalCost = enrichedItems.reduce((sum, i) => sum + (i.totalCost || 0), 0);

  const initialStatus: StoreTransferStatus = transferData.status || 'Pending';

  const auditEntry: TransferAuditLogEntry = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: initialStatus === 'Draft' ? 'TRANSFER_CREATED' : 'TRANSFER_SUBMITTED',
    timestamp: `${dateStr} ${timeStr}`,
    user,
    previousStatus: undefined,
    newStatus: initialStatus,
    notes: `Transfer requisition voucher ${voucherId} initiated from ${fromStore} to ${toStore}.`,
    store: fromStore,
  };

  const voucher: StoreTransferVoucher = {
    voucherId,
    date: dateStr,
    fromStore,
    toStore,
    requestedBy: transferData.requestedBy || user,
    transferredBy: transferData.transferredBy || user,
    driverOrHandler: transferData.driverOrHandler || '',
    approvedBy: transferData.approvedBy,
    approvedAt: transferData.approvedAt,
    remark: transferData.remark || '',
    createdTime: timeStr,
    items: enrichedItems,
    totalQuantity,
    totalCost,
    status: initialStatus,
    isSourceDeducted: false,
    isDestCredited: false,
    auditLogs: [auditEntry],
    receiptBatches: [],
  };

  await deps.saveItem('storeTransfers', voucher, 'voucherId');

  return {
    success: true,
    voucher,
    updatedInventory: currentInventory,
  };
}

/**
 * Approve a transfer request
 */
export async function approveStoreTransfer(
  voucher: StoreTransferVoucher,
  deps: StockTransferServiceDeps,
  approver: string = 'Store Manager Dawit'
): Promise<TransferResult> {
  if (voucher.status !== 'Draft' && voucher.status !== 'Pending') {
    return {
      success: false,
      error: `Cannot approve transfer with status "${voucher.status}". Only Draft or Pending transfers can be approved.`,
    };
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const auditEntry: TransferAuditLogEntry = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: 'TRANSFER_APPROVED',
    timestamp: timeStr,
    user: approver,
    previousStatus: voucher.status,
    newStatus: 'Approved',
    notes: `Transfer ${voucher.voucherId} approved by ${approver}. Ready for dispatch.`,
    store: voucher.fromStore,
  };

  const updatedVoucher: StoreTransferVoucher = {
    ...voucher,
    status: 'Approved',
    approvedBy: approver,
    approvedAt: timeStr,
    auditLogs: [...(voucher.auditLogs || []), auditEntry],
  };

  await deps.saveItem('storeTransfers', updatedVoucher, 'voucherId');

  return {
    success: true,
    voucher: updatedVoucher,
  };
}

/**
 * Reject a transfer request
 */
export async function rejectStoreTransfer(
  voucher: StoreTransferVoucher,
  reason: string,
  deps: StockTransferServiceDeps,
  user: string = 'Store Manager Dawit'
): Promise<TransferResult> {
  if (voucher.status === 'Completed' || voucher.status === 'In Transit') {
    return {
      success: false,
      error: `Cannot reject transfer that is already "${voucher.status}".`,
    };
  }

  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const auditEntry: TransferAuditLogEntry = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: 'TRANSFER_REJECTED',
    timestamp: timeStr,
    user,
    previousStatus: voucher.status,
    newStatus: 'Rejected',
    notes: `Transfer rejected: ${reason}`,
    store: voucher.fromStore,
  };

  const updatedVoucher: StoreTransferVoucher = {
    ...voucher,
    status: 'Rejected',
    rejectionReason: reason,
    auditLogs: [...(voucher.auditLogs || []), auditEntry],
  };

  await deps.saveItem('storeTransfers', updatedVoucher, 'voucherId');

  return {
    success: true,
    voucher: updatedVoucher,
  };
}

/**
 * Dispatch transfer (Moves to 'In Transit' and deducts stock from FROM STORE exactly once)
 */
export async function dispatchStoreTransfer(
  voucher: StoreTransferVoucher,
  currentInventory: InventoryItem[],
  deps: StockTransferServiceDeps,
  user: string = 'Store Manager Dawit',
  handler?: string
): Promise<TransferResult> {
  if (voucher.isSourceDeducted) {
    return {
      success: false,
      error: `Stock has already been dispatched/deducted for Transfer #${voucher.voucherId}.`,
    };
  }

  const fromStore = normalizeStoreName(voucher.fromStore);
  const toStore = normalizeStoreName(voucher.toStore);

  // Validate stock in FROM STORE again before deducting
  const validation = validateStoreTransfer(voucher.items, fromStore, toStore, currentInventory);
  if (!validation.valid) {
    return {
      success: false,
      error: `Dispatch validation failed: ${validation.errors.join(' | ')}`,
    };
  }

  const workingInventory: InventoryItem[] = currentInventory.map((i) => ({ ...i }));
  const createdBinCards: BinCardEntry[] = [];
  const createdTransactions: InventoryTransaction[] = [];
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeStampFull = `${dateStr} ${timeStr}`;

  try {
    for (const it of voucher.items) {
      const sourceItemIndex = workingInventory.findIndex((i) => {
        const itemStore = normalizeStoreName(i.storeName).toLowerCase();
        const normFrom = fromStore.toLowerCase();
        if (itemStore !== normFrom && i.storeName) return false;
        return (
          i.id === it.inventoryId ||
          (it.sku && i.sku && i.sku.toLowerCase().trim() === it.sku.toLowerCase().trim()) ||
          i.name.toLowerCase().trim() === it.ingredientName.toLowerCase().trim()
        );
      });

      if (sourceItemIndex === -1) {
        throw new Error(`Source ingredient "${it.ingredientName}" missing in store "${fromStore}".`);
      }

      const sourceItem = workingInventory[sourceItemIndex];
      const prevBal = sourceItem.stockQty;
      const newBal = Math.max(0, Math.round((prevBal - it.qtyTransferred) * 1000) / 1000);

      // 1. Update source inventory record
      const updatedSourceItem: InventoryItem = {
        ...sourceItem,
        storeName: fromStore,
        stockQty: newBal,
      };
      workingInventory[sourceItemIndex] = updatedSourceItem;
      await deps.saveItem('inventory', updatedSourceItem, 'id');

      // 2. Create Source Store Bin Card Entry (OUT)
      const sourceBinCard: BinCardEntry = {
        id: `BIN-TRN-OUT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        inventoryId: updatedSourceItem.id,
        storeName: fromStore,
        date: dateStr,
        transactionType: 'Store Transfer',
        referenceId: voucher.voucherId,
        productName: sourceItem.name,
        productImage: sourceItem.image,
        qtyIn: 0,
        qtyOut: it.qtyTransferred,
        balanceAfter: newBal,
        unit: it.unit || sourceItem.unit,
        notes: `Transfer OUT to ${toStore} (Voucher: ${voucher.voucherId}${handler ? ` | Handler: ${handler}` : ''})`,
      };
      createdBinCards.push(sourceBinCard);
      await deps.saveItem('binCards', sourceBinCard, 'id');

      // 3. Create Stock Movement / Transaction Ledger Entry
      const transaction: InventoryTransaction = {
        id: `TX-OUT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        transferId: voucher.voucherId,
        referenceNumber: voucher.voucherId,
        productId: updatedSourceItem.id,
        productName: sourceItem.name,
        sku: sourceItem.sku,
        storeName: fromStore,
        movementType: 'TRANSFER_OUT',
        qtyIn: 0,
        qtyOut: it.qtyTransferred,
        previousBalance: prevBal,
        newBalance: newBal,
        unit: it.unit || sourceItem.unit,
        unitCost: it.unitCost || sourceItem.costPerUnit,
        totalCost: Math.round((it.unitCost || sourceItem.costPerUnit) * it.qtyTransferred * 100) / 100,
        user,
        date: dateStr,
        time: timeStr,
        notes: `Dispatched to ${toStore}. Handler: ${handler || voucher.driverOrHandler || 'Direct Courier'}`,
      };
      createdTransactions.push(transaction);
      await deps.saveItem('inventoryTransactions', transaction, 'id');
    }

    const auditEntry: TransferAuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: 'TRANSFER_DISPATCHED',
      timestamp: timeStampFull,
      user,
      previousStatus: voucher.status,
      newStatus: 'In Transit',
      notes: `Dispatched from ${fromStore}. Stock deducted. Handler: ${handler || voucher.driverOrHandler || 'N/A'}`,
      store: fromStore,
    };

    const updatedVoucher: StoreTransferVoucher = {
      ...voucher,
      status: 'In Transit',
      dispatchedBy: user,
      dispatchedAt: timeStampFull,
      driverOrHandler: handler || voucher.driverOrHandler,
      isSourceDeducted: true,
      auditLogs: [...(voucher.auditLogs || []), auditEntry],
    };

    await deps.saveItem('storeTransfers', updatedVoucher, 'voucherId');

    return {
      success: true,
      voucher: updatedVoucher,
      updatedInventory: workingInventory,
      createdBinCards,
      createdTransactions,
    };
  } catch (err: any) {
    console.error('Error dispatching transfer:', err);
    return {
      success: false,
      error: err.message || 'An error occurred while dispatching transfer stock.',
    };
  }
}

/**
 * Receive items at destination store (Supports partial receiving and difference tracking)
 */
export async function receiveStoreTransfer(
  voucher: StoreTransferVoucher,
  receivedItems: { inventoryId: string; qtyReceived: number; discrepancyReason?: string }[],
  currentInventory: InventoryItem[],
  deps: StockTransferServiceDeps,
  receiver: string = 'Store Manager Dawit',
  notes?: string
): Promise<TransferResult> {
  if (voucher.status === 'Completed') {
    return {
      success: false,
      error: 'Transfer has already been completed and received.',
    };
  }

  if (!voucher.isSourceDeducted) {
    return {
      success: false,
      error: 'Cannot receive a transfer that has not been dispatched yet.',
    };
  }

  const toStore = normalizeStoreName(voucher.toStore);
  const fromStore = normalizeStoreName(voucher.fromStore);
  const workingInventory: InventoryItem[] = currentInventory.map((i) => ({ ...i }));
  const createdBinCards: BinCardEntry[] = [];
  const createdTransactions: InventoryTransaction[] = [];
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeStampFull = `${dateStr} ${timeStr}`;

  const receiptBatchItems: TransferReceiptItem[] = [];

  try {
    const updatedVoucherItems: StoreTransferItem[] = voucher.items.map((it) => {
      const incoming = receivedItems.find((r) => r.inventoryId === it.inventoryId || r.inventoryId === it.sku);
      const incomingQty = incoming ? incoming.qtyReceived : 0;
      const discrepancyReason = incoming?.discrepancyReason || '';

      const currentTotalReceived = (it.qtyReceived || 0) + incomingQty;
      const remainingQty = Math.max(0, Math.round((it.qtyTransferred - currentTotalReceived) * 1000) / 1000);

      receiptBatchItems.push({
        inventoryId: it.inventoryId,
        ingredientName: it.ingredientName,
        sku: it.sku,
        qtyExpected: it.qtyRemaining !== undefined ? it.qtyRemaining : it.qtyTransferred,
        qtyReceived: incomingQty,
        differenceQty: incomingQty - (it.qtyRemaining !== undefined ? it.qtyRemaining : it.qtyTransferred),
        unit: it.unit,
        unitCost: it.unitCost,
        totalCost: Math.round((it.unitCost || 0) * incomingQty * 100) / 100,
        discrepancyReason,
      });

      return {
        ...it,
        qtyReceived: currentTotalReceived,
        qtyRemaining: remainingQty,
        discrepancyReason: discrepancyReason || it.discrepancyReason,
      };
    });

    // Credit destination store for each item received > 0
    for (const rItem of receiptBatchItems) {
      if (rItem.qtyReceived <= 0) continue;

      let destItemIndex = workingInventory.findIndex((i) => {
        const itemStore = normalizeStoreName(i.storeName).toLowerCase();
        const normTo = toStore.toLowerCase();
        if (itemStore !== normTo) return false;
        return (
          (rItem.sku && i.sku && i.sku.toLowerCase().trim() === rItem.sku.toLowerCase().trim()) ||
          i.name.toLowerCase().trim() === rItem.ingredientName.toLowerCase().trim()
        );
      });

      let destinationItem: InventoryItem;
      let prevBal = 0;
      let destNewStock = rItem.qtyReceived;

      if (destItemIndex !== -1) {
        const existingDest = workingInventory[destItemIndex];
        prevBal = existingDest.stockQty;
        destNewStock = Math.round((prevBal + rItem.qtyReceived) * 1000) / 1000;
        destinationItem = {
          ...existingDest,
          storeName: toStore,
          stockQty: destNewStock,
          lastRestocked: dateStr,
          costPerUnit: rItem.unitCost || existingDest.costPerUnit,
        };
        workingInventory[destItemIndex] = destinationItem;
        await deps.saveItem('inventory', destinationItem, 'id');
      } else {
        // Create new item in Destination store
        const newDestId = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        const sampleSource = findSourceItem(currentInventory, fromStore, {
          inventoryId: rItem.inventoryId,
          sku: rItem.sku,
          ingredientName: rItem.ingredientName,
        });

        destinationItem = {
          id: newDestId,
          name: rItem.ingredientName,
          category: sampleSource?.category || 'Coffee',
          sku: rItem.sku || `SKU-${Date.now().toString().slice(-4)}`,
          stockQty: rItem.qtyReceived,
          unit: rItem.unit,
          reorderLevel: sampleSource?.reorderLevel || 10,
          costPerUnit: rItem.unitCost || sampleSource?.costPerUnit || 100,
          supplierName: sampleSource?.supplierName || 'Inter-Store Transfer',
          lastRestocked: dateStr,
          storeName: toStore,
          brand: sampleSource?.brand,
          image: sampleSource?.image,
        };
        workingInventory.push(destinationItem);
        await deps.saveItem('inventory', destinationItem, 'id');
      }

      // Create Destination Store Bin Card Record (IN)
      const destBinCard: BinCardEntry = {
        id: `BIN-TRN-IN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        inventoryId: destinationItem.id,
        storeName: toStore,
        date: dateStr,
        transactionType: 'Store Transfer',
        referenceId: voucher.voucherId,
        productName: destinationItem.name,
        productImage: destinationItem.image,
        qtyIn: rItem.qtyReceived,
        qtyOut: 0,
        balanceAfter: destNewStock,
        unit: rItem.unit,
        notes: `Transfer IN from ${fromStore} (Voucher: ${voucher.voucherId}${notes ? ` | Note: ${notes}` : ''})`,
      };
      createdBinCards.push(destBinCard);
      await deps.saveItem('binCards', destBinCard, 'id');

      // Create Stock Movement Transaction Record (IN)
      const txIn: InventoryTransaction = {
        id: `TX-IN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        transferId: voucher.voucherId,
        referenceNumber: voucher.voucherId,
        productId: destinationItem.id,
        productName: destinationItem.name,
        sku: destinationItem.sku,
        storeName: toStore,
        movementType: 'TRANSFER_IN',
        qtyIn: rItem.qtyReceived,
        qtyOut: 0,
        previousBalance: prevBal,
        newBalance: destNewStock,
        unit: rItem.unit,
        unitCost: rItem.unitCost || destinationItem.costPerUnit,
        totalCost: Math.round((rItem.unitCost || destinationItem.costPerUnit) * rItem.qtyReceived * 100) / 100,
        user: receiver,
        date: dateStr,
        time: timeStr,
        notes: `Received from ${fromStore}. Voucher: ${voucher.voucherId}`,
      };
      createdTransactions.push(txIn);
      await deps.saveItem('inventoryTransactions', txIn, 'id');
    }

    // Determine if transfer is fully completed
    const totalRemaining = updatedVoucherItems.reduce((sum, it) => sum + (it.qtyRemaining || 0), 0);
    const newStatus: StoreTransferStatus = totalRemaining === 0 ? 'Completed' : 'Partially Received';

    const receiptBatch: TransferReceiptBatch = {
      batchId: `RCP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      receivedAt: timeStampFull,
      receivedBy: receiver,
      items: receiptBatchItems,
      notes: notes || '',
      damageReported: receiptBatchItems.some((it) => it.differenceQty !== 0),
    };

    const auditEntry: TransferAuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: newStatus === 'Completed' ? 'TRANSFER_COMPLETED' : 'TRANSFER_PARTIAL_RECEIVED',
      timestamp: timeStampFull,
      user: receiver,
      previousStatus: voucher.status,
      newStatus,
      notes: `Received at ${toStore}. ${newStatus === 'Completed' ? 'All items fully received.' : `Remaining units pending: ${totalRemaining}`}`,
      store: toStore,
    };

    const updatedVoucher: StoreTransferVoucher = {
      ...voucher,
      status: newStatus,
      receivedBy: receiver,
      receivedAt: timeStampFull,
      completedDate: newStatus === 'Completed' ? dateStr : undefined,
      isDestCredited: true,
      items: updatedVoucherItems,
      receiptBatches: [...(voucher.receiptBatches || []), receiptBatch],
      auditLogs: [...(voucher.auditLogs || []), auditEntry],
    };

    await deps.saveItem('storeTransfers', updatedVoucher, 'voucherId');

    return {
      success: true,
      voucher: updatedVoucher,
      updatedInventory: workingInventory,
      createdBinCards,
      createdTransactions,
    };
  } catch (err: any) {
    console.error('Error receiving transfer:', err);
    return {
      success: false,
      error: err.message || 'An error occurred while receiving items.',
    };
  }
}

/**
 * Cancel a transfer (Rolls back any stock movements if already in transit)
 */
export async function cancelStoreTransfer(
  voucher: StoreTransferVoucher,
  currentInventory: InventoryItem[],
  currentBinCards: BinCardEntry[],
  deps: StockTransferServiceDeps,
  reason: string,
  user: string = 'Store Manager Dawit'
): Promise<TransferResult> {
  if (voucher.status === 'Completed') {
    return {
      success: false,
      error: 'Completed transfers cannot be cancelled.',
    };
  }

  const workingInventory: InventoryItem[] = currentInventory.map((i) => ({ ...i }));
  const fromStore = normalizeStoreName(voucher.fromStore);
  const now = new Date();
  const timeStampFull = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  try {
    // If stock was already deducted during dispatch, restore it to source store
    if (voucher.isSourceDeducted) {
      for (const it of voucher.items) {
        const sourceIdx = workingInventory.findIndex((i) => {
          const itemStore = normalizeStoreName(i.storeName).toLowerCase();
          const normFrom = fromStore.toLowerCase();
          if (itemStore !== normFrom && i.storeName) return false;
          return (
            i.id === it.inventoryId ||
            (it.sku && i.sku && i.sku.toLowerCase().trim() === it.sku.toLowerCase().trim()) ||
            i.name.toLowerCase().trim() === it.ingredientName.toLowerCase().trim()
          );
        });

        if (sourceIdx !== -1) {
          const sourceItem = workingInventory[sourceIdx];
          const restoredStock = Math.round((sourceItem.stockQty + it.qtyTransferred) * 1000) / 1000;
          const updatedSource = {
            ...sourceItem,
            stockQty: restoredStock,
          };
          workingInventory[sourceIdx] = updatedSource;
          await deps.saveItem('inventory', updatedSource, 'id');
        }
      }

      // Remove transit bin cards
      const linkedBinCards = currentBinCards.filter((b) => b.referenceId === voucher.voucherId);
      for (const bin of linkedBinCards) {
        await deps.deleteItem('binCards', bin.id);
      }
    }

    const auditEntry: TransferAuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: 'TRANSFER_CANCELLED',
      timestamp: timeStampFull,
      user,
      previousStatus: voucher.status,
      newStatus: 'Cancelled',
      notes: `Transfer cancelled: ${reason}. ${voucher.isSourceDeducted ? 'Source stock restored.' : 'No stock movements affected.'}`,
      store: fromStore,
    };

    const updatedVoucher: StoreTransferVoucher = {
      ...voucher,
      status: 'Cancelled',
      cancellationReason: reason,
      isSourceDeducted: false,
      auditLogs: [...(voucher.auditLogs || []), auditEntry],
    };

    await deps.saveItem('storeTransfers', updatedVoucher, 'voucherId');

    return {
      success: true,
      voucher: updatedVoucher,
      updatedInventory: workingInventory,
    };
  } catch (err: any) {
    console.error('Error cancelling transfer:', err);
    return {
      success: false,
      error: err.message || 'An error occurred while cancelling the transfer.',
    };
  }
}

/**
 * Execute a direct Store Transfer immediately end-to-end (e.g. from POS / Admin direct action)
 */
export async function executeStoreTransfer(
  transfer: StoreTransferVoucher,
  currentInventory: InventoryItem[],
  deps: StockTransferServiceDeps
): Promise<TransferResult> {
  const fromStore = normalizeStoreName(transfer.fromStore);
  const toStore = normalizeStoreName(transfer.toStore);

  const validation = validateStoreTransfer(transfer.items, fromStore, toStore, currentInventory);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join(' | '),
    };
  }

  const workingInventory: InventoryItem[] = currentInventory.map((i) => ({ ...i }));
  const createdBinCards: BinCardEntry[] = [];
  const createdTransactions: InventoryTransaction[] = [];
  const currentDate = transfer.date || new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  try {
    for (const it of transfer.items) {
      const sourceItemIndex = workingInventory.findIndex((i) => {
        const itemStore = normalizeStoreName(i.storeName).toLowerCase();
        const normFrom = fromStore.toLowerCase();
        if (itemStore !== normFrom && i.storeName) return false;
        return (
          i.id === it.inventoryId ||
          (it.sku && i.sku && i.sku.toLowerCase().trim() === it.sku.toLowerCase().trim()) ||
          i.name.toLowerCase().trim() === it.ingredientName.toLowerCase().trim()
        );
      });

      if (sourceItemIndex === -1) {
        throw new Error(`Source item "${it.ingredientName}" missing during transfer.`);
      }

      const sourceItem = workingInventory[sourceItemIndex];
      const sourcePrevStock = sourceItem.stockQty;
      const sourceNewStock = Math.max(0, Math.round((sourcePrevStock - it.qtyTransferred) * 1000) / 1000);

      // 1. Update source item
      const updatedSourceItem: InventoryItem = {
        ...sourceItem,
        storeName: fromStore,
        stockQty: sourceNewStock,
      };
      workingInventory[sourceItemIndex] = updatedSourceItem;
      await deps.saveItem('inventory', updatedSourceItem, 'id');

      // 2. Find or create destination item in `toStore`
      let destItemIndex = workingInventory.findIndex((i) => {
        const itemStore = normalizeStoreName(i.storeName).toLowerCase();
        const normTo = toStore.toLowerCase();
        if (itemStore !== normTo) return false;
        return (
          (it.sku && i.sku && i.sku.toLowerCase().trim() === it.sku.toLowerCase().trim()) ||
          i.name.toLowerCase().trim() === it.ingredientName.toLowerCase().trim()
        );
      });

      let destinationItem: InventoryItem;
      let destPrevStock = 0;
      let destNewStock = it.qtyTransferred;

      if (destItemIndex !== -1) {
        const existingDest = workingInventory[destItemIndex];
        destPrevStock = existingDest.stockQty;
        destNewStock = Math.round((destPrevStock + it.qtyTransferred) * 1000) / 1000;
        destinationItem = {
          ...existingDest,
          storeName: toStore,
          stockQty: destNewStock,
          lastRestocked: currentDate,
        };
        workingInventory[destItemIndex] = destinationItem;
        await deps.saveItem('inventory', destinationItem, 'id');
      } else {
        const newDestId = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        destinationItem = {
          ...sourceItem,
          id: newDestId,
          storeName: toStore,
          stockQty: it.qtyTransferred,
          lastRestocked: currentDate,
        };
        workingInventory.push(destinationItem);
        await deps.saveItem('inventory', destinationItem, 'id');
      }

      // 3. Source Store Bin Card Record (OUT)
      const sourceBinCard: BinCardEntry = {
        id: `BIN-TRN-OUT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        inventoryId: updatedSourceItem.id,
        storeName: fromStore,
        date: currentDate,
        transactionType: 'Store Transfer',
        referenceId: transfer.voucherId,
        productName: sourceItem.name,
        productImage: sourceItem.image,
        qtyIn: 0,
        qtyOut: it.qtyTransferred,
        balanceAfter: sourceNewStock,
        unit: it.unit || sourceItem.unit,
        notes: `Transferred OUT to ${toStore} (Voucher: ${transfer.voucherId}${transfer.driverOrHandler ? ` | Handler: ${transfer.driverOrHandler}` : ''})`,
      };
      createdBinCards.push(sourceBinCard);
      await deps.saveItem('binCards', sourceBinCard, 'id');

      // 4. Source Transaction
      const sourceTx: InventoryTransaction = {
        id: `TX-OUT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        transferId: transfer.voucherId,
        referenceNumber: transfer.voucherId,
        productId: updatedSourceItem.id,
        productName: sourceItem.name,
        sku: sourceItem.sku,
        storeName: fromStore,
        movementType: 'TRANSFER_OUT',
        qtyIn: 0,
        qtyOut: it.qtyTransferred,
        previousBalance: sourcePrevStock,
        newBalance: sourceNewStock,
        unit: it.unit || sourceItem.unit,
        unitCost: it.unitCost || sourceItem.costPerUnit,
        totalCost: Math.round((it.unitCost || sourceItem.costPerUnit) * it.qtyTransferred * 100) / 100,
        user: transfer.transferredBy,
        date: currentDate,
        time: currentTime,
        notes: `Dispatched to ${toStore}`,
      };
      createdTransactions.push(sourceTx);
      await deps.saveItem('inventoryTransactions', sourceTx, 'id');

      // 5. Destination Store Bin Card Record (IN)
      const destBinCard: BinCardEntry = {
        id: `BIN-TRN-IN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        inventoryId: destinationItem.id,
        storeName: toStore,
        date: currentDate,
        transactionType: 'Store Transfer',
        referenceId: transfer.voucherId,
        productName: destinationItem.name,
        productImage: destinationItem.image,
        qtyIn: it.qtyTransferred,
        qtyOut: 0,
        balanceAfter: destNewStock,
        unit: it.unit || sourceItem.unit,
        notes: `Transferred IN from ${fromStore} (Voucher: ${transfer.voucherId}${transfer.driverOrHandler ? ` | Handler: ${transfer.driverOrHandler}` : ''})`,
      };
      createdBinCards.push(destBinCard);
      await deps.saveItem('binCards', destBinCard, 'id');

      // 6. Destination Transaction
      const destTx: InventoryTransaction = {
        id: `TX-IN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        transferId: transfer.voucherId,
        referenceNumber: transfer.voucherId,
        productId: destinationItem.id,
        productName: destinationItem.name,
        sku: destinationItem.sku,
        storeName: toStore,
        movementType: 'TRANSFER_IN',
        qtyIn: it.qtyTransferred,
        qtyOut: 0,
        previousBalance: destPrevStock,
        newBalance: destNewStock,
        unit: it.unit || destinationItem.unit,
        unitCost: it.unitCost || destinationItem.costPerUnit,
        totalCost: Math.round((it.unitCost || destinationItem.costPerUnit) * it.qtyTransferred * 100) / 100,
        user: transfer.transferredBy,
        date: currentDate,
        time: currentTime,
        notes: `Received from ${fromStore}`,
      };
      createdTransactions.push(destTx);
      await deps.saveItem('inventoryTransactions', destTx, 'id');
    }

    const auditEntry: TransferAuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: 'TRANSFER_COMPLETED',
      timestamp: `${currentDate} ${currentTime}`,
      user: transfer.transferredBy,
      previousStatus: transfer.status || 'Draft',
      newStatus: 'Completed',
      notes: `Transfer completed instantly from ${fromStore} to ${toStore}.`,
      store: fromStore,
    };

    const completedVoucher: StoreTransferVoucher = {
      ...transfer,
      status: 'Completed',
      completedDate: currentDate,
      isSourceDeducted: true,
      isDestCredited: true,
      auditLogs: [...(transfer.auditLogs || []), auditEntry],
    };
    await deps.saveItem('storeTransfers', completedVoucher, 'voucherId');

    return {
      success: true,
      updatedInventory: workingInventory,
      createdBinCards,
      createdTransactions,
      voucher: completedVoucher,
    };
  } catch (err: any) {
    console.error('Error executing store transfer:', err);
    return {
      success: false,
      error: err.message || 'An error occurred while executing the transfer.',
    };
  }
}

/**
 * Reverse a previous transfer (used for edit and delete)
 */
export async function reverseStoreTransfer(
  transfer: StoreTransferVoucher,
  currentInventory: InventoryItem[],
  currentBinCards: BinCardEntry[],
  deps: StockTransferServiceDeps
): Promise<{ success: boolean; updatedInventory: InventoryItem[]; error?: string }> {
  const fromStore = normalizeStoreName(transfer.fromStore);
  const toStore = normalizeStoreName(transfer.toStore);
  const workingInventory: InventoryItem[] = currentInventory.map((i) => ({ ...i }));

  try {
    for (const it of transfer.items) {
      // 1. Add back to Source Store (if was deducted)
      if (transfer.isSourceDeducted !== false) {
        const sourceIdx = workingInventory.findIndex((i) => {
          const itemStore = normalizeStoreName(i.storeName).toLowerCase();
          const normFrom = fromStore.toLowerCase();
          if (itemStore !== normFrom && i.storeName) return false;
          return (
            i.id === it.inventoryId ||
            (it.sku && i.sku && i.sku.toLowerCase().trim() === it.sku.toLowerCase().trim()) ||
            i.name.toLowerCase().trim() === it.ingredientName.toLowerCase().trim()
          );
        });

        if (sourceIdx !== -1) {
          const sourceItem = workingInventory[sourceIdx];
          const restoredStock = Math.round((sourceItem.stockQty + it.qtyTransferred) * 1000) / 1000;
          const updatedSource = {
            ...sourceItem,
            stockQty: restoredStock,
          };
          workingInventory[sourceIdx] = updatedSource;
          await deps.saveItem('inventory', updatedSource, 'id');
        }
      }

      // 2. Subtract from Destination Store (if was credited)
      const qtyCredited = it.qtyReceived !== undefined ? it.qtyReceived : (transfer.isDestCredited ? it.qtyTransferred : 0);
      if (qtyCredited > 0) {
        const destIdx = workingInventory.findIndex((i) => {
          const itemStore = normalizeStoreName(i.storeName).toLowerCase();
          const normTo = toStore.toLowerCase();
          if (itemStore !== normTo) return false;
          return (
            (it.sku && i.sku && i.sku.toLowerCase().trim() === it.sku.toLowerCase().trim()) ||
            i.name.toLowerCase().trim() === it.ingredientName.toLowerCase().trim()
          );
        });

        if (destIdx !== -1) {
          const destItem = workingInventory[destIdx];
          const reducedStock = Math.max(0, Math.round((destItem.stockQty - qtyCredited) * 1000) / 1000);
          const updatedDest = {
            ...destItem,
            stockQty: reducedStock,
          };
          workingInventory[destIdx] = updatedDest;
          await deps.saveItem('inventory', updatedDest, 'id');
        }
      }
    }

    // 3. Delete bin card entries linked to this voucher
    const linkedBinCards = currentBinCards.filter((b) => b.referenceId === transfer.voucherId);
    for (const bin of linkedBinCards) {
      await deps.deleteItem('binCards', bin.id);
    }

    return {
      success: true,
      updatedInventory: workingInventory,
    };
  } catch (err: any) {
    console.error('Error reversing transfer:', err);
    return {
      success: false,
      updatedInventory: currentInventory,
      error: err.message || 'Failed to reverse transfer.',
    };
  }
}

/**
 * Edit an existing store transfer:
 * 1. Reverses the old transfer
 * 2. Applies the new transfer
 */
export async function updateStoreTransfer(
  oldTransfer: StoreTransferVoucher,
  newTransfer: StoreTransferVoucher,
  currentInventory: InventoryItem[],
  currentBinCards: BinCardEntry[],
  deps: StockTransferServiceDeps
): Promise<TransferResult> {
  // If old transfer had moved stock, revert it first
  if (oldTransfer.isSourceDeducted || oldTransfer.status === 'Completed' || oldTransfer.status === 'In Transit') {
    const revertResult = await reverseStoreTransfer(oldTransfer, currentInventory, currentBinCards, deps);
    if (!revertResult.success) {
      return {
        success: false,
        error: `Failed to reverse previous transfer: ${revertResult.error}`,
      };
    }
    return executeStoreTransfer(newTransfer, revertResult.updatedInventory, deps);
  }

  // Otherwise, simply update voucher
  await deps.saveItem('storeTransfers', newTransfer, 'voucherId');
  return {
    success: true,
    voucher: newTransfer,
    updatedInventory: currentInventory,
  };
}

/**
 * Cancel or Delete a store transfer:
 * 1. Reverses any stock movements
 * 2. Deletes the transfer voucher
 */
export async function deleteStoreTransfer(
  transfer: StoreTransferVoucher,
  currentInventory: InventoryItem[],
  currentBinCards: BinCardEntry[],
  deps: StockTransferServiceDeps
): Promise<TransferResult> {
  // Step 1: Revert transfer stock movements if any were made
  if (transfer.isSourceDeducted || transfer.status === 'Completed' || transfer.status === 'In Transit') {
    const revertResult = await reverseStoreTransfer(transfer, currentInventory, currentBinCards, deps);
    if (!revertResult.success) {
      return {
        success: false,
        error: `Failed to reverse transfer: ${revertResult.error}`,
      };
    }
    await deps.deleteItem('storeTransfers', transfer.voucherId, 'voucherId');
    return {
      success: true,
      updatedInventory: revertResult.updatedInventory,
      voucher: transfer,
    };
  }

  // Step 2: Delete voucher from storeTransfers
  await deps.deleteItem('storeTransfers', transfer.voucherId, 'voucherId');

  return {
    success: true,
    updatedInventory: currentInventory,
    voucher: transfer,
  };
}
