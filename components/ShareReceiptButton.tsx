import React, { useState, useRef, useEffect } from 'react';
import { Share2, Check, Copy, MessageCircle, Send, ChevronDown, Printer, Download } from 'lucide-react';
import {
  ReceiptShareData,
  shareReceipt,
  copyReceiptToClipboard,
  shareViaWhatsApp,
  shareViaTelegram,
  formatReceiptToText,
  printReceiptThermal,
  downloadReceiptAsFile,
} from '../lib/receiptShareUtils';

interface ShareReceiptButtonProps {
  receiptData: ReceiptShareData;
  variant?: 'primary' | 'secondary' | 'icon' | 'outline' | 'amber';
  label?: string;
  className?: string;
  showDropdown?: boolean;
}

export const ShareReceiptButton: React.FC<ShareReceiptButtonProps> = ({
  receiptData,
  variant = 'primary',
  label = 'Share Receipt (ሼር)',
  className = '',
  showDropdown = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotify = (msg: string) => {
    setToastMessage(msg);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setToastMessage(null);
    }, 3000);
  };

  const handleDirectShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await shareReceipt(receiptData, handleNotify);
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(false);
    printReceiptThermal(receiptData);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(false);
    downloadReceiptAsFile(receiptData, handleNotify);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(false);
    const text = formatReceiptToText(receiptData);
    await copyReceiptToClipboard(text, handleNotify);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(false);
    shareViaWhatsApp(receiptData);
  };

  const handleTelegram = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(false);
    shareViaTelegram(receiptData);
  };

  let baseBtnStyles = 'transition-all cursor-pointer select-none flex items-center justify-center gap-1.5 font-bold';

  if (variant === 'primary') {
    baseBtnStyles += ' bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 px-4 text-xs shadow-md';
  } else if (variant === 'amber') {
    baseBtnStyles += ' bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl py-2.5 px-4 text-xs font-extrabold shadow-md';
  } else if (variant === 'secondary') {
    baseBtnStyles += ' bg-[#243244] hover:bg-[#2F4158] text-[#F8FAFC] border border-white/15 rounded-xl py-2.5 px-4 text-xs';
  } else if (variant === 'outline') {
    baseBtnStyles += ' bg-transparent hover:bg-white/10 text-emerald-400 border border-emerald-500/40 rounded-xl py-2 px-3 text-xs';
  } else if (variant === 'icon') {
    baseBtnStyles += ' p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg';
  }

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={handleDirectShare}
          className={`${baseBtnStyles} ${className}`}
          title="Share Receipt (ሼር አድርግ)"
        >
          {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
        </button>
      ) : (
        <div className="flex items-center w-full">
          <button
            type="button"
            onClick={handleDirectShare}
            className={`${baseBtnStyles} flex-1 ${className}`}
          >
            {copied ? (
              <>
                <Check size={15} className="text-emerald-300" />
                <span>Shared! (ተጋርቷል)</span>
              </>
            ) : (
              <>
                <Share2 size={15} />
                <span>{label}</span>
              </>
            )}
          </button>

          {showDropdown && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className="ml-1 p-2 bg-[#243244] hover:bg-[#2F4158] text-[#F8FAFC] rounded-xl border border-white/10 text-xs flex items-center justify-center cursor-pointer"
              title="More Share Options"
            >
              <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* Share Options Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-56 bg-[#1E293B] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 animate-fadeIn text-[#F8FAFC]">
          <div className="px-3 py-1.5 border-b border-white/10 text-[10px] uppercase font-bold text-[#94A3B8]">
            Receipt Actions & Sharing
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold hover:bg-[#243244] text-[#D4AF37] rounded-xl transition-colors text-left cursor-pointer"
          >
            <Printer size={14} className="text-[#D4AF37]" />
            <span>Print Thermal Slip (ፕሪንት)</span>
          </button>
          <button
            type="button"
            onClick={handleDirectShare}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[#243244] rounded-xl transition-colors text-left cursor-pointer"
          >
            <Share2 size={14} className="text-amber-400" />
            <span>Device Share (ሁሉም)</span>
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-emerald-950/40 text-emerald-300 rounded-xl transition-colors text-left cursor-pointer"
          >
            <MessageCircle size={14} className="text-emerald-400" />
            <span>Send via WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={handleTelegram}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-sky-950/40 text-sky-300 rounded-xl transition-colors text-left cursor-pointer"
          >
            <Send size={14} className="text-sky-400" />
            <span>Send via Telegram</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[#243244] rounded-xl transition-colors text-left cursor-pointer border-t border-white/5"
          >
            <Copy size={14} className="text-purple-400" />
            <span>Copy Receipt Text (ኮፒ)</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[#243244] text-slate-300 rounded-xl transition-colors text-left cursor-pointer"
          >
            <Download size={14} className="text-blue-400" />
            <span>Download Slip File (.txt)</span>
          </button>
        </div>
      )}

      {/* Floating Mini Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-60 bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
