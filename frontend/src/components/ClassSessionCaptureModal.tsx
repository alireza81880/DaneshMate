import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LiquidBentoCard } from './LiquidBentoCard';
import { NeumorphicButton } from './NeumorphicButton';
import { DynamicClassItemData } from './DynamicClassItem';
import { hapticFeedback } from '../utils/haptics';

export type FileCategory = 'image' | 'audio' | 'pdf' | 'powerpoint' | 'word' | 'other';

export interface AttachedFile {
  id: string;
  name: string;
  type: FileCategory;
  sizeText: string;
  uri?: string;
  url?: string;
}

export interface ClassSessionLog {
  id: string;
  classId: string;
  className: string;
  createdAt: string;
  notesText: string;
  attachedFiles?: AttachedFile[];
  photoTitle?: string;
  voiceMemoSeconds?: number;
  hasReminder: boolean;
  reminderTrigger?: string;
  reminderTimeText?: string;
  snoozedUntil?: string;
}

interface ClassSessionCaptureModalProps {
  visible: boolean;
  classes: DynamicClassItemData[];
  initialClassId?: string;
  onSaveLog: (log: ClassSessionLog) => void;
  onClose: () => void;
}

// Preset Alert Triggers required by specs
const ALERT_TRIGGERS = [
  { id: '24h_before', label: '24 hours before class', persian: '۲۴ ساعت قبل از کلاس' },
  { id: 'today', label: 'Today', persian: 'امروز (مرور سریع)' },
  { id: 'tomorrow', label: 'Tomorrow', persian: 'فردا صبح' },
  { id: '2d_before', label: '2 days before next class', persian: '۲ روز قبل از جلسه بعد' },
];

// Snooze Intervals
const SNOOZE_OPTIONS = [
  { id: '1h', label: '+1 hour', persian: 'تعویق ۱ ساعته' },
  { id: '4h', label: '+4 hours', persian: 'تعویق ۴ ساعته' },
  { id: '24h', label: '+24 hours', persian: 'تعویق ۲۴ ساعته' },
];

