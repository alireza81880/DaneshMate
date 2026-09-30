import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Linking } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getRtlRowReverse } from '../utils/rtl';
import { FONT_FAMILIES } from '../theme/typography';

interface NullSparkleLinkProps {
  style?: any;
}

export const NullSparkleLink: React.FC<NullSparkleLinkProps> = ({ style }) => {
  const { palette } = useTheme();

  const handleOpenLink = async () => {
    const url = 'https://alireza81880.github.io/';
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } catch (err) {
        console.warn('Web link opening error', err);
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

  return (
    <View style={[styles.wrapper, { flexDirection: getRtlRowReverse() }, style]}>
      {/* Neutral prefix strictly LTR without any wrapper box or background */}
      <Text style={[styles.prefixText, { color: palette.textSecondary }]}>
        Made by{' '}
      </Text>

      {/* Interactive Link ONLY on "null" with sparkles, glowing halo and shimmering link */}
      <Pressable
        onPress={handleOpenLink}
        style={({ pressed }) => [
          styles.interactiveNull,
          { flexDirection: getRtlRowReverse() },
          pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
        ]}
        accessibilityRole="link"
        accessibilityLabel="Visit null website profile"
      >
        {/* Leading 4-Point SVG Sparkle Star */}
        <View style={styles.sparkleBox}>
          {Platform.OS === 'web' ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill={palette.primary}>
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          ) : (
            <Text style={[styles.sparkleFallback, { color: palette.primary }]}>✦</Text>
          )}
        </View>

        <Text
          style={[
            styles.nullBrandText,
            {
              color: palette.primary,
              textShadowColor: palette.glowColor || 'rgba(59, 130, 246, 0.7)',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 10,
            },
          ]}
        >
          null
        </Text>

        {/* Trailing 4-Point SVG Sparkle Star */}
        <View style={styles.sparkleBox}>
          {Platform.OS === 'web' ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill={palette.secondaryAccent || palette.primaryLight}>
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          ) : (
            <Text style={[styles.sparkleFallback, { color: palette.secondaryAccent || palette.primaryLight }]}>✦</Text>
          )}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 20,
    backgroundColor: 'transparent',
    // Strictly LTR orientation
    direction: 'ltr',
    ...Platform.select({
      web: {
        direction: 'ltr',
      } as any,
    }),
  },
  prefixText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  interactiveNull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
    paddingVertical: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
      } as any,
    }),
  },
  sparkleBox: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleFallback: {
    fontSize: 11,
    fontWeight: '900',
  },
  nullBrandText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    textDecorationLine: 'underline',
  },
});
