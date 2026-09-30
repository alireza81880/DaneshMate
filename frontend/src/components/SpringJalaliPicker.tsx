import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { FONT_FAMILIES } from '../theme/typography';
import { Icon } from './Icon';
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

export const SpringJalaliPicker: React.FC<SpringJalaliPickerProps> = ({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  title = 'تاریخ اولین جلسه این درس را مشخص کنید',
  subtitle = 'برای محاسبه دقیق چرخه ۱۴ روزه (هفته‌های زوج و فرد) و پیش‌بینی ۸ جلسه تا پایان ترم',
}) => {
  const { palette } = useTheme();
  const [currentJYear, currentJMonth, currentJDay] = getCurrentJalaliDate();

  const [selectedYear, setSelectedYear] = useState<number>(currentJYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentJMonth);
  const [selectedDay, setSelectedDay] = useState<number>(currentJDay);

  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.75);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          bounciness: 7,
          speed: 12,
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

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose, scaleAnim, opacityAnim]);

  const handleConfirm = useCallback(() => {
    hapticFeedback.success();
    const mm = selectedMonth.toString().padStart(2, '0');
    const dd = selectedDay.toString().padStart(2, '0');
    const standardDateStr = `${selectedYear}/${mm}/${dd}`;
    const timestamp = jalaliToTimestamp(selectedYear, selectedMonth, selectedDay);

    const [gy, gm, gd] = jalaliToGregorian(selectedYear, selectedMonth, selectedDay);
    const dayOfWeek = (new Date(gy, gm - 1, gd).getDay() + 1) % 7;
    const weekDayName = FULL_WEEK_DAYS[dayOfWeek];
    const formattedLabel = `شروع دوره: ${weekDayName} ${toPersianDigits(selectedDay)} ${PERSIAN_MONTHS[selectedMonth - 1]}`;

    // Forecast exactly 8 bi-weekly sessions
    const sessions: number[] = [];
    const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
    for (let i = 0; i < 8; i++) {
      sessions.push(timestamp + i * FOURTEEN_DAYS_MS);
    }

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSelectDate(standardDateStr, timestamp, formattedLabel, sessions);
      onClose();
    });
  }, [selectedYear, selectedMonth, selectedDay, onSelectDate, onClose, scaleAnim, opacityAnim]);

  const daysInMonth = getDaysInJalaliMonth(selectedYear, selectedMonth);
  const [firstGy, firstGm, firstGd] = jalaliToGregorian(selectedYear, selectedMonth, 1);
  const firstGDate = new Date(firstGy, firstGm - 1, firstGd);
  const firstColOffset = (firstGDate.getDay() + 1) % 7;

  const modalBg = palette.isDark ? '#141A26' : palette.surfaceCard;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.modalBackdrop}>
        <Pressable style={styles.backdropOverlay} onPress={handleDismiss} />

        <Animated.View
          style={[
            styles.springCardWrapper,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: modalBg,
                borderColor: palette.borderLuminous,
                borderTopColor: palette.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.9)',
              },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.header, { borderBottomColor: palette.divider || 'rgba(255, 255, 255, 0.08)' }]}>
              <View style={styles.headerLeft}>
                <View style={[styles.headerIconWrap, { backgroundColor: palette.primary }]}>
                  <Icon name="calendar" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.headerTextGroup}>
                  <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
                  <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleDismiss}
                style={[styles.closeBtn, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={16} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Month Navigation Row */}
            <View style={[styles.monthNavRow, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.selection();
                  if (selectedMonth === 1) {
                    setSelectedYear((y) => y - 1);
                    setSelectedMonth(12);
                  } else {
                    setSelectedMonth((m) => m - 1);
                  }
                }}
                style={styles.monthNavBtn}
              >
                <Text style={[styles.monthNavArrow, { color: palette.primaryLight }]}>‹ ماه قبل</Text>
              </TouchableOpacity>

              <Text style={[styles.monthTitleText, { color: palette.textPrimary }]}>
                {PERSIAN_MONTHS[selectedMonth - 1]} {toPersianDigits(selectedYear)}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.selection();
                  if (selectedMonth === 12) {
                    setSelectedYear((y) => y + 1);
                    setSelectedMonth(1);
                  } else {
                    setSelectedMonth((m) => m + 1);
                  }
                }}
                style={styles.monthNavBtn}
              >
                <Text style={[styles.monthNavArrow, { color: palette.primaryLight }]}>ماه بعد ›</Text>
              </TouchableOpacity>
            </View>

            {/* Inset Well for Date Grid */}
            <View style={[styles.insetWell, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}>
              <View style={[styles.weekDaysRow, { borderBottomColor: palette.divider || 'rgba(255, 255, 255, 0.06)' }]}>
                {WEEK_DAY_LABELS.map((label, idx) => (
                  <View key={label} style={styles.weekDayCell}>
                    <Text style={[styles.weekDayText, idx === 6 && styles.fridayText]}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.daysMatrix}>
                {Array.from({ length: firstColOffset }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCellWrapper} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSel = selectedDay === dayNum;
                  return (
                    <TouchableOpacity
                      key={dayNum}
                      onPress={() => {
                        hapticFeedback.selection();
                        setSelectedDay(dayNum);
                      }}
                      style={[
                        styles.dayCell,
                        isSel && [
                          styles.dayCellSelected,
                          {
                            backgroundColor: palette.primary,
                            shadowColor: palette.primary,
                          },
                        ],
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          { color: isSel ? '#FFFFFF' : palette.textPrimary },
                          isSel && styles.dayCellTextSelected,
                        ]}
                      >
                        {toPersianDigits(dayNum)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Selected Anchor Preview Chip */}
            <View style={[styles.previewChip, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}>
              <Text style={[styles.previewChipDate, { color: palette.primaryLight }]}>
                مبدأ دوره: {toPersianDigits(selectedDay)} {PERSIAN_MONTHS[selectedMonth - 1]} {toPersianDigits(selectedYear)}
              </Text>
              <Text style={styles.previewChipSubtitle}>
                ✨ پیش‌بینی خودکار ۸ جلسه تا پایان ۱۶ هفته ترم تحصیلی
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleDismiss}
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: palette.surfaceInner,
                    borderColor: palette.borderLuminous,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: palette.textSecondary }]}>انصراف</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirm}
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: palette.primary,
                    shadowColor: palette.primary,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Icon name="check" size={16} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>تأیید و ذخیره تاریخ مبدأ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 999,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  springCardWrapper: {
    width: '100%',
    maxWidth: 390,
    zIndex: 1000,
  },
  modalCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.2,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
        shadowColor: '#000000',
      },
      web: {
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
      } as any,
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  monthNavBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  monthNavArrow: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12,
    writingDirection: 'rtl',
  },
  monthTitleText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 14,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  insetWell: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11,
    color: '#94A3B8',
  },
  fridayText: {
    color: '#EF4444',
  },
  daysMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellWrapper: {
    width: '14.28%',
    height: 36,
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 1,
  },
  dayCellSelected: {
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dayCellText: {
    fontFamily: FONT_FAMILIES.english.bold,
    fontSize: 12.5,
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  previewChip: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    marginBottom: 14,
    gap: 4,
  },
  previewChipDate: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  previewChipSubtitle: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 10.5,
    color: '#10B981',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  confirmButtonText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12,
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
});
