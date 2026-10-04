import React from 'react';
import { RecipeCost } from '../../types';

interface RecipeCostingProps {
  recipeCosts: RecipeCost[];
}

export const RecipeCosting: React.FC<RecipeCostingProps> = ({ recipeCosts }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-2 border-b border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
          Financial Precision & Profitability
        </span>
        <h1 className="text-2xl font-serif font-bold text-[#EAEAEA]">Recipe Costing & Profit Margins</h1>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          Raw material tracking, labor allocation, overheads, and target margin calculations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {recipeCosts.map((rc) => (
          <div key={rc.id} className="bg-[#243244] p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="font-serif font-bold text-xl text-[#F8FAFC]">{rc.menuItemName}</h2>
              <span className="text-xs bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 font-bold px-3 py-1 rounded-full">
                Target Margin: {rc.targetMarginPercent}%
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <h3 className="font-bold text-[#CBD5E1] uppercase text-[10px] tracking-wider">Ingredients Breakdown</h3>
              {rc.ingredients.map((ing, idx) => (
                <div key={idx} className="flex justify-between bg-[#1E293B] p-3 rounded-[14px] border border-white/10 text-[#F8FAFC]">
                  <span>{ing.ingredientName} ({ing.qty} {ing.unit})</span>
                  <span className="font-bold text-[#D4AF37]">{(ing.qty * ing.costPerUnit).toFixed(2)} ETB</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#1E293B] p-4 rounded-[16px] text-xs font-bold text-[#F8FAFC] border border-[#D4AF37]/30">
              <div>
                <span className="text-[#94A3B8] text-[10px] block font-medium">Labor & Overhead</span>
                <span className="text-sm font-extrabold text-[#F8FAFC]">{(rc.laborCost + rc.overheadCost).toFixed(2)} ETB</span>
              </div>
              <div>
                <span className="text-[#94A3B8] text-[10px] block font-medium">Total COGS</span>
                <span className="text-sm font-extrabold text-[#D4AF37]">{rc.calculatedCost.toFixed(2)} ETB</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
              <div>
                <span className="text-[#94A3B8] block text-[10px]">Current Menu Price</span>
                <span className="font-extrabold text-lg text-[#F8FAFC]">{rc.currentPrice} ETB</span>
              </div>
              <div className="text-right">
                <span className="text-[#94A3B8] block text-[10px]">Recommended Price</span>
                <span className="font-extrabold text-lg text-[#22C55E]">{rc.recommendedPrice} ETB</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

