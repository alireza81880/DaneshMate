import { I18nManager, Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * DaneshMate RTL & Direction Management
 * 
 * In React Native Android:
 * When I18nManager.isRTL is true, React Native's Yoga layout engine automatically
 * inverts flexDirection: 'row' so that items render from RIGHT to LEFT.
 * If I18nManager.isRTL is false (e.g. before app restart on fresh install or on Web),
 * flexDirection: 'row-reverse' or explicit RTL text aligns items Right-to-Left.
 * 
 * Using getRtlRow() ensures 100% predictable Right-to-Left layout without double-reversals!
 */

// Initialize native I18nManager if on native mobile platform
if (Platform.OS !== 'web') {
  try {
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    }
  } catch (err) {
    console.warn('[RTL] Error initializing I18nManager:', err);
  }
}

export const isRTL: boolean = Platform.OS === 'web' ? true : I18nManager.isRTL;

/**
 * Returns 'row' if native RTL is active, or 'row-reverse' if LTR engine is active,
 * guaranteeing visual right-to-left layout order across all platforms.
 */
export const getRtlRow = (): 'row' | 'row-reverse' => {
  return I18nManager.isRTL ? 'row' : 'row-reverse';
};

/**
 * Returns 'row-reverse' if native RTL is active, or 'row' if LTR engine is active,
 * guaranteeing visual left-to-right layout order when needed (e.g. English inputs, counters).
 */
export const getRtlRowReverse = (): 'row' | 'row-reverse' => {
  return I18nManager.isRTL ? 'row-reverse' : 'row';
};

/**
 * Common RTL styles
 */
export const rtlStyles = {
  text: {
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  textCenter: {
    textAlign: 'center' as const,
    writingDirection: 'rtl' as const,
  },
  row: {
    flexDirection: (I18nManager.isRTL ? 'row' : 'row-reverse') as 'row' | 'row-reverse',
  },
  rowReverse: {
    flexDirection: (I18nManager.isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
  },
};
