import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { NeumorphicTheme } from '../theme/colors';

interface NeumorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  type?: 'flat' | 'inset' | 'convex';
  borderRadius?: number;
}

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({
  children,
  style,
  type = 'flat',
  borderRadius = NeumorphicTheme.radius.xl,
}) => {
  return (
    <View
      style={[
        styles.card,
        type === 'flat' && styles.flat,
        type === 'inset' && styles.inset,
        { borderRadius },
        style,
      ]}
    >
      {type === 'flat' && <View style={[styles.topHighlight, { borderRadius }]} />}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: NeumorphicTheme.colors.background,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  flat: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    ...Platform.select({
      ios: {
        shadowColor: NeumorphicTheme.colors.shadowDark,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '9px 9px 18px #bec3cc, -9px -9px 18px #ffffff',
      } as any,
    }),
  },
  inset: {
    backgroundColor: '#d8dee6',
    borderWidth: 1,
    borderColor: '#c6ccd6',
    ...Platform.select({
      ios: {
        shadowColor: '#ffffff',
        shadowOffset: { width: -2, height: -2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: 'inset 6px 6px 12px #bec3cc, inset -6px -6px 12px #ffffff',
      } as any,
    }),
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});
