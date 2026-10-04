import React, { useState } from 'react';
import { OrderItem } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Check, Truck, Store } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: OrderItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onProceedToCheckout: () => void;
  couponCode: string;
  setCouponCode: (code: string) => void;
  discountAmount: number;
  deliveryType: 'Delivery' | 'Pickup';
  setDeliveryType: (type: 'Delivery' | 'Pickup') => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  couponCode,
  setCouponCode,
  discountAmount,
  deliveryType,
  setDeliveryType,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const deliveryFee = deliveryType === 'Delivery' ? 50 : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleApplyCoupon = () => {
    if (couponInput.trim().toUpperCase() === 'LINA10') {
      setCouponCode('LINA10');
      setAppliedSuccess(true);
    } else {
      alert('Invalid coupon code. Try using "LINA10" for 10% off!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-[#181818] text-[#FDF5E6] h-full shadow-2xl flex flex-col justify-between border-l border-[#D4AF37]/20 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#6B1D1D] border border-[#D4AF37]/30 text-white flex items-center justify-center font-bold">
              <ShoppingBag size={16} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#FDF5E6]">Your Cart</h2>
              <p className="text-xs text-[#A8A095]">{cartItems.length} item(s) selected</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#A8A095] hover:text-white rounded-full hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Delivery / Pickup Toggle */}
        <div className="p-4 bg-[#121212] border-b border-white/10">
          <div className="grid grid-cols-2 gap-2 bg-[#222222] p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setDeliveryType('Delivery')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                deliveryType === 'Delivery'
                  ? 'bg-[#6B1D1D] text-white border border-[#D4AF37]/30 shadow-xs'
                  : 'text-[#A8A095] hover:text-white'
              }`}
            >
              <Truck size={14} />
              <span>Delivery (+50 ETB)</span>
            </button>

            <button
              onClick={() => setDeliveryType('Pickup')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                deliveryType === 'Pickup'
                  ? 'bg-[#6B1D1D] text-white border border-[#D4AF37]/30 shadow-xs'
                  : 'text-[#A8A095] hover:text-white'
              }`}
            >
              <Store size={14} />
              <span>Store Pickup (Free)</span>
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 text-[#A8A095] flex flex-col items-center">
              <ShoppingBag size={48} className="stroke-1 mb-3 text-[#A8A095]/50" />
              <p className="font-semibold text-[#FDF5E6]">Your shopping cart is empty</p>
              <p className="text-xs text-[#A8A095] mt-1 max-w-xs">
                Explore our menu and add your favorite specialty coffee, fresh bakery or breakfast delights.
              </p>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div
                key={`${item.menuItem.id}-${index}`}
                className="bg-[#222222] p-3.5 rounded-2xl border border-white/10 shadow-sm flex gap-3 items-center"
              >
                <img
                  src={item.menuItem.image}
                  alt={item.menuItem.name}
                  className="w-16 h-16 object-cover rounded-xl shrink-0 border border-white/5"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-[#FDF5E6] truncate">{item.menuItem.name}</h4>
                  <p className="text-xs text-[#D4AF37] font-extrabold">
                    {item.menuItem.price} {item.menuItem.currency}
                  </p>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <p className="text-[10px] text-[#A8A095] truncate">
                      {item.selectedOptions.join(', ')}
                    </p>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                    className="w-6 h-6 rounded-md bg-white/10 text-white font-bold hover:bg-white/20 text-xs flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-[#FDF5E6] w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    className="w-6 h-6 rounded-md bg-[#6B1D1D] text-white font-bold hover:bg-[#4A1212] text-xs flex items-center justify-center"
                  >
                    +
                  </button>

                  <button
                    onClick={() => onRemoveItem(index)}
                    className="p-1 text-[#A8A095] hover:text-red-400 ml-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cartItems.length > 0 && (
          <div className="p-5 bg-[#121212] border-t border-white/10 space-y-3">
            {/* Coupon Promo */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code (e.g. LINA10)"
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] placeholder-[#A8A095] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] uppercase"
                />
                <Tag size={12} className="absolute right-3 top-3 text-[#A8A095]" />
              </div>

              <button
                onClick={handleApplyCoupon}
                className="bg-[#6B1D1D] hover:bg-[#4A1212] border border-[#D4AF37]/30 text-white text-xs font-bold px-4 rounded-xl transition-colors"
              >
                Apply
              </button>
            </div>

            {appliedSuccess && (
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check size={12} /> Coupon 'LINA10' Applied (-10% off)
              </p>
            )}

            {/* Calculations */}
            <div className="space-y-1.5 text-xs text-[#A8A095] pt-2 border-t border-white/10">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#FDF5E6]">{subtotal} ETB</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Discount</span>
                  <span>-{discountAmount} ETB</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-[#FDF5E6]">{deliveryFee} ETB</span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-[#D4AF37] pt-2 border-t border-white/10">
                <span>Total Amount</span>
                <span>{finalTotal} ETB</span>
              </div>
            </div>

            {/* Proceed CTA */}
            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full bg-[#6B1D1D] hover:bg-[#4A1212] text-white border border-[#D4AF37]/30 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
