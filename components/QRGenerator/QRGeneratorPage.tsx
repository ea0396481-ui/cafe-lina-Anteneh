import React, { useState, useEffect, useRef } from 'react';
import {
  QRCodeType,
  QRDataState,
  QRCustomizeOptions,
  QRHistoryItem,
  ErrorCorrectionLevel,
  QRFrameStyle,
  QRDotStyle,
  QRLogoPreset,
} from '../../types/qr';
import {
  buildQRPayload,
  renderQRToCanvas,
  generateQRSVG,
} from '../../lib/qrCodeHelper';
import {
  QrCode,
  Globe,
  FileText,
  Phone,
  Mail,
  MessageSquare,
  Wifi,
  User,
  MapPin,
  UtensilsCrossed,
  Download,
  Share2,
  Copy,
  RotateCcw,
  Check,
  CheckCircle2,
  Sparkles,
  Sliders,
  Palette,
  Image as ImageIcon,
  Square,
  Circle,
  Eye,
  ExternalLink,
  Layers,
  Printer,
  ChevronDown,
} from 'lucide-react';

interface QRGeneratorPageProps {
  initialType?: QRCodeType;
  onNavigateMenu?: () => void;
}

export const QRGeneratorPage: React.FC<QRGeneratorPageProps> = ({
  initialType = 'cafelina_menu',
  onNavigateMenu,
}) => {
  // Current active QR code type
  const [activeType, setActiveType] = useState<QRCodeType>(initialType);

  // Form Data State
  const [dataState, setDataState] = useState<QRDataState>({
    url: 'https://cafelina.com',
    text: 'Welcome to Cafe Lina Luxury Coffee & Bakery. Enjoy your artisan experience!',
    phone: '+251 900 123 456',
    emailAddress: 'info@cafelina.com',
    emailSubject: 'Table Reservation & Inquiry',
    emailBody: 'Hello Cafe Lina team,\n\nI would like to make an inquiry...',
    waPhone: '+251 900 123 456',
    waMessage: 'Hello Cafe Lina! I would like to place an order or reserve a table.',
    wifiSsid: 'Cafe_Lina_Guest_WiFi',
    wifiPassword: 'ArtisanCoffee2026',
    wifiEncryption: 'WPA',
    wifiHidden: false,
    vcardFirstName: 'Lina',
    vcardLastName: 'Specialty Roastery',
    vcardPhone: '+251 900 123 456',
    vcardEmail: 'info@cafelina.com',
    vcardCompany: 'Cafe Lina Luxury Roastery & Bakery',
    vcardJobTitle: 'Artisan Guest Hospitality',
    vcardWebsite: 'https://cafelina.com',
    vcardAddress: 'Bole Road, Villa 12, Addis Ababa, Ethiopia',
    smsPhone: '+251 900 123 456',
    smsMessage: 'Hello Cafe Lina, please reserve a table for 2 guests.',
    locationMode: 'search',
    locationAddress: 'Bole Road, Addis Ababa, Ethiopia',
    locationLat: '8.9806',
    locationLng: '38.7578',
    menuUrl: window.location.origin ? `${window.location.origin}` : 'https://cafelina.com/menu',
    tableNumber: 'Table 4',
    displayMenuText: true,
  });

  // Customization Options
  const [options, setOptions] = useState<QRCustomizeOptions>({
    fgColor: '#6B1D1D', // Cafe Lina burgundy default
    bgColor: '#ffffff',
    size: 340,
    margin: 2,
    errorCorrectionLevel: 'Q',
    dotStyle: 'rounded',
    logo: 'cafelina',
    customLogoUrl: '',
    logoSizePercent: 22,
    frame: 'none',
    frameText: 'SCAN ME',
    frameBgColor: '#6B1D1D',
    frameTextColor: '#FDF5E6',
    bottomText: 'Cafe-Lina Menu',
    bottomTextFontSize: 16,
    bottomTextColor: '#1e1e1e',
  });

  // Export & UI State
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg' | 'jpg'>('png');
  const [downloadResolution, setDownloadResolution] = useState<number>(2); // 1x=340px, 2x=680px, 4x=1360px
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied_img' | 'copied_link'>('idle');
  const [shareToast, setShareToast] = useState<string>('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeCustomTab, setActiveCustomTab] = useState<'colors' | 'style' | 'logo' | 'frame'>('colors');

  // Canvas Refs
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);

  // Compute live payload string
  const currentPayload = buildQRPayload(activeType, dataState);

  // Switch presets automatically when changing QR type
  const handleTypeSelect = (type: QRCodeType) => {
    setActiveType(type);
    if (type === 'cafelina_menu') {
      setOptions((prev) => ({
        ...prev,
        fgColor: '#6B1D1D',
        logo: 'cafelina',
        bottomText: 'Cafe-Lina Menu',
        frame: 'none',
      }));
    } else if (type === 'whatsapp') {
      setOptions((prev) => ({
        ...prev,
        fgColor: '#075E54',
        logo: 'whatsapp',
        bottomText: 'Chat on WhatsApp',
      }));
    } else if (type === 'wifi') {
      setOptions((prev) => ({
        ...prev,
        fgColor: '#0369A1',
        logo: 'wifi',
        bottomText: 'Connect to Wi-Fi',
      }));
    } else if (type === 'phone' || type === 'sms') {
      setOptions((prev) => ({
        ...prev,
        logo: 'phone',
        bottomText: 'Scan to Call',
      }));
    } else if (type === 'email') {
      setOptions((prev) => ({
        ...prev,
        logo: 'email',
        bottomText: 'Send Email',
      }));
    } else if (type === 'location') {
      setOptions((prev) => ({
        ...prev,
        fgColor: '#B91C1C',
        logo: 'location',
        bottomText: 'Open in Google Maps',
      }));
    }
  };

  // Render QR Code in Canvas whenever payload or options change
  useEffect(() => {
    if (previewCanvasRef.current) {
      renderQRToCanvas(previewCanvasRef.current, currentPayload, options, 1).catch((err) =>
        console.error('Error rendering preview canvas:', err)
      );
    }
  }, [currentPayload, options]);

  // Download Handler (PNG, JPG, SVG)
  const handleDownload = async () => {
    const filename = `QRCode_${activeType}_${new Date().toISOString().split('T')[0]}`;

    if (downloadFormat === 'svg') {
      try {
        const svgString = await generateQRSVG(currentPayload, options);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.svg`;
        link.click();
        URL.revokeObjectURL(url);
        triggerToast('SVG downloaded successfully!');
      } catch (err) {
        console.error('SVG download failed:', err);
      }
      return;
    }

    // PNG or JPG high-res rendering
    if (exportCanvasRef.current) {
      await renderQRToCanvas(exportCanvasRef.current, currentPayload, options, downloadResolution);
      const mime = downloadFormat === 'jpg' ? 'image/jpeg' : 'image/png';
      const dataUrl = exportCanvasRef.current.toDataURL(mime, 0.95);

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename}.${downloadFormat}`;
      link.click();
      triggerToast(`${downloadFormat.toUpperCase()} (${downloadResolution * options.size}px) downloaded!`);
    }
  };

  // Copy Image to Clipboard
  const handleCopyQRImage = async () => {
    if (!previewCanvasRef.current) return;
    try {
      previewCanvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && navigator.clipboard.write) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setCopyStatus('copied_img');
          triggerToast('QR image copied to clipboard!');
          setTimeout(() => setCopyStatus('idle'), 2500);
        } else {
          triggerToast('Clipboard image write not supported in this browser.');
        }
      });
    } catch (err) {
      console.error('Failed to copy QR image:', err);
      triggerToast('Could not copy image. Use Download instead.');
    }
  };

  // Copy Payload Link / Text
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentPayload);
      setCopyStatus('copied_link');
      triggerToast('Link / content copied to clipboard!');
      setTimeout(() => setCopyStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Share Handler (Web Share API)
  const handleShare = async () => {
    if (navigator.share && previewCanvasRef.current) {
      previewCanvasRef.current.toBlob(async (blob) => {
        try {
          if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'qr-code.png', { type: 'image/png' })] })) {
            const file = new File([blob], 'qr-code.png', { type: 'image/png' });
            await navigator.share({
              title: 'QR Code',
              text: currentPayload,
              files: [file],
            });
            triggerToast('Shared successfully!');
          } else {
            await navigator.share({
              title: 'QR Code',
              text: currentPayload,
              url: currentPayload.startsWith('http') ? currentPayload : undefined,
            });
            triggerToast('Shared successfully!');
          }
        } catch (err) {
          // User dismissed or share failed
          if ((err as Error).name !== 'AbortError') {
            setIsShareModalOpen(true);
          }
        }
      });
    } else {
      setIsShareModalOpen(true);
    }
  };

  // Reset to default settings
  const handleReset = () => {
    setOptions({
      fgColor: '#6B1D1D',
      bgColor: '#ffffff',
      size: 340,
      margin: 2,
      errorCorrectionLevel: 'Q',
      dotStyle: 'rounded',
      logo: 'cafelina',
      customLogoUrl: '',
      logoSizePercent: 22,
      frame: 'none',
      frameText: 'SCAN ME',
      frameBgColor: '#6B1D1D',
      frameTextColor: '#FDF5E6',
      bottomText: activeType === 'cafelina_menu' ? 'Cafe-Lina Menu' : '',
      bottomTextFontSize: 16,
      bottomTextColor: '#1e1e1e',
    });
    triggerToast('QR styling reset to default.');
  };

  const triggerToast = (msg: string) => {
    setShareToast(msg);
    setTimeout(() => setShareToast(''), 3000);
  };

  // QR Types Definition
  const QR_TYPES: { id: QRCodeType; label: string; icon: any; isSpecial?: boolean }[] = [
    { id: 'cafelina_menu', label: 'Cafe-Lina Menu QR', icon: UtensilsCrossed, isSpecial: true },
    { id: 'url', label: 'Website URL', icon: Globe },
    { id: 'text', label: 'Plain Text', icon: FileText },
    { id: 'phone', label: 'Phone Call', icon: Phone },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'wifi', label: 'Wi-Fi Network', icon: Wifi },
    { id: 'vcard', label: 'Contact / vCard', icon: User },
    { id: 'sms', label: 'SMS Message', icon: MessageSquare },
    { id: 'location', label: 'Location Maps', icon: MapPin },
  ];

  const COLOR_PALETTES = [
    { name: 'Cafe Burgundy', fg: '#6B1D1D', bg: '#ffffff' },
    { name: 'Luxury Gold', fg: '#D4AF37', bg: '#181818' },
    { name: 'Classic Black', fg: '#000000', bg: '#ffffff' },
    { name: 'Midnight Navy', fg: '#1E3A8A', bg: '#ffffff' },
    { name: 'Forest Emerald', fg: '#065F46', bg: '#ffffff' },
    { name: 'Espresso Roast', fg: '#3E2723', bg: '#FFF8E1' },
    { name: 'Vibrant Violet', fg: '#6D28D9', bg: '#ffffff' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-24">
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl border border-[#D4AF37] shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 size={16} className="text-[#22C55E]" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Invisible Canvas for High-Resolution Export */}
      <canvas ref={exportCanvasRef} className="hidden" />

      {/* Header Banner */}
      <div className="bg-white border-b border-gray-200/80 pt-10 pb-8 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B1D1D]/10 text-[#6B1D1D] text-xs font-extrabold tracking-wider uppercase mb-2">
                <QrCode size={14} />
                <span>Professional QR Suite</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F172A] tracking-tight">
                High-Resolution QR Code Generator
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
                Create custom branded QR codes for your restaurant menu, Wi-Fi, business cards,
                WhatsApp, and links. Customize colors, center logo, and download print-ready files.
              </p>
            </div>

            {/* Quick Action / Preset indicator */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleTypeSelect('cafelina_menu')}
                className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
                  activeType === 'cafelina_menu'
                    ? 'bg-[#6B1D1D] text-white border-[#6B1D1D]'
                    : 'bg-white text-[#6B1D1D] border-[#6B1D1D]/40 hover:bg-[#6B1D1D]/5'
                }`}
              >
                <UtensilsCrossed size={16} className={activeType === 'cafelina_menu' ? 'text-[#D4AF37]' : ''} />
                <span>Cafe-Lina Menu Preset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Controls (Inputs & Customization), Right Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* =========================================================================
              LEFT COLUMN: TYPE SELECTOR & DYNAMIC INPUTS & CUSTOMIZATION (8 cols)
              ========================================================================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. QR Type Selector */}
            <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                <Layers size={14} className="text-[#6B1D1D]" />
                <span>Select QR Code Type</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {QR_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = activeType === t.id;

                  return (
                    <button
                      key={t.id}
                      onClick={() => handleTypeSelect(t.id)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#6B1D1D] text-white border-[#6B1D1D] shadow-md shadow-[#6B1D1D]/20 scale-[1.02]'
                          : 'bg-gray-50/70 hover:bg-gray-100/80 text-gray-700 border-gray-200/80 hover:border-gray-300'
                      }`}
                    >
                      {t.isSpecial && (
                        <span className="absolute -top-1.5 -right-1 text-[9px] bg-[#D4AF37] text-[#0F172A] font-extrabold px-1.5 py-0.2 rounded-full uppercase shadow-xs">
                          Preset
                        </span>
                      )}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
                        isSelected ? 'bg-white/15 text-[#D4AF37]' : 'bg-white text-gray-600 shadow-xs'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <span className="text-xs font-bold leading-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Dynamic Input Fields Based on Selected Type */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#6B1D1D]" />
                  <span>Configure {QR_TYPES.find((t) => t.id === activeType)?.label} Data</span>
                </h3>
                <span className="text-[11px] text-gray-400 font-mono">Updates Live</span>
              </div>

              {/* A. Cafe-Lina Menu QR */}
              {activeType === 'cafelina_menu' && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                    <UtensilsCrossed size={16} className="text-[#6B1D1D] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#6B1D1D]">Special Cafe-Lina Menu Preset</p>
                      <p className="text-[11px] text-amber-800/90 mt-0.5">
                        Guests can scan this code on their table to browse the digital menu and place orders.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Menu URL (ድረ-ገጽ አድራሻ) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={dataState.menuUrl}
                        onChange={(e) => setDataState({ ...dataState, menuUrl: e.target.value })}
                        placeholder="https://cafelina.com/menu"
                        className="flex-1 h-11 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#6B1D1D] focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setDataState({ ...dataState, menuUrl: window.location.origin })}
                        className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer"
                      >
                        Use Current App URL
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Table Number / Location (Optional)
                      </label>
                      <input
                        type="text"
                        value={dataState.tableNumber}
                        onChange={(e) => setDataState({ ...dataState, tableNumber: e.target.value })}
                        placeholder="e.g. Table 4, VIP Terrace, Bar Seat"
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs focus:outline-none focus:border-[#6B1D1D] focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Text Under QR Code
                      </label>
                      <input
                        type="text"
                        value={options.bottomText}
                        onChange={(e) => setOptions({ ...options, bottomText: e.target.value })}
                        placeholder="Cafe-Lina Menu"
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs font-bold text-[#6B1D1D] focus:outline-none focus:border-[#6B1D1D] focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* B. Website URL */}
              {activeType === 'url' && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Website URL (ድረ-ገጽ አድራሻ) *
                    </label>
                    <input
                      type="url"
                      value={dataState.url}
                      onChange={(e) => setDataState({ ...dataState, url: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-[#6B1D1D] focus:bg-white transition"
                    />
                  </div>
                  <div className="flex gap-2 text-xs">
                    {['https://cafelina.com', 'https://instagram.com', 'https://facebook.com'].map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => setDataState({ ...dataState, url: ex })}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-mono cursor-pointer"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* C. Plain Text */}
              {activeType === 'text' && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Text Message or Note (ጽሁፍ) *
                    </label>
                    <textarea
                      rows={4}
                      value={dataState.text}
                      onChange={(e) => setDataState({ ...dataState, text: e.target.value })}
                      placeholder="Type any message, note, Wi-Fi code, or coupon code..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-[#6B1D1D] focus:bg-white transition"
                    />
                    <div className="text-right text-[11px] text-gray-400 mt-1">
                      {dataState.text.length} characters
                    </div>
                  </div>
                </div>
              )}

              {/* D. Phone Call */}
              {activeType === 'phone' && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Phone Number (ስልክ ቁጥር) *
                    </label>
                    <input
                      type="tel"
                      value={dataState.phone}
                      onChange={(e) => setDataState({ ...dataState, phone: e.target.value })}
                      placeholder="+251 900 123 456"
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs font-bold text-[#6B1D1D] focus:outline-none focus:border-[#6B1D1D] focus:bg-white transition font-mono"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Scanning will prompt the user's phone to immediately dial this number.
                    </p>
                  </div>
                </div>
              )}

              {/* E. Email */}
              {activeType === 'email' && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Recipient Email (የተቀባይ ኢሜይል) *
                    </label>
                    <input
                      type="email"
                      value={dataState.emailAddress}
                      onChange={(e) => setDataState({ ...dataState, emailAddress: e.target.value })}
                      placeholder="info@cafelina.com"
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs focus:outline-none focus:border-[#6B1D1D] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Subject Line (ርዕስ)
                    </label>
                    <input
                      type="text"
                      value={dataState.emailSubject}
                      onChange={(e) => setDataState({ ...dataState, emailSubject: e.target.value })}
                      placeholder="Table Reservation & Inquiry"
                      className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs focus:outline-none focus:border-[#6B1D1D] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Email Body Message
                    </label>
                    <textarea
                      rows={2}
                      value={dataState.emailBody}
                      onChange={(e) => setDataState({ ...dataState, emailBody: e.target.value })}
                      placeholder="Pre-filled email message body..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#6B1D1D] focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              {/* F. WhatsApp */}
              {activeType === 'whatsapp' && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      WhatsApp Phone Number (with country code) *
                    </label>
                    <input
                      type="tel"
                      value={dataState.waPhone}
                      onChange={(e) => setDataState({ ...dataState, waPhone: e.target.value })}
                      placeholder="+251 900 123 456"
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs font-mono font-bold focus:outline-none focus:border-green-600 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Pre-filled Chat Message (መልእክት)
                    </label>
                    <textarea
                      rows={2}
                      value={dataState.waMessage}
                      onChange={(e) => setDataState({ ...dataState, waMessage: e.target.value })}
                      placeholder="Hello Cafe Lina! I would like to place an order or book a table."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-green-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              {/* G. Wi-Fi */}
              {activeType === 'wifi' && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Network Name (SSID) *
                      </label>
                      <input
                        type="text"
                        value={dataState.wifiSsid}
                        onChange={(e) => setDataState({ ...dataState, wifiSsid: e.target.value })}
                        placeholder="e.g. Cafe_Lina_Guest_WiFi"
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Wi-Fi Password (የዋይፋይ የይለፍ ቃል)
                      </label>
                      <input
                        type="text"
                        value={dataState.wifiPassword}
                        onChange={(e) => setDataState({ ...dataState, wifiPassword: e.target.value })}
                        placeholder="Password (or leave blank if open)"
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Encryption Type
                      </label>
                      <select
                        value={dataState.wifiEncryption}
                        onChange={(e) =>
                          setDataState({ ...dataState, wifiEncryption: e.target.value as any })
                        }
                        className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        <option value="WPA">WPA / WPA2 / WPA3 (Recommended)</option>
                        <option value="WEP">WEP (Legacy)</option>
                        <option value="nopass">None (Open Network)</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-700 font-medium">
                        <input
                          type="checkbox"
                          checked={dataState.wifiHidden}
                          onChange={(e) => setDataState({ ...dataState, wifiHidden: e.target.checked })}
                          className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                        />
                        <span>Hidden Network (የተደበቀ ኔትወርክ)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* H. Contact / vCard */}
              {activeType === 'vcard' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={dataState.vcardFirstName}
                        onChange={(e) => setDataState({ ...dataState, vcardFirstName: e.target.value })}
                        placeholder="Lina"
                        className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:outline-none focus:border-[#6B1D1D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={dataState.vcardLastName}
                        onChange={(e) => setDataState({ ...dataState, vcardLastName: e.target.value })}
                        placeholder="Roastery"
                        className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:outline-none focus:border-[#6B1D1D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={dataState.vcardPhone}
                        onChange={(e) => setDataState({ ...dataState, vcardPhone: e.target.value })}
                        placeholder="+251 900 123 456"
                        className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-mono focus:outline-none focus:border-[#6B1D1D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={dataState.vcardEmail}
                        onChange={(e) => setDataState({ ...dataState, vcardEmail: e.target.value })}
                        placeholder="info@cafelina.com"
                        className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:outline-none focus:border-[#6B1D1D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Company / Organization</label>
                      <input
                        type="text"
                        value={dataState.vcardCompany}
                        onChange={(e) => setDataState({ ...dataState, vcardCompany: e.target.value })}
                        placeholder="Cafe Lina Luxury Coffee"
                        className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:outline-none focus:border-[#6B1D1D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={dataState.vcardJobTitle}
                        onChange={(e) => setDataState({ ...dataState, vcardJobTitle: e.target.value })}
                        placeholder="Master Barista / Manager"
                        className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:outline-none focus:border-[#6B1D1D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Address (አድራሻ)</label>
                    <input
                      type="text"
                      value={dataState.vcardAddress}
                      onChange={(e) => setDataState({ ...dataState, vcardAddress: e.target.value })}
                      placeholder="Bole Road, Villa 12, Addis Ababa, Ethiopia"
                      className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:outline-none focus:border-[#6B1D1D]"
                    />
                  </div>
                </div>
              )}

              {/* I. SMS */}
              {activeType === 'sms' && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Recipient Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={dataState.smsPhone}
                      onChange={(e) => setDataState({ ...dataState, smsPhone: e.target.value })}
                      placeholder="+251 900 123 456"
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs font-mono font-bold focus:outline-none focus:border-[#6B1D1D]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      SMS Message Content (የመልእክት ጽሁፍ)
                    </label>
                    <textarea
                      rows={2}
                      value={dataState.smsMessage}
                      onChange={(e) => setDataState({ ...dataState, smsMessage: e.target.value })}
                      placeholder="Hi Cafe Lina, please reserve a table for 2 guests..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#6B1D1D]"
                    />
                  </div>
                </div>
              )}

              {/* J. Location / Google Maps */}
              {activeType === 'location' && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDataState({ ...dataState, locationMode: 'search' })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        dataState.locationMode === 'search'
                          ? 'bg-[#B91C1C] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Search Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setDataState({ ...dataState, locationMode: 'coordinates' })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        dataState.locationMode === 'coordinates'
                          ? 'bg-[#B91C1C] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      GPS Coordinates (Lat / Lng)
                    </button>
                  </div>

                  {dataState.locationMode === 'search' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Map Address or Place Name *
                      </label>
                      <input
                        type="text"
                        value={dataState.locationAddress}
                        onChange={(e) => setDataState({ ...dataState, locationAddress: e.target.value })}
                        placeholder="e.g. Bole Road, Addis Ababa, Ethiopia"
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs focus:outline-none focus:border-[#B91C1C]"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Latitude</label>
                        <input
                          type="text"
                          value={dataState.locationLat}
                          onChange={(e) => setDataState({ ...dataState, locationLat: e.target.value })}
                          placeholder="8.9806"
                          className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-mono focus:outline-none focus:border-[#B91C1C]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Longitude</label>
                        <input
                          type="text"
                          value={dataState.locationLng}
                          onChange={(e) => setDataState({ ...dataState, locationLng: e.target.value })}
                          placeholder="38.7578"
                          className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-mono focus:outline-none focus:border-[#B91C1C]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. QR Customization Tabs */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Sliders size={16} className="text-[#6B1D1D]" />
                  <span>Customize Design & Appearance</span>
                </h3>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-gray-400 hover:text-[#6B1D1D] flex items-center gap-1 cursor-pointer transition"
                >
                  <RotateCcw size={13} />
                  <span>Reset Styling</span>
                </button>
              </div>

              {/* Sub-tabs for customization */}
              <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl">
                {[
                  { id: 'colors', label: 'Colors', icon: Palette },
                  { id: 'style', label: 'Shape & Size', icon: Square },
                  { id: 'logo', label: 'Center Logo', icon: ImageIcon },
                  { id: 'frame', label: 'Frame & Label', icon: Sparkles },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeCustomTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCustomTab(tab.id as any)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#6B1D1D] shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: COLORS */}
              {activeCustomTab === 'colors' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Preset Palettes */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">
                      Luxury Color Presets
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PALETTES.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setOptions({ ...options, fgColor: p.fg, bgColor: p.bg })}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white flex items-center gap-2 text-xs font-medium cursor-pointer transition shadow-2xs hover:shadow-xs"
                        >
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-gray-300"
                            style={{ backgroundColor: p.fg }}
                          />
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Foreground / QR Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={options.fgColor}
                          onChange={(e) => setOptions({ ...options, fgColor: e.target.value })}
                          className="w-10 h-10 rounded-xl border border-gray-300 p-0.5 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={options.fgColor}
                          onChange={(e) => setOptions({ ...options, fgColor: e.target.value })}
                          className="w-28 h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-mono uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={options.bgColor === 'transparent' ? '#ffffff' : options.bgColor}
                          onChange={(e) => setOptions({ ...options, bgColor: e.target.value })}
                          className="w-10 h-10 rounded-xl border border-gray-300 p-0.5 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={options.bgColor}
                          onChange={(e) => setOptions({ ...options, bgColor: e.target.value })}
                          className="w-28 h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SHAPE & STYLE */}
              {activeCustomTab === 'style' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Module Style */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      QR Modules Style
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { id: 'rounded', label: 'Smooth Rounded', icon: Circle },
                        { id: 'dots', label: 'Circular Dots', icon: Circle },
                        { id: 'square', label: 'Classic Square', icon: Square },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setOptions({ ...options, dotStyle: s.id as QRDotStyle })}
                          className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                            options.dotStyle === s.id
                              ? 'bg-[#6B1D1D] text-white border-[#6B1D1D] shadow-xs'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          <s.icon size={16} />
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sliders: Margin & Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                        <span>Margin / Quiet Zone</span>
                        <span className="text-[#6B1D1D]">{options.margin} blocks</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={6}
                        step={1}
                        value={options.margin}
                        onChange={(e) => setOptions({ ...options, margin: Number(e.target.value) })}
                        className="w-full accent-[#6B1D1D] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                        <span>Display Preview Size</span>
                        <span className="text-[#6B1D1D]">{options.size}px</span>
                      </div>
                      <input
                        type="range"
                        min={220}
                        max={500}
                        step={20}
                        value={options.size}
                        onChange={(e) => setOptions({ ...options, size: Number(e.target.value) })}
                        className="w-full accent-[#6B1D1D] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Error Correction Level */}
                  <div className="pt-2 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Error Correction Level
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      {[
                        { id: 'L', label: 'L - Low (7%)' },
                        { id: 'M', label: 'M - Med (15%)' },
                        { id: 'Q', label: 'Q - Quartile (25%)' },
                        { id: 'H', label: 'H - High (30%)' },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() =>
                            setOptions({ ...options, errorCorrectionLevel: lvl.id as ErrorCorrectionLevel })
                          }
                          className={`py-2 rounded-xl border text-center text-[11px] font-bold transition cursor-pointer ${
                            options.errorCorrectionLevel === lvl.id
                              ? 'bg-[#6B1D1D] text-white border-[#6B1D1D]'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CENTER LOGO */}
              {activeCustomTab === 'logo' && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Center Emblem / Logo
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {[
                        { id: 'none', label: 'None' },
                        { id: 'cafelina', label: 'Cafe Lina' },
                        { id: 'whatsapp', label: 'WhatsApp' },
                        { id: 'wifi', label: 'Wi-Fi' },
                        { id: 'phone', label: 'Phone' },
                        { id: 'email', label: 'Email' },
                        { id: 'location', label: 'Maps' },
                        { id: 'custom', label: 'Custom' },
                      ].map((lg) => (
                        <button
                          key={lg.id}
                          type="button"
                          onClick={() => setOptions({ ...options, logo: lg.id as QRLogoPreset })}
                          className={`p-2 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                            options.logo === lg.id
                              ? 'bg-[#6B1D1D] text-white border-[#6B1D1D]'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {lg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {options.logo === 'custom' && (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                      <label className="block text-xs font-bold text-gray-700">
                        Upload Custom Center Image / Logo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setOptions({ ...options, customLogoUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#6B1D1D] file:text-white hover:file:bg-[#521616] cursor-pointer"
                      />
                    </div>
                  )}

                  {options.logo !== 'none' && (
                    <div>
                      <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                        <span>Center Logo Size</span>
                        <span className="text-[#6B1D1D]">{options.logoSizePercent}%</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={28}
                        value={options.logoSizePercent}
                        onChange={(e) =>
                          setOptions({ ...options, logoSizePercent: Number(e.target.value) })
                        }
                        className="w-full accent-[#6B1D1D] cursor-pointer"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        High error-correction (Level H) automatically active to guarantee readability.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: FRAME & LABELS */}
              {activeCustomTab === 'frame' && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Decorative Frame Style
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        { id: 'none', label: 'No Frame' },
                        { id: 'badge-top', label: 'SCAN ME Top' },
                        { id: 'badge-bottom', label: 'SCAN ME Bottom' },
                        { id: 'border', label: 'Crisp Border' },
                        { id: 'luxury-gold', label: 'Luxury Gold' },
                        { id: 'polaroid', label: 'Polaroid Card' },
                      ].map((fr) => (
                        <button
                          key={fr.id}
                          type="button"
                          onClick={() => setOptions({ ...options, frame: fr.id as QRFrameStyle })}
                          className={`p-2.5 rounded-xl border font-bold text-center transition cursor-pointer ${
                            options.frame === fr.id
                              ? 'bg-[#6B1D1D] text-white border-[#6B1D1D]'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {fr.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {options.frame !== 'none' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Frame Header / Badge Text
                        </label>
                        <input
                          type="text"
                          value={options.frameText}
                          onChange={(e) => setOptions({ ...options, frameText: e.target.value })}
                          placeholder="SCAN ME"
                          className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-bold uppercase focus:outline-none focus:border-[#6B1D1D]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Badge Background Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={options.frameBgColor}
                            onChange={(e) => setOptions({ ...options, frameBgColor: e.target.value })}
                            className="w-10 h-10 rounded-xl border border-gray-300 p-0.5 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={options.frameBgColor}
                            onChange={(e) => setOptions({ ...options, frameBgColor: e.target.value })}
                            className="w-24 h-10 bg-gray-50 border border-gray-200 rounded-xl px-2 text-xs font-mono uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Text Setting */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <label className="block text-xs font-bold text-gray-700">
                      Text Below QR Code (e.g. "Cafe-Lina Menu")
                    </label>
                    <input
                      type="text"
                      value={options.bottomText}
                      onChange={(e) => setOptions({ ...options, bottomText: e.target.value })}
                      placeholder="e.g. Cafe-Lina Menu, Scan to Order, Free Guest WiFi"
                      className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-serif font-bold text-[#6B1D1D] focus:outline-none focus:border-[#6B1D1D]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: LIVE PREVIEW & ACTIONS (STICKY, 5 cols)
              ========================================================================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-5">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-md shadow-gray-200/50 space-y-5">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                    Live Real-Time Preview
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Ready to Scan
                </span>
              </div>

              {/* Canvas QR Code Box with Soft Shadow */}
              <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50/80 to-gray-100/50 rounded-2xl border border-dashed border-gray-200 min-h-[360px] overflow-hidden">
                <canvas
                  ref={previewCanvasRef}
                  className="max-w-full drop-shadow-md rounded-xl transition-all"
                />
              </div>

              {/* Payload Preview */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono text-gray-600 break-all leading-snug max-h-20 overflow-y-auto">
                <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">
                  Decoded Content:
                </span>
                {currentPayload}
              </div>

              {/* Download Controls */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Format</label>
                    <div className="flex rounded-xl bg-gray-100 p-1">
                      {(['png', 'svg', 'jpg'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setDownloadFormat(fmt)}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                            downloadFormat === fmt
                              ? 'bg-white text-[#6B1D1D] shadow-xs'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Print Quality</label>
                    <select
                      value={downloadResolution}
                      onChange={(e) => setDownloadResolution(Number(e.target.value))}
                      className="w-full h-[34px] bg-gray-100 border border-transparent rounded-xl px-2.5 text-xs font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value={1}>Standard ({options.size}px)</option>
                      <option value={2}>High-Res 2X ({options.size * 2}px)</option>
                      <option value={4}>Print Ultra 4X ({options.size * 4}px)</option>
                    </select>
                  </div>
                </div>

                {/* Primary Download Button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full h-12 bg-[#6B1D1D] hover:bg-[#852323] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#6B1D1D]/25 active:scale-95 cursor-pointer"
                >
                  <Download size={16} className="text-[#D4AF37]" />
                  <span>Download {downloadFormat.toUpperCase()} ({downloadResolution}X Resolution)</span>
                </button>
              </div>

              {/* Secondary Actions: Share, Copy Image, Copy Link */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="py-2.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  title="Share QR Code"
                >
                  <Share2 size={14} className="text-[#6B1D1D]" />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyQRImage}
                  className="py-2.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  title="Copy QR Image to Clipboard"
                >
                  {copyStatus === 'copied_img' ? (
                    <Check size={14} className="text-green-600" />
                  ) : (
                    <Copy size={14} className="text-[#6B1D1D]" />
                  )}
                  <span>{copyStatus === 'copied_img' ? 'Copied!' : 'Copy QR'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  title="Copy link / content to clipboard"
                >
                  {copyStatus === 'copied_link' ? (
                    <Check size={14} className="text-green-600" />
                  ) : (
                    <ExternalLink size={14} className="text-[#6B1D1D]" />
                  )}
                  <span>{copyStatus === 'copied_link' ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Quick Cafe-Lina Features Tip Card */}
            <div className="bg-gradient-to-r from-[#6B1D1D]/10 via-[#D4AF37]/15 to-[#6B1D1D]/10 p-5 rounded-3xl border border-[#D4AF37]/40 space-y-2">
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={16} className="text-[#6B1D1D]" />
                <h4 className="text-xs font-extrabold text-[#6B1D1D] uppercase tracking-wider">
                  Restaurant Table Tent Best Practices
                </h4>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                For printed table stands and acrylic holders, select <strong>Ultra 4X Print Quality</strong> and choose <strong>PNG</strong> or <strong>SVG</strong>.
                The 30% Error Correction (Level H) ensures reliable scanning under ambient candlelight or cafe lighting.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal Fallback */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-200 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Share2 size={16} className="text-[#6B1D1D]" />
                <span>Share QR Code</span>
              </h4>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Share the QR code or link with your guests, team, or customers:
            </p>

            <div className="space-y-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Check out this QR code for: ${currentPayload}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                Share via WhatsApp
              </a>

              <a
                href={`mailto:?subject=${encodeURIComponent('QR Code Link')}&body=${encodeURIComponent(
                  currentPayload
                )}`}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                Share via Email
              </a>

              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Copy size={14} />
                <span>Copy Payload Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
