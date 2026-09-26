import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface LiquidBentoCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  borderRadius?: number;
  highlightTop?: boolean;
}

export const LiquidBentoCard: React.FC<LiquidBentoCardProps> = ({
  children,
  style,
  borderRadius = 24,
  highlightTop = true,
}) => {
  const { palette } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surfaceCard,
          borderColor: palette.borderLuminous,
          borderRadius,
        },
        highlightTop && {
          borderTopColor: palette.isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.9)',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)',
        transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
      } as any,
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
