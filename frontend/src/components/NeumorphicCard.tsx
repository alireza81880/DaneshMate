import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { NeumorphicTheme } from '../theme/colors';

interface NeumorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  type?: 'flat' | 'inset' | 'convex';
  borderRadius?: number;
}

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({
  children,
  style,
  type = 'flat',
  borderRadius = NeumorphicTheme.radius.xl,
}) => {
  const { palette } = useTheme();

  // Dark-mode solid deep-slate fallback ensures rich cyber-luxe contrast on Android
  // matching Web's liquid-glass without looking flat or washed-out
  const cardBg = type === 'inset'
    ? palette.surfaceInner
    : (palette.isDark ? '#121826' : palette.surfaceCard);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: palette.borderLuminous || palette.border,
          borderTopColor: type === 'flat' && palette.isDark
            ? 'rgba(255, 255, 255, 0.16)'
            : (palette.borderLuminous || palette.border),
          borderRadius,
        },
        type === 'flat' && styles.flat,
        type === 'inset' && styles.inset,
        style,
      ]}
    >
      {type === 'flat' && (
        <View
          style={[
            styles.topHighlight,
            {
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
              backgroundColor: palette.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.75)',
            },
          ]}
        />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.2,
  },
  flat: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
        shadowColor: '#000000',
      },
      web: {
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
      } as any,
    }),
  },
  inset: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
        shadowColor: '#000000',
      },
      web: {
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
      } as any,
    }),
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
});
