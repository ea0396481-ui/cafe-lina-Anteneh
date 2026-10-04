import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Truck,
  PackageCheck,
  XCircle,
  ChevronDown,
  Search,
  Filter,
  ShoppingBag
} from 'lucide-react';

interface LiveOrdersQueueProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const LiveOrdersQueue: React.FC<LiveOrdersQueueProps> = ({
  orders,
  onUpdateOrderStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Filter orders based on search and status
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.deliveryType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || ord.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status badge configuration
  const getStatusBadgeConfig = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return {
          bg: 'bg-[#EF4444]/20',
          border: 'border-[#EF4444]/40',
          text: 'text-[#EF4444]',
          icon: Clock,
          label: 'Pending',
        };
      case 'Preparing':
        return {
          bg: 'bg-[#F59E0B]/20',
          border: 'border-[#F59E0B]/40',
          text: 'text-[#F59E0B]',
          icon: Coffee,
          label: 'Preparing',
        };
      case 'Ready':
        return {
          bg: 'bg-[#22C55E]/20',
          border: 'border-[#22C55E]/40',
          text: 'text-[#22C55E]',
          icon: CheckCircle2,
          label: 'Ready',
        };
      case 'Out for Delivery':
        return {
          bg: 'bg-[#8B5CF6]/20',
          border: 'border-[#8B5CF6]/40',
          text: 'text-[#A78BFA]',
          icon: Truck,
          label: 'Out for Delivery',
        };
      case 'Completed':
        return {
          bg: 'bg-[#3B82F6]/20',
          border: 'border-[#3B82F6]/40',
          text: 'text-[#60A5FA]',
          icon: PackageCheck,
          label: 'Completed',
        };
      case 'Cancelled':
        return {
          bg: 'bg-[#64748B]/20',
          border: 'border-[#64748B]/40',
          text: 'text-[#94A3B8]',
          icon: XCircle,
          label: 'Cancelled',
        };
      default:
        return {
          bg: 'bg-[#1E293B]',
          border: 'border-white/10',
          text: 'text-[#94A3B8]',
          icon: AlertCircle,
          label: status,
        };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
            Real-Time Fulfillment
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mt-2 flex items-center gap-3">
            <ShoppingBag size={28} className="text-[#D4AF37]" />
            Live Orders Queue
          </h1>
          <p className="text-xs text-[#CBD5E1] mt-1 font-medium">
            Monitor, track and update order dispatch status in real-time
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              placeholder="Search order ID or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#1E293B] text-[#F8FAFC] text-xs pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#D4AF37] transition-all w-64 placeholder-[#94A3B8]"
            />
          </div>

          <div className="relative flex items-center">
            <Filter className="absolute left-3 text-[#D4AF37]" size={14} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1E293B] text-[#F8FAFC] text-xs font-bold pl-9 pr-8 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#D4AF37] cursor-pointer appearance-none"
            >
              <option value="All">All Statuses ({orders.length})</option>
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 text-[#94A3B8] pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="bg-[#243244] rounded-[22px] p-12 text-center border border-white/10 text-[#CBD5E1] space-y-3 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <ShoppingBag size={48} className="mx-auto text-[#D4AF37]/50" />
            <p className="text-base font-bold text-[#F8FAFC]">No orders found</p>
            <p className="text-xs text-[#94A3B8]">
              {searchTerm || statusFilter !== 'All'
                ? 'Try adjusting your search query or status filter.'
                : 'All orders have been processed.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const badge = getStatusBadgeConfig(ord.status);
            const StatusIcon = badge.icon;

            return (
              <div
                key={ord.id}
                className="bg-[#243244] rounded-[22px] p-6 border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-250 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left Side: Order details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-[#D4AF37] text-lg font-mono tracking-tight">
                      {ord.id}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#1E293B] text-[#CBD5E1] border border-white/10">
                      {ord.deliveryType}
                    </span>
                    <span className="text-xs text-[#94A3B8] font-medium flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(ord.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-[#CBD5E1]">
                    Customer: <span className="text-[#F8FAFC] font-semibold">{ord.customerName}</span>
                    {ord.customerPhone && (
                      <span className="ml-2 text-xs text-[#94A3B8]">({ord.customerPhone})</span>
                    )}
                  </p>

                  {/* Concise Items Summary */}
                  {ord.items && ord.items.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {ord.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-[#1E293B] text-[#F8FAFC] px-2.5 py-1 rounded-lg border border-white/10 font-medium"
                        >
                          {item.quantity}x {item.menuItem.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side: Price & Status Badge */}
                <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-white/10 justify-between md:justify-end">
                  {/* Gold ETB Price */}
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block font-medium">
                      Total Payable
                    </span>
                    <span className="text-xl font-extrabold text-[#D4AF37] tracking-tight">
                      {ord.total.toLocaleString()} ETB
                    </span>
                  </div>

                  {/* Interactive Status Pill Badge */}
                  <div className="relative group">
                    <div
                      className={`rounded-full px-4 py-2 border flex items-center gap-2 font-bold text-xs shadow-md transition-all cursor-pointer ${badge.bg} ${badge.border} ${badge.text}`}
                    >
                      <StatusIcon size={14} className="shrink-0" />
                      <span>{badge.label}</span>
                      <ChevronDown size={14} className="shrink-0 opacity-70 group-hover:opacity-100" />
                    </div>

                    <select
                      value={ord.status}
                      onChange={(e) =>
                        onUpdateOrderStatus(ord.id, e.target.value as OrderStatus)
                      }
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      title="Click to update status"
                    >
                      <option value="Pending" className="bg-[#1E293B] text-[#F8FAFC]">Pending</option>
                      <option value="Preparing" className="bg-[#1E293B] text-[#F8FAFC]">Preparing</option>
                      <option value="Ready" className="bg-[#1E293B] text-[#F8FAFC]">Ready</option>
                      <option value="Out for Delivery" className="bg-[#1E293B] text-[#F8FAFC]">Out for Delivery</option>
                      <option value="Completed" className="bg-[#1E293B] text-[#F8FAFC]">Completed</option>
                      <option value="Cancelled" className="bg-[#1E293B] text-[#F8FAFC]">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
