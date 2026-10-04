export interface ThemeConfig {
  mode: 'dark' | 'light' | 'system';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  goldColor: string;
  backgroundColor: string;
  sidebarColor: string;
  surfaceColor: string;
  cardColor: string;
  hoverColor: string;
  buttonColor: string;
  textColor: string;
  secondaryTextColor: string;
  mutedTextColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  infoColor: string;
  borderRadius: string;
  shadowStrength: string;
}

export const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  primaryColor: '#D4AF37',
  secondaryColor: '#F6C453',
  accentColor: '#F6C453',
  goldColor: '#D4AF37',
  backgroundColor: '#0F172A',
  sidebarColor: '#111827',
  surfaceColor: '#1E293B',
  cardColor: '#243244',
  hoverColor: '#2F4158',
  buttonColor: '#D4AF37',
  textColor: '#F8FAFC',
  secondaryTextColor: '#CBD5E1',
  mutedTextColor: '#94A3B8',
  borderColor: 'rgba(255,255,255,0.08)',
  successColor: '#22C55E',
  warningColor: '#F59E0B',
  dangerColor: '#EF4444',
  infoColor: '#3B82F6',
  borderRadius: '22px',
  shadowStrength: '0 12px 30px rgba(0,0,0,0.35)',
};

export const PRESET_THEMES: { name: string; id: string; theme: ThemeConfig }[] = [
  {
    name: 'Dark Luxury Coffee (Default)',
    id: 'dark-luxury',
    theme: DEFAULT_THEME,
  },
  {
    name: 'Obsidian Noir & Gold',
    id: 'obsidian-gold',
    theme: {
      ...DEFAULT_THEME,
      backgroundColor: '#0B0C10',
      sidebarColor: '#12141C',
      surfaceColor: '#1A1D26',
      cardColor: '#222634',
      hoverColor: '#2C3144',
      primaryColor: '#E5C158',
      goldColor: '#E5C158',
      accentColor: '#FFD700',
      buttonColor: '#E5C158',
      textColor: '#FFFFFF',
      secondaryTextColor: '#E2E8F0',
      mutedTextColor: '#A0AEC0',
      borderColor: 'rgba(229,193,88,0.18)',
    },
  },
  {
    name: 'Espresso Roast & Cream',
    id: 'espresso-roast',
    theme: {
      ...DEFAULT_THEME,
      backgroundColor: '#120E0C',
      sidebarColor: '#1A1412',
      surfaceColor: '#241C19',
      cardColor: '#2E2521',
      hoverColor: '#3D312C',
      primaryColor: '#C99700',
      goldColor: '#C99700',
      accentColor: '#E5B842',
      buttonColor: '#C99700',
      textColor: '#FDFBF7',
      secondaryTextColor: '#E8E2D8',
      mutedTextColor: '#B5AAA0',
      borderColor: 'rgba(201,151,0,0.2)',
    },
  },
  {
    name: 'Midnight Emerald & Bronze',
    id: 'emerald-bronze',
    theme: {
      ...DEFAULT_THEME,
      backgroundColor: '#091A18',
      sidebarColor: '#0F2623',
      surfaceColor: '#15332F',
      cardColor: '#1D403C',
      hoverColor: '#27524D',
      primaryColor: '#D4AF37',
      goldColor: '#D4AF37',
      accentColor: '#E6C35C',
      buttonColor: '#D4AF37',
      textColor: '#F0FAF8',
      secondaryTextColor: '#C0E0DC',
      mutedTextColor: '#82B0AB',
      borderColor: 'rgba(212,175,55,0.2)',
    },
  },
];

const LOCAL_STORAGE_KEY = 'cafelina_custom_theme_v1';

export function applyThemeToDocument(theme: ThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primaryColor);
  root.style.setProperty('--secondary', theme.secondaryColor);
  root.style.setProperty('--accent', theme.accentColor);
  root.style.setProperty('--gold', theme.goldColor);
  root.style.setProperty('--background', theme.backgroundColor);
  root.style.setProperty('--sidebar', theme.sidebarColor);
  root.style.setProperty('--surface', theme.surfaceColor);
  root.style.setProperty('--card', theme.cardColor);
  root.style.setProperty('--hover', theme.hoverColor);
  root.style.setProperty('--button', theme.buttonColor);
  root.style.setProperty('--text', theme.textColor);
  root.style.setProperty('--text-secondary', theme.secondaryTextColor);
  root.style.setProperty('--text-muted', theme.mutedTextColor);
  root.style.setProperty('--border', theme.borderColor);
  root.style.setProperty('--success', theme.successColor);
  root.style.setProperty('--warning', theme.warningColor);
  root.style.setProperty('--danger', theme.dangerColor);
  root.style.setProperty('--info', theme.infoColor);
  root.style.setProperty('--radius', theme.borderRadius);
  root.style.setProperty('--shadow', theme.shadowStrength);

  // Apply dark/light attribute to html element
  if (theme.mode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else if (theme.mode === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isSystemDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }
}

export function loadSavedTheme(): ThemeConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_THEME, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load theme from localStorage:', e);
  }
  return DEFAULT_THEME;
}

export function saveThemeLocally(theme: ThemeConfig) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(theme));
    applyThemeToDocument(theme);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }));
  } catch (e) {
    console.error('Failed to save theme to localStorage:', e);
  }
}
