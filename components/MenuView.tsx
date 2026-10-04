import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { MenuItem, CategoryRecord } from '../types';
import { BrandLogo } from './BrandLogo';
import { MenuPrintTemplate } from './MenuPrintTemplate';
import { MenuPreviewModal } from './MenuPreviewModal';
import { ProductModal, CategoryManagerModal } from './AdminERP/MenuAdminModals';
import { downloadMenuPDF } from '../lib/pdfGenerator';
import { printMenuContainer } from '../lib/printHelper';
import {
  Search,
  ShoppingBag,
  Star,
  Info,
  Heart,
  Flame,
  Clock,
  CheckCircle2,
  X,
  Printer,
  Download,
  Eye,
  Plus,
  Layers,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  Sparkles,
  PhoneCall,
  MapPin,
  UtensilsCrossed,
  SlidersHorizontal,
  QrCode,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface MenuViewProps {
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem, customOptions?: string[], notes?: string) => void;
  wishlistIds: string[];
  toggleWishlist: (itemId: string) => void;
  isAdmin?: boolean;
  onOpenQR?: () => void;
  onAddItem?: (item: Partial<MenuItem>) => void | Promise<void>;
  onUpdateItem?: (item: MenuItem) => void | Promise<void>;
  onDeleteItem?: (id: string) => void | Promise<void>;
  categories?: CategoryRecord[];
  onAddCategory?: (cat: CategoryRecord) => void | Promise<void>;
  onUpdateCategory?: (cat: CategoryRecord) => void | Promise<void>;
  onDeleteCategory?: (id: string) => void | Promise<void>;
}

