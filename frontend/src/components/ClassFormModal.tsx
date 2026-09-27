import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { NeumorphicTheme } from '../theme/colors';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicButton } from './NeumorphicButton';
import { NeumorphicInput } from './NeumorphicInput';
import { NeumorphicTimePicker } from './NeumorphicTimePicker';
import { NeumorphicDatePicker } from './NeumorphicDatePicker';
import { SpringCalendarModal } from './SpringCalendarModal';
import { hapticFeedback } from '../utils/haptics';

export type WeekDay = 'شنبه' | 'یکشنبه' | 'دوشنبه' | 'سه‌شنبه' | 'چهارشنبه' | 'پنج‌شنبه';
export type RecurrenceType = 'every_week' | 'even_weeks' | 'odd_weeks' | 'biweekly' | 'bi_weekly';

export interface ClassFormData {
  id?: string;
  name: string;
  day: WeekDay;
  time: string;
  recurrence: RecurrenceType;
  anchor_date?: string; // Anchor date string (e.g. 1405/07/04) for 14-day biweekly cycles
  anchor_timestamp?: number; // Exact UNIX epoch timestamp of first session
  firstSessionDate?: string;
  professor?: string;
  location?: string;
  midtermExamDate?: string;
  finalExamDate?: string;
}

interface ClassFormModalProps {
  initialData?: ClassFormData | null;
  onSave: (data: ClassFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const WEEK_DAYS: WeekDay[] = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
];

const RECURRENCE_OPTIONS: { id: RecurrenceType; label: string; icon: string; isBiweekly: boolean }[] = [
  { id: 'every_week', label: 'هر هفته', icon: '🔁', isBiweekly: false },
  { id: 'bi_weekly', label: 'یک هفته در میان', icon: '📅', isBiweekly: true },
  { id: 'even_weeks', label: 'هفته‌های زوج', icon: '✌️', isBiweekly: true },
  { id: 'odd_weeks', label: 'هفته‌های فرد', icon: '☝️', isBiweekly: true },
];

export const ClassFormModal: React.FC<ClassFormModalProps> = ({
  initialData,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [day, setDay] = useState<WeekDay>(initialData?.day || 'شنبه');
  const [time, setTime] = useState(initialData?.time || '08:00 - 10:00');
  const [recurrence, setRecurrence] = useState<RecurrenceType>(
    initialData?.recurrence || 'every_week'
  );
  const [anchorDate, setAnchorDate] = useState<string>(
    initialData?.anchor_date || initialData?.firstSessionDate || ''
  );
  const [anchorTimestamp, setAnchorTimestamp] = useState<number | undefined>(
    initialData?.anchor_timestamp
  );
  const [anchorLabel, setAnchorLabel] = useState<string>(() => {
    if (initialData?.anchor_date) {
      return `شروع دوره: ${initialData.anchor_date}`;
    }
    return '';
  });
  const [professor, setProfessor] = useState(initialData?.professor || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [midtermExamDate, setMidtermExamDate] = useState(initialData?.midtermExamDate || '');
  const [finalExamDate, setFinalExamDate] = useState(initialData?.finalExamDate || '');
  const [errors, setErrors] = useState<{ name?: string; time?: string }>({});

  // Spring-Animated Modal State for Anchor Date (تاریخ مبدأ)
  const [isSpringModalOpen, setIsSpringModalOpen] = useState(false);
  const [scheduledSessionTimestamps, setScheduledSessionTimestamps] = useState<number[]>(
    initialData?.scheduled_session_timestamps || []
  );

  const handleSelectRecurrence = (opt: typeof RECURRENCE_OPTIONS[0]) => {
    hapticFeedback.selection();
    setRecurrence(opt.id);
    if (opt.isBiweekly) {
      // Trigger Spring Pop-up Modal to select Anchor Date
      setIsSpringModalOpen(true);
    } else {
      setScheduledSessionTimestamps([]);
    }
  };

  const handleSelectAnchorDate = (
    dateStr: string,
    timestamp: number,
    formattedLabel: string,
    sessions: number[]
  ) => {
    hapticFeedback.success();
    setAnchorDate(dateStr);
    setAnchorTimestamp(timestamp);
    setAnchorLabel(formattedLabel);
    setScheduledSessionTimestamps(sessions);
  };

  const handleSave = () => {
    const newErrors: { name?: string; time?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'ورود نام کلاس الزامی است.';
    }
    if (!time.trim()) {
      newErrors.time = 'انتخاب زمان کلاس الزامی است.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    hapticFeedback.success();

    const recType =
      recurrence === 'even_weeks'
        ? 'even'
        : recurrence === 'odd_weeks'
        ? 'odd'
        : recurrence === 'bi_weekly' || recurrence === 'biweekly'
        ? 'bi_weekly'
        : 'weekly';

    onSave({
      id: initialData?.id || Date.now().toString(),
      name: name.trim(),
      day,
      time: time.trim(),
      recurrence,
      recurrence_type: recType,
      anchor_date: anchorDate.trim() || undefined,
      anchor_timestamp: anchorTimestamp,
      scheduled_session_timestamps:
        scheduledSessionTimestamps.length > 0 ? scheduledSessionTimestamps : undefined,
      firstSessionDate: anchorDate.trim() || undefined,
      professor: professor.trim() || undefined,
      location: location.trim() || undefined,
      midtermExamDate: midtermExamDate.trim() || undefined,
      finalExamDate: finalExamDate.trim() || undefined,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <NeumorphicCard style={styles.card} borderRadius={26}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {isEditing ? 'ویرایش مشخصات کلاس' : 'افزودن کلاس جدید'}
              </Text>
              <Text style={styles.subtitle}>
                اطلاعات زمان‌بندی، تاریخ مبدأ جلسات و امتحانات را مشخص نمایید.
              </Text>
            </View>

            <View style={styles.form}>
              {/* 1. Class Name */}
              <NeumorphicInput
                label="نام کلاس / درس"
                placeholder="عنوان درس را وارد نمایید"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={errors.name}
              />

              {/* 2. Day Selection */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>
                  روز برگزاری کلاس <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.daysGrid}>
                  {WEEK_DAYS.map((d) => {
                    const isSelected = day === d;
                    return (
                      <Pressable
                        key={d}
                        onPress={() => setDay(d)}
                        style={[
                          styles.dayButton,
                          isSelected ? styles.dayButtonSelected : styles.dayButtonUnselected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            isSelected && styles.dayButtonTextSelected,
                          ]}
                        >
                          {d}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 3. Interactive TimePicker (ZERO manual text inputs) */}
              <NeumorphicTimePicker
                value={time}
                onChange={(t) => {
                  setTime(t);
                  if (errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
                }}
                error={errors.time}
              />

              {/* 4. Recurrence Selector with Bi-Weekly Anchor Logic */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>
                  دوره تکرار تشکیل کلاس (چرخشی / هفتگی)
                </Text>
                <View style={styles.recurrenceGrid}>
                  {RECURRENCE_OPTIONS.map((opt) => {
                    const isSelected = recurrence === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => handleSelectRecurrence(opt)}
                        activeOpacity={0.7}
                        style={[
                          styles.recurrenceBtn,
                          isSelected ? styles.recurrenceBtnSelected : styles.recurrenceBtnUnselected,
                        ]}
                      >
                        <Text style={styles.recurrenceIcon}>{opt.icon}</Text>
                        <Text
                          style={[
                            styles.recurrenceLabel,
                            isSelected && styles.recurrenceLabelSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Elevated Anchor Date Chip inside Form with Quick Edit Trigger */}
                {(recurrence === 'bi_weekly' || recurrence === 'biweekly' || recurrence === 'even_weeks' || recurrence === 'odd_weeks') && (
                  <View style={styles.anchorElevatedCard}>
                    <View style={styles.anchorElevatedHeader}>
                      <View style={styles.anchorIconBadge}>
                        <Text style={styles.anchorIconBadgeText}>🎯</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'flex-start' }}>
                        <Text style={styles.anchorBadgeTitle}>
                          تاریخ مبدأ (Anchor Date) چرخه ۱۴ روزه:
                        </Text>
                        <Text style={styles.anchorBadgeValue}>
                          {anchorLabel || (anchorDate ? `شروع دوره: ${anchorDate}` : 'هنوز انتخاب نشده (برای انتخاب کلیک کنید)')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          hapticFeedback.medium();
                          setIsSpringModalOpen(true);
                        }}
                        activeOpacity={0.7}
                        style={styles.anchorEditChip}
                      >
                        <Text style={styles.anchorEditChipText}>ویرایش</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.anchorCycleHint}>
                      • جلسات و اعلان‌ها هر ۱۴ روز یک‌بار بر مبنای این تاریخ مبدأ محاسبه و در هفته‌های غیرفعال متوقف می‌گردند.
                    </Text>
                  </View>
                )}
              </View>

              {/* 5. First Session Date (Jalali Date Picker) */}
              <View style={styles.sectionContainer}>
                <NeumorphicDatePicker
                  label="تاریخ اولین جلسه (مبدأ تقویم)"
                  optional={true}
                  value={anchorDate}
                  onChange={(d) => setAnchorDate(d)}
                  placeholder="انتخاب تاریخ شمسی شروع کلاس‌ها"
                />
              </View>

              {/* 6. Exam Schedules (Jalali Date Pickers) */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>
                  تاریخ امتحانات درس (یادآور هوشمند آزمون‌ها)
                </Text>
                <View style={styles.examsRow}>
                  <NeumorphicDatePicker
                    label="امتحان میان‌ترم"
                    optional={true}
                    value={midtermExamDate}
                    onChange={setMidtermExamDate}
                    placeholder="ثبت تاریخ میان‌ترم"
                  />
                  <NeumorphicDatePicker
                    label="امتحان پایان‌ترم"
                    optional={true}
                    value={finalExamDate}
                    onChange={setFinalExamDate}
                    placeholder="ثبت تاریخ پایان‌ترم"
                  />
                </View>
              </View>

              {/* 7. Optional Professor's Name */}
              <NeumorphicInput
                label="نام استاد"
                optional={true}
                placeholder="نام استاد را وارد نمایید (اختیاری)"
                value={professor}
                onChangeText={setProfessor}
              />

              {/* 8. Optional Class Location */}
              <NeumorphicInput
                label="محل برگزاری"
                optional={true}
                placeholder="شماره کلاس یا نام دانشکده (اختیاری)"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <NeumorphicButton
                title="انصراف"
                size="md"
                onPress={onCancel}
                style={styles.actionBtn}
              />
              <NeumorphicButton
                title={isEditing ? 'ذخیره تغییرات' : 'ثبت در برنامه'}
                variant="primary"
                size="md"
                onPress={handleSave}
                style={styles.actionBtn}
              />
            </View>
          </NeumorphicCard>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Reusable Spring-Animated Jalali Calendar Modal */}
      <SpringCalendarModal
        visible={isSpringModalOpen}
        onClose={() => setIsSpringModalOpen(false)}
        onSelectDate={handleSelectAnchorDate}
        initialDate={anchorDate}
        title="تاریخ اولین جلسه این کلاس را انتخاب کنید"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: NeumorphicTheme.colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 40 },
  card: { padding: 22 },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4, lineHeight: 18 },
  form: { gap: 4 },
  sectionContainer: { marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8, textAlign: 'right' },
  requiredStar: { color: '#e11d48' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayButton: { flex: 1, minWidth: '30%', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayButtonUnselected: {
    backgroundColor: '#e6ebf2',
    ...Platform.select({
      web: { boxShadow: '3px 3px 6px #bec3cc, -3px -3px 6px #ffffff' } as any,
    }),
  },
  dayButtonSelected: { backgroundColor: '#2563eb' },
  dayButtonText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  dayButtonTextSelected: { color: '#ffffff', fontWeight: '800' },
  recurrenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recurrenceBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurrenceBtnUnselected: {
    backgroundColor: '#e6ebf2',
    ...Platform.select({
      web: { boxShadow: '3px 3px 6px #bec3cc, -3px -3px 6px #ffffff' } as any,
    }),
  },
  recurrenceBtnSelected: { backgroundColor: '#2563eb' },
  recurrenceIcon: { fontSize: 14, marginBottom: 2 },
  recurrenceLabel: { fontSize: 11, fontWeight: '700', color: '#475569' },
  recurrenceLabelSelected: { color: '#ffffff', fontWeight: '800' },
  anchorElevatedCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.25)',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(37, 99, 235, 0.1)',
      } as any,
      default: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
      },
    }),
  },
  anchorElevatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  anchorIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchorIconBadgeText: {
    fontSize: 16,
  },
  anchorBadgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    textAlign: 'right',
  },
  anchorBadgeValue: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
    textAlign: 'right',
  },
  anchorEditChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
      } as any,
      default: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  anchorEditChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  anchorCycleHint: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 15,
    textAlign: 'right',
  },
  examsRow: { gap: 8 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: { flex: 1 },
});