export const ClassSessionCaptureModal: React.FC<ClassSessionCaptureModalProps> = ({
  visible,
  classes,
  initialClassId,
  onSaveLog,
  onClose,
}) => {
  const { palette } = useTheme();

  const [selectedClassId, setSelectedClassId] = useState(
    initialClassId || (classes[0]?.id ?? '')
  );
  const [notesText, setNotesText] = useState('');

  // Universal Attached Files State (Starts clean and empty)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  // Voice Memo recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedDuration, setRecordedDuration] = useState<number | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Flexible Smart Reminders & Snooze
  const [hasReminder, setHasReminder] = useState(true);
  const [selectedTrigger, setSelectedTrigger] = useState(ALERT_TRIGGERS[0].label);
  const [activeSnooze, setActiveSnooze] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialClassId) {
      setSelectedClassId(initialClassId);
    } else if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [initialClassId, classes]);

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleToggleRecord = () => {
    hapticFeedback.medium();
    if (isRecording) {
      setIsRecording(false);
      setRecordedDuration(recordingSeconds);
      // Auto attach voice note
      const newAudioFile: AttachedFile = {
        id: `rec-${Date.now()}`,
        name: `Audio-Memo-${formatTimer(recordingSeconds)}.m4a`,
        type: 'audio',
        sizeText: `${Math.round((recordingSeconds * 32) / 10)} KB`,
      };
      setAttachedFiles((prev) => [newAudioFile, ...prev]);
    } else {
      setRecordingSeconds(0);
      setRecordedDuration(null);
      setIsRecording(true);
    }
  };

  const handleResetRecording = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
    setRecordedDuration(null);
    setIsPlayingAudio(false);
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleNativeFileUpload = (e: any) => {
    hapticFeedback.medium();
    if (Platform.OS === 'web' && e.target?.files?.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const newFiles: AttachedFile[] = files.map((file) => {
        let type: FileCategory = 'other';
        if (file.type.includes('image')) type = 'image';
        else if (file.type.includes('pdf')) type = 'pdf';
        else if (
          file.type.includes('presentation') ||
          file.name.endsWith('.pptx') ||
          file.name.endsWith('.ppt')
        )
          type = 'powerpoint';
        else if (
          file.type.includes('word') ||
          file.name.endsWith('.docx') ||
          file.name.endsWith('.doc')
        )
          type = 'word';
        else if (file.type.includes('audio')) type = 'audio';

        const sizeKb = Math.round(file.size / 1024);
        const sizeText = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

        let objectUrl: string | undefined;
        try {
          objectUrl = URL.createObjectURL(file);
        } catch {
          // ignore
        }

        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          type,
          sizeText,
          uri: objectUrl,
          url: objectUrl,
        };
      });

      setAttachedFiles((prev) => [...prev, ...newFiles]);
      // Reset input value
      e.target.value = '';
    }
  };

  const handleNativeDocumentPicker = () => {
    hapticFeedback.medium();
    // For Native platform fallback simulation if Expo DocumentPicker not configured
    const sampleAttachment: AttachedFile = {
      id: `${Date.now()}`,
      name: 'Class-Lecture-Notes.pdf',
      type: 'pdf',
      sizeText: '1.4 MB',
    };
    setAttachedFiles((prev) => [...prev, sampleAttachment]);
  };

  const handleSave = () => {
    if (!selectedClassId) {
      setError('لطفاً ابتدا کلاس مربوطه را انتخاب کنید.');
      return;
    }
    if (!notesText.trim() && attachedFiles.length === 0 && !recordedDuration) {
      setError('لطفاً حداقل یک فایل الصاق کرده یا یادداشت جلسه را وارد فرمایید.');
      return;
    }

    // Success haptic confirmation on saving session log with reminder
    hapticFeedback.success();

    const currentClass = classes.find((c) => c.id === selectedClassId);
    let reminderText = selectedTrigger;
    if (activeSnooze) {
      reminderText = `${selectedTrigger} (Snoozed ${activeSnooze})`;
    }

    const newLog: ClassSessionLog = {
      id: Date.now().toString(),
      classId: selectedClassId,
      className: currentClass?.name || 'کلاس عمومی',
      createdAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      notesText: notesText.trim(),
      attachedFiles,
      voiceMemoSeconds: recordedDuration || undefined,
      hasReminder,
      reminderTrigger: selectedTrigger,
      reminderTimeText: hasReminder ? reminderText : undefined,
      snoozedUntil: activeSnooze || undefined,
    };

    onSaveLog(newLog);
    setNotesText('');
    setAttachedFiles([]);
    handleResetRecording();
    setHasReminder(true);
    setActiveSnooze(null);
    setError(null);
    onClose();
  };

  const renderFileTypeTag = (type: FileCategory) => {
    const badges: Record<FileCategory, { tag: string; bg: string; color: string }> = {
      pdf: { tag: 'PDF', bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' },
      powerpoint: { tag: 'PPTX', bg: 'rgba(249, 115, 22, 0.15)', color: '#F97316' },
      word: { tag: 'DOCX', bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' },
      image: { tag: 'IMG', bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' },
      audio: { tag: 'AUDIO', bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' },
      other: { tag: 'FILE', bg: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8' },
    };
    const b = badges[type] || badges.other;
    return (
      <View style={[styles.typeBadge, { backgroundColor: b.bg }]}>
        <Text style={[styles.typeBadgeText, { color: b.color }]}>{b.tag}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: palette.borderLuminous }]}>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
            ثبت جلسه و رسانه چندرسانه‌ای
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.closeBtnText, { color: palette.textSecondary }]}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 1. Class Target Selector */}
          <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>کلاس هدف</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classChipsScroll}>
            {classes.map((cls) => {
              const isSelected = selectedClassId === cls.id;
              return (
                <Pressable
                  key={cls.id}
                  onPress={() => setSelectedClassId(cls.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? palette.surfaceInner : palette.surfaceCard,
                      borderColor: isSelected ? palette.primary : palette.borderLuminous,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? palette.primary : palette.textPrimary, fontWeight: isSelected ? '900' : '600' },
                    ]}
                  >
                    {cls.name} ({cls.day})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 2. Simplified & Clean File Attachments */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
              پیوست‌های جلسه
            </Text>
            {attachedFiles.length > 0 && (
              <Text style={[styles.attachedCountBadge, { color: palette.primary }]}>
                {attachedFiles.length} فایل پیوست شده
              </Text>
            )}
          </View>

          {/* File-Chip UI */}
          {attachedFiles.length > 0 ? (
            <View style={styles.filesList}>
              {attachedFiles.map((file) => (
                <View
                  key={file.id}
                  style={[
                    styles.fileChipCard,
                    { backgroundColor: palette.surfaceCard, borderColor: palette.borderLuminous },
                  ]}
                >
                  <View style={styles.fileChipLeft}>
                    {renderFileTypeTag(file.type)}
                    <View style={styles.fileMeta}>
                      <Text style={[styles.fileName, { color: palette.textPrimary }]} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={[styles.fileSize, { color: palette.textMuted }]}>{file.sizeText}</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => handleRemoveFile(file.id)} style={styles.removeFileBtn}>
                    <Text style={[styles.removeFileIcon, { color: palette.textMuted }]}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyFilesWell, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}>
              <Text style={[styles.emptyFilesText, { color: palette.textMuted }]}>
                هیچ فایلی پیوست نشده است. می‌توانید جزوات، اسلایدها و تصاویر تخته را اضافه کنید.
              </Text>
            </View>
          )}

          {/* Clean Bottom-Anchored Neumorphic/Glass Action Button */}
          <View style={styles.uploadButtonContainer}>
            {Platform.OS === 'web' ? (
              <label
                style={[
                  styles.glassUploadButton,
                  {
                    backgroundColor: palette.surfaceInner,
                    borderColor: palette.primary,
                  },
                ]}
              >
                <Text style={[styles.glassUploadButtonIcon, { color: palette.primary }]}>📎</Text>
                <Text style={[styles.glassUploadButtonText, { color: palette.primary }]}>
                  انتخاب و پیوست فایل
                </Text>
                <input
                  type="file"
                  multiple
                  onChange={handleNativeFileUpload}
                  style={{ display: 'none' }}
                  accept="image/*,audio/*,.pdf,.ppt,.pptx,.doc,.docx"
                />
              </label>
            ) : (
              <Pressable
                onPress={handleNativeDocumentPicker}
                style={[
                  styles.glassUploadButton,
                  {
                    backgroundColor: palette.surfaceInner,
                    borderColor: palette.primary,
                  },
                ]}
              >
                <Text style={[styles.glassUploadButtonIcon, { color: palette.primary }]}>📎</Text>
                <Text style={[styles.glassUploadButtonText, { color: palette.primary }]}>
                  انتخاب و پیوست فایل
                </Text>
              </Pressable>
            )}
          </View>

          {/* 3. Live Voice Recording Widget */}
          <Text style={[styles.sectionLabel, { color: palette.textSecondary, marginTop: 18 }]}>
            ضبط سریع صوت جلسه (Voice Memo Widget)
          </Text>
          <LiquidBentoCard style={styles.voiceCard} borderRadius={20}>
            <View style={styles.voiceRow}>
              <Pressable
                onPress={handleToggleRecord}
                style={[
                  styles.recordBtn,
                  {
                    backgroundColor: isRecording ? '#EF4444' : palette.surfaceInner,
                    borderColor: isRecording ? '#DC2626' : palette.primary,
                  },
                ]}
              >
                {Platform.OS === 'web' ? (
                  isRecording ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )
                ) : (
                  <Text style={[styles.recordIcon, { color: isRecording ? '#FFFFFF' : palette.primary }]}>
                    {isRecording ? '■' : '●'}
                  </Text>
                )}
              </Pressable>

              <View style={styles.voiceInfo}>
                <Text style={[styles.voiceTimer, { color: isRecording ? '#EF4444' : palette.textPrimary }]}>
                  {isRecording
                    ? `در حال ضبط زنده: ${formatTimer(recordingSeconds)}`
                    : recordedDuration
                    ? `صوت ضبط شده: ${formatTimer(recordedDuration)} (به فایل‌ها الصاق شد)`
                    : 'آماده جهت ضبط صدای استاد یا یادداشت صوتی'}
                </Text>
                <Text style={[styles.voiceSub, { color: palette.textMuted }]}>
                  {isRecording ? 'جهت پایان ضبط روی دکمه ضربه بزنید' : 'فایل ضبط شده به صورت خودکار به لیست الصاقات افزوده می‌شود'}
                </Text>
              </View>

              {recordedDuration && !isRecording && (
                <View style={styles.audioPlaybackActions}>
                  <Pressable
                    onPress={() => setIsPlayingAudio(!isPlayingAudio)}
                    style={[styles.audioActionBtn, { backgroundColor: palette.surfaceInner }]}
                  >
                    {Platform.OS === 'web' ? (
                      isPlayingAudio ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={palette.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={palette.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )
                    ) : (
                      <Text style={{ color: palette.primary, fontSize: 12 }}>{isPlayingAudio ? '❙❙' : '▶'}</Text>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={handleResetRecording}
                    style={[styles.audioActionBtn, { backgroundColor: palette.surfaceInner }]}
                  >
                    {Platform.OS === 'web' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={palette.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                    ) : (
                      <Text style={{ color: palette.textSecondary, fontSize: 12 }}>↺</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          </LiquidBentoCard>

          {/* 4. Rich Multi-line Session Notes */}
          <Text style={[styles.sectionLabel, { color: palette.textSecondary, marginTop: 18 }]}>
            یادداشت تشریحی و خلاصه درس (Rich Session Notes)
          </Text>
          <View
            style={[
              styles.inputWell,
              { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous },
            ]}
          >
            <TextInput
              style={[styles.textArea, { color: palette.textPrimary }]}
              value={notesText}
              onChangeText={setNotesText}
              placeholder="شرح تکالیف، نکات کلیدی مطرح‌شده در جلسه، زمان کوئیز و سرفصل‌های آزمون..."
              placeholderTextColor={palette.textMuted}
              multiline
              numberOfLines={4}
              textAlign="right"
            />
          </View>

          {/* 5. Flexible Smart Reminders & Alert Triggers */}
          <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
            <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
              تنظیم یادآور هوشمند (Smart Reminders)
            </Text>
            <Pressable
              onPress={() => setHasReminder(!hasReminder)}
              style={[
                styles.toggleBtn,
                { backgroundColor: hasReminder ? palette.primary : palette.surfaceInner },
              ]}
            >
              <Text style={[styles.toggleText, { color: hasReminder ? '#FFFFFF' : palette.textSecondary }]}>
                {hasReminder ? 'فعال ✓' : 'غیرفعال'}
              </Text>
            </Pressable>
          </View>

          {hasReminder && (
            <View style={styles.reminderOptions}>
              <Text style={[styles.subLabel, { color: palette.textMuted }]}>انتخاب زمان‌بندی زنگ هشدار:</Text>
              <View style={styles.triggersGrid}>
                {ALERT_TRIGGERS.map((trig) => {
                  const isChosen = selectedTrigger === trig.label;
                  return (
                    <Pressable
                      key={trig.id}
                      onPress={() => setSelectedTrigger(trig.label)}
                      style={[
                        styles.triggerCard,
                        {
                          backgroundColor: isChosen ? palette.surfaceInner : palette.surfaceCard,
                          borderColor: isChosen ? palette.primary : palette.borderLuminous,
                          borderWidth: isChosen ? 1.5 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.triggerText, { color: isChosen ? palette.primary : palette.textPrimary, fontWeight: isChosen ? '900' : '600' }]}>
                        {trig.label}
                      </Text>
                      <Text style={[styles.triggerPersian, { color: palette.textSecondary }]}>
                        {trig.persian}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Snooze Action Section */}
              <View style={[styles.snoozeSection, { borderColor: palette.borderLuminous }]}>
                <View style={styles.snoozeHeader}>
                  <Text style={[styles.snoozeTitle, { color: palette.textPrimary }]}>
                    گزینه به تعویق انداختن هشدار (Snooze Handler):
                  </Text>
                  {activeSnooze && (
                    <Pressable onPress={() => setActiveSnooze(null)}>
                      <Text style={[styles.snoozeClear, { color: palette.primary }]}>لغو تعویق ✕</Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.snoozeRow}>
                  {SNOOZE_OPTIONS.map((snz) => {
                    const isSnoozed = activeSnooze === snz.label;
                    return (
                      <Pressable
                        key={snz.id}
                        onPress={() => setActiveSnooze(isSnoozed ? null : snz.label)}
                        style={[
                          styles.snoozeChip,
                          {
                            backgroundColor: isSnoozed ? palette.primary : palette.surfaceInner,
                            borderColor: isSnoozed ? palette.primaryLight : palette.borderLuminous,
                          },
                        ]}
                      >
                        <Text style={[styles.snoozeText, { color: isSnoozed ? '#FFFFFF' : palette.textSecondary }]}>
                          {snz.label} ({snz.persian})
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsGroup}>
            <NeumorphicButton title="ذخیره لاگ و الصاقات" variant="primary" size="lg" onPress={handleSave} />
            <NeumorphicButton title="انصراف" size="md" onPress={onClose} style={{ marginTop: 8 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: '900', textAlign: 'right' },
  closeBtn: { padding: 8 },
  closeBtnText: { fontSize: 18, fontWeight: '700' },
  scrollBody: { padding: 18, paddingBottom: 50 },
  errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: 12, borderRadius: 12, marginBottom: 12 },
  errorText: { color: '#EF4444', fontSize: 12, textAlign: 'right', fontWeight: '700' },
  sectionLabel: { fontSize: 13, fontWeight: '800', textAlign: 'right', marginBottom: 8 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  attachedCountBadge: { fontSize: 11, fontWeight: '700' },
  classChipsScroll: { gap: 8, paddingVertical: 4 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14 },
  chipText: { fontSize: 12 },
  filesList: { gap: 8, marginTop: 4 },
  uploadButtonContainer: {
    marginTop: 10,
    marginBottom: 4,
  },
  glassUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    cursor: 'pointer',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  } as any,
  glassUploadButtonIcon: {
    fontSize: 15,
    fontWeight: '900',
  },
  glassUploadButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  fileChipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  fileChipLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '900' },
  fileMeta: { flex: 1 },
  fileName: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
  fileSize: { fontSize: 10, marginTop: 1, textAlign: 'right' },
  removeFileBtn: { padding: 6 },
  removeFileIcon: { fontSize: 14, fontWeight: '800' },
  emptyFilesWell: { padding: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  emptyFilesText: { fontSize: 11, textAlign: 'center', lineHeight: 18 },
  voiceCard: { padding: 14 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  recordIcon: { fontSize: 20 },
  voiceInfo: { flex: 1 },
  voiceTimer: { fontSize: 13, fontWeight: '800', textAlign: 'right' },
  voiceSub: { fontSize: 10, textAlign: 'right', marginTop: 2 },
  audioPlaybackActions: { flexDirection: 'row', gap: 6 },
  audioActionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  inputWell: { borderRadius: 16, borderWidth: 1, padding: 12 },
  textArea: { fontSize: 13, minHeight: 90, textAlignVertical: 'top' },
  toggleBtn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12 },
  toggleText: { fontSize: 11, fontWeight: '800' },
  reminderOptions: { marginTop: 8 },
  subLabel: { fontSize: 11, textAlign: 'right', marginBottom: 8 },
  triggersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  triggerCard: { width: '48%', padding: 10, borderRadius: 14, borderWidth: 1 },
  triggerText: { fontSize: 11, textAlign: 'right' },
  triggerPersian: { fontSize: 9, marginTop: 2, textAlign: 'right' },
  snoozeSection: { marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
  snoozeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  snoozeTitle: { fontSize: 11, fontWeight: '700', textAlign: 'right' },
  snoozeClear: { fontSize: 10, fontWeight: '800' },
  snoozeRow: { flexDirection: 'row', gap: 6 },
  snoozeChip: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  snoozeText: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  actionsGroup: { marginTop: 24 },
});
