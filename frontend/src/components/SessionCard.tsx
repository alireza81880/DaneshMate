import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { FONT_FAMILIES } from '../theme/typography';
import { rtlStyles } from '../utils/rtl';
import { NeumorphicCard } from './NeumorphicCard';
import { ClassSessionLog } from './ClassSessionCaptureModal';
import { toPersianDigits, formatJalaliDate, getFullJalaliDateTimeString } from '../utils/jalali';
import { hapticFeedback } from '../utils/haptics';

interface SessionCardProps {
  log: ClassSessionLog;
  onOpenTimeline: (log: ClassSessionLog) => void;
  onDeleteLog: (id: string) => void;
  isPlayingAudio?: boolean;
  onToggleAudioPlay?: (id: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  log,
  onOpenTimeline,
  onDeleteLog,
  isPlayingAudio = false,
  onToggleAudioPlay,
}) => {
  const { palette } = useTheme();

  // Helper to ensure full Jalali date & time format: "۱۴۰۳/۰۷/۰۴ - ۱۶:۴۲"
  const formatFullJalaliTimestamp = (rawStr?: string) => {
    if (!rawStr) return getFullJalaliDateTimeString(new Date());
    if (rawStr.includes('-') && (rawStr.includes('/') || rawStr.includes('۱۴۰') || rawStr.includes('140'))) {
      return toPersianDigits(rawStr);
    }
    if (rawStr.includes(':') && !rawStr.includes('/')) {
      const todayJalali = formatJalaliDate(new Date(), true);
      return `${todayJalali} - ${toPersianDigits(rawStr)}`;
    }
    const d = new Date(rawStr);
    if (!isNaN(d.getTime())) {
      return getFullJalaliDateTimeString(d);
    }
    return toPersianDigits(rawStr);
  };

  // Format Reminder Trigger into dynamic Persian string
  const formatReminderText = (trigger?: string, customText?: string) => {
    if (customText && !customText.toLowerCase().includes('hours before class')) {
      return customText;
    }
    const t = (trigger || '').toLowerCase();
    if (t.includes('5m') || t.includes('5 mins') || t.includes('5 min')) return 'یادآور: ۵ دقیقه قبل';
    if (t.includes('10m') || t.includes('10 mins') || t.includes('10 min')) return 'یادآور: ۱۰ دقیقه قبل';
    if (t.includes('1d') || t.includes('1 day')) return 'یادآور: ۱ روز قبل';
    if (t.includes('24h') || t.includes('24 hours') || t.includes('24 hours before class')) return 'یادآور: ۲۴ ساعت قبل';
    if (t.includes('2d') || t.includes('2 days')) return 'یادآور: ۲ روز قبل';
    if (t.includes('today') || t.includes('امروز')) return 'یادآور: امروز (مرور سریع)';
    if (t.includes('tomorrow') || t.includes('فردا')) return 'یادآور: فردا صبح';
    return `یادآور: ${trigger || 'قبل از جلسه بعد'}`;
  };

  return (
    <NeumorphicCard style={styles.card} borderRadius={20}>
      {/* Header of Log */}
      <View style={[styles.logHeader, rtlStyles.row]}>
        <View style={[styles.logBadgeGroup, rtlStyles.row]}>
          <View style={[styles.classBadge, { backgroundColor: palette.surfaceInner }]}>
            <Text style={[styles.classBadgeText, { color: palette.primary }]}>
              {log.className}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: palette.textMuted }]}>
            ثبت شده: {formatFullJalaliTimestamp(log.createdAt)}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            hapticFeedback.medium();
            onDeleteLog(log.id);
          }}
          hitSlop={8}
        >
          <Text style={styles.deleteText}>حذف</Text>
        </Pressable>
      </View>

      {/* Attached Files Chips List */}
      {log.attachedFiles && log.attachedFiles.length > 0 && (
        <View style={styles.attachedFilesSection}>
          {log.attachedFiles.map((f) => (
            <View
              key={f.id}
              style={[
                styles.fileChipItem,
                rtlStyles.row,
                { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous },
              ]}
            >
              <View style={styles.fileChipBadge}>
                <Text style={[styles.fileChipBadgeText, { color: palette.primary }]}>
                  {f.type.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.fileChipName, { color: palette.textPrimary }]} numberOfLines={1}>
                {f.name}
              </Text>
              <Text style={[styles.fileChipSize, { color: palette.textMuted }]}>
                {f.sizeText}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Voice Memo Widget Preview */}
      {log.voiceMemoSeconds ? (
        <View style={[styles.audioPlate, rtlStyles.row, { backgroundColor: palette.surfaceInner }]}>
          <Pressable
            onPress={() => onToggleAudioPlay && onToggleAudioPlay(log.id)}
            style={[styles.audioPlayBtn, { backgroundColor: palette.primary }]}
          >
            <Text style={{ color: '#ffffff', fontSize: 10 }}>{isPlayingAudio ? '❙❙' : '▶'}</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.audioTitle, { color: palette.textPrimary }]}>
              صوت ضبط شده جلسه ({toPersianDigits(log.voiceMemoSeconds)} ثانیه)
            </Text>
          </View>
        </View>
      ) : null}

      {/* Lecture Notes Body */}
      {log.notesText ? (
        <Text style={[styles.notesBody, { color: palette.textPrimary }]}>
          {log.notesText}
        </Text>
      ) : null}

      {/* Dynamic Persian Reminder Alert Badge & Snooze Status */}
      {log.hasReminder && (
        <View style={[styles.reminderBadge, rtlStyles.row, { borderTopColor: palette.borderLuminous }]}>
          <View style={styles.reminderIconWrapper}>
            <Text style={{ color: '#F43F5E', fontSize: 11 }}>●</Text>
          </View>
          <Text style={styles.reminderBadgeText}>
            {formatReminderText(log.reminderTrigger, log.reminderTimeText)}
          </Text>
          {log.snoozedUntil && (
            <View style={[styles.snoozedPill, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
              <Text style={styles.snoozedPillText}>تعویق: {log.snoozedUntil}</Text>
            </View>
          )}
        </View>
      )}

      {/* Interactive Timeline Navigation Button */}
      <Pressable
        onPress={() => {
          hapticFeedback.light();
          onOpenTimeline(log);
        }}
        style={[styles.openChatTimelineBtn, rtlStyles.row, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}
      >
        <Text style={[styles.openChatTimelineText, { color: palette.primary }]}>
          مرور تایملاین جلسه
        </Text>
        <Text style={[styles.openChatTimelineArrow, { color: palette.primary }]}>‹</Text>
      </Pressable>
    </NeumorphicCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logBadgeGroup: {
    alignItems: 'center',
    gap: 8,
  },
  classBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  classBadgeText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11,
    lineHeight: 16,
    writingDirection: 'rtl',
  },
  timeText: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 11,
    lineHeight: 16,
    writingDirection: 'rtl',
  },
  deleteText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    color: '#EF4444',
    fontSize: 11,
    lineHeight: 16,
    writingDirection: 'rtl',
  },
  attachedFilesSection: {
    gap: 6,
    marginBottom: 10,
  },
  fileChipItem: {
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  fileChipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  fileChipBadgeText: {
    fontFamily: FONT_FAMILIES.english.bold,
    fontSize: 9,
  },
  fileChipName: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 11.5,
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fileChipSize: {
    fontFamily: FONT_FAMILIES.english.regular,
    fontSize: 10,
  },
  audioPlate: {
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  audioPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioTitle: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  audioSub: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 9.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 1,
  },
  notesBody: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  reminderBadge: {
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 8,
    marginBottom: 10,
  },
  reminderIconWrapper: {
    width: 14,
    alignItems: 'center',
  },
  reminderBadgeText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11,
    lineHeight: 16,
    color: '#F43F5E',
    writingDirection: 'rtl',
  },
  snoozedPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  snoozedPillText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    color: '#F43F5E',
    fontSize: 9.5,
    lineHeight: 14,
    writingDirection: 'rtl',
  },
  openChatTimelineBtn: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  openChatTimelineText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12,
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  openChatTimelineArrow: {
    fontSize: 16,
    fontWeight: '800',
  },
});
