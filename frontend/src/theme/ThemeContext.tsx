import React, { createContext, useContext, useState, ReactNode } from 'react';
import { THEME_PALETTES, Palette, ThemeId, ThemeCategory } from './colors';

interface ThemeContextType {
  themeId: ThemeId;
  palette: Palette;
  setThemeId: (id: ThemeId) => void;
  availablePalettes: Palette[];
  palettesByCategory: Record<ThemeCategory, Palette[]>;
}

const ThemeContext = createContext<ThemeContextType>({
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
});

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

  return (
    <ThemeContext.Provider
      value={{ themeId, palette, setThemeId, availablePalettes, palettesByCategory }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
