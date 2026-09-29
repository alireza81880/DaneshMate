import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT_FAMILIES } from '../theme/typography';
import { rtlStyles } from '../utils/rtl';
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

export interface SpringCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateString: string, anchorTimestamp: number, formattedLabel: string) => void;
  initialDate?: string;
  title?: string;
  subtitle?: string;
}

const WEEK_DAY_LABELS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const FULL_WEEK_DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

/**
 * SpringCalendarModal
 * Reusable Neumorphic Spring-Animated Jalali Calendar Modal
 * Designed with physical spring dynamics (bounciness: 8, speed: 12)
 * Features deep Neumorphic inset wells for date grids & soft elevated surfaces for active chips.
 */
export const SpringCalendarModal: React.FC<SpringCalendarModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  title = 'تاریخ اولین جلسه این کلاس را انتخاب کنید',
  subtitle = 'برای محاسبه دقیق یادآورها و تعیین چرخه ۱۴ روزه (هفته‌های زوج و فرد)، تاریخ مبدأ را مشخص نمایید.',
}) => {
  const [currentJYear, currentJMonth, currentJDay] = getCurrentJalaliDate();

  // Internal state for selected Jalali Year, Month, Day
  const [selectedYear, setSelectedYear] = useState<number>(currentJYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentJMonth);
  const [selectedDay, setSelectedDay] = useState<number>(currentJDay);

  // Animated Values for Spring Motion
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Initialize from initialDate if provided
  useEffect(() => {
    if (initialDate) {
      const match = initialDate.match(/[۰-۹0-9]+/g);
      if (match && match.length >= 3) {
        const y = parseInt(match[0].replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
        const m = parseInt(match[1].replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
        const d = parseInt(match[2].replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
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

  // Handle Smooth Spring Transitions on Open
  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.72);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          bounciness: 8,
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
        toValue: 0.78,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose, scaleAnim, opacityAnim]);

  // Confirm and calculate UNIX timestamp
  const handleConfirm = useCallback(() => {
    hapticFeedback.success();
    const mm = selectedMonth.toString().padStart(2, '0');
    const dd = selectedDay.toString().padStart(2, '0');
    const standardDateStr = `${selectedYear}/${mm}/${dd}`;
    const timestamp = jalaliToTimestamp(selectedYear, selectedMonth, selectedDay);

    // Compute Persian weekday name for label
    const [gy, gm, gd] = jalaliToGregorian(selectedYear, selectedMonth, selectedDay);
    const dayOfWeek = (new Date(gy, gm - 1, gd).getDay() + 1) % 7;
    const weekDayName = FULL_WEEK_DAYS[dayOfWeek];
    const formattedLabel = `شروع دوره: ${weekDayName} ${toPersianDigits(selectedDay)} ${PERSIAN_MONTHS[selectedMonth - 1]}`;

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
      onSelectDate(standardDateStr, timestamp, formattedLabel);
      onClose();
    });
  }, [selectedYear, selectedMonth, selectedDay, onSelectDate, onClose, scaleAnim, opacityAnim]);

  // Calculate Calendar Grid Metrics
  const daysInMonth = getDaysInJalaliMonth(selectedYear, selectedMonth);

  // Calculate day of week of the 1st of this Jalali month
  const [firstGy, firstGm, firstGd] = jalaliToGregorian(selectedYear, selectedMonth, 1);
  const firstGDate = new Date(firstGy, firstGm - 1, firstGd);
  const firstColOffset = (firstGDate.getDay() + 1) % 7; // Saturday = 0, ..., Friday = 6

  // Available Years
  const availableYears = [currentJYear - 1, currentJYear, currentJYear + 1, currentJYear + 2];

  // Currently selected weekday for top indicator
  const [selectedGy, selectedGm, selectedGd] = jalaliToGregorian(selectedYear, selectedMonth, selectedDay);
  const currentWeekdayIndex = (new Date(selectedGy, selectedGm - 1, selectedGd).getDay() + 1) % 7;
  const currentWeekdayName = FULL_WEEK_DAYS[currentWeekdayIndex];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.modalBackdrop}>
        {/* Click outside backdrop to dismiss */}
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
          <NeumorphicCard style={styles.modalCard} borderRadius={28}>
            {/* Header Badge & Title */}
            <View style={styles.header}>
              <View style={styles.biweeklyBadge}>
                <Text style={styles.biweeklyBadgeIcon}>🎯</Text>
                <Text style={styles.biweeklyBadgeText}>یک هفته در میان (چرخه ۱۴ روزه)</Text>
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            {/* Active Date Elevation Pill */}
            <View style={styles.activePillCard}>
              <View style={styles.activePillLeft}>
                <Text style={styles.activePillWeekday}>{currentWeekdayName}</Text>
                <Text style={styles.activePillDate}>
                  {toPersianDigits(selectedDay)} {PERSIAN_MONTHS[selectedMonth - 1]} {toPersianDigits(selectedYear)}
                </Text>
              </View>
              <View style={styles.activePillTag}>
                <Text style={styles.activePillTagText}>تاریخ مبدأ</Text>
              </View>
            </View>

            {/* Year Selector */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionHeaderLabel}>سال تحصیلی:</Text>
              <View style={styles.yearChipsWrap}>
                {availableYears.map((yr) => {
                  const isSel = selectedYear === yr;
                  return (
                    <TouchableOpacity
                      key={yr}
                      onPress={() => {
                        hapticFeedback.selection();
                        setSelectedYear(yr);
                      }}
                      activeOpacity={0.7}
                      style={[styles.yearChip, isSel && styles.yearChipActive]}
                    >
                      <Text style={[styles.yearChipText, isSel && styles.yearChipTextActive]}>
                        {toPersianDigits(yr)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Month Selector (Horizontal Scroll with Neumorphic Chips) */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionHeaderLabel}>ماه:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.monthsScrollTrack}
              >
                {PERSIAN_MONTHS.map((mName, idx) => {
                  const mNum = idx + 1;
                  const isSel = selectedMonth === mNum;
                  return (
                    <TouchableOpacity
                      key={mName}
                      onPress={() => {
                        hapticFeedback.selection();
                        setSelectedMonth(mNum);
                        const maxD = getDaysInJalaliMonth(selectedYear, mNum);
                        if (selectedDay > maxD) {
                          setSelectedDay(maxD);
                        }
                      }}
                      activeOpacity={0.7}
                      style={[styles.monthChip, isSel && styles.monthChipActive]}
                    >
                      <Text style={[styles.monthChipText, isSel && styles.monthChipTextActive]}>
                        {mName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* DEEP NEUMORPHIC INSET WELL: Calendar Day Grid */}
            <View style={styles.insetWellContainer}>
              {/* Day-of-Week Column Headers */}
              <View style={styles.weekHeadersRow}>
                {WEEK_DAY_LABELS.map((label, i) => (
                  <View key={i} style={styles.weekHeaderCell}>
                    <Text
                      style={[
                        styles.weekHeaderText,
                        i === 6 && { color: '#EF4444' }, // جمعه (Friday) in red accent
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 7-Column Days Grid */}
              <View style={styles.daysMatrixGrid}>
                {/* Empty offset spacer cells before the 1st of month */}
                {Array.from({ length: firstColOffset }, (_, i) => (
                  <View key={`empty-${i}`} style={styles.emptyDayCell} />
                ))}

                {/* Day Number Chips */}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const isSelected = selectedDay === d;
                  const dayColIndex = (firstColOffset + (d - 1)) % 7;
                  const isFriday = dayColIndex === 6;

                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => {
                        hapticFeedback.medium();
                        setSelectedDay(d);
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.dayCell,
                        isFriday && styles.dayCellFriday,
                        isSelected && styles.dayCellSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          isFriday && styles.dayCellTextFriday,
                          isSelected && styles.dayCellTextSelected,
                        ]}
                      >
                        {toPersianDigits(d)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <NeumorphicButton
                title="انصراف"
                size="md"
                onPress={handleDismiss}
                style={styles.cancelBtn}
              />
              <NeumorphicButton
                title="تأیید تاریخ مبدأ"
                variant="primary"
                size="md"
                onPress={handleConfirm}
                style={styles.confirmBtn}
              />
            </View>
          </NeumorphicCard>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 26, 0.72)',
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
    maxWidth: 420,
    zIndex: 1000,
  },
  modalCard: {
    padding: 20,
    backgroundColor: '#E6EBF2',
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  biweeklyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  biweeklyBadgeIcon: {
    fontSize: 13,
  },
  biweeklyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  activePillCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)',
      } as any,
      default: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
      },
    }),
  },
  activePillLeft: {
    alignItems: 'flex-start',
  },
  activePillWeekday: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 1,
  },
  activePillDate: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  activePillTag: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePillTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  sectionRow: {
    marginBottom: 10,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
    textAlign: 'right',
  },
  yearChipsWrap: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  yearChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
      } as any,
      default: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  yearChipTextActive: {
    color: '#FFFFFF',
  },
  monthsScrollTrack: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  monthChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  monthChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
      } as any,
      default: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  monthChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  monthChipTextActive: {
    color: '#FFFFFF',
  },
  // DEEP NEUMORPHIC INSET WELL
  insetWellContainer: {
    backgroundColor: '#D9E0EB',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 6,
    ...Platform.select({
      web: {
        boxShadow: 'inset 3px 3px 6px rgba(0, 0, 0, 0.14), inset -3px -3px 6px rgba(255, 255, 255, 0.75)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    }),
  },
  weekHeadersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekHeaderText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
  },
  daysMatrixGrid: {
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
    borderRadius: 12,
    marginVertical: 2,
  },
  dayCellFriday: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  dayCellSelected: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1D4ED8',
    ...Platform.select({
      web: {
        boxShadow: '0 3px 10px rgba(37, 99, 235, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
      } as any,
      default: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
        elevation: 4,
      },
    }),
  },
  dayCellText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12,
    lineHeight: 16,
    color: '#1E293B',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  dayCellTextFriday: {
    color: '#EF4444',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: rtlStyles.row.flexDirection,
    gap: 12,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1.4,
  },
});
