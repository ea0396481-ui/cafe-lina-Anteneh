import React, { useState } from 'react';
import { Supplier, PurchaseOrder } from '../../types';
import { Plus, Building2, ShoppingCart, Star, Phone, Mail, MapPin, X } from 'lucide-react';

interface SupplierERPProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onAddSupplier?: (supplier: Supplier) => void;
  onCreatePO?: (po: PurchaseOrder) => void;
}

export const SupplierERP: React.FC<SupplierERPProps> = ({
  suppliers,
  purchaseOrders,
  onAddSupplier,
  onCreatePO,
}) => {
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);

  // Supplier Form
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supCategory, setSupCategory] = useState('Coffee Beans');
  const [supAddress, setSupAddress] = useState('Addis Ababa, Ethiopia');
  const [supRating, setSupRating] = useState(4.8);

  // PO Form
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poItemName, setPoItemName] = useState('');
  const [poQty, setPoQty] = useState(10);
  const [poUnitCost, setPoUnitCost] = useState(250);

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !onAddSupplier) return;
    const newSup: Supplier = {
      id: `SUP-${Date.now().toString().slice(-4)}`,
      name: supName,
      contactPerson: supContact || 'Account Rep',
      email: supEmail || 'vendor@cafelina.com',
      phone: supPhone || '+251 911 000000',
      category: supCategory,
      rating: supRating,
      address: supAddress,
      paymentTerms: 'Net 30 Days',
    };
    onAddSupplier(newSup);
    setShowSupplierModal(false);
    setSupName('');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
  };

  const handlePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreatePO) return;
    const selectedSup = suppliers.find((s) => s.id === poSupplierId) || suppliers[0];
    const total = poQty * poUnitCost;
    const newPO: PurchaseOrder = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      supplierId: selectedSup ? selectedSup.id : 'SUP-001',
      supplierName: selectedSup ? selectedSup.name : 'Direct Farm Partner',
      items: [
        {
          itemName: poItemName || 'Raw Material Delivery',
          qty: Number(poQty),
          unitCost: Number(poUnitCost),
          total: total,
        },
      ],
      totalCost: total,
      currency: 'ETB',
      status: 'Sent',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    };
    onCreatePO(newPO);
    setShowPOModal(false);
    setPoItemName('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
            Procurement & Supply Chain
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#EAEAEA]">Supplier & Purchase Order ERP</h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Manage coffee bean traders, dairy farms, packaging vendors & POs</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="bg-[#243244] hover:bg-[#2F4158] text-[#D4AF37] border border-[#D4AF37]/30 h-[46px] px-4 rounded-[14px] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Building2 size={16} /> Add Vendor
          </button>
          <button
            onClick={() => setShowPOModal(true)}
            className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0F1115] h-[46px] px-4 rounded-[14px] text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} /> Create PO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Suppliers List */}
        <div className="bg-[#243244] p-6 sm:p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div>
              <h2 className="font-bold text-lg text-[#F8FAFC]">Registered Vendors & Traders</h2>
              <p className="text-xs text-[#CBD5E1]">Verified direct farm and trade partners ({suppliers.length})</p>
            </div>
            <span className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold px-3 py-1 rounded-full">
              Active
            </span>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {suppliers.map((sup) => (
              <div key={sup.id} className="p-5 bg-[#1E293B] hover:bg-[#2F4158] rounded-[18px] border border-white/10 text-xs space-y-2 transition-colors">
                <div className="flex justify-between items-center font-bold text-sm text-[#F8FAFC]">
                  <span>{sup.name}</span>
                  <span className="text-[#D4AF37] font-semibold text-xs flex items-center gap-1">
                    <Star size={12} className="fill-[#D4AF37]" /> {sup.rating}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#CBD5E1]">
                  <span className="bg-[#1E293B] text-[#D4AF37] border border-[#D4AF37]/20 px-2 py-0.5 rounded text-[10px] font-bold">
                    {sup.category}
                  </span>
                  <span className="text-[#94A3B8]">{sup.paymentTerms}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[#94A3B8] pt-1">
                  <span className="flex items-center gap-1"><Phone size={12} /> {sup.phone}</span>
                  <span className="flex items-center gap-1"><Mail size={12} /> {sup.email}</span>
                  <span className="col-span-full flex items-center gap-1 text-[#CBD5E1]"><MapPin size={12} /> {sup.address}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase Orders */}
        <div className="bg-[#243244] p-6 sm:p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div>
              <h2 className="font-bold text-lg text-[#F8FAFC]">Active Purchase Orders</h2>
              <p className="text-xs text-[#CBD5E1]">Real-time procurement pipeline ({purchaseOrders.length})</p>
            </div>
            <ShoppingCart size={20} className="text-[#D4AF37]" />
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {purchaseOrders.map((po) => (
              <div key={po.id} className="p-5 bg-[#1E293B] hover:bg-[#2F4158] rounded-[18px] border border-white/10 text-xs space-y-2.5 transition-colors">
                <div className="flex justify-between items-center font-bold">
                  <span className="font-mono text-sm text-[#F8FAFC]">{po.id}</span>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                    po.status === 'Received'
                      ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30'
                      : po.status === 'Sent'
                      ? 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30'
                      : 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
                  }`}>
                    {po.status}
                  </span>
                </div>
                <p className="text-[#CBD5E1]">Vendor: <span className="font-semibold text-[#F8FAFC]">{po.supplierName}</span></p>
                {po.items && po.items.length > 0 && (
                  <div className="bg-[#0F172A] p-2.5 rounded-xl border border-white/5 space-y-1 text-[11px]">
                    {po.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[#CBD5E1]">
                        <span>{it.itemName} ({it.qty}x)</span>
                        <span className="font-mono">{it.total} ETB</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-white/5">
                  <span className="text-[10px] text-[#94A3B8]">Date: {po.orderDate}</span>
                  <span className="font-extrabold text-base text-[#D4AF37]">{po.totalCost} ETB</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#F8FAFC]">Register New Vendor</h3>
                <p className="text-xs text-[#CBD5E1]">Add a new supplier or origin farm partner</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSupplierModal(false)}
              className="p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#243244] transition-all cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleAddSupplierSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-lg">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Vendor / Company Name *</label>
                  <input
                    type="text"
                    required
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    placeholder="e.g. Yirgacheffe Farmers Union"
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Category</label>
                  <select
                    value={supCategory}
                    onChange={(e) => setSupCategory(e.target.value)}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Coffee Beans">Coffee Beans</option>
                    <option value="Dairy & Milk">Dairy & Milk</option>
                    <option value="Packaging & Cups">Packaging & Cups</option>
                    <option value="Bakery Supplies">Bakery Supplies</option>
                    <option value="Syrups & Tea">Syrups & Tea</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={supRating}
                    onChange={(e) => setSupRating(Number(e.target.value))}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Contact Person</label>
                  <input
                    type="text"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    placeholder="e.g. Ato Girma"
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Phone</label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="+251 911..."
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Address / Location</label>
                  <input
                    type="text"
                    value={supAddress}
                    onChange={(e) => setSupAddress(e.target.value)}
                    placeholder="City, Country"
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="w-full sm:w-auto px-6 h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 hover:bg-[#2F4158] rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 h-12 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                Save Vendor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
                <ShoppingCart size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#F8FAFC]">Create Purchase Order</h3>
                <p className="text-xs text-[#CBD5E1]">Issue procurement PO to vendor</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPOModal(false)}
              className="p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#243244] transition-all cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handlePOSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-lg">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Select Vendor *</label>
                  <select
                    value={poSupplierId}
                    onChange={(e) => setPoSupplierId(e.target.value)}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Item / Raw Material Name *</label>
                  <input
                    type="text"
                    required
                    value={poItemName}
                    onChange={(e) => setPoItemName(e.target.value)}
                    placeholder="e.g. Premium Grade-1 Yirgacheffe Beans (kg)"
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={poQty}
                    onChange={(e) => setPoQty(Number(e.target.value))}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Unit Cost (ETB)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={poUnitCost}
                    onChange={(e) => setPoUnitCost(Number(e.target.value))}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="md:col-span-2 bg-[#0F172A] p-5 rounded-2xl border border-white/10 flex justify-between items-center text-sm shadow-inner">
                  <span className="text-[#94A3B8] font-bold">Total Estimated PO:</span>
                  <span className="font-extrabold text-2xl text-[#D4AF37]">{(poQty * poUnitCost).toLocaleString()} ETB</span>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
              <button
                type="button"
                onClick={() => setShowPOModal(false)}
                className="w-full sm:w-auto px-6 h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 hover:bg-[#2F4158] rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 h-12 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                Issue Purchase Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};


