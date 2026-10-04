import React, { useState, useMemo } from 'react';
import {
  InventoryItem,
  StoreRecord,
  StoreTransferVoucher,
  StoreTransferItem,
  StoreTransferStatus,
  BinCardEntry,
} from '../../types';
import { ShareReceiptButton } from '../ShareReceiptButton';
import { ProfessionalReceiptModal } from '../ProfessionalReceiptModal';
import {
  createStoreTransferVoucher,
  approveStoreTransfer,
  rejectStoreTransfer,
  dispatchStoreTransfer,
  receiveStoreTransfer,
  cancelStoreTransfer,
  updateStoreTransfer,
  deleteStoreTransfer,
  validateStoreTransfer,
  findSourceItem,
  normalizeStoreName,
} from '../../lib/stockTransferService';
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  Eye,
  Edit,
  Printer,
  CheckCircle2,
  X,
  Search,
  AlertTriangle,
  Building2,
  Store,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Check,
  ShieldAlert,
  Clock,
  Truck,
  PackageCheck,
  RotateCcw,
  FileText,
  UserCheck,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Download,
  Info,
} from 'lucide-react';
import { BrandLogo } from '../BrandLogo';

interface StoreTransferERPProps {
  inventory: InventoryItem[];
  stores: StoreRecord[];
  transfers: StoreTransferVoucher[];
  binCards?: BinCardEntry[];
  onAddTransfer: (transfer: StoreTransferVoucher) => void;
  onUpdateTransfer: (transfer: StoreTransferVoucher) => void;
  onDeleteTransfer: (voucherId: string) => void;
  currentUserRole?: string;
  currentUserName?: string;
  saveItem?: <T extends Record<string, any>>(collection: string, item: T, idField?: string) => Promise<boolean>;
  deleteItem?: (collection: string, docId: string, idField?: string) => Promise<boolean>;
}

