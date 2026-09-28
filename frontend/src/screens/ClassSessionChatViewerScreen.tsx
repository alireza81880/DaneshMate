import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  FlatList,
  Pressable,
  TouchableOpacity,
  Platform,
  TextInput,
  ListRenderItem,
  Animated,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AttachedFile, ClassSessionLog, FileCategory } from '../components/ClassSessionCaptureModal';
import { AudioMemoBubble } from '../components/AudioMemoBubble';
import { DocumentBubble } from '../components/DocumentBubble';
import { LectureNoteBubble } from '../components/LectureNoteBubble';
import { ReminderBubble } from '../components/ReminderBubble';
import { toPersianDigits, formatJalaliDate, getFullJalaliDateTimeString, toJalali } from '../utils/jalali';
import { hapticFeedback } from '../utils/haptics';
import { requestAudioRecordingPermission } from '../utils/permissions';

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
  onUpdateLog?: (updatedLog: ClassSessionLog) => void;
}

// Utility: Middle truncation for filenames (e.g. "40e3-97...fa8.jpg")
export function truncateFileNameMiddle(name: string, maxLen = 22): string {
  if (!name || name.length <= maxLen) return name;
  const lastDot = name.lastIndexOf('.');
  const ext = lastDot !== -1 ? name.slice(lastDot) : '';
  const base = lastDot !== -1 ? name.slice(0, lastDot) : name;
  if (base.length <= 12) return name;
  const start = base.slice(0, 8);
  const end = base.slice(-4);
  return `${start}...${end}${ext}`;
}

// Utility: Localized Persian Reminder Text Formatter
export function formatPersianReminderText(trigger?: string, customText?: string): string {
  const raw = (trigger || customText || '').trim().toLowerCase();
  if (!raw) return 'یادآور: ۲۴ ساعت قبل از کلاس';

  // Check for numbers inside the string
  const numMatch = raw.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const faNum = toPersianDigits(num);
    if (raw.includes('day') || raw.includes('روز')) {
      return `یادآور: ${faNum} روز قبل از کلاس`;
    }
    if (raw.includes('minute') || raw.includes('دقیقه')) {
      return `یادآور: ${faNum} دقیقه قبل از کلاس`;
    }
    return `یادآور: ${faNum} ساعت قبل از کلاس`;
  }

  if (raw.includes('same_day') || raw.includes('همان روز')) {
    return 'یادآور: صبح همان روز کلاس';
  }
  if (raw.includes('night_before') || raw.includes('شب قبل')) {
    return 'یادآور: شب قبل از کلاس';
  }
  if (raw.includes('1_hour') || raw.includes('1 hour')) {
    return 'یادآور: ۱ ساعت قبل از کلاس';
  }
  if (raw.includes('2_hours') || raw.includes('2 hours')) {
    return 'یادآور: ۲ ساعت قبل از کلاس';
  }
  if (raw.includes('24_hours') || raw.includes('24 hours') || raw.includes('24')) {
    return 'یادآور: ۲۴ ساعت قبل از کلاس';
  }

  return `یادآور: ${toPersianDigits(trigger || customText || 'قبل از کلاس')}`;
}

