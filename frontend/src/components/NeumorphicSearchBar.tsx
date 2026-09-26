import React from 'react';
import { View, TextInput, StyleSheet, Pressable, Text, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface NeumorphicSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export const NeumorphicSearchBar: React.FC<NeumorphicSearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder = 'جستجوی کلاس یا نام استاد...',
}) => {
  const { palette } = useTheme();

  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchWell,
          {
            backgroundColor: palette.surfaceInner,
            borderColor: palette.border,
          },
        ]}
      >
        <Text style={styles.searchIcon}>🔍</Text>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.textMuted}
          style={[
            styles.input,
            {
              color: palette.textPrimary,
            },
          ]}
          returnKeyType="search"
          clearButtonMode="never"
        />

        {value.length > 0 && (
          <Pressable
            onPress={handleClear}
            style={[styles.clearBtn, { backgroundColor: palette.surfaceCard }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="پاک کردن جستجو"
            accessibilityRole="button"
          >
            <Text style={[styles.clearIcon, { color: palette.textSecondary }]}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  searchWell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.08), inset -2px -2px 5px rgba(255,255,255,0.7)',
      } as any,
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    paddingVertical: 2,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '1px 1px 3px rgba(0,0,0,0.1)',
      } as any,
    }),
  },
  clearIcon: {
    fontSize: 11,
    fontWeight: '900',
  },
});
