import React from 'react';
import { EPRRecord } from '../../types';
import { Download, Recycle, CheckCircle2, ShieldCheck, Leaf } from 'lucide-react';

interface EPRModuleProps {
  records: EPRRecord[];
}

export const EPRModule: React.FC<EPRModuleProps> = ({ records }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-3.5 py-1 rounded-full border border-[#D4AF37]/30 mb-2">
            <Leaf size={14} className="text-[#D4AF37]" />
            Environmental Stewardship & EPR Compliance
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] flex items-center gap-2.5">
            Extended Producer Responsibility (EPR)
          </h1>
          <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1">
            Official environmental compliance tracking, bio-compost packaging audits, and eco sustainability reports
          </p>
        </div>

        <button
          onClick={() => alert('Generating official EPR Audit PDF Report...')}
          className="bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] h-[50px] px-6 rounded-[16px] text-xs font-extrabold flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all duration-250 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Download size={18} className="text-[#0F172A]" /> Download EPR Compliance Report
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#243244] p-6 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:border-[#D4AF37]/50 transition-all">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Total Packaging</span>
            <Recycle size={18} className="text-[#CBD5E1]" />
          </div>
          <span className="text-3xl font-extrabold text-[#F8FAFC]">
            245.6 <span className="text-xs font-normal text-[#94A3B8]">kg</span>
          </span>
          <span className="block text-[11px] text-[#94A3B8] mt-1">100% Bio-compostable stock</span>
        </div>

        <div className="bg-[#243244] p-6 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:border-[#22C55E]/50 transition-all">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Recycled / Compost</span>
            <CheckCircle2 size={18} className="text-[#22C55E]" />
          </div>
          <span className="text-3xl font-extrabold text-[#22C55E]">
            180.2 <span className="text-xs font-normal text-[#CBD5E1]">kg</span>
          </span>
          <span className="block text-[11px] text-[#22C55E] font-medium mt-1">+12.4% over last quarter</span>
        </div>

        <div className="bg-[#243244] p-6 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:border-[#D4AF37]/50 transition-all">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">Compliance Rate</span>
            <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">Target 70%</span>
          </div>
          <span className="text-3xl font-extrabold text-[#D4AF37]">73.4%</span>
          <span className="block text-[11px] text-[#CBD5E1] mt-1">Exceeds national mandate</span>
        </div>

        <div className="bg-[#243244] p-6 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:border-[#22C55E]/50 transition-all">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">EPA Audit Status</span>
            <ShieldCheck size={18} className="text-[#22C55E]" />
          </div>
          <span className="text-3xl font-extrabold text-[#22C55E]">PASSED</span>
          <span className="block text-[11px] text-[#CBD5E1] mt-1">Certified for 2026 Fiscal Year</span>
        </div>
      </div>

      {/* Audit Progress Bar */}
      <div className="bg-[#1E293B] p-6 rounded-[22px] border border-[#D4AF37]/30 space-y-3 shadow-md">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-[#F8FAFC]">Annual Zero-Waste & Packaging Recycling Progress</span>
          <span className="text-[#D4AF37]">180.2 kg of 245.6 kg (73.4%)</span>
        </div>
        <div className="w-full bg-[#243244] h-3 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-[#22C55E] to-[#D4AF37] h-full rounded-full transition-all duration-500 w-[73.4%]" />
        </div>
      </div>

      {/* Records Table Card */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg text-[#F8FAFC]">Monthly EPR Compliance Audit Logs</h2>
          <span className="text-xs text-[#CBD5E1]">Verified by Environmental Protection Authority</span>
        </div>

        <div className="bg-[#243244] rounded-[22px] border border-white/10 overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1E293B] border-b border-white/10 text-[#CBD5E1] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-5">Month</th>
                  <th className="p-5">Packaging Type</th>
                  <th className="p-5">Weight (kg)</th>
                  <th className="p-5">Recycled (kg)</th>
                  <th className="p-5">Compliance %</th>
                  <th className="p-5">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-[#2F4158] transition-colors">
                    <td className="p-5 font-bold text-[#F8FAFC] text-sm">{r.month}</td>
                    <td className="p-5 text-[#CBD5E1] font-medium">{r.packagingType}</td>
                    <td className="p-5 font-bold text-[#F8FAFC] text-sm">{r.weightKg} kg</td>
                    <td className="p-5 font-bold text-[#22C55E] text-sm">{r.recycledKg} kg</td>
                    <td className="p-5 font-extrabold text-[#D4AF37] text-sm">{r.complianceRate}%</td>
                    <td className="p-5 text-[#CBD5E1]">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (< 640px) */}
          <div className="sm:hidden divide-y divide-white/10">
            {records.map((r) => (
              <div key={r.id} className="p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#F8FAFC] text-sm">{r.month}</span>
                  <span className="font-extrabold text-[#D4AF37]">{r.complianceRate}% Compliance</span>
                </div>
                <p className="text-[#CBD5E1]">Packaging: <span className="text-[#F8FAFC] font-semibold">{r.packagingType}</span></p>
                <div className="flex justify-between text-[#CBD5E1] pt-1">
                  <span>Weight: {r.weightKg} kg</span>
                  <span className="text-[#22C55E] font-bold">Recycled: {r.recycledKg} kg</span>
                </div>
                {r.notes && <p className="text-[11px] text-[#94A3B8] italic">{r.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


