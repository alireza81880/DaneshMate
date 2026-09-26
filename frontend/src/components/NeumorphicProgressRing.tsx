import React from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';
import { NeumorphicTheme } from '../theme/colors';

interface NeumorphicProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  label?: string;
  valueText: string;
  subText?: string;
  accentColor?: string;
  style?: ViewStyle;
}

/**
 * Neumorphic Progress Ring (حلقه پیشرفت نئومورفیک)
 * Uses concentric recessed and elevated circular surfaces with dual ambient shadows
 * and active progress rim for high visual retention and instant metric comprehension.
 */
export const NeumorphicProgressRing: React.FC<NeumorphicProgressRingProps> = ({
  progress,
  size = 110,
  strokeWidth = 10,
  label,
  valueText,
  subText,
  accentColor = NeumorphicTheme.colors.primary,
  style,
}) => {
  const innerSize = size - strokeWidth * 2;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const rotationDegrees = clampedProgress * 360;

  return (
    <View style={[styles.wrapper, style]}>
      {/* Outer Elevated Bevel */}
      <View
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {/* Recessed Track (Inset Groove) */}
        <View
          style={[
            styles.trackGroove,
            {
              width: size - 4,
              height: size - 4,
              borderRadius: (size - 4) / 2,
            },
          ]}
        >
          {/* Progress Arc Indicator (Simulated with rotating gradient segments) */}
          <View
            style={[
              styles.progressArc,
              {
                borderColor: accentColor,
                borderTopColor: accentColor,
                borderRightColor: clampedProgress > 0.25 ? accentColor : 'transparent',
                borderBottomColor: clampedProgress > 0.5 ? accentColor : 'transparent',
                borderLeftColor: clampedProgress > 0.75 ? accentColor : 'transparent',
                borderWidth: strokeWidth - 2,
                borderRadius: size / 2,
                transform: [{ rotate: `${rotationDegrees}deg` }],
              },
            ]}
          />

          {/* Center Convex Dial Surface */}
          <View
            style={[
              styles.centerDial,
              {
                width: innerSize,
                height: innerSize,
                borderRadius: innerSize / 2,
              },
            ]}
          >
            {/* Top-Left Specular Glint */}
            <View style={styles.specularGlint} />

            <Text style={[styles.valueText, { color: accentColor }]}>{valueText}</Text>
            {label && <Text style={styles.labelText}>{label}</Text>}
          </View>
        </View>
      </View>

      {subText && <Text style={styles.subText}>{subText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    backgroundColor: NeumorphicTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    // Strong Outer Shadows for physical 3D extrusion
    boxShadow: '7px 7px 15px #b8b9be, -7px -7px 15px #ffffff',
  },
  trackGroove: {
    backgroundColor: '#d7dde5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    // Inset depression for the track
    boxShadow: 'inset 3px 3px 6px #bac0c9, inset -3px -3px 6px #ffffff',
  },
  progressArc: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  centerDial: {
    backgroundColor: NeumorphicTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // Convex elevation rising up from the recessed groove
    boxShadow: '4px 4px 8px #b8b9be, -4px -4px 8px #ffffff',
  },
  specularGlint: {
    position: 'absolute',
    top: 3,
    left: '20%',
    right: '20%',
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 2,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  labelText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 1,
  },
  subText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});
