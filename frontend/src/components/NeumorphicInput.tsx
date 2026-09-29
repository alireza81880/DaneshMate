import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { FONT_FAMILIES } from '../theme/typography';
import { rtlStyles } from '../utils/rtl';

interface NeumorphicInputProps extends TextInputProps {
  label?: string;
  optional?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  error?: string;
  icon?: React.ReactNode;
}

export const NeumorphicInput: React.FC<NeumorphicInputProps> = ({
  label,
  optional = false,
  containerStyle,
  inputStyle,
  error,
  icon,
  ...rest
}) => {
  const { palette } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={[styles.labelRow, rtlStyles.row]}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>{label}</Text>
          {optional && (
            <Text style={[styles.optionalBadge, { color: palette.textMuted }]}>
              (اختیاری)
            </Text>
          )}
        </View>
      )}

      {/* Recessed Inset Well for the Input Field */}
      <View
        style={[
          styles.inputWell,
          rtlStyles.row,
          {
            backgroundColor: palette.surfaceInner,
            borderColor: error ? palette.danger || '#ef4444' : palette.border,
          },
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          placeholderTextColor={palette.textMuted}
          style={[
            styles.input,
            {
              color: palette.textPrimary,
            },
            inputStyle,
          ]}
          {...rest}
        />
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: palette.danger || '#ef4444' }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  labelRow: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  label: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  optionalBadge: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  inputWell: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
      } as any,
    }),
  },
  iconContainer: {
    marginHorizontal: 6,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  errorText: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    paddingHorizontal: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
