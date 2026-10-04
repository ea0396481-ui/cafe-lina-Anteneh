import React, { useState } from 'react';
import { CategoryRecord } from '../../types';
import { Layers, Plus, Trash2, Search, BookOpen, PackageCheck, X, Check } from 'lucide-react';

interface CategoriesERPProps {
  categories: CategoryRecord[];
  onAddCategory: (cat: CategoryRecord) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoriesERP: React.FC<CategoriesERPProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Ingredient' | 'Product'>('All');
  const [search, setSearch] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'Ingredient' | 'Product'>('Ingredient');
  const [description, setDescription] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCat: CategoryRecord = {
      id: `CAT-${Date.now()}`,
      name,
      type,
      description: description || `${type} category for operational cataloging`,
      itemCount: 0,
    };

    onAddCategory(newCat);
    setIsModalOpen(false);
    setName('');
    setDescription('');
  };

  const filteredCategories = categories.filter((c) => {
    const matchesTab = activeTab === 'All' || c.type === activeTab;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
            Catalog Structure & Organization
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1 flex items-center gap-2">
            <Layers className="text-[#D4AF37]" size={28} />
            Categories Management (Category Mmezegbbet)
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Register and organize raw ingredient categories and final menu product categories with descriptions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg min-h-[44px]"
        >
          <Plus size={18} />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#243244] p-4 rounded-[20px] border border-white/10">
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          {(['All', 'Ingredient', 'Product'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#D4AF37] text-[#0F172A] shadow-md'
                  : 'bg-[#1E293B] text-[#CBD5E1] hover:bg-white/10'
              }`}
            >
              {tab === 'All' ? 'All Categories' : `${tab} Categories`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category name..."
            className="w-full h-[40px] bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-9 pr-3 text-xs focus:outline-none focus:border-[#D4AF37]"
          />
          <Search size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="bg-[#243244] p-5 rounded-[22px] border border-white/10 shadow-md space-y-3 relative hover:border-[#D4AF37]/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  cat.type === 'Ingredient'
                    ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30'
                    : 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
                }`}
              >
                {cat.type} Category
              </span>

              <button
                onClick={() => onDeleteCategory(cat.id)}
                className="text-gray-400 hover:text-[#EF4444] p-1 transition-colors"
                title="Delete category"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <h3 className="font-serif font-bold text-lg text-[#F8FAFC]">{cat.name}</h3>
            <p className="text-xs text-[#94A3B8]">{cat.description}</p>
          </div>
        ))}
      </div>

      {/* Modal: Add Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <form
            onSubmit={handleAdd}
            className="bg-[#1E293B] border border-white/10 rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-2xl text-[#F8FAFC]"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-lg">Add New Category</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Category Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Coffee Beans, Dairy, Cakes, Juices"
                className="w-full h-11 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Category Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full h-11 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3.5 text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="Ingredient">Raw Ingredient Category (Gbat)</option>
                <option value="Product">Product Menu Category</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Description (Description)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what items belong in this category..."
                className="w-full bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-11 bg-[#243244] text-[#CBD5E1] rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-11 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold shadow-md"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
