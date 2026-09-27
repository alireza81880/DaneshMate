import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicButton } from './NeumorphicButton';
import {
  PERSIAN_MONTHS,
  getCurrentJalaliDate,
  toPersianDigits,
  getDaysInJalaliMonth,
  jalaliToGregorian,
  jalaliToTimestamp,
} from '../utils/jalali';
import { hapticFeedback } from '../utils/haptics';

export interface SpringJalaliPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (
    dateString: string,
    anchorTimestamp: number,
    formattedLabel: string,
    scheduledSessionTimestamps: number[]
  ) => void;
  initialDate?: string;
  title?: string;
  subtitle?: string;
}

const WEEK_DAY_LABELS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const FULL_WEEK_DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

/**
 * SpringJalaliPicker
 * High-Precision Neumorphic Jalali Month/Day Calendar inside a Spring-Animated Modal
 * Physical dynamics: tension: 50, friction: 7
 * Automatically forecasts term-long session schedule (8 bi-weekly sessions over 16 academic weeks)
 */
export const SpringJalaliPicker: React.FC<SpringJalaliPickerProps> = ({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  title = 'تاریخ اولین جلسه این درس را مشخص کنید',
  subtitle = 'برای محاسبه دقیق چرخه ۱۴ روزه (هفته‌های زوج و فرد) و پیش‌بینی ۸ جلسه تا پایان ترم',
}) => {
  const [currentJYear, currentJMonth, currentJDay] = getCurrentJalaliDate();

  const [selectedYear, setSelectedYear] = useState<number>(currentJYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentJMonth);
  const [selectedDay, setSelectedDay] = useState<number>(currentJDay);

  // Animated Values for Spring Motion (tension: 50, friction: 7)
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Initialize from initialDate if provided
  useEffect(() => {
    if (initialDate) {
      const match = initialDate.match(/[۰-۹0-9]+/g);
      if (match && match.length >= 3) {
        const parseDigit = (str: string) =>
          str.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
        const y = parseInt(parseDigit(match[0]), 10);
        const m = parseInt(parseDigit(match[1]), 10);
        const d = parseInt(parseDigit(match[2]), 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          setSelectedYear(y);
          setSelectedMonth(Math.min(12, Math.max(1, m)));
          setSelectedDay(Math.min(31, Math.max(1, d)));
          return;
        }
      }
    }
    setSelectedYear(currentJYear);
    setSelectedMonth(currentJMonth);
    setSelectedDay(currentJDay);
  }, [initialDate, currentJYear, currentJMonth, currentJDay, visible]);

  // Spring Animation on Open/Close
  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.75);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.8,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Month navigation
  const handlePrevMonth = () => {
    hapticFeedback.light();
    if (selectedMonth === 1) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    hapticFeedback.light();
    if (selectedMonth === 12) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const daysInCurrentMonth = getDaysInJalaliMonth(selectedYear, selectedMonth);

  // Calculate day-of-week for 1st day of month (0 = Saturday, 6 = Friday in Jalali)
  const getFirstDayOfMonthOffset = useCallback((): number => {
    const [gy, gm, gd] = jalaliToGregorian(selectedYear, selectedMonth, 1);
    const d = new Date(gy, gm - 1, gd);
    const gDay = d.getDay(); // 0 is Sunday, 6 is Saturday
    return (gDay + 1) % 7; // Convert so Saturday = 0, Sunday = 1, ... Friday = 6
  }, [selectedYear, selectedMonth]);

  const firstDayOffset = getFirstDayOfMonthOffset();

  // Calculate day name of currently selected date
  const getSelectedDayOfWeekName = (): string => {
    const [gy, gm, gd] = jalaliToGregorian(selectedYear, selectedMonth, selectedDay);
    const d = new Date(gy, gm - 1, gd);
    const gDay = d.getDay();
    const jalaliDayIndex = (gDay + 1) % 7;
    return FULL_WEEK_DAYS[jalaliDayIndex] || '';
  };

  // Term-Long Session Projection Logic (16 Academic Weeks -> exactly 8 bi-weekly sessions)
  const handleConfirm = () => {
    hapticFeedback.success();
    const formattedDate = `${selectedYear}/${selectedMonth.toString().padStart(2, '0')}/${selectedDay.toString().padStart(2, '0')}`;
    const anchorTimestamp = jalaliToTimestamp(selectedYear, selectedMonth, selectedDay);
    const dayName = getSelectedDayOfWeekName();
    const monthName = PERSIAN_MONTHS[selectedMonth - 1];
    const formattedLabel = `${dayName} ${toPersianDigits(selectedDay)} ${monthName}`;

    // Loop generating exactly 8 bi-weekly session timestamps for the term
    const scheduledSessionTimestamps: number[] = [];
    for (let i = 0; i < 8; i++) {
      const sessionDate = anchorTimestamp + i * (14 * 24 * 60 * 60 * 1000);
      scheduledSessionTimestamps.push(sessionDate);
    }

    onSelectDate(formattedDate, anchorTimestamp, formattedLabel, scheduledSessionTimestamps);
    handleClose();
  };

  const handleSelectDay = (dayNum: number) => {
    hapticFeedback.selection();
    setSelectedDay(dayNum);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.backdrop}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <NeumorphicCard style={styles.card} borderRadius={28}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Text style={styles.headerIcon}>📅</Text>
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            {/* Month & Year Navigation Bar */}
            <View style={styles.monthNavRow}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.navButton}
                activeOpacity={0.7}
              >
                <Text style={styles.navButtonText}>‹ ماه قبل</Text>
              </TouchableOpacity>

              <View style={styles.monthTitleWrapper}>
                <Text style={styles.monthTitleText}>
                  {PERSIAN_MONTHS[selectedMonth - 1]} {toPersianDigits(selectedYear)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.navButton}
                activeOpacity={0.7}
              >
                <Text style={styles.navButtonText}>ماه بعد ›</Text>
              </TouchableOpacity>
            </View>

            {/* Deep Neumorphic Inset Well for Date Grid */}
            <View style={styles.insetWell}>
              {/* Day of Week Headers */}
              <View style={styles.weekLabelsRow}>
                {WEEK_DAY_LABELS.map((label, idx) => (
                  <View key={idx} style={styles.weekLabelCell}>
                    <Text
                      style={[
                        styles.weekLabelText,
                        idx === 6 && styles.fridayLabelText, // جمعه
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Day Cells Grid */}
              <View style={styles.daysGrid}>
                {/* Empty Offset Cells */}
                {Array.from({ length: firstDayOffset }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={styles.emptyDayCell} />
                ))}

                {/* Day Numbers */}
                {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isSelected = selectedDay === dayNum;
                  const isToday =
                    selectedYear === currentJYear &&
                    selectedMonth === currentJMonth &&
                    currentJDay === dayNum;

                  return (
                    <Pressable
                      key={dayNum}
                      onPress={() => handleSelectDay(dayNum)}
                      style={[
                        styles.dayCell,
                        isSelected ? styles.dayCellSelected : styles.dayCellUnselected,
                        isToday && !isSelected && styles.dayCellToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                          isToday && !isSelected && styles.dayTextToday,
                        ]}
                      >
                        {toPersianDigits(dayNum)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Selected Anchor Date & 8-Session Projection Preview Chip */}
            <View style={styles.previewChip}>
              <View style={styles.previewChipHeader}>
                <Text style={styles.previewChipIcon}>📍</Text>
                <Text style={styles.previewChipText}>
                  مبدأ دوره: {getSelectedDayOfWeekName()} {toPersianDigits(selectedDay)}{' '}
                  {PERSIAN_MONTHS[selectedMonth - 1]} {toPersianDigits(selectedYear)}
                </Text>
              </View>
              <View style={styles.projectionBadge}>
                <Text style={styles.projectionBadgeText}>
                  ✨ پیش‌بینی خودکار ۸ جلسه تا پایان ۱۶ هفته ترم تحصیلی
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <NeumorphicButton
                title="انصراف"
                size="sm"
                onPress={handleClose}
                style={styles.actionButton}
              />
              <NeumorphicButton
                title="تأیید و ذخیره تاریخ مبدأ"
                variant="primary"
                size="sm"
                onPress={handleConfirm}
                style={[styles.actionButton, { flex: 1.6 }]}
              />
            </View>
          </NeumorphicCard>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    padding: 20,
    backgroundColor: '#e6ebf2',
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d8dee6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...Platform.select({
      web: { boxShadow: 'inset 2px 2px 5px #bec3cc, inset -2px -2px 5px #ffffff' } as any,
    }),
  },
  headerIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#d8dee6',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  navButton: {
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  navButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  monthTitleWrapper: {
    alignItems: 'center',
  },
  monthTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  insetWell: {
    backgroundColor: '#d8dee6',
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: 'inset 3px 3px 6px #bec3cc, inset -3px -3px 6px #ffffff' } as any,
    }),
  },
  weekLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 8,
  },
  weekLabelCell: {
    width: '14.28%',
    alignItems: 'center',
  },
  weekLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  fridayLabelText: {
    color: '#e11d48',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDayCell: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  dayCellUnselected: {
    backgroundColor: 'transparent',
  },
  dayCellSelected: {
    backgroundColor: '#2563eb',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(37, 99, 235, 0.45)' } as any,
    }),
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: '900',
  },
  dayTextToday: {
    color: '#2563eb',
    fontWeight: '800',
  },
  previewChip: {
    backgroundColor: '#e6ebf2',
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      web: { boxShadow: '2px 2px 5px #bec3cc, -2px -2px 5px #ffffff' } as any,
    }),
  },
  previewChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 4,
  },
  previewChipIcon: {
    fontSize: 12,
  },
  previewChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1e293b',
  },
  projectionBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  projectionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
