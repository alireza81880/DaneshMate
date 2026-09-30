import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { getRtlRow } from '../utils/rtl';
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
  onRecordLog?: (classId: string) => void;
}

export const DynamicClassItem: React.FC<DynamicClassItemProps> = ({
  item,
  onEdit,
  onDelete,
  onRecordLog,
}) => {
  const { palette } = useTheme();

  const getRecurrenceConfig = (type: RecurrenceType) => {
    switch (type) {
      case 'bi_weekly':
      case 'biweekly':
        return { label: 'یک هفته در میان', bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' };
      case 'even_weeks':
        return { label: 'هفته‌های زوج', bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' };
      case 'odd_weeks':
        return { label: 'هفته‌های فرد', bg: 'rgba(249, 115, 22, 0.15)', color: '#F97316' };
      case 'every_week':
      default:
        return { label: 'هر هفته', bg: 'rgba(59, 130, 246, 0.15)', color: palette.primary };
    }
  };

  const recCfg = getRecurrenceConfig(item.recurrence || 'every_week');

  const cardBg = palette.isDark ? '#141A28' : palette.surfaceCard;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: palette.borderLuminous,
            borderTopColor: palette.isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.8)',
          },
        ]}
      >
        {/* Top Header: Class Name, Time & Recurrence Badge matching Web */}
        <View style={[styles.topRow, { flexDirection: getRtlRow() }]}>
          <View style={styles.titleColumn}>
            <Text style={[styles.className, { color: palette.textPrimary }]}>
              {item.name}
            </Text>
            <View style={[styles.timeRow, { flexDirection: getRtlRow() }]}>
              <Icon name="clock" size={13} color={palette.textSecondary} />
              <Text style={[styles.timeText, { color: palette.textSecondary }]}>
                {item.day} • {toPersianDigits(item.time)}
              </Text>
            </View>
          </View>

          <View style={[styles.recBadge, { backgroundColor: recCfg.bg }]}>
            <Text style={[styles.recBadgeText, { color: recCfg.color }]}>
              {recCfg.label}
            </Text>
          </View>
        </View>

        {/* Metadata: Professor & Location Chips matching Web */}
        {(item.professor || item.location) && (
          <View style={[styles.metaRow, { flexDirection: getRtlRow() }]}>
            {item.professor ? (
              <View
                style={[
                  styles.metaChip,
                  {
                    flexDirection: getRtlRow(),
                    backgroundColor: palette.surfaceInner,
                    borderColor: palette.borderLuminous,
                  },
                ]}
              >
                <Icon name="profile" size={13} color="#3B82F6" />
                <Text style={[styles.metaText, { color: palette.textPrimary }]}>
                  استاد: {item.professor}
                </Text>
              </View>
            ) : null}

            {item.location ? (
              <View
                style={[
                  styles.metaChip,
                  {
                    flexDirection: getRtlRow(),
                    backgroundColor: palette.surfaceInner,
                    borderColor: palette.borderLuminous,
                  },
                ]}
              >
                <Icon name="map-pin" size={13} color="#10B981" />
                <Text style={[styles.metaText, { color: palette.textPrimary }]}>
                  محل: {item.location}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Exam Badges if scheduled */}
        {(item.midtermExamDate || item.finalExamDate) && (
          <View style={[styles.examRow, { flexDirection: getRtlRow() }]}>
            {item.midtermExamDate ? (
              <View
                style={[
                  styles.examChip,
                  {
                    flexDirection: getRtlRow(),
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                  },
                ]}
              >
                <Icon name="edit" size={12} color="#D97706" />
                <Text style={[styles.examChipText, { color: '#D97706' }]}>
                  میان‌ترم: {toPersianDigits(item.midtermExamDate)}
                </Text>
              </View>
            ) : null}

            {item.finalExamDate ? (
              <View
                style={[
                  styles.examChip,
                  {
                    flexDirection: getRtlRow(),
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  },
                ]}
              >
                <Icon name="calendar" size={12} color="#DC2626" />
                <Text style={[styles.examChipText, { color: '#DC2626' }]}>
                  پایان‌ترم: {toPersianDigits(item.finalExamDate)}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Footer: Log trigger on left, Edit & Delete on right matching Web */}
        <View
          style={[
            styles.footer,
            {
              flexDirection: getRtlRow(),
              borderTopColor: palette.divider || 'rgba(255, 255, 255, 0.08)',
            },
          ]}
        >
          {onRecordLog ? (
            <TouchableOpacity
              onPress={() => onRecordLog(item.id)}
              style={[styles.recordLogBtn, { flexDirection: getRtlRow() }]}
              activeOpacity={0.7}
            >
              <Icon name="mic" size={14} color={palette.primary} />
              <Text style={[styles.recordLogText, { color: palette.primary }]}>
                ثبت لاگ جلسه
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <View style={[styles.btnGroup, { flexDirection: getRtlRow() }]}>
            <TouchableOpacity
              onPress={() => onEdit(item)}
              style={[
                styles.actionBtn,
                {
                  flexDirection: getRtlRow(),
                  backgroundColor: palette.surfaceInner,
                  borderColor: palette.borderLuminous,
                },
              ]}
              activeOpacity={0.7}
            >
              <Icon name="edit" size={13} color={palette.primary} />
              <Text style={[styles.btnText, { color: palette.textPrimary }]}>ویرایش</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              style={[
                styles.actionBtn,
                styles.deleteActionBtn,
                {
                  flexDirection: getRtlRow(),
                  backgroundColor: palette.surfaceInner,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                },
              ]}
              activeOpacity={0.7}
            >
              <Icon name="trash" size={13} color="#EF4444" />
              <Text style={[styles.btnText, { color: '#EF4444' }]}>حذف</Text>
            </TouchableOpacity>
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
    borderWidth: 1.2,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
        shadowColor: '#000000',
      },
    }),
  },
  topRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  titleColumn: {
    flex: 1,
  },
  className: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  timeRow: {
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  recBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBadgeText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 10.5,
    writingDirection: 'rtl',
  },
  metaRow: {
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  metaChip: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  metaText: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 11,
    lineHeight: 16,
    writingDirection: 'rtl',
  },
  examRow: {
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  examChip: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  examChipText: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 10.5,
    writingDirection: 'rtl',
  },
  footer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    gap: 8,
  },
  recordLogBtn: {
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  recordLogText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11.5,
    writingDirection: 'rtl',
  },
  btnGroup: {
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteActionBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  btnText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11.5,
    writingDirection: 'rtl',
  },
});
