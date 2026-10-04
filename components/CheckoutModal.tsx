import React, { useState } from 'react';
import { OrderItem, PaymentMethod, DeliveryType, Order } from '../types';
import { X, CreditCard, DollarSign, Building2, CheckCircle2, Clock, Printer, ShieldCheck, MapPin, Truck, ChevronRight } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { ShareReceiptButton } from './ShareReceiptButton';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: OrderItem[];
  deliveryType: DeliveryType;
  discountAmount: number;
  couponCode: string;
  onOrderCompleted: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  deliveryType,
  discountAmount,
  couponCode,
  onOrderCompleted,
}) => {
  const [step, setStep] = useState<'checkout' | 'confirmation'>('checkout');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Stripe');
  const [customerName, setCustomerName] = useState('Tadesse Worku');
  const [customerEmail, setCustomerEmail] = useState('tadesse@example.com');
  const [customerPhone, setCustomerPhone] = useState('+251 911 234 567');
  const [deliveryAddress, setDeliveryAddress] = useState('Bole Atlas, Villa 12, Addis Ababa');
  const [bankRef, setBankRef] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const deliveryFee = deliveryType === 'Delivery' ? 50 : 0;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handlePlaceOrder = () => {
    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      customerEmail,
      customerPhone,
      deliveryType,
      deliveryAddress,
      items: cartItems,
      subtotal,
      discount: discountAmount,
      tax: Math.round(subtotal * 0.05),
      deliveryFee,
      total,
      currency: 'ETB',
      paymentMethod,
      paymentStatus: 'Paid',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      estimatedDeliveryMinutes: 25,
      couponCode,
    };

    setCreatedOrder(newOrder);
    onOrderCompleted(newOrder);
    setStep('confirmation');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#181818] text-[#FDF5E6] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative border border-[#D4AF37]/30 my-8">
        {/* Header */}
        <div className="bg-[#6B1D1D] text-white p-6 flex items-center justify-between border-b border-[#D4AF37]/30">
          <BrandLogo size="sm" variant="light" showSubtitle={true} />
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {step === 'checkout' ? (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-serif font-bold text-[#FDF5E6]">Checkout & Delivery Details</h2>

            {/* Delivery Info Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#D4AF37] uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#D4AF37] uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#D4AF37] uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {deliveryType === 'Delivery' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#D4AF37] uppercase mb-1">Delivery Address (Addis Ababa)</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Subcity, Woreda, Landmark e.g. Bole Atlas"
                    className="w-full bg-[#222222] border border-white/10 text-[#FDF5E6] placeholder-[#A8A095] rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
              )}
            </div>

            {/* Payment Options */}
            <div>
              <h3 className="text-xs font-bold uppercase text-[#D4AF37] tracking-wider mb-3">
                Select Payment Method
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'Stripe', label: 'Stripe / Credit Card', icon: CreditCard },
                  { id: 'PayPal', label: 'PayPal Instant', icon: DollarSign },
                  { id: 'Cash', label: 'Cash on Delivery', icon: ShieldCheck },
                  { id: 'Bank Transfer', label: 'Telebirr / CBE Birr', icon: Building2 },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;

                  return (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                      className={`p-3 rounded-2xl border flex items-center gap-3 text-xs font-bold transition-all text-left ${
                        isSelected
                          ? 'border-[#D4AF37] bg-[#6B1D1D]/40 text-[#D4AF37] shadow-xs'
                          : 'border-white/10 text-[#A8A095] hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} className={isSelected ? 'text-[#D4AF37]' : 'text-[#A8A095]'} />
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === 'Stripe' && (
                <div className="mt-3 p-3 bg-[#222222] rounded-xl border border-white/10 text-xs space-y-2">
                  <p className="text-[#A8A095] text-[11px]">Secure 256-bit SSL encrypted Stripe payment</p>
                  <input
                    type="text"
                    placeholder="Card Number: 4242 •••• •••• 4242"
                    defaultValue="4242 4242 4242 4242"
                    className="w-full bg-[#181818] border border-white/10 text-[#FDF5E6] rounded-lg p-2 text-xs"
                  />
                </div>
              )}

              {paymentMethod === 'Bank Transfer' && (
                <div className="mt-3 p-3 bg-[#222222] rounded-xl border border-[#D4AF37]/30 text-xs space-y-2">
                  <p className="font-bold text-[#D4AF37]">Telebirr / Commercial Bank of Ethiopia (CBE)</p>
                  <p className="text-[#A8A095] text-[11px]">CBE Account: 1000123456789 (Cafe Lina)</p>
                  <input
                    type="text"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    placeholder="Enter Transaction Ref Number (e.g. TXN-8923)"
                    className="w-full bg-[#181818] border border-white/10 text-[#FDF5E6] placeholder-[#A8A095] rounded-lg p-2 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Order Summary Box */}
            <div className="bg-[#121212] p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-[#A8A095]">
                <span>Subtotal ({cartItems.length} items)</span>
                <span className="text-[#FDF5E6] font-semibold">{subtotal} ETB</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Discount ({couponCode})</span>
                  <span>-{discountAmount} ETB</span>
                </div>
              )}
              <div className="flex justify-between text-[#A8A095]">
                <span>Delivery Charge</span>
                <span className="text-[#FDF5E6] font-semibold">{deliveryFee} ETB</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#D4AF37] pt-2 border-t border-white/10">
                <span>Grand Total</span>
                <span>{total} ETB</span>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              onClick={handlePlaceOrder}
              className="w-full bg-[#6B1D1D] hover:bg-[#4A1212] text-white border border-[#D4AF37]/30 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <span>CONFIRM ORDER ({total} ETB)</span>
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          /* Confirmation & Order Tracking Screen */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
                Order Received
              </span>
              <h2 className="text-3xl font-serif font-bold text-[#FDF5E6] mt-1">
                Thank You, {createdOrder?.customerName}!
              </h2>
              <p className="text-xs text-[#A8A095] mt-1">
                Order ID: <span className="font-mono font-bold text-[#D4AF37]">{createdOrder?.id}</span>
              </p>
            </div>

            {/* Order Progress Stepper */}
            <div className="bg-[#121212] p-6 rounded-2xl border border-white/10">
              <h4 className="text-xs font-bold text-[#D4AF37] uppercase mb-4 tracking-wider flex items-center justify-center gap-2">
                <Clock size={16} className="text-[#D4AF37]" />
                Live Order Tracking (Estimated Delivery: 25 Mins)
              </h4>

              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#6B1D1D] text-white flex items-center justify-center mb-1">
                    ✓
                  </div>
                  <span className="text-[#D4AF37]">Order Placed</span>
                </div>

                <div className="flex flex-col items-center opacity-80">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center mb-1 animate-pulse">
                    ☕
                  </div>
                  <span className="text-amber-400">Kitchen Prep</span>
                </div>

                <div className="flex flex-col items-center opacity-40">
                  <div className="w-8 h-8 rounded-full bg-white/10 text-gray-300 flex items-center justify-center mb-1">
                    <Truck size={14} />
                  </div>
                  <span>On The Way</span>
                </div>

                <div className="flex flex-col items-center opacity-40">
                  <div className="w-8 h-8 rounded-full bg-white/10 text-gray-300 flex items-center justify-center mb-1">
                    🏠
                  </div>
                  <span>Delivered</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setShowInvoice(true)}
                className="bg-[#222222] hover:bg-black text-[#FDF5E6] border border-white/10 px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Printer size={16} />
                <span>View Official Invoice</span>
              </button>

              <button
                onClick={onClose}
                className="bg-[#6B1D1D] hover:bg-[#4A1212] text-white border border-[#D4AF37]/30 px-6 py-3 rounded-xl text-xs font-bold"
              >
                Back To Shop
              </button>
            </div>
          </div>
        )}

        {/* Invoice Modal Overlay */}
        {showInvoice && createdOrder && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#181818] p-8 rounded-2xl max-w-lg w-full text-left text-[#FDF5E6] space-y-4 font-mono text-xs border border-[#D4AF37]/30 shadow-2xl relative">
              <button
                onClick={() => setShowInvoice(false)}
                className="absolute top-4 right-4 text-[#A8A095] hover:text-white font-sans text-sm font-bold"
              >
                ✕ Close
              </button>

              <div className="border-b border-white/10 pb-4 text-center">
                <BrandLogo size="md" variant="light" />
                <p className="text-[10px] text-[#A8A095] mt-2">Bole Road, Addis Ababa, Ethiopia | +251 900 123 456</p>
                <h3 className="font-bold text-base mt-2 text-[#D4AF37]">OFFICIAL TAX INVOICE</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p className="text-[#A8A095]">Customer:</p>
                  <p className="font-bold">{createdOrder.customerName}</p>
                  <p>{createdOrder.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#A8A095]">Invoice No:</p>
                  <p className="font-bold">{createdOrder.id}</p>
                  <p>{new Date(createdOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border-t border-b border-white/10 py-2 space-y-1">
                {createdOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {it.quantity}x {it.menuItem.name}
                    </span>
                    <span>{it.quantity * it.menuItem.price} ETB</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right">
                <p>Subtotal: {createdOrder.subtotal} ETB</p>

                {createdOrder.discount > 0 && <p className="text-emerald-400">Discount: -{createdOrder.discount} ETB</p>}
                <p>Delivery: {createdOrder.deliveryFee} ETB</p>
                <p className="font-extrabold text-sm text-[#D4AF37] pt-1 border-t border-white/10">
                  TOTAL PAID: {createdOrder.total} ETB
                </p>
              </div>

              <div className="text-center text-[10px] text-[#A8A095] pt-4 border-t border-white/10">
                Payment Method: {createdOrder.paymentMethod} | Thank you for choosing Cafe Lina!
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-[#6B1D1D] hover:bg-[#8B2626] text-white border border-[#D4AF37]/30 py-2.5 rounded-xl font-sans text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer size={15} /> Print Receipt
                </button>
                <div className="flex-1">
                  <ShareReceiptButton
                    receiptData={{
                      title: 'Official Tax Invoice',
                      voucherId: createdOrder.id,
                      customerOrRecipient: createdOrder.customerName,
                      date: new Date(createdOrder.createdAt).toLocaleDateString(),
                      total: createdOrder.total,
                      paymentMethod: createdOrder.paymentMethod,
                      items: createdOrder.items.map((it) => ({
                        name: it.menuItem.name,
                        qty: it.quantity,
                        priceOrCost: it.quantity * it.menuItem.price,
                      })),
                      extraDetails: `Customer Phone: ${createdOrder.customerPhone || 'N/A'}, Subtotal: ${createdOrder.subtotal} ETB, Delivery: ${createdOrder.deliveryFee} ETB`,
                    }}
                    variant="amber"
                    label="Share Receipt (ሼር)"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
