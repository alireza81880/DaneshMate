import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { WeekDay, RecurrenceType } from './ClassFormModal';

export interface DynamicClassItemData {
  id: string;
  name: string;
  day: WeekDay;
  time: string;
  recurrence: RecurrenceType;
  professor?: string;
  location?: string;
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
            <Text style={[styles.timeText, { color: palette.textPrimary }]}>{item.time}</Text>
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
    marginBottom: 14,
    width: '100%',
  },
  card: {
    borderRadius: 22,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '6px 6px 14px rgba(0,0,0,0.06), -6px -6px 14px rgba(255,255,255,0.7)',
      } as any,
    }),
  },
  topSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  recurrenceBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  recurrenceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  timePlate: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 9,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  className: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  metaChip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
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
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...Platform.select({
      web: {
        boxShadow: '3px 3px 6px rgba(0,0,0,0.06), -3px -3px 6px rgba(255,255,255,0.8)',
        cursor: 'pointer',
      } as any,
    }),
  },
  actionBtnPressed: {
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.08), inset -2px -2px 4px rgba(255,255,255,0.6)',
      } as any,
    }),
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    borderColor: 'rgba(225, 29, 72, 0.2)',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e11d48',
  },
});
