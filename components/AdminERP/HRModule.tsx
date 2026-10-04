import React, { useState } from 'react';
import { Employee } from '../../types';
import { Plus, UserPlus, Trash2, Mail, Phone } from 'lucide-react';

interface HRModuleProps {
  employees: Employee[];
  onAddEmployee?: (emp: Employee) => void;
  onDeleteEmployee?: (id: string) => void;
}

export const HRModule: React.FC<HRModuleProps> = ({ employees, onAddEmployee, onDeleteEmployee }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Senior Barista');
  const [department, setDepartment] = useState<'Barista' | 'Kitchen' | 'Service' | 'Management' | 'Delivery'>('Barista');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState(12000);
  const [shift, setShift] = useState<'Morning' | 'Afternoon' | 'Night' | 'Full Day'>('Morning');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !onAddEmployee) return;
    const newEmp: Employee = {
      id: `EMP-${Date.now().toString().slice(-4)}`,
      name,
      role,
      department,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@cafelina.com`,
      phone: phone || '+251 911 000 000',
      salary: Number(salary),
      currency: 'ETB',
      status: 'Active',
      shift,
      joinDate: new Date().toISOString().split('T')[0],
      attendanceRate: 98.5,
    };
    onAddEmployee(newEmp);
    setShowAddModal(false);
    setName('');
    setEmail('');
    setPhone('');
  };

  const totalMonthlyPayroll = employees.reduce((sum, e) => sum + e.salary, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
            Workforce & Operations
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#EAEAEA]">Human Resources & Payroll ERP</h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Employee directory, shift scheduling, attendance rate, and payroll</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0F1115] h-[46px] px-5 rounded-[14px] text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus size={16} /> Add Staff Member
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-[#243244] p-6 sm:p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          <span className="text-xs font-semibold text-[#CBD5E1] block mb-1">Active Staff</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">{employees.length} Employees</span>
        </div>

        <div className="bg-[#243244] p-6 sm:p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          <span className="text-xs font-semibold text-[#CBD5E1] block mb-1">Avg Attendance Rate</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#22C55E]">97.8%</span>
        </div>

        <div className="bg-[#243244] p-6 sm:p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] sm:col-span-2 lg:col-span-1">
          <span className="text-xs font-semibold text-[#CBD5E1] block mb-1">Monthly Payroll</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37]">{totalMonthlyPayroll.toLocaleString()} ETB</span>
        </div>
      </div>

      {/* Employees Table & Mobile Cards */}
      <div className="bg-[#243244] rounded-[22px] border border-white/10 overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
        {/* Desktop & Tablet Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1E293B] border-b border-white/10 text-[#CBD5E1] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-5">Employee</th>
                <th className="p-5">Role & Dept</th>
                <th className="p-5">Shift</th>
                <th className="p-5">Monthly Salary</th>
                <th className="p-5">Attendance</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#2F4158] transition-colors">
                  <td className="p-5 font-bold text-[#F8FAFC] text-sm">
                    {emp.name}
                    <span className="text-[11px] text-[#94A3B8] block font-normal">{emp.email}</span>
                  </td>
                  <td className="p-5 text-[#CBD5E1]">
                    <span className="font-semibold text-[#F8FAFC] block">{emp.role}</span>
                    <span className="text-[10px] bg-[#1E293B] text-[#D4AF37] border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-[6px] font-bold inline-block mt-1">
                      {emp.department}
                    </span>
                  </td>
                  <td className="p-5 text-[#F8FAFC] font-semibold">{emp.shift}</td>
                  <td className="p-5 font-extrabold text-[#D4AF37] text-sm">{emp.salary.toLocaleString()} ETB</td>
                  <td className="p-5 font-extrabold text-[#22C55E] text-sm">{emp.attendanceRate}%</td>
                  <td className="p-5">
                    <span className="bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 text-[11px] font-bold px-3 py-1 rounded-full">
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    {onDeleteEmployee && (
                      <button
                        onClick={() => onDeleteEmployee(emp.id)}
                        className="p-2 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                        aria-label="Remove Staff"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards (< 640px) */}
        <div className="sm:hidden divide-y divide-white/10">
          {employees.map((emp) => (
            <div key={emp.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-[#F8FAFC] text-sm">{emp.name}</h3>
                  <span className="text-[#94A3B8] text-xs">{emp.role} • {emp.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {emp.status}
                  </span>
                  {onDeleteEmployee && (
                    <button
                      onClick={() => onDeleteEmployee(emp.id)}
                      className="p-1.5 text-[#EF4444] bg-[#EF4444]/10 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#1E293B] p-3 rounded-xl border border-white/5">
                <div>
                  <span className="text-[#94A3B8] block text-[10px] uppercase">Shift</span>
                  <span className="font-semibold text-[#F8FAFC]">{emp.shift}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] block text-[10px] uppercase">Attendance</span>
                  <span className="font-extrabold text-[#22C55E]">{emp.attendanceRate}%</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-[#94A3B8]">{emp.email}</span>
                <span className="font-extrabold text-[#D4AF37] text-sm">{emp.salary.toLocaleString()} ETB</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Employee Modal (Full Screen) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#1E293B] border-b border-white/10 flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
                <UserPlus size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#F8FAFC]">Add Staff Member</h3>
                <p className="text-xs text-[#CBD5E1]">Register new employee in HR & payroll system</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#243244] transition-all cursor-pointer"
            >
              <Plus size={24} className="rotate-45" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleAddSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-lg">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Samuel Bekele"
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Department *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as any)}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Barista">Barista</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Service">Service</option>
                    <option value="Management">Management</option>
                    <option value="Delivery">Delivery</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Role Title *</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Lead Barista"
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Shift *</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Night">Night</option>
                    <option value="Full Day">Full Day</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Monthly Salary (ETB) *</label>
                  <input
                    type="number"
                    required
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@cafelina.com"
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#CBD5E1] block">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 9..."
                    className="w-full h-12 bg-[#243244] text-[#F8FAFC] placeholder-[#94A3B8] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 sm:p-6 bg-[#1E293B] border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 shadow-xl">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-full sm:w-auto px-6 h-12 bg-[#243244] text-[#F8FAFC] border border-white/10 hover:bg-[#2F4158] rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 h-12 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                Add Employee
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};


