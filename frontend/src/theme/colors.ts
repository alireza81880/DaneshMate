/**
 * DaneshMate 2026 Cyber-Luxe Glassmorphism & Liquid Bento Theme Engine
 * 
 * Strict Requirement:
 * Theme Names: Use strictly English technical keys for all theme presets
 * (e.g., 'deep-space', 'neo-ice', 'cyberpunk-neon') instead of localized Persian color names.
 */

export type ThemeCategory = 'Dark & Monochromatic' | 'Premium High-Contrast' | 'Light Minimal' | 'Neumorphic';

export type ThemeId =
  // Dark & Monochromatic (4)
  | 'deep-space'
  | 'slate'
  | 'oled-black'
  | 'midnight'
  // Premium High-Contrast (4)
  | 'cyberpunk-neon'
  | 'aurora-borealis'
  | 'sunset-gradient'
  | 'hacker-green'
  // Light Minimal (4)
  | 'clean-minimal'
  | 'soft-blue'
  | 'pearl'
  | 'morning'
  // Neumorphic (2)
  | 'neo-ice'
  | 'neo-mauve';

export interface Palette {
  id: ThemeId;
  name: string;
  persianName: string;
  category: ThemeCategory;
  background: string;
  canvasGradient?: string;
  surfaceCard: string;
  surfaceInner: string;
  borderLuminous: string;
  border?: string;
  danger?: string;
  primary: string;
  primaryLight: string;
  secondaryAccent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  divider: string;
  glowColor: string;
  isDark: boolean;
  boxShadowFlat: string;
  boxShadowPressed: string;
  colors?: Record<string, string>;
}

