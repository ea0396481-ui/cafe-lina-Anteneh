import React, { useState, useRef } from 'react';
import { MenuItem } from '../types';
import { MenuPrintTemplate } from './MenuPrintTemplate';
import { downloadMenuPDF } from '../lib/pdfGenerator';
import { printMenuContainer } from '../lib/printHelper';
import {
  Printer,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Loader2,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';

interface MenuPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onPrint: () => void;
}

export const MenuPreviewModal: React.FC<MenuPreviewModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  onPrint,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('');
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.45));
  const handleResetZoom = () => setZoomLevel(0.85);

  const handlePrint = () => {
    printMenuContainer({
      containerId: 'cafelina-preview-print-target',
      documentTitle: 'Cafe Lina Menu',
      onSuccess: () => {
        setExportMessage('Print dialog opened successfully!');
        setTimeout(() => setExportMessage(''), 2000);
      },
      onError: (err) => {
        console.warn('printMenuContainer failed, falling back to onPrint():', err);
        onPrint();
      },
    });
  };

  const handleDownloadPDF = async () => {
    try {
      setIsExportingPDF(true);
      setExportMessage('Initializing high-definition A4 document...');

      await downloadMenuPDF('cafelina-preview-print-target', {
        restaurantName: 'Cafe Lina Luxury Coffee & Restaurant',
        phone: '+251 900 123 456',
        address: 'Bole Road, Addis Ababa, Ethiopia',
        website: 'www.cafelina.com',
        menuItems: menuItems,
        onProgress: (_percent, msg) => {
          setExportMessage(msg);
        },
      });

      setExportMessage('PDF Downloaded successfully!');
      setTimeout(() => {
        setIsExportingPDF(false);
        setExportMessage('');
      }, 2000);
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportMessage('Failed to generate PDF.');
      setTimeout(() => setIsExportingPDF(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 animate-fadeIn">
      {/* Top Floating Control Toolbar */}
      <div className="w-full max-w-5xl bg-[#181818]/95 border border-[#D4AF37]/40 shadow-2xl rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white no-print">
        {/* Title & Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#6B1D1D] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="font-serif font-bold text-sm sm:text-base text-[#FDF5E6]">
              A4 Restaurant Menu Preview
            </h2>
            <p className="text-[11px] text-[#A8A095]">
              Print-ready high-resolution multi-page format
            </p>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-[#242424] px-2.5 py-1.5 rounded-xl border border-white/10 text-xs">
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1 hover:text-[#D4AF37] hover:bg-white/10 rounded transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <span className="w-14 text-center font-mono font-bold text-[#D4AF37] text-xs">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1 hover:text-[#D4AF37] hover:bg-white/10 rounded transition-colors"
          >
            <ZoomIn size={16} />
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-[#1f2937] hover:bg-[#374151] text-white border border-[#D4AF37]/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Printer size={15} className="text-[#D4AF37]" />
            <span className="hidden sm:inline">Print Menu</span>
            <span className="sm:hidden">Print</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className="px-4 py-2 bg-[#6B1D1D] hover:bg-[#852323] text-white border border-[#D4AF37]/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isExportingPDF ? (
              <>
                <Loader2 size={15} className="animate-spin text-[#D4AF37]" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={15} className="text-[#D4AF37]" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors ml-1 cursor-pointer"
            title="Close Preview"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Exporting Indicator Toast */}
      {exportMessage && (
        <div className="fixed top-20 z-50 bg-[#6B1D1D] text-white px-5 py-2.5 rounded-full border border-[#D4AF37] shadow-2xl flex items-center gap-2 text-xs font-medium animate-fadeIn">
          {isExportingPDF ? (
            <Loader2 size={14} className="animate-spin text-[#D4AF37]" />
          ) : (
            <CheckCircle2 size={14} className="text-green-400" />
          )}
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Scrollable Canvas Viewport */}
      <div className="flex-1 w-full overflow-auto flex justify-center py-6 px-2 sm:px-4">
        <div
          ref={printContainerRef}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="pb-16"
        >
          <MenuPrintTemplate
            id="cafelina-preview-print-target"
            menuItems={menuItems}
          />
        </div>
      </div>
    </div>
  );
};
