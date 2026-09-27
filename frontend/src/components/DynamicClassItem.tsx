import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
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
            borderColor: palette.border,
          },
        ]}
      >
        <View style={styles.topSpecular} />

        {/* Top: Day badge, Recurrence badge, and Time */}
        <View style={styles.topRow}>
          <View style={styles.badgeGroup}>
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
            <Text style={[styles.timeText, { color: palette.textPrimary }]}>{toPersianDigits(item.time)}</Text>
          </View>
        </View>

        {/* Class Name */}
        <Text style={[styles.className, { color: palette.textPrimary }]}>{item.name}</Text>

        {/* Optional Metadata Row (Professor and Location) */}
        {(item.professor || item.location) && (
          <View style={styles.metaRow}>
            {item.professor ? (
              <View style={[styles.metaChip, { backgroundColor: palette.surfaceInner }]}>
                <Text style={[styles.metaText, { color: palette.textSecondary }]}>
                  👨‍🏫 استاد: {item.professor}
                </Text>
              </View>
            ) : null}
            {item.location ? (
              <View style={[styles.metaChip, { backgroundColor: palette.surfaceInner }]}>
                <Text style={[styles.metaText, { color: palette.textSecondary }]}>
                  📍 محل: {item.location}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Optional Exam Badges (Midterm & Final Exams) */}
        {(item.midtermExamDate || item.finalExamDate) && (
          <View style={styles.examsRow}>
            {item.midtermExamDate ? (
              <View style={[styles.examBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: '#f59e0b' }]}>
                <Text style={styles.examBadgeIcon}>📝</Text>
                <Text style={[styles.examBadgeText, { color: '#d97706' }]}>
                  میان‌ترم: {toPersianDigits(item.midtermExamDate)}
                </Text>
              </View>
            ) : null}
            {item.finalExamDate ? (
              <View style={[styles.examBadge, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: '#ef4444' }]}>
                <Text style={styles.examBadgeIcon}>🎯</Text>
                <Text style={[styles.examBadgeText, { color: '#dc2626' }]}>
                  پایان‌ترم: {toPersianDigits(item.finalExamDate)}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Footer: CRUD Action Buttons (Edit / Delete) */}
        <View style={[styles.actionsFooter, { borderTopColor: palette.divider }]}>
          <Text style={[styles.statusFooterText, { color: palette.textMuted }]}>
            ثبت شده در برنامه هفتگی
          </Text>

          <View style={styles.buttonsGroup}>
            {/* Edit Button */}
            <Pressable
              onPress={() => onEdit(item)}
              style={({ pressed: btnP }) => [
                styles.actionBtn,
                { backgroundColor: palette.surfaceCard },
                btnP && [styles.actionBtnPressed, { backgroundColor: palette.surfaceInner }],
              ]}
              accessibilityLabel="ویرایش کلاس"
              accessibilityRole="button"
            >
              <Text style={[styles.editBtnText, { color: palette.primary }]}>ویرایش</Text>
            </Pressable>

            {/* Delete Button - Independent & Directly Responsive */}
            <Pressable
              onPress={handleDeletePress}
              style={({ pressed: btnP }) => [
                styles.actionBtn,
                styles.deleteBtn,
                { backgroundColor: palette.surfaceCard },
                btnP && [styles.actionBtnPressed, { backgroundColor: palette.surfaceInner }],
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
    marginBottom: 12,
    width: '100%',
  },
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow:
          '5px 5px 12px rgba(166, 175, 195, 0.4), -5px -5px 12px rgba(255, 255, 255, 0.8)',
      } as any,
      default: {
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
    }),
  },
  topSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  recurrenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recurrenceBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  timePlate: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  className: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metaChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  examsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  examBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  examBadgeIcon: {
    fontSize: 11,
  },
  examBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  actionsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  statusFooterText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  buttonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      web: {
        boxShadow:
          '2px 2px 5px rgba(166, 175, 195, 0.35), -2px -2px 5px rgba(255, 255, 255, 0.7)',
      } as any,
    }),
  },
  actionBtnPressed: {
    ...Platform.select({
      web: {
        boxShadow:
          'inset 1px 1px 3px rgba(166, 175, 195, 0.5), inset -1px -1px 3px rgba(255, 255, 255, 0.8)',
      } as any,
    }),
  },
  editBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  deleteBtn: {
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  deleteBtnText: {
    color: '#e11d48',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
