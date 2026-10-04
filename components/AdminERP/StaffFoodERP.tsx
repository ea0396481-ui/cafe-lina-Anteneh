import React, { useState } from 'react';
import { MenuItem, StaffMealRecord } from '../../types';
import { UtensilsCrossed, Plus, Trash2, Eye, Edit, UserCheck, X } from 'lucide-react';
import { ProfessionalReceiptModal } from '../ProfessionalReceiptModal';

interface StaffFoodERPProps {
  menuItems: MenuItem[];
  staffMeals: StaffMealRecord[];
  onAddStaffMeal: (record: StaffMealRecord) => void;
  onDeleteStaffMeal: (id: string) => void;
}

export const StaffFoodERP: React.FC<StaffFoodERPProps> = ({
  menuItems,
  staffMeals,
  onAddStaffMeal,
  onDeleteStaffMeal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMealForView, setSelectedMealForView] = useState<StaffMealRecord | null>(null);
  const [staffName, setStaffName] = useState('Mered Worku (Barista)');
  const [department, setDepartment] = useState('Service Barista');
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>(menuItems[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [approvedBy, setApprovedBy] = useState('Store Manager Dawit');
  const [notes, setNotes] = useState('Daily shift meal allowance');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = menuItems.find((m) => m.id === selectedMenuItemId);
    if (!item) return;

    const newMeal: StaffMealRecord = {
      id: `STF-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      createdTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      staffName,
      department,
      mealName: item.name,
      mealImage: item.image,
      quantity,
      totalCost: quantity * item.price,
      approvedBy,
      notes,
    };

    onAddStaffMeal(newMeal);
    setIsModalOpen(false);
  };

  const totalStaffMealCost = staffMeals.reduce((sum, s) => sum + s.totalCost, 0);

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1E293B] px-3 py-1 rounded-full border border-[#D4AF37]/30">
            Internal Staff Allowances
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F8FAFC] mt-1 flex items-center gap-2">
            <UtensilsCrossed className="text-[#D4AF37]" size={28} />
            Staff Food & Meal Registry (Staff Food)
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Track daily menu meals and food allowances consumed by cafe staff and kitchen members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#243244] p-3 px-5 rounded-2xl border border-white/10 shadow-md">
            <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">Total Staff Meal Allowance</span>
            <span className="text-xl font-extrabold text-[#D4AF37]">{totalStaffMealCost.toLocaleString()} ETB</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3.5 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg min-h-[44px]"
          >
            <Plus size={18} />
            <span>Record Staff Meal</span>
          </button>
        </div>
      </div>

      {/* Staff Meals Table */}
      <div className="bg-[#243244] p-6 rounded-[24px] border border-white/10 space-y-4 shadow-xl">
        <h2 className="text-lg font-serif font-bold text-[#F8FAFC]">Staff Food Meal Log</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#CBD5E1]">
            <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-[10px] font-extrabold tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Staff Member & Dept</th>
                <th className="py-3.5 px-4">Meal Served</th>
                <th className="py-3.5 px-4">Qty</th>
                <th className="py-3.5 px-4">Meal Cost Value</th>
                <th className="py-3.5 px-4">Approved By</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {staffMeals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#94A3B8]">
                    No staff meal consumption logged yet.
                  </td>
                </tr>
              ) : (
                staffMeals.map((s) => (
                  <tr key={s.id} className="hover:bg-[#1E293B]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#F8FAFC] block">{s.staffName}</span>
                      <span className="text-[10px] text-[#94A3B8]">{s.department}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <img src={s.mealImage} alt={s.mealName} className="w-8 h-8 rounded-lg object-cover" />
                        <span className="font-bold text-[#F8FAFC]">{s.mealName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#D4AF37]">{s.quantity}x</td>
                    <td className="py-3.5 px-4 font-extrabold text-[#22C55E]">{s.totalCost} ETB</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {s.approvedBy}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span>{s.date}</span> <span className="text-[10px] text-[#94A3B8]">{s.createdTime}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedMealForView(s)}
                          className="p-1.5 text-[#D4AF37] hover:text-[#F6C453] hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          title="View / Print / Share Receipt Voucher"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteStaffMeal(s.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Professional Receipt Modal for Staff Meal */}
      {selectedMealForView && (
        <ProfessionalReceiptModal
          receiptData={{
            title: 'Staff Meal Allowance Voucher (SMV)',
            voucherId: selectedMealForView.id,
            storeName: 'Staff Cafeteria / Kitchen Ops',
            customerOrRecipient: `Staff Member: ${selectedMealForView.staffName} (${selectedMealForView.department})`,
            date: selectedMealForView.date,
            time: selectedMealForView.createdTime,
            subtotal: selectedMealForView.totalCost,
            total: selectedMealForView.totalCost,
            items: [
              {
                name: selectedMealForView.mealName,
                qty: selectedMealForView.quantity,
                unit: 'portion',
                unitPrice: selectedMealForView.totalCost / (selectedMealForView.quantity || 1),
                priceOrCost: selectedMealForView.totalCost,
              },
            ],
            extraDetails: `Authorized by: ${selectedMealForView.approvedBy} | Dept: ${selectedMealForView.department}`,
            notesOrRemarks: selectedMealForView.notes,
          }}
          onClose={() => setSelectedMealForView(null)}
        />
      )}

      {/* Modal: Record Staff Meal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <form
            onSubmit={handleSubmit}
            className="bg-[#1E293B] border border-white/10 rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-2xl text-[#F8FAFC]"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-lg">Record Staff Meal Consumption</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Staff Member Name & Role *</label>
              <input
                type="text"
                required
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Department *</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Approved By *</label>
                <input
                  type="text"
                  required
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Select Menu Meal Item *</label>
              <select
                value={selectedMenuItemId}
                onChange={(e) => setSelectedMenuItemId(e.target.value)}
                className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} - {m.price} ETB
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1">Meal Quantity *</label>
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full h-10 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-11 bg-[#243244] text-[#CBD5E1] rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-11 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold shadow-md"
              >
                Save Meal Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
