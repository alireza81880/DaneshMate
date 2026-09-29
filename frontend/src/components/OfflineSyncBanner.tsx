import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { rtlStyles } from '../utils/rtl';
import { hapticFeedback } from '../utils/haptics';
import { SyncState } from '../api/syncBridge';

interface OfflineSyncBannerProps {
  syncState: SyncState;
  queuedCount: number;
  onRetrySync?: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  syncState,
  queuedCount,
  onRetrySync,
}) => {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const [isDismissed, setIsDismissed] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const isVisible = (syncState === 'offline' || queuedCount > 0) && !isDismissed;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible && (slideAnim as any)._value === -100) {
    return null;
  }

  const handleRetry = () => {
    hapticFeedback.light();
    onRetrySync?.();
  };

  const handleDismiss = () => {
    hapticFeedback.light();
    setIsDismissed(true);
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          top: Math.max(insets.top + 6, 12),
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          rtlStyles.row,
          {
            backgroundColor: palette.isDark
              ? 'rgba(17, 24, 39, 0.95)'
              : 'rgba(255, 255, 255, 0.96)',
            borderColor: palette.isDark
              ? 'rgba(234, 179, 8, 0.35)'
              : 'rgba(217, 119, 6, 0.35)',
            shadowColor: palette.isDark ? '#000000' : '#D97706',
          },
        ]}
      >
        {/* Status Indicator Pulse Dot */}
        <View style={styles.dotContainer}>
          <View
            style={[
              styles.pulseDot,
              {
                backgroundColor: syncState === 'syncing' ? '#3B82F6' : '#F59E0B',
              },
            ]}
          />
        </View>

        {/* Informational Message */}
        <View style={styles.textGroup}>
          <View style={[styles.titleRow, rtlStyles.row]}>
            <Text
              style={[
                styles.title,
                {
                  color: palette.isDark ? '#FDE68A' : '#92400E',
                },
              ]}
            >
              {syncState === 'syncing' ? 'در حال اتصال به سرور...' : 'حالت آفلاین فعال است'}
            </Text>
            {queuedCount > 0 && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: palette.isDark
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(217, 119, 6, 0.12)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: palette.isDark ? '#FBBF24' : '#B45309',
                    },
                  ]}
                >
                  {queuedCount} تغییر در صف
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.subtitle,
              {
                color: palette.isDark ? '#94A3B8' : '#64748B',
              },
            ]}
          >
            تغییرات در حافظه دستگاه ذخیره شد و بدون اختلال اجرا می‌شود.
          </Text>
        </View>

        {/* Retry Sync Button */}
        {onRetrySync && (
          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => [
              styles.retryButton,
              {
                backgroundColor: palette.isDark
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(217, 119, 6, 0.1)',
                borderColor: palette.isDark
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(217, 119, 6, 0.25)',
              },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="همگام‌سازی مجدد با سرور"
          >
            <Text
              style={[
                styles.retryButtonText,
                {
                  color: palette.isDark ? '#FDE68A' : '#B45309',
                },
              ]}
            >
              همگام‌سازی
            </Text>
          </Pressable>
        )}

        {/* Dismiss Icon */}
        <Pressable
          onPress={handleDismiss}
          hitSlop={8}
          style={({ pressed }) => [
            styles.dismissButton,
            pressed && { opacity: 0.5 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="بستن اعلان آفلاین"
        >
          <Icon name="close" size={14} color={palette.textSecondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  dotContainer: {
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textGroup: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  titleRow: {
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12,
    lineHeight: 18,
    marginHorizontal: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 9.5,
    lineHeight: 14,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 6,
  },
  retryButtonText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  dismissButton: {
    padding: 4,
    marginHorizontal: 4,
  },
});
