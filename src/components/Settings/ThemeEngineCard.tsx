import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { PaletteTheme, ThemeCategory, THEMES_2026 } from '../../App';

export interface ThemeEngineCardProps {
  theme: PaletteTheme;
  currentThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

export const ThemeEngineCard: React.FC<ThemeEngineCardProps> = React.memo(({
  theme,
  currentThemeId,
  onSelectTheme,
}) => {
  const [activeThemeCategory, setActiveThemeCategory] = useState<ThemeCategory>('Dark & Monochromatic');

  const currentCategoryThemes = Object.values(THEMES_2026).filter(
    (t) => t.category === activeThemeCategory
  );

  return (
    <div
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderLuminous,
      }}
      className="liquid-glass rounded-3xl p-6 border select-none"
    >
      <div
        style={{ borderColor: theme.borderLuminous }}
        className="flex items-center justify-between pb-4 mb-4 border-b"
      >
        <div>
          <h3 style={{ color: theme.textPrimary }} className="text-lg font-black">
            موتور پوسته ۱۲گانه Cyber-Luxe 2026
          </h3>
          <p style={{ color: theme.textSecondary }} className="text-xs font-semibold mt-0.5">
            انتخاب از بین دسته‌های Dark & Monochromatic، Premium High-Contrast، Light Minimal و Neumorphic
          </p>
        </div>
        <div
          style={{
            color: theme.primary,
            borderColor: theme.borderLuminous,
            backgroundColor: theme.innerBg,
          }}
          className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs"
        >
          <Palette className="w-5 h-5" />
        </div>
      </div>

      {/* Category switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {(
          [
            'Dark & Monochromatic',
            'Premium High-Contrast',
            'Light Minimal',
            'Neumorphic',
          ] as ThemeCategory[]
        ).map((cat) => {
          const isSel = activeThemeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveThemeCategory(cat)}
              style={{
                backgroundColor: isSel ? theme.primary : theme.innerBg,
                borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                color: isSel ? '#FFFFFF' : theme.textPrimary,
              }}
              className="py-2.5 px-2 rounded-xl font-bold text-xs border transition-all cursor-pointer text-center truncate shadow-xs active:scale-95"
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Themes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-1">
        {currentCategoryThemes.map((t) => {
          const isSelected = currentThemeId === t.id;
          return (
            <div
              key={t.id}
              onClick={() => onSelectTheme(t.id)}
              style={{
                backgroundColor: t.cardBg,
                borderColor: isSelected
                  ? t.primary
                  : (theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.12)'),
                boxShadow: isSelected ? `0 0 20px ${t.glowColor}` : theme.shadowFlat,
              }}
              className={`liquid-glass-interactive rounded-2xl p-4 border flex items-center justify-between cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-blue-500/50' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  {/* Strictly English technical keys (e.g. 'deep-space', 'neo-ice') */}
                  <span style={{ color: t.textPrimary }} className="text-sm font-black font-mono">
                    '{t.id}'
                  </span>
                  {isSelected && (
                    <span
                      style={{ backgroundColor: t.primary }}
                      className="text-[10px] text-white font-extrabold px-2 py-0.5 rounded-full shadow-xs"
                    >
                      ACTIVE
                    </span>
                  )}
                </div>
                <span style={{ color: theme.textSecondary }} className="text-[11px] font-semibold block mt-0.5 font-mono">
                  {t.category} • {t.bg}
                </span>
              </div>

              <div className="flex items-center gap-1.5" dir="ltr">
                <span
                  style={{ backgroundColor: t.bg, borderColor: t.borderLuminous }}
                  className="w-5 h-5 rounded-full border shadow-sm"
                />
                <span
                  style={{ backgroundColor: t.innerBg, borderColor: t.borderLuminous }}
                  className="w-5 h-5 rounded-full border shadow-sm"
                />
                <span
                  style={{ backgroundColor: t.primary }}
                  className="w-5 h-5 rounded-full shadow-sm"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
