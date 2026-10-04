import React, { useState } from 'react';
import { InventoryItem, StoreRequestVoucher, StoreRequestItem, StoreRecord } from '../../types';
import { ShareReceiptButton } from '../ShareReceiptButton';
import { ProfessionalReceiptModal } from '../ProfessionalReceiptModal';
import {
  ClipboardList,
  Plus,
  Trash2,
  Eye,
  Edit,
  FileText,
  AlertTriangle,
  Printer,
  X,
  Search,
  Building2,
  ArrowRight,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  ShieldCheck,
  Package,
} from 'lucide-react';

interface StoreRequestERPProps {
  inventory: InventoryItem[];
  stores: StoreRecord[];
  requests: StoreRequestVoucher[];
  onAddRequest: (request: StoreRequestVoucher) => void;
  onUpdateRequest: (request: StoreRequestVoucher) => void;
  onDeleteRequest: (voucherId: string) => void;
  onApproveRequest?: (request: StoreRequestVoucher, approverName?: string) => Promise<void> | void;
  onDenyRequest?: (voucherId: string, reason?: string) => Promise<void> | void;
}

export const StoreRequestERP: React.FC<StoreRequestERPProps> = ({
  inventory,
  stores,
  requests,
  onAddRequest,
  onUpdateRequest,
  onDeleteRequest,
  onApproveRequest,
  onDenyRequest,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<StoreRequestVoucher | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<StoreRequestVoucher | null>(null);

  // Approval & Denial states
  const [approvingVoucher, setApprovingVoucher] = useState<StoreRequestVoucher | null>(null);
  const [approverName, setApproverName] = useState('Store Manager Dawit');
  const [denyingVoucher, setDenyingVoucher] = useState<StoreRequestVoucher | null>(null);
  const [denialReason, setDenialReason] = useState('');
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [searchFilter, setSearchFilter] = useState('');

  // Store selection for new request
  const [currentRequestingStore, setCurrentRequestingStore] = useState(
    stores[0]?.name || 'Kitchen & Bakery Sub-Store'
  );
  const [targetIssuingStore, setTargetIssuingStore] = useState(
    stores[1]?.name || stores[0]?.name || 'Bole Main Central Warehouse'
  );

  // Multi-Item Request Form State
  const [requestedBy, setRequestedBy] = useState('Chef Biruk Tadesse');
  const [department, setDepartment] = useState('Kitchen & Bakery Bar');
  const [remark, setRemark] = useState('');

  // Selected ingredients with requested quantities: { [invId]: quantity }
  const [selectedItems, setSelectedItems] = useState<{ [invId: string]: number }>({});
  const [itemSearch, setItemSearch] = useState('');

  // Find Low Stock / Minimum Amount Items in Inventory
  const lowStockItems = inventory.filter(
    (item) => item.stockQty <= item.reorderLevel || item.stockQty === 0
  );

  const handleToggleItem = (inv: InventoryItem) => {
    setSelectedItems((prev) => {
      const copy = { ...prev };
      if (copy[inv.id] !== undefined) {
        delete copy[inv.id];
      } else {
        copy[inv.id] = Math.max(1, inv.reorderLevel - inv.stockQty > 0 ? inv.reorderLevel - inv.stockQty + 5 : 5);
      }
      return copy;
    });
  };

  const handleQtyChange = (invId: string, qty: number) => {
    if (qty <= 0) return;
    setSelectedItems((prev) => ({ ...prev, [invId]: qty }));
  };

  const handleQuickAddLowStock = (inv: InventoryItem) => {
    setIsModalOpen(true);
    const suggestedQty = Math.max(5, (inv.reorderLevel || 10) * 2 - inv.stockQty);
    setSelectedItems((prev) => ({
      ...prev,
      [inv.id]: suggestedQty,
    }));
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const itemIds = Object.keys(selectedItems);
    if (itemIds.length === 0) return;

    const reqItems: StoreRequestItem[] = itemIds.map((id) => {
      const inv = inventory.find((i) => i.id === id)!;
      return {
        inventoryId: inv.id,
        ingredientName: inv.name,
        sku: inv.sku,
        qtyRequested: selectedItems[id],
        unit: inv.unit,
        availableStock: inv.stockQty,
      };
    });

    const newVoucher: StoreRequestVoucher = {
      voucherId: `SRV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      requestedBy,
      requestingStore: currentRequestingStore,
      targetStore: targetIssuingStore,
      department,
      status: 'Pending', // New requests default to Pending awaiting Store Keeper approval
      createdTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      remark: remark || `Material Requisition from ${currentRequestingStore}`,
      items: reqItems,
    };

    onAddRequest(newVoucher);
    setIsModalOpen(false);
    setSelectedItems({});
    setRemark('');

    setActionSuccessToast(`Requisition ${newVoucher.voucherId} created and submitted for approval!`);
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  const handleConfirmApproval = async () => {
    if (!approvingVoucher) return;
    if (onApproveRequest) {
      await onApproveRequest(approvingVoucher, approverName);
    }
    const approvedId = approvingVoucher.voucherId;
    setApprovingVoucher(null);
    if (selectedVoucherForView && selectedVoucherForView.voucherId === approvedId) {
      setSelectedVoucherForView(null);
    }
    setActionSuccessToast(`✓ Requisition ${approvedId} ACCEPTED! Raw materials deducted from stock & Transfer Voucher generated.`);
    setTimeout(() => setActionSuccessToast(null), 5000);
  };

  const handleConfirmDenial = async () => {
    if (!denyingVoucher) return;
    if (onDenyRequest) {
      await onDenyRequest(denyingVoucher.voucherId, denialReason || 'Declined by Store Keeper');
    }
    const deniedId = denyingVoucher.voucherId;
    setDenyingVoucher(null);
    setDenialReason('');
    if (selectedVoucherForView && selectedVoucherForView.voucherId === deniedId) {
      setSelectedVoucherForView(null);
    }
    setActionSuccessToast(`Requisition ${deniedId} has been REJECTED / DENIED.`);
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  const filteredInventory = inventory.filter(
    (i) =>
      i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      i.sku.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'All' ? true : r.status === statusFilter;
    const matchesSearch =
      searchFilter === '' ||
      r.voucherId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.requestedBy.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.requestingStore || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.targetStore.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.items.some((it) => it.ingredientName.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const approvedCount = requests.filter((r) => r.status === 'Approved' || r.status === 'Issued').length;
  const rejectedCount = requests.filter((r) => r.status === 'Rejected').length;

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#22C55E] text-[#0F172A] px-5 py-3.5 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-3 border border-white/20 animate-bounce">
          <CheckCircle2 size={18} />
          <span>{actionSuccessToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
            Material Requisitions & Internal Store Request
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1.5 flex items-center gap-2.5">
            <ClipboardList className="text-[#D4AF37]" size={28} />
            Store Requisitions & Material Requests
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Request raw materials, review approval workflows, deduct issued items from stock balances, and automatically generate Store Transfer vouchers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-[16px] text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg min-h-[46px] cursor-pointer self-start lg:self-auto"
        >
          <Plus size={18} />
          <span>New Store Requisition Request</span>
        </button>
      </div>

      {/* Store Context Selector Card */}
      <div className="bg-[#243244] p-5 sm:p-6 rounded-[24px] border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <Building2 size={16} className="text-[#D4AF37]" />
              Active Location & Requisition Route
            </h2>
            <p className="text-xs text-[#94A3B8]">Select your current store location and default central supplier store</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Requesting Store */}
            <div className="flex items-center gap-2 bg-[#1E293B] p-2 px-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">My Location:</span>
              <select
                value={currentRequestingStore}
                onChange={(e) => setCurrentRequestingStore(e.target.value)}
                className="bg-transparent text-[#D4AF37] font-bold text-xs focus:outline-none cursor-pointer"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.name} className="bg-[#1E293B] text-[#F8FAFC]">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight size={16} className="text-[#94A3B8] hidden sm:inline" />

            {/* Target Store */}
            <div className="flex items-center gap-2 bg-[#1E293B] p-2 px-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Target Central Store:</span>
              <select
                value={targetIssuingStore}
                onChange={(e) => setTargetIssuingStore(e.target.value)}
                className="bg-transparent text-[#22C55E] font-bold text-xs focus:outline-none cursor-pointer"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.name} className="bg-[#1E293B] text-[#F8FAFC]">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Low Stock & Minimum Amount Warning Panel */}
        {lowStockItems.length > 0 && (
          <div className="bg-[#3B151A] border border-[#EF4444]/40 p-4 sm:p-5 rounded-[20px] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#EF4444]">
                <AlertTriangle size={20} className="animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm text-[#FCA5A5]">
                    Minimum Stock Level & Depleted Raw Materials Alert ({lowStockItems.length} Items)
                  </h3>
                  <p className="text-[11px] text-[#F87171]">
                    The following ingredients are running out or below their minimum stock threshold. Click to request replenishment immediately!
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {lowStockItems.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-[#1E293B] p-3 rounded-xl border border-[#EF4444]/30 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#F8FAFC] block truncate max-w-[150px]">{inv.name}</span>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-red-400 font-extrabold">Stock: {inv.stockQty} {inv.unit}</span>
                      <span className="text-[#94A3B8]">Min: {inv.reorderLevel} {inv.unit}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickAddLowStock(inv)}
                    className="bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer min-h-[36px]"
                  >
                    <Send size={12} /> Quick Request
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Requisition Vouchers Table & Approval Workflow Card */}
      <div className="bg-[#243244] p-6 rounded-[24px] border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#F8FAFC]">Store Requisition Vouchers & Approvals</h2>
            <p className="text-xs text-[#94A3B8]">Review pending requests, approve to automatically deduct stock & issue Store Transfers, or reject</p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'All'
                  ? 'bg-[#D4AF37] text-[#0F172A]'
                  : 'bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Pending'
                  ? 'bg-amber-500 text-[#0F172A]'
                  : 'bg-[#1E293B] text-amber-400 hover:text-amber-300'
              }`}
            >
              <Clock size={13} />
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('Approved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Approved'
                  ? 'bg-emerald-500 text-[#0F172A]'
                  : 'bg-[#1E293B] text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 size={13} />
              Approved & Transferred ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('Rejected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Rejected'
                  ? 'bg-rose-500 text-white'
                  : 'bg-[#1E293B] text-rose-400 hover:text-rose-300'
              }`}
            >
              <XCircle size={13} />
              Denied ({rejectedCount})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex justify-between items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by Voucher ID, Requester, Location or Ingredient..."
              className="w-full h-10 bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-9 pr-4 text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#CBD5E1]">
            <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-[10px] font-extrabold tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Voucher ID</th>
                <th className="py-3.5 px-4">Requester & Location</th>
                <th className="py-3.5 px-4">Target Central Store</th>
                <th className="py-3.5 px-4">Requested Items</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Status / Transfer</th>
                <th className="py-3.5 px-4 text-center">Approval & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#94A3B8]">
                    No material request vouchers match the current filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const isPending = r.status === 'Pending';
                  const isApproved = r.status === 'Approved' || r.status === 'Issued';
                  const isRejected = r.status === 'Rejected';

                  return (
                    <tr key={r.voucherId} className="hover:bg-[#1E293B]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#D4AF37]">
                        {r.voucherId}
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <span className="font-bold text-[#F8FAFC] block">{r.requestedBy}</span>
                        <span className="text-[10px] text-[#94A3B8] block">{r.requestingStore || r.department}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#22C55E]">{r.targetStore}</td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-bold text-[#D4AF37] block">{r.items.length} Ingredients</span>
                          <div className="text-[10px] text-[#94A3B8] max-w-[200px] truncate">
                            {r.items.map((i) => `${i.ingredientName} (${i.qtyRequested} ${i.unit})`).join(', ')}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span>{r.date}</span> <span className="text-[10px] text-[#94A3B8] block">{r.createdTime}</span>
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                            <Clock size={11} /> Pending Approval
                          </span>
                        )}
                        {isApproved && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                              <CheckCircle2 size={11} /> Approved & Issued
                            </span>
                            {r.linkedTransferVoucherId && (
                              <div className="text-[10px] font-mono text-[#D4AF37] flex items-center gap-1">
                                <ArrowRightLeft size={10} /> {r.linkedTransferVoucherId}
                              </div>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                              <XCircle size={11} /> Denied
                            </span>
                            {r.rejectionReason && (
                              <p className="text-[10px] text-rose-300 italic truncate max-w-[150px]">
                                {r.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Accept / Approve Button for Pending Requests */}
                          {isPending && (
                            <button
                              onClick={() => setApprovingVoucher(r)}
                              className="px-2.5 py-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-[#0F172A] font-extrabold text-[11px] rounded-lg transition-all flex items-center gap-1 shadow cursor-pointer min-h-[34px]"
                              title="Accept & Deduct from Store Balance"
                            >
                              <CheckCircle2 size={13} />
                              <span>Accept / ይጽደቅ</span>
                            </button>
                          )}

                          {/* Deny / Reject Button for Pending Requests */}
                          {isPending && (
                            <button
                              onClick={() => {
                                setDenyingVoucher(r);
                                setDenialReason('');
                              }}
                              className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-extrabold text-[11px] rounded-lg border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer min-h-[34px]"
                              title="Deny / Reject Requisition"
                            >
                              <XCircle size={13} />
                              <span>Deny</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedVoucherForView(r)}
                            className="p-1.5 bg-[#1E293B] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0F172A] rounded-lg transition-all min-h-[34px] min-w-[34px] inline-flex items-center justify-center cursor-pointer"
                            title="View Official Voucher Receipt"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            onClick={() => setEditingVoucher(r)}
                            className="p-1.5 bg-[#1E293B] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white rounded-lg transition-all min-h-[34px] min-w-[34px] inline-flex items-center justify-center cursor-pointer"
                            title="Edit Request"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => onDeleteRequest(r.voucherId)}
                            className="p-1.5 bg-[#1E293B] text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all min-h-[34px] min-w-[34px] inline-flex items-center justify-center cursor-pointer"
                            title="Delete Request"
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
      </div>

      {/* MODAL: Accept & Approve Requisition with Inventory Deduction Preview */}
      {approvingVoucher && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-[#1E293B] border border-white/10 rounded-[28px] max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-[#F8FAFC] my-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 text-[#22C55E]">
                <ShieldCheck size={24} />
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#F8FAFC]">Accept & Approve Store Requisition</h3>
                  <p className="text-xs text-[#94A3B8]">Voucher ID: {approvingVoucher.voucherId}</p>
                </div>
              </div>
              <button
                onClick={() => setApprovingVoucher(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Impact Notification Banner */}
            <div className="bg-emerald-950/50 border border-emerald-500/40 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold">
                <CheckCircle2 size={16} />
                <span>Automated Store Transfer & Inventory Deduction Process</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[#CBD5E1] text-[11px]">
                <li>
                  Deducts raw materials from <strong className="text-white">{approvingVoucher.targetStore}</strong> stock balance.
                </li>
                <li>
                  Automatically creates an official <strong>Store Transfer Voucher</strong> for <strong className="text-white">{approvingVoucher.requestingStore || approvingVoucher.department}</strong>.
                </li>
                <li>
                  Records chronological entries in the <strong>Store Bin Card Ledger</strong>.
                </li>
              </ul>
            </div>

            {/* Item Breakdown & Stock Deduction Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                Raw Materials to be Deducted & Issued ({approvingVoucher.items.length})
              </label>

              <div className="max-h-48 overflow-y-auto border border-white/10 rounded-xl p-2 bg-[#243244] divide-y divide-white/5 space-y-1">
                {approvingVoucher.items.map((it, idx) => {
                  const inv = inventory.find((i) => i.id === it.inventoryId);
                  const currentStock = inv ? inv.stockQty : it.availableStock;
                  const newStock = Math.max(0, currentStock - it.qtyRequested);

                  return (
                    <div key={idx} className="p-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#F8FAFC] block">{it.ingredientName}</span>
                        <span className="text-[10px] text-[#94A3B8]">SKU: {it.sku}</span>
                      </div>

                      <div className="text-right space-y-0.5">
                        <div className="font-extrabold text-[#D4AF37]">
                          Issue: -{it.qtyRequested} {it.unit}
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">
                          Stock: {currentStock} → <strong className="text-[#22C55E]">{newStock} {it.unit}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Approver Name */}
            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                Authorized Store Keeper / Approver Name *
              </label>
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="w-full h-11 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#22C55E]"
                placeholder="e.g. Store Manager Dawit"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApprovingVoucher(null)}
                className="flex-1 h-11 bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="flex-1 h-11 bg-[#22C55E] hover:bg-[#16A34A] text-[#0F172A] rounded-xl text-xs font-extrabold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>Confirm & Deduct Stock</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Deny / Reject Requisition */}
      {denyingVoucher && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1E293B] border border-white/10 rounded-[28px] max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl text-[#F8FAFC]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <XCircle size={22} />
                <h3 className="font-serif font-bold text-lg text-[#F8FAFC]">Deny Requisition Request</h3>
              </div>
              <button
                onClick={() => setDenyingVoucher(null)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#CBD5E1]">
              Are you sure you want to decline Requisition <strong className="text-[#D4AF37]">{denyingVoucher.voucherId}</strong>? No inventory stock will be deducted.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                Reason for Rejection / ውድቅ የተደረገበት ምክንያት
              </label>
              <textarea
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                placeholder="e.g. Central store stock insufficient; alternative ingredient required"
                rows={3}
                className="w-full bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDenyingVoucher(null)}
                className="flex-1 h-11 bg-[#243244] text-[#CBD5E1] rounded-xl text-xs font-bold cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmDenial}
                className="flex-1 h-11 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <XCircle size={16} />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Create Multi-Item Request Voucher */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#F8FAFC]">Create Store Requisition Voucher</h3>
                <p className="text-xs text-[#CBD5E1]">Issue material request ticket from your location to central store</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#243244] transition-all cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmitRequest} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#1E293B] p-6 rounded-2xl border border-white/10 shadow-lg">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Requesting Location *</label>
                  <select
                    value={currentRequestingStore}
                    onChange={(e) => setCurrentRequestingStore(e.target.value)}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Target Issuing Store *</label>
                  <select
                    value={targetIssuingStore}
                    onChange={(e) => setTargetIssuingStore(e.target.value)}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Requested By (Staff Name) *</label>
                  <input
                    type="text"
                    required
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Select Multiple Raw Ingredients */}
              <div className="bg-[#1E293B] p-6 rounded-2xl border border-white/10 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <label className="block text-sm font-bold text-[#D4AF37] uppercase tracking-wider">
                      Select Raw Materials ({Object.keys(selectedItems).length} Items Selected)
                    </label>
                    <p className="text-xs text-[#CBD5E1]">Pick the ingredients needed for this requisition</p>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Search raw material..."
                      className="w-full sm:w-64 h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl pl-9 pr-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                    <Search size={16} className="absolute left-3 top-3 text-[#94A3B8]" />
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto border border-white/10 rounded-xl p-3 bg-[#243244] space-y-2.5">
                  {filteredInventory.map((inv) => {
                    const isChecked = selectedItems[inv.id] !== undefined;
                    const isLow = inv.stockQty <= inv.reorderLevel;

                    return (
                      <div
                        key={inv.id}
                        className={`p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border transition-all ${
                          isChecked
                            ? 'bg-[#1E293B] border-[#D4AF37] text-[#F8FAFC]'
                            : 'bg-[#1E293B]/60 border-white/5 text-[#CBD5E1] hover:bg-[#1E293B]'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItem(inv)}
                            className="w-5 h-5 accent-[#D4AF37] rounded cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#F8FAFC] block">{inv.name}</span>
                              {isLow && (
                                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black px-2 py-0.5 rounded-full">
                                  LOW STOCK
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#94A3B8]">
                              SKU: {inv.sku} | Avail Stock: <strong className="text-[#F8FAFC]">{inv.stockQty} {inv.unit}</strong> | Min: {inv.reorderLevel} {inv.unit}
                            </span>
                          </div>
                        </label>

                        {isChecked && (
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="text-[11px] text-[#94A3B8] font-bold">Requested Qty:</span>
                            <input
                              type="number"
                              min={1}
                              value={selectedItems[inv.id]}
                              onChange={(e) => handleQtyChange(inv.id, Number(e.target.value))}
                              className="w-24 h-9 bg-[#243244] text-[#D4AF37] font-extrabold border border-[#D4AF37]/50 rounded-lg px-2 text-sm focus:outline-none"
                            />
                            <span className="text-xs text-[#CBD5E1] font-bold">{inv.unit}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#1E293B] p-6 rounded-2xl border border-white/10 shadow-lg space-y-1.5">
                <label className="block text-xs font-bold text-[#CBD5E1]">Voucher Remark / Reason *</label>
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="e.g. Daily morning kitchen prep supply requisition"
                  className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-6 h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 hover:bg-[#2F4158] rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Object.keys(selectedItems).length === 0}
                className="w-full sm:w-auto px-8 h-12 bg-[#D4AF37] hover:bg-[#F6C453] disabled:opacity-40 text-[#0F172A] rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                Submit Requisition Voucher
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: View Official Request Voucher / Printable Receipt Ticket */}
      {selectedVoucherForView && (
        <ProfessionalReceiptModal
          receiptData={{
            title: 'Store Requisition Voucher (SRV)',
            voucherId: selectedVoucherForView.voucherId,
            storeName: `${selectedVoucherForView.requestingStore || selectedVoucherForView.department} ➔ ${selectedVoucherForView.targetStore}`,
            customerOrRecipient: `Requested By: ${selectedVoucherForView.requestedBy} | Dept: ${selectedVoucherForView.department}`,
            date: selectedVoucherForView.date,
            time: selectedVoucherForView.createdTime,
            items: selectedVoucherForView.items.map((it) => ({
              name: it.ingredientName,
              qty: it.qtyRequested,
              unit: it.unit,
              sku: it.sku,
            })),
            extraDetails: `Status: ${selectedVoucherForView.status}${
              selectedVoucherForView.linkedTransferVoucherId
                ? ` | Linked STV: ${selectedVoucherForView.linkedTransferVoucherId}`
                : ''
            }`,
            notesOrRemarks: selectedVoucherForView.remark || (selectedVoucherForView.rejectionReason ? `Rejected Reason: ${selectedVoucherForView.rejectionReason}` : undefined),
          }}
          onClose={() => setSelectedVoucherForView(null)}
          customActions={
            selectedVoucherForView.status === 'Pending' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const v = selectedVoucherForView;
                    setSelectedVoucherForView(null);
                    setApprovingVoucher(v);
                  }}
                  className="px-3.5 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-[#0F172A] rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer min-h-[42px]"
                >
                  <CheckCircle2 size={15} /> Accept & Issue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const v = selectedVoucherForView;
                    setSelectedVoucherForView(null);
                    setDenyingVoucher(v);
                    setDenialReason('');
                  }}
                  className="px-3.5 py-2.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-xl text-xs font-bold border border-rose-500/30 cursor-pointer min-h-[42px]"
                >
                  <XCircle size={15} /> Deny
                </button>
              </div>
            ) : undefined
          }
        />
      )}

      {/* MODAL 3: Edit Request Voucher */}
      {editingVoucher && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#F8FAFC]">
                  Edit Material Requisition Voucher
                </h3>
                <span className="text-xs font-mono text-[#D4AF37]">{editingVoucher.voucherId}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEditingVoucher(null)}
              className="p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#243244] transition-all cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Form Content */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdateRequest(editingVoucher);
              setEditingVoucher(null);
            }}
            className="flex-1 flex flex-col justify-between overflow-y-auto"
          >
            <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
              {/* Stores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#1E293B] p-6 rounded-2xl border border-white/10 shadow-lg">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Requesting Store / Sub-Unit *</label>
                  <select
                    value={editingVoucher.requestingStore}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, requestingStore: e.target.value })}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Target Issuing Warehouse *</label>
                  <select
                    value={editingVoucher.issuingStore}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, issuingStore: e.target.value })}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Requester & Department & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#1E293B] p-6 rounded-2xl border border-white/10 shadow-lg">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Requested By</label>
                  <input
                    type="text"
                    value={editingVoucher.requestedBy}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, requestedBy: e.target.value })}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Department</label>
                  <input
                    type="text"
                    value={editingVoucher.department}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, department: e.target.value })}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#CBD5E1]">Date</label>
                  <input
                    type="date"
                    value={editingVoucher.date}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, date: e.target.value })}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Remark */}
              <div className="bg-[#1E293B] p-6 rounded-2xl border border-white/10 shadow-lg space-y-1.5">
                <label className="block text-xs font-bold text-[#CBD5E1]">Voucher Remark / Notes</label>
                <input
                  type="text"
                  value={editingVoucher.remark || ''}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, remark: e.target.value })}
                  placeholder="Reason for requisition..."
                  className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Requested Items List */}
              <div className="bg-[#1E293B] p-6 rounded-2xl border border-white/10 shadow-lg space-y-4">
                <label className="block text-sm font-bold text-[#D4AF37] uppercase tracking-wider">
                  Requested Items & Quantities ({editingVoucher.items.length})
                </label>
                <div className="max-h-60 overflow-y-auto border border-white/10 rounded-xl p-3 bg-[#243244] space-y-2.5">
                  {editingVoucher.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[#1E293B] rounded-xl border border-white/5 text-xs">
                      <div>
                        <span className="font-bold text-sm text-[#F8FAFC] block">{item.ingredientName}</span>
                        <span className="text-[11px] text-[#94A3B8]">SKU: {item.sku}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#94A3B8] font-bold">Qty:</span>
                        <input
                          type="number"
                          min={0.1}
                          step="any"
                          value={item.qtyRequested}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const newItems = [...editingVoucher.items];
                            newItems[idx] = { ...newItems[idx], qtyRequested: val };
                            setEditingVoucher({ ...editingVoucher, items: newItems });
                          }}
                          className="w-24 h-9 bg-[#243244] text-[#D4AF37] font-bold border border-[#D4AF37]/40 rounded-lg px-2 text-sm focus:outline-none"
                        />
                        <span className="text-xs text-[#CBD5E1] font-bold">{item.unit}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = editingVoucher.items.filter((_, i) => i !== idx);
                            setEditingVoucher({ ...editingVoucher, items: newItems });
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-400 cursor-pointer rounded-lg hover:bg-red-500/10"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
              <button
                type="button"
                onClick={() => setEditingVoucher(null)}
                className="w-full sm:w-auto px-6 h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 hover:bg-[#2F4158] rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 h-12 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