export const StoreTransferERP: React.FC<StoreTransferERPProps> = ({
  inventory,
  stores,
  transfers,
  binCards = [],
  onAddTransfer,
  onUpdateTransfer,
  onDeleteTransfer,
  currentUserRole = 'Admin',
  currentUserName = 'Store Manager Dawit',
  saveItem = async () => true,
  deleteItem = async () => true,
}) => {
  // Modal & Drawer states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<StoreTransferVoucher | null>(null);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<StoreTransferVoucher | null>(null);
  const [receivingVoucher, setReceivingVoucher] = useState<StoreTransferVoucher | null>(null);
  const [rejectingVoucher, setRejectingVoucher] = useState<StoreTransferVoucher | null>(null);
  const [cancellingVoucher, setCancellingVoucher] = useState<StoreTransferVoucher | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<StoreTransferVoucher | null>(null);
  const [deleteConfirmVoucher, setDeleteConfirmVoucher] = useState<StoreTransferVoucher | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFromStore, setFilterFromStore] = useState('All');
  const [filterToStore, setFilterToStore] = useState('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterDate, setFilterDate] = useState('');

  // Create Transfer Form State
  const [fromStore, setFromStore] = useState(stores[0]?.name || 'Bole Main Central Store');
  const [toStore, setToStore] = useState(
    stores[1]?.name || stores[0]?.name === 'Kazanchis Bakery Lab & Cold Room' ? 'Bole Main Central Store' : 'Kazanchis Bakery Lab & Cold Room'
  );
  const [requestedBy, setRequestedBy] = useState(currentUserName);
  const [driverOrHandler, setDriverOrHandler] = useState('Ermias Driver');
  const [remark, setRemark] = useState('');
  const [initialCreateStatus, setInitialCreateStatus] = useState<'Pending' | 'Approved' | 'In Transit'>('Pending');
  const [selectedItems, setSelectedItems] = useState<{ [invId: string]: { qty: number; unitCost: number } }>({});
  const [itemSearch, setItemSearch] = useState('');

  // Reason inputs
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [cancellationReasonInput, setCancellationReasonInput] = useState('');

  // Receiving Form State: { [invId]: { qtyReceived: number, discrepancyReason: string } }
  const [receiveBatchInputs, setReceiveBatchInputs] = useState<{
    [invId: string]: { qtyReceived: number; discrepancyReason: string };
  }>({});
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receiverName, setReceiverName] = useState(currentUserName);

  // Toast Helper
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Available Stores List
  const storeOptions = useMemo(() => {
    const names = new Set(stores.map((s) => s.name));
    if (names.size === 0) {
      names.add('Bole Main Central Store');
      names.add('Kazanchis Bakery Lab & Cold Room');
      names.add('Piassa Branch Roastery');
    }
    return Array.from(names);
  }, [stores]);

  // Filter items in creation modal by fromStore
  const availableSourceItems = useMemo(() => {
    return inventory.filter((i) => {
      const itemStore = i.storeName || 'Bole Main Central Store';
      const matchStore = itemStore.toLowerCase().trim() === fromStore.toLowerCase().trim();
      const matchSearch =
        i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        i.sku.toLowerCase().includes(itemSearch.toLowerCase()) ||
        i.category.toLowerCase().includes(itemSearch.toLowerCase());
      return matchStore && matchSearch;
    });
  }, [inventory, fromStore, itemSearch]);

  const handleToggleItem = (inv: InventoryItem) => {
    setSelectedItems((prev) => {
      const copy = { ...prev };
      if (copy[inv.id] !== undefined) {
        delete copy[inv.id];
      } else {
        copy[inv.id] = {
          qty: Math.min(1, inv.stockQty > 0 ? 1 : 0),
          unitCost: inv.costPerUnit || 0,
        };
      }
      return copy;
    });
  };

  const handleQtyChange = (invId: string, qty: number) => {
    if (qty < 0) return;
    setSelectedItems((prev) => {
      const existing = prev[invId];
      if (!existing) return prev;
      return {
        ...prev,
        [invId]: { ...existing, qty },
      };
    });
  };

  // Validation for Create Form
  const formValidation = useMemo(() => {
    const errors: string[] = [];
    if (fromStore === toStore) {
      errors.push('Source store and destination store cannot be the same location.');
    }

    const itemIds = Object.keys(selectedItems);
    if (itemIds.length === 0) {
      errors.push('Please select at least one raw ingredient/product to transfer.');
    }

    for (const id of itemIds) {
      const inv = inventory.find((i) => i.id === id);
      const data = selectedItems[id];
      if (!inv || !data) continue;
      if (data.qty <= 0) {
        errors.push(`Transfer quantity for "${inv.name}" must be greater than 0.`);
      } else if (data.qty > inv.stockQty) {
        errors.push(
          `Insufficient stock: Requested ${data.qty} ${inv.unit} of "${inv.name}" exceeds available ${inv.stockQty} ${inv.unit} in ${fromStore}.`
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }, [selectedItems, inventory, fromStore, toStore]);

  // Handle Submit New Transfer
  const handleSubmitCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValidation.valid) {
      showToast('error', formValidation.errors[0] || 'Validation error');
      return;
    }

    setActionLoading(true);
    try {
      const itemIds = Object.keys(selectedItems);
      const trnItems: StoreTransferItem[] = itemIds.map((id) => {
        const inv = inventory.find((i) => i.id === id)!;
        const entry = selectedItems[id];
        return {
          inventoryId: inv.id,
          ingredientName: inv.name,
          sku: inv.sku,
          requestedQty: entry.qty,
          availableQty: inv.stockQty,
          qtyTransferred: entry.qty,
          qtyReceived: 0,
          qtyRemaining: entry.qty,
          unit: inv.unit,
          unitCost: entry.unitCost,
          totalCost: Math.round(entry.unitCost * entry.qty * 100) / 100,
        };
      });

      const newVoucherData: Partial<StoreTransferVoucher> = {
        voucherId: `TR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        fromStore,
        toStore,
        requestedBy,
        transferredBy: currentUserName,
        driverOrHandler,
        remark,
        items: trnItems,
        status: initialCreateStatus,
      };

      // Create voucher
      const result = await createStoreTransferVoucher(
        newVoucherData,
        inventory,
        { saveItem, deleteItem },
        currentUserName
      );

      if (!result.success || !result.voucher) {
        throw new Error(result.error || 'Failed to create voucher.');
      }

      // If user chose to dispatch directly (Mark in Transit immediately)
      if (initialCreateStatus === 'In Transit') {
        const dispatchRes = await dispatchStoreTransfer(
          result.voucher,
          inventory,
          { saveItem, deleteItem },
          currentUserName,
          driverOrHandler
        );
        if (!dispatchRes.success) {
          throw new Error(dispatchRes.error || 'Voucher created but dispatch failed.');
        }
        onUpdateTransfer(dispatchRes.voucher!);
      } else {
        onAddTransfer(result.voucher);
      }

      showToast('success', `Transfer #${result.voucher.voucherId} created successfully.`);
      setIsCreateModalOpen(false);
      setSelectedItems({});
      setRemark('');
    } catch (err: any) {
      console.error('Error creating transfer:', err);
      showToast('error', err.message || 'Failed to create transfer.');
    } finally {
      setActionLoading(false);
    }
  };

  // Workflow Handlers
  const handleApprove = async (voucher: StoreTransferVoucher) => {
    setActionLoading(true);
    try {
      const res = await approveStoreTransfer(voucher, { saveItem, deleteItem }, currentUserName);
      if (!res.success || !res.voucher) throw new Error(res.error || 'Approval failed.');
      onUpdateTransfer(res.voucher);
      showToast('success', `Transfer #${voucher.voucherId} approved.`);
      if (selectedVoucherForView?.voucherId === voucher.voucherId) {
        setSelectedVoucherForView(res.voucher);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Approval error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (voucher: StoreTransferVoucher) => {
    setRejectingVoucher(voucher);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingVoucher) return;
    if (!rejectionReasonInput.trim()) {
      showToast('error', 'Please provide a reason for rejecting the transfer.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await rejectStoreTransfer(
        rejectingVoucher,
        rejectionReasonInput.trim(),
        { saveItem, deleteItem },
        currentUserName
      );
      if (!res.success || !res.voucher) throw new Error(res.error || 'Rejection failed.');
      onUpdateTransfer(res.voucher);
      showToast('success', `Transfer #${rejectingVoucher.voucherId} marked as Rejected.`);
      if (selectedVoucherForView?.voucherId === rejectingVoucher.voucherId) {
        setSelectedVoucherForView(res.voucher);
      }
      setRejectingVoucher(null);
    } catch (err: any) {
      showToast('error', err.message || 'Rejection error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatch = async (voucher: StoreTransferVoucher) => {
    setActionLoading(true);
    try {
      const res = await dispatchStoreTransfer(
        voucher,
        inventory,
        { saveItem, deleteItem },
        currentUserName,
        voucher.driverOrHandler
      );
      if (!res.success || !res.voucher) throw new Error(res.error || 'Dispatch failed.');
      onUpdateTransfer(res.voucher);
      showToast('success', `Transfer #${voucher.voucherId} dispatched. Stock deducted from ${voucher.fromStore}.`);
      if (selectedVoucherForView?.voucherId === voucher.voucherId) {
        setSelectedVoucherForView(res.voucher);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Dispatch error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReceiveModal = (voucher: StoreTransferVoucher) => {
    setReceivingVoucher(voucher);
    setReceiverName(currentUserName);
    setReceiveNotes('');

    // Pre-populate expected quantities
    const initialInputs: { [invId: string]: { qtyReceived: number; discrepancyReason: string } } = {};
    voucher.items.forEach((it) => {
      const expected = it.qtyRemaining !== undefined ? it.qtyRemaining : it.qtyTransferred;
      initialInputs[it.inventoryId] = {
        qtyReceived: expected,
        discrepancyReason: '',
      };
    });
    setReceiveBatchInputs(initialInputs);
  };

  const handleConfirmReceive = async () => {
    if (!receivingVoucher) return;

    setActionLoading(true);
    try {
      const receivedItemsPayload = receivingVoucher.items.map((it) => {
        const input = receiveBatchInputs[it.inventoryId] || { qtyReceived: 0, discrepancyReason: '' };
        return {
          inventoryId: it.inventoryId,
          qtyReceived: Number(input.qtyReceived) || 0,
          discrepancyReason: input.discrepancyReason,
        };
      });

      const res = await receiveStoreTransfer(
        receivingVoucher,
        receivedItemsPayload,
        inventory,
        { saveItem, deleteItem },
        receiverName,
        receiveNotes
      );

      if (!res.success || !res.voucher) throw new Error(res.error || 'Receipt recording failed.');
      onUpdateTransfer(res.voucher);
      showToast('success', `Items received at ${receivingVoucher.toStore}. Stock balance credited.`);
      if (selectedVoucherForView?.voucherId === receivingVoucher.voucherId) {
        setSelectedVoucherForView(res.voucher);
      }
      setReceivingVoucher(null);
    } catch (err: any) {
      showToast('error', err.message || 'Receipt error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCancelModal = (voucher: StoreTransferVoucher) => {
    setCancellingVoucher(voucher);
    setCancellationReasonInput('');
  };

  const handleConfirmCancel = async () => {
    if (!cancellingVoucher) return;
    if (!cancellationReasonInput.trim()) {
      showToast('error', 'Please provide a reason for cancellation.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await cancelStoreTransfer(
        cancellingVoucher,
        inventory,
        binCards,
        { saveItem, deleteItem },
        cancellationReasonInput.trim(),
        currentUserName
      );
      if (!res.success || !res.voucher) throw new Error(res.error || 'Cancellation failed.');
      onUpdateTransfer(res.voucher);
      showToast('success', `Transfer #${cancellingVoucher.voucherId} cancelled and stock movements reconciled.`);
      if (selectedVoucherForView?.voucherId === cancellingVoucher.voucherId) {
        setSelectedVoucherForView(res.voucher);
      }
      setCancellingVoucher(null);
    } catch (err: any) {
      showToast('error', err.message || 'Cancellation error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmVoucher) return;
    setActionLoading(true);
    try {
      const res = await deleteStoreTransfer(
        deleteConfirmVoucher,
        inventory,
        binCards,
        { saveItem, deleteItem }
      );
      if (!res.success) throw new Error(res.error || 'Deletion failed.');
      onDeleteTransfer(deleteConfirmVoucher.voucherId);
      showToast('success', `Transfer #${deleteConfirmVoucher.voucherId} deleted.`);
      if (selectedVoucherForView?.voucherId === deleteConfirmVoucher.voucherId) {
        setSelectedVoucherForView(null);
      }
      setDeleteConfirmVoucher(null);
    } catch (err: any) {
      showToast('error', err.message || 'Delete error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Transfers Table
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const matchSearch =
        t.voucherId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.fromStore.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.toStore.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.transferredBy && t.transferredBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.requestedBy && t.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.driverOrHandler && t.driverOrHandler.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.remark && t.remark.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.items.some(
          (it) =>
            it.ingredientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            it.sku.toLowerCase().includes(searchQuery.toLowerCase())
        );

      if (!matchSearch) return false;
      if (filterFromStore !== 'All' && t.fromStore !== filterFromStore) return false;
      if (filterToStore !== 'All' && t.toStore !== filterToStore) return false;
      if (filterStatus !== 'All' && t.status !== filterStatus) return false;
      if (filterDate && t.date !== filterDate) return false;

      return true;
    });
  }, [transfers, searchQuery, filterFromStore, filterToStore, filterStatus, filterDate]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalCount = transfers.length;
    const pending = transfers.filter((t) => t.status === 'Pending' || t.status === 'Draft').length;
    const inTransit = transfers.filter((t) => t.status === 'In Transit' || t.status === 'Partially Received').length;
    const completed = transfers.filter((t) => t.status === 'Completed').length;
    const totalValuation = transfers.reduce((sum, t) => sum + (t.totalCost || 0), 0);
    const totalItemsMoved = transfers.reduce((sum, t) => sum + (t.totalQuantity || 0), 0);

    return { totalCount, pending, inTransit, completed, totalValuation, totalItemsMoved };
  }, [transfers]);

  // Status Badge Helper
  const renderStatusBadge = (status: StoreTransferStatus) => {
    switch (status) {
      case 'Draft':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 w-fit">
            <FileText size={12} /> Draft
          </span>
        );
      case 'Pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 w-fit animate-pulse">
            <Clock size={12} /> Pending Approval
          </span>
        );
      case 'Approved':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 w-fit">
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case 'In Transit':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 w-fit animate-pulse">
            <Truck size={12} /> In Transit
          </span>
        );
      case 'Partially Received':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1.5 w-fit">
            <Layers size={12} /> Partial Received
          </span>
        );
      case 'Completed':
      case 'Received':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
            <PackageCheck size={12} /> Completed
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 w-fit">
            <ShieldAlert size={12} /> Rejected
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-700/60 text-slate-400 border border-slate-600 flex items-center gap-1.5 w-fit">
            <X size={12} /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-bold transition-all ${
            toastMessage.type === 'success'
              ? 'bg-[#0F172A] border-emerald-500/40 text-emerald-300'
              : 'bg-[#0F172A] border-rose-500/40 text-rose-300'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
              Multi-Branch Inventory Logistics
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Live Stock Sync Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1.5 flex items-center gap-2.5">
            <ArrowRightLeft className="text-[#D4AF37]" size={28} />
            Store-to-Store Stock Transfers
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
            Manage multi-store inventory movements, dispatch requisitions, deduct source warehouse stock, inspect & receive branch deliveries, and track dual bin-card transaction histories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedItems({});
              setIsCreateModalOpen(true);
            }}
            className="px-5 py-3 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg min-h-[44px] cursor-pointer"
          >
            <Plus size={18} />
            Create Stock Transfer
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#94A3B8]">Total Transfers</span>
            <ArrowRightLeft size={16} className="text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.totalCount}</p>
          <span className="text-[10px] text-slate-400 mt-1">{stats.totalItemsMoved} Units Moved</span>
        </div>

        <div className="bg-[#1E293B] border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400">Pending Approval</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2">{stats.pending}</p>
          <span className="text-[10px] text-slate-400 mt-1">Awaiting Review</span>
        </div>

        <div className="bg-[#1E293B] border border-cyan-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-400">In Transit</span>
            <Truck size={16} className="text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-300 mt-2">{stats.inTransit}</p>
          <span className="text-[10px] text-slate-400 mt-1">Dispatched On Road</span>
        </div>

        <div className="bg-[#1E293B] border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400">Completed</span>
            <PackageCheck size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-2">{stats.completed}</p>
          <span className="text-[10px] text-slate-400 mt-1">Received & Reconciled</span>
        </div>

        <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-4 flex flex-col justify-between col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#94A3B8]">Total Transferred Valuation</span>
            <Building2 size={16} className="text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-black text-[#D4AF37] mt-2">
            {stats.totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-300">ETB</span>
          </p>
          <span className="text-[10px] text-slate-400 mt-1">Internal non-revenue inventory movement</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by Transfer #, Ingredient, SKU, Handler, Store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* From Store Filter */}
          <div className="flex items-center gap-2 bg-[#0F172A] border border-white/10 rounded-xl px-3 py-1.5">
            <Store size={15} className="text-[#D4AF37]" />
            <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">From:</span>
            <select
              value={filterFromStore}
              onChange={(e) => setFilterFromStore(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
            >
              <option value="All" className="bg-[#0F172A] text-white">All Source Stores</option>
              {storeOptions.map((s) => (
                <option key={s} value={s} className="bg-[#0F172A] text-white">{s}</option>
              ))}
            </select>
          </div>

          {/* To Store Filter */}
          <div className="flex items-center gap-2 bg-[#0F172A] border border-white/10 rounded-xl px-3 py-1.5">
            <Building2 size={15} className="text-cyan-400" />
            <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">To:</span>
            <select
              value={filterToStore}
              onChange={(e) => setFilterToStore(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
            >
              <option value="All" className="bg-[#0F172A] text-white">All Destination Stores</option>
              {storeOptions.map((s) => (
                <option key={s} value={s} className="bg-[#0F172A] text-white">{s}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-[#0F172A] border border-white/10 rounded-xl px-3 py-1.5">
            <Calendar size={15} className="text-amber-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="text-slate-400 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-white/5 pt-3">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter size={12} /> Status:
          </span>
          {[
            { id: 'All', label: 'All Transfers' },
            { id: 'Pending', label: 'Pending Approval' },
            { id: 'Approved', label: 'Approved' },
            { id: 'In Transit', label: 'In Transit' },
            { id: 'Partially Received', label: 'Partially Received' },
            { id: 'Completed', label: 'Completed' },
            { id: 'Rejected', label: 'Rejected' },
            { id: 'Cancelled', label: 'Cancelled' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterStatus === st.id
                  ? 'bg-[#D4AF37] text-black font-extrabold shadow'
                  : 'bg-[#0F172A] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Transfers Table */}
      <div className="bg-[#1E293B] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#0F172A] text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Transfer #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Source (From)</th>
                <th className="py-3.5 px-4">Destination (To)</th>
                <th className="py-3.5 px-4">Items / Qty</th>
                <th className="py-3.5 px-4 text-right">Valuation</th>
                <th className="py-3.5 px-4">Handler / Driver</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ArrowRightLeft size={36} className="mx-auto text-slate-600 mb-2" />
                    <p className="font-bold text-sm text-slate-300">No stock transfers found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or create a new transfer voucher.</p>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((tr) => {
                  const totalQty = tr.items.reduce((sum, i) => sum + i.qtyTransferred, 0);
                  const totalVal = tr.totalCost || tr.items.reduce((sum, i) => sum + (i.totalCost || 0), 0);

                  return (
                    <tr
                      key={tr.voucherId}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => setSelectedVoucherForView(tr)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#D4AF37] whitespace-nowrap">
                        {tr.voucherId}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-white">{tr.date}</div>
                        <span className="text-[10px] text-slate-500">{tr.createdTime}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <Store size={13} className="text-[#D4AF37] shrink-0" />
                          <span className="truncate max-w-[150px]">{tr.fromStore}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                          <Building2 size={13} className="text-cyan-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{tr.toStore}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{tr.items.length} product(s)</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {tr.items.map((it) => `${it.ingredientName} (${it.qtyTransferred} ${it.unit})`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                        {tr.driverOrHandler || tr.transferredBy || 'Direct Courier'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(tr.status)}
                      </td>
                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setSelectedVoucherForView(tr)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="View Transfer Details & Ledger"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Print Document */}
                          <button
                            onClick={() => setSelectedVoucherForPrint(tr)}
                            className="p-1.5 text-slate-400 hover:text-[#D4AF37] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Print Transfer Voucher"
                          >
                            <Printer size={15} />
                          </button>

                          {/* Approve Action */}
                          {(tr.status === 'Pending' || tr.status === 'Draft') && (
                            <button
                              onClick={() => handleApprove(tr)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all shadow cursor-pointer"
                              title="Approve Requisition"
                            >
                              <Check size={13} /> Approve
                            </button>
                          )}

                          {/* Reject Action */}
                          {(tr.status === 'Pending' || tr.status === 'Draft') && (
                            <button
                              onClick={() => handleOpenRejectModal(tr)}
                              disabled={actionLoading}
                              className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Reject Transfer"
                            >
                              <X size={15} />
                            </button>
                          )}

                          {/* Dispatch Action */}
                          {tr.status === 'Approved' && (
                            <button
                              onClick={() => handleDispatch(tr)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold rounded-lg text-[11px] flex items-center gap-1 transition-all shadow cursor-pointer"
                              title="Dispatch & Deduct Stock"
                            >
                              <Truck size={13} /> Dispatch
                            </button>
                          )}

                          {/* Receive Action */}
                          {(tr.status === 'In Transit' || tr.status === 'Partially Received') && (
                            <button
                              onClick={() => handleOpenReceiveModal(tr)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-[11px] flex items-center gap-1 transition-all shadow cursor-pointer"
                              title="Inspect & Receive Goods"
                            >
                              <PackageCheck size={13} /> Receive
                            </button>
                          )}

                          {/* Cancel Action */}
                          {tr.status !== 'Completed' && tr.status !== 'Cancelled' && tr.status !== 'Rejected' && (
                            <button
                              onClick={() => handleOpenCancelModal(tr)}
                              disabled={actionLoading}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Cancel Transfer & Revert Stock"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}

                          {/* Delete (if Draft or Cancelled) */}
                          {(tr.status === 'Draft' || tr.status === 'Cancelled' || tr.status === 'Rejected') && (
                            <button
                              onClick={() => setDeleteConfirmVoucher(tr)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CREATE NEW TRANSFER MODAL - FULLSCREEN                                    */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn font-sans text-slate-200">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-[#D4AF37]">
                <ArrowRightLeft size={24} />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg sm:text-2xl text-[#F8FAFC]">Create Store-to-Store Stock Transfer</h2>
                <p className="text-xs text-slate-400">Initiate requisition and transfer raw ingredients between warehouses & store branches.</p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-[#243244] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <X size={18} />
              <span>Close</span>
            </button>
          </div>

          {/* Modal Form Body */}
          <form onSubmit={handleSubmitCreateTransfer} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto space-y-6">
              {/* Error Callout */}
              {!formValidation.valid && (
                <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-300">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Stock Validation Notice:</span>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                      {formValidation.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Stores & Routing Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#1E293B] p-5 rounded-2xl border border-white/10">
                <div>
                  <label className="block text-xs font-bold text-[#D4AF37] mb-1.5 flex items-center gap-1.5">
                    <Store size={14} /> Source Store (Deducting Warehouse) *
                  </label>
                  <select
                    value={fromStore}
                    onChange={(e) => {
                      setFromStore(e.target.value);
                      setSelectedItems({});
                    }}
                    className="w-full h-[46px] bg-[#0F172A] border border-white/10 rounded-xl px-3.5 text-xs text-white font-bold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {storeOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">Stock availability will be validated against this store.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cyan-400 mb-1.5 flex items-center gap-1.5">
                    <Building2 size={14} /> Destination Store (Receiving Branch) *
                  </label>
                  <select
                    value={toStore}
                    onChange={(e) => setToStore(e.target.value)}
                    className="w-full h-[46px] bg-[#0F172A] border border-white/10 rounded-xl px-3.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {storeOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">Goods will be credited to this store upon receipt.</p>
                </div>
              </div>

              {/* Handler & Routing Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Requested By</label>
                  <input
                    type="text"
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    className="w-full h-[46px] bg-[#1E293B] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Driver / Courier / Handler</label>
                  <input
                    type="text"
                    value={driverOrHandler}
                    onChange={(e) => setDriverOrHandler(e.target.value)}
                    placeholder="e.g. Ermias Courier Truck #04"
                    className="w-full h-[46px] bg-[#1E293B] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Initial Action</label>
                  <select
                    value={initialCreateStatus}
                    onChange={(e) => setInitialCreateStatus(e.target.value as any)}
                    className="w-full h-[46px] bg-[#1E293B] border border-white/10 rounded-xl px-3.5 text-xs font-bold text-amber-300 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    <option value="Pending">Submit for Manager Approval</option>
                    <option value="Approved">Directly Approve (Ready for Dispatch)</option>
                    <option value="In Transit">Dispatch Immediately (Deduct Source Stock)</option>
                  </select>
                </div>
              </div>

              {/* Product Selection Table */}
              <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers size={16} className="text-[#D4AF37]" />
                    Select Items from "{fromStore}" ({Object.keys(selectedItems).length} items selected)
                  </label>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="text"
                      placeholder="Filter source items..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="w-full bg-[#0F172A] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto border border-white/10 rounded-xl bg-[#0F172A] divide-y divide-white/5">
                  {availableSourceItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No stock items found in <span className="font-bold text-white">{fromStore}</span> matching your search.
                    </div>
                  ) : (
                    availableSourceItems.map((inv) => {
                      const isSelected = selectedItems[inv.id] !== undefined;
                      const currentVal = selectedItems[inv.id]?.qty || 0;
                      const hasStock = inv.stockQty > 0;

                      return (
                        <div
                          key={inv.id}
                          className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isSelected ? 'bg-[#D4AF37]/10' : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!hasStock}
                              onChange={() => handleToggleItem(inv)}
                              className="w-5 h-5 rounded text-[#D4AF37] focus:ring-0 cursor-pointer"
                            />
                            <div className="truncate">
                              <p className="font-bold text-white text-xs sm:text-sm truncate">{inv.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                SKU: {inv.sku} · Cost: {inv.costPerUnit || 0} ETB/{inv.unit}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-slate-400">Available:</span>
                              <p className={`font-mono font-bold text-xs ${hasStock ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {inv.stockQty} {inv.unit}
                              </p>
                            </div>

                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <label className="text-[11px] text-[#D4AF37] font-bold">Transfer:</label>
                                <input
                                  type="number"
                                  min="0.01"
                                  max={inv.stockQty}
                                  step="any"
                                  value={currentVal}
                                  onChange={(e) => handleQtyChange(inv.id, parseFloat(e.target.value) || 0)}
                                  className="w-28 bg-[#1E293B] border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white font-bold text-right focus:outline-none focus:border-[#D4AF37]"
                                />
                                <span className="text-xs text-slate-300 font-bold w-8">{inv.unit}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Remarks */}
              <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-slate-300">Transfer Notes / Justification Reason</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="e.g. Weekly branch stock replenishment requisition for bakery shift..."
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white h-24 resize-none focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-full sm:w-auto px-6 h-12 rounded-xl bg-[#243244] hover:bg-[#2F4158] text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formValidation.valid || actionLoading}
                className="w-full sm:w-auto px-8 h-12 bg-[#D4AF37] hover:bg-[#F6C453] disabled:opacity-50 text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                <Check size={18} />
                <span>{actionLoading ? 'Processing...' : 'Create Transfer Voucher (ዝውውር ፍጠር)'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW TRANSFER DETAILS & AUDIT DRAWER / MODAL                             */}
      {/* ========================================================================= */}
      {selectedVoucherForView && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl animate-scaleUp text-slate-200 my-auto">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0F172A]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white font-mono">{selectedVoucherForView.voucherId}</h2>
                    {renderStatusBadge(selectedVoucherForView.status)}
                  </div>
                  <p className="text-xs text-slate-400">Created {selectedVoucherForView.date} at {selectedVoucherForView.createdTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedVoucherForPrint(selectedVoucherForView)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer size={14} /> Print
                </button>
                <button
                  onClick={() => setSelectedVoucherForView(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Route Summary Banner */}
              <div className="bg-[#0F172A] p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] uppercase font-bold text-[#D4AF37]">Source Store (OUT)</span>
                    <p className="font-bold text-white text-sm flex items-center gap-1.5 mt-0.5">
                      <Store size={14} className="text-[#D4AF37]" /> {selectedVoucherForView.fromStore}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-slate-500 hidden sm:block mx-2" />
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] uppercase font-bold text-cyan-400">Destination Store (IN)</span>
                    <p className="font-bold text-white text-sm flex items-center gap-1.5 mt-0.5">
                      <Building2 size={14} className="text-cyan-400" /> {selectedVoucherForView.toStore}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Valuation</span>
                  <p className="text-lg font-black text-emerald-400 font-mono">
                    {(selectedVoucherForView.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers size={14} /> Transferred Products & Quantities
                </h3>
                <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0F172A]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900/60 text-[#94A3B8] border-b border-white/10 text-[11px]">
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3 text-right">Qty Dispatched</th>
                        <th className="py-2.5 px-3 text-right">Qty Received</th>
                        <th className="py-2.5 px-3 text-right">Remaining</th>
                        <th className="py-2.5 px-3 text-right">Unit Cost</th>
                        <th className="py-2.5 px-3 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {selectedVoucherForView.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-bold text-white">{it.ingredientName}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{it.sku}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            {it.qtyTransferred} {it.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            {it.qtyReceived || 0} {it.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                            {it.qtyRemaining !== undefined ? it.qtyRemaining : it.qtyTransferred} {it.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                            {it.unitCost || 0} ETB
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            {(it.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Authorizations & Logistics Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0F172A] p-4 rounded-xl border border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Requested By:</span>
                  <p className="font-bold text-white mt-0.5">{selectedVoucherForView.requestedBy || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Approved By:</span>
                  <p className="font-bold text-white mt-0.5">{selectedVoucherForView.approvedBy || 'Pending'}</p>
                  {selectedVoucherForView.approvedAt && (
                    <span className="text-[10px] text-slate-500">{selectedVoucherForView.approvedAt}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Dispatched By / Driver:</span>
                  <p className="font-bold text-white mt-0.5">{selectedVoucherForView.driverOrHandler || selectedVoucherForView.dispatchedBy || 'N/A'}</p>
                  {selectedVoucherForView.dispatchedAt && (
                    <span className="text-[10px] text-slate-500">{selectedVoucherForView.dispatchedAt}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Received By:</span>
                  <p className="font-bold text-white mt-0.5">{selectedVoucherForView.receivedBy || 'Pending'}</p>
                  {selectedVoucherForView.receivedAt && (
                    <span className="text-[10px] text-slate-500">{selectedVoucherForView.receivedAt}</span>
                  )}
                </div>
              </div>

              {/* Audit Log Trail */}
              {selectedVoucherForView.auditLogs && selectedVoucherForView.auditLogs.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-400" /> Audit Log Trail
                  </h3>
                  <div className="space-y-2 bg-[#0F172A] p-4 rounded-xl border border-white/5">
                    {selectedVoucherForView.auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start justify-between gap-3 text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-[#D4AF37] bg-slate-900 px-2 py-0.5 rounded">
                            {log.action}
                          </span>
                          <span className="text-slate-300 font-bold ml-2">{log.user}</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">{log.notes}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECEIVE TRANSFER MODAL (Supports partial receiving & difference note)     */}
      {/* ========================================================================= */}
      {receivingVoucher && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl animate-scaleUp text-slate-200 my-auto">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0F172A]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <PackageCheck size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Receive Transfer #{receivingVoucher.voucherId}</h2>
                  <p className="text-xs text-slate-400">Inspect received stock at <span className="font-bold text-cyan-300">{receivingVoucher.toStore}</span></p>
                </div>
              </div>
              <button
                onClick={() => setReceivingVoucher(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3 text-xs text-emerald-300">
                <Info size={18} className="shrink-0" />
                <span>
                  Enter the actual quantity received for each product. If fewer units arrived than expected, specify the damage/transit discrepancy note.
                </span>
              </div>

              {/* Items Receiving Matrix */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Inspection & Receipt</h3>
                <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0F172A] divide-y divide-white/5">
                  {receivingVoucher.items.map((it) => {
                    const expected = it.qtyRemaining !== undefined ? it.qtyRemaining : it.qtyTransferred;
                    const input = receiveBatchInputs[it.inventoryId] || { qtyReceived: expected, discrepancyReason: '' };
                    const diff = input.qtyReceived - expected;

                    return (
                      <div key={it.inventoryId} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white text-xs">{it.ingredientName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">SKU: {it.sku}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400">Expected:</span>
                            <p className="font-mono font-bold text-xs text-amber-400">
                              {expected} {it.unit}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              Actual Received Quantity ({it.unit}) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={expected}
                              step="any"
                              value={input.qtyReceived}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setReceiveBatchInputs((prev) => ({
                                  ...prev,
                                  [it.inventoryId]: {
                                    ...prev[it.inventoryId],
                                    qtyReceived: val,
                                  },
                                }));
                              }}
                              className="w-full bg-[#1E293B] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white font-bold text-right focus:outline-none focus:border-emerald-500"
                            />
                            {diff !== 0 && (
                              <p className="text-[10px] text-amber-400 font-bold mt-1">
                                Discrepancy: {diff > 0 ? `+${diff}` : diff} {it.unit}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              Discrepancy / Damage Reason (if any)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 2 units damaged during transport"
                              value={input.discrepancyReason}
                              onChange={(e) => {
                                const val = e.target.value;
                                setReceiveBatchInputs((prev) => ({
                                  ...prev,
                                  [it.inventoryId]: {
                                    ...prev[it.inventoryId],
                                    discrepancyReason: val,
                                  },
                                }));
                              }}
                              className="w-full bg-[#1E293B] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Receiver Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Receiver Name *</label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Inspection Notes</label>
                  <input
                    type="text"
                    placeholder="All containers intact, seal verified..."
                    value={receiveNotes}
                    onChange={(e) => setReceiveNotes(e.target.value)}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setReceivingVoucher(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmReceive}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg cursor-pointer"
                >
                  <PackageCheck size={16} />
                  {actionLoading ? 'Recording Receipt...' : 'Confirm Receipt & Credit Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECT MODAL                                                              */}
      {/* ========================================================================= */}
      {rejectingVoucher && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert size={24} />
              <h3 className="font-bold text-base text-white">Reject Transfer #{rejectingVoucher.voucherId}</h3>
            </div>
            <p className="text-xs text-slate-400">
              Please enter the reason for rejecting this transfer requisition.
            </p>
            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Stock required for impending catering order at source store..."
              className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-3 text-xs text-white h-24 focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingVoucher(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CANCEL MODAL                                                              */}
      {/* ========================================================================= */}
      {cancellingVoucher && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center gap-3 text-amber-400">
              <RotateCcw size={24} />
              <h3 className="font-bold text-base text-white">Cancel Transfer #{cancellingVoucher.voucherId}</h3>
            </div>
            <p className="text-xs text-slate-400">
              {cancellingVoucher.isSourceDeducted
                ? 'This transfer is currently In Transit. Cancelling will atomically restore the deducted stock back to the source store.'
                : 'Cancelling this transfer will mark it as cancelled without altering inventory balances.'}
            </p>
            <textarea
              value={cancellationReasonInput}
              onChange={(e) => setCancellationReasonInput(e.target.value)}
              placeholder="e.g. Delivery truck breakdown / order aborted..."
              className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-3 text-xs text-white h-24 focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCancellingVoucher(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={actionLoading}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {deleteConfirmVoucher && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 size={24} />
              <h3 className="font-bold text-base text-white">Delete Voucher</h3>
            </div>
            <p className="text-xs text-slate-400">
              Are you sure you want to permanently delete Transfer <span className="font-mono text-white font-bold">{deleteConfirmVoucher.voucherId}</span>?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmVoucher(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINTABLE STORE TRANSFER VOUCHER / RECEIPT                                 */}
      {/* ========================================================================= */}
      {selectedVoucherForPrint && (
        <ProfessionalReceiptModal
          receiptData={{
            title: 'Store Transfer Voucher (STV)',
            voucherId: selectedVoucherForPrint.voucherId,
            storeName: `${selectedVoucherForPrint.fromStore} ➔ ${selectedVoucherForPrint.toStore}`,
            customerOrRecipient: `Requested: ${selectedVoucherForPrint.requestedBy || 'Storekeeper'} | Handled by: ${selectedVoucherForPrint.transferredBy || 'Dawit Storekeeper'}`,
            date: selectedVoucherForPrint.date,
            time: selectedVoucherForPrint.createdTime,
            subtotal: selectedVoucherForPrint.totalCost || 0,
            total: selectedVoucherForPrint.totalCost || 0,
            items: selectedVoucherForPrint.items.map((it) => ({
              name: it.ingredientName,
              qty: it.qtyTransferred,
              unit: it.unit,
              unitPrice: it.unitCost,
              priceOrCost: it.totalCost || (it.unitCost ? it.unitCost * it.qtyTransferred : 0),
              sku: it.sku,
            })),
            extraDetails: `Status: ${selectedVoucherForPrint.status} | From: ${selectedVoucherForPrint.fromStore} ➔ To: ${selectedVoucherForPrint.toStore}`,
            notesOrRemarks: selectedVoucherForPrint.remark,
          }}
          onClose={() => setSelectedVoucherForPrint(null)}
        />
      )}
    </div>
  );
};
