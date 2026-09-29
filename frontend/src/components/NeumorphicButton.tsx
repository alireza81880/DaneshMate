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
import { useTheme } from '../theme/ThemeContext';
import { NeumorphicTheme } from '../theme/colors';
import { FONT_FAMILIES } from '../theme/typography';
import { rtlStyles } from '../utils/rtl';

export interface NeumorphicButtonProps {
  title?: string;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  variant?: 'standard' | 'primary' | 'danger' | 'convex';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  active?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy' | 'none';
  children?: React.ReactNode;
}

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
  const { palette } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    setIsPressed(true);

    if (hapticType === 'medium') {
      hapticFeedback.medium();
    } else if (hapticType === 'heavy') {
      hapticFeedback.heavy();
    } else if (hapticType === 'light') {
      hapticFeedback.light();
    }

    Animated.spring(scaleAnim, {
      toValue: 0.96,
      damping: 18,
      mass: 0.75,
      stiffness: 320,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    setIsPressed(false);

    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 12,
      mass: 0.9,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  };

  const isActuallyPressed = isPressed || active;

  // Flatten incoming style to extract container-level layout props like flex, width, margin
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const containerStyle: ViewStyle = {};
  if (flattenedStyle.flex !== undefined) containerStyle.flex = flattenedStyle.flex;
  if (flattenedStyle.width !== undefined) containerStyle.width = flattenedStyle.width;
  if (flattenedStyle.margin !== undefined) containerStyle.margin = flattenedStyle.margin;
  if (flattenedStyle.marginTop !== undefined) containerStyle.marginTop = flattenedStyle.marginTop;
  if (flattenedStyle.marginBottom !== undefined) containerStyle.marginBottom = flattenedStyle.marginBottom;
  if (flattenedStyle.marginLeft !== undefined) containerStyle.marginLeft = flattenedStyle.marginLeft;
  if (flattenedStyle.marginRight !== undefined) containerStyle.marginRight = flattenedStyle.marginRight;
  if (flattenedStyle.marginHorizontal !== undefined) containerStyle.marginHorizontal = flattenedStyle.marginHorizontal;
  if (flattenedStyle.marginVertical !== undefined) containerStyle.marginVertical = flattenedStyle.marginVertical;
  if (flattenedStyle.alignSelf !== undefined) containerStyle.alignSelf = flattenedStyle.alignSelf;

  // Dynamic colors based on active theme
  const getBackgroundColor = () => {
    if (variant === 'primary') return palette.primary;
    if (variant === 'danger') return palette.danger || '#EF4444';
    if (isActuallyPressed) return palette.surfaceInner;
    return palette.surfaceCard;
  };

  const getBorderColor = () => {
    if (variant === 'primary') return palette.primaryLight || 'rgba(255, 255, 255, 0.3)';
    if (variant === 'danger') return 'rgba(255, 255, 255, 0.25)';
    return palette.borderLuminous || palette.border;
  };

  const getTextColor = () => {
    if (variant === 'primary' || variant === 'danger') return '#FFFFFF';
    if (isActuallyPressed) return palette.primary;
    return palette.textPrimary;
  };

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        containerStyle,
        { transform: [{ scale: scaleAnim }] },
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
          isActuallyPressed ? styles.pressedState : styles.elevatedState,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
          },
          disabled && styles.disabledState,
          style,
        ]}
      >
        <View style={[styles.contentRow, rtlStyles.row]}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          {title ? (
            <Text
              style={[
                styles.buttonText,
                styles[`text_${size}`],
                { color: getTextColor() },
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
    // If no explicit flex/width passed, shrink-wrap to content
  },
  baseButton: {
    borderRadius: NeumorphicTheme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  elevatedState: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(255, 255, 255, 0.4)',
      } as any,
    }),
  },
  pressedState: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.15)',
      } as any,
    }),
  },
  contentRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginHorizontal: 6,
  },
  buttonText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  size_sm: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: NeumorphicTheme.radius.md,
  },
  size_md: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: NeumorphicTheme.radius.lg,
  },
  size_lg: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: NeumorphicTheme.radius.xl,
  },
  text_sm: {
    fontSize: 12,
  },
  text_md: {
    fontSize: 13.5,
  },
  text_lg: {
    fontSize: 15,
  },
  disabledState: {
    opacity: 0.45,
  },
});
