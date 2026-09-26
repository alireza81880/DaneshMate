import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { hapticFeedback } from '../utils/haptics';
import { SyncState } from '../api/syncBridge';

interface OfflineSyncBannerProps {
  syncState: SyncState;
  queuedCount: number;
  onRetrySync?: () => void;
}

/**
 * Subtle Neumorphic Network Resilience Toast/Banner
 * Notifies the user when working offline, confirming that local deltas are
 * queued for background sync without blocking user interaction.
 */
export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  syncState,
  queuedCount,
  onRetrySync,
}) => {
  const { palette } = useTheme();
  const [isDismissed, setIsDismissed] = useState(false);
  const slideAnim = useRef(new Animated.Value(-80)).current;
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
          toValue: -80,
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

  if (!isVisible && slideAnim._value === -80) {
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
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: palette.isDark
              ? 'rgba(17, 24, 39, 0.92)'
              : 'rgba(255, 255, 255, 0.94)',
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
          <View style={styles.titleRow}>
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
            تغییرات در حافظه پایدار دستگاه ذخیره شد و بدون اختلال اجرا می‌شود.
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
              pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
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
          <Text style={[styles.dismissText, { color: palette.textMuted }]}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 12,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
      } as any,
    }),
  },
  dotContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  textGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  retryButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
