import React, { useState } from 'react';
import { MenuItem, Category } from '../../types';
import { Plus, Trash2, Pencil, X, CheckCircle2, Upload, Image as ImageIcon, Sparkles, Utensils, Star } from 'lucide-react';

const PRESET_PHOTOS = [
  { label: 'Cappuccino', url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Breakfast', url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80' },
  { label: 'Cake', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80' },
  { label: 'Fresh Juice', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80' },
  { label: 'Macchiato', url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=800&q=80' },
  { label: 'Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80' },
  { label: 'Latte', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80' },
];

interface MenuManagementProps {
  menuItems: MenuItem[];
  onAddItem: (item: Partial<MenuItem>) => void;
  onUpdateItem?: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
}

export const MenuManagement: React.FC<MenuManagementProps> = ({
  menuItems,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Coffee');
  const [price, setPrice] = useState(120);
  const [description, setDescription] = useState('');
  const [isSpecial, setIsSpecial] = useState(false);

  // Editing state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('Coffee');
  const [editPrice, setEditPrice] = useState(120);
  const [editDescription, setEditDescription] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);
  const [editIsSpecial, setEditIsSpecial] = useState(false);
  const [editImage, setEditImage] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editIngredientsStr, setEditIngredientsStr] = useState('');

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrice(item.price);
    setEditDescription(item.description || '');
    setEditAvailable(item.isAvailable !== false);
    setEditIsSpecial(Boolean(item.isSpecial || item.isFeatured));
    setEditImage(item.image || PRESET_PHOTOS[0].url);
    setEditBarcode(item.barcode || '');
    setEditIngredientsStr(item.ingredients ? item.ingredients.join(', ') : '');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const ingredientsList = editIngredientsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updated: MenuItem = {
      ...editingItem,
      name: editName,
      category: editCategory,
      price: Number(editPrice),
      description: editDescription,
      isAvailable: editAvailable,
      isSpecial: editIsSpecial,
      isFeatured: editIsSpecial,
      image: editImage || editingItem.image,
      barcode: editBarcode || editingItem.barcode,
      ingredients: ingredientsList.length > 0 ? ingredientsList : editingItem.ingredients,
    };

    if (onUpdateItem) {
      onUpdateItem(updated);
    }
    setEditingItem(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAddItem({
      name,
      category,
      price: Number(price),
      currency: 'ETB',
      description,
      ingredients: ['Fresh Quality Blend'],
      calories: 180,
      prepTimeMinutes: 5,
      isAvailable: true,
      isSpecial: isSpecial,
      isFeatured: isSpecial,
      image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80',
      barcode: `CL-${category.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
    });
    setShowAddModal(false);
    setName('');
    setDescription('');
    setIsSpecial(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
            Catalog Management
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#EAEAEA]">Menu & Products Catalog</h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Manage item details, pricing, availability and barcodes</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0F1115] h-[50px] px-6 rounded-[16px] text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all duration-250 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={18} /> Add New Menu Item
        </button>
      </div>

      {/* Menu Table Card / Desktop View */}
      <div className="bg-[#243244] rounded-[22px] border border-white/10 overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
        {/* Desktop & Tablet Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1E293B] border-b border-white/10 text-[#CBD5E1] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-5">Product</th>
                <th className="p-5">Category</th>
                <th className="p-5">Price</th>
                <th className="p-5">Barcode</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {menuItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#2F4158] transition-colors">
                  <td className="p-5 flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-[14px]" />
                    <div>
                      <span className="font-bold text-[#F8FAFC] text-sm block">{item.name}</span>
                      <span className="text-[#94A3B8] text-[11px]">{item.calories} kcal</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="bg-[#1E293B] text-[#D4AF37] border border-[#D4AF37]/30 font-bold px-3 py-1 rounded-[10px] text-[11px]">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-5 font-extrabold text-[#D4AF37] text-sm">{item.price} ETB</td>
                  <td className="p-5 font-mono text-[#CBD5E1]">{item.barcode || 'CL-GEN-01'}</td>
                  <td className="p-5">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                      item.isAvailable !== false
                        ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {item.isAvailable !== false ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-2.5 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                        title="Edit Menu Item"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-2 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                        aria-label="Delete Item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards View (< 640px) */}
        <div className="sm:hidden divide-y divide-white/10">
          {menuItems.map((item) => (
            <div key={item.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-[14px]" />
                  <div>
                    <h3 className="font-bold text-[#F8FAFC] text-sm">{item.name}</h3>
                    <span className="text-[#94A3B8] text-[11px]">{item.calories} kcal • {item.barcode || 'CL-GEN-01'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl"
                    aria-label="Edit Item"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 text-[#EF4444] bg-[#EF4444]/10 rounded-xl transition-colors"
                    aria-label="Delete Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                <span className="bg-[#1E293B] text-[#D4AF37] border border-[#D4AF37]/30 font-bold px-3 py-1 rounded-[10px]">
                  {item.category}
                </span>
                <span className="font-extrabold text-[#D4AF37] text-base">{item.price} ETB</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Product Modal - Full Screen */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn text-[#F8FAFC]">
          {/* Header */}
          <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#F6C453] text-[#0F172A] flex items-center justify-center font-black">
                <Utensils size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-[#F8FAFC]">Add New Menu Item (አዲስ የመኑ ምርት መዝግብ)</h3>
                <p className="text-xs text-[#CBD5E1]">Enter menu item details, category, price and description</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-[#243244] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <X size={18} />
              <span>Cancel</span>
            </button>
          </div>

          <form onSubmit={handleAdd} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-6">
              <div className="bg-[#1E293B] p-6 sm:p-8 rounded-[28px] border border-white/10 space-y-6 shadow-xl">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#D4AF37] border-b border-white/10 pb-3">
                  Product Details & Category
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#CBD5E1] block">Item Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Specialty Yirgacheffe V60"
                      className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#CBD5E1] block">Category *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as Category)}
                        className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                      >
                        <option value="Coffee">Coffee</option>
                        <option value="Bakery">Bakery</option>
                        <option value="Breakfast">Breakfast</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Specials">Specials</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#CBD5E1] block">Price (ETB) *</label>
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-sm font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Description & Flavor Notes</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Flavor notes, roast profile, origin, serving size..."
                    className="w-full bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Our Specials Checkbox in Add Modal */}
                <div className="bg-[#243244] p-4 rounded-xl border border-[#D4AF37]/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Star size={18} className={isSpecial ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-400'} />
                    <div>
                      <span className="text-xs font-bold text-[#F8FAFC] block">
                        Feature in "Our Specials" (በዋናው ሜኑ 'Our Specials' ላይ እንዲታይ)
                      </span>
                      <span className="text-[11px] text-[#94A3B8]">
                        Tick to display on frontpage specials and specials filter.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSpecial}
                    onChange={(e) => setIsSpecial(e.target.checked)}
                    className="w-5 h-5 accent-[#D4AF37] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-6 h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 hover:bg-[#2F4158] rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 h-12 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>Save Product</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Product Modal - Full Screen */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn text-[#F8FAFC]">
          {/* Header */}
          <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl border border-[#D4AF37]/30">
                <Pencil size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-[#F8FAFC]">Edit Menu Item (ምርት አርትዕ)</h3>
                <p className="text-xs text-[#CBD5E1]">Update catalog details, photo, and ingredients</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 bg-[#243244] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <X size={18} />
              <span>Cancel</span>
            </button>
          </div>

          <form onSubmit={handleUpdate} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-6">
              <div className="bg-[#1E293B] p-6 sm:p-8 rounded-[28px] border border-white/10 space-y-6 shadow-xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm font-semibold focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#CBD5E1] block">Category *</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as Category)}
                      className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="Coffee">Coffee</option>
                      <option value="Latte">Latte</option>
                      <option value="Cappuccino">Cappuccino</option>
                      <option value="Mocha">Mocha</option>
                      <option value="Macchiato">Macchiato</option>
                      <option value="Americano">Americano</option>
                      <option value="Tea">Tea</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Cake">Cake</option>
                      <option value="Dessert">Dessert</option>
                      <option value="Breakfast">Breakfast</option>
                      <option value="Fresh Juice">Fresh Juice</option>
                      <option value="Soft Drink">Soft Drink</option>
                      <option value="Burger">Burger</option>
                      <option value="Pizza">Pizza</option>
                      <option value="Sandwich">Sandwich</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#CBD5E1] block">Price (ETB) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#CBD5E1] block">Barcode / SKU</label>
                    <input
                      type="text"
                      value={editBarcode}
                      onChange={(e) => setEditBarcode(e.target.value)}
                      placeholder="e.g. CL-COF-01"
                      className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#CBD5E1] block">Ingredients (Comma Separated)</label>
                    <input
                      type="text"
                      value={editIngredientsStr}
                      onChange={(e) => setEditIngredientsStr(e.target.value)}
                      placeholder="Coffee Beans, Fresh Milk, Sugar"
                      className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Photo Editor */}
                <div className="bg-[#243244] p-4 rounded-xl border border-white/10 space-y-3">
                  <label className="text-xs font-bold text-[#CBD5E1] flex items-center gap-1.5">
                    <ImageIcon size={15} className="text-[#D4AF37]" /> Product Image (የምርት ፎቶ)
                  </label>
                  <div className="flex items-center gap-4">
                    <img
                      src={editImage || PRESET_PHOTOS[0].url}
                      alt=""
                      className="w-16 h-16 object-cover rounded-xl border-2 border-[#D4AF37] shrink-0"
                    />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E293B] hover:bg-[#2F4158] text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg text-xs font-bold cursor-pointer transition-all">
                          <Upload size={14} /> Upload Custom Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleEditPhotoUpload}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="url"
                          value={editImage}
                          onChange={(e) => setEditImage(e.target.value)}
                          placeholder="Or paste image URL..."
                          className="flex-1 h-9 bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-lg px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {PRESET_PHOTOS.map((photo, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setEditImage(photo.url)}
                            className={`px-2.5 py-1 rounded-md border text-xs whitespace-nowrap cursor-pointer ${
                              editImage === photo.url
                                ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] font-bold'
                                : 'border-white/10 bg-[#1E293B] text-gray-300'
                            }`}
                          >
                            {photo.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Description</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl p-3.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isAvailableCheckbox"
                      checked={editAvailable}
                      onChange={(e) => setEditAvailable(e.target.checked)}
                      className="w-5 h-5 rounded text-[#D4AF37] focus:ring-0 cursor-pointer accent-[#D4AF37]"
                    />
                    <label htmlFor="isAvailableCheckbox" className="text-xs font-semibold text-[#CBD5E1] cursor-pointer">
                      Available for Order (በሽያጭ ላይ ይገኛል)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isSpecialCheckbox"
                      checked={editIsSpecial}
                      onChange={(e) => setEditIsSpecial(e.target.checked)}
                      className="w-5 h-5 rounded text-[#D4AF37] focus:ring-0 cursor-pointer accent-[#D4AF37]"
                    />
                    <label htmlFor="isSpecialCheckbox" className="text-xs font-bold text-[#D4AF37] cursor-pointer flex items-center gap-1">
                      <Star size={13} className={editIsSpecial ? 'fill-[#D4AF37]' : ''} />
                      <span>Feature in "Our Specials" (በዋናው ሜኑ 'Our Specials' ላይ እንዲታይ)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-6 h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 hover:bg-[#2F4158] rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 h-12 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>Save Changes (አስቀምጥ)</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};


