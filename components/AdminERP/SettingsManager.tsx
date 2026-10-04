import React, { useState, useEffect } from 'react';
import { Save, Palette, RefreshCw, CheckCircle2, Sliders, Moon, Sun, Layout, Sparkles } from 'lucide-react';
import { ThemeConfig, DEFAULT_THEME, PRESET_THEMES, loadSavedTheme, saveThemeLocally, applyThemeToDocument } from '../../lib/theme';

export const SettingsManager: React.FC = () => {
  const [storeName, setStoreName] = useState('Cafe Lina');
  const [currency, setCurrency] = useState('ETB');
  const [branch, setBranch] = useState('Bole Road Flagship, Addis Ababa');
  const [phone, setPhone] = useState('+251 900 123 456');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Theme Management state
  const [theme, setTheme] = useState<ThemeConfig>(loadSavedTheme());
  const [themeSaved, setThemeSaved] = useState(false);

  // Apply theme in real time as user edits
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    saveThemeLocally(theme);
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 3000);
  };

  const handlePresetSelect = (presetTheme: ThemeConfig) => {
    setTheme(presetTheme);
    saveThemeLocally(presetTheme);
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 3000);
  };

  const handleResetDefault = () => {
    setTheme(DEFAULT_THEME);
    saveThemeLocally(DEFAULT_THEME);
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 3000);
  };

  const updateThemeField = (key: keyof ThemeConfig, value: string) => {
    setTheme((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl">
      {/* Header */}
      <div className="pb-4 border-b border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
          System Administration
        </span>
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mt-2">System & Theme Customization</h1>
        <p className="text-xs text-[#CBD5E1] mt-1">Configure store metadata, color themes, live brand palettes, and UI properties</p>
      </div>

      {/* SECTION 1: DYNAMIC THEME MANAGEMENT */}
      <div className="bg-[#243244] p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-8 text-xs text-[#F8FAFC]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-[#F8FAFC]">
              <Palette size={22} className="text-[#D4AF37]" />
              <h2>Theme & Palette Customization</h2>
            </div>
            <p className="text-xs text-[#CBD5E1] mt-0.5">Customize global colors, surfaces, and typography across the POS and Admin ERP</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-4 py-2 bg-[#1E293B] hover:bg-[#2F4158] text-[#CBD5E1] border border-white/10 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw size={14} /> Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleSaveTheme}
              className="px-5 py-2 bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] rounded-xl font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Save size={14} /> Save Theme
            </button>
          </div>
        </div>

        {/* Preset Theme Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block flex items-center gap-1.5">
            <Sparkles size={14} /> Recommended Luxury Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRESET_THEMES.map((pt) => (
              <button
                key={pt.id}
                type="button"
                onClick={() => handlePresetSelect(pt.theme)}
                className="p-4 rounded-[16px] bg-[#1E293B] hover:bg-[#2F4158] border border-white/10 text-left transition-all cursor-pointer group hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#F8FAFC] text-xs group-hover:text-[#D4AF37] transition-colors">{pt.name}</span>
                </div>
                {/* Palette swatch bar */}
                <div className="flex h-3 rounded-full overflow-hidden border border-white/10">
                  <div className="flex-1" style={{ backgroundColor: pt.theme.backgroundColor }} title="Bg" />
                  <div className="flex-1" style={{ backgroundColor: pt.theme.sidebarColor }} title="Sidebar" />
                  <div className="flex-1" style={{ backgroundColor: pt.theme.cardColor }} title="Card" />
                  <div className="flex-1" style={{ backgroundColor: pt.theme.goldColor }} title="Gold" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette Grid */}
        <div className="space-y-4 pt-2">
          <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block flex items-center gap-1.5">
            <Sliders size={14} /> Color System Controls
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Main Background */}
            <div className="p-4 bg-[#1E293B] rounded-[16px] border border-white/10 space-y-2">
              <span className="font-bold text-[#F8FAFC] block">Main Background</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme.backgroundColor}
                  onChange={(e) => updateThemeField('backgroundColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={theme.backgroundColor}
                  onChange={(e) => updateThemeField('backgroundColor', e.target.value)}
                  className="flex-1 bg-[#243244] text-[#F8FAFC] px-3 py-2 rounded-xl border border-white/10 font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Sidebar Background */}
            <div className="p-4 bg-[#1E293B] rounded-[16px] border border-white/10 space-y-2">
              <span className="font-bold text-[#F8FAFC] block">Sidebar Background</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme.sidebarColor}
                  onChange={(e) => updateThemeField('sidebarColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={theme.sidebarColor}
                  onChange={(e) => updateThemeField('sidebarColor', e.target.value)}
                  className="flex-1 bg-[#243244] text-[#F8FAFC] px-3 py-2 rounded-xl border border-white/10 font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Card Background */}
            <div className="p-4 bg-[#1E293B] rounded-[16px] border border-white/10 space-y-2">
              <span className="font-bold text-[#F8FAFC] block">Card Surface</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme.cardColor}
                  onChange={(e) => updateThemeField('cardColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={theme.cardColor}
                  onChange={(e) => updateThemeField('cardColor', e.target.value)}
                  className="flex-1 bg-[#243244] text-[#F8FAFC] px-3 py-2 rounded-xl border border-white/10 font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Primary Gold */}
            <div className="p-4 bg-[#1E293B] rounded-[16px] border border-white/10 space-y-2">
              <span className="font-bold text-[#F8FAFC] block">Primary Gold Accent</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => updateThemeField('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={theme.primaryColor}
                  onChange={(e) => updateThemeField('primaryColor', e.target.value)}
                  className="flex-1 bg-[#243244] text-[#F8FAFC] px-3 py-2 rounded-xl border border-white/10 font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Accent Gold */}
            <div className="p-4 bg-[#1E293B] rounded-[16px] border border-white/10 space-y-2">
              <span className="font-bold text-[#F8FAFC] block">Highlight Gold</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme.secondaryColor}
                  onChange={(e) => updateThemeField('secondaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={theme.secondaryColor}
                  onChange={(e) => updateThemeField('secondaryColor', e.target.value)}
                  className="flex-1 bg-[#243244] text-[#F8FAFC] px-3 py-2 rounded-xl border border-white/10 font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Primary Text */}
            <div className="p-4 bg-[#1E293B] rounded-[16px] border border-white/10 space-y-2">
              <span className="font-bold text-[#F8FAFC] block">Primary Text</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme.textColor}
                  onChange={(e) => updateThemeField('textColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={theme.textColor}
                  onChange={(e) => updateThemeField('textColor', e.target.value)}
                  className="flex-1 bg-[#243244] text-[#F8FAFC] px-3 py-2 rounded-xl border border-white/10 font-mono text-xs uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Theme Component Preview */}
        <div className="p-6 bg-[#1E293B] rounded-[20px] border border-white/10 space-y-4">
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block flex items-center gap-1.5">
            <Layout size={14} /> Live Interface Component Preview
          </span>

          <div className="p-6 rounded-[20px] border space-y-4" style={{ backgroundColor: theme.cardColor, borderColor: theme.borderColor }}>
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest block" style={{ color: theme.primaryColor }}>
                  Sample Card Header
                </span>
                <h3 className="text-lg font-bold font-serif" style={{ color: theme.textColor }}>
                  Yirgacheffe Special Roast
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${theme.successColor}20`, color: theme.successColor, border: `1px solid ${theme.successColor}40` }}>
                In Stock
              </span>
            </div>

            <p className="text-xs" style={{ color: theme.secondaryTextColor }}>
              This component dynamically reflects your live theme palette selections in real-time.
            </p>

            <div className="flex items-center justify-between pt-2">
              <span className="text-lg font-bold" style={{ color: theme.primaryColor }}>
                250.00 ETB
              </span>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                style={{ backgroundColor: theme.primaryColor, color: theme.backgroundColor }}
              >
                Add To Order
              </button>
            </div>
          </div>
        </div>

        {themeSaved && (
          <div className="flex items-center gap-2 text-[#22C55E] font-bold text-xs bg-[#22C55E]/10 p-3 rounded-xl border border-[#22C55E]/30 animate-fadeIn">
            <CheckCircle2 size={16} />
            <span>Theme settings saved and applied dynamically across every page!</span>
          </div>
        )}
      </div>

      {/* SECTION 2: BRANDING & SYSTEM CONFIGURATION */}
      <form onSubmit={handleSaveStore} className="bg-[#243244] p-8 rounded-[22px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-8 text-xs text-[#F8FAFC]">
        {/* Branding Section */}
        <div className="space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h2 className="font-bold text-base text-[#F8FAFC]">Branding & Location Settings</h2>
            <p className="text-xs text-[#CBD5E1]">Primary enterprise metadata</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[#CBD5E1] font-bold block">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full h-[56px] bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-[16px] px-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[#CBD5E1] font-bold block">Active Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-[56px] bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-[16px] px-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[#CBD5E1] font-bold block">Default Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-[56px] bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-[16px] px-4 text-sm font-bold focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all cursor-pointer"
              >
                <option value="ETB" className="bg-[#1E293B]">ETB (Ethiopian Birr)</option>
                <option value="USD" className="bg-[#1E293B]">USD ($)</option>
                <option value="EUR" className="bg-[#1E293B]">EUR (€)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#CBD5E1] font-bold block">Hotline Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-[56px] bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-[16px] px-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* SEO & Metadata Section */}
        <div className="space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h2 className="font-bold text-base text-[#F8FAFC]">SEO & Web Metadata</h2>
            <p className="text-xs text-[#CBD5E1]">Public search engine configuration</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[#CBD5E1] font-bold block">Meta Title</label>
              <input
                type="text"
                defaultValue="Cafe Lina - Luxury Specialty Coffee & Bakery in Addis Ababa"
                className="w-full h-[56px] bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-[16px] px-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[#CBD5E1] font-bold block">Meta Description</label>
              <textarea
                rows={3}
                defaultValue="Enjoy single-origin Ethiopian Yirgacheffe coffee, artisanal croissants, and gourmet breakfast platters at Cafe Lina."
                className="w-full bg-[#1E293B] text-[#F8FAFC] border border-white/10 rounded-[16px] p-4 text-sm font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between gap-4">
          <button
            type="submit"
            className="h-[52px] bg-[#D4AF37] hover:bg-[#F6C453] text-[#0F172A] px-8 rounded-[16px] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Save size={18} /> Save Store Configuration
          </button>

          {savedSuccess && (
            <span className="text-[#22C55E] font-bold text-xs animate-fadeIn flex items-center gap-1.5">
              <CheckCircle2 size={16} /> System settings successfully updated!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