export const THEME_PALETTES: Record<ThemeId, Palette> = {
  // === 1. DARK & MONOCHROMATIC ===
  'deep-space': {
    id: 'deep-space',
    name: 'deep-space',
    persianName: 'deep-space',
    category: 'Dark & Monochromatic',
    background: '#090D16',
    canvasGradient: 'radial-gradient(ellipse at top, #141B2D 0%, #090D16 70%)',
    surfaceCard: 'rgba(22, 26, 34, 0.75)',
    surfaceInner: 'rgba(15, 18, 26, 0.85)',
    borderLuminous: 'rgba(255, 255, 255, 0.1)',
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    secondaryAccent: '#8B5CF6',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    divider: 'rgba(255, 255, 255, 0.08)',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    isDark: true,
    boxShadowFlat: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
    boxShadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.6)',
  },
  'slate': {
    id: 'slate',
    name: 'slate',
    persianName: 'slate',
    category: 'Dark & Monochromatic',
    background: '#0F172A',
    surfaceCard: 'rgba(30, 41, 59, 0.75)',
    surfaceInner: 'rgba(15, 23, 42, 0.85)',
    borderLuminous: 'rgba(255, 255, 255, 0.08)',
    primary: '#38BDF8',
    primaryLight: '#7DD3FC',
    secondaryAccent: '#818CF8',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    divider: 'rgba(255, 255, 255, 0.06)',
    glowColor: 'rgba(56, 189, 248, 0.25)',
    isDark: true,
    boxShadowFlat: '0 8px 30px rgba(0, 0, 0, 0.5)',
    boxShadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.6)',
  },
  'oled-black': {
    id: 'oled-black',
    name: 'oled-black',
    persianName: 'oled-black',
    category: 'Dark & Monochromatic',
    background: '#000000',
    surfaceCard: 'rgba(12, 12, 15, 0.85)',
    surfaceInner: '#050505',
    borderLuminous: 'rgba(255, 255, 255, 0.12)',
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    secondaryAccent: '#10B981',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    divider: 'rgba(255, 255, 255, 0.08)',
    glowColor: 'rgba(255, 255, 255, 0.2)',
    isDark: true,
    boxShadowFlat: '0 8px 32px rgba(0, 0, 0, 0.8)',
    boxShadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.9)',
  },
  'midnight': {
    id: 'midnight',
    name: 'midnight',
    persianName: 'midnight',
    category: 'Dark & Monochromatic',
    background: '#0B0D17',
    surfaceCard: 'rgba(20, 24, 38, 0.75)',
    surfaceInner: 'rgba(12, 14, 24, 0.9)',
    borderLuminous: 'rgba(255, 255, 255, 0.09)',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    secondaryAccent: '#EC4899',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    divider: 'rgba(255, 255, 255, 0.07)',
    glowColor: 'rgba(99, 102, 241, 0.3)',
    isDark: true,
    boxShadowFlat: '0 8px 32px rgba(0, 0, 0, 0.55)',
    boxShadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.7)',
  },

  // === 2. PREMIUM HIGH-CONTRAST ===
  'cyberpunk-neon': {
    id: 'cyberpunk-neon',
    name: 'cyberpunk-neon',
    persianName: 'cyberpunk-neon',
    category: 'Premium High-Contrast',
    background: '#090814',
    surfaceCard: 'rgba(25, 20, 45, 0.75)',
    surfaceInner: 'rgba(14, 11, 28, 0.9)',
    borderLuminous: 'rgba(236, 72, 153, 0.3)',
    primary: '#EC4899',
    primaryLight: '#F472B6',
    secondaryAccent: '#06B6D4',
    textPrimary: '#FDF4FF',
    textSecondary: '#E879F9',
    textMuted: '#A855F7',
    divider: 'rgba(236, 72, 153, 0.2)',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    isDark: true,
    boxShadowFlat: '0 8px 32px rgba(236, 72, 153, 0.2)',
    boxShadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.7)',
  },
  'aurora-borealis': {
    id: 'aurora-borealis',
    name: 'aurora-borealis',
    persianName: 'aurora-borealis',
    category: 'Premium High-Contrast',
    background: '#061412',
    surfaceCard: 'rgba(12, 36, 32, 0.75)',
    surfaceInner: 'rgba(6, 20, 18, 0.9)',
    borderLuminous: 'rgba(16, 185, 129, 0.25)',
    primary: '#10B981',
    primaryLight: '#34D399',
    secondaryAccent: '#06B6D4',
    textPrimary: '#ECFDF5',
    textSecondary: '#6EE7B7',
    textMuted: '#059669',
    divider: 'rgba(16, 185, 129, 0.2)',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    isDark: true,
    boxShadowFlat: '0 8px 32px rgba(16, 185, 129, 0.2)',
    boxShadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.7)',
  },
  'sunset-gradient': {
    id: 'sunset-gradient',
    name: 'sunset-gradient',
    persianName: 'sunset-gradient',
    category: 'Premium High-Contrast',
    background: '#150A19',
    surfaceCard: 'rgba(40, 18, 48, 0.75)',
    surfaceInner: 'rgba(22, 9, 28, 0.9)',
    borderLuminous: 'rgba(249, 115, 22, 0.3)',
    primary: '#F97316',
    primaryLight: '#FB923C',
    secondaryAccent: '#EC4899',
    textPrimary: '#FFF7ED',
    textSecondary: '#FDBA74',
    textMuted: '#EA580C',
    divider: 'rgba(249, 115, 22, 0.2)',
    glowColor: 'rgba(249, 115, 22, 0.35)',
    isDark: true,
    boxShadowFlat: '0 8px 32px rgba(249, 115, 22, 0.2)',
    boxShadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.7)',
  },
  'hacker-green': {
    id: 'hacker-green',
    name: 'hacker-green',
    persianName: 'hacker-green',
    category: 'Premium High-Contrast',
    background: '#040D07',
    surfaceCard: 'rgba(8, 28, 14, 0.8)',
    surfaceInner: 'rgba(4, 16, 8, 0.95)',
    borderLuminous: 'rgba(34, 197, 94, 0.3)',
    primary: '#22C55E',
    primaryLight: '#4ADE80',
    secondaryAccent: '#16A34A',
    textPrimary: '#DCFCE7',
    textSecondary: '#86EFAC',
    textMuted: '#15803D',
    divider: 'rgba(34, 197, 94, 0.2)',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    isDark: true,
    boxShadowFlat: '0 8px 32px rgba(34, 197, 94, 0.2)',
    boxShadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.8)',
  },

  // === 3. LIGHT MINIMAL ===
  'clean-minimal': {
    id: 'clean-minimal',
    name: 'clean-minimal',
    persianName: 'clean-minimal',
    category: 'Light Minimal',
    background: '#F8FAFC',
    surfaceCard: '#FFFFFF',
    surfaceInner: '#F1F5F9',
    borderLuminous: 'rgba(15, 23, 42, 0.12)',
    primary: '#0284C7',
    primaryLight: '#0369A1',
    secondaryAccent: '#4F46E5',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#475569',
    divider: '#E2E8F0',
    glowColor: 'rgba(2, 132, 199, 0.15)',
    isDark: false,
    boxShadowFlat: '0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
    boxShadowPressed: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
  },
  'soft-blue': {
    id: 'soft-blue',
    name: 'soft-blue',
    persianName: 'soft-blue',
    category: 'Light Minimal',
    background: '#F0F7FF',
    surfaceCard: '#FFFFFF',
    surfaceInner: '#E2EFFF',
    borderLuminous: 'rgba(30, 58, 138, 0.16)',
    primary: '#1D4ED8',
    primaryLight: '#1E40AF',
    secondaryAccent: '#6D28D9',
    textPrimary: '#0A2138',
    textSecondary: '#1E3A5F',
    textMuted: '#33557A',
    divider: '#BFDBFE',
    glowColor: 'rgba(37, 99, 235, 0.15)',
    isDark: false,
    boxShadowFlat: '0 8px 24px rgba(37, 99, 235, 0.08)',
    boxShadowPressed: 'inset 0 2px 4px rgba(37, 99, 235, 0.08)',
  },
  'pearl': {
    id: 'pearl',
    name: 'pearl',
    persianName: 'pearl',
    category: 'Light Minimal',
    background: '#FAF8F5',
    surfaceCard: '#FFFFFF',
    surfaceInner: '#F4ECE4',
    borderLuminous: 'rgba(66, 32, 6, 0.15)',
    primary: '#B45309',
    primaryLight: '#92400E',
    secondaryAccent: '#0F766E',
    textPrimary: '#241405',
    textSecondary: '#4A280B',
    textMuted: '#6E431B',
    divider: '#E7DFD5',
    glowColor: 'rgba(180, 83, 9, 0.12)',
    isDark: false,
    boxShadowFlat: '0 8px 24px rgba(69, 26, 3, 0.06)',
    boxShadowPressed: 'inset 0 2px 4px rgba(69, 26, 3, 0.06)',
  },
  'morning': {
    id: 'morning',
    name: 'morning',
    persianName: 'morning',
    category: 'Light Minimal',
    background: '#FCFBF7',
    surfaceCard: '#FFFFFF',
    surfaceInner: '#FEF3C7',
    borderLuminous: 'rgba(120, 53, 15, 0.18)',
    primary: '#D97706',
    primaryLight: '#B45309',
    secondaryAccent: '#047857',
    textPrimary: '#2D1603',
    textSecondary: '#5A2C08',
    textMuted: '#7C4010',
    divider: '#FDE68A',
    glowColor: 'rgba(217, 119, 6, 0.12)',
    isDark: false,
    boxShadowFlat: '0 8px 24px rgba(217, 119, 6, 0.06)',
    boxShadowPressed: 'inset 0 2px 4px rgba(217, 119, 6, 0.08)',
  },

  // === 4. NEUMORPHIC ===
  'neo-ice': {
    id: 'neo-ice',
    name: 'neo-ice',
    persianName: 'neo-ice',
    category: 'Neumorphic',
    background: '#E2E8F0',
    surfaceCard: '#E2E8F0',
    surfaceInner: '#CBD5E1',
    borderLuminous: 'rgba(15, 23, 42, 0.16)',
    primary: '#2563EB',
    primaryLight: '#1D4ED8',
    secondaryAccent: '#6D28D9',
    textPrimary: '#0A0F1D',
    textSecondary: '#334155',
    textMuted: '#475569',
    divider: '#CBD5E1',
    glowColor: 'rgba(37, 99, 235, 0.25)',
    isDark: false,
    boxShadowFlat: '6px 6px 14px #BAC7D5, -6px -6px 14px #FFFFFF',
    boxShadowPressed: 'inset 3px 3px 6px #BAC7D5, inset -3px -3px 6px #FFFFFF',
  },
  'neo-mauve': {
    id: 'neo-mauve',
    name: 'neo-mauve',
    persianName: 'neo-mauve',
    category: 'Neumorphic',
    background: '#ECE7F0',
    surfaceCard: '#ECE7F0',
    surfaceInner: '#DCD4E4',
    borderLuminous: 'rgba(46, 16, 101, 0.18)',
    primary: '#7C3AED',
    primaryLight: '#6D28D9',
    secondaryAccent: '#BE185D',
    textPrimary: '#1E0A3C',
    textSecondary: '#4A1572',
    textMuted: '#581C87',
    divider: '#D8B4FE',
    glowColor: 'rgba(124, 58, 237, 0.25)',
    isDark: false,
    boxShadowFlat: '6px 6px 14px #C7BDD0, -6px -6px 14px #FFFFFF',
    boxShadowPressed: 'inset 3px 3px 6px #C7BDD0, inset -3px -3px 6px #FFFFFF',
  },
};

/**
 * NeumorphicTheme (Default tactile styling theme object)
 * Provides static color constants and radius values consumed by Neumorphic components.
 */
export const NeumorphicTheme = {
  colors: {
    background: '#E0E5EC',
    surface: '#E0E5EC',
    primary: '#4361EE',
    primaryLight: '#4895EF',
    secondary: '#3F37C9',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    shadowDark: '#A3B1C6',
    shadowLight: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.7)',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

export const theme = NeumorphicTheme;
export default NeumorphicTheme;
