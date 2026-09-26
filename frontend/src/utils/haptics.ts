import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * DaneshMate Tactile Micro-Interactions Engine
 * Provides graceful cross-platform haptic feedback across iOS, Android, and Web previews.
 */
export const hapticFeedback = {
  /**
   * Light impact: For radial menu open/close and tab switching
   */
  light: async (): Promise<void> => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(12);
      }
    } catch {
      // Graceful fallback when haptic hardware is unavailable
    }
  },

  /**
   * Medium impact: For pressing record on voice notes or triggering session uploads
   */
  medium: async (): Promise<void> => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(28);
      }
    } catch {
      // Graceful fallback
    }
  },

  /**
   * Heavy impact: For destructive actions, modal dismissals, or confirmations
   */
  heavy: async (): Promise<void> => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(45);
      }
    } catch {
      // Graceful fallback
    }
  },

  /**
   * Notification success vibration: When a class or reminder is successfully saved
   */
  success: async (): Promise<void> => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([25, 60, 30]);
      }
    } catch {
      // Graceful fallback
    }
  },

  /**
   * Notification warning vibration: For alerts or network offline transitions
   */
  warning: async (): Promise<void> => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([30, 40, 30]);
      }
    } catch {
      // Graceful fallback
    }
  },

  /**
   * Selection feedback for pickers and radio buttons
   */
  selection: async (): Promise<void> => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.selectionAsync();
      } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(10);
      }
    } catch {
      // Graceful fallback
    }
  },
};
