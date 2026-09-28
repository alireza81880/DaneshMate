import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Linking, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface DonationBadgeProps {
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export const DonationBadge: React.FC<DonationBadgeProps> = ({ style, compact = false }) => {
  const { palette } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const handleOpenDonation = async () => {
    const url = 'https://donofa.ir/alirezaz_dev';
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } catch (err) {
        console.warn('Web donation link error', err);
      }
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.warn('Native Linking error', err);
    }
  };

  const accentColor = palette.isDark ? '#FB7185' : '#E11D48'; // Rose accent with high contrast
  const borderColor = isHovered
    ? palette.primary
    : palette.borderLuminous;

  const bgFrosted = isHovered
    ? palette.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
    : palette.isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.03)';

  return (
    <View style={[styles.outerContainer, style]}>
      <Pressable
        onPress={handleOpenDonation}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        style={({ pressed }) => [
          styles.badgeButton,
          {
            backgroundColor: bgFrosted,
            borderColor,
            boxShadow: isHovered
              ? `0 0 16px ${palette.glowColor || 'rgba(59, 130, 246, 0.4)'}`
              : palette.boxShadowFlat,
          } as any,
          compact && styles.compactBadge,
          pressed && {
            transform: [{ scale: 0.96 }],
            borderColor: palette.primary,
          },
        ]}
        accessibilityRole="link"
        accessibilityLabel="حمایت مالی از پروژه در دونوفا"
      >
        {/* Heart / Coffee Vector Icon */}
        <View style={styles.iconContainer}>
          {Platform.OS === 'web' ? (
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill={accentColor}
              style={{ display: 'block', transition: 'transform 0.2s ease' }}
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <Text style={[styles.iconFallback, { color: accentColor }]}>♥</Text>
          )}
        </View>

        {/* Persian Label */}
        <Text
          style={[
            styles.label,
            {
              color: isHovered ? palette.textPrimary : palette.textSecondary,
              fontFamily: Platform.OS === 'web' ? 'inherit' : undefined,
            },
          ]}
        >
          حمایت مالی از پروژه
        </Text>

        {/* Subtle Shimmer Sparkle Indicator */}
        <View style={styles.trailingIconContainer}>
          {Platform.OS === 'web' ? (
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill={palette.primary}
              style={{ opacity: isHovered ? 1 : 0.6 }}
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          ) : (
            <Text style={[styles.sparkleFallback, { color: palette.primary }]}>✦</Text>
          )}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  badgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none',
      } as any,
    }),
  },
  compactBadge: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 16,
    gap: 5,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFallback: {
    fontSize: 12,
    lineHeight: 14,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  trailingIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleFallback: {
    fontSize: 9,
    fontWeight: '900',
    opacity: 0.7,
  },
});
