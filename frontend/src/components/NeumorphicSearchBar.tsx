import React from 'react';
import { View, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { rtlStyles } from '../utils/rtl';

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
          rtlStyles.row,
          {
            backgroundColor: palette.surfaceInner,
            borderColor: palette.border,
          },
        ]}
      >
        <Icon name="search" size={16} color={palette.textSecondary} style={styles.searchIcon} />

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
            <Icon name="close" size={12} color={palette.textSecondary} />
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
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.08)',
      } as any,
    }),
  },
  searchIcon: {
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingVertical: 4,
    marginHorizontal: 6,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
