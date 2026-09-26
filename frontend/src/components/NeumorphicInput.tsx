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
import { NeumorphicTheme } from '../theme/colors';

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
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {optional && <Text style={styles.optionalBadge}>(اختیاری)</Text>}
        </View>
      )}

      {/* Recessed Inset Well for the Input Field */}
      <View style={[styles.inputWell, !!error && styles.inputWellError]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          placeholderTextColor="#94a3b8"
          style={[styles.input, inputStyle]}
          {...rest}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  optionalBadge: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  inputWell: {
    backgroundColor: '#d8dee6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c6ccd6',
    ...Platform.select({
      ios: {
        shadowColor: '#ffffff',
        shadowOffset: { width: -2, height: -2 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: 'inset 3px 3px 6px #bec3cc, inset -3px -3px 6px #ffffff',
      } as any,
    }),
  },
  inputWellError: {
    borderColor: '#fca5a5',
  },
  iconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right', // Supports Persian/RTL and standard input
  },
  errorText: {
    fontSize: 11,
    color: '#e11d48',
    fontWeight: '600',
    marginTop: 4,
    paddingHorizontal: 4,
  },
});
