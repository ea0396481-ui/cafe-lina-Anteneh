import React from 'react';
import { MenuItem, Order, EPRRecord } from '../../types';
import { ShoppingBag, TrendingUp, Users, Clock, Recycle, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminDashboardProps {
  orders: Order[];
  menuItems: MenuItem[];
  eprRecords: EPRRecord[];
  onNavigateModule: (mod: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  menuItems,
  eprRecords,
  onNavigateModule,
}) => {
  const chartData = [
    { month: 'Jan', revenue: 12500 },
    { month: 'Feb', revenue: 14200 },
    { month: 'Mar', revenue: 11800 },
    { month: 'Apr', revenue: 16500 },
    { month: 'May', revenue: 15100 },
    { month: 'Jun', revenue: 17800 },
    { month: 'Jul', revenue: 18750 },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
            Enterprise Management
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#EAEAEA]">Executive Overview</h1>
          <p className="text-xs text-[#9CA3AF] mt-1">Cafe Lina Bole Road Flagship • Live Performance</p>
        </div>
        <div className="sm:text-right text-xs text-[#9CA3AF]">
          <p className="font-semibold text-[#EAEAEA]">Addis Ababa, Ethiopia</p>
          <p className="mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Grid - Dark Luxury Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#243244] p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-250">
          <div className="flex items-center justify-between text-xs font-semibold text-[#CBD5E1] mb-3">
            <span>Today's Orders</span>
            <div className="w-10 h-10 rounded-2xl bg-[#1E293B] text-[#D4AF37] flex items-center justify-center font-bold border border-white/10">
              <ShoppingBag size={18} />
            </div>
          </div>
          <span className="text-4xl font-extrabold text-[#F8FAFC] tracking-tight">45</span>
          <span className="text-xs text-[#22C55E] font-semibold block mt-2 flex items-center gap-1">
            <TrendingUp size={14} /> +12% from yesterday
          </span>
        </div>

        <div className="bg-[#243244] p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-250">
          <div className="flex items-center justify-between text-xs font-semibold text-[#CBD5E1] mb-3">
            <span>Total Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-[#1E293B] text-[#D4AF37] flex items-center justify-center font-bold border border-white/10">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold text-[#F8FAFC] tracking-tight">18,750</span>
            <span className="text-xs font-bold text-[#D4AF37]">ETB</span>
          </div>
          <span className="text-xs text-[#22C55E] font-semibold block mt-2 flex items-center gap-1">
            <TrendingUp size={14} /> +18.5% monthly target
          </span>
        </div>

        <div className="bg-[#243244] p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-250">
          <div className="flex items-center justify-between text-xs font-semibold text-[#CBD5E1] mb-3">
            <span>Active Customers</span>
            <div className="w-10 h-10 rounded-2xl bg-[#1E293B] text-[#D4AF37] flex items-center justify-center font-bold border border-white/10">
              <Users size={18} />
            </div>
          </div>
          <span className="text-4xl font-extrabold text-[#F8FAFC] tracking-tight">320</span>
          <span className="text-xs text-[#22C55E] font-semibold block mt-2 flex items-center gap-1">
            <TrendingUp size={14} /> +24 new members
          </span>
        </div>

        <div className="bg-[#243244] p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-250">
          <div className="flex items-center justify-between text-xs font-semibold text-[#CBD5E1] mb-3">
            <span>Pending Orders</span>
            <div className="w-10 h-10 rounded-2xl bg-[#1E293B] text-[#F59E0B] flex items-center justify-center font-bold border border-white/10">
              <Clock size={18} />
            </div>
          </div>
          <span className="text-4xl font-extrabold text-[#F8FAFC] tracking-tight">8</span>
          <span className="text-xs text-[#F59E0B] font-semibold block mt-2">Live in kitchen queue</span>
        </div>
      </div>

      {/* Main Revenue Chart & Recent Orders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[#243244] p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="font-bold text-lg text-[#F8FAFC]">Revenue Performance (ETB)</h2>
              <p className="text-xs text-[#CBD5E1]">Monthly revenue analytics & forecasts</p>
            </div>
            <span className="text-xs font-semibold text-[#D4AF37] bg-[#1E293B] px-3.5 py-1.5 rounded-full border border-[#D4AF37]/30">
              2026 Financial Year
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#D4AF37',
                    borderRadius: '16px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRevGold)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="bg-[#243244] p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="font-bold text-lg text-[#F8FAFC]">Live Orders</h2>
              <button
                onClick={() => onNavigateModule('orders')}
                className="text-xs text-[#D4AF37] hover:text-[#F6C453] font-bold flex items-center gap-1 transition-colors"
              >
                View Queue <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {orders.slice(0, 4).map((ord) => (
                <div key={ord.id} className="p-4 bg-[#1E293B] hover:bg-[#2F4158] rounded-2xl flex items-center justify-between transition-colors border border-white/10">
                  <div>
                    <span className="font-bold text-[#F8FAFC] text-xs block font-mono">{ord.id}</span>
                    <span className="text-xs text-[#CBD5E1]">{ord.customerName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#D4AF37] text-sm block">{ord.total} ETB</span>
                    <span className="text-[10px] bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 font-bold px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateModule('pos')}
            className="w-full mt-4 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] font-extrabold rounded-[16px] h-[52px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-250 cursor-pointer"
          >
            Launch POS Terminal
          </button>
        </div>
      </div>

      {/* EPR Compliance Module Summary */}
      <div className="bg-[#243244] p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center font-bold border border-[#22C55E]/20">
              <Recycle size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#F8FAFC]">EPR Sustainability Compliance</h2>
              <p className="text-xs text-[#CBD5E1]">Extended Producer Responsibility & Packaging Lifecycle Metrics</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateModule('epr')}
            className="bg-[#1E293B] hover:bg-[#2F4158] text-[#F8FAFC] border border-white/10 px-5 h-[46px] rounded-[14px] text-xs font-bold transition-all duration-250 shadow-sm"
          >
            Manage EPR Audit
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10">
            <span className="text-xs font-semibold text-[#CBD5E1] block mb-1">Total Packaging (kg)</span>
            <span className="text-3xl font-extrabold text-[#F8FAFC]">245.6</span>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10">
            <span className="text-xs font-semibold text-[#CBD5E1] block mb-1">Recycled Material (kg)</span>
            <span className="text-3xl font-extrabold text-[#22C55E]">180.2</span>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10">
            <span className="text-xs font-semibold text-[#CBD5E1] block mb-1">Compliance Score</span>
            <span className="text-3xl font-extrabold text-[#D4AF37]">73.4%</span>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/10">
            <span className="text-xs font-semibold text-[#CBD5E1] block mb-1">Audit Reports</span>
            <span className="text-3xl font-extrabold text-[#F8FAFC]">12</span>
          </div>
        </div>
      </div>
    </div>
  );
};

