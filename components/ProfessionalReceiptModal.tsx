import React from 'react';
import {
  ReceiptShareData,
  printReceiptThermal,
  downloadReceiptAsFile,
  formatReceiptToText,
} from '../lib/receiptShareUtils';
import { ShareReceiptButton } from './ShareReceiptButton';
import {
  Printer,
  X,
  Building2,
  FileText,
  Calendar,
  Clock,
  User,
  CreditCard,
  QrCode,
  CheckCircle2,
  Download,
  Copy,
  Receipt,
} from 'lucide-react';

interface ProfessionalReceiptModalProps {
  receiptData: ReceiptShareData | null;
  onClose: () => void;
  onEdit?: () => void;
  editLabel?: string;
  customActions?: React.ReactNode;
}

export const ProfessionalReceiptModal: React.FC<ProfessionalReceiptModalProps> = ({
  receiptData,
  onClose,
  onEdit,
  editLabel = 'Edit Voucher',
  customActions,
}) => {
  if (!receiptData) return null;

  const handlePrint = () => {
    printReceiptThermal(receiptData);
  };

  const handleDownload = () => {
    downloadReceiptAsFile(receiptData);
  };

  const vatRate = receiptData.vatRate || 5;
  const subtotal =
    receiptData.subtotal !== undefined
      ? typeof receiptData.subtotal === 'number'
        ? receiptData.subtotal
        : parseFloat(receiptData.subtotal) || 0
      : receiptData.total !== undefined
      ? typeof receiptData.total === 'number'
        ? receiptData.total
        : parseFloat(String(receiptData.total)) || 0
      : 0;

  const discount = receiptData.discount || 0;
  const tax = receiptData.tax !== undefined ? receiptData.tax : subtotal * (vatRate / 100);
  const grandTotal =
    receiptData.total !== undefined
      ? typeof receiptData.total === 'number'
        ? receiptData.total
        : parseFloat(String(receiptData.total)) || subtotal - discount + tax
      : subtotal - discount + tax;

  return (
    <div
      id="professional-receipt-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn print:p-0 print:bg-white print:static"
    >
      <div className="bg-[#1E293B] border border-white/15 rounded-[28px] max-w-lg w-full p-4 sm:p-6 space-y-4 my-6 shadow-2xl text-[#F8FAFC] print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-full print:bg-white print:text-black">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-xl text-[#D4AF37]">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#F8FAFC]">
                Official Thermal Receipt / Voucher
              </h3>
              <p className="text-[11px] text-[#94A3B8]">
                Café Lina Luxury Co. · Fiscal Verified Slip
              </p>
            </div>
          </div>

          <button
            id="close-receipt-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#243244] hover:bg-[#2F4158] transition-colors cursor-pointer"
            title="Close Receipt"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable High-Contrast Thermal Receipt Container */}
        <div
          id="printable-thermal-slip"
          className="bg-white text-slate-900 rounded-2xl p-5 sm:p-7 shadow-inner font-mono text-xs space-y-4 border border-slate-200 select-text print:border-none print:shadow-none print:p-2"
        >
          {/* Header Brand */}
          <div className="text-center border-b-2 border-dashed border-slate-400 pb-4 space-y-1">
            <div className="inline-block bg-slate-900 text-amber-400 font-sans font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-1">
              ✦ CAFÉ LINA LUXURY CO. ✦
            </div>
            <h2 className="font-bold text-sm text-slate-900 font-sans">
              የካፌሊና የቅንጦት ቡና እና መስተንግዶ
            </h2>
            <p className="text-[11px] text-slate-600 font-sans">
              {receiptData.branchAddress || 'Bole Medhanialem Road, Addis Ababa, Ethiopia'}
            </p>
            <p className="text-[10px] text-slate-500 font-sans">
              Tel: +251 900 123 456 / +251 116 889 900
            </p>

            {/* Fiscal ID Badges */}
            <div className="pt-2 flex flex-wrap justify-center gap-2 text-[10px] text-slate-700 font-sans font-semibold">
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                TIN: <strong>{receiptData.tinNumber || '0089247193'}</strong>
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                VAT Reg: <strong>{receiptData.vatRegNumber || '984729104'}</strong>
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                FS No: <strong>{receiptData.fsNumber || `FS-2026-${Math.floor(100000 + Math.random() * 900000)}`}</strong>
              </span>
            </div>
          </div>

          {/* Title & Metadata Grid */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between items-center font-bold text-slate-900">
              <span className="uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {receiptData.title}
              </span>
              <span className="font-mono text-slate-900">#{receiptData.voucherId}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-2 text-slate-700 text-[10px] sm:text-[11px]">
              <div>
                <span className="text-slate-500">Date: </span>
                <strong className="text-slate-900">
                  {receiptData.date || new Date().toISOString().split('T')[0]} {receiptData.time || ''}
                </strong>
              </div>
              {receiptData.storeName && (
                <div>
                  <span className="text-slate-500">Store: </span>
                  <strong className="text-slate-900">{receiptData.storeName}</strong>
                </div>
              )}
              {receiptData.customerOrRecipient && (
                <div className="col-span-2">
                  <span className="text-slate-500">Party/Customer: </span>
                  <strong className="text-slate-900">{receiptData.customerOrRecipient}</strong>
                </div>
              )}
              {receiptData.cashierName && (
                <div>
                  <span className="text-slate-500">Cashier: </span>
                  <strong className="text-slate-900">{receiptData.cashierName}</strong>
                </div>
              )}
              {receiptData.waiterName && (
                <div>
                  <span className="text-slate-500">Server: </span>
                  <strong className="text-slate-900">{receiptData.waiterName}</strong>
                </div>
              )}
              {receiptData.orderType && (
                <div className="col-span-2">
                  <span className="text-slate-500">Order Mode: </span>
                  <strong className="text-slate-900">
                    {receiptData.orderType}
                    {receiptData.tableNumber ? ` (Table ${receiptData.tableNumber})` : ''}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase border-b border-slate-300 pb-1">
              <span className="w-1/2">Item Description</span>
              <span className="w-1/4 text-center">Qty</span>
              <span className="w-1/4 text-right">Amount</span>
            </div>

            <div className="divide-y divide-slate-100 text-[11px]">
              {receiptData.items && receiptData.items.length > 0 ? (
                receiptData.items.map((it, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between items-start">
                    <div className="w-1/2 pr-2">
                      <span className="font-bold text-slate-900 block leading-tight">
                        {it.name}
                      </span>
                      {it.notes && (
                        <span className="text-[10px] text-slate-500 italic block leading-none mt-0.5">
                          ({it.notes})
                        </span>
                      )}
                      {it.unitPrice !== undefined && (
                        <span className="text-[9px] text-slate-400 block font-mono">
                          @{it.unitPrice.toFixed(2)} ETB
                        </span>
                      )}
                    </div>
                    <div className="w-1/4 text-center font-bold text-slate-800">
                      {it.qty} {it.unit || ''}
                    </div>
                    <div className="w-1/4 text-right font-bold text-slate-900 font-mono">
                      {it.priceOrCost !== undefined
                        ? typeof it.priceOrCost === 'number'
                          ? it.priceOrCost.toFixed(2)
                          : it.priceOrCost
                        : it.unitPrice
                        ? (it.unitPrice * it.qty).toFixed(2)
                        : '-'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-3 text-slate-400 italic text-[11px]">
                  No itemized entries
                </div>
              )}
            </div>
          </div>

          {/* Financial Calculation Summary */}
          <div className="border-t-2 border-dashed border-slate-400 pt-3 space-y-1 text-[11px]">
            {receiptData.subtotal !== undefined && (
              <div className="flex justify-between text-slate-700">
                <span>Subtotal:</span>
                <span className="font-mono">{subtotal.toFixed(2)} ETB</span>
              </div>
            )}

            {discount > 0 && (
              <div className="flex justify-between text-rose-700 font-bold">
                <span>Discount Applied:</span>
                <span className="font-mono">-{discount.toFixed(2)} ETB</span>
              </div>
            )}

            {receiptData.tax !== undefined && (
              <div className="flex justify-between text-slate-700">
                <span>VAT ({vatRate}%):</span>
                <span className="font-mono">{tax.toFixed(2)} ETB</span>
              </div>
            )}

            <div className="flex justify-between items-center text-base font-black text-slate-900 border-t-2 border-b-2 border-slate-900 py-1.5 my-1">
              <span>GRAND TOTAL:</span>
              <span className="font-mono text-lg text-emerald-800 font-extrabold">
                {typeof grandTotal === 'number' ? grandTotal.toFixed(2) : grandTotal} ETB
              </span>
            </div>

            {receiptData.paymentMethod && (
              <div className="flex justify-between text-slate-800 font-bold pt-1">
                <span>Payment Method:</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                  {receiptData.paymentMethod}
                </span>
              </div>
            )}

            {receiptData.amountTendered !== undefined && receiptData.amountTendered > 0 && (
              <div className="flex justify-between text-slate-700 text-[10px]">
                <span>Tendered / Paid:</span>
                <span className="font-mono">{receiptData.amountTendered.toFixed(2)} ETB</span>
              </div>
            )}

            {receiptData.changeDue !== undefined && receiptData.changeDue > 0 && (
              <div className="flex justify-between text-emerald-800 font-bold text-[11px]">
                <span>Change Due (መልስ):</span>
                <span className="font-mono">{receiptData.changeDue.toFixed(2)} ETB</span>
              </div>
            )}

            {receiptData.accountOrPhone && (
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>Ref / Acc:</span>
                <span className="font-mono">{receiptData.accountOrPhone}</span>
              </div>
            )}
          </div>

          {/* Extra Details / Remarks */}
          {(receiptData.extraDetails || receiptData.notesOrRemarks) && (
            <div className="text-[10px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 space-y-0.5">
              {receiptData.extraDetails && <p><strong>Note:</strong> {receiptData.extraDetails}</p>}
              {receiptData.notesOrRemarks && <p><strong>Remark:</strong> {receiptData.notesOrRemarks}</p>}
            </div>
          )}

          {/* Barcode & Fiscal Verification Footer */}
          <div className="text-center pt-2 space-y-1.5">
            <div className="tracking-[6px] font-mono text-base font-black text-slate-900 select-none">
              ||||| | |||| ||| |||| | |||||
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              * {receiptData.voucherId} *
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 text-[10px] text-slate-600 font-sans leading-tight">
              <strong className="block text-slate-800">*** THANK YOU FOR VISITING CAFÉ LINA ***</strong>
              <span>እንግዳችን ስለሆኑ እናመሰግናለን! እንደገና ይጎብኙን!</span>
              <p className="text-[9px] text-slate-400 mt-1">
                Café Lina Luxury Co. · Automated ERP & Fiscal POS
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar (Print, Share, Edit, Download, Close) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 print:hidden">
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer transition-all min-h-[42px]"
              >
                {editLabel}
              </button>
            )}

            {customActions}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white border border-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all min-h-[42px]"
              title="Print Receipt Thermal / A4"
            >
              <Printer size={15} className="text-[#D4AF37]" />
              <span>Print (ፕሪንት)</span>
            </button>

            <ShareReceiptButton
              receiptData={receiptData}
              variant="primary"
              label="Share Receipt (ሼር)"
            />

            <button
              type="button"
              onClick={handleDownload}
              className="p-2.5 bg-[#243244] hover:bg-[#2F4158] text-[#F8FAFC] rounded-xl border border-white/10 text-xs flex items-center justify-center cursor-pointer transition-colors min-h-[42px] min-w-[42px]"
              title="Download Receipt .txt File"
            >
              <Download size={16} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#243244] hover:bg-[#2F4158] text-[#CBD5E1] hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors border border-white/10 min-h-[42px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
