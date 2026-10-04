import React, { useState, useEffect } from 'react';
import { MenuItem, CategoryRecord } from '../../types';
import {
  X,
  Check,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Star,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const PRESET_PRODUCT_IMAGES = [
  { label: 'Espresso', url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cappuccino', url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80' },
  { label: 'Latte Art', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80' },
  { label: 'Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cheesecake', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80' },
  { label: 'Lava Cake', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Prime Steak', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },
  { label: 'Artisan Pizza', url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80' },
  { label: 'Wagyu Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Fresh Pasta', url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80' },
  { label: 'Caesar Salad', url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=600&q=80' },
  { label: 'Berry Mojito', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Fresh Juice', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80' },
];

/* =========================================================================
   1. PRODUCT ADD / EDIT MODAL
   ========================================================================= */
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: MenuItem | null; // If null, mode is Add; if provided, mode is Edit
  availableCategories: string[];
  onSave: (productData: Partial<MenuItem>) => void | Promise<void>;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
  availableCategories,
  onSave,
}) => {
  const isEditing = Boolean(product);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Coffee');
  const [customCategory, setCustomCategory] = useState('');
  const [price, setPrice] = useState<number>(150);
  const [currency, setCurrency] = useState('ETB');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [ingredientsStr, setIngredientsStr] = useState('');
  const [calories, setCalories] = useState<number>(180);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(5);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [isSpecial, setIsSpecial] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category || 'Coffee');
      setPrice(product.price || 120);
      setCurrency(product.currency || 'ETB');
      setDescription(product.description || '');
      setImage(product.image || PRESET_PRODUCT_IMAGES[0].url);
      setIngredientsStr(product.ingredients ? product.ingredients.join(', ') : '');
      setCalories(product.calories || 150);
      setPrepTimeMinutes(product.prepTimeMinutes || 5);
      setIsAvailable(product.isAvailable !== false);
      setIsSpecial(Boolean(product.isSpecial || product.isFeatured));
    } else {
      setName('');
      setCategory(availableCategories[0] || 'Coffee');
      setCustomCategory('');
      setPrice(150);
      setCurrency('ETB');
      setDescription('');
      setImage(PRESET_PRODUCT_IMAGES[0].url);
      setIngredientsStr('');
      setCalories(180);
      setPrepTimeMinutes(5);
      setIsAvailable(true);
      setIsSpecial(false);
    }
  }, [product, isOpen, availableCategories]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category === '__custom__' ? customCategory.trim() || 'Specialty' : category;
    const ingredients = ingredientsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Partial<MenuItem> = {
      ...(product || {}),
      name: name.trim(),
      category: finalCategory,
      price: Number(price),
      currency: currency || 'ETB',
      description: description.trim(),
      image: image || PRESET_PRODUCT_IMAGES[0].url,
      ingredients: ingredients.length > 0 ? ingredients : ['Artisan Ingredients'],
      calories: Number(calories) || 150,
      prepTimeMinutes: Number(prepTimeMinutes) || 5,
      isAvailable,
      isSpecial,
      isFeatured: isSpecial,
    };

    setIsSaving(true);
    try {
      await onSave(payload);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#181818] border border-[#D4AF37]/40 text-[#FDF5E6] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fadeIn my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1f1f1f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6B1D1D] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center">
              {isEditing ? <Edit2 size={16} /> : <Plus size={18} />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#FDF5E6]">
                {isEditing ? `Edit Product: ${product?.name}` : 'Add New Restaurant Product'}
              </h3>
              <p className="text-xs text-[#A8A095]">
                {isEditing ? 'Modify price, category, photo and stock availability' : 'Register a new dish, drink or coffee to menu'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Row 1: Name & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Truffle Wagyu Burger, Cortado..."
                className="w-full bg-[#222222] border border-white/10 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">
                Price ({currency}) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-[#222222] border border-white/10 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-sm text-white font-bold outline-none"
              />
            </div>
          </div>

          {/* Row 2: Category & Preparation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#222222] border border-white/10 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__custom__">+ Custom Category...</option>
              </select>
            </div>

            {category === '__custom__' && (
              <div>
                <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">
                  New Category Name
                </label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Seafood, Mocktails..."
                  className="w-full bg-[#222222] border border-white/10 focus:border-[#D4AF37] rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">
                Prep Time (Minutes)
              </label>
              <input
                type="number"
                min={1}
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                className="w-full bg-[#222222] border border-white/10 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">
                Calories (kcal)
              </label>
              <input
                type="number"
                min={0}
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full bg-[#222222] border border-white/10 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Row 3: Description */}
          <div>
            <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">
              Description & Flavor Profile
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Appetizing description of ingredients, culinary method, texture, and taste..."
              className="w-full bg-[#222222] border border-white/10 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none leading-relaxed"
            />
          </div>

          {/* Row 4: Ingredients List */}
          <div>
            <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">
              Key Ingredients (comma separated)
            </label>
            <input
              type="text"
              value={ingredientsStr}
              onChange={(e) => setIngredientsStr(e.target.value)}
              placeholder="e.g. Yirgacheffe Beans, Organic Whole Milk, Caramel..."
              className="w-full bg-[#222222] border border-white/10 focus:border-[#D4AF37] rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 outline-none"
            />
          </div>

          {/* Row 5: Image URL & Presets */}
          <div>
            <label className="block text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">
              Product Image
            </label>
            <div className="flex gap-3 items-center mb-2">
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 bg-[#222222] border border-white/10 focus:border-[#D4AF37] rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
              <label className="px-3 py-2 bg-[#2a2a2a] hover:bg-[#333333] border border-white/10 rounded-xl text-xs font-medium text-gray-300 flex items-center gap-1.5 cursor-pointer">
                <Upload size={14} className="text-[#D4AF37]" />
                <span>Upload</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              {image && (
                <img
                  src={image}
                  alt="Preview"
                  className="w-9 h-9 object-cover rounded-lg border border-[#D4AF37]/40 shrink-0"
                />
              )}
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
              <span className="text-gray-400 font-sans shrink-0">Presets:</span>
              {PRESET_PRODUCT_IMAGES.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setImage(preset.url)}
                  className={`px-2 py-0.5 rounded-full border whitespace-nowrap transition-colors ${
                    image === preset.url
                      ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] font-bold'
                      : 'border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 6: Availability & Special Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
            {/* Out of Stock Toggle */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#222222] border border-white/10 cursor-pointer hover:border-white/20">
              <div>
                <span className="text-xs font-bold text-white block">Stock Availability</span>
                <span className="text-[10px] text-gray-400 block">
                  {isAvailable ? 'In Stock (Visible to order)' : 'Out of Stock (Marked as unavailable)'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
              />
            </label>

            {/* Feature in Our Specials */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#222222] border border-[#D4AF37]/30 cursor-pointer hover:border-[#D4AF37]/60">
              <div className="flex items-center gap-2">
                <Star size={16} className={`shrink-0 ${isSpecial ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-500'}`} />
                <div>
                  <span className="text-xs font-bold text-[#D4AF37] block">Chef’s Special / Featured</span>
                  <span className="text-[10px] text-gray-400 block">
                    Showcase in Top Specials & Menu Highlight
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isSpecial}
                onChange={(e) => setIsSpecial(e.target.checked)}
                className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
              />
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#6B1D1D] hover:bg-[#852323] text-white border border-[#D4AF37]/50 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 size={16} className="text-[#D4AF37]" />
              <span>{isSaving ? 'Saving...' : isEditing ? 'Update Product' : 'Add to Menu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   2. CATEGORY MANAGER MODAL (Add, Edit, Delete Category)
   ========================================================================= */
interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryRecord[];
  onAddCategory: (cat: CategoryRecord) => void | Promise<void>;
  onUpdateCategory?: (cat: CategoryRecord) => void | Promise<void>;
  onDeleteCategory: (id: string) => void | Promise<void>;
}

export const CategoryManagerModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsSubmitting(true);
    try {
      const newCat: CategoryRecord = {
        id: `CAT-${Date.now()}`,
        name: newCatName.trim(),
        type: 'Product',
        description: newCatDesc.trim() || 'Menu category for restaurant offerings',
        itemCount: 0,
      };
      await onAddCategory(newCat);
      setNewCatName('');
      setNewCatDesc('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (cat: CategoryRecord) => {
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
  };

  const handleSaveEdit = async (cat: CategoryRecord) => {
    if (!editName.trim()) return;
    setIsSubmitting(true);
    try {
      const updated: CategoryRecord = {
        ...cat,
        name: editName.trim(),
        description: editDesc.trim(),
      };
      if (onUpdateCategory) {
        await onUpdateCategory(updated);
      } else {
        await onAddCategory(updated);
      }
      setEditingCatId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#181818] border border-[#D4AF37]/40 text-[#FDF5E6] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-fadeIn my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1f1f1f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6B1D1D] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#FDF5E6]">
                Manage Menu Categories
              </h3>
              <p className="text-xs text-[#A8A095]">
                Add, edit or reorganize categories shown in the menu & PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="bg-[#222222] p-4 rounded-2xl border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              <Plus size={14} /> Add New Category
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category Name (e.g. Seafood)"
                className="bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#D4AF37]"
              />
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Description / subtitle"
                className="bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !newCatName.trim()}
                className="px-4 py-2 bg-[#6B1D1D] hover:bg-[#852323] text-white border border-[#D4AF37]/40 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <Plus size={14} className="text-[#D4AF37]" />
                <span>Add Category</span>
              </button>
            </div>
          </form>

          {/* List of Existing Categories */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Active Categories ({categories.length})
            </h4>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isThisEditing = editingCatId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="p-3 bg-[#222222] border border-white/5 rounded-xl flex items-center justify-between gap-3"
                  >
                    {isThisEditing ? (
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-[#181818] border border-[#D4AF37] rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="bg-[#181818] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-[#FDF5E6]">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                            {cat.type || 'Product'}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-[11px] text-[#A8A095] truncate">{cat.description}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isThisEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(cat)}
                            className="p-1.5 bg-[#6B1D1D] text-white rounded-lg hover:bg-[#852323]"
                            title="Save"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingCatId(null)}
                            className="p-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 text-gray-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteCategory(cat.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1f1f1f] border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2a2a2a] hover:bg-[#333333] text-white rounded-xl text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
