import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { MenuItem } from '../types';
import { Star, PhoneCall, MapPin, Globe, Mail, Clock, ShieldCheck, Flame, QrCode } from 'lucide-react';

interface MenuPrintTemplateProps {
  id?: string;
  menuItems: MenuItem[];
  restaurantName?: string;
  phone?: string;
  address?: string;
  website?: string;
  email?: string;
}

interface CategoryGroup {
  id: string;
  title: string;
  subtitle: string;
  items: MenuItem[];
}

export const MenuPrintTemplate: React.FC<MenuPrintTemplateProps> = ({
  id,
  menuItems,
  restaurantName = 'Cafe Lina Luxury Coffee & Restaurant',
  phone = '+251 900 123 456',
  address = 'Bole Road, Addis Ababa, Ethiopia',
  website = 'www.cafelina.com',
  email = 'info@cafelina.com',
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const [demoQrUrl, setDemoQrUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL('https://cafelina.com/menu', {
      width: 240,
      margin: 1,
      color: {
        dark: '#1e1e1e',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setDemoQrUrl(url))
      .catch((err) => console.error('Demo QR generation error:', err));
  }, []);

  // Group items by menu category groups
  const specials = menuItems.filter((i) => i.isSpecial || i.isFeatured);

  // Define canonical restaurant groups
  const groupDefinitions: { id: string; title: string; subtitle: string; match: (item: MenuItem) => boolean }[] = [
    {
      id: 'coffee',
      title: 'Artisan Coffee & Espresso Bar',
      subtitle: 'Single-origin Ethiopian Yirgacheffe & Sidama roasts, manual pour-overs & microfoam lattes',
      match: (i) =>
        ['coffee', 'espresso', 'latte', 'cappuccino', 'mocha', 'macchiato', 'americano'].includes(
          i.category?.toLowerCase() || ''
        ),
    },
    {
      id: 'breakfast',
      title: 'Morning Breakfast & Artisan Bakery',
      subtitle: 'Freshly baked sourdough toasts, French croissants & wholesome breakfast bowls',
      match: (i) =>
        ['breakfast', 'bakery', 'sandwich'].includes(i.category?.toLowerCase() || '') &&
        !['cake', 'dessert', 'coffee', 'espresso', 'latte', 'cappuccino', 'mocha', 'macchiato', 'americano'].includes(
          i.category?.toLowerCase() || ''
        ),
    },
    {
      id: 'mains',
      title: 'Chef’s Entrées & Prime Steaks',
      subtitle: 'Grilled prime tenderloin, herb-marinated poultry & wild seafood specialties',
      match: (i) => ['main course', 'steak', 'grill', 'entree'].includes(i.category?.toLowerCase() || ''),
    },
    {
      id: 'pizza-burger',
      title: 'Artisan Pizzas & Gourmet Burgers',
      subtitle: 'Stone-baked thin crust pizza & hand-crafted Wagyu burgers on toasted brioche',
      match: (i) => ['pizza', 'burger'].includes(i.category?.toLowerCase() || ''),
    },
    {
      id: 'pasta-salad',
      title: 'Handmade Pastas & Crisp Salads',
      subtitle: 'Fresh egg fettuccine, slow-simmered sauces & garden-fresh organic greens',
      match: (i) => ['pasta', 'salad'].includes(i.category?.toLowerCase() || ''),
    },
    {
      id: 'desserts',
      title: 'Belgian Pastries, Cakes & Sweets',
      subtitle: 'Dark Belgian chocolate cakes, NY cheesecakes & warm molten lava tortes',
      match: (i) => ['cake', 'dessert'].includes(i.category?.toLowerCase() || ''),
    },
    {
      id: 'drinks',
      title: 'Artisan Mocktails, Juices & Refreshments',
      subtitle: 'Cold-pressed tropical juices, herbal infusions & effervescent mocktails',
      match: (i) => ['drinks', 'fresh juice', 'juice', 'soft drink', 'tea'].includes(i.category?.toLowerCase() || ''),
    },
  ];

  // Organize items into defined groups
  const categorizedGroups: CategoryGroup[] = [];
  const assignedItemIds = new Set<string>();

  groupDefinitions.forEach((def) => {
    const matched = menuItems.filter((i) => def.match(i));
    if (matched.length > 0) {
      matched.forEach((m) => assignedItemIds.add(m.id));
      categorizedGroups.push({
        id: def.id,
        title: def.title,
        subtitle: def.subtitle,
        items: matched,
      });
    }
  });

  // Collect any remaining items into an "Other Specialties" group
  const remaining = menuItems.filter((i) => !assignedItemIds.has(i.id));
  if (remaining.length > 0) {
    categorizedGroups.push({
      id: 'other',
      title: 'House Specialties & Extras',
      subtitle: 'Distinctive culinary creations and seasonal offerings',
      items: remaining,
    });
  }

  // Split into Pages for A4 printing and PDF:
  // Page 1: Grand Header + Chef's Specials (up to 4) + Coffee Bar + Breakfast
  // Page 2: Mains + Pizza & Burgers + Pastas & Salads
  // Page 3: Desserts + Drinks + Other + Grand Footer
  // If total groups is small, pack onto 2 pages; if larger, 3 pages.
  const page1Groups = categorizedGroups.filter((g) => ['coffee', 'breakfast'].includes(g.id));
  const page2Groups = categorizedGroups.filter((g) => ['mains', 'pizza-burger', 'pasta-salad'].includes(g.id));
  const page3Groups = categorizedGroups.filter(
    (g) => !['coffee', 'breakfast', 'mains', 'pizza-burger', 'pasta-salad'].includes(g.id)
  );

  const pages = [
    {
      pageNumber: 1,
      isCover: true,
      specials: specials.slice(0, 4),
      groups: page1Groups.length > 0 ? page1Groups : categorizedGroups.slice(0, 2),
    },
    {
      pageNumber: 2,
      isCover: false,
      groups: page2Groups.length > 0 ? page2Groups : categorizedGroups.slice(2, 4),
    },
    {
      pageNumber: 3,
      isCover: false,
      isLast: true,
      groups: page3Groups.length > 0 ? page3Groups : categorizedGroups.slice(4),
    },
  ].filter((p) => (p.groups && p.groups.length > 0) || (p.specials && p.specials.length > 0));

  const totalPages = pages.length;

  return (
    <div
      id={id || 'cafelina-printable-menu-target'}
      className="menu-print-container font-serif text-[#1e1e1e] bg-[#fbf9f5] select-none"
    >
      {pages.map((page, pageIdx) => (
        <div
          key={`print-page-${pageIdx}`}
          data-menu-page="true"
          className="pdf-page print-page-container w-[794px] min-h-[1123px] max-h-[1123px] mx-auto bg-[#FFFDF9] relative p-9 flex flex-col justify-between shadow-2xl mb-12 border border-[#D4AF37]/30 overflow-hidden box-border"
          style={{ width: '794px', height: '1123px' }}
        >
          {/* Subtle Luxury Corner Ornaments */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37]/60 pointer-events-none" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37]/60 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37]/60 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37]/60 pointer-events-none" />

          {/* Thin Inner Border Frame */}
          <div className="absolute inset-5 border border-[#D4AF37]/25 pointer-events-none" />

          {/* Main Page Content */}
          <div className="relative z-10 flex-1 flex flex-col">
            {/* Header (Different for Cover vs Secondary Pages) */}
            {page.isCover ? (
              <div className="text-center pb-4 mb-4 border-b-2 border-[#D4AF37]/40">
                {/* Royal Seal SVG */}
                <div className="flex justify-center mb-2">
                  <div className="w-14 h-14 rounded-full border-2 border-[#D4AF37] flex items-center justify-center p-1 bg-[#FFFDF9] shadow-sm">
                    <div className="w-full h-full rounded-full border border-dashed border-[#6B1D1D] flex items-center justify-center flex-col">
                      <span className="text-[9px] font-bold text-[#6B1D1D] tracking-widest uppercase">LINA</span>
                      <span className="text-[6px] tracking-widest text-[#D4AF37] uppercase font-sans">EST. 2026</span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-sans font-bold tracking-[0.3em] text-[#6B1D1D] block mb-0.5">
                  Artisan Coffee Roastery • Bakery • Fine Dining
                </span>
                <h1 className="text-3xl font-bold tracking-wider text-[#1e1e1e] font-serif uppercase">
                  {restaurantName}
                </h1>
                <div className="flex items-center justify-center gap-4 text-[10px] font-sans text-gray-600 mt-1">
                  <span>{address}</span>
                  <span>•</span>
                  <span>{phone}</span>
                  <span>•</span>
                  <span>VAT Inclusive</span>
                </div>

                {/* Demo QR Code Banner on Cover Page */}
                <div className="mt-2.5 inline-flex items-center gap-3 bg-[#FFFDF9] border border-[#D4AF37]/60 px-3.5 py-1.5 rounded-xl shadow-xs">
                  {demoQrUrl ? (
                    <img
                      src={demoQrUrl}
                      alt="Demo Menu QR Code"
                      className="w-11 h-11 object-contain rounded border border-[#D4AF37]/30 bg-white p-0.5"
                    />
                  ) : (
                    <div className="w-11 h-11 bg-white rounded border border-[#D4AF37]/30 flex items-center justify-center">
                      <QrCode size={18} className="text-[#6B1D1D]" />
                    </div>
                  )}
                  <div className="text-left">
                    <span className="text-[8px] font-sans font-extrabold uppercase tracking-widest text-[#6B1D1D] bg-[#D4AF37]/20 px-2 py-0.5 rounded-full border border-[#D4AF37]/40 inline-flex items-center gap-1">
                      <QrCode size={9} />
                      <span>Demo QR Code</span>
                    </span>
                    <span className="block text-[10px] font-serif font-bold text-gray-900 leading-tight mt-0.5">
                      Scan for Digital Mobile Menu & Table Ordering
                    </span>
                    <span className="text-[8px] font-sans text-gray-500">
                      Point phone camera to view live menu online • cafelina.com/menu
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D4AF37]/40 text-xs font-sans">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border border-[#D4AF37] flex items-center justify-center text-[8px] font-serif font-bold text-[#6B1D1D]">
                    CL
                  </div>
                  <span className="font-serif font-bold text-[#6B1D1D] tracking-wider uppercase text-sm">
                    CAFE LINA
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600 text-[11px] font-serif italic">Artisan Culinary Menu</span>
                </div>
                <div className="text-right text-[10px] text-gray-500 font-sans">
                  <span>{address.split(',')[0]}</span>
                  <span className="mx-2">•</span>
                  <span>{phone}</span>
                </div>
              </div>
            )}

            {/* Chef's Specials Banner (If on page 1) */}
            {page.specials && page.specials.length > 0 && (
              <div className="mb-4 bg-gradient-to-r from-[#6B1D1D]/5 via-[#D4AF37]/10 to-[#6B1D1D]/5 p-3 rounded-lg border border-[#D4AF37]/40 avoid-break-inside">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#D4AF37]/30">
                  <div className="flex items-center gap-1.5">
                    <Star size={12} className="text-[#D4AF37] fill-[#D4AF37]" />
                    <h3 className="font-serif font-bold text-xs uppercase tracking-widest text-[#6B1D1D]">
                      Chef’s Signatures & Highlights
                    </h3>
                  </div>
                  <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#D4AF37] bg-[#6B1D1D] text-white px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {page.specials.map((item) => (
                    <div key={`special-${item.id}`} className="flex gap-2.5 items-start">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-md border border-[#D4AF37]/30 shrink-0"
                          crossOrigin="anonymous"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <h4 className="font-serif font-bold text-xs text-gray-900 truncate">{item.name}</h4>
                          <span className="text-xs font-bold text-[#6B1D1D] whitespace-nowrap">
                            {item.price} {item.currency || 'ETB'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-600 line-clamp-1 italic font-sans leading-tight">
                          {item.description}
                        </p>
                        {item.isAvailable === false && (
                          <span className="text-[8px] font-sans font-bold text-red-600 uppercase">
                            [Out of Stock]
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Groups on this page */}
            <div className="space-y-4 flex-1">
              {page.groups.map((group) => (
                <div key={group.id} className="avoid-break-inside">
                  {/* Category Section Header */}
                  <div className="mb-2 pb-1 border-b border-gray-200 flex items-baseline justify-between category-print-header">
                    <div>
                      <h3 className="font-serif font-bold text-sm tracking-wide text-[#6B1D1D] uppercase">
                        {group.title}
                      </h3>
                      <p className="text-[9px] font-sans text-gray-500 italic">{group.subtitle}</p>
                    </div>
                    <span className="text-[9px] font-sans font-medium text-gray-400">
                      {group.items.length} {group.items.length === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>

                  {/* Items in a 2-Column Grid */}
                  <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex gap-2 items-start avoid-break-inside pb-1.5 border-b border-gray-100">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded border border-gray-200 shrink-0"
                            crossOrigin="anonymous"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between">
                            <h4 className="font-serif font-bold text-[11px] text-gray-900 truncate">
                              {item.name}
                            </h4>
                            <div className="text-right pl-1 shrink-0">
                              <span className="font-sans font-bold text-[11px] text-[#6B1D1D]">
                                {item.price} <span className="text-[9px] text-gray-500">{item.currency || 'ETB'}</span>
                              </span>
                            </div>
                          </div>

                          <p className="text-[9px] font-sans text-gray-600 line-clamp-1 leading-snug">
                            {item.description}
                          </p>

                          <div className="flex items-center justify-between text-[8px] font-sans text-gray-400 mt-0.5">
                            {item.ingredients && item.ingredients.length > 0 ? (
                              <span className="truncate max-w-[140px]">
                                {item.ingredients.slice(0, 3).join(', ')}
                              </span>
                            ) : (
                              <span>Artisan craft</span>
                            )}

                            {item.isAvailable === false ? (
                              <span className="font-bold text-red-600 bg-red-50 px-1 rounded">
                                Out of Stock
                              </span>
                            ) : (
                              <span>{item.prepTimeMinutes ? `${item.prepTimeMinutes}m` : ''}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Last Page Grand Footer */}
            {page.isLast && (
              <div className="mt-4 pt-3 border-t-2 border-[#D4AF37]/40 bg-gradient-to-t from-[#6B1D1D]/5 to-transparent p-3 rounded-lg text-center avoid-break-inside">
                <p className="font-serif font-bold text-sm text-[#6B1D1D] uppercase tracking-wider mb-1">
                  Thank You for Dining with Us at Cafe Lina
                </p>
                <p className="text-[10px] font-sans text-gray-600 max-w-lg mx-auto mb-2 italic">
                  "Every cup of coffee tells a story of Ethiopian heritage. Every pastry is hand-rolled with devotion."
                </p>

                <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-200 text-left">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[9px] font-sans text-gray-700 flex-1">
                    <div className="flex items-center gap-1.5">
                      <PhoneCall size={10} className="text-[#6B1D1D] shrink-0" />
                      <span>{phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={10} className="text-[#6B1D1D] shrink-0" />
                      <span className="truncate">{address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail size={10} className="text-[#6B1D1D] shrink-0" />
                      <span>{email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe size={10} className="text-[#6B1D1D] shrink-0" />
                      <span className="font-semibold text-[#6B1D1D]">{website}</span>
                    </div>
                  </div>

                  {/* Demo QR Box in Grand Footer */}
                  <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#D4AF37]/60 p-1.5 rounded-lg shrink-0 shadow-xs">
                    {demoQrUrl ? (
                      <img
                        src={demoQrUrl}
                        alt="Menu QR"
                        className="w-12 h-12 object-contain bg-white rounded p-0.5 border border-[#D4AF37]/30"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white flex items-center justify-center rounded border border-[#D4AF37]/30">
                        <QrCode size={20} className="text-[#6B1D1D]" />
                      </div>
                    )}
                    <div className="text-left text-[8px] font-sans">
                      <span className="font-bold text-[#6B1D1D] block uppercase">Demo QR Code</span>
                      <span className="text-gray-600 block">Scan to Order</span>
                      <span className="text-[7px] text-[#D4AF37] font-semibold">Table & Delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Page Bottom Minimal Running Bar */}
          <div className="relative z-10 pt-2 border-t border-gray-200 flex items-center justify-between text-[9px] font-sans text-gray-500">
            <span>Cafe Lina Restaurant & Coffee Menu • Valid as of {currentDate}</span>
            <span className="font-serif font-bold text-[#6B1D1D]">
              Page {pageIdx + 1} of {totalPages}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
