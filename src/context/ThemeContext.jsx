import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const DEFAULT_SETTINGS = {
  theme: 'dark', // 'dark' | 'light'
  primaryColor: '#C8FF00', // Default vibrant Lime for dark, auto switches to Electric Blue in light if default
  bgColor: '#080808', // Dark background canvas
  navStyle: 'vertical', // 'vertical' | 'horizontal-click' | 'horizontal-hover'
  direction: 'ltr', // 'ltr' | 'rtl'
  headerStyle: 'auto', // 'auto' | 'light' | 'color' | 'dark' | 'gradient'
  menuStyle: 'auto', // 'auto' | 'light' | 'color' | 'dark' | 'gradient'
  layoutWidth: 'full', // 'full' | 'boxed'
};

export const COLOR_PRESETS = [
  { name: 'Neon Lime', color: '#C8FF00', lightColor: '#0066FF' },
  { name: 'Electric Cyan', color: '#00F0FF', lightColor: '#0284C7' },
  { name: 'Cyberpunk Orange', color: '#FF6B00', lightColor: '#EA580C' },
  { name: 'Royal Purple', color: '#A855F7', lightColor: '#7C3AED' },
  { name: 'Crimson Red', color: '#FF2E51', lightColor: '#E11D48' },
  { name: 'Emerald Green', color: '#10B981', lightColor: '#059669' },
  { name: 'Gold Amber', color: '#F59E0B', lightColor: '#D97706' },
];

export const BG_PRESETS_DARK = [
  { name: 'Pitch Black', color: '#080808' },
  { name: 'Midnight Charcoal', color: '#0F1117' },
  { name: 'Deep Slate', color: '#111827' },
  { name: 'Abyss Navy', color: '#090D16' },
];

export const BG_PRESETS_LIGHT = [
  { name: 'Clean White', color: '#F8FAFC' },
  { name: 'Warm Cream', color: '#FDFBF7' },
  { name: 'Soft Gray', color: '#F1F5F9' },
  { name: 'Cool Ice', color: '#F0F9FF' },
];

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('fitlife-theme-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean legacy hardcoded 'dark' header/menu styles so Light theme is never stuck
        if (parsed.headerStyle === 'dark' && parsed.theme === 'light') {
          parsed.headerStyle = 'auto';
        }
        if (parsed.menuStyle === 'dark' && parsed.theme === 'light') {
          parsed.menuStyle = 'auto';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.error('Failed to parse theme settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    // Apply data attributes
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('dir', settings.direction);
    root.setAttribute('data-nav', settings.navStyle);
    root.setAttribute('data-header', settings.headerStyle);
    root.setAttribute('data-menu', settings.menuStyle);
    root.setAttribute('data-layout', settings.layoutWidth);

    // Apply Dynamic CSS Variables
    root.style.setProperty('--primary', settings.primaryColor);
    root.style.setProperty('--primary-glow', `${settings.primaryColor}33`);
    root.style.setProperty('--primary-hover', `${settings.primaryColor}E6`);

    if (settings.theme === 'dark') {
      root.style.setProperty('--bg-base', settings.bgColor || '#080808');
      root.style.setProperty('--bg-card', '#141416');
      root.style.setProperty('--bg-surface', '#1B1B1F');
      root.style.setProperty('--bg-input', '#101012');
      root.style.setProperty('--border-base', '#26262B');
      root.style.setProperty('--border-light', '#33333A');
      root.style.setProperty('--text-primary', '#FFFFFF');
      root.style.setProperty('--text-secondary', '#94A3B8');
      root.style.setProperty('--text-muted', '#64748B');
    } else {
      root.style.setProperty('--bg-base', settings.bgColor || '#F8FAFC');
      root.style.setProperty('--bg-card', '#FFFFFF');
      root.style.setProperty('--bg-surface', '#F1F5F9');
      root.style.setProperty('--bg-input', '#F8FAFC');
      root.style.setProperty('--border-base', '#E2E8F0');
      root.style.setProperty('--border-light', '#CBD5E1');
      root.style.setProperty('--text-primary', '#0F172A');
      root.style.setProperty('--text-secondary', '#475569');
      root.style.setProperty('--text-muted', '#64748B');
    }

    localStorage.setItem('fitlife-theme-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };

      // Dynamic adjustments when switching theme between Light & Dark
      if (key === 'theme') {
        if (value === 'dark') {
          if (prev.bgColor === '#F8FAFC' || prev.bgColor === '#FFFFFF' || !prev.bgColor) {
            updated.bgColor = '#080808';
          }
          if (prev.primaryColor === '#0066FF') {
            updated.primaryColor = '#C8FF00';
          }
          // If header/menu were auto or tied to light, reset to auto for dark
          if (prev.headerStyle === 'light') updated.headerStyle = 'auto';
          if (prev.menuStyle === 'light') updated.menuStyle = 'auto';
        } else if (value === 'light') {
          if (prev.bgColor === '#080808' || prev.bgColor === '#0F1117' || !prev.bgColor) {
            updated.bgColor = '#F8FAFC';
          }
          if (prev.primaryColor === '#C8FF00') {
            updated.primaryColor = '#0066FF';
          }
          // Clear any rigid dark overrides so header and sidebar turn light immediately
          if (prev.headerStyle === 'dark') updated.headerStyle = 'auto';
          if (prev.menuStyle === 'dark') updated.menuStyle = 'auto';
        }
      }
      return updated;
    });
  };

  const toggleTheme = () => {
    updateSetting('theme', settings.theme === 'dark' ? 'light' : 'dark');
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <ThemeContext.Provider
      value={{
        ...settings,
        settings,
        updateSetting,
        toggleTheme,
        resetSettings,
        isCustomizerOpen,
        setIsCustomizerOpen,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
