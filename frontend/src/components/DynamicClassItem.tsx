import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { rtlStyles } from '../utils/rtl';
import { WeekDay, RecurrenceType } from './ClassFormModal';
import { toPersianDigits } from '../utils/jalali';

export interface DynamicClassItemData {
  id: string;
  name: string;
  day: WeekDay;
  time: string;
  recurrence: RecurrenceType;
  anchor_date?: string;
  anchor_timestamp?: number;
  professor?: string;
  location?: string;
  midtermExamDate?: string;
  finalExamDate?: string;
}

interface DynamicClassItemProps {
  item: DynamicClassItemData;
  onEdit: (item: DynamicClassItemData) => void;
  onDelete: (id: string) => void;
}

export const DynamicClassItem: React.FC<DynamicClassItemProps> = ({
  item,
  onEdit,
  onDelete,
}) => {
  const { palette } = useTheme();

  const getRecurrenceBadge = (type: RecurrenceType) => {
    switch (type) {
      case 'bi_weekly':
      case 'biweekly':
        return { label: 'یک هفته در میان', bg: 'rgba(59, 130, 246, 0.15)', color: '#2563EB' };
      case 'even_weeks':
        return { label: 'هفته‌های زوج', bg: 'rgba(147, 51, 234, 0.12)', color: '#9333ea' };
      case 'odd_weeks':
        return { label: 'هفته‌های فرد', bg: 'rgba(234, 88, 12, 0.12)', color: '#ea580c' };
      case 'every_week':
      default:
        return { label: 'هر هفته', bg: 'rgba(67, 97, 238, 0.12)', color: palette.primary };
    }
  };

  const badge = getRecurrenceBadge(item.recurrence || 'every_week');

  const handleDeletePress = () => {
    onDelete(item.id);
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surfaceCard,
            borderColor: palette.borderLuminous || palette.border,
          },
        ]}
      >
        {/* Top: Day badge, Recurrence badge, and Time */}
        <View style={[styles.topRow, rtlStyles.row]}>
          <View style={[styles.badgeGroup, rtlStyles.row]}>
            <View style={[styles.dayBadge, { backgroundColor: palette.surfaceInner }]}>
              <Text style={[styles.dayBadgeText, { color: palette.textPrimary }]}>
                {item.day || 'شنبه'}
              </Text>
            </View>

            <View style={[styles.recurrenceBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.recurrenceBadgeText, { color: badge.color }]}>
                {badge.label}
              </Text>
            </View>
          </View>

          <View style={[styles.timePlate, { backgroundColor: palette.surfaceInner }]}>
            <Text style={[styles.timeText, { color: palette.textPrimary }]}>
              {toPersianDigits(item.time)}
            </Text>
          </View>
        </View>

        {/* Class Name */}
        <Text style={[styles.className, { color: palette.textPrimary }]}>{item.name}</Text>

        {/* Optional Metadata Row (Professor and Location) */}
        {(item.professor || item.location) && (
          <View style={[styles.metaRow, rtlStyles.row]}>
            {item.professor ? (
              <View style={[styles.metaChip, rtlStyles.row, { backgroundColor: palette.surfaceInner }]}>
                <Icon name="profile" size={13} color={palette.textSecondary} />
                <Text style={[styles.metaText, { color: palette.textSecondary }]}>
                  استاد: {item.professor}
                </Text>
              </View>
            ) : null}
            {item.location ? (
              <View style={[styles.metaChip, rtlStyles.row, { backgroundColor: palette.surfaceInner }]}>
                <Icon name="map-pin" size={13} color={palette.textSecondary} />
                <Text style={[styles.metaText, { color: palette.textSecondary }]}>
                  محل: {item.location}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Optional Exam Badges (Midterm & Final Exams) */}
        {(item.midtermExamDate || item.finalExamDate) && (
          <View style={[styles.examsRow, rtlStyles.row]}>
            {item.midtermExamDate ? (
              <View style={[styles.examBadge, rtlStyles.row, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: '#f59e0b' }]}>
                <Icon name="edit" size={12} color="#d97706" />
                <Text style={[styles.examBadgeText, { color: '#d97706' }]}>
                  میان‌ترم: {toPersianDigits(item.midtermExamDate)}
                </Text>
              </View>
            ) : null}
            {item.finalExamDate ? (
              <View style={[styles.examBadge, rtlStyles.row, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: '#ef4444' }]}>
                <Icon name="calendar" size={12} color="#dc2626" />
                <Text style={[styles.examBadgeText, { color: '#dc2626' }]}>
                  پایان‌ترم: {toPersianDigits(item.finalExamDate)}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Footer: CRUD Action Buttons (Edit / Delete) */}
        <View style={[styles.actionsFooter, rtlStyles.row, { borderTopColor: palette.border }]}>
          <Text style={[styles.statusFooterText, { color: palette.textMuted }]}>
            ثبت شده در برنامه هفتگی
          </Text>

          <View style={[styles.buttonsGroup, rtlStyles.row]}>
            <Pressable
              onPress={() => onEdit(item)}
              style={({ pressed: btnP }) => [
                styles.actionBtn,
                { backgroundColor: palette.surfaceInner, borderColor: palette.border },
                btnP && { opacity: 0.75 },
              ]}
              accessibilityLabel="ویرایش کلاس"
              accessibilityRole="button"
            >
              <Text style={[styles.editBtnText, { color: palette.primary }]}>ویرایش</Text>
            </Pressable>

            <Pressable
              onPress={handleDeletePress}
              style={({ pressed: btnP }) => [
                styles.actionBtn,
                styles.deleteBtn,
                { backgroundColor: palette.surfaceInner, borderColor: 'rgba(239, 68, 68, 0.3)' },
                btnP && { opacity: 0.75 },
              ]}
              accessibilityLabel="حذف کلاس"
              accessibilityRole="button"
            >
              <Text style={styles.deleteBtnText}>حذف</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
      } as any,
    }),
  },
  topRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeGroup: {
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dayBadgeText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11,
    lineHeight: 16,
    writingDirection: 'rtl',
  },
  recurrenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recurrenceBadgeText: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 10.5,
    lineHeight: 15,
    writingDirection: 'rtl',
  },
  timePlate: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timeText: {
    fontFamily: FONT_FAMILIES.english.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  className: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  metaRow: {
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metaChip: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 11,
    lineHeight: 16,
    writingDirection: 'rtl',
  },
  examsRow: {
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  examBadge: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  examBadgeText: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 10.5,
    lineHeight: 15,
    writingDirection: 'rtl',
  },
  actionsFooter: {
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  statusFooterText: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 10.5,
    lineHeight: 15,
    writingDirection: 'rtl',
  },
  buttonsGroup: {
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  editBtnText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11.5,
    lineHeight: 16,
    writingDirection: 'rtl',
  },
  deleteBtn: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  deleteBtnText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#ef4444',
    writingDirection: 'rtl',
  },
});
