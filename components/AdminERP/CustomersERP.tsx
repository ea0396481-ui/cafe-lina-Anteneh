import React, { useState } from 'react';
import { Customer, Order } from '../../types';
import { Users, Phone, MapPin, Mail, ShoppingBag, Plus, Search, Award, DollarSign, X, ShoppingCart } from 'lucide-react';

interface CustomersERPProps {
  customers: Customer[];
  orders: Order[];
  onAddCustomer: (customer: Customer) => void;
}

export const CustomersERP: React.FC<CustomersERPProps> = ({
  customers,
  orders,
  onAddCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newCust: Customer = {
      id: `CUST-${Date.now()}`,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone,
      address: address || 'Addis Ababa',
      tier: 'Bronze',
      rewardPoints: 50,
      totalSpent: 0,
      ordersCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      wishlistIds: [],
    };

    onAddCustomer(newCust);
    setIsAddModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
            Customer Relationship Management (CRM)
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1 flex items-center gap-2">
            <Users className="text-[#D4AF37]" size={28} />
            Customer Profiles & Order Sync (Customers Mmezegbbet)
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Customer details and order information recorded automatically when customers place POS or online orders.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg min-h-[44px]"
        >
          <Plus size={18} />
          <span>Register New Customer</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#243244] p-5 rounded-[20px] border border-white/10 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[#94A3B8] text-xs font-semibold block uppercase">Total Registered Customers</span>
            <span className="text-2xl font-extrabold text-[#F8FAFC]">{customers.length} Accounts</span>
          </div>
          <Users className="text-[#D4AF37]" size={28} />
        </div>

        <div className="bg-[#243244] p-5 rounded-[20px] border border-white/10 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[#94A3B8] text-xs font-semibold block uppercase">Linked Sales Orders</span>
            <span className="text-2xl font-extrabold text-[#22C55E]">{orders.length} Orders</span>
          </div>
          <ShoppingBag className="text-[#22C55E]" size={28} />
        </div>

        <div className="bg-[#243244] p-5 rounded-[20px] border border-white/10 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[#94A3B8] text-xs font-semibold block uppercase">Loyalty Tier Members</span>
            <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
              Gold & Platinum VIPs
            </span>
          </div>
          <Award className="text-[#D4AF37]" size={28} />
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#243244] p-4 rounded-[20px] border border-white/10">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name, phone number, or email..."
            className="w-full h-[48px] bg-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl pl-11 pr-4 text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37]"
          />
          <Search size={18} className="absolute left-3.5 top-3.5 text-[#94A3B8]" />
        </div>
      </div>

      {/* Customers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCustomers.map((cust) => {
          // Linked orders for this customer
          const customerOrders = orders.filter(
            (o) =>
              o.customerPhone === cust.phone ||
              o.customerEmail?.toLowerCase() === cust.email?.toLowerCase() ||
              o.customerName.toLowerCase() === cust.name.toLowerCase()
          );

          return (
            <div
              key={cust.id}
              className="bg-[#243244] p-5 rounded-[22px] border border-white/10 shadow-md space-y-4 hover:border-[#D4AF37]/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#F8FAFC]">{cust.name}</h3>
                    <span className="text-[10px] text-[#94A3B8]">Joined {cust.joinedDate}</span>
                  </div>

                  <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-extrabold px-3 py-1 rounded-full">
                    {cust.tier} VIP
                  </span>
                </div>

                <div className="space-y-2 text-xs text-[#CBD5E1]">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-[#D4AF37] shrink-0" />
                    <span className="font-mono">{cust.phone}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-[#D4AF37] shrink-0" />
                    <span className="truncate">{cust.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#D4AF37] shrink-0" />
                    <span className="truncate">{cust.address}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-[#1E293B] rounded-xl border border-white/5 text-xs font-bold text-[#F8FAFC]">
                  <div>
                    <span className="text-[#94A3B8] block text-[10px] font-normal uppercase">Orders Placed</span>
                    <span className="text-sm font-extrabold text-[#22C55E]">
                      {cust.ordersCount + customerOrders.length} Orders
                    </span>
                  </div>

                  <div>
                    <span className="text-[#94A3B8] block text-[10px] font-normal uppercase">Total Spend</span>
                    <span className="text-sm font-extrabold text-[#D4AF37]">
                      {cust.totalSpent.toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(cust)}
                className="w-full py-2.5 bg-[#1E293B] hover:bg-[#D4AF37] hover:text-[#0F172A] text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs font-bold transition-all"
              >
                View Order History
              </button>
            </div>
          );
        })}
      </div>

      {/* MODAL: Customer Order History - Full Screen */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn text-[#F8FAFC]">
          <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#F8FAFC]">{selectedCustomer.name}</h3>
                <p className="text-xs text-[#94A3B8]">Phone: {selectedCustomer.phone} • Email: {selectedCustomer.email || 'N/A'}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="px-4 py-2 bg-[#243244] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <X size={18} />
              <span>Close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#1E293B] rounded-2xl border border-white/10">
                  <span className="text-xs text-[#94A3B8] block">Total Orders</span>
                  <span className="text-xl font-bold text-[#F8FAFC]">{selectedCustomer.ordersCount || 0}</span>
                </div>
                <div className="p-4 bg-[#1E293B] rounded-2xl border border-white/10">
                  <span className="text-xs text-[#94A3B8] block">Lifetime Spent</span>
                  <span className="text-xl font-bold text-[#D4AF37]">{(selectedCustomer.totalSpent || 0).toLocaleString()} ETB</span>
                </div>
                <div className="p-4 bg-[#1E293B] rounded-2xl border border-white/10">
                  <span className="text-xs text-[#94A3B8] block">Saved Address</span>
                  <span className="text-xs font-medium text-[#CBD5E1] block truncate">{selectedCustomer.address || 'No saved address'}</span>
                </div>
              </div>

              <div className="bg-[#1E293B] rounded-2xl border border-white/10 p-6 space-y-4">
                <h4 className="text-sm font-extrabold uppercase text-[#D4AF37] tracking-wider flex items-center gap-2">
                  <ShoppingCart size={16} />
                  Synced Order History
                </h4>

                {orders.filter(
                  (o) =>
                    o.customerPhone === selectedCustomer.phone ||
                    o.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()
                ).length === 0 ? (
                  <p className="text-xs text-[#94A3B8] text-center py-8">
                    No orders recorded for this customer profile yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orders
                      .filter(
                        (o) =>
                          o.customerPhone === selectedCustomer.phone ||
                          o.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()
                      )
                      .map((ord) => (
                        <div key={ord.id} className="p-4 bg-[#243244] rounded-xl border border-white/5 text-xs space-y-2">
                          <div className="flex justify-between font-bold text-sm">
                            <span className="font-mono text-[#D4AF37]">{ord.id}</span>
                            <span className="text-[#22C55E]">{ord.total} {ord.currency}</span>
                          </div>
                          <p className="text-[#CBD5E1]">Items: {ord.items.map((i) => `${i.menuItem.name} (x${i.quantity})`).join(', ')}</p>
                          <div className="flex justify-between text-[11px] text-[#94A3B8] pt-2 border-t border-white/5">
                            <span>Status: <strong className="text-emerald-400">{ord.status}</strong></span>
                            <span>{new Date(ord.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Register Customer - Full Screen */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn text-[#F8FAFC]">
          {/* Header */}
          <div className="px-6 py-4 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#F6C453] text-[#0F172A] flex items-center justify-center font-black">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#F8FAFC]">Register Customer Profile</h3>
                <p className="text-xs text-[#94A3B8]">Create VIP, corporate or recurring guest CRM profile with delivery address</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-[#243244] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <X size={18} />
              <span>Cancel</span>
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleAdd} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-6">
              <div className="bg-[#1E293B] p-6 sm:p-8 rounded-[28px] border border-white/10 space-y-6 shadow-xl">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#D4AF37] border-b border-white/10 pb-3">
                  Customer General Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#CBD5E1]">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Solomon Kassa"
                      className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#CBD5E1]">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+251 911 000 111"
                      className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#CBD5E1]">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="solomon@example.com"
                      className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#CBD5E1]">Delivery / Corporate Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Bole Atlas, Villa 45, Addis Ababa"
                      className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex justify-end gap-3 max-w-none w-full">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-6 h-12 bg-[#243244] hover:bg-[#334155] text-[#CBD5E1] rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 h-12 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold shadow-lg cursor-pointer flex items-center gap-2"
              >
                <Users size={16} />
                Save Customer Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
