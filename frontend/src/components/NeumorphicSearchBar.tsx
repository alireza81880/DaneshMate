import React from 'react';
import { View, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { getRtlRow } from '../utils/rtl';

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
  placeholder = 'جستجوی سریع درس یا نام استاد...',
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
            flexDirection: getRtlRow(),
            backgroundColor: palette.surfaceInner,
            borderColor: palette.borderLuminous,
          },
        ]}
      >
        <Icon name="search" size={17} color={palette.textSecondary} style={styles.searchIcon} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.textMuted}
          style={[
            styles.input,
            {
              color: palette.textPrimary,
              fontFamily: FONT_FAMILIES.persian.regular,
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
            <Icon name="close" size={13} color={palette.textSecondary} />
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
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderWidth: 1.2,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
        shadowColor: '#000000',
      },
    }),
  },
  searchIcon: {
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingVertical: 2,
    marginHorizontal: 8,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});
