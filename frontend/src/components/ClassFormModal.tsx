import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { FONT_FAMILIES } from '../theme/typography';
import { rtlStyles } from '../utils/rtl';
import { Icon, IconName } from './Icon';
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
  anchor_date?: string;
  anchor_timestamp?: number;
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

const RECURRENCE_OPTIONS: { id: RecurrenceType; label: string; icon: IconName; isBiweekly: boolean }[] = [
  { id: 'every_week', label: 'هر هفته', icon: 'repeat', isBiweekly: false },
  { id: 'bi_weekly', label: 'یک هفته در میان', icon: 'calendar', isBiweekly: true },
  { id: 'even_weeks', label: 'هفته‌های زوج', icon: 'calendar-check', isBiweekly: true },
  { id: 'odd_weeks', label: 'هفته‌های فرد', icon: 'calendar', isBiweekly: true },
];

export const ClassFormModal: React.FC<ClassFormModalProps> = ({
  initialData,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  const { palette } = useTheme();

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

  const [isSpringModalOpen, setIsSpringModalOpen] = useState(false);

  const handleSelectRecurrence = (opt: typeof RECURRENCE_OPTIONS[0]) => {
    hapticFeedback.light();
    setRecurrence(opt.id);

    if (opt.isBiweekly && !anchorDate) {
      setIsSpringModalOpen(true);
    }
  };

  const handleSelectAnchorDate = (dateStr: string, timestamp: number) => {
    hapticFeedback.success();
    setAnchorDate(dateStr);
    setAnchorTimestamp(timestamp);
    setAnchorLabel(`شروع دوره: ${dateStr}`);
    setIsSpringModalOpen(false);
  };

  const handleSave = () => {
    const errs: { name?: string; time?: string } = {};
    if (!name.trim()) errs.name = 'لطفاً نام کلاس را وارد کنید';
    if (!time.trim()) errs.time = 'لطفاً ساعت برگزاری را مشخص کنید';

    if (Object.keys(errs).length > 0) {
      hapticFeedback.heavy();
      setErrors(errs);
      return;
    }

    onSave({
      id: initialData?.id,
      name: name.trim(),
      day,
      time: time.trim(),
      recurrence,
      anchor_date: anchorDate || undefined,
      anchor_timestamp: anchorTimestamp || undefined,
      professor: professor.trim() || undefined,
      location: location.trim() || undefined,
      midtermExamDate: midtermExamDate.trim() || undefined,
      finalExamDate: finalExamDate.trim() || undefined,
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <NeumorphicCard style={styles.card} borderRadius={24}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: palette.textPrimary }]}>
                {isEditing ? 'ویرایش مشخصات کلاس' : 'افزودن کلاس جدید'}
              </Text>
              <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
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
                <Text style={[styles.sectionLabel, { color: palette.textPrimary }]}>
                  روز برگزاری کلاس <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={[styles.daysGrid, rtlStyles.row]}>
                  {WEEK_DAYS.map((d) => {
                    const isSelected = day === d;
                    return (
                      <Pressable
                        key={d}
                        onPress={() => setDay(d)}
                        style={[
                          styles.dayButton,
                          {
                            backgroundColor: isSelected ? palette.primary : palette.surfaceInner,
                            borderColor: isSelected ? palette.primary : palette.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            {
                              color: isSelected ? '#ffffff' : palette.textPrimary,
                              fontFamily: isSelected ? FONT_FAMILIES.persian.bold : FONT_FAMILIES.persian.medium,
                            },
                          ]}
                        >
                          {d}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 3. Interactive TimePicker */}
              <NeumorphicTimePicker
                value={time}
                onChange={(t) => {
                  setTime(t);
                  if (errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
                }}
                error={errors.time}
              />

              {/* 4. Recurrence Selector */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionLabel, { color: palette.textPrimary }]}>
                  دوره تکرار تشکیل کلاس (چرخشی / هفتگی)
                </Text>
                <View style={[styles.recurrenceGrid, rtlStyles.row]}>
                  {RECURRENCE_OPTIONS.map((opt) => {
                    const isSelected = recurrence === opt.id;
                    const iconColor = isSelected ? '#ffffff' : palette.textSecondary;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => handleSelectRecurrence(opt)}
                        activeOpacity={0.7}
                        style={[
                          styles.recurrenceBtn,
                          {
                            backgroundColor: isSelected ? palette.primary : palette.surfaceInner,
                            borderColor: isSelected ? palette.primary : palette.border,
                          },
                        ]}
                      >
                        <Icon name={opt.icon} size={16} color={iconColor} style={styles.recurrenceIcon} />
                        <Text
                          style={[
                            styles.recurrenceLabel,
                            {
                              color: isSelected ? '#ffffff' : palette.textPrimary,
                              fontFamily: isSelected ? FONT_FAMILIES.persian.bold : FONT_FAMILIES.persian.medium,
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Anchor Date Quick Edit Trigger */}
                {(recurrence === 'bi_weekly' || recurrence === 'biweekly' || recurrence === 'even_weeks' || recurrence === 'odd_weeks') && (
                  <View style={[styles.anchorElevatedCard, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}>
                    <View style={[styles.anchorElevatedHeader, rtlStyles.row]}>
                      <View style={[styles.anchorIconBadge, { backgroundColor: 'rgba(37, 99, 235, 0.15)' }]}>
                        <Icon name="calendar-check" size={18} color={palette.primary} />
                      </View>
                      <View style={{ flex: 1, paddingHorizontal: 6 }}>
                        <Text style={[styles.anchorBadgeTitle, { color: palette.primary }]}>
                          تاریخ مبدأ چرخه ۱۴ روزه:
                        </Text>
                        <Text style={[styles.anchorBadgeValue, { color: palette.textPrimary }]}>
                          {anchorLabel || (anchorDate ? `شروع دوره: ${anchorDate}` : 'انتخاب نشده (برای انتخاب ضربه بزنید)')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          hapticFeedback.medium();
                          setIsSpringModalOpen(true);
                        }}
                        activeOpacity={0.7}
                        style={[styles.anchorEditChip, { backgroundColor: palette.primary }]}
                      >
                        <Text style={styles.anchorEditChipText}>انتخاب</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* 5. Exam Schedules */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionLabel, { color: palette.textPrimary }]}>
                  تاریخ امتحانات درس (یادآور هوشمند)
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

              {/* 6. Optional Professor's Name */}
              <NeumorphicInput
                label="نام استاد"
                optional={true}
                placeholder="نام استاد (اختیاری)"
                value={professor}
                onChangeText={setProfessor}
              />

              {/* 7. Optional Class Location */}
              <NeumorphicInput
                label="محل برگزاری"
                optional={true}
                placeholder="شماره کلاس یا نام دانشکده (اختیاری)"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            {/* Action Buttons */}
            <View style={[styles.actionRow, rtlStyles.row]}>
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
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 36 },
  card: { padding: 18 },
  header: { marginBottom: 18, alignItems: 'center' },
  title: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 4,
  },
  form: { gap: 4 },
  sectionContainer: { marginBottom: 16 },
  sectionLabel: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  requiredStar: { color: '#e11d48' },
  daysGrid: { flexWrap: 'wrap', gap: 6 },
  dayButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 11.5,
    lineHeight: 16,
    writingDirection: 'rtl',
  },
  recurrenceGrid: { flexWrap: 'wrap', gap: 6 },
  recurrenceBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  recurrenceIcon: { marginBottom: 4 },
  recurrenceLabel: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  anchorElevatedCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  anchorElevatedHeader: {
    alignItems: 'center',
    gap: 8,
  },
  anchorIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchorBadgeTitle: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 10.5,
    lineHeight: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  anchorBadgeValue: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  anchorEditChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  anchorEditChipText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11,
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  examsRow: { gap: 8 },
  actionRow: { gap: 10, marginTop: 16 },
  actionBtn: { flex: 1 },
});
