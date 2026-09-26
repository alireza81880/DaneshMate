import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform } from 'react-native';
import { NeumorphicTheme } from '../theme/colors';

interface NeumorphicTimePickerProps {
  value: string;
  onChange: (timeString: string) => void;
  error?: string;
}

const STANDARDIZED_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
];

export const NeumorphicTimePicker: React.FC<NeumorphicTimePickerProps> = ({
  value,
  onChange,
  error,
}) => {
  const [isCustomMode, setIsCustomMode] = useState(
    !STANDARDIZED_SLOTS.includes(value) && value.length > 0
  );
  const [customInputValue, setCustomInputValue] = useState(
    !STANDARDIZED_SLOTS.includes(value) ? value : ''
  );

  const handleSelectPreset = (slot: string) => {
    setIsCustomMode(false);
    onChange(slot);
  };

  const handleCustomChange = (text: string) => {
    setCustomInputValue(text);
    onChange(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          ساعت برگزاری کلاس <Text style={styles.requiredStar}>*</Text>
        </Text>
        <Text style={styles.subHint}>انتخاب بلوک ۲ ساعته یا تایپ ساعت دلخواه</Text>
      </View>

      {/* Selected Time Banner */}
      <View style={[styles.selectedBanner, !!error && styles.selectedBannerError]}>
        <Text style={styles.selectedBannerIcon}>⏰</Text>
        <Text style={styles.selectedBannerText}>
          {value ? `ساعت انتخابی: ${value}` : 'لطفاً ساعت برگزاری را مشخص کنید'}
        </Text>
      </View>

      {/* Standardized 2-Hour Preset Blocks */}
      <View style={styles.presetsGrid}>
        {STANDARDIZED_SLOTS.map((slot) => {
          const isSelected = !isCustomMode && value === slot;
          return (
            <Pressable
              key={slot}
              onPress={() => handleSelectPreset(slot)}
              style={[
                styles.slotBtn,
                isSelected ? styles.slotBtnSelected : styles.slotBtnUnselected,
              ]}
            >
              <Text
                style={[
                  styles.slotBtnText,
                  isSelected && styles.slotBtnTextSelected,
                ]}
              >
                {slot}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Custom Time Neumorphic Input */}
      <View style={styles.customSection}>
        <Text style={styles.customLabel}>یا تایپ ساعت دلخواه (خارج از بلوک‌های بالا):</Text>
        <View
          style={[
            styles.customInputWell,
            isCustomMode && styles.customInputWellActive,
          ]}
        >
          <TextInput
            placeholder="مثال: ۰۹:۱۵ - ۱۰:۴۵ یا 13:00 - 15:00"
            placeholderTextColor="#94a3b8"
            value={customInputValue}
            onFocus={() => setIsCustomMode(true)}
            onChangeText={(text) => {
              setIsCustomMode(true);
              handleCustomChange(text);
            }}
            style={styles.customInput}
          />
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  subHint: {
    fontSize: 10.5,
    color: '#94a3b8',
  },
  requiredStar: {
    color: '#e11d48',
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#d8dee6',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 10,
    ...Platform.select({
      web: { boxShadow: 'inset 2px 2px 5px #bec3cc, inset -2px -2px 5px #ffffff' } as any,
    }),
  },
  selectedBannerError: {
    borderWidth: 1,
    borderColor: '#f87171',
  },
  selectedBannerIcon: {
    fontSize: 14,
  },
  selectedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  slotBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBtnUnselected: {
    backgroundColor: NeumorphicTheme.colors.background,
    ...Platform.select({
      web: { boxShadow: '4px 4px 8px #b8b9be, -4px -4px 8px #ffffff' } as any,
    }),
  },
  slotBtnSelected: {
    backgroundColor: '#d8dee6',
    borderWidth: 1.5,
    borderColor: '#4361EE',
    ...Platform.select({
      web: { boxShadow: 'inset 3px 3px 6px #bec3cc, inset -3px -3px 6px #ffffff' } as any,
    }),
  },
  slotBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  slotBtnTextSelected: {
    color: '#4361EE',
    fontWeight: '900',
  },
  customSection: {
    marginTop: 4,
  },
  customLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'right',
  },
  customInputWell: {
    backgroundColor: '#d8dee6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: '#c6ccd6',
    ...Platform.select({
      web: { boxShadow: 'inset 2px 2px 4px #bec3cc, inset -2px -2px 4px #ffffff' } as any,
    }),
  },
  customInputWellActive: {
    borderColor: '#4361EE',
    borderWidth: 1.5,
  },
  customInput: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
  },
  errorText: {
    fontSize: 11,
    color: '#e11d48',
    fontWeight: '600',
    marginTop: 6,
  },
});
