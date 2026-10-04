import React from 'react';
import { MenuItem } from '../types';
import { ShoppingBag, Star, Sparkles, Heart } from 'lucide-react';

interface TodaysSpecialsProps {
  specials: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  onQuickView: (item: MenuItem) => void;
  toggleWishlist: (itemId: string) => void;
  wishlistIds: string[];
}

export const TodaysSpecials: React.FC<TodaysSpecialsProps> = ({
  specials,
  onAddToCart,
  onQuickView,
  toggleWishlist,
  wishlistIds,
}) => {
  return (
    <section className="py-16 bg-[#0f0f0f] relative border-t border-[#D4AF37]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 text-[#D4AF37] font-semibold text-xs tracking-[0.2em] uppercase mb-2">
            <Sparkles size={14} />
            <span>CAFE LINA SELECTIONS</span>
            <Sparkles size={14} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#FDF5E6] tracking-tight mb-2">
            Our Specials
          </h2>
          <div className="w-12 h-0.5 bg-[#D4AF37] mx-auto mb-3" />
          <p className="text-sm text-[#A8A095] font-medium">
            Made with love, served with passion
          </p>
        </div>

        {/* Specials Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {specials.map((item) => {
            const isWishlisted = wishlistIds.includes(item.id);

            return (
              <div
                key={item.id}
                className="group bg-[#181818] rounded-2xl overflow-hidden shadow-lg border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 transition-all duration-300 flex flex-col transform hover:-translate-y-1"
              >
                {/* Image Container */}
                <div className="relative h-52 overflow-hidden bg-[#121212] cursor-pointer" onClick={() => onQuickView(item)}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent opacity-80" />

                  {/* Special Badge */}
                  <span className="absolute top-3 left-3 bg-[#6B1D1D] text-[#FDF5E6] border border-[#D4AF37]/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Chef's Special
                  </span>

                  {/* Wishlist Button */}
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
                  >
                    <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>

                  {/* Rating */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs text-white font-medium bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                    <Star size={12} className="text-[#D4AF37] fill-[#D4AF37]" />
                    <span>{item.rating} ({item.reviewsCount})</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => onQuickView(item)}
                      className="font-serif font-bold text-lg text-[#FDF5E6] hover:text-[#D4AF37] cursor-pointer transition-colors mb-1"
                    >
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#A8A095] line-clamp-2 leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-[#A8A095] block leading-none">Price</span>
                      <span className="text-lg font-extrabold text-[#D4AF37]">
                        {item.price} {item.currency}
                      </span>
                    </div>

                    <button
                      onClick={() => onAddToCart(item)}
                      className="bg-[#6B1D1D] hover:bg-[#4A1212] text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-[#D4AF37]/30 flex items-center gap-1.5 transition-colors active:scale-95 shadow-xs"
                    >
                      <ShoppingBag size={14} />
                      <span>ORDER</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
