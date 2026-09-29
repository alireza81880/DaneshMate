import { Platform, TextStyle } from 'react-native';

/**
 * DaneshMate Unified Typography System
 * 
 * Pairs Vazirmatn (authentic Persian display & body) with Plus Jakarta Sans (English/Numbers)
 * with robust native font-family mapping, line heights, and bidirectional support.
 */

export const FONT_FAMILIES = {
  persian: {
    regular: Platform.select({
      ios: 'Vazirmatn-Regular',
      android: 'Vazirmatn-Regular',
      web: "'Vazirmatn', sans-serif",
      default: 'sans-serif',
    }),
    medium: Platform.select({
      ios: 'Vazirmatn-Medium',
      android: 'Vazirmatn-Medium',
      web: "'Vazirmatn', sans-serif",
      default: 'sans-serif',
    }),
    semiBold: Platform.select({
      ios: 'Vazirmatn-SemiBold',
      android: 'Vazirmatn-SemiBold',
      web: "'Vazirmatn', sans-serif",
      default: 'sans-serif',
    }),
    bold: Platform.select({
      ios: 'Vazirmatn-Bold',
      android: 'Vazirmatn-Bold',
      web: "'Vazirmatn', sans-serif",
      default: 'sans-serif',
    }),
  },
  english: {
    regular: Platform.select({
      ios: 'PlusJakartaSans-Regular',
      android: 'PlusJakartaSans-Regular',
      web: "'Plus Jakarta Sans', sans-serif",
      default: 'sans-serif',
    }),
    medium: Platform.select({
      ios: 'PlusJakartaSans-Medium',
      android: 'PlusJakartaSans-Medium',
      web: "'Plus Jakarta Sans', sans-serif",
      default: 'sans-serif',
    }),
    semiBold: Platform.select({
      ios: 'PlusJakartaSans-SemiBold',
      android: 'PlusJakartaSans-SemiBold',
      web: "'Plus Jakarta Sans', sans-serif",
      default: 'sans-serif',
    }),
    bold: Platform.select({
      ios: 'PlusJakartaSans-Bold',
      android: 'PlusJakartaSans-Bold',
      web: "'Plus Jakarta Sans', sans-serif",
      default: 'sans-serif',
    }),
  },
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    web: "'JetBrains Mono', monospace",
    default: 'monospace',
  }),
};

/**
 * Unified typography preset styles
 */
export const typography: Record<string, TextStyle> = {
  h1: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 24,
    lineHeight: 34,
    fontWeight: Platform.OS === 'android' ? undefined : '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  h2: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: Platform.OS === 'android' ? undefined : '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  h3: {
    fontFamily: FONT_FAMILIES.persian.semiBold,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: Platform.OS === 'android' ? undefined : '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  title: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: Platform.OS === 'android' ? undefined : '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  body: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bodyMedium: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: Platform.OS === 'android' ? undefined : '500',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bodyBold: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: Platform.OS === 'android' ? undefined : '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  caption: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  captionMedium: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: Platform.OS === 'android' ? undefined : '500',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  captionBold: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: Platform.OS === 'android' ? undefined : '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footnote: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  button: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: Platform.OS === 'android' ? undefined : '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  input: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  badge: {
    fontFamily: FONT_FAMILIES.english.bold,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: Platform.OS === 'android' ? undefined : '700',
  },
  kicker: {
    fontFamily: FONT_FAMILIES.english.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};
