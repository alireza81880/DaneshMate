import React, { useRef, useState } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ViewStyle,
  TextStyle,
  Platform,
  View,
} from 'react-native';
import { hapticFeedback } from '../utils/haptics';
import { NeumorphicTheme } from '../theme/colors';

export interface NeumorphicButtonProps {
  title?: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  variant?: 'standard' | 'primary' | 'danger' | 'convex';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  active?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy' | 'none';
  children?: React.ReactNode;
}

/**
 * Reusable Neumorphic Button for React Native
 * Simulates physical depth and press depression using refined spring physics,
 * tactile haptic micro-interactions, layered highlight borders, and dual-tone shadow gradients.
 */
export const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  icon,
  variant = 'standard',
  size = 'md',
  disabled = false,
  active = false,
  hapticType = 'light',
  children,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const depthAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    setIsPressed(true);

    // Tactile micro-interaction feedback
    if (hapticType === 'medium') {
      hapticFeedback.medium();
    } else if (hapticType === 'heavy') {
      hapticFeedback.heavy();
    } else if (hapticType === 'light') {
      hapticFeedback.light();
    }

    // Refined spring depression physics (instant, clean depression)
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.948,
        damping: 18,
        mass: 0.75,
        stiffness: 320,
        useNativeDriver: true,
      }),
      Animated.timing(depthAnim, {
        toValue: 1,
        duration: 75,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    setIsPressed(false);

    // Dynamic spring release physics (natural tactile rebound)
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 12,
        mass: 0.9,
        stiffness: 220,
        useNativeDriver: true,
      }),
      Animated.timing(depthAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const isActuallyPressed = isPressed || active;

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected: active }}
        style={[
          styles.baseButton,
          styles[`size_${size}`],
          // Surface lighting states
          isActuallyPressed ? styles.pressedState : styles.elevatedState,
          variant === 'primary' && styles.primaryVariant,
          variant === 'danger' && styles.dangerVariant,
          disabled && styles.disabledState,
          style,
        ]}
      >
        {/* Top-Left Specular Light Highlight (Recreates true 3D Neumorphism in RN) */}
        {!isActuallyPressed && (
          <View pointerEvents="none" style={styles.specularHighlight} />
        )}

        {/* Content Container */}
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          {title ? (
            <Text
              style={[
                styles.buttonText,
                styles[`text_${size}`],
                variant === 'primary' && styles.primaryButtonText,
                variant === 'danger' && styles.dangerButtonText,
                isActuallyPressed && styles.pressedText,
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : (
            children
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignSelf: 'flex-start',
  },
  baseButton: {
    backgroundColor: NeumorphicTheme.colors.background,
    borderRadius: NeumorphicTheme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  // Elevated (unpressed) physical state
  elevatedState: {
    ...Platform.select({
      ios: {
        shadowColor: NeumorphicTheme.colors.shadowDark,
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.55,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '6px 6px 14px #b8b9be, -6px -6px 14px #ffffff',
      } as any,
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
  },
  // Inset (depressed) physical state
  pressedState: {
    backgroundColor: '#d8dee6',
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
        boxShadow: 'inset 4px 4px 8px #bec3cc, inset -4px -4px 8px #ffffff',
      } as any,
    }),
    borderColor: '#c6ccd6',
    borderWidth: 1,
  },
  // Specular rim for pure physical illusion
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderTopLeftRadius: NeumorphicTheme.radius.lg,
    borderTopRightRadius: NeumorphicTheme.radius.lg,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  buttonText: {
    color: NeumorphicTheme.colors.textPrimary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pressedText: {
    color: '#334155',
  },
  // Size Variants
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: NeumorphicTheme.radius.md,
  },
  size_md: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: NeumorphicTheme.radius.lg,
  },
  size_lg: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: NeumorphicTheme.radius.xl,
  },
  text_sm: {
    fontSize: 13,
  },
  text_md: {
    fontSize: 15,
  },
  text_lg: {
    fontSize: 17,
  },
  // Theme Variants
  primaryVariant: {
    backgroundColor: NeumorphicTheme.colors.primary,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...Platform.select({
      web: {
        boxShadow: '6px 6px 14px rgba(67, 97, 238, 0.35), -6px -6px 14px #ffffff',
      } as any,
    }),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dangerVariant: {
    backgroundColor: NeumorphicTheme.colors.danger,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disabledState: {
    opacity: 0.5,
  },
});
