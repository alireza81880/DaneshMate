import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { NeumorphicTheme } from '../theme/colors';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicButton } from './NeumorphicButton';
import {
  PERSIAN_MONTHS,
  getCurrentJalaliDate,
  toPersianDigits,
  getDaysInJalaliMonth,
} from '../utils/jalali';
import { hapticFeedback } from '../utils/haptics';

interface NeumorphicDatePickerProps {
  label: string;
  value?: string; // Formatted Jalali string e.g. "۱۴۰۵/۰۲/۱۵"
  onChange: (jalaliDate: string) => void;
  optional?: boolean;
  error?: string;
  placeholder?: string;
}

export const NeumorphicDatePicker: React.FC<NeumorphicDatePickerProps> = ({
  label,
  value,
  onChange,
  optional = false,
  error,
  placeholder = 'انتخاب تاریخ شمسی',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentJYear, currentJMonth, currentJDay] = getCurrentJalaliDate();

  // Extract initial values or default to current Jalali date
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (value) {
      const match = value.match(/[۰-۹0-9]+/g);
      if (match && match.length >= 3) {
        return parseInt(match[0].replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
      }
    }
    return currentJYear;
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    if (value) {
      const match = value.match(/[۰-۹0-9]+/g);
      if (match && match.length >= 2) {
        return parseInt(match[1].replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
      }
    }
    return currentJMonth;
  });

  const [selectedDay, setSelectedDay] = useState<number>(() => {
    if (value) {
      const match = value.match(/[۰-۹0-9]+/g);
      if (match && match.length >= 3) {
        return parseInt(match[2].replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
      }
    }
    return currentJDay;
  });

  const daysInMonth = getDaysInJalaliMonth(selectedYear, selectedMonth);
  const yearOptions = [currentJYear - 1, currentJYear, currentJYear + 1, currentJYear + 2];

  const handleConfirm = () => {
    hapticFeedback.selection();
    const formattedMonth = selectedMonth.toString().padStart(2, '0');
    const formattedDay = selectedDay.toString().padStart(2, '0');
    const formatted = `${selectedYear}/${formattedMonth}/${formattedDay}`;
    onChange(toPersianDigits(formatted));
    setIsOpen(false);
  };

  const handleClear = () => {
    hapticFeedback.light();
    onChange('');
    setIsOpen(false);
  };

  const handleQuickSelect = (daysOffset: number) => {
    hapticFeedback.selection();
    let d = currentJDay + daysOffset;
    let m = currentJMonth;
    let y = currentJYear;
    while (d > getDaysInJalaliMonth(y, m)) {
      d -= getDaysInJalaliMonth(y, m);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(d);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label} {optional ? <Text style={styles.optionalText}>(اختیاری)</Text> : <Text style={styles.requiredStar}>*</Text>}
        </Text>
      </View>

      <Pressable
        onPress={() => {
          hapticFeedback.light();
          setIsOpen(true);
        }}
        style={[
          styles.pickerTrigger,
          !!value && styles.pickerTriggerFilled,
          !!error && styles.pickerTriggerError,
        ]}
      >
        <View style={styles.triggerContent}>
          <Text style={styles.calendarIcon}>📅</Text>
          <Text style={[styles.triggerValue, !value && styles.triggerPlaceholder]}>
            {value || placeholder}
          </Text>
        </View>
        <Text style={styles.arrowIcon}>▾</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Neumorphic Persian Date Picker Modal */}
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={styles.modalCentered}>
            <NeumorphicCard style={styles.modalCard} borderRadius={26}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label}</Text>
                <Text style={styles.modalSubtitle}>تقویم رسمی هجری شمسی (جلالی)</Text>
              </View>

              {/* Selected Date Preview */}
              <View style={styles.selectedPreview}>
                <Text style={styles.previewText}>
                  {toPersianDigits(selectedYear)} {PERSIAN_MONTHS[selectedMonth - 1]} {toPersianDigits(selectedDay)}
                </Text>
              </View>

              {/* Quick Preset Chips */}
              <View style={styles.quickChipsRow}>
                <Pressable onPress={() => handleQuickSelect(0)} style={styles.quickChip}>
                  <Text style={styles.quickChipText}>امروز</Text>
                </Pressable>
                <Pressable onPress={() => handleQuickSelect(1)} style={styles.quickChip}>
                  <Text style={styles.quickChipText}>فردا</Text>
                </Pressable>
                <Pressable onPress={() => handleQuickSelect(7)} style={styles.quickChip}>
                  <Text style={styles.quickChipText}>هفته آینده</Text>
                </Pressable>
                <Pressable onPress={() => handleQuickSelect(30)} style={styles.quickChip}>
                  <Text style={styles.quickChipText}>۱ ماه دیگر</Text>
                </Pressable>
              </View>

              {/* Year Selector */}
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>سال:</Text>
                <View style={styles.chipsRow}>
                  {yearOptions.map((y) => (
                    <Pressable
                      key={y}
                      onPress={() => setSelectedYear(y)}
                      style={[styles.yearChip, selectedYear === y && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, selectedYear === y && styles.chipTextActive]}>
                        {toPersianDigits(y)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Month Selector */}
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>ماه:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthsScroll}>
                  {PERSIAN_MONTHS.map((mName, idx) => {
                    const mNum = idx + 1;
                    const isSelected = selectedMonth === mNum;
                    return (
                      <Pressable
                        key={mName}
                        onPress={() => {
                          setSelectedMonth(mNum);
                          if (selectedDay > getDaysInJalaliMonth(selectedYear, mNum)) {
                            setSelectedDay(getDaysInJalaliMonth(selectedYear, mNum));
                          }
                        }}
                        style={[styles.monthChip, isSelected && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {mName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Day Grid */}
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>روز:</Text>
                <View style={styles.daysGrid}>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                    const isSelected = selectedDay === d;
                    return (
                      <Pressable
                        key={d}
                        onPress={() => setSelectedDay(d)}
                        style={[styles.dayCell, isSelected && styles.dayCellActive]}
                      >
                        <Text style={[styles.dayCellText, isSelected && styles.dayCellTextActive]}>
                          {toPersianDigits(d)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {optional && !!value ? (
                  <NeumorphicButton title="حذف تاریخ" size="sm" onPress={handleClear} style={styles.actionBtn} />
                ) : (
                  <NeumorphicButton title="انصراف" size="sm" onPress={() => setIsOpen(false)} style={styles.actionBtn} />
                )}
                <NeumorphicButton title="تایید تاریخ" variant="primary" size="sm" onPress={handleConfirm} style={styles.actionBtn} />
              </View>
            </NeumorphicCard>
          </View>
        </SafeAreaView>
      </Modal>
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
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  optionalText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '400',
  },
  requiredStar: {
    color: '#e11d48',
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e6ebf2',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...Platform.select({
      web: { boxShadow: 'inset 2px 2px 5px #bec3cc, inset -2px -2px 5px #ffffff' } as any,
    }),
  },
  pickerTriggerFilled: {
    backgroundColor: '#dde3ec',
  },
  pickerTriggerError: {
    borderColor: '#f87171',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIcon: {
    fontSize: 14,
  },
  triggerValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  triggerPlaceholder: {
    fontWeight: '500',
    color: '#94a3b8',
  },
  arrowIcon: {
    fontSize: 14,
    color: '#64748b',
  },
  errorText: {
    fontSize: 11,
    color: '#e11d48',
    marginTop: 4,
    textAlign: 'right',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCentered: {
    width: '100%',
    maxWidth: 420,
  },
  modalCard: {
    padding: 20,
  },
  modalHeader: {
    marginBottom: 12,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  selectedPreview: {
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  previewText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  quickChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  quickChip: {
    backgroundColor: '#d8dee6',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  quickChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
  },
  selectorSection: {
    marginBottom: 10,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    textAlign: 'right',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  yearChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#d8dee6',
    alignItems: 'center',
  },
  monthsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  monthChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#d8dee6',
  },
  chipActive: {
    backgroundColor: '#2563eb',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    maxHeight: 140,
  },
  dayCell: {
    width: 34,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#d8dee6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellActive: {
    backgroundColor: '#2563eb',
  },
  dayCellText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  dayCellTextActive: {
    color: '#ffffff',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
  },
});
