import React, { useState, useMemo } from 'react';
import { InventoryItem, StoreRecord } from '../../types';
import { PackageCheck, AlertTriangle, Trash2, Calendar, ShieldAlert, DollarSign, Search, Store, Building2, Layers, Filter } from 'lucide-react';

interface StoreBalanceExpiryERPProps {
  inventory: InventoryItem[];
  stores?: StoreRecord[];
  onDeleteExpiredItem: (id: string) => void;
  onClearExpiredStock: (id: string) => void;
}

export const StoreBalanceExpiryERP: React.FC<StoreBalanceExpiryERPProps> = ({
  inventory,
  stores = [],
  onDeleteExpiredItem,
  onClearExpiredStock,
}) => {
  const [filter, setFilter] = useState<'All' | 'Expired' | 'ExpiringSoon'>('All');
  const [selectedStore, setSelectedStore] = useState<string>('All');
  const [search, setSearch] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const checkStatus = (item: InventoryItem) => {
    if (!item.expiryDate) return 'Fresh';
    if (item.expiryDate < today) return 'Expired';

    const expTime = new Date(item.expiryDate).getTime();
    const nowTime = new Date().getTime();
    const diffDays = Math.ceil((expTime - nowTime) / (1000 * 3600 * 24));

    if (diffDays <= 30) return 'ExpiringSoon';
    return 'Fresh';
  };

  // Available store list options
  const availableStores = useMemo(() => {
    const storeNames = new Set([
      'All',
      ...stores.map((s) => s.name),
      ...inventory.map((i) => i.storeName).filter((s): s is string => Boolean(s)),
      'Bole Main Central Store',
      'Kazanchis Bakery Lab & Cold Room',
    ]);
    return Array.from(storeNames);
  }, [stores, inventory]);

  const filteredInventory = inventory.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    // Filter by store
    if (selectedStore !== 'All') {
      const itemStore = item.storeName || 'Bole Main Central Store';
      if (itemStore !== selectedStore) return false;
    }

    const status = checkStatus(item);

    if (filter === 'Expired') return status === 'Expired';
    if (filter === 'ExpiringSoon') return status === 'ExpiringSoon';
    return true;
  });

  const totalValue = filteredInventory.reduce((sum, i) => sum + i.stockQty * i.costPerUnit, 0);
  const expiredCount = filteredInventory.filter((i) => checkStatus(i) === 'Expired').length;
  const expiringSoonCount = filteredInventory.filter((i) => checkStatus(i) === 'ExpiringSoon').length;

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
            Stock Valuation & Expiry Audit
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1 flex items-center gap-2">
            <PackageCheck className="text-[#D4AF37]" size={28} />
            Store Balance & Expiry Control (Store Balance)
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Track total raw material balances, store locations, unit valuation, and dispose of expired ingredient batches safely.
          </p>
        </div>

        <div className="bg-[#243244] p-3 px-5 rounded-2xl border border-white/10 shadow-md flex items-center gap-4">
          <div>
            <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">
              {selectedStore === 'All' ? 'Total Stock Balance Valuation' : `${selectedStore} Valuation`}
            </span>
            <span className="text-xl font-extrabold text-[#D4AF37]">{totalValue.toLocaleString()} ETB</span>
          </div>
        </div>
      </div>

      {/* Store Location Filter Bar */}
      <div className="bg-[#243244] p-4 rounded-[22px] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 text-xs text-[#CBD5E1] w-full md:w-auto">
          <Store size={18} className="text-[#D4AF37] shrink-0" />
          <span className="font-bold whitespace-nowrap">Filter Warehouse:</span>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="bg-[#1E293B] text-white border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#D4AF37] w-full md:w-64"
          >
            {availableStores.map((st) => (
              <option key={st} value={st}>
                {st === 'All' ? '🏢 All Store Locations' : `📍 ${st}`}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-[#94A3B8] flex items-center gap-2">
          <span>Displaying:</span>
          <span className="font-bold text-[#D4AF37] bg-[#1E293B] px-2.5 py-1 rounded-lg border border-white/5">
            {filteredInventory.length} Ingredients
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('All')}
          className={`p-5 rounded-[22px] border text-left transition-all cursor-pointer ${
            filter === 'All'
              ? 'bg-[#243244] border-[#D4AF37] shadow-lg ring-1 ring-[#D4AF37]'
              : 'bg-[#243244]/80 border-white/10 hover:border-white/20'
          }`}
        >
          <span className="text-xs text-[#94A3B8] uppercase font-bold block">Total Raw Materials</span>
          <span className="text-2xl font-extrabold text-[#F8FAFC] mt-1 block">{filteredInventory.length} SKUs</span>
          <span className="text-[10px] text-[#D4AF37] mt-1 block">Active Store Stock</span>
        </button>

        <button
          onClick={() => setFilter('Expired')}
          className={`p-5 rounded-[22px] border text-left transition-all cursor-pointer ${
            filter === 'Expired'
              ? 'bg-[#243244] border-red-500 shadow-lg ring-1 ring-red-500'
              : 'bg-[#243244]/80 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-red-400 uppercase font-bold block">Expired Stock Batches</span>
            <AlertTriangle className="text-red-400" size={20} />
          </div>
          <span className="text-2xl font-extrabold text-red-400 mt-1 block">{expiredCount} Batches</span>
          <span className="text-[10px] text-red-300 mt-1 block">Requires Immediate Disposal</span>
        </button>

        <button
          onClick={() => setFilter('ExpiringSoon')}
          className={`p-5 rounded-[22px] border text-left transition-all cursor-pointer ${
            filter === 'ExpiringSoon'
              ? 'bg-[#243244] border-yellow-500 shadow-lg ring-1 ring-yellow-500'
              : 'bg-[#243244]/80 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-yellow-400 uppercase font-bold block">Expiring Within 30 Days</span>
            <ShieldAlert className="text-yellow-400" size={20} />
          </div>
          <span className="text-2xl font-extrabold text-yellow-400 mt-1 block">{expiringSoonCount} Batches</span>
          <span className="text-[10px] text-yellow-200 mt-1 block">Prioritize First-In First-Out</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-[#243244] p-4 rounded-[20px] border border-white/10">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ingredient name, SKU, or category..."
            className="w-full h-11 bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-11 pr-4 text-xs focus:outline-none focus:border-[#D4AF37]"
          />
          <Search size={18} className="absolute left-3.5 top-3.5 text-[#94A3B8]" />
        </div>
      </div>

      {/* Stock Balance Table */}
      <div className="bg-[#243244] p-6 rounded-[24px] border border-white/10 space-y-4 shadow-xl">
        <h2 className="text-lg font-serif font-bold text-[#F8FAFC]">Store Raw Ingredient Balances & Expiry Dates</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#CBD5E1]">
            <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-[10px] font-extrabold tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Ingredient Name & SKU</th>
                <th className="py-3.5 px-4">Store Location</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Current Stock Balance</th>
                <th className="py-3.5 px-4">Unit Cost</th>
                <th className="py-3.5 px-4">Total Stock Value</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4 text-center">Expiry Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[#94A3B8]">
                    No inventory items found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const status = checkStatus(item);
                  const isExpired = status === 'Expired';
                  const isExpiringSoon = status === 'ExpiringSoon';

                  return (
                    <tr key={item.id} className="hover:bg-[#1E293B]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#F8FAFC] block">{item.name}</span>
                        <span className="text-[10px] font-mono text-[#D4AF37]">SKU: {item.sku}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-bold text-slate-300 bg-[#1E293B] px-2 py-1 rounded-lg border border-white/5 inline-block">
                          {item.storeName || 'Bole Main Central Store'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{item.category}</td>
                      <td className="py-3.5 px-4 font-bold text-[#F8FAFC]">
                        {item.stockQty} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 font-mono">{item.costPerUnit} ETB</td>
                      <td className="py-3.5 px-4 font-extrabold text-[#D4AF37]">
                        {(item.stockQty * item.costPerUnit).toLocaleString()} ETB
                      </td>
                      <td className="py-3.5 px-4">
                        {item.expiryDate ? (
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                              isExpired
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isExpiringSoon
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                : 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30'
                            }`}
                          >
                            <Calendar size={12} />
                            {item.expiryDate} {isExpired ? '(EXPIRED)' : isExpiringSoon ? '(SOON)' : ''}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8] text-[10px]">No Expiry Date</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isExpired ? (
                          <button
                            onClick={() => onClearExpiredStock(item.id)}
                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1 mx-auto cursor-pointer"
                            title="Dispose Expired Stock Batch"
                          >
                            <Trash2 size={13} /> Clear Expired Stock
                          </button>
                        ) : (
                          <button
                            onClick={() => onDeleteExpiredItem(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
