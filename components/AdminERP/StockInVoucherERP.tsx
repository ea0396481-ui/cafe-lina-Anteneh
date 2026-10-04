import React, { useState } from 'react';
import { InventoryItem, StockInItem, StockInVoucher, Supplier, StoreRecord } from '../../types';
import { ShareReceiptButton } from '../ShareReceiptButton';
import { ProfessionalReceiptModal } from '../ProfessionalReceiptModal';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Printer,
  Calendar,
  Building2,
  DollarSign,
  PackageCheck,
  X,
  Receipt,
  Download,
  Clock,
  Sparkles,
  Pencil,
  Edit,
} from 'lucide-react';

interface StockInVoucherERPProps {
  inventory: InventoryItem[];
  suppliers: Supplier[];
  stores?: StoreRecord[];
  stockInVouchers: StockInVoucher[];
  onAddStockInVoucher: (voucher: StockInVoucher) => void;
  onUpdateStockInVoucher?: (voucher: StockInVoucher) => void;
  onDeleteStockInVoucher?: (voucherId: string) => void;
}

export const StockInVoucherERP: React.FC<StockInVoucherERPProps> = ({
  inventory,
  suppliers,
  stores = [],
  stockInVouchers,
  onAddStockInVoucher,
  onUpdateStockInVoucher,
  onDeleteStockInVoucher,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucherForReceipt, setSelectedVoucherForReceipt] = useState<StockInVoucher | null>(null);

  // Edit Voucher state
  const [editingVoucher, setEditingVoucher] = useState<StockInVoucher | null>(null);
  const [editIngredientSearch, setEditIngredientSearch] = useState('');

  // Form state for new Stock In Entry
  const [remark, setRemark] = useState('');
  const [fsNumber, setFsNumber] = useState(`FS-${Math.floor(100000 + Math.random() * 900000)}`);
  const [stockInDate, setStockInDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState(suppliers[0]?.name || 'Abyssinia Coffee Traders');
  const [receivingStore, setReceivingStore] = useState(
    stores.length > 0 ? stores[0].name : 'Bole Main Central Store'
  );

  // Items added to this Stock In batch
  const [stagedItems, setStagedItems] = useState<StockInItem[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');

  // Search filtered inventory to add for new voucher
  const availableInventoryToAdd = inventory.filter(
    (inv) =>
      !stagedItems.some((s) => s.inventoryId === inv.id) &&
      (inv.name.toLowerCase().includes(ingredientSearch.toLowerCase()) ||
        inv.sku.toLowerCase().includes(ingredientSearch.toLowerCase()) ||
        inv.category.toLowerCase().includes(ingredientSearch.toLowerCase()))
  );

  // Search filtered inventory to add for edit voucher
  const availableInventoryForEdit = editingVoucher
    ? inventory.filter(
        (inv) =>
          !editingVoucher.items.some((s) => s.inventoryId === inv.id) &&
          (inv.name.toLowerCase().includes(editIngredientSearch.toLowerCase()) ||
            inv.sku.toLowerCase().includes(editIngredientSearch.toLowerCase()) ||
            inv.category.toLowerCase().includes(editIngredientSearch.toLowerCase()))
      )
    : [];

  // Add ingredient to staging list
  const handleAddIngredientToStage = (inv: InventoryItem) => {
    const newItem: StockInItem = {
      inventoryId: inv.id,
      ingredientName: inv.name,
      sku: inv.sku,
      qty: 10,
      unit: inv.unit,
      unitCost: inv.costPerUnit,
      totalCost: 10 * inv.costPerUnit,
      hasExpiry: inv.hasExpiry || false,
      expiryDate: inv.expiryDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setStagedItems((prev) => [...prev, newItem]);
  };

  // Update line item quantity or unit cost
  const handleUpdateItemField = (
    invId: string,
    field: 'qty' | 'unitCost' | 'hasExpiry' | 'expiryDate',
    val: any
  ) => {
    setStagedItems((prev) =>
      prev.map((item) => {
        if (item.inventoryId === invId) {
          const updated = { ...item, [field]: val };
          updated.totalCost = updated.qty * updated.unitCost;
          return updated;
        }
        return item;
      })
    );
  };

  // Remove item from staging
  const handleRemoveStagedItem = (invId: string) => {
    setStagedItems((prev) => prev.filter((i) => i.inventoryId !== invId));
  };

  // Grand Total of Stock In Batch
  const grandTotal = stagedItems.reduce((sum, item) => sum + item.totalCost, 0);

  // Submit Stock In & Generate Receipt Voucher
  const handleSubmitStockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (stagedItems.length === 0) return;

    const voucherId = `VOUCHER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newVoucher: StockInVoucher = {
      voucherId,
      date: stockInDate,
      supplierName,
      receivingStore,
      fsNumber,
      remark: remark || 'Standard raw materials stock intake',
      items: stagedItems,
      grandTotal,
      createdTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onAddStockInVoucher(newVoucher);

    // Show receipt popup
    setSelectedVoucherForReceipt(newVoucher);

    // Reset & close form modal
    setIsModalOpen(false);
    setStagedItems([]);
    setRemark('');
    setFsNumber(`FS-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  // OPEN EDIT VOUCHER
  const handleOpenEdit = (v: StockInVoucher) => {
    setEditingVoucher({
      ...v,
      items: v.items.map((it) => ({ ...it })),
    });
    setEditIngredientSearch('');
  };

  // Update line item in editing voucher
  const handleEditItemField = (
    invId: string,
    field: 'qty' | 'unitCost' | 'hasExpiry' | 'expiryDate',
    val: any
  ) => {
    if (!editingVoucher) return;
    const updatedItems = editingVoucher.items.map((it) => {
      if (it.inventoryId === invId) {
        const itemCopy = { ...it, [field]: val };
        itemCopy.totalCost = (Number(itemCopy.qty) || 0) * (Number(itemCopy.unitCost) || 0);
        return itemCopy;
      }
      return it;
    });

    const newGrandTotal = updatedItems.reduce((sum, it) => sum + it.totalCost, 0);
    setEditingVoucher({
      ...editingVoucher,
      items: updatedItems,
      grandTotal: newGrandTotal,
    });
  };

  // Remove line item from editing voucher
  const handleEditRemoveItem = (invId: string) => {
    if (!editingVoucher) return;
    const updatedItems = editingVoucher.items.filter((it) => it.inventoryId !== invId);
    const newGrandTotal = updatedItems.reduce((sum, it) => sum + it.totalCost, 0);
    setEditingVoucher({
      ...editingVoucher,
      items: updatedItems,
      grandTotal: newGrandTotal,
    });
  };

  // Add ingredient into editing voucher
  const handleEditAddIngredient = (inv: InventoryItem) => {
    if (!editingVoucher) return;
    const newItem: StockInItem = {
      inventoryId: inv.id,
      ingredientName: inv.name,
      sku: inv.sku,
      qty: 10,
      unit: inv.unit,
      unitCost: inv.costPerUnit,
      totalCost: 10 * inv.costPerUnit,
      hasExpiry: inv.hasExpiry || false,
      expiryDate: inv.expiryDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    const updatedItems = [...editingVoucher.items, newItem];
    const newGrandTotal = updatedItems.reduce((sum, it) => sum + it.totalCost, 0);
    setEditingVoucher({
      ...editingVoucher,
      items: updatedItems,
      grandTotal: newGrandTotal,
    });
    setEditIngredientSearch('');
  };

  // SAVE EDITED VOUCHER
  const handleSaveEditedVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoucher || editingVoucher.items.length === 0) return;

    const recalculatedTotal = editingVoucher.items.reduce(
      (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unitCost) || 0),
      0
    );

    const finalizedVoucher: StockInVoucher = {
      ...editingVoucher,
      grandTotal: recalculatedTotal,
    };

    if (onUpdateStockInVoucher) {
      onUpdateStockInVoucher(finalizedVoucher);
    }

    if (selectedVoucherForReceipt && selectedVoucherForReceipt.voucherId === finalizedVoucher.voucherId) {
      setSelectedVoucherForReceipt(finalizedVoucher);
    }

    setEditingVoucher(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
            Stock In Receiving & Receipt Voucher Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1 flex items-center gap-2">
            <Receipt className="text-[#D4AF37]" size={28} />
            Stock In Receiving & Voucher Management
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Register incoming raw materials with Remark, FS #, Date & Supplier. Multi-ingredient batch addition updates unit prices dynamically and prints professional vouchers!
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg hover:shadow-[#D4AF37]/20 active:scale-95 min-h-[44px]"
        >
          <Plus size={18} />
          <span>New Stock In Intake (Stock In Ssera)</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#243244] p-5 rounded-[20px] border border-white/10 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[#94A3B8] text-xs font-semibold block uppercase">Total Stock In Vouchers</span>
            <span className="text-2xl font-extrabold text-[#F8FAFC]">{stockInVouchers.length} Vouchers</span>
          </div>
          <FileText className="text-[#D4AF37]" size={28} />
        </div>

        <div className="bg-[#243244] p-5 rounded-[20px] border border-white/10 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[#94A3B8] text-xs font-semibold block uppercase">Active Suppliers</span>
            <span className="text-2xl font-extrabold text-[#22C55E]">{suppliers.length} Vendors</span>
          </div>
          <Building2 className="text-[#22C55E]" size={28} />
        </div>

        <div className="bg-[#243244] p-5 rounded-[20px] border border-white/10 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[#94A3B8] text-xs font-semibold block uppercase">Dynamic Price Sync</span>
            <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
              Latest Unit Cost Kept
            </span>
          </div>
          <Sparkles className="text-[#D4AF37]" size={28} />
        </div>
      </div>

      {/* Stock In History Table */}
      <div className="bg-[#243244] rounded-[22px] border border-white/10 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-serif font-bold text-lg text-[#F8FAFC]">Generated Stock In Receipt Vouchers</h2>
          <span className="text-xs text-[#94A3B8]">Professional Audit Log</span>
        </div>

        {stockInVouchers.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#94A3B8]">
            No Stock In vouchers recorded yet. Click "New Stock In Intake" above to record incoming raw materials.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1E293B] text-[#CBD5E1] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Voucher ID</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Store Location</th>
                  <th className="p-4">FS #</th>
                  <th className="p-4">Remark</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {stockInVouchers.map((v) => (
                  <tr key={v.voucherId} className="hover:bg-[#1E293B]/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#D4AF37]">{v.voucherId}</td>
                    <td className="p-4 text-[#CBD5E1]">{v.date} ({v.createdTime})</td>
                    <td className="p-4 font-semibold text-[#F8FAFC]">{v.supplierName}</td>
                    <td className="p-4 font-bold text-[#D4AF37] text-xs">
                      {v.receivingStore || 'Bole Main Central Store'}
                    </td>
                    <td className="p-4 font-mono text-gray-300">{v.fsNumber}</td>
                    <td className="p-4 text-[#94A3B8] max-w-xs truncate">{v.remark}</td>
                    <td className="p-4 font-extrabold text-[#22C55E] text-sm">{v.grandTotal.toFixed(2)} ETB</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedVoucherForReceipt(v)}
                          className="px-2.5 py-1.5 bg-[#1E293B] hover:bg-[#D4AF37] hover:text-[#0F172A] text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg font-bold text-xs transition-all inline-flex items-center gap-1"
                          title="View / Print Voucher"
                        >
                          <Printer size={13} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="px-2.5 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg font-bold text-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                          title="Edit Stock In Voucher (Stock In Voucher Edit Mareg)"
                        >
                          <Pencil size={13} />
                          <span>Edit</span>
                        </button>
                        {onDeleteStockInVoucher && (
                          <button
                            onClick={() => onDeleteStockInVoucher(v.voucherId)}
                            className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Voucher"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: New Stock In Form - Full Screen */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn text-[#F8FAFC]">
          {/* Header */}
          <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-[#D4AF37]">
                <PackageCheck size={24} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[#F8FAFC]">
                  Stock In Intake (Gbatochn Gebi Sareg Mmezegbbet)
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Enter Remark, FS #, Date, Supplier & multi-ingredient items. Updates latest ingredient price and generates printable voucher!
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-[#243244] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <X size={18} />
              <span>Close</span>
            </button>
          </div>

          <form onSubmit={handleSubmitStockIn} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto space-y-6">
              {/* Header Fields: Remark, FS #, Date, Supplier, Receiving Store */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                    FS Receipt # (FS Number) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fsNumber}
                    onChange={(e) => setFsNumber(e.target.value)}
                    className="w-full h-[44px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                    Stock In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={stockInDate}
                    onChange={(e) => setStockInDate(e.target.value)}
                    className="w-full h-[44px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                    Supplier (Akrabi) *
                  </label>
                  <select
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full h-[44px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.name}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1 flex items-center gap-1">
                    <Building2 size={13} className="text-[#D4AF37]" />
                    Receiving Store *
                  </label>
                  <select
                    value={receivingStore}
                    onChange={(e) => setReceivingStore(e.target.value)}
                    className="w-full h-[44px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer font-medium"
                  >
                    {stores.length > 0 ? (
                      stores.map((s) => (
                        <option key={s.id} value={s.name} className="bg-[#1E293B]">
                          {s.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Bole Main Central Store" className="bg-[#1E293B]">Bole Main Central Store</option>
                        <option value="Kazanchis Branch Store" className="bg-[#1E293B]">Kazanchis Branch Store</option>
                        <option value="Kitchen & Bakery Sub-Store" className="bg-[#1E293B]">Kitchen & Bakery Sub-Store</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                    Remark / Note
                  </label>
                  <input
                    type="text"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="e.g. Monthly coffee batch"
                    className="w-full h-[44px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* SEARCH & ADD INGREDIENTS TO STAGING */}
              <div className="bg-[#243244] p-4 rounded-xl border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
                      <Search size={16} className="text-[#D4AF37]" />
                      Search & Select Raw Ingredients (Ye Gbatochn Sm / Code Search)
                    </h3>
                    <p className="text-[11px] text-[#94A3B8]">
                      Search by ingredient name or SKU code to add multiple items to this stock intake batch.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-lg border border-[#D4AF37]/30">
                    {stagedItems.length} Ingredients Staged
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                    placeholder="Search raw ingredient name or SKU (e.g. Arabica, Milk, Flour)..."
                    className="w-full h-[44px] bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-10 pr-4 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                  <Search size={16} className="absolute left-3 top-3.5 text-[#94A3B8]" />
                </div>

                {/* Dropdown list of matched ingredients */}
                {ingredientSearch.trim() && (
                  <div className="bg-[#1E293B] border border-white/10 rounded-xl max-h-40 overflow-y-auto p-2 space-y-1">
                    {availableInventoryToAdd.length === 0 ? (
                      <div className="text-center py-2 text-[11px] text-[#94A3B8]">
                        No matching ingredients found.
                      </div>
                    ) : (
                      availableInventoryToAdd.map((inv) => (
                        <div
                          key={inv.id}
                          onClick={() => {
                            handleAddIngredientToStage(inv);
                            setIngredientSearch('');
                          }}
                          className="p-2 hover:bg-[#2F4158] rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#F8FAFC]">{inv.name}</span>
                            <span className="text-[10px] font-mono text-[#D4AF37] bg-[#243244] px-1.5 py-0.5 rounded">
                              {inv.sku}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#22C55E] font-bold">+ Stage for Stock In</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Staged Line Items Table */}
                {stagedItems.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-white/10 rounded-xl text-xs text-[#94A3B8]">
                    No ingredients added to batch yet. Search above to add incoming raw materials.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#1E293B] text-[#CBD5E1] text-[10px] uppercase font-bold tracking-wider">
                        <tr>
                          <th className="p-2.5">Ingredient & SKU</th>
                          <th className="p-2.5">Quantity / Bzat</th>
                          <th className="p-2.5">Unit Cost (ETB)</th>
                          <th className="p-2.5">Total Line Cost</th>
                          <th className="p-2.5">Expiry Date</th>
                          <th className="p-2.5 text-right">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {stagedItems.map((item) => (
                          <tr key={item.inventoryId} className="hover:bg-[#1E293B]/50">
                            <td className="p-2.5 font-bold text-[#F8FAFC]">
                              {item.ingredientName}
                              <span className="text-[10px] text-[#D4AF37] block font-mono">{item.sku}</span>
                            </td>

                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0.1"
                                  step="any"
                                  value={item.qty}
                                  onChange={(e) =>
                                    handleUpdateItemField(
                                      item.inventoryId,
                                      'qty',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-20 h-9 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-lg text-center text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                                />
                                <span className="text-[#94A3B8] text-xs">{item.unit}</span>
                              </div>
                            </td>

                            <td className="p-2.5">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.unitCost}
                                onChange={(e) =>
                                  handleUpdateItemField(
                                    item.inventoryId,
                                    'unitCost',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-24 h-9 bg-[#1E293B] text-[#D4AF37] border border-white/10 rounded-lg text-center text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                              />
                            </td>

                            <td className="p-2.5 font-extrabold text-[#22C55E]">
                              {item.totalCost.toFixed(2)} ETB
                            </td>

                            <td className="p-2.5">
                              <div className="space-y-1">
                                <label className="inline-flex items-center gap-1 cursor-pointer text-[10px] text-[#CBD5E1]">
                                  <input
                                    type="checkbox"
                                    checked={item.hasExpiry}
                                    onChange={(e) =>
                                      handleUpdateItemField(item.inventoryId, 'hasExpiry', e.target.checked)
                                    }
                                    className="w-3.5 h-3.5 accent-[#D4AF37]"
                                  />
                                  <span>Has Expiry</span>
                                </label>

                                {item.hasExpiry && (
                                  <input
                                    type="date"
                                    value={item.expiryDate || ''}
                                    onChange={(e) =>
                                      handleUpdateItemField(item.inventoryId, 'expiryDate', e.target.value)
                                    }
                                    className="block w-28 h-7 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded text-[10px] px-1 focus:outline-none"
                                  />
                                )}
                              </div>
                            </td>

                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveStagedItem(item.inventoryId)}
                                className="text-gray-400 hover:text-[#EF4444] p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Grand Total Footer Banner */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-xl">
                <div>
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">
                    Stock Intake Grand Total (Teklala Waga)
                  </span>
                  <span className="text-2xl font-black text-[#D4AF37]">
                    {grandTotal.toFixed(2)} ETB
                  </span>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 sm:flex-none px-6 h-12 rounded-xl bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={stagedItems.length === 0}
                    className="flex-1 sm:flex-none px-8 h-12 rounded-xl bg-[#D4AF37] hover:bg-[#F6C453] disabled:opacity-50 text-[#0F172A] text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 size={18} />
                    <span>Save & Generate Voucher (Mezgbe Schers)</span>
                  </button>
                </div>
              </div>
            </form>
        </div>
      )}

      {/* POPUP / MODAL: Printable Receipt Voucher */}
      {selectedVoucherForReceipt && (
        <ProfessionalReceiptModal
          receiptData={{
            title: 'Stock In Receiving Voucher (GRN)',
            voucherId: selectedVoucherForReceipt.voucherId,
            fsNumber: selectedVoucherForReceipt.fsNumber,
            storeName: selectedVoucherForReceipt.receivingStore || 'Bole Main Central Store',
            customerOrRecipient: `Supplier: ${selectedVoucherForReceipt.supplierName}`,
            date: selectedVoucherForReceipt.date,
            time: selectedVoucherForReceipt.createdTime,
            subtotal: selectedVoucherForReceipt.grandTotal,
            total: selectedVoucherForReceipt.grandTotal,
            items: selectedVoucherForReceipt.items.map((it) => ({
              name: it.ingredientName,
              qty: it.qty,
              unit: it.unit,
              unitPrice: it.unitCost,
              priceOrCost: it.totalCost,
              sku: it.sku,
              notes: it.hasExpiry && it.expiryDate ? `Exp: ${it.expiryDate}` : undefined,
            })),
            notesOrRemarks: selectedVoucherForReceipt.remark,
          }}
          onClose={() => setSelectedVoucherForReceipt(null)}
          onEdit={() => {
            const target = selectedVoucherForReceipt;
            setSelectedVoucherForReceipt(null);
            handleOpenEdit(target);
          }}
          editLabel="Edit Voucher"
        />
      )}

      {/* MODAL: Edit Stock In Voucher (Stock In Voucher Edit Mareg) - Full Screen */}
      {editingVoucher && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn text-[#F8FAFC]">
          {/* Header */}
          <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-[#D4AF37]">
                <Pencil size={24} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[#F8FAFC]">
                  Edit Stock In Voucher (Stock In Voucher Edit Mareg)
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Editing Voucher: <span className="text-[#D4AF37] font-mono font-bold">{editingVoucher.voucherId}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEditingVoucher(null)}
              className="px-4 py-2 bg-[#243244] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <X size={18} />
              <span>Close</span>
            </button>
          </div>

          <form onSubmit={handleSaveEditedVoucher} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto space-y-6">
              {/* Header Fields: FS #, Date, Supplier, Receiving Store, Remark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                    FS Receipt # (FS Number) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingVoucher.fsNumber}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, fsNumber: e.target.value })}
                    className="w-full h-[44px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                    Stock In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingVoucher.date}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, date: e.target.value })}
                    className="w-full h-[44px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                    Supplier (Akrabi) *
                  </label>
                  <select
                    value={editingVoucher.supplierName}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, supplierName: e.target.value })}
                    className="w-full h-[44px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.name}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1 flex items-center gap-1">
                    <Building2 size={13} className="text-[#D4AF37]" />
                    Receiving Store *
                  </label>
                  <select
                    value={editingVoucher.receivingStore || 'Bole Main Central Store'}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, receivingStore: e.target.value })}
                    className="w-full h-[44px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer font-medium"
                  >
                    {stores.length > 0 ? (
                      stores.map((s) => (
                        <option key={s.id} value={s.name} className="bg-[#1E293B]">
                          {s.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Bole Main Central Store" className="bg-[#1E293B]">Bole Main Central Store</option>
                        <option value="Kazanchis Branch Store" className="bg-[#1E293B]">Kazanchis Branch Store</option>
                        <option value="Kitchen & Bakery Sub-Store" className="bg-[#1E293B]">Kitchen & Bakery Sub-Store</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                    Remark / Note
                  </label>
                  <input
                    type="text"
                    value={editingVoucher.remark || ''}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, remark: e.target.value })}
                    placeholder="e.g. Adjusted batch count"
                    className="w-full h-[44px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* SEARCH & ADD INGREDIENTS TO EDITING VOUCHER */}
              <div className="bg-[#243244] p-4 rounded-xl border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
                      <Search size={16} className="text-[#D4AF37]" />
                      Add Extra Raw Ingredients to this Voucher
                    </h3>
                    <p className="text-[11px] text-[#94A3B8]">
                      Search by ingredient name or SKU to add more items to this voucher.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-lg border border-[#D4AF37]/30">
                    {editingVoucher.items.length} Items on Voucher
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={editIngredientSearch}
                    onChange={(e) => setEditIngredientSearch(e.target.value)}
                    placeholder="Search ingredient to add (e.g. Arabica, Milk, Sugar)..."
                    className="w-full h-[44px] bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-10 pr-4 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                  <Search size={16} className="absolute left-3 top-3.5 text-[#94A3B8]" />
                </div>

                {/* Dropdown list of matched ingredients */}
                {editIngredientSearch.trim() && (
                  <div className="bg-[#1E293B] border border-white/10 rounded-xl max-h-40 overflow-y-auto p-2 space-y-1">
                    {availableInventoryForEdit.length === 0 ? (
                      <div className="text-center py-2 text-[11px] text-[#94A3B8]">
                        No matching available ingredients found.
                      </div>
                    ) : (
                      availableInventoryForEdit.map((inv) => (
                        <div
                          key={inv.id}
                          onClick={() => handleEditAddIngredient(inv)}
                          className="p-2 hover:bg-[#2F4158] rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#F8FAFC]">{inv.name}</span>
                            <span className="text-[10px] font-mono text-[#D4AF37] bg-[#243244] px-1.5 py-0.5 rounded">
                              {inv.sku}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#22C55E] font-bold">+ Add to Voucher</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Editable Line Items Table */}
                {editingVoucher.items.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-white/10 rounded-xl text-xs text-red-400">
                    Voucher must contain at least 1 item. Please search and add ingredients above.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#1E293B] text-[#CBD5E1] text-[10px] uppercase font-bold tracking-wider">
                        <tr>
                          <th className="p-2.5">Ingredient & SKU</th>
                          <th className="p-2.5">Quantity / Bzat</th>
                          <th className="p-2.5">Unit Cost (ETB)</th>
                          <th className="p-2.5">Total Line Cost</th>
                          <th className="p-2.5">Expiry Date</th>
                          <th className="p-2.5 text-right">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {editingVoucher.items.map((item) => (
                          <tr key={item.inventoryId} className="hover:bg-[#1E293B]/50">
                            <td className="p-2.5 font-bold text-[#F8FAFC]">
                              {item.ingredientName}
                              <span className="text-[10px] text-[#D4AF37] block font-mono">{item.sku}</span>
                            </td>

                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  value={item.qty}
                                  onChange={(e) =>
                                    handleEditItemField(
                                      item.inventoryId,
                                      'qty',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-20 h-9 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-lg text-center text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                                />
                                <span className="text-[#94A3B8] text-xs">{item.unit}</span>
                              </div>
                            </td>

                            <td className="p-2.5">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.unitCost}
                                onChange={(e) =>
                                  handleEditItemField(
                                    item.inventoryId,
                                    'unitCost',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-24 h-9 bg-[#1E293B] text-[#D4AF37] border border-white/10 rounded-lg text-center text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                              />
                            </td>

                            <td className="p-2.5 font-extrabold text-[#22C55E]">
                              {item.totalCost.toFixed(2)} ETB
                            </td>

                            <td className="p-2.5">
                              <div className="space-y-1">
                                <label className="inline-flex items-center gap-1 cursor-pointer text-[10px] text-[#CBD5E1]">
                                  <input
                                    type="checkbox"
                                    checked={item.hasExpiry}
                                    onChange={(e) =>
                                      handleEditItemField(item.inventoryId, 'hasExpiry', e.target.checked)
                                    }
                                    className="w-3.5 h-3.5 accent-[#D4AF37]"
                                  />
                                  <span>Has Expiry</span>
                                </label>

                                {item.hasExpiry && (
                                  <input
                                    type="date"
                                    value={item.expiryDate || ''}
                                    onChange={(e) =>
                                      handleEditItemField(item.inventoryId, 'expiryDate', e.target.value)
                                    }
                                    className="block w-28 h-7 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded text-[10px] px-1 focus:outline-none"
                                  />
                                )}
                              </div>
                            </td>

                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleEditRemoveItem(item.inventoryId)}
                                className="text-gray-400 hover:text-[#EF4444] p-1 cursor-pointer"
                                title="Remove line item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Grand Total Footer Banner */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-xl">
                <div>
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">
                    Updated Grand Total (Yeteshashale Teklala Waga)
                  </span>
                  <span className="text-2xl font-black text-[#D4AF37]">
                    {editingVoucher.grandTotal.toFixed(2)} ETB
                  </span>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setEditingVoucher(null)}
                    className="flex-1 sm:flex-none px-6 h-12 rounded-xl bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editingVoucher.items.length === 0}
                    className="flex-1 sm:flex-none px-8 h-12 rounded-xl bg-[#D4AF37] hover:bg-[#F6C453] disabled:opacity-50 text-[#0F172A] text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 size={18} />
                    <span>Save Changes (Edit Arge Save Mareg)</span>
                  </button>
                </div>
              </div>
            </form>
        </div>
      )}
    </div>
  );
};
