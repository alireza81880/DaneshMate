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

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: type === 'inset' ? palette.surfaceInner : palette.surfaceCard,
          borderColor: palette.borderLuminous || palette.border,
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
              backgroundColor: palette.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.75)',
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
    borderWidth: 1,
  },
  flat: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(255,255,255,0.4)',
      } as any,
    }),
  },
  inset: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.1), inset -2px -2px 6px rgba(255,255,255,0.5)',
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
