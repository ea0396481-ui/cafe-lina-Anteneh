import React, { useState } from 'react';
import { Order, InventoryItem, DamageVoucher, POSReceiptVoucher } from '../../types';

import {
  BarChart2,
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  Download,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface ReportsERPProps {
  orders: Order[];
  posReceipts: POSReceiptVoucher[];
  damageVouchers: DamageVoucher[];
  inventory: InventoryItem[];
}

export const ReportsERP: React.FC<ReportsERPProps> = ({
  orders,
  posReceipts,
  damageVouchers,
  inventory,
}) => {
  const [timeframe, setTimeframe] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  // Calculate aggregate figures
  const onlineSalesTotal = orders.reduce((sum, o) => sum + o.total, 0);
  const posSalesTotal = posReceipts.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalGrossRevenue = onlineSalesTotal + posSalesTotal;

  // Estimated COGS (Cost of Goods Sold - ~35% of total sales)
  const estimatedCOGS = totalGrossRevenue * 0.35;

  // Total damage / loss cost
  const totalDamageLoss = damageVouchers.reduce((sum, d) => sum + d.totalLossAmount, 0);

  // Net Profit
  const netProfit = totalGrossRevenue - estimatedCOGS - totalDamageLoss;
  const netMarginPercent = totalGrossRevenue > 0 ? ((netProfit / totalGrossRevenue) * 100).toFixed(1) : '0';

  // Chart Data by Timeframe
  const dailyData = [
    { name: 'Mon', sales: 4200, profit: 2400, damage: 150 },
    { name: 'Tue', sales: 5800, profit: 3200, damage: 200 },
    { name: 'Wed', sales: 6100, profit: 3500, damage: 100 },
    { name: 'Thu', sales: 7400, profit: 4100, damage: 300 },
    { name: 'Fri', sales: 9800, profit: 5600, damage: 250 },
    { name: 'Sat', sales: 12500, profit: 7200, damage: 400 },
    { name: 'Sun', sales: 11200, profit: 6500, damage: 180 },
  ];

  const weeklyData = [
    { name: 'Week 1', sales: 32000, profit: 18500, damage: 1200 },
    { name: 'Week 2', sales: 38500, profit: 22100, damage: 950 },
    { name: 'Week 3', sales: 41200, profit: 24300, damage: 1400 },
    { name: 'Week 4', sales: 46800, profit: 27900, damage: 800 },
  ];

  const monthlyData = [
    { name: 'May', sales: 140000, profit: 82000, damage: 4500 },
    { name: 'Jun', sales: 162000, profit: 95000, damage: 3800 },
    { name: 'Jul', sales: 178000, profit: 104000, damage: 4100 },
    { name: 'Aug', sales: 195000, profit: 115000, damage: 3200 },
  ];

  const chartData = timeframe === 'Daily' ? dailyData : timeframe === 'Weekly' ? weeklyData : monthlyData;

  const categoryDistribution = [
    { name: 'Espresso Drinks', value: 45, color: '#D4AF37' },
    { name: 'Pastries & Cakes', value: 25, color: '#3B82F6' },
    { name: 'Burgers & Mains', value: 20, color: '#22C55E' },
    { name: 'Pourover & Beans', value: 10, color: '#A855F7' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
            Executive Analytics & Financials
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1 flex items-center gap-2">
            <BarChart2 className="text-[#D4AF37]" size={28} />
            Comprehensive Sales & P&L Reports (Report)
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Analyze daily, weekly, and monthly sales performance, profit margins, and cost damages.
          </p>
        </div>

        {/* Timeframe Selector & Export */}
        <div className="flex items-center gap-3">
          <div className="bg-[#1E293B] p-1 rounded-xl border border-white/10 flex">
            {(['Daily', 'Weekly', 'Monthly'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  timeframe === tf
                    ? 'bg-[#D4AF37] text-[#0F172A]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-[#243244] hover:bg-[#2F4158] text-[#F8FAFC] rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10 transition-all"
          >
            <Download size={15} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#243244] p-5 rounded-[20px] border border-white/10 shadow-lg space-y-1">
          <span className="text-[10px] text-[#94A3B8] font-bold uppercase block">Total Gross Revenue</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#F8FAFC]">
              {totalGrossRevenue.toLocaleString()} ETB
            </span>
            <span className="text-xs font-bold text-[#22C55E] flex items-center bg-[#22C55E]/10 px-2 py-0.5 rounded">
              <ArrowUpRight size={14} /> +14.2%
            </span>
          </div>
          <p className="text-[10px] text-[#94A3B8] pt-1">Online + POS Counter Sales</p>
        </div>

        <div className="bg-[#243244] p-5 rounded-[20px] border border-white/10 shadow-lg space-y-1">
          <span className="text-[10px] text-[#94A3B8] font-bold uppercase block">Cost of Goods (COGS)</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#CBD5E1]">
              {estimatedCOGS.toLocaleString()} ETB
            </span>
            <span className="text-xs text-[#94A3B8]">35% Ratio</span>
          </div>
          <p className="text-[10px] text-[#94A3B8] pt-1">Ingredient cost deduction</p>
        </div>

        <div className="bg-[#243244] p-5 rounded-[20px] border border-white/10 shadow-lg space-y-1">
          <span className="text-[10px] font-bold uppercase block text-red-400">Damages & Spoilage Loss</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-red-400">
              {totalDamageLoss.toLocaleString()} ETB
            </span>
            <span className="text-xs font-bold text-red-400 flex items-center bg-red-500/10 px-2 py-0.5 rounded">
              <ArrowDownRight size={14} /> Recorded
            </span>
          </div>
          <p className="text-[10px] text-[#94A3B8] pt-1">Batch damage vouchers total</p>
        </div>

        <div className="bg-[#243244] p-5 rounded-[20px] border border-[#D4AF37]/30 shadow-lg space-y-1 bg-gradient-to-br from-[#243244] to-[#1E293B]">
          <span className="text-[10px] font-bold uppercase block text-[#D4AF37]">Net Profit (Trf)</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#D4AF37]">
              {netProfit.toLocaleString()} ETB
            </span>
            <span className="text-xs font-extrabold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/20">
              {netMarginPercent}% Net
            </span>
          </div>
          <p className="text-[10px] text-[#94A3B8] pt-1">Net profit after inventory COGS</p>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales vs Profit Bar Chart */}
        <div className="lg:col-span-2 bg-[#243244] p-6 rounded-[24px] border border-white/10 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div>
              <h2 className="text-base font-serif font-bold text-[#F8FAFC]">
                {timeframe} Revenue & Profit Breakdown (Be Graph)
              </h2>
              <p className="text-xs text-[#94A3B8]">Gross Revenue vs. Net Profit trend analysis</p>
            </div>
            <span className="text-[10px] font-mono text-[#D4AF37] bg-[#1E293B] px-2.5 py-1 rounded-lg border border-white/10">
              {timeframe} Mode
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="sales" fill="#D4AF37" radius={[6, 6, 0, 0]} name="Sales (ETB)" />
                <Bar dataKey="profit" fill="#22C55E" radius={[6, 6, 0, 0]} name="Profit (ETB)" />
                <Bar dataKey="damage" fill="#EF4444" radius={[6, 6, 0, 0]} name="Damage Loss" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Share by Category Pie Chart */}
        <div className="bg-[#243244] p-6 rounded-[24px] border border-white/10 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="border-b border-white/10 pb-3">
            <h2 className="text-base font-serif font-bold text-[#F8FAFC]">Category Sales Share</h2>
            <p className="text-xs text-[#94A3B8]">Revenue distribution across product lines</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', fontSize: '11px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            {categoryDistribution.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-[#94A3B8] truncate">{c.name}:</span>
                <span className="font-bold text-[#F8FAFC]">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Numbers Table (Be Kutr) */}
      <div className="bg-[#243244] p-6 rounded-[24px] border border-white/10 space-y-4 shadow-xl">
        <h2 className="text-lg font-serif font-bold text-[#F8FAFC]">
          Financial Performance Statement (Be Kutr)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#CBD5E1]">
            <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-[10px] font-extrabold tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Period</th>
                <th className="py-3.5 px-4 text-right">Gross Sales (ETB)</th>
                <th className="py-3.5 px-4 text-right">Estimated COGS</th>
                <th className="py-3.5 px-4 text-right">Damage / Loss</th>
                <th className="py-3.5 px-4 text-right font-bold text-[#D4AF37]">Net Profit (ETB)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {chartData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#1E293B]/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#F8FAFC]">{row.name}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#F8FAFC]">
                    {row.sales.toLocaleString()} ETB
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#94A3B8]">
                    {(row.sales * 0.35).toLocaleString()} ETB
                  </td>
                  <td className="py-3.5 px-4 text-right text-red-400">
                    {row.damage.toLocaleString()} ETB
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-[#22C55E]">
                    {row.profit.toLocaleString()} ETB
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-[#22C55E]/10 text-[#22C55E] px-2 py-0.5 rounded text-[10px] font-bold border border-[#22C55E]/30">
                      Profitable
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