export const MenuView: React.FC<MenuViewProps> = ({
  menuItems,
  onAddToCart,
  wishlistIds,
  toggleWishlist,
  isAdmin = false,
  onOpenQR,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  categories = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedMilk, setSelectedMilk] = useState<string>('Whole Organic Milk');
  const [extraShots, setExtraShots] = useState<number>(0);
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Modals & Toolbar State
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [pdfToast, setPdfToast] = useState<string>('');
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [adminEditMode, setAdminEditMode] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  // Demo QR Code State
  const [isDemoQRModalOpen, setIsDemoQRModalOpen] = useState<boolean>(false);
  const [demoQRUrl, setDemoQRUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    QRCode.toDataURL('https://cafelina.com/menu', {
      width: 320,
      margin: 1,
      color: {
        dark: '#1e1e1e',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setDemoQRUrl(url))
      .catch((err) => console.error('Demo QR generation error in MenuView:', err));
  }, []);

  // Hidden print container ref for PDF generation
  const printCanvasRef = useRef<HTMLDivElement>(null);

  // Build complete list of selectable categories
  const defaultCategories = [
    'All',
    'Our Specials',
    'Breakfast',
    'Main Course',
    'Pizza',
    'Burger',
    'Pasta',
    'Salad',
    'Coffee',
    'Bakery',
    'Dessert',
    'Drinks',
  ];

  // Merge with custom categories from database
  const dynamicCategories = categories
    .filter((c) => c.type === 'Product' || !c.type)
    .map((c) => c.name)
    .filter((name) => !defaultCategories.includes(name));

  const allDisplayCategories = [...defaultCategories, ...dynamicCategories];

  // Filtering Logic
  const filteredItems = menuItems.filter((item) => {
    let matchesCategory = false;
    const itemCatLower = (item.category || '').toLowerCase().trim();
    const itemSubLower = (item.subcategory || '').toLowerCase().trim();
    const selectedLower = selectedCategory.toLowerCase().trim();

    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else if (selectedCategory === 'Our Specials') {
      matchesCategory = Boolean(item.isSpecial || item.isFeatured);
    } else if (selectedCategory === 'Coffee') {
      matchesCategory = [
        'coffee',
        'espresso',
        'latte',
        'cappuccino',
        'mocha',
        'macchiato',
        'americano',
      ].some((c) => itemCatLower.includes(c) || itemSubLower.includes(c));
    } else if (selectedCategory === 'Drinks') {
      matchesCategory = [
        'drinks',
        'juice',
        'fresh juice',
        'soft drink',
        'tea',
        'beverage',
        'mocktail',
      ].some((c) => itemCatLower.includes(c) || itemSubLower.includes(c));
    } else if (selectedCategory === 'Dessert') {
      matchesCategory = [
        'dessert',
        'cake',
        'pastry',
      ].some((c) => itemCatLower.includes(c) || itemSubLower.includes(c));
    } else {
      matchesCategory =
        itemCatLower === selectedLower ||
        itemSubLower === selectedLower ||
        itemCatLower.includes(selectedLower) ||
        selectedLower.includes(itemCatLower);
    }

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.ingredients &&
        item.ingredients.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesCategory && matchesSearch;
  });

  // Featured Specials
  const specials = menuItems.filter((i) => i.isSpecial || i.isFeatured);

  // Grouping for "All" view
  const categorySections: { title: string; subtitle: string; match: (i: MenuItem) => boolean }[] = [
    {
      title: 'Artisan Coffee & Espresso Bar',
      subtitle: 'Single-origin Ethiopian Yirgacheffe roasts, manual pour-overs & lattes',
      match: (i) =>
        ['coffee', 'espresso', 'latte', 'cappuccino', 'mocha', 'macchiato', 'americano'].includes(
          (i.category || '').toLowerCase()
        ),
    },
    {
      title: 'Breakfast & Morning Delicacies',
      subtitle: 'Artisan toasts, club sandwiches, croissants & morning favorites',
      match: (i) =>
        ['breakfast', 'bakery', 'sandwich'].includes((i.category || '').toLowerCase()) &&
        !['cake', 'dessert'].includes((i.category || '').toLowerCase()),
    },
    {
      title: 'Gourmet Main Courses & Prime Steaks',
      subtitle: '300g grilled prime tenderloins, herb poultry & wild seafood entrées',
      match: (i) =>
        ['main course', 'steak', 'grill', 'entree'].includes((i.category || '').toLowerCase()),
    },
    {
      title: 'Stone-Baked Pizzas & Burgers',
      subtitle: 'Crisp Neapolitan crusts & signature Wagyu beef patties on brioche',
      match: (i) => ['pizza', 'burger'].includes((i.category || '').toLowerCase()),
    },
    {
      title: 'Fresh Handmade Pastas & Salads',
      subtitle: 'Hand-rolled egg fettuccine & organic garden greens',
      match: (i) => ['pasta', 'salad'].includes((i.category || '').toLowerCase()),
    },
    {
      title: 'Belgian Desserts & Artisan Cakes',
      subtitle: 'Molten chocolate lava tortes, cheesecakes & sweet pastries',
      match: (i) => ['cake', 'dessert'].includes((i.category || '').toLowerCase()),
    },
    {
      title: 'Artisan Refreshments & Juices',
      subtitle: 'Cold-pressed tropical juices, herbal infusions & sparkling mocktails',
      match: (i) =>
        ['drinks', 'fresh juice', 'juice', 'soft drink', 'tea'].includes(
          (i.category || '').toLowerCase()
        ),
    },
  ];

  // Print Handler
  const handlePrintMenu = () => {
    printMenuContainer({
      containerId: 'cafelina-menu-print-target',
      documentTitle: 'Cafe Lina Dining & Specialty Menu',
      onSuccess: () => {
        setPdfToast('Print dialog initiated successfully!');
        setTimeout(() => setPdfToast(''), 2000);
      },
      onError: (err) => {
        console.warn('Print helper error, opening A4 preview:', err);
        setIsPreviewOpen(true);
      },
    });
  };

  // PDF Download Handler
  const handleDownloadPDF = async () => {
    try {
      setIsExportingPDF(true);
      setPdfToast('Generating high-resolution printable A4 PDF...');

      await downloadMenuPDF('cafelina-menu-print-target', {
        restaurantName: 'Cafe Lina Luxury Coffee & Restaurant',
        phone: '+251 900 123 456',
        address: 'Bole Road, Addis Ababa, Ethiopia',
        website: 'www.cafelina.com',
        menuItems: menuItems,
        onProgress: (_p, msg) => {
          setPdfToast(msg);
        },
      });

      setPdfToast('A4 Menu PDF downloaded successfully!');
      setTimeout(() => {
        setIsExportingPDF(false);
        setPdfToast('');
      }, 2500);
    } catch (err) {
      console.error('PDF export error:', err);
      setPdfToast('Failed to export PDF.');
      setTimeout(() => {
        setIsExportingPDF(false);
        setPdfToast('');
      }, 3000);
    }
  };

  const handleCustomAdd = () => {
    if (!selectedItem) return;
    const options = [
      selectedMilk,
      extraShots > 0 ? `+${extraShots} Extra Espresso Shot` : null,
    ].filter(Boolean) as string[];

    onAddToCart(selectedItem, options, specialNotes);
    setSelectedItem(null);
    setSpecialNotes('');
    setExtraShots(0);
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (item: MenuItem) => {
    setEditingProduct(item);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (productData: Partial<MenuItem>) => {
    if (editingProduct && onUpdateItem) {
      await onUpdateItem({ ...(editingProduct as MenuItem), ...(productData as MenuItem) });
    } else if (onAddItem) {
      await onAddItem(productData);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !onDeleteItem) return;
    await onDeleteItem(itemToDelete.id);
    setItemToDelete(null);
  };

  return (
    <div className="bg-[#0f0f0f] min-h-screen text-[#FDF5E6] select-none pb-20">
      {/* Toast Notification */}
      {pdfToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-[#6B1D1D] text-white px-5 py-3 rounded-2xl border border-[#D4AF37] shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fadeIn">
          {isExportingPDF ? (
            <Loader2 size={16} className="animate-spin text-[#D4AF37]" />
          ) : (
            <CheckCircle2 size={16} className="text-green-400" />
          )}
          <span>{pdfToast}</span>
        </div>
      )}

      {/* =========================================================================
          1. RESTAURANT LUXURY HEADER & BRAND BANNER
          ========================================================================= */}
      <div className="border-b border-[#D4AF37]/20 bg-gradient-to-b from-[#181818] to-[#0f0f0f] pt-10 pb-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3">
            {/* Center Brand Logo */}
            <div className="flex justify-center">
              <BrandLogo size="lg" variant="light" showSubtitle={true} />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B1D1D]/30 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold tracking-widest uppercase">
              <Sparkles size={13} />
              <span>Gourmet Kitchen • Roastery • Bakery</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#FDF5E6] tracking-tight">
              Cafe Lina Dining & Specialty Menu
            </h1>

            <p className="text-xs sm:text-sm text-[#A8A095] max-w-2xl mx-auto leading-relaxed">
              Explore our single-origin Ethiopian specialty coffees, wood-fired artisan pizzas,
              prime tenderloin steaks, and freshly rolled Belgian chocolate pastries.
            </p>

            {/* Micro Info Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-[#A8A095]/90 pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-[#D4AF37]" /> Bole Road, Addis Ababa
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-[#D4AF37]" /> Daily 06:00 AM - 11:00 PM
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <PhoneCall size={13} className="text-[#D4AF37]" /> +251 900 123 456
              </span>
            </div>

            {/* Demo QR Code Interactive Pill on Menu Hero */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setIsDemoQRModalOpen(true)}
                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1b1b1b] hover:bg-[#252525] border border-[#D4AF37]/50 text-xs font-semibold text-[#FDF5E6] shadow-lg transition-all active:scale-95 cursor-pointer group"
                title="View & Scan Live Demo QR Code for this Menu"
              >
                <QrCode size={15} className="text-[#D4AF37] group-hover:scale-110 transition-transform" />
                <span>Demo QR Code: Scan with phone to view & order menu online</span>
                <span className="text-[10px] bg-[#6B1D1D] text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Scan QR
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. ACTION TOOLBAR: SEARCH, PRINT, PDF, PREVIEW & ADMIN CONTROLS
          ========================================================================= */}
      <div className="sticky top-0 z-30 bg-[#141414]/95 backdrop-blur-md border-b border-[#D4AF37]/20 py-3.5 shadow-xl no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="w-full md:w-80 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coffee, steak, pizza, salad..."
                className="w-full bg-[#1e1e1e] border border-white/10 focus:border-[#D4AF37] text-white placeholder-gray-400 rounded-full pl-10 pr-9 py-2 text-xs transition-all shadow-inner outline-none"
              />
              <Search size={15} className="absolute left-3.5 top-2.5 text-[#D4AF37]" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-gray-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Action Buttons: Preview, Print, Download PDF */}
            <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
              {/* Demo QR Code Button */}
              <button
                onClick={() => setIsDemoQRModalOpen(true)}
                className="px-3.5 py-2 bg-[#6B1D1D] hover:bg-[#852323] text-white border border-[#D4AF37]/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                title="View live Demo QR Code for this menu"
              >
                <QrCode size={14} className="text-[#D4AF37]" />
                <span>Demo QR</span>
              </button>

              {/* Menu QR Code Button */}
              {onOpenQR && (
                <button
                  onClick={onOpenQR}
                  className="px-3.5 py-2 bg-[#202020] hover:bg-[#2b2b2b] text-[#FDF5E6] border border-[#D4AF37]/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Generate Table QR Code for this Menu"
                >
                  <SlidersHorizontal size={14} className="text-[#D4AF37]" />
                  <span>QR Studio</span>
                </button>
              )}

              {/* Preview Menu Button */}
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="px-3.5 py-2 bg-[#202020] hover:bg-[#2b2b2b] text-[#FDF5E6] border border-[#D4AF37]/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                title="Open interactive A4 preview"
              >
                <Eye size={14} className="text-[#D4AF37]" />
                <span>Preview Menu</span>
              </button>

              {/* Print Menu Button */}
              <button
                onClick={handlePrintMenu}
                className="px-3.5 py-2 bg-[#202020] hover:bg-[#2b2b2b] text-[#FDF5E6] border border-[#D4AF37]/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                title="Send directly to printer"
              >
                <Printer size={14} className="text-[#D4AF37]" />
                <span>Print Menu</span>
              </button>

              {/* Download PDF Button */}
              <button
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className="px-4 py-2 bg-[#6B1D1D] hover:bg-[#852323] text-white border border-[#D4AF37]/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Download professional A4 menu PDF"
              >
                {isExportingPDF ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-[#D4AF37]" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} className="text-[#D4AF37]" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>

              {/* Admin Menu Management Toolbar */}
              {isAdmin && (
                <div className="flex items-center gap-2 pl-2 border-l border-white/20">
                  <button
                    onClick={handleOpenAddProduct}
                    className="px-3 py-2 bg-[#D4AF37] hover:bg-[#e4be42] text-black rounded-xl text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 cursor-pointer"
                    title="Add new product to menu"
                  >
                    <Plus size={14} />
                    <span className="hidden sm:inline">Add Product</span>
                  </button>

                  <button
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="p-2 bg-[#222222] hover:bg-[#2e2e2e] text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs transition-colors"
                    title="Manage Menu Categories"
                  >
                    <Layers size={15} />
                  </button>

                  <button
                    onClick={() => setAdminEditMode(!adminEditMode)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                      adminEditMode
                        ? 'bg-[#6B1D1D] text-white border-[#D4AF37]'
                        : 'bg-[#222222] text-gray-400 border-white/10 hover:text-white'
                    }`}
                    title="Toggle inline product edit controls"
                  >
                    <Edit2 size={13} />
                    <span className="text-[11px] hidden sm:inline">Edit Mode</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. CATEGORY SELECTOR PILLS (HORIZONTALLY SCROLLABLE)
          ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 no-print">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {allDisplayCategories.map((cat) => {
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#6B1D1D] text-white border border-[#D4AF37] shadow-lg scale-105'
                    : 'bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#252525] border border-white/10'
                }`}
              >
                {cat === 'Our Specials' ? '⭐ Chef’s Specials' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          4. MAIN MENU VIEWPORT
          ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-12">
        {/* If no items match */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-[#161616] rounded-3xl border border-white/10 p-8">
            <UtensilsCrossed size={48} className="text-[#D4AF37]/60 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-xl text-[#FDF5E6]">No Menu Items Found</h3>
            <p className="text-xs text-[#A8A095] mt-1 max-w-sm mx-auto">
              We couldn't find any dishes matching "{searchQuery}". Try selecting another category or resetting filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-5 px-5 py-2.5 bg-[#6B1D1D] hover:bg-[#852323] text-white border border-[#D4AF37]/40 rounded-xl text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : selectedCategory === 'All' && !searchQuery ? (
          /* =======================================================================
             STRUCTURED CATEGORY SECTIONS VIEW (WHEN "ALL" IS SELECTED)
             ======================================================================= */
          <div className="space-y-14">
            {/* 4.A CHEF'S SPECIALS SHOWCASE */}
            {specials.length > 0 && (
              <div className="bg-gradient-to-r from-[#6B1D1D]/30 via-[#181818] to-[#6B1D1D]/30 p-6 sm:p-8 rounded-3xl border border-[#D4AF37]/50 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#D4AF37]/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <Star size={18} className="text-[#D4AF37] fill-[#D4AF37]" />
                      <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                        Executive Chef’s Recommendation
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#FDF5E6] mt-1">
                      Today’s Chef Signatures & Highlights
                    </h2>
                  </div>
                  <span className="text-xs font-sans text-[#A8A095]">
                    {specials.length} Featured Delicacies
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {specials.slice(0, 4).map((item) => renderProductCard(item))}
                </div>
              </div>
            )}

            {/* 4.B ORGANIZED CATEGORY SECTIONS */}
            {categorySections.map((section) => {
              const sectionItems = menuItems.filter(section.match);
              if (sectionItems.length === 0) return null;

              return (
                <div key={section.title} className="space-y-6">
                  {/* Category Header */}
                  <div className="flex items-baseline justify-between pb-3 border-b border-[#D4AF37]/30">
                    <div>
                      <h3 className="font-serif font-bold text-2xl sm:text-3xl text-[#FDF5E6] tracking-wide">
                        {section.title}
                      </h3>
                      <p className="text-xs text-[#A8A095] mt-1">{section.subtitle}</p>
                    </div>
                    <span className="text-xs font-sans text-[#D4AF37] font-semibold">
                      {sectionItems.length} {sectionItems.length === 1 ? 'Dish' : 'Dishes'}
                    </span>
                  </div>

                  {/* Items Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sectionItems.map((item) => renderProductCard(item))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* =======================================================================
             FILTERED GRID VIEW (BY CATEGORY OR SEARCH QUERY)
             ======================================================================= */
          <div>
            <div className="flex items-baseline justify-between mb-6 pb-3 border-b border-white/10">
              <h2 className="font-serif font-bold text-2xl text-[#FDF5E6]">
                {selectedCategory === 'All' ? `Search Results for "${searchQuery}"` : selectedCategory}
              </h2>
              <span className="text-xs text-[#A8A095]">
                {filteredItems.length} {filteredItems.length === 1 ? 'Item' : 'Items'} Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => renderProductCard(item))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          5. PRINT CONTAINER (FOR HIGH RESOLUTION A4 GENERATION & @media print)
          ========================================================================= */}
      {/* Container for @media print (Cleanly displayed during print, hidden on screen) */}
      <div className="menu-print-container-wrapper">
        <MenuPrintTemplate id="cafelina-menu-print-target" menuItems={menuItems} />
      </div>

      {/* Off-screen container kept in DOM for html2canvas rendering with 100% opacity */}
      <div
        ref={printCanvasRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0px',
          width: '794px',
          zIndex: -9999,
          pointerEvents: 'none',
          overflow: 'visible',
          background: '#FFFDF9',
        }}
      >
        <MenuPrintTemplate menuItems={menuItems} />
      </div>

      {/* =========================================================================
          6. MODALS: A4 PREVIEW, PRODUCT ADD/EDIT, CATEGORY MANAGER, DELETE CONFIRM
          ========================================================================= */}
      {/* A4 Menu Preview Modal */}
      <MenuPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        menuItems={menuItems}
        onPrint={handlePrintMenu}
      />

      {/* Product Add / Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={editingProduct}
        availableCategories={allDisplayCategories.filter((c) => !['All', 'Our Specials'].includes(c))}
        onSave={handleSaveProduct}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={onAddCategory || (async () => {})}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory || (async () => {})}
      />

      {/* Demo QR Code Interactive Modal */}
      {isDemoQRModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn no-print">
          <div className="bg-[#181818] border border-[#D4AF37]/50 text-[#FDF5E6] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-center">
            <button
              onClick={() => setIsDemoQRModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#6B1D1D] text-[#D4AF37] border border-[#D4AF37]/40 mx-auto flex items-center justify-center shadow-md">
              <QrCode size={24} />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] bg-[#6B1D1D]/40 border border-[#D4AF37]/30 px-3 py-0.5 rounded-full">
                Interactive Demo
              </span>
              <h3 className="font-serif font-bold text-lg text-white mt-1.5">
                Cafe Lina Menu QR Code
              </h3>
              <p className="text-xs text-[#A8A095] mt-1">
                Scan with any smartphone camera to open the live digital menu & place table orders.
              </p>
            </div>

            {/* QR Image Frame */}
            <div className="p-4 bg-white rounded-2xl border-2 border-[#D4AF37] inline-block mx-auto shadow-xl">
              {demoQRUrl ? (
                <img
                  src={demoQRUrl}
                  alt="Cafe Lina Menu Demo QR"
                  className="w-48 h-48 object-contain mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-500">
                  <Loader2 size={32} className="animate-spin text-[#6B1D1D]" />
                </div>
              )}
              <span className="block text-[10px] font-sans font-bold text-gray-800 tracking-wider uppercase mt-1">
                Cafe Lina Menu • Bole Road
              </span>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('https://cafelina.com/menu');
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3.5 py-2 bg-[#242424] hover:bg-[#303030] text-gray-200 border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>

                {demoQRUrl && (
                  <a
                    href={demoQRUrl}
                    download="CafeLina_Demo_Menu_QR.png"
                    className="px-3.5 py-2 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download QR</span>
                  </a>
                )}
              </div>

              {onOpenQR && (
                <button
                  onClick={() => {
                    setIsDemoQRModalOpen(false);
                    onOpenQR();
                  }}
                  className="w-full text-center text-xs text-[#D4AF37] hover:underline pt-1 block cursor-pointer"
                >
                  Open Advanced QR Studio & Table Customizer →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-red-500/40 text-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-900/40 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base">Remove Product</h4>
                <p className="text-xs text-gray-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-gray-300">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-[#D4AF37]">"{itemToDelete.name}"</span> from the menu?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail & Customizer Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] text-[#FDF5E6] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative border border-[#D4AF37]/40 max-h-[90vh] flex flex-col animate-fadeIn">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black text-white p-2 rounded-full backdrop-blur-md transition-colors"
            >
              <X size={18} />
            </button>

            <div className="relative h-60 bg-[#121212]">
              <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-[#D4AF37] text-black px-2.5 py-0.5 rounded-full">
                    {selectedItem.category}
                  </span>
                  {selectedItem.isAvailable === false && (
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-red-600 text-white px-2.5 py-0.5 rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#FDF5E6] mt-1">{selectedItem.name}</h2>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <p className="text-sm text-[#A8A095] leading-relaxed">{selectedItem.description}</p>

              {/* Ingredients List */}
              {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-[#D4AF37] mb-2 tracking-wider">
                    Ingredients & Flavors
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.ingredients.map((ing) => (
                      <span
                        key={ing}
                        className="bg-[#222222] text-[#FDF5E6] text-xs px-2.5 py-1 rounded-md border border-white/10"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Milk Preference for Coffee Drinks */}
              {['coffee', 'espresso', 'latte', 'cappuccino', 'mocha', 'macchiato'].includes(
                (selectedItem.category || '').toLowerCase()
              ) && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-[#D4AF37] mb-2 tracking-wider">
                    Select Milk Preference
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {['Whole Organic Milk', 'Oat Milk (+20 ETB)', 'Almond Milk (+25 ETB)', 'Skimmed Milk'].map((milk) => (
                      <button
                        key={milk}
                        onClick={() => setSelectedMilk(milk)}
                        className={`p-2 rounded-xl text-left border font-medium transition-colors ${
                          selectedMilk === milk
                            ? 'border-[#D4AF37] bg-[#6B1D1D]/40 text-[#D4AF37] font-bold'
                            : 'border-white/10 text-[#A8A095] hover:bg-white/5'
                        }`}
                      >
                        {milk}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra Espresso Shots */}
              {['coffee', 'espresso', 'latte', 'cappuccino'].includes(
                (selectedItem.category || '').toLowerCase()
              ) && (
                <div className="flex items-center justify-between bg-[#222222] p-3 rounded-xl border border-white/5">
                  <span className="text-xs font-bold text-[#FDF5E6]">Extra Espresso Shot (+30 ETB)</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExtraShots(Math.max(0, extraShots - 1))}
                      className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold text-[#D4AF37]">{extraShots}</span>
                    <button
                      onClick={() => setExtraShots(extraShots + 1)}
                      className="w-7 h-7 rounded-lg bg-[#6B1D1D] text-white font-bold hover:bg-[#4A1212]"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Preparation Request Notes */}
              <div>
                <h4 className="text-xs font-bold uppercase text-[#D4AF37] mb-1 tracking-wider">
                  Special Notes / Preparation Request
                </h4>
                <input
                  type="text"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. Medium rare steak, extra hot coffee, dressing on the side..."
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#D4AF37] placeholder-[#A8A095] outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#121212] border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#A8A095] block">Total Item Price</span>
                <span className="text-xl font-extrabold text-[#D4AF37]">
                  {selectedItem.price + extraShots * 30} {selectedItem.currency || 'ETB'}
                </span>
              </div>

              {selectedItem.isAvailable === false ? (
                <span className="px-5 py-2.5 bg-red-950/60 border border-red-500/40 text-red-400 rounded-xl font-bold text-xs">
                  Currently Out of Stock
                </span>
              ) : (
                <button
                  onClick={handleCustomAdd}
                  className="bg-[#6B1D1D] hover:bg-[#4A1212] border border-[#D4AF37]/40 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase flex items-center gap-2 shadow-lg cursor-pointer active:scale-95"
                >
                  <CheckCircle2 size={16} />
                  <span>Confirm & Add To Cart</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* Helper function to render a product card */
  function renderProductCard(item: MenuItem) {
    const isWishlisted = wishlistIds.includes(item.id);
    const isOutOfStock = item.isAvailable === false;

    return (
      <div
        key={item.id}
        className={`bg-[#181818] rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col group relative ${
          item.isSpecial || item.isFeatured
            ? 'border-[#D4AF37]/50 shadow-[0_4px_25px_rgba(212,175,55,0.15)] hover:border-[#D4AF37]'
            : 'border-white/10 hover:border-[#D4AF37]/50 shadow-md'
        } ${isOutOfStock ? 'opacity-85' : ''}`}
      >
        {/* Admin Quick Action Floating Buttons (in adminEditMode or hover) */}
        {isAdmin && adminEditMode && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-[#D4AF37]/50 shadow-lg">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditProduct(item);
              }}
              className="p-1.5 text-gray-200 hover:text-[#D4AF37] hover:bg-white/10 rounded-lg transition-colors"
              title="Edit Product"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setItemToDelete(item);
              }}
              className="p-1.5 text-gray-200 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
              title="Delete Product"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* Product Image */}
        <div
          className="relative h-48 overflow-hidden bg-[#121212] cursor-pointer"
          onClick={() => setSelectedItem(item)}
        >
          <img
            src={item.image}
            alt={item.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              isOutOfStock ? 'grayscale contrast-125' : 'opacity-95'
            }`}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-[#181818]/90 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
              <Info size={12} /> View Details & Customize
            </span>
          </div>

          {/* Badges on Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
            <span className="bg-[#0f0f0f]/85 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              {item.category}
            </span>
            {(item.isSpecial || item.isFeatured) && (
              <span className="bg-[#6B1D1D] text-[#FDF5E6] border border-[#D4AF37]/60 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-md">
                <Star size={9} className="fill-[#D4AF37] text-[#D4AF37]" />
                <span>Special</span>
              </span>
            )}
          </div>

          {/* Out of Stock Overlay Ribbon */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-red-600/90 text-white font-serif font-bold text-xs uppercase px-3.5 py-1.5 rounded-full border border-white/20 tracking-wider shadow-lg">
                Out of Stock
              </span>
            </div>
          )}

          {/* Wishlist Button (hidden if in admin edit mode to prevent overlap) */}
          {(!isAdmin || !adminEditMode) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(item.id);
              }}
              className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
                isWishlisted
                  ? 'bg-[#6B1D1D] text-white border border-[#D4AF37]/50'
                  : 'bg-black/60 text-gray-300 hover:text-[#D4AF37]'
              }`}
              title="Add to Wishlist"
            >
              <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3
                onClick={() => setSelectedItem(item)}
                className="font-serif font-bold text-base text-[#FDF5E6] hover:text-[#D4AF37] cursor-pointer transition-colors truncate"
              >
                {item.name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-[#D4AF37] font-semibold shrink-0">
                <Star size={12} className="fill-[#D4AF37] text-[#D4AF37]" />
                <span>{item.rating || 5.0}</span>
              </div>
            </div>

            <p className="text-xs text-[#A8A095] line-clamp-2 leading-relaxed mb-3">
              {item.description}
            </p>

            {/* Micro info: prep time & calories */}
            <div className="flex items-center gap-3 text-[11px] text-[#A8A095]/80 mb-4">
              {item.calories ? (
                <span className="flex items-center gap-1">
                  <Flame size={12} className="text-orange-400" />
                  {item.calories} kcal
                </span>
              ) : null}
              {item.prepTimeMinutes ? (
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-blue-400" />
                  {item.prepTimeMinutes} min prep
                </span>
              ) : null}
            </div>
          </div>

          {/* Price & Action */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-base font-extrabold text-[#D4AF37]">
              {item.price} {item.currency || 'ETB'}
            </span>

            {isOutOfStock ? (
              <span className="text-[11px] font-bold text-red-400/90 bg-red-950/40 border border-red-500/20 px-2.5 py-1 rounded-lg">
                Unavailable
              </span>
            ) : (
              <button
                onClick={() => onAddToCart(item)}
                className="bg-[#6B1D1D] hover:bg-[#852323] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold border border-[#D4AF37]/30 flex items-center gap-1.5 transition-colors active:scale-95 shadow-md cursor-pointer"
              >
                <ShoppingBag size={13} />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
};
