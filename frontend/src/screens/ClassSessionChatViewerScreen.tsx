import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  FlatList,
  Pressable,
  Platform,
  TextInput,
  ListRenderItem,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AttachedFile, ClassSessionLog } from '../components/ClassSessionCaptureModal';
import { AudioMemoBubble } from '../components/AudioMemoBubble';
import { DocumentBubble } from '../components/DocumentBubble';
import { LectureNoteBubble } from '../components/LectureNoteBubble';
import { ReminderBubble } from '../components/ReminderBubble';

export type ChatFeedItemType =
  | 'system_date'
  | 'system_welcome'
  | 'audio_memo'
  | 'document'
  | 'lecture_note'
  | 'reminder'
  | 'user_message';

export interface ChatFeedItem {
  id: string;
  type: ChatFeedItemType;
  time: string;
  text?: string;
  durationSeconds?: number;
  file?: AttachedFile;
  snoozedUntil?: string;
}

interface ClassSessionChatViewerScreenProps {
  visible: boolean;
  sessionLog: ClassSessionLog | null;
  onClose: () => void;
  onDeleteLog?: (id: string) => void;
}

export const ClassSessionChatViewerScreen: React.FC<ClassSessionChatViewerScreenProps> = React.memo(
  ({ visible, sessionLog, onClose, onDeleteLog }) => {
    const { palette } = useTheme();

    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [followUpNotes, setFollowUpNotes] = useState<Array<{ id: string; text: string; time: string }>>([]);
    const [inputText, setInputText] = useState('');

    const flatListRef = useRef<FlatList<ChatFeedItem>>(null);

    // Reset local state when sessionLog changes or modal opens
    useEffect(() => {
      setToastMessage(null);
      setFollowUpNotes([]);
      setInputText('');
    }, [sessionLog?.id, visible]);

    const handleOpenToast = useCallback((fileName: string) => {
      setToastMessage(`در حال فراخوانی و باز کردن «${fileName}» در برنامه پیش‌فرض...`);
      setTimeout(() => setToastMessage(null), 3000);
    }, []);

    const handleSendNote = useCallback(() => {
      if (!inputText.trim()) return;
      const newMsg = {
        id: `usr-${Date.now()}`,
        text: inputText.trim(),
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };
      setFollowUpNotes((prev) => [...prev, newMsg]);
      setInputText('');

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }, [inputText]);

    // Build memoized, structured feed items to avoid recreating arrays on every render
    const feedItems = useMemo<ChatFeedItem[]>(() => {
      if (!sessionLog) return [];

      const items: ChatFeedItem[] = [
        {
          id: 'date-header',
          type: 'system_date',
          time: sessionLog.createdAt,
          text: 'امروز • لاگ چندرسانه‌ای جلسه',
        },
        {
          id: 'sys-welcome',
          type: 'system_welcome',
          time: sessionLog.createdAt,
          text: `✦ جلسه کلاسی «${sessionLog.className}» در ساعت ${sessionLog.createdAt} ثبت گردید. تمام فایل‌ها، صداها و نکات جهت مرور آماده هستند.`,
        },
      ];

      // Audio Memo Item
      if (sessionLog.voiceMemoSeconds) {
        items.push({
          id: `audio-${sessionLog.id}`,
          type: 'audio_memo',
          time: sessionLog.createdAt,
          durationSeconds: sessionLog.voiceMemoSeconds,
        });
      }

      // Attached Document Items (decoupled into individual item bubbles)
      if (sessionLog.attachedFiles && sessionLog.attachedFiles.length > 0) {
        sessionLog.attachedFiles.forEach((file) => {
          items.push({
            id: `doc-${file.id}`,
            type: 'document',
            time: sessionLog.createdAt,
            file,
          });
        });
      }

      // Lecture Notes Item
      if (sessionLog.notesText) {
        items.push({
          id: `note-${sessionLog.id}`,
          type: 'lecture_note',
          time: sessionLog.createdAt,
          text: sessionLog.notesText,
        });
      }

      // Smart Reminder Item
      if (sessionLog.hasReminder) {
        items.push({
          id: `reminder-${sessionLog.id}`,
          type: 'reminder',
          time: sessionLog.createdAt,
          text: sessionLog.reminderTimeText || sessionLog.reminderTrigger || '۲۴ ساعت قبل از کلاس',
          snoozedUntil: sessionLog.snoozedUntil,
        });
      }

      // User Follow-up Messages
      followUpNotes.forEach((fn) => {
        items.push({
          id: fn.id,
          type: 'user_message',
          time: fn.time,
          text: fn.text,
        });
      });

      return items;
    }, [sessionLog, followUpNotes]);

    // Strict item key extractor
    const keyExtractor = useCallback((item: ChatFeedItem) => item.id, []);

    // Fixed layout metrics to completely eliminate dynamic layout thrashing
    const getItemLayout = useCallback(
      (_data: any, index: number) => ({
        length: 110,
        offset: 110 * index,
        index,
      }),
      []
    );

    // Optimized item renderer delegating to isolated leaf components
    const renderFeedItem: ListRenderItem<ChatFeedItem> = useCallback(
      ({ item }) => {
        switch (item.type) {
          case 'system_date':
            return (
              <View style={styles.dateSeparatorRow}>
                <View
                  style={[
                    styles.dateSeparatorPill,
                    {
                      backgroundColor: palette.surfaceInner,
                      borderColor: palette.borderLuminous,
                    },
                  ]}
                >
                  <Text style={[styles.dateSeparatorText, { color: palette.textSecondary }]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            );

          case 'system_welcome':
            return (
              <View style={styles.systemBubbleRow}>
                <View
                  style={[
                    styles.systemBubble,
                    {
                      backgroundColor: palette.surfaceInner,
                      borderColor: palette.borderLuminous,
                    },
                  ]}
                >
                  <Text style={[styles.systemBubbleText, { color: palette.textMuted }]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            );

          case 'audio_memo':
            return (
              <AudioMemoBubble
                durationSeconds={item.durationSeconds || 45}
                time={item.time}
              />
            );

          case 'document':
            if (!item.file) return null;
            return (
              <DocumentBubble
                file={item.file}
                time={item.time}
                onOpenNotify={handleOpenToast}
              />
            );

          case 'lecture_note':
            return <LectureNoteBubble text={item.text || ''} time={item.time} />;

          case 'reminder':
            return (
              <ReminderBubble
                time={item.time}
                triggerText={item.text || '۲۴ ساعت قبل از کلاس'}
                snoozedUntil={item.snoozedUntil}
              />
            );

          case 'user_message':
            return (
              <View style={styles.messageRowRight}>
                <View
                  style={[
                    styles.userChatBubble,
                    {
                      backgroundColor: palette.primary,
                      borderColor: palette.primaryLight,
                      transform: Platform.OS === 'web' ? ([{ translateZ: 0 }] as any) : [{ perspective: 1000 }],
                    },
                  ]}
                >
                  <Text style={styles.userChatText}>{item.text}</Text>
                  <Text style={styles.userChatTime}>{item.time}</Text>
                </View>
              </View>
            );

          default:
            return null;
        }
      },
      [palette, handleOpenToast]
    );

    const gpuAcceleratedScreenHeaderStyle = useMemo(
      () => [
        styles.header,
        {
          borderBottomColor: palette.borderLuminous,
          backgroundColor: palette.surfaceCard,
          transform: Platform.OS === 'web' ? ([{ translateZ: 0 }] as any) : [{ perspective: 1000 }],
        },
      ],
      [palette.borderLuminous, palette.surfaceCard]
    );

    const handleDelete = useCallback(() => {
      if (sessionLog && onDeleteLog) {
        onDeleteLog(sessionLog.id);
        onClose();
      }
    }, [sessionLog, onDeleteLog, onClose]);

    if (!sessionLog) return null;

    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
          {/* Top Navigation Header */}
          <View style={gpuAcceleratedScreenHeaderStyle}>
            <Pressable onPress={onClose} style={styles.backButton} hitSlop={12}>
              <Text style={[styles.backButtonIcon, { color: palette.primary }]}>‹</Text>
              <Text style={[styles.backButtonLabel, { color: palette.primary }]}>بازگشت</Text>
            </Pressable>

            <View style={styles.headerTitleGroup}>
              <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
                {sessionLog.className}
              </Text>
              <Text style={[styles.headerSubtitle, { color: palette.textMuted }]}>
                تایم‌لاین تعاملی جلسه کلاسی • ساعت {sessionLog.createdAt}
              </Text>
            </View>

            {onDeleteLog ? (
              <Pressable onPress={handleDelete} style={styles.deleteHeaderBtn} hitSlop={12}>
                <Text style={styles.deleteHeaderText}>حذف</Text>
              </Pressable>
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>

          {/* Toast for file opening intent */}
          {toastMessage && (
            <View style={[styles.toastContainer, { backgroundColor: palette.primary }]}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}

          {/* High-Performance Virtualized FlatList */}
          <FlatList
            ref={flatListRef}
            data={feedItems}
            keyExtractor={keyExtractor}
            renderItem={renderFeedItem}
            getItemLayout={getItemLayout}
            removeClippedSubviews={Platform.OS !== 'web'}
            maxToRenderPerBatch={8}
            windowSize={5}
            initialNumToRender={8}
            contentContainerStyle={styles.chatListContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Bottom Interactive Message Bar */}
          <View
            style={[
              styles.bottomInputBar,
              {
                backgroundColor: palette.surfaceCard,
                borderTopColor: palette.borderLuminous,
                transform: Platform.OS === 'web' ? ([{ translateZ: 0 }] as any) : [{ perspective: 1000 }],
              },
            ]}
          >
            <Pressable
              onPress={handleSendNote}
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim() ? palette.primary : palette.surfaceInner },
              ]}
              disabled={!inputText.trim()}
              hitSlop={8}
            >
              <Text style={{ color: inputText.trim() ? '#FFFFFF' : palette.textMuted, fontSize: 16 }}>▲</Text>
            </Pressable>

            <TextInput
              style={[
                styles.inputField,
                {
                  backgroundColor: palette.surfaceInner,
                  color: palette.textPrimary,
                  borderColor: palette.borderLuminous,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="افزودن یادداشت تکمیلی یا نکته جدید به جلسه..."
              placeholderTextColor={palette.textMuted}
              multiline={false}
              textAlign="right"
              onSubmitEditing={handleSendNote}
              returnKeyType="send"
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  }
);

ClassSessionChatViewerScreen.displayName = 'ClassSessionChatViewerScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonIcon: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },
  backButtonLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  deleteHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteHeaderText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  toastContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  chatListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  dateSeparatorRow: {
    alignItems: 'center',
    marginVertical: 6,
  },
  dateSeparatorPill: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  dateSeparatorText: {
    fontSize: 11,
    fontWeight: '700',
  },
  systemBubbleRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  systemBubble: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: '90%',
  },
  systemBubbleText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
  },
  messageRowRight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '85%',
    alignSelf: 'flex-end',
    marginVertical: 4,
  },
  userChatBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  userChatText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    textAlign: 'right',
    lineHeight: 20,
  },
  userChatTime: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
    textAlign: 'left',
    marginTop: 4,
  },
  bottomInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  inputField: {
    flex: 1,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 12,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
