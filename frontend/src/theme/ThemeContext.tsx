import React, { createContext, useContext, useState, ReactNode } from 'react';
import { THEME_PALETTES, Palette, ThemeId, ThemeCategory, NeumorphicTheme } from './colors';

interface ThemeContextType {
  themeId: ThemeId;
  palette: Palette;
  setThemeId: (id: ThemeId) => void;
  availablePalettes: Palette[];
  palettesByCategory: Record<ThemeCategory, Palette[]>;
  theme: typeof NeumorphicTheme;
  colors: typeof NeumorphicTheme.colors;
}

const defaultContextValue: ThemeContextType = {
  themeId: 'deep-space',
  palette: THEME_PALETTES['deep-space'],
  setThemeId: () => {},
  availablePalettes: Object.values(THEME_PALETTES),
  palettesByCategory: {
    'Neumorphic': Object.values(THEME_PALETTES).filter((p) => p.category === 'Neumorphic'),
    'Light Minimal': Object.values(THEME_PALETTES).filter((p) => p.category === 'Light Minimal'),
    'Dark & Monochromatic': Object.values(THEME_PALETTES).filter((p) => p.category === 'Dark & Monochromatic'),
    'Premium High-Contrast': Object.values(THEME_PALETTES).filter((p) => p.category === 'Premium High-Contrast'),
  },
  theme: NeumorphicTheme,
  colors: NeumorphicTheme.colors,
};

const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>('deep-space');

  const palette = THEME_PALETTES[themeId] || THEME_PALETTES['deep-space'];
  const availablePalettes = Object.values(THEME_PALETTES);

  const palettesByCategory: Record<ThemeCategory, Palette[]> = {
    'Neumorphic': availablePalettes.filter((p) => p.category === 'Neumorphic'),
    'Light Minimal': availablePalettes.filter((p) => p.category === 'Light Minimal'),
    'Dark & Monochromatic': availablePalettes.filter((p) => p.category === 'Dark & Monochromatic'),
    'Premium High-Contrast': availablePalettes.filter((p) => p.category === 'Premium High-Contrast'),
  };

  const dynamicTheme = {
    ...NeumorphicTheme,
    colors: {
      ...NeumorphicTheme.colors,
      background: palette.background,
      surface: palette.surfaceCard,
      primary: palette.primary,
      primaryLight: palette.primaryLight,
      secondary: palette.secondaryAccent,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      textMuted: palette.textMuted,
      border: palette.borderLuminous,
      shadowDark: palette.glowColor || NeumorphicTheme.colors.shadowDark,
    },
  };

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        palette,
        setThemeId,
        availablePalettes,
        palettesByCategory,
        theme: dynamicTheme,
        colors: dynamicTheme.colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

