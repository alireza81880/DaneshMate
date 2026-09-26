import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { NeumorphicCard } from '../components/NeumorphicCard';
import { NeumorphicButton } from '../components/NeumorphicButton';
import { DynamicClassItemData } from '../components/DynamicClassItem';
import { ClassSessionLog, ClassSessionCaptureModal } from '../components/ClassSessionCaptureModal';
import { ClassSessionChatViewerScreen } from './ClassSessionChatViewerScreen';

interface NotesScreenProps {
  classes: DynamicClassItemData[];
  sessionLogs: ClassSessionLog[];
  onAddLog: (log: ClassSessionLog) => void;
  onDeleteLog: (id: string) => void;
}

export const NotesScreen: React.FC<NotesScreenProps> = ({
  classes,
  sessionLogs,
  onAddLog,
  onDeleteLog,
}) => {
  const { palette } = useTheme();
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedChatSession, setSelectedChatSession] = useState<ClassSessionLog | null>(null);

  const filteredLogs = sessionLogs.filter((log) => {
    if (selectedClassFilter === 'all') return true;
    return log.classId === selectedClassFilter;
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.textPrimary }]}>
            یادداشت و رسانه کلاس‌ها
          </Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            لاگ‌های چندرسانه‌ای ضبط شده، اسنپ‌شات تخته و صوت استاد
          </Text>
        </View>

        <NeumorphicButton
          title="+ ثبت جلسه"
          variant="primary"
          size="sm"
          onPress={() => setIsCaptureModalOpen(true)}
        />
      </View>

      {/* Class Filter Chips */}
      {classes.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <Pressable
            onPress={() => setSelectedClassFilter('all')}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedClassFilter === 'all' ? palette.surfaceInner : palette.surfaceCard,
                borderColor: selectedClassFilter === 'all' ? palette.primary : palette.border,
                borderWidth: selectedClassFilter === 'all' ? 1.5 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: selectedClassFilter === 'all' ? palette.primary : palette.textSecondary,
                  fontWeight: selectedClassFilter === 'all' ? '900' : '700',
                },
              ]}
            >
              همه کلاس‌ها ({sessionLogs.length})
            </Text>
          </Pressable>

          {classes.map((cls) => {
            const isSel = selectedClassFilter === cls.id;
            const count = sessionLogs.filter((l) => l.classId === cls.id).length;
            return (
              <Pressable
                key={cls.id}
                onPress={() => setSelectedClassFilter(cls.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSel ? palette.surfaceInner : palette.surfaceCard,
                    borderColor: isSel ? palette.primary : palette.border,
                    borderWidth: isSel ? 1.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSel ? palette.primary : palette.textSecondary,
                      fontWeight: isSel ? '900' : '700',
                    },
                  ]}
                >
                  {cls.name} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <NeumorphicCard style={styles.emptyCard} borderRadius={24}>
          <View style={[styles.emptyIconCircle, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}>
            {Platform.OS === 'web' ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={palette.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <Text style={{ fontSize: 24, color: palette.primary }}>🎙</Text>
            )}
          </View>
          <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
            هنوز یادداشت یا فایلی برای کلاس‌ها ثبت نشده است
          </Text>
          <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
            سر کلاس روی دکمه «+ ثبت جلسه» بزنید تا فایل‌های PDF، اسلاید، عکس تخته و نکات را الصاق کنید.
          </Text>
          <NeumorphicButton
            title="ثبت اولین لاگ جلسه"
            variant="primary"
            size="md"
            onPress={() => setIsCaptureModalOpen(true)}
            style={{ marginTop: 14 }}
          />
        </NeumorphicCard>
      ) : (
        <View style={styles.logsList}>
          {filteredLogs.map((log) => {
            const isAudioPlaying = playingId === log.id;
            return (
              <NeumorphicCard key={log.id} style={styles.logCard} borderRadius={20}>
                {/* Header of Log */}
                <View style={styles.logHeader}>
                  <View style={styles.logBadgeGroup}>
                    <View style={[styles.classBadge, { backgroundColor: palette.surfaceInner }]}>
                      <Text style={[styles.classBadgeText, { color: palette.primary }]}>
                        {log.className}
                      </Text>
                    </View>
                    <Text style={[styles.timeText, { color: palette.textMuted }]}>
                      ساعت {log.createdAt}
                    </Text>
                  </View>

                  <Pressable onPress={() => onDeleteLog(log.id)} hitSlop={8}>
                    <Text style={styles.deleteText}>حذف</Text>
                  </Pressable>
                </View>

                {/* Attached Files Chips List (Universal Upload Support) */}
                {log.attachedFiles && log.attachedFiles.length > 0 && (
                  <View style={styles.attachedFilesSection}>
                    {log.attachedFiles.map((f) => (
                      <View
                        key={f.id}
                        style={[
                          styles.fileChipItem,
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
                  <View style={[styles.audioPlate, { backgroundColor: palette.surfaceInner }]}>
                    <Pressable
                      onPress={() => setPlayingId(isAudioPlaying ? null : log.id)}
                      style={[styles.audioPlayBtn, { backgroundColor: palette.primary }]}
                    >
                      {Platform.OS === 'web' ? (
                        isAudioPlaying ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )
                      ) : (
                        <Text style={{ color: '#ffffff', fontSize: 10 }}>{isAudioPlaying ? '❙❙' : '▶'}</Text>
                      )}
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.audioTitle, { color: palette.textPrimary }]}>
                        صوت ضبط شده استاد ({log.voiceMemoSeconds} ثانیه)
                      </Text>
                      <Text style={[styles.audioSub, { color: palette.textMuted }]}>
                        {isAudioPlaying ? 'درحال پخش صوت ضبط شده...' : 'آماده برای مرور مجدد مباحث'}
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

                {/* Reminder Alert Badge & Snooze Status */}
                {log.hasReminder && (
                  <View style={[styles.reminderBadge, { borderTopColor: palette.borderLuminous }]}>
                    <View style={styles.reminderIconWrapper}>
                      {Platform.OS === 'web' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      ) : (
                        <Text style={{ color: '#F43F5E', fontSize: 11 }}>●</Text>
                      )}
                    </View>
                    <Text style={styles.reminderBadgeText}>
                      یادآور: {log.reminderTimeText || log.reminderTrigger || 'مرور قبل از جلسه بعد'}
                    </Text>
                    {log.snoozedUntil && (
                      <View style={[styles.snoozedPill, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                        <Text style={styles.snoozedPillText}>تعویق: {log.snoozedUntil}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Interactive Chat-Feed Navigation Button */}
                <Pressable
                  onPress={() => setSelectedChatSession(log)}
                  style={[styles.openChatTimelineBtn, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}
                >
                  <Text style={[styles.openChatTimelineText, { color: palette.primary }]}>
                    مشاهده در قالب چت و تایم‌لاین تعاملی 💬
                  </Text>
                  <Text style={[styles.openChatTimelineArrow, { color: palette.primary }]}>‹</Text>
                </Pressable>
              </NeumorphicCard>
            );
          })}
        </View>
      )}

      {/* Interactive Chat-Style Session Viewer Screen */}
      <ClassSessionChatViewerScreen
        visible={!!selectedChatSession}
        sessionLog={selectedChatSession}
        onClose={() => setSelectedChatSession(null)}
        onDeleteLog={onDeleteLog}
      />

      {/* Capture Modal */}
      <ClassSessionCaptureModal
        visible={isCaptureModalOpen}
        classes={classes}
        onSaveLog={onAddLog}
        onClose={() => setIsCaptureModalOpen(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '900', textAlign: 'right', marginBottom: 2 },
  subtitle: { fontSize: 11.5, textAlign: 'right' },
  filterScroll: { gap: 8, paddingVertical: 4, marginBottom: 16 },
  filterChip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 12 },
  filterChipText: { fontSize: 11 },
  emptyCard: { padding: 28, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  emptyTitle: { fontSize: 14.5, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  emptySubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
  logsList: { gap: 12 },
  logCard: { padding: 16 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logBadgeGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  classBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  classBadgeText: { fontSize: 11, fontWeight: '800' },
  timeText: { fontSize: 11 },
  deleteText: { fontSize: 11, fontWeight: '700', color: '#e11d48' },
  photoPlate: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, marginBottom: 8 },
  photoTitle: { fontSize: 12, fontWeight: '800', textAlign: 'right' },
  photoSub: { fontSize: 10, textAlign: 'right' },
  audioPlate: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, marginBottom: 8 },
  audioPlayBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  audioTitle: { fontSize: 12, fontWeight: '800', textAlign: 'right' },
  audioSub: { fontSize: 10, textAlign: 'right' },
  notesBody: { fontSize: 12.5, lineHeight: 20, textAlign: 'right', marginVertical: 4 },
  reminderBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  reminderBadgeText: { fontSize: 11, fontWeight: '700', color: '#F43F5E' },
  reminderIconWrapper: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  snoozedPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6 },
  snoozedPillText: { fontSize: 9, fontWeight: '800', color: '#F43F5E' },
  emptyIconCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  attachedFilesSection: { gap: 6, marginVertical: 6 },
  fileChipItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  fileChipBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(59, 130, 246, 0.15)' },
  fileChipBadgeText: { fontSize: 9, fontWeight: '900' },
  fileChipName: { fontSize: 11, fontWeight: '700', flex: 1, textAlign: 'right' },
  fileChipSize: { fontSize: 10 },
  openChatTimelineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  openChatTimelineText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  openChatTimelineArrow: {
    fontSize: 16,
    fontWeight: '900',
  },
});
