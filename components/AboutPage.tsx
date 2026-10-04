import React from 'react';
import { Award, Heart, Coffee, ShieldCheck, Sparkles } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const AboutPage: React.FC = () => {
  return (
    <div className="py-16 bg-[#0f0f0f] text-[#FDF5E6] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <BrandLogo size="lg" variant="light" />
          <h1 className="text-4xl font-serif font-bold text-[#FDF5E6]">Our Story & Craftsmanship</h1>
          <p className="text-sm text-[#A8A095] max-w-2xl mx-auto leading-relaxed">
            Founded in the heart of Addis Ababa, Cafe Lina was born out of a deep passion for honoring Ethiopia’s rich coffee heritage while crafting world-class culinary experiences.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-[#181818] p-8 rounded-3xl border border-white/10 shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80"
            alt="Coffee Roasting"
            className="rounded-2xl h-80 w-full object-cover shadow-md border border-white/5"
          />

          <div className="space-y-4 text-xs text-[#A8A095] leading-relaxed">
            <span className="text-[#D4AF37] font-bold uppercase tracking-widest text-[10px]">
              Single-Origin Specialty Roasting
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#FDF5E6]">From Ethiopian Highlands to Your Cup</h2>
            <p>
              Ethiopia is the birthplace of Arabica coffee. At Cafe Lina, we directly source Grade 1 specialty beans from micro-lot farmers in Yirgacheffe, Sidamo, and Guji.
            </p>
            <p>
              Our in-house master roasters roast every batch in small quantities to preserve the delicate floral aromas of jasmine, bergamot, and sweet stone fruit.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-[#181818] p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#6B1D1D] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center mx-auto font-bold">
              <Award size={24} />
            </div>
            <h3 className="font-serif font-bold text-base text-[#FDF5E6]">Grade 1 Arabica</h3>
            <p className="text-xs text-[#A8A095]">100% organic beans strictly inspected for perfection.</p>
          </div>

          <div className="bg-[#181818] p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#6B1D1D] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center mx-auto font-bold">
              <Heart size={24} />
            </div>
            <h3 className="font-serif font-bold text-base text-[#FDF5E6]">72-Hr Sourdough Bakery</h3>
            <p className="text-xs text-[#A8A095]">Slow-fermented French pastries baked fresh every morning.</p>
          </div>

          <div className="bg-[#181818] p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#6B1D1D] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center mx-auto font-bold">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-serif font-bold text-base text-[#FDF5E6]">EPR Eco Sustainability</h3>
            <p className="text-xs text-[#A8A095]">100% bio-compostable packaging & zero plastic initiative.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
