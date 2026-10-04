import React, { useState } from 'react';
import { Customer, Order, MenuItem } from '../types';
import { User, Award, Heart, ShoppingBag, MapPin, Bell, LogOut, ExternalLink, ChevronRight } from 'lucide-react';

interface CustomerPortalProps {
  customer: Customer;
  orders: Order[];
  wishlistItems: MenuItem[];
  onRemoveWishlist: (id: string) => void;
  onAddToCart: (item: MenuItem) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customer,
  orders,
  wishlistItems,
  onRemoveWishlist,
  onAddToCart,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist' | 'notifications'>('profile');

  return (
    <div className="py-12 bg-[#0f0f0f] text-[#FDF5E6] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Top Banner */}
        <div className="bg-[#181818] text-[#FDF5E6] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-[#6B1D1D] border-2 border-[#D4AF37] flex items-center justify-center text-3xl font-bold font-serif text-[#D4AF37]">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-serif font-bold text-[#FDF5E6]">{customer.name}</h1>
                <span className="bg-[#D4AF37] text-black text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {customer.tier} Member
                </span>
              </div>
              <p className="text-xs text-[#A8A095] mt-1">{customer.email} • {customer.phone}</p>
              <p className="text-xs text-[#A8A095]">Member since {customer.joinedDate}</p>
            </div>
          </div>

          {/* Reward Points Box */}
          <div className="bg-[#6B1D1D]/60 border border-[#D4AF37]/40 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37] text-black flex items-center justify-center font-bold">
              <Award size={24} />
            </div>
            <div>
              <span className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest block">
                Cafe Lina Rewards
              </span>
              <span className="text-2xl font-extrabold text-[#FDF5E6]">{customer.rewardPoints} PTS</span>
              <p className="text-[10px] text-[#A8A095]">Free coffee reward at 1,500 PTS</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-white/10 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'profile', label: 'Profile Details', icon: User },
            { id: 'orders', label: `Order History (${orders.length})`, icon: ShoppingBag },
            { id: 'wishlist', label: `Wishlist (${wishlistItems.length})`, icon: Heart },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#6B1D1D] text-white border border-[#D4AF37]/30 shadow-md'
                    : 'bg-[#181818] text-[#A8A095] border border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-[#181818] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
            <h2 className="text-lg font-serif font-bold text-[#FDF5E6] border-b border-white/10 pb-3">
              Personal Information & Saved Address
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <label className="text-[#D4AF37] block mb-1 font-bold uppercase">Full Name</label>
                <input
                  type="text"
                  readOnly
                  value={customer.name}
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] rounded-xl p-3 font-semibold"
                />
              </div>

              <div>
                <label className="text-[#D4AF37] block mb-1 font-bold uppercase">Phone Number</label>
                <input
                  type="text"
                  readOnly
                  value={customer.phone}
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] rounded-xl p-3 font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[#D4AF37] block mb-1 font-bold uppercase">Delivery Address</label>
                <input
                  type="text"
                  readOnly
                  value={customer.address}
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] rounded-xl p-3 font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div key={ord.id} className="bg-[#181818] p-6 rounded-2xl border border-white/10 shadow-xl space-y-3 text-[#FDF5E6]">
                <div className="flex justify-between items-center border-b border-white/10 pb-3 text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#D4AF37] text-sm">{ord.id}</span>
                    <span className="text-[#A8A095] ml-2">
                      {new Date(ord.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="bg-amber-950/80 text-amber-300 border border-amber-500/30 font-bold px-3 py-1 rounded-full text-[10px] uppercase">
                    {ord.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-[#A8A095]">
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{it.quantity}x {it.menuItem.name}</span>
                      <span className="font-bold text-[#FDF5E6]">{it.quantity * it.menuItem.price} ETB</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-3 flex justify-between items-center text-xs">
                  <span className="font-extrabold text-sm text-[#D4AF37]">Total: {ord.total} ETB</span>
                  <span className="text-[#A8A095] text-[11px]">Payment: {ord.paymentMethod}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-[#181818] rounded-2xl overflow-hidden border border-white/10 p-4 space-y-3">
                <img src={item.image} alt={item.name} className="w-full h-36 object-cover rounded-xl border border-white/5" />
                <h3 className="font-bold text-sm text-[#FDF5E6]">{item.name}</h3>
                <p className="text-xs text-[#A8A095] line-clamp-2">{item.description}</p>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="font-bold text-[#D4AF37]">{item.price} ETB</span>
                  <button
                    onClick={() => onAddToCart(item)}
                    className="bg-[#6B1D1D] hover:bg-[#4A1212] text-white border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg text-xs font-bold"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-[#181818] rounded-3xl p-6 border border-white/10 space-y-3 text-xs">
            <div className="p-3 bg-[#222222] rounded-xl border border-[#D4AF37]/30">
              <span className="font-bold text-[#D4AF37] block">🌟 Gold Loyalty Tier Unlocked!</span>
              <p className="text-[#A8A095] mt-0.5">You earned 250 bonus reward points on your recent order ORD-1025.</p>
            </div>
            <div className="p-3 bg-[#222222] rounded-xl border border-white/10">
              <span className="font-bold text-[#FDF5E6] block">☕ Happy Hour Coffee Promo</span>
              <p className="text-[#A8A095] mt-0.5">Use code LINA10 to get 10% off any specialty coffee drink.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
