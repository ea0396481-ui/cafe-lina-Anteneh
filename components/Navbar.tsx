import React, { useState } from 'react';
import { ShoppingBag, User, Shield, Menu as MenuIcon, X, Calendar, PhoneCall, Sparkles } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { UserRole, SystemUser } from '../types';
import { SyncStatusBadge } from './SyncStatusBadge';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  setIsCartOpen: (open: boolean) => void;
  setIsAuthModalOpen: (open: boolean, targetRole?: UserRole) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  isERPView: boolean;
  setIsERPView: (erp: boolean) => void;
  loggedInUser?: SystemUser | null;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  setIsCartOpen,
  setIsAuthModalOpen,
  currentUserRole,
  setCurrentUserRole,
  isERPView,
  setIsERPView,
  loggedInUser,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const navLinks = [
    { id: 'home', label: 'HOME' },
    { id: 'menu', label: 'MENU' },
    { id: 'qr', label: 'QR GENERATOR' },
    { id: 'about', label: 'ABOUT' },
    { id: 'gallery', label: 'GALLERY' },
    { id: 'blog', label: 'BLOG' },
    { id: 'careers', label: 'CAREERS' },
    { id: 'contact', label: 'CONTACT' },
  ];

  const roles: UserRole[] = ['Customer', 'Admin', 'Manager', 'Cashier', 'Kitchen'];

  const handleRoleSelect = (r: UserRole) => {
    setShowRoleMenu(false);
    if (r === 'Customer') {
      setCurrentUserRole('Customer');
      setIsERPView(false);
      if (onSignOut) onSignOut();
    } else {
      // Require username & password login for staff roles!
      setIsAuthModalOpen(true, r);
    }
  };

  const handleERPToggle = () => {
    if (isERPView) {
      setIsERPView(false);
    } else {
      if (currentUserRole !== 'Customer' && loggedInUser) {
        setIsERPView(true);
      } else {
        setIsAuthModalOpen(true, 'Admin');
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-[#D4AF37]/20 shadow-md">
      {/* Top Banner Bar */}
      <div className="bg-[#6B1D1D] text-white py-1.5 px-2.5 sm:px-4 text-xs border-b border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1.5 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-6 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 font-light">
              <PhoneCall size={12} className="text-[#D4AF37]" />
              <span className="text-[#FDF5E6]">+251 900 123 456</span>
            </span>
            <span className="hidden sm:inline text-white/40">|</span>
            <span className="hidden sm:inline text-[#FDF5E6]/90">
              📍 Bole Road, Addis Ababa, Ethiopia
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Real-time Offline & Sync Status Badge */}
            <SyncStatusBadge variant="navbar" />

            {/* Quick Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 bg-[#181818] hover:bg-[#222222] text-[#D4AF37] px-2.5 py-1 rounded-full text-[11px] font-medium border border-[#D4AF37]/30 transition-colors min-h-[36px]"
              >
                <Shield size={11} />
                <span>Role: {currentUserRole}</span>
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#181818] border border-[#D4AF37]/30 rounded-xl shadow-2xl py-1 z-50">
                  <div className="px-3 py-1.5 text-[10px] text-[#D4AF37] font-semibold border-b border-white/10 uppercase tracking-wider">
                    Switch Mode / Access
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSelect(r)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between min-h-[40px] ${
                        currentUserRole === r
                          ? 'bg-[#6B1D1D] text-white font-medium'
                          : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{r} View</span>
                      {currentUserRole === r && <span className="text-[#D4AF37]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logged In User Indicator or ERP Toggle button */}
            {loggedInUser && currentUserRole !== 'Customer' && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#D4AF37] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-semibold">{loggedInUser.fullName}</span>
              </div>
            )}

            <button
              onClick={handleERPToggle}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all min-h-[36px] ${
                isERPView
                  ? 'bg-[#D4AF37] text-[#0f0f0f] font-bold shadow-xs'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
              }`}
            >
              <Sparkles size={11} />
              <span>{isERPView ? 'Exit ERP' : 'Admin ERP'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <div onClick={() => { setActiveTab('home'); setIsERPView(false); }} className="cursor-pointer">
          <BrandLogo size="md" variant="light" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setIsERPView(false);
              }}
              className={`text-xs font-semibold tracking-wider transition-colors py-1 relative uppercase ${
                activeTab === link.id && !isERPView
                  ? 'text-[#D4AF37]'
                  : 'text-[#FDF5E6]/80 hover:text-[#D4AF37]'
              }`}
            >
              {link.label}
              {activeTab === link.id && !isERPView && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] rounded-full shadow-[0_0_8px_#D4AF37]" />
              )}
            </button>
          ))}
        </nav>

        {/* Right CTA Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Reserve Table Button */}
          <button
            onClick={() => {
              setActiveTab('reservations');
              setIsERPView(false);
            }}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:text-white px-3.5 py-2.5 rounded-xl border border-[#D4AF37]/40 hover:border-[#D4AF37] bg-[#181818] transition-all min-h-[44px]"
          >
            <Calendar size={14} />
            <span>RESERVE TABLE</span>
          </button>

          {/* Order Now Primary CTA */}
          <button
            onClick={() => {
              setActiveTab('menu');
              setIsERPView(false);
            }}
            className="bg-[#6B1D1D] hover:bg-[#4A1212] text-[#FDF5E6] border border-[#D4AF37]/30 hover:border-[#D4AF37] px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95 uppercase min-h-[44px] flex items-center justify-center"
          >
            ORDER NOW
          </button>

          {/* Cart Icon with Live Badge */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl bg-[#181818] border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#6B1D1D] hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="View Shopping Cart"
            aria-label="View Shopping Cart"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#6B1D1D] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0f0f0f] shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account / Profile */}
          <button
            onClick={() => {
              if (currentUserRole === 'Customer') {
                setActiveTab('customer');
                setIsERPView(false);
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className="p-2.5 rounded-xl text-[#FDF5E6]/80 hover:text-[#D4AF37] hover:bg-[#181818] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="User Profile & Account"
            aria-label="User Profile & Account"
          >
            <User size={20} />
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl text-[#D4AF37] hover:bg-[#181818] min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#181818] border-b border-[#D4AF37]/20 px-4 pt-2 pb-6 space-y-3 shadow-2xl">
          <div className="flex flex-col space-y-2 pt-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  setIsERPView(false);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 text-sm font-semibold rounded-lg ${
                  activeTab === link.id && !isERPView
                    ? 'bg-[#6B1D1D] text-white border border-[#D4AF37]/30'
                    : 'text-[#FDF5E6] hover:bg-white/10'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => {
                setActiveTab('reservations');
                setIsERPView(false);
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-semibold rounded-lg text-[#D4AF37] hover:bg-white/10 flex items-center gap-2"
            >
              <Calendar size={16} />
              <span>Reservations</span>
            </button>
            <button
              onClick={() => {
                setIsERPView(!isERPView);
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-bold rounded-lg bg-[#D4AF37] text-[#0f0f0f] flex items-center gap-2"
            >
              <Sparkles size={16} />
              <span>Admin & ERP Management</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
