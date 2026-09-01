import {
  X,
  RotateCcw,
  Sun,
  Moon,
  Layout,
  AlignLeft,
  AlignRight,
  Maximize2,
  Minimize2,
  Palette,
  Columns,
  Rows,
} from 'lucide-react';
import {
  useTheme,
  COLOR_PRESETS,
  BG_PRESETS_DARK,
  BG_PRESETS_LIGHT,
} from '../context/ThemeContext';

export default function CustomizerDrawer() {
  const {
    isCustomizerOpen,
    setIsCustomizerOpen,
    theme,
    primaryColor,
    bgColor,
    navStyle,
    direction,
    headerStyle,
    menuStyle,
    layoutWidth,
    updateSetting,
    resetSettings,
  } = useTheme();

  if (!isCustomizerOpen) return null;

  const currentBgPresets = theme === 'dark' ? BG_PRESETS_DARK : BG_PRESETS_LIGHT;

  return (
    <>
      <div
        className="customizer-backdrop"
        onClick={() => setIsCustomizerOpen(false)}
      />
      <aside className="customizer-panel">
        {/* Drawer Header */}
        <div className="customizer-header">
          <div className="customizer-title">
            <Palette size={20} color="var(--primary)" />
            <span>Theme & UI Customizer</span>
          </div>
          <button
            className="header-icon-btn"
            onClick={() => setIsCustomizerOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="customizer-body">
          {/* 1. Theme Style (Dark / Light) */}
          <div className="customizer-section">
            <span className="customizer-label">1. Theme Style</span>
            <div className="radio-group-grid">
              <button
                className={`customizer-card-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => updateSetting('theme', 'dark')}
              >
                <Moon size={16} />
                <span>Dark Theme</span>
              </button>
              <button
                className={`customizer-card-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => updateSetting('theme', 'light')}
              >
                <Sun size={16} />
                <span>Light Theme</span>
              </button>
            </div>
          </div>

          {/* 2. Theme Primary Color */}
          <div className="customizer-section">
            <span className="customizer-label">2. Primary Accent Color</span>
            <div className="color-swatches-grid">
              {COLOR_PRESETS.map((p) => {
                const colorVal = theme === 'dark' ? p.color : p.lightColor;
                return (
                  <button
                    key={p.name}
                    className={`color-swatch ${primaryColor.toLowerCase() === colorVal.toLowerCase() ? 'active' : ''}`}
                    style={{ backgroundColor: colorVal }}
                    title={p.name}
                    onClick={() => updateSetting('primaryColor', colorVal)}
                  />
                );
              })}
            </div>
            <div className="color-picker-row">
              <span>Custom Hex Accent</span>
              <input
                type="color"
                className="color-picker-input"
                value={primaryColor}
                onChange={(e) => updateSetting('primaryColor', e.target.value)}
              />
            </div>
          </div>

          {/* 3. Background Color Presets */}
          <div className="customizer-section">
            <span className="customizer-label">3. Background Canvas Tone</span>
            <div className="radio-group-grid">
              {currentBgPresets.map((bg) => (
                <button
                  key={bg.name}
                  className={`customizer-card-btn ${bgColor === bg.color ? 'active' : ''}`}
                  onClick={() => updateSetting('bgColor', bg.color)}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: bg.color,
                      border: '1px solid var(--border-base)',
                    }}
                  />
                  <span>{bg.name}</span>
                </button>
              ))}
            </div>
            <div className="color-picker-row">
              <span>Custom Canvas Tone</span>
              <input
                type="color"
                className="color-picker-input"
                value={bgColor}
                onChange={(e) => updateSetting('bgColor', e.target.value)}
              />
            </div>
          </div>

          {/* 4. Navigation Style (Vertical, Horizontal Click, Horizontal Hover) */}
          <div className="customizer-section">
            <span className="customizer-label">4. Navigation Style</span>
            <div className="radio-group-grid three-col">
              <button
                className={`customizer-card-btn ${navStyle === 'vertical' ? 'active' : ''}`}
                onClick={() => updateSetting('navStyle', 'vertical')}
              >
                <Columns size={16} />
                <span>Vertical</span>
              </button>
              <button
                className={`customizer-card-btn ${navStyle === 'horizontal-click' ? 'active' : ''}`}
                onClick={() => updateSetting('navStyle', 'horizontal-click')}
              >
                <Rows size={16} />
                <span>H-Click</span>
              </button>
              <button
                className={`customizer-card-btn ${navStyle === 'horizontal-hover' ? 'active' : ''}`}
                onClick={() => updateSetting('navStyle', 'horizontal-hover')}
              >
                <Layout size={16} />
                <span>H-Hover</span>
              </button>
            </div>
          </div>

          {/* 5. Layout Direction (LTR vs RTL) */}
          <div className="customizer-section">
            <span className="customizer-label">5. Layout Direction (LTR / RTL)</span>
            <div className="radio-group-grid">
              <button
                className={`customizer-card-btn ${direction === 'ltr' ? 'active' : ''}`}
                onClick={() => updateSetting('direction', 'ltr')}
              >
                <AlignLeft size={16} />
                <span>LTR Mode</span>
              </button>
              <button
                className={`customizer-card-btn ${direction === 'rtl' ? 'active' : ''}`}
                onClick={() => updateSetting('direction', 'rtl')}
              >
                <AlignRight size={16} />
                <span>RTL Mode</span>
              </button>
            </div>
          </div>

          {/* 6. Header Styles (Light, Color, Dark, Gradient) */}
          <div className="customizer-section">
            <span className="customizer-label">6. Header Style</span>
            <div className="radio-group-grid">
              {['dark', 'light', 'color', 'gradient'].map((style) => (
                <button
                  key={style}
                  className={`customizer-card-btn ${headerStyle === style ? 'active' : ''}`}
                  onClick={() => updateSetting('headerStyle', style)}
                >
                  <span style={{ textTransform: 'capitalize' }}>{style} Header</span>
                </button>
              ))}
            </div>
          </div>

          {/* 7. Menu Styles (Light, Color, Dark, Gradient) */}
          <div className="customizer-section">
            <span className="customizer-label">7. Menu Sidebar Style</span>
            <div className="radio-group-grid">
              {['dark', 'light', 'color', 'gradient'].map((style) => (
                <button
                  key={style}
                  className={`customizer-card-btn ${menuStyle === style ? 'active' : ''}`}
                  onClick={() => updateSetting('menuStyle', style)}
                >
                  <span style={{ textTransform: 'capitalize' }}>{style} Menu</span>
                </button>
              ))}
            </div>
          </div>

          {/* 8. Layout Width (Full / Boxed) */}
          <div className="customizer-section">
            <span className="customizer-label">8. Layout Width Style</span>
            <div className="radio-group-grid">
              <button
                className={`customizer-card-btn ${layoutWidth === 'full' ? 'active' : ''}`}
                onClick={() => updateSetting('layoutWidth', 'full')}
              >
                <Maximize2 size={16} />
                <span>Full Width</span>
              </button>
              <button
                className={`customizer-card-btn ${layoutWidth === 'boxed' ? 'active' : ''}`}
                onClick={() => updateSetting('layoutWidth', 'boxed')}
              >
                <Minimize2 size={16} />
                <span>Boxed Width</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="customizer-footer">
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={resetSettings}
          >
            <RotateCcw size={14} />
            Reset to Default Settings
          </button>
        </div>
      </aside>
    </>
  );
}