// Utility: Numeric Jalali Date (e.g. "1405/7/5") without words like "مهر" or "شنبه"
export function formatJalaliNumeric(date: Date = new Date()): string {
  const [jy, jm, jd] = toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${jy}/${jm}/${jd}`;
}

// Format Jalali Date & Time for Header Subtitle (Strict Numeric: 1405/7/5)
export function formatSessionSubtitle(createdAt?: string): string {
  const numericDate = formatJalaliNumeric(new Date());
  if (!createdAt) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return `تایم‌لاین تعاملی جلسه • ${numericDate} • ساعت ${timeStr}`;
  }
  const timeOnly = createdAt.includes('-') ? createdAt.split('-').pop()?.trim() : createdAt;
  return `تایم‌لاین تعاملی جلسه • ${numericDate} • ساعت ${timeOnly}`;
}

// Neumorphic Trash Vector Icon Component
const NeumorphicTrashIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#EF4444',
  size = 15,
}) => (
  <View style={[styles.vectorTrashWrapper, { width: size, height: size + 2 }]}>
    <View style={[styles.trashLidHandle, { backgroundColor: color }]} />
    <View style={[styles.trashLidBar, { backgroundColor: color }]} />
    <View style={[styles.trashCanBody, { borderColor: color }]}>
      <View style={[styles.trashInnerLine, { backgroundColor: color }]} />
      <View style={[styles.trashInnerLine, { backgroundColor: color }]} />
    </View>
  </View>
);

export const ClassSessionChatViewerScreen: React.FC<ClassSessionChatViewerScreenProps> = React.memo(
  ({ visible, sessionLog: initialSessionLog, onClose, onDeleteLog, onUpdateLog }) => {
    const { palette } = useTheme();

    const [currentSessionLog, setCurrentSessionLog] = useState<ClassSessionLog | null>(initialSessionLog);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [followUpNotes, setFollowUpNotes] = useState<Array<{ id: string; text: string; time: string }>>([]);
    const [inputText, setInputText] = useState('');

    // Inline Attachment & Audio Recording State
    const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordDuration, setRecordDuration] = useState(0);

    // Spring Animation References
    const micScale = useRef(new Animated.Value(1)).current;
    const attachScale = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const attachSheetAnim = useRef(new Animated.Value(0)).current;

    const flatListRef = useRef<FlatList<ChatFeedItem>>(null);

    // Synchronize session log with props
    useEffect(() => {
      setCurrentSessionLog(initialSessionLog);
      setToastMessage(null);
      setFollowUpNotes([]);
      setInputText('');
      setIsRecording(false);
      setRecordDuration(0);
    }, [initialSessionLog?.id, visible]);

    // Live audio recording ticker
    useEffect(() => {
      let interval: any;
      if (isRecording) {
        interval = setInterval(() => {
          setRecordDuration((prev) => prev + 1);
        }, 1000);

        // Recording pulse animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.25,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else {
        pulseAnim.setValue(1);
      }
      return () => clearInterval(interval);
    }, [isRecording, pulseAnim]);

    const showToast = useCallback((msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
    }, []);

    // 1. Delete specific file attachment
    const handleDeleteFile = useCallback(
      (fileId: string) => {
        if (!currentSessionLog) return;
        hapticFeedback.medium();
        const updatedFiles = (currentSessionLog.attachedFiles || []).filter((f) => f.id !== fileId);
        const updatedLog: ClassSessionLog = {
          ...currentSessionLog,
          attachedFiles: updatedFiles,
        };
        setCurrentSessionLog(updatedLog);
        if (onUpdateLog) {
          onUpdateLog(updatedLog);
        }
        showToast('فایل پیوست با موفقیت حذف گردید.');
      },
      [currentSessionLog, onUpdateLog, showToast]
    );

    // 2. Delete voice memo audio
    const handleDeleteAudio = useCallback(() => {
      if (!currentSessionLog) return;
      hapticFeedback.medium();
      const updatedLog: ClassSessionLog = {
        ...currentSessionLog,
        voiceMemoSeconds: undefined,
        voiceMemoUri: undefined,
      };
      setCurrentSessionLog(updatedLog);
      if (onUpdateLog) {
        onUpdateLog(updatedLog);
      }
      showToast('صوت ضبط شده جلسه حذف گردید.');
    }, [currentSessionLog, onUpdateLog, showToast]);

    // 3. Send text note in timeline
    const handleSendNote = useCallback(() => {
      if (!inputText.trim()) return;
      hapticFeedback.selection();
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const newMsg = {
        id: `usr-${Date.now()}`,
        text: inputText.trim(),
        time: timeStr,
      };
      setFollowUpNotes((prev) => [...prev, newMsg]);
      setInputText('');

      // Also append to session notesText if present
      if (currentSessionLog) {
        const combinedNotes = currentSessionLog.notesText
          ? `${currentSessionLog.notesText}\n• ${newMsg.text}`
          : newMsg.text;
        const updatedLog: ClassSessionLog = {
          ...currentSessionLog,
          notesText: combinedNotes,
        };
        setCurrentSessionLog(updatedLog);
        if (onUpdateLog) {
          onUpdateLog(updatedLog);
        }
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, [inputText, currentSessionLog, onUpdateLog]);

    // 4. Toggle Voice Recording directly inside timeline
    const handleToggleVoiceRecord = useCallback(async () => {
      hapticFeedback.medium();

      // Tactile spring feedback
      Animated.sequence([
        Animated.spring(micScale, { toValue: 0.85, friction: 5, tension: 100, useNativeDriver: true }),
        Animated.spring(micScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
      ]).start();

      if (!isRecording) {
        const granted = await requestAudioRecordingPermission();
        if (!granted) {
          showToast('برای ضبط صدا نیاز به دسترسی میکروفون است.');
          return;
        }
        setIsRecording(true);
        setRecordDuration(0);
        showToast('ضبط صدا آغاز شد...');
      } else {
        // Stop recording and save audio memo
        setIsRecording(false);
        const finalSecs = Math.max(recordDuration, 5);
        if (currentSessionLog) {
          const updatedLog: ClassSessionLog = {
            ...currentSessionLog,
            voiceMemoSeconds: (currentSessionLog.voiceMemoSeconds || 0) + finalSecs,
          };
          setCurrentSessionLog(updatedLog);
          if (onUpdateLog) {
            onUpdateLog(updatedLog);
          }
          showToast(`صوت جدید (${toPersianDigits(finalSecs)} ثانیه) به جلسه افزوده شد.`);
        }
        setRecordDuration(0);
      }
    }, [isRecording, recordDuration, micScale, currentSessionLog, onUpdateLog, showToast]);

    // 5. Open Attachment Picker with Spring Animation
    const handleOpenAttachModal = useCallback(() => {
      hapticFeedback.light();
      Animated.sequence([
        Animated.spring(attachScale, { toValue: 0.85, friction: 5, tension: 100, useNativeDriver: true }),
        Animated.spring(attachScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
      ]).start();

      setIsAttachModalOpen(true);
      attachSheetAnim.setValue(0);
      Animated.spring(attachSheetAnim, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }).start();
    }, [attachScale, attachSheetAnim]);

    const handleCloseAttachModal = useCallback(() => {
      Animated.timing(attachSheetAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setIsAttachModalOpen(false));
    }, [attachSheetAnim]);

    // 6. Direct In-Timeline Attachment Handlers
    const handleAddDirectAttachment = useCallback(
      (type: FileCategory, sampleName: string, sizeText: string) => {
        if (!currentSessionLog) return;
        hapticFeedback.success();
        const newFile: AttachedFile = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: sampleName,
          sizeText: toPersianDigits(sizeText),
          type,
          uri: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        };
        const updatedFiles = [...(currentSessionLog.attachedFiles || []), newFile];
        const updatedLog: ClassSessionLog = {
          ...currentSessionLog,
          attachedFiles: updatedFiles,
        };
        setCurrentSessionLog(updatedLog);
        if (onUpdateLog) {
          onUpdateLog(updatedLog);
        }
        handleCloseAttachModal();
        showToast(`پیوست «${truncateFileNameMiddle(sampleName, 18)}» افزوده شد.`);
      },
      [currentSessionLog, onUpdateLog, handleCloseAttachModal, showToast]
    );

    // Build memoized feed items
    const feedItems = useMemo<ChatFeedItem[]>(() => {
      if (!currentSessionLog) return [];

      const items: ChatFeedItem[] = [
        {
          id: 'date-header',
          type: 'system_date',
          time: currentSessionLog.createdAt,
          text: currentSessionLog.createdAt.includes('/') ? currentSessionLog.createdAt.split('-')[0].trim() : toPersianDigits(currentSessionLog.createdAt),
        },
        {
          id: 'sys-welcome',
          type: 'system_welcome',
          time: currentSessionLog.createdAt,
          text: `✦ جلسه «${currentSessionLog.className}»`,
        },
      ];

      // Audio Memo Item
      if (currentSessionLog.voiceMemoSeconds) {
        items.push({
          id: `audio-${currentSessionLog.id}`,
          type: 'audio_memo',
          time: currentSessionLog.createdAt,
          durationSeconds: currentSessionLog.voiceMemoSeconds,
        });
      }

      // Attached Document Items
      if (currentSessionLog.attachedFiles && currentSessionLog.attachedFiles.length > 0) {
        currentSessionLog.attachedFiles.forEach((file) => {
          items.push({
            id: `doc-${file.id}`,
            type: 'document',
            time: currentSessionLog.createdAt,
            file,
          });
        });
      }

      // Lecture Notes Item
      if (currentSessionLog.notesText) {
        items.push({
          id: `note-${currentSessionLog.id}`,
          type: 'lecture_note',
          time: currentSessionLog.createdAt,
          text: currentSessionLog.notesText,
        });
      }

      // Smart Reminder Item
      if (currentSessionLog.hasReminder) {
        const localizedReminder = formatPersianReminderText(
          currentSessionLog.reminderTrigger,
          currentSessionLog.reminderTimeText
        );
        items.push({
          id: `reminder-${currentSessionLog.id}`,
          type: 'reminder',
          time: currentSessionLog.createdAt,
          text: localizedReminder,
          snoozedUntil: currentSessionLog.snoozedUntil,
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
    }, [currentSessionLog, followUpNotes]);

    const keyExtractor = useCallback((item: ChatFeedItem) => item.id, []);

    const renderFeedItem: ListRenderItem<ChatFeedItem> = useCallback(
      ({ item }) => {
        switch (item.type) {
          case 'system_date':
            return (
              <View style={styles.dateSeparatorRow}>
                <View style={[styles.dateSeparatorLine, { backgroundColor: palette.borderLuminous }]} />
                <View style={[styles.dateSeparatorBadge, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}>
                  <Text style={[styles.dateSeparatorText, { color: palette.textMuted }]}>
                    {item.text}
                  </Text>
                </View>
                <View style={[styles.dateSeparatorLine, { backgroundColor: palette.borderLuminous }]} />
              </View>
            );

          case 'system_welcome':
            return (
              <View style={[styles.systemCard, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}>
                <Text style={[styles.systemCardText, { color: palette.textSecondary }]}>
                  {item.text}
                </Text>
              </View>
            );

          case 'audio_memo':
            return (
              <View style={styles.mediaItemContainer}>
                <View style={{ flex: 1 }}>
                  <AudioMemoBubble
                    durationSeconds={item.durationSeconds || 45}
                    time={toPersianDigits(item.time)}
                  />
                </View>
                {/* Neumorphic Trash Delete Vector Button */}
                <TouchableOpacity
                  onPress={handleDeleteAudio}
                  activeOpacity={0.65}
                  style={[styles.mediaTrashBtn, { backgroundColor: palette.surfaceCard, borderColor: palette.borderLuminous }]}
                  accessibilityLabel="حذف صوت ضبط شده"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <NeumorphicTrashIcon color="#EF4444" size={15} />
                </TouchableOpacity>
              </View>
            );

          case 'document':
            if (!item.file) return null;
            return (
              <View style={styles.mediaItemContainer}>
                <View style={{ flex: 1 }}>
                  <DocumentBubble
                    file={item.file}
                    time={toPersianDigits(item.time)}
                    onOpenNotify={(fName) => showToast(`در حال باز کردن «${truncateFileNameMiddle(fName, 18)}»...`)}
                  />
                </View>
                {/* Neumorphic Trash Delete Vector Button */}
                <TouchableOpacity
                  onPress={() => item.file && handleDeleteFile(item.file.id)}
                  activeOpacity={0.65}
                  style={[styles.mediaTrashBtn, { backgroundColor: palette.surfaceCard, borderColor: palette.borderLuminous }]}
                  accessibilityLabel="حذف فایل پیوست"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <NeumorphicTrashIcon color="#EF4444" size={15} />
                </TouchableOpacity>
              </View>
            );

          case 'lecture_note':
            return (
              <LectureNoteBubble
                notesText={item.text || ''}
                time={toPersianDigits(item.time)}
              />
            );

          case 'reminder':
            return (
              <ReminderBubble
                triggerText={item.text || 'یادآور: ۲۴ ساعت قبل از کلاس'}
                time={toPersianDigits(item.time)}
                snoozedUntil={item.snoozedUntil}
              />
            );

          case 'user_message':
            return (
              <View style={styles.messageRowRight}>
                <View style={[styles.userBubble, { backgroundColor: palette.primary }]}>
                  <Text style={styles.userBubbleText}>{item.text}</Text>
                  <Text style={styles.userBubbleTime}>{toPersianDigits(item.time)}</Text>
                </View>
              </View>
            );

          default:
            return null;
        }
      },
      [palette, showToast, handleDeleteFile, handleDeleteAudio]
    );

    if (!currentSessionLog) return null;

    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
          {/* =========================================================================
              CLEAN HEADER STRUCTURE: Distinct Two-Row Navigation & Class Meta Banner
             ========================================================================= */}
          <View style={[styles.headerContainer, { backgroundColor: palette.surfaceCard, borderBottomColor: palette.borderLuminous }]}>
            {/* ROW 1: Top Action Navigation Bar (Right: بازگشت, Left: حذف جلسه) */}
            <View style={styles.navTopRow}>
              {/* Return Button (Right / RTL start) */}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={[styles.navBackBtn, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.navBackArrow, { color: palette.primary }]}>‹</Text>
                <Text style={[styles.navBackText, { color: palette.textPrimary }]}>بازگشت</Text>
              </TouchableOpacity>

              {/* Delete Session Button (Left / RTL end) */}
              {onDeleteLog && (
                <TouchableOpacity
                  onPress={() => {
                    hapticFeedback.heavy();
                    onDeleteLog(currentSessionLog.id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  style={styles.navDeleteBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <NeumorphicTrashIcon color="#EF4444" size={13} />
                  <Text style={styles.navDeleteText}>حذف جلسه</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ROW 2: Class Title & Jalali Timestamp Banner (Zero overlap guaranteed) */}
            <View style={[styles.metaBannerRow, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}>
              <View style={styles.metaTitleGroup}>
                <View style={styles.metaTitleRow}>
                  <Text style={styles.classBadgeIcon}>🎓</Text>
                  <Text style={[styles.classMainTitle, { color: palette.textPrimary }]} numberOfLines={1}>
                    {currentSessionLog.className}
                  </Text>
                </View>
                <Text style={[styles.classSubtitle, { color: palette.textMuted }]} numberOfLines={1}>
                  {formatSessionSubtitle(currentSessionLog.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <View style={[styles.toastBanner, { backgroundColor: palette.surfaceCard, borderColor: palette.primary }]}>
              <Text style={[styles.toastText, { color: palette.textPrimary }]}>{toastMessage}</Text>
            </View>
          )}

          {/* Active Audio Recording Floating Bar */}
          {isRecording && (
            <View style={[styles.recordingActiveBanner, { backgroundColor: '#EF4444' }]}>
              <Animated.View style={[styles.recordingPulseDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.recordingActiveText}>
                در حال ضبط صوت کلاسی: {toPersianDigits(recordDuration)} ثانیه
              </Text>
              <TouchableOpacity
                onPress={handleToggleVoiceRecord}
                style={styles.recordingStopBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.recordingStopText}>توقف و ذخیره ⏹</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Chat / Media Timeline Feed List */}
          <FlatList
            ref={flatListRef}
            data={feedItems}
            keyExtractor={keyExtractor}
            renderItem={renderFeedItem}
            contentContainerStyle={styles.feedScrollContent}
            showsVerticalScrollIndicator={false}
          />

          {/* =========================================================================
              INTERACTIVE BOTTOM BAR: In-Timeline Creation, Neumorphic +, Mic & Input
             ========================================================================= */}
          <View style={[styles.inputBarContainer, { backgroundColor: palette.surfaceCard, borderTopColor: palette.borderLuminous }]}>
            {/* Attachment Button (+) with Spring Touch Feedback */}
            <Animated.View style={{ transform: [{ scale: attachScale }] }}>
              <TouchableOpacity
                onPress={handleOpenAttachModal}
                activeOpacity={0.7}
                style={[styles.actionIconBtn, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}
                accessibilityLabel="پیوست سند یا تصویر"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.actionBtnSymbol, { color: palette.primary }]}>📎</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Mic Voice Record Button with Spring Scale Feedback */}
            <Animated.View style={{ transform: [{ scale: micScale }] }}>
              <TouchableOpacity
                onPress={handleToggleVoiceRecord}
                activeOpacity={0.7}
                style={[
                  styles.actionIconBtn,
                  isRecording
                    ? { backgroundColor: '#EF4444', borderColor: '#DC2626' }
                    : { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous },
                ]}
                accessibilityLabel="ضبط صوت زنده"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.actionBtnSymbol, { color: isRecording ? '#FFFFFF' : '#8B5CF6' }]}>
                  {isRecording ? '⏹' : '🎙'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Text Input */}
            <TextInput
              style={[
                styles.chatInput,
                {
                  backgroundColor: palette.surfaceInner,
                  borderColor: palette.borderLuminous,
                  color: palette.textPrimary,
                },
              ]}
              placeholder="یادداشت فوری به تایم‌لاین اضافه کنید..."
              placeholderTextColor={palette.textMuted}
              value={inputText}
              onChangeText={setInputText}
              textAlign="right"
              returnKeyType="send"
              onSubmitEditing={handleSendNote}
            />

            {/* Send Button */}
            <TouchableOpacity
              onPress={handleSendNote}
              activeOpacity={0.7}
              style={[styles.sendBtn, { backgroundColor: palette.primary }]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>

          {/* =========================================================================
              INLINE ATTACHMENT MODAL / ACTION SHEET (Spring Animation)
             ========================================================================= */}
          <Modal
            visible={isAttachModalOpen}
            transparent
            animationType="none"
            onRequestClose={handleCloseAttachModal}
          >
            <SafeAreaView style={styles.modalBackdrop}>
              <Animated.View
                style={[
                  styles.attachSheetContainer,
                  {
                    backgroundColor: palette.surfaceCard,
                    borderColor: palette.borderLuminous,
                    opacity: attachSheetAnim,
                    transform: [
                      {
                        translateY: attachSheetAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [150, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>
                    پیوست مستقیم به تایم‌لاین این جلسه
                  </Text>
                  <TouchableOpacity onPress={handleCloseAttachModal} style={styles.sheetCloseBtn}>
                    <Text style={[styles.sheetCloseText, { color: palette.textMuted }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.attachGrid}>
                  {/* PDF Document */}
                  <TouchableOpacity
                    onPress={() =>
                      handleAddDirectAttachment(
                        'pdf',
                        `جزوه_${currentSessionLog.className}_${toPersianDigits(Date.now().toString().slice(-4))}.pdf`,
                        '۲.۴ مگابایت'
                      )
                    }
                    style={[styles.attachOptionCard, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.attachOptionIcon}>📄</Text>
                    <Text style={[styles.attachOptionTitle, { color: palette.textPrimary }]}>سند PDF جزوه</Text>
                    <Text style={[styles.attachOptionSubtitle, { color: palette.textMuted }]}>فایل متنی یا اسلاید</Text>
                  </TouchableOpacity>

                  {/* Image / Board Photo */}
                  <TouchableOpacity
                    onPress={() =>
                      handleAddDirectAttachment(
                        'image',
                        `عکس_تخته_${currentSessionLog.className}_${toPersianDigits(Date.now().toString().slice(-4))}.jpg`,
                        '۱.۸ مگابایت'
                      )
                    }
                    style={[styles.attachOptionCard, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.attachOptionIcon}>🖼️</Text>
                    <Text style={[styles.attachOptionTitle, { color: palette.textPrimary }]}>عکس تخته کلاس</Text>
                    <Text style={[styles.attachOptionSubtitle, { color: palette.textMuted }]}>تصویر اسلاید یا تخته</Text>
                  </TouchableOpacity>

                  {/* PowerPoint */}
                  <TouchableOpacity
                    onPress={() =>
                      handleAddDirectAttachment(
                        'powerpoint',
                        `ارائه_${currentSessionLog.className}.pptx`,
                        '۴.۱ مگابایت'
                      )
                    }
                    style={[styles.attachOptionCard, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.attachOptionIcon}>📊</Text>
                    <Text style={[styles.attachOptionTitle, { color: palette.textPrimary }]}>اسلاید پاورپوینت</Text>
                    <Text style={[styles.attachOptionSubtitle, { color: palette.textMuted }]}>فایل ارائه کلاسی</Text>
                  </TouchableOpacity>

                  {/* Word / Lecture Note */}
                  <TouchableOpacity
                    onPress={() =>
                      handleAddDirectAttachment(
                        'word',
                        `نکات_کلیدی_${currentSessionLog.className}.docx`,
                        '۸۵۰ کیلوبایت'
                      )
                    }
                    style={[styles.attachOptionCard, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.attachOptionIcon}>📝</Text>
                    <Text style={[styles.attachOptionTitle, { color: palette.textPrimary }]}>فایل ورد و یادداشت</Text>
                    <Text style={[styles.attachOptionSubtitle, { color: palette.textMuted }]}>خلاصه تدریس استاد</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </SafeAreaView>
          </Modal>
        </SafeAreaView>
      </Modal>
    );
  }
);

ClassSessionChatViewerScreen.displayName = 'ClassSessionChatViewerScreen';

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Distinct Clean Header Container
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  // Row 1: Top Navigation Bar
  navTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '2px 2px 5px rgba(166, 175, 195, 0.3), -2px -2px 5px rgba(255, 255, 255, 0.7)' } as any,
    }),
  },
  navBackArrow: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: -2,
  },
  navBackText: {
    fontSize: 12,
    fontWeight: '800',
  },
  navDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  navDeleteText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  // Row 2: Class Title & Jalali Timestamp Banner
  metaBannerRow: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  metaTitleGroup: {
    alignItems: 'center',
    width: '100%',
  },
  metaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classBadgeIcon: {
    fontSize: 15,
  },
  classMainTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  classSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  toastBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  toastText: {
    fontSize: 11,
    fontWeight: '800',
  },
  recordingActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  recordingPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  recordingActiveText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  recordingStopBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  recordingStopText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  feedScrollContent: {
    padding: 14,
    paddingBottom: 24,
  },
  dateSeparatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
  },
  dateSeparatorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 8,
  },
  dateSeparatorText: {
    fontSize: 10,
    fontWeight: '700',
  },
  systemCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  systemCardText: {
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'right',
  },
  mediaItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  mediaTrashBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6ebf2',
    ...Platform.select({
      web: { boxShadow: '2px 2px 5px rgba(166, 175, 195, 0.4), -2px -2px 5px rgba(255, 255, 255, 0.8)' } as any,
    }),
  },
  vectorTrashWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashLidHandle: {
    width: 6,
    height: 2,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  trashLidBar: {
    width: 14,
    height: 2,
    borderRadius: 1,
    marginVertical: 1,
  },
  trashCanBody: {
    width: 12,
    height: 11,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 1,
  },
  trashInnerLine: {
    width: 1.2,
    height: 6,
    borderRadius: 0.6,
  },
  messageRowRight: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  userBubble: {
    padding: 10,
    borderRadius: 14,
    maxWidth: '80%',
  },
  userBubbleText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'right',
  },
  userBubbleTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    marginTop: 3,
    textAlign: 'left',
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '2px 2px 4px rgba(166, 175, 195, 0.3), -2px -2px 4px rgba(255, 255, 255, 0.7)' } as any,
    }),
  },
  actionBtnSymbol: {
    fontSize: 17,
  },
  chatInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 12,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  attachSheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 30,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetCloseText: {
    fontSize: 16,
    fontWeight: '700',
  },
  attachGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  attachOptionCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachOptionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  attachOptionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  attachOptionSubtitle: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
