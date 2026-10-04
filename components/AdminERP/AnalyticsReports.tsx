import React from 'react';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const AnalyticsReports: React.FC = () => {
  const salesData = [
    { month: 'Jan', coffee: 45000, bakery: 30000, breakfast: 40000 },
    { month: 'Feb', coffee: 52000, bakery: 35000, breakfast: 45000 },
    { month: 'Mar', coffee: 60000, bakery: 42000, breakfast: 50000 },
    { month: 'Apr', coffee: 48000, bakery: 32000, breakfast: 41000 },
    { month: 'May', coffee: 68000, bakery: 49000, breakfast: 58000 },
    { month: 'Jun', coffee: 72000, bakery: 53000, breakfast: 62000 },
    { month: 'Jul', coffee: 85000, bakery: 60000, breakfast: 70000 },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
            Executive Intelligence
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#EAEAEA]">Sales & Financial Analytics</h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Revenue streams by department, category breakdowns and profit & loss</p>
        </div>

        <button
          onClick={() => alert('Exporting Financial Report CSV/PDF...')}
          className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0F1115] h-[50px] px-6 rounded-[16px] text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all duration-250 self-start sm:self-auto"
        >
          <Download size={18} /> Export Financial Statements
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Chart Card */}
        <div className="bg-[#243244] p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="font-bold text-lg text-[#F8FAFC]">Category Sales Trends (ETB)</h2>
            <p className="text-xs text-[#CBD5E1]">Monthly revenue distribution across core menus</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" fontSize={11} stroke="#94A3B8" tickLine={false} />
                <YAxis fontSize={11} stroke="#94A3B8" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#D4AF37',
                    borderRadius: '16px',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="coffee" fill="#D4AF37" name="Specialty Coffee" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bakery" fill="#F6C453" name="Artisan Bakery" radius={[4, 4, 0, 0]} />
                <Bar dataKey="breakfast" fill="#3B82F6" name="Breakfast Platters" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* P&L Statement Card */}
        <div className="bg-[#243244] p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="font-bold text-lg text-[#F8FAFC]">Profit & Loss Statement (YTD)</h2>
            <p className="text-xs text-[#CBD5E1]">Comprehensive income and expense audit</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between bg-[#22C55E]/10 p-4 rounded-[16px] font-bold text-[#22C55E] border border-[#22C55E]/30">
              <span>Gross Sales Revenue</span>
              <span className="text-sm font-extrabold">1,290,000 ETB</span>
            </div>
            <div className="flex justify-between bg-[#EF4444]/10 p-4 rounded-[16px] font-bold text-[#EF4444] border border-[#EF4444]/30">
              <span>Cost of Goods Sold (COGS)</span>
              <span className="text-sm font-extrabold">-420,000 ETB</span>
            </div>
            <div className="flex justify-between bg-[#1E293B] p-4 rounded-[16px] font-bold text-[#F8FAFC] border border-white/10">
              <span>Operating Expenses (Rent, HR, Energy)</span>
              <span className="text-sm font-extrabold">-310,000 ETB</span>
            </div>
            <div className="flex justify-between bg-[#1E293B] p-5 rounded-[18px] font-extrabold text-[#F8FAFC] border border-[#D4AF37]/50 shadow-md">
              <div>
                <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider block">Net Profit Before Tax</span>
                <span className="text-xl text-[#D4AF37] font-serif">560,000 ETB</span>
              </div>
              <div className="self-end text-right">
                <span className="text-xs bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 px-3 py-1 rounded-full font-bold">43.4% Margin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

