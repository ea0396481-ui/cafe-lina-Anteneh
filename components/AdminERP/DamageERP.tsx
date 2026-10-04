import React, { useState, useMemo } from 'react';
import { InventoryItem, MenuItem, DamageVoucher, DamageItem, StoreRecord } from '../../types';
import { ShieldAlert, Plus, Trash2, Eye, Edit, Printer, X, Search, AlertOctagon, Building2, Package, Sparkles, Check } from 'lucide-react';
import { ShareReceiptButton } from '../ShareReceiptButton';
import { ProfessionalReceiptModal } from '../ProfessionalReceiptModal';

interface DamageERPProps {
  inventory: InventoryItem[];
  menuItems: MenuItem[];
  stores?: StoreRecord[];
  damageVouchers: DamageVoucher[];
  onAddDamageVoucher: (voucher: DamageVoucher) => void;
  onUpdateDamageVoucher: (voucher: DamageVoucher) => void;
  onDeleteDamageVoucher: (voucherId: string) => void;
}

export const DamageERP: React.FC<DamageERPProps> = ({
  inventory,
  menuItems,
  stores = [],
  damageVouchers,
  onAddDamageVoucher,
  onUpdateDamageVoucher,
  onDeleteDamageVoucher,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<DamageVoucher | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<DamageVoucher | null>(null);

  // Form State for new Multi-Item Damage Voucher
  const [recordedBy, setRecordedBy] = useState('Chef Biruk Tadesse');
  const [storeName, setStoreName] = useState(
    stores.length > 0 ? stores[0].name : 'Bole Main Central Store'
  );
  const [remark, setRemark] = useState('');

  // Selected damage items
  const [stagedItems, setStagedItems] = useState<DamageItem[]>([]);

  // Staging form inputs
  const [itemType, setItemType] = useState<'Ingredient' | 'Finished Product'>('Ingredient');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [damageQty, setDamageQty] = useState<number>(1);
  const [damageReason, setDamageReason] = useState<string>('Exceeded shelf life / Expired');

  // Filter items based on itemType and itemSearchQuery
  const filteredIngredients = useMemo(() => {
    if (!itemSearchQuery.trim()) return inventory;
    const q = itemSearchQuery.toLowerCase().trim();
    return inventory.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.sku && i.sku.toLowerCase().includes(q)) ||
        (i.category && i.category.toLowerCase().includes(q))
    );
  }, [inventory, itemSearchQuery]);

  const filteredMenuItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return menuItems;
    const q = itemSearchQuery.toLowerCase().trim();
    return menuItems.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
  }, [menuItems, itemSearchQuery]);

  // Selected item object for visual preview
  const currentlySelectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    if (itemType === 'Ingredient') {
      return inventory.find((i) => i.id === selectedItemId) || null;
    } else {
      return menuItems.find((m) => m.id === selectedItemId) || null;
    }
  }, [selectedItemId, itemType, inventory, menuItems]);

  const handleStageItem = () => {
    if (!selectedItemId || damageQty <= 0) return;

    if (itemType === 'Ingredient') {
      const inv = inventory.find((i) => i.id === selectedItemId);
      if (!inv) return;

      const newItem: DamageItem = {
        itemType: 'Ingredient',
        itemId: inv.id,
        name: inv.name,
        image: inv.image,
        qty: damageQty,
        unit: inv.unit,
        costPerUnit: inv.costPerUnit,
        totalCost: damageQty * inv.costPerUnit,
        reason: damageReason,
      };

      setStagedItems((prev) => [...prev, newItem]);
    } else {
      const item = menuItems.find((m) => m.id === selectedItemId);
      if (!item) return;

      const newItem: DamageItem = {
        itemType: 'Finished Product',
        itemId: item.id,
        name: item.name,
        image: item.image,
        qty: damageQty,
        unit: 'portions',
        costPerUnit: item.price * 0.4, // estimated cost price
        totalCost: damageQty * item.price * 0.4,
        reason: damageReason,
      };

      setStagedItems((prev) => [...prev, newItem]);
    }

    // Reset staging input
    setSelectedItemId('');
    setDamageQty(1);
  };

  const handleRemoveStagedItem = (index: number) => {
    setStagedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (stagedItems.length === 0) return;

    const totalLoss = stagedItems.reduce((sum, item) => sum + item.totalCost, 0);

    const newVoucher: DamageVoucher = {
      voucherId: `DMG-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      createdTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recordedBy,
      storeName,
      items: stagedItems,
      totalLossAmount: totalLoss,
      remark,
    };

    onAddDamageVoucher(newVoucher);
    setIsModalOpen(false);
    setStagedItems([]);
    setRemark('');
  };

  const totalDamageValueAllTime = damageVouchers.reduce((sum, v) => sum + v.totalLossAmount, 0);

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30">
            Spoilage & Loss Registry
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1 flex items-center gap-2">
            <ShieldAlert className="text-red-400" size={28} />
            Raw Material & Product Damage Registry (Damage Voucher)
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Register single or batch damages for ingredients and finished menu products with auto cost deduction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#243244] p-3 px-5 rounded-2xl border border-white/10 shadow-md">
            <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">Total Damage Loss Value</span>
            <span className="text-xl font-extrabold text-red-400">
              {totalDamageValueAllTime.toLocaleString()} ETB
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg min-h-[44px]"
          >
            <Plus size={18} />
            <span>Register Batch Damage</span>
          </button>
        </div>
      </div>

      {/* Damage Vouchers Log Table */}
      <div className="bg-[#243244] p-6 rounded-[24px] border border-white/10 space-y-4 shadow-xl">
        <h2 className="text-lg font-serif font-bold text-[#F8FAFC]">Damage Vouchers & Receipts Log</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#CBD5E1]">
            <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-[10px] font-extrabold tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Voucher ID</th>
                <th className="py-3.5 px-4">Recorded By</th>
                <th className="py-3.5 px-4">Store Location</th>
                <th className="py-3.5 px-4">Damaged Items</th>
                <th className="py-3.5 px-4 font-right">Total Loss (ETB)</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {damageVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#94A3B8]">
                    No damage vouchers recorded yet.
                  </td>
                </tr>
              ) : (
                damageVouchers.map((v) => (
                  <tr key={v.voucherId} className="hover:bg-[#1E293B]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-red-400">{v.voucherId}</td>
                    <td className="py-3.5 px-4 font-bold text-[#F8FAFC]">{v.recordedBy}</td>
                    <td className="py-3.5 px-4">{v.storeName}</td>
                    <td className="py-3.5 px-4 font-bold text-[#D4AF37]">{v.items.length} Items</td>
                    <td className="py-3.5 px-4 font-extrabold text-red-400">{v.totalLossAmount.toLocaleString()} ETB</td>
                    <td className="py-3.5 px-4">
                      <span>{v.date}</span> <span className="text-[10px] text-[#94A3B8]">{v.createdTime}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedVoucherForView(v)}
                          className="p-2 bg-[#1E293B] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0F172A] rounded-lg transition-all"
                          title="View Receipt"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setEditingVoucher(v)}
                          className="p-2 bg-[#1E293B] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white rounded-lg transition-all"
                          title="Edit Voucher"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteDamageVoucher(v.voucherId)}
                          className="p-2 bg-[#1E293B] text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                          title="Delete Voucher"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create Batch Damage Voucher - Fullscreen */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn font-sans text-[#F8FAFC]">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
                <AlertOctagon size={24} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg sm:text-2xl text-[#F8FAFC]">Register Batch Damage Voucher (የተበላሸ እቃ መመዝገቢያ)</h3>
                <p className="text-xs text-[#94A3B8]">Deduct spoiled raw ingredients or damaged finished goods and track loss valuation.</p>
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

          <form onSubmit={handleSubmitVoucher} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Recorded By *</label>
                  <input
                    type="text"
                    required
                    value={recordedBy}
                    onChange={(e) => setRecordedBy(e.target.value)}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1 flex items-center gap-1">
                    <Building2 size={13} className="text-[#D4AF37]" />
                    Damaged Store Location (Damage Yehonebet Store) *
                  </label>
                  <select
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {stores.length > 0 ? (
                      stores.map((s) => (
                        <option key={s.id} value={s.name} className="bg-[#1E293B] text-[#F8FAFC]">
                          {s.name} ({s.location})
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
              </div>

              {/* Stage Items to Damage */}
              <div className="p-5 bg-[#1E293B] rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-sm font-extrabold text-[#D4AF37] uppercase flex items-center gap-2">
                    <Package size={18} />
                    Add Items to Damage List (Multi-Item Selection)
                  </span>
                  <span className="text-xs text-[#94A3B8] font-bold">
                    {itemType === 'Ingredient' ? `${filteredIngredients.length} Ingredients` : `${filteredMenuItems.length} Products`} Available
                  </span>
                </div>

                {/* Category Toggle Tabs */}
                <div className="grid grid-cols-2 gap-3 bg-[#0F172A] p-1.5 rounded-xl border border-white/5 max-w-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setItemType('Ingredient');
                      setSelectedItemId('');
                      setItemSearchQuery('');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      itemType === 'Ingredient'
                        ? 'bg-[#D4AF37] text-[#0F172A] shadow-md'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    <Package size={15} />
                    <span>Raw Ingredients (ግብዓቶች)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setItemType('Finished Product');
                      setSelectedItemId('');
                      setItemSearchQuery('');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      itemType === 'Finished Product'
                        ? 'bg-[#D4AF37] text-[#0F172A] shadow-md'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    <Sparkles size={15} />
                    <span>Finished Menu Products (ምርቶች)</span>
                  </button>
                </div>

                {/* Item Search Bar & Filter */}
                <div className="space-y-2">
                  <label className="block text-xs text-[#CBD5E1] font-bold uppercase tracking-wider">
                    Search & Select Item to Damage (እቃውን በስም ወይም በኮድ ይፈልጉ) *
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      placeholder={`Search ${itemType === 'Ingredient' ? 'ingredient name, SKU, category (e.g. Arabica, Milk, Flour)...' : 'product name, category (e.g. Cappuccino, Croissant, Burger)...'}`}
                      className="w-full h-[46px] bg-[#0F172A] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-10 pr-9 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                    {itemSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setItemSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC]"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Instant matching suggestions list when searching */}
                  {itemSearchQuery.trim() && (
                    <div className="bg-[#0F172A] border border-white/10 rounded-xl max-h-48 overflow-y-auto p-2 space-y-1 shadow-xl">
                      {itemType === 'Ingredient' ? (
                        filteredIngredients.length === 0 ? (
                          <p className="text-center py-3 text-xs text-[#94A3B8]">No ingredients matching "{itemSearchQuery}"</p>
                        ) : (
                          filteredIngredients.map((i) => (
                            <div
                              key={i.id}
                              onClick={() => {
                                setSelectedItemId(i.id);
                                setItemSearchQuery('');
                              }}
                              className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors ${
                                selectedItemId === i.id ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/40' : 'hover:bg-[#243244]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <img src={i.image} alt={i.name} className="w-8 h-8 rounded-lg object-cover" />
                                <div>
                                  <span className="font-bold text-[#F8FAFC] block">{i.name}</span>
                                  <span className="text-[10px] text-[#94A3B8]">
                                    {i.sku ? `${i.sku} • ` : ''}{i.category} • Stock: <strong className="text-emerald-400">{i.stockQty} {i.unit}</strong>
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-rose-400">
                                {i.costPerUnit} ETB/{i.unit}
                              </span>
                            </div>
                          ))
                        )
                      ) : (
                        filteredMenuItems.length === 0 ? (
                          <p className="text-center py-3 text-xs text-[#94A3B8]">No menu products matching "{itemSearchQuery}"</p>
                        ) : (
                          filteredMenuItems.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => {
                                setSelectedItemId(m.id);
                                setItemSearchQuery('');
                              }}
                              className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors ${
                                selectedItemId === m.id ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/40' : 'hover:bg-[#243244]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <img src={m.image} alt={m.name} className="w-8 h-8 rounded-lg object-cover" />
                                <div>
                                  <span className="font-bold text-[#F8FAFC] block">{m.name}</span>
                                  <span className="text-[10px] text-[#94A3B8]">{m.category}</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-rose-400">
                                {(m.price * 0.4).toFixed(0)} ETB (Cost)
                              </span>
                            </div>
                          ))
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Dropdown Select + Damage Qty */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-[#94A3B8] font-bold mb-1">
                      Or Choose from List {itemSearchQuery && `(${itemType === 'Ingredient' ? filteredIngredients.length : filteredMenuItems.length} filtered)`}
                    </label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full h-[46px] bg-[#0F172A] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer font-medium"
                    >
                      <option value="">-- Select {itemType === 'Ingredient' ? 'Raw Ingredient' : 'Finished Menu Product'} --</option>
                      {itemType === 'Ingredient'
                        ? filteredIngredients.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name} {i.sku ? `[${i.sku}]` : ''} ({i.stockQty} {i.unit} in stock @ {i.costPerUnit} ETB)
                            </option>
                          ))
                        : filteredMenuItems.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.category} • Cost: {(m.price * 0.4).toFixed(0)} ETB)
                            </option>
                          ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#94A3B8] font-bold mb-1">Damage Quantity</label>
                    <input
                      type="number"
                      min={0.1}
                      step="any"
                      value={damageQty}
                      onChange={(e) => setDamageQty(Math.max(0.01, Number(e.target.value)))}
                      className="w-full h-[46px] bg-[#0F172A] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Selected Item Preview Pill */}
                {currentlySelectedItem && (
                  <div className="p-4 bg-[#0F172A] rounded-xl border border-[#D4AF37]/30 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={currentlySelectedItem.image}
                        alt={currentlySelectedItem.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-sm"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#F8FAFC]">{currentlySelectedItem.name}</span>
                          {'sku' in currentlySelectedItem && currentlySelectedItem.sku && (
                            <span className="text-[10px] font-mono text-[#D4AF37] bg-[#1E293B] px-2 py-0.5 rounded">
                              {currentlySelectedItem.sku}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#94A3B8] block mt-0.5">
                          {'stockQty' in currentlySelectedItem ? (
                            <>Available Stock: <strong className="text-emerald-400">{currentlySelectedItem.stockQty} {currentlySelectedItem.unit}</strong> • Unit Cost: <strong className="text-rose-400">{currentlySelectedItem.costPerUnit} ETB</strong></>
                          ) : (
                            <>Category: <strong className="text-[#F8FAFC]">{currentlySelectedItem.category}</strong> • Est Cost: <strong className="text-rose-400">{(currentlySelectedItem.price * 0.4).toFixed(0)} ETB</strong></>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-[#94A3B8] block">Calculated Loss</span>
                      <span className="text-base font-extrabold text-rose-400">
                        {'costPerUnit' in currentlySelectedItem
                          ? `${(damageQty * currentlySelectedItem.costPerUnit).toLocaleString()} ETB`
                          : `${(damageQty * currentlySelectedItem.price * 0.4).toLocaleString()} ETB`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Reason for Damage & Quick Selection Chips */}
                <div className="space-y-2">
                  <label className="block text-xs text-[#94A3B8] font-bold">Reason for Damage (የተበላሸበት ምክንያት)</label>
                  <div className="flex flex-wrap gap-2 pb-1">
                    {[
                      'Exceeded shelf life / Expired',
                      'Accidental spill / Kitchen Dropped',
                      'Packaging damaged / Broken seal',
                      'Spoiled / Quality defect',
                      'Burnt / Cooking preparation flaw',
                    ].map((presetReason) => (
                      <button
                        key={presetReason}
                        type="button"
                        onClick={() => setDamageReason(presetReason)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          damageReason === presetReason
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                            : 'bg-[#0F172A] text-[#94A3B8] border-white/5 hover:text-[#CBD5E1]'
                        }`}
                      >
                        {presetReason}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={damageReason}
                      onChange={(e) => setDamageReason(e.target.value)}
                      placeholder="e.g. Expired shelf-life / Accidental spill / Preparation flaw"
                      className="flex-1 h-[46px] bg-[#0F172A] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="button"
                      onClick={handleStageItem}
                      disabled={!selectedItemId}
                      className="px-6 h-[46px] bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={16} />
                      <span>Add to List</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Staged Items List */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#CBD5E1]">
                  Staged Damaged Items ({stagedItems.length})
                </label>

                <div className="max-h-60 overflow-y-auto space-y-2 border border-white/10 rounded-2xl p-3 bg-[#1E293B]">
                  {stagedItems.length === 0 ? (
                    <p className="text-center text-xs text-[#94A3B8] py-8">No items added to damage batch yet. Select an item above and click "Add to List".</p>
                  ) : (
                    stagedItems.map((stg, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#0F172A] rounded-xl flex items-center justify-between gap-3 text-xs border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <img src={stg.image} alt={stg.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <span className="font-bold text-[#F8FAFC] block">{stg.name}</span>
                            <span className="text-[11px] text-[#94A3B8]">
                              Reason: {stg.reason} ({stg.itemType})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-bold text-sm text-rose-400 font-mono">
                            {stg.qty} {stg.unit} ({stg.totalCost.toLocaleString()} ETB)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStagedItem(idx)}
                            className="p-2 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-[#1E293B] cursor-pointer transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-6 h-12 rounded-xl bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={stagedItems.length === 0}
                className="w-full sm:w-auto px-8 h-12 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <AlertOctagon size={18} />
                <span>Save & Issue Damage Voucher (የተበላሸ እቃ መዝግብ)</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: View Damage Voucher Ticket */}
      {selectedVoucherForView && (
        <ProfessionalReceiptModal
          receiptData={{
            title: 'Damage Loss Voucher (DLV)',
            voucherId: selectedVoucherForView.voucherId,
            storeName: selectedVoucherForView.storeName,
            customerOrRecipient: `Recorded By: ${selectedVoucherForView.recordedBy}`,
            date: selectedVoucherForView.date,
            time: selectedVoucherForView.createdTime,
            subtotal: selectedVoucherForView.totalLossAmount,
            total: selectedVoucherForView.totalLossAmount,
            items: selectedVoucherForView.items.map((it) => ({
              name: it.name,
              qty: it.qty,
              unit: it.unit,
              unitPrice: it.unitCost,
              priceOrCost: it.totalCost,
              notes: it.reason ? `Reason: ${it.reason}` : undefined,
              sku: it.sku,
            })),
            extraDetails: `Total Loss Value: ${selectedVoucherForView.totalLossAmount.toLocaleString()} ETB | Store: ${selectedVoucherForView.storeName}`,
            notesOrRemarks: selectedVoucherForView.remark,
          }}
          onClose={() => setSelectedVoucherForView(null)}
        />
      )}

      {/* MODAL 3: Edit Damage Voucher - Fullscreen */}
      {editingVoucher && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn font-sans text-[#F8FAFC]">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
                <Edit size={24} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg sm:text-2xl text-[#F8FAFC]">Edit Damage Voucher {editingVoucher.voucherId}</h3>
                <p className="text-xs text-[#94A3B8]">Modify voucher recorder, location, and remark notes.</p>
              </div>
            </div>
            <button
              onClick={() => setEditingVoucher(null)}
              className="px-4 py-2 bg-[#243244] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <X size={18} />
              <span>Close</span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdateDamageVoucher(editingVoucher);
              setEditingVoucher(null);
            }}
            className="flex-1 flex flex-col justify-between overflow-y-auto"
          >
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Recorded By</label>
                <input
                  type="text"
                  value={editingVoucher.recordedBy}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, recordedBy: e.target.value })}
                  className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Store Location (Damage Yehonebet Store)</label>
                <select
                  value={editingVoucher.storeName}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, storeName: e.target.value })}
                  className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs focus:outline-none focus:border-[#D4AF37] font-medium cursor-pointer"
                >
                  {stores.length > 0 ? (
                    stores.map((s) => (
                      <option key={s.id} value={s.name} className="bg-[#1E293B] text-[#F8FAFC]">
                        {s.name} ({s.location})
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
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Remark</label>
                <input
                  type="text"
                  value={editingVoucher.remark || ''}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, remark: e.target.value })}
                  className="w-full h-[46px] bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
              <button
                type="button"
                onClick={() => setEditingVoucher(null)}
                className="w-full sm:w-auto px-6 h-12 rounded-xl bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 h-12 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Check size={18} />
                <span>Save Changes (አዘምን)</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
