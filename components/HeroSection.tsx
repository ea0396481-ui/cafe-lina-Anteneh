import React from 'react';
import { Coffee, Award, Calendar, ArrowRight, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface HeroSectionProps {
  onExploreMenu: () => void;
  onReserveTable: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreMenu,
  onReserveTable,
}) => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#1A0A0A] text-white py-16">
      {/* Background Image Overlay with dark vignette */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105 transform transition-transform duration-10000 hover:scale-100"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1920&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1E1A1A] via-[#1A0A0A]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1A0A0A]/90 via-transparent to-[#1A0A0A]/90" />

      {/* Decorative Gold Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-[#6B1D1D]/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 flex flex-col items-center">
        {/* Brand Badge */}
        <div className="mb-6 inline-flex items-center gap-2 bg-[#6B1D1D]/80 border border-[#D4AF37]/40 backdrop-blur-md px-4 py-1.5 rounded-full text-xs text-[#D4AF37] font-semibold tracking-widest uppercase shadow-lg">
          <Sparkles size={14} className="animate-spin text-[#D4AF37]" style={{ animationDuration: '6s' }} />
          <span>Addis Ababa's Premier Specialty Coffee & Bakery</span>
        </div>

        {/* Central Logo Display */}
        <div className="mb-8 scale-110">
          <BrandLogo size="xl" variant="light" showSubtitle={true} />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-white mb-6 leading-tight max-w-4xl drop-shadow-md">
          Good Coffee <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F8F3EA] via-[#D4AF37] to-[#F8F3EA]">
            Great Moments
          </span>
        </h1>

        {/* Description */}
        <p className="text-base sm:text-xl text-[#F8F3EA]/90 max-w-2xl font-light mb-10 leading-relaxed">
          Enjoy premium single-origin Ethiopian Yirgacheffe & Sidamo coffee, freshly baked artisan goodies, and delightful gourmet breakfast in a luxury atmosphere.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-14">
          <button
            onClick={onExploreMenu}
            className="group bg-[#6B1D1D] hover:bg-[#4A1212] text-[#F8F3EA] px-8 py-4 rounded-xl font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-3 transition-all duration-300 shadow-xl border border-[#D4AF37]/30 hover:border-[#D4AF37] active:scale-95"
          >
            <Coffee size={18} className="text-[#D4AF37]" />
            <span>VIEW MENU</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onReserveTable}
            className="group bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/30 px-8 py-4 rounded-xl font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 hover:border-[#D4AF37]"
          >
            <Calendar size={18} className="text-[#D4AF37]" />
            <span>RESERVE A TABLE</span>
          </button>
        </div>

        {/* Highlights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl glass-panel-dark p-6 rounded-2xl border border-[#D4AF37]/20">
          <div className="flex items-center gap-3 text-left p-2">
            <div className="w-10 h-10 rounded-full bg-[#6B1D1D]/60 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Award size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Organic</h4>
              <p className="text-xs text-gray-400">Single-origin beans</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-left p-2">
            <div className="w-10 h-10 rounded-full bg-[#6B1D1D]/60 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Coffee size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Master Roasters</h4>
              <p className="text-xs text-gray-400">In-house small batch</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-left p-2">
            <div className="w-10 h-10 rounded-full bg-[#6B1D1D]/60 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Daily 6AM - 11PM</h4>
              <p className="text-xs text-gray-400">Fresh breakfast & dine</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-left p-2">
            <div className="w-10 h-10 rounded-full bg-[#6B1D1D]/60 flex items-center justify-center text-[#D4AF37] shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Fast Delivery</h4>
              <p className="text-xs text-gray-400">25 min order delivery</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
