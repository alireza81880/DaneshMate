import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { NeumorphicCard } from '../components/NeumorphicCard';
import { NeumorphicButton } from '../components/NeumorphicButton';
import { DynamicClassItemData } from '../components/DynamicClassItem';
import { ClassSessionLog, ClassSessionCaptureModal } from '../components/ClassSessionCaptureModal';
import { SessionCard } from '../components/SessionCard';
import { ClassSessionChatViewerScreen } from './ClassSessionChatViewerScreen';

interface NotesScreenProps {
  classes: DynamicClassItemData[];
  sessionLogs: ClassSessionLog[];
  onAddLog: (log: ClassSessionLog) => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog?: (updatedLog: ClassSessionLog) => void;
}

export const NotesScreen: React.FC<NotesScreenProps> = ({
  classes,
  sessionLogs,
  onAddLog,
  onDeleteLog,
  onUpdateLog,
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

  const handleUpdateSingleLog = (updated: ClassSessionLog) => {
    if (onUpdateLog) {
      onUpdateLog(updated);
    }
    if (selectedChatSession?.id === updated.id) {
      setSelectedChatSession(updated);
    }
  };

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
          {filteredLogs.map((log) => (
            <SessionCard
              key={log.id}
              log={log}
              isPlayingAudio={playingId === log.id}
              onToggleAudioPlay={(id) => setPlayingId(playingId === id ? null : id)}
              onDeleteLog={onDeleteLog}
              onOpenTimeline={(l) => setSelectedChatSession(l)}
            />
          ))}
        </View>
      )}

      {/* Interactive Chat-Style Session Viewer Screen */}
      <ClassSessionChatViewerScreen
        visible={!!selectedChatSession}
        sessionLog={selectedChatSession}
        onClose={() => setSelectedChatSession(null)}
        onDeleteLog={onDeleteLog}
        onUpdateLog={handleUpdateSingleLog}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  filterChipText: {
    fontSize: 11,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
  },
  logsList: {
    gap: 12,
  },
});
