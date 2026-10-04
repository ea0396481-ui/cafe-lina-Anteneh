import React from 'react';
import { BrandLogo } from './BrandLogo';
import { PhoneCall, Mail, MapPin, Instagram, Facebook, Twitter, Heart } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  setIsERPView: (erp: boolean) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, setIsERPView }) => {
  return (
    <footer className="bg-[#0a0a0a] text-white border-t border-[#D4AF37]/20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 Brand */}
          <div className="space-y-4">
            <BrandLogo size="md" variant="light" showSubtitle={true} />
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              Addis Ababa’s premier destination for single-origin specialty Ethiopian coffee, 72-hour sourdough bakery, and luxury morning breakfasts.
            </p>
            <div className="flex gap-3 text-gray-400">
              <span className="p-2 bg-white/5 hover:bg-[#6B1D1D] rounded-full transition-colors cursor-pointer text-[#D4AF37]">
                <Instagram size={16} />
              </span>
              <span className="p-2 bg-white/5 hover:bg-[#6B1D1D] rounded-full transition-colors cursor-pointer text-[#D4AF37]">
                <Facebook size={16} />
              </span>
              <span className="p-2 bg-white/5 hover:bg-[#6B1D1D] rounded-full transition-colors cursor-pointer text-[#D4AF37]">
                <Twitter size={16} />
              </span>
            </div>
          </div>

          {/* Col 2 Links */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider text-[11px]">Explore Pages</h4>
            <ul className="space-y-2 text-gray-300 font-medium">
              <li>
                <button onClick={() => { setActiveTab('home'); setIsERPView(false); }} className="hover:text-white">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('menu'); setIsERPView(false); }} className="hover:text-white">
                  Menu & Categories
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('qr'); setIsERPView(false); }} className="hover:text-white flex items-center gap-1.5 text-[#D4AF37]">
                  <span>QR Code Generator</span>
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('about'); setIsERPView(false); }} className="hover:text-white">
                  About Our Roastery
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('gallery'); setIsERPView(false); }} className="hover:text-white">
                  Atmosphere Gallery
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('blog'); setIsERPView(false); }} className="hover:text-white">
                  Coffee Blog Journal
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('careers'); setIsERPView(false); }} className="hover:text-white">
                  Careers at Cafe Lina
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 Opening Hours & Legal */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider text-[11px]">Opening Hours & Legal</h4>
            <p className="text-gray-300">Mon - Sun: 06:00 AM - 11:00 PM</p>
            <p className="text-gray-400">Fresh breakfast served daily until 02:00 PM</p>
            <div className="pt-2 border-t border-white/10 space-y-1">
              <button onClick={() => setActiveTab('privacy')} className="block text-gray-400 hover:text-white">
                Privacy Policy
              </button>
              <button onClick={() => setActiveTab('terms')} className="block text-gray-400 hover:text-white">
                Terms & Conditions
              </button>
            </div>
          </div>

          {/* Col 4 Contact matching image footer */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider text-[11px]">Contact Us</h4>
            <p className="flex items-center gap-2 text-gray-300">
              <PhoneCall size={14} className="text-[#D4AF37]" /> +251 900 123 456
            </p>
            <p className="flex items-center gap-2 text-gray-300">
              <MapPin size={14} className="text-[#D4AF37]" /> Bole Road, Addis Ababa, Ethiopia
            </p>
            <p className="flex items-center gap-2 text-gray-300">
              <Mail size={14} className="text-[#D4AF37]" /> info@cafelina.com
            </p>
            <p className="text-[#D4AF37] font-bold text-[11px]">www.cafelina.com</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 text-center text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Cafe Lina Enterprise ERP System. All Rights Reserved.</p>
          <p className="flex items-center gap-1 text-[11px]">
            Crafted with <Heart size={12} className="text-[#6B1D1D] fill-[#6B1D1D]" /> for Specialty Coffee Lovers
          </p>
        </div>
      </div>
    </footer>
  );
};
