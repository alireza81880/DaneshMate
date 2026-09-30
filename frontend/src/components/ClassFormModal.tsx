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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { FONT_FAMILIES } from '../theme/typography';
import { getRtlRow } from '../utils/rtl';
import { Icon, IconName } from './Icon';
import { SpringCalendarModal } from './SpringCalendarModal';
import { hapticFeedback } from '../utils/haptics';
import { toPersianDigits } from '../utils/jalali';

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

const COMMON_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
];

const RECURRENCE_OPTIONS: { id: RecurrenceType; label: string; icon: string; isBiweekly: boolean }[] = [
  { id: 'every_week', label: 'هر هفته', icon: '🔁', isBiweekly: false },
  { id: 'even_weeks', label: 'هفته‌های زوج', icon: '✌️', isBiweekly: true },
  { id: 'odd_weeks', label: 'هفته‌های فرد', icon: '☝️', isBiweekly: true },
  { id: 'bi_weekly', label: 'یک هفته در میان', icon: '📅', isBiweekly: true },
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
  const [time, setTime] = useState(initialData?.time || COMMON_SLOTS[0]);
  const [customTime, setCustomTime] = useState('');
  const [isEnteringCustomTime, setIsEnteringCustomTime] = useState(false);
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
      return `مبدأ دوره: ${initialData.anchor_date}`;
    }
    return '';
  });
  const [professor, setProfessor] = useState(initialData?.professor || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [midtermExamDate, setMidtermExamDate] = useState(initialData?.midtermExamDate || '');
  const [finalExamDate, setFinalExamDate] = useState(initialData?.finalExamDate || '');
  const [errors, setErrors] = useState<{ name?: string; time?: string }>({});

  const [isSpringModalOpen, setIsSpringModalOpen] = useState(false);
  const [springTargetField, setSpringTargetField] = useState<'anchor' | 'midterm' | 'final'>('anchor');

  const handleSelectRecurrence = (opt: typeof RECURRENCE_OPTIONS[0]) => {
    hapticFeedback.light();
    setRecurrence(opt.id);

    if (opt.isBiweekly && !anchorDate) {
      setSpringTargetField('anchor');
      setIsSpringModalOpen(true);
    }
  };

  const handleSelectCalendarDate = (dateStr: string, timestamp: number, formattedLabel: string) => {
    hapticFeedback.success();
    if (springTargetField === 'anchor') {
      setAnchorDate(dateStr);
      setAnchorTimestamp(timestamp);
      setAnchorLabel(formattedLabel || `مبدأ دوره: ${dateStr}`);
    } else if (springTargetField === 'midterm') {
      setMidtermExamDate(dateStr);
    } else if (springTargetField === 'final') {
      setFinalExamDate(dateStr);
    }
    setIsSpringModalOpen(false);
  };

  const handleSave = () => {
    const errs: { name?: string; time?: string } = {};
    if (!name.trim()) errs.name = 'ورود نام کلاس الزامی است.';
    const finalTime = customTime.trim() || time.trim();
    if (!finalTime) errs.time = 'انتخاب زمان کلاس الزامی است.';

    if (Object.keys(errs).length > 0) {
      hapticFeedback.heavy();
      setErrors(errs);
      return;
    }

    hapticFeedback.success();
    onSave({
      id: initialData?.id,
      name: name.trim(),
      day,
      time: finalTime,
      recurrence,
      anchor_date: anchorDate || undefined,
      anchor_timestamp: anchorTimestamp || undefined,
      professor: professor.trim() || undefined,
      location: location.trim() || undefined,
      midtermExamDate: midtermExamDate.trim() || undefined,
      finalExamDate: finalExamDate.trim() || undefined,
    });
  };

  const cardBg = palette.isDark ? '#141A28' : palette.surfaceCard;

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
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor: palette.borderLuminous,
                borderTopColor: palette.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.9)',
              },
            ]}
          >
            {/* Header matching Web */}
            <View style={[styles.header, { borderBottomColor: palette.divider || 'rgba(255, 255, 255, 0.08)' }]}>
              <View style={styles.headerTitleGroup}>
                <Text style={[styles.title, { color: palette.textPrimary }]}>
                  {isEditing ? 'ویرایش کلاس' : 'افزودن کلاس جدید'}
                </Text>
                <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                  برنامه‌ریزی جلسات هفتگی و چرخشی با تطابق تقویم تحصیلی
                </Text>
              </View>
              <TouchableOpacity
                onPress={onCancel}
                style={[styles.closeBtn, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={16} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {/* 1. Class Name */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionLabel, { color: palette.textPrimary }]}>
                  نام درس <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: palette.surfaceInner,
                      borderColor: errors.name ? '#EF4444' : palette.borderLuminous,
                    },
                  ]}
                >
                  <TextInput
                    placeholder="مثال: طراحی الگوریتم، ریاضی عمومی ۲"
                    placeholderTextColor={palette.textMuted}
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    style={[
                      styles.textInput,
                      { color: palette.textPrimary, fontFamily: FONT_FAMILIES.persian.regular },
                    ]}
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              {/* 2. Day Selection */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionLabel, { color: palette.textPrimary }]}>
                  روز برگزاری <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={[styles.daysGrid, { flexDirection: getRtlRow() }]}>
                  {WEEK_DAYS.map((d) => {
                    const isSelected = day === d;
                    return (
                      <Pressable
                        key={d}
                        onPress={() => {
                          hapticFeedback.selection();
                          setDay(d);
                        }}
                        style={[
                          styles.dayButton,
                          {
                            backgroundColor: isSelected ? palette.primary : palette.surfaceInner,
                            borderColor: isSelected ? palette.primaryLight : palette.borderLuminous,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            {
                              color: isSelected ? '#FFFFFF' : palette.textSecondary,
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

              {/* 3. Class Time Selection matching Web */}
              <View style={styles.sectionContainer}>
                <View style={[styles.labelRow, { flexDirection: getRtlRow() }]}>
                  <Text style={[styles.sectionLabel, { color: palette.textPrimary }]}>
                    بازه زمانی برگزاری (ساعت) <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <Text style={[styles.subHint, { color: palette.textMuted }]}>
                    ۵ بازه استاندارد یا ساعت دلخواه
                  </Text>
                </View>

                {/* Common Slots Grid */}
                <View style={[styles.slotsGrid, { flexDirection: getRtlRow() }]}>
                  {COMMON_SLOTS.map((slot) => {
                    const isSelected = time === slot && !customTime;
                    return (
                      <Pressable
                        key={slot}
                        onPress={() => {
                          hapticFeedback.selection();
                          setTime(slot);
                          setCustomTime('');
                          setIsEnteringCustomTime(false);
                        }}
                        style={[
                          styles.slotButton,
                          {
                            backgroundColor: isSelected ? palette.primary : palette.surfaceInner,
                            borderColor: isSelected ? palette.primaryLight : palette.borderLuminous,
                          },
                          isSelected && styles.selectedSlotGlow,
                        ]}
                      >
                        <Text
                          style={[
                            styles.slotPersianText,
                            {
                              color: isSelected ? '#FFFFFF' : palette.textPrimary,
                              fontFamily: FONT_FAMILIES.persian.bold,
                            },
                          ]}
                        >
                          {toPersianDigits(slot)}
                        </Text>
                        <Text
                          style={[
                            styles.slotLatinText,
                            { color: isSelected ? 'rgba(255,255,255,0.85)' : palette.textMuted },
                          ]}
                        >
                          {slot}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Custom Time Option */}
                {isEnteringCustomTime || customTime ? (
                  <View
                    style={[
                      styles.customTimeWell,
                      {
                        backgroundColor: palette.surfaceInner,
                        borderColor: palette.primary,
                      },
                    ]}
                  >
                    <View style={styles.customTimeInfo}>
                      <Icon name="clock" size={16} color={palette.primary} />
                      <TextInput
                        placeholder="مثال: 07:30 - 09:15"
                        placeholderTextColor={palette.textMuted}
                        value={customTime}
                        onChangeText={setCustomTime}
                        style={[
                          styles.customTimeInput,
                          { color: palette.primaryLight, fontFamily: FONT_FAMILIES.english.bold },
                        ]}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setCustomTime('');
                        setIsEnteringCustomTime(false);
                        setTime(COMMON_SLOTS[0]);
                      }}
                      style={styles.clearCustomTimeBtn}
                    >
                      <Icon name="close" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setIsEnteringCustomTime(true)}
                    style={[
                      styles.customTimeToggleBtn,
                      { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous },
                    ]}
                  >
                    <Icon name="clock" size={15} color={palette.primaryLight} />
                    <Text style={[styles.customTimeToggleText, { color: palette.textPrimary }]}>
                      تنظیم ساعت دلخواه...
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 4. Recurrence Selector matching Web */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionLabel, { color: palette.textPrimary }]}>
                  چرخه برگزاری کلاس <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={[styles.recurrenceGrid, { flexDirection: getRtlRow() }]}>
                  {RECURRENCE_OPTIONS.map((opt) => {
                    const isSelected = recurrence === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => handleSelectRecurrence(opt)}
                        style={[
                          styles.recurrenceBtn,
                          {
                            backgroundColor: isSelected ? palette.primary : palette.surfaceInner,
                            borderColor: isSelected ? palette.primaryLight : palette.borderLuminous,
                          },
                        ]}
                      >
                        <Text style={styles.recurrenceIconText}>{opt.icon}</Text>
                        <Text
                          style={[
                            styles.recurrenceLabel,
                            {
                              color: isSelected ? '#FFFFFF' : palette.textSecondary,
                              fontFamily: isSelected ? FONT_FAMILIES.persian.bold : FONT_FAMILIES.persian.medium,
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Soft-Inset Anchor Date Chip with 8-Session Projection */}
                {recurrence !== 'every_week' && anchorDate ? (
                  <View
                    style={[
                      styles.anchorChipCard,
                      { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous },
                    ]}
                  >
                    <View style={[styles.anchorTopRow, { flexDirection: getRtlRow() }]}>
                      <View style={styles.anchorLeftGroup}>
                        <Icon name="calendar-check" size={16} color={palette.primaryLight} />
                        <Text style={[styles.anchorLabelText, { color: palette.textPrimary }]}>
                          {anchorLabel || `مبدأ دوره: ${anchorDate}`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setSpringTargetField('anchor');
                          setIsSpringModalOpen(true);
                        }}
                        style={[styles.changeAnchorBtn, { backgroundColor: palette.primary }]}
                      >
                        <Text style={styles.changeAnchorBtnText}>تغییر مبدأ</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.anchorProjectionText}>
                      ✓ ۸ جلسه تحصیلی به فواصل ۱۴ روزه در تقویم ترم ثبت گردید.
                    </Text>
                  </View>
                ) : recurrence !== 'every_week' ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSpringTargetField('anchor');
                      setIsSpringModalOpen(true);
                    }}
                    style={[
                      styles.promptAnchorBtn,
                      { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' },
                    ]}
                  >
                    <Icon name="alert" size={16} color="#F59E0B" />
                    <Text style={styles.promptAnchorText}>
                      برای کلاس چرخشی، لطفاً تاریخ اولین جلسه (مبدأ) را مشخص نمایید
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* 5. Exam Schedule Fields */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionLabel, { color: palette.textPrimary }]}>
                  تاریخ امتحانات (اختیاری)
                </Text>
                <View style={styles.examInputsRow}>
                  {/* Midterm */}
                  <TouchableOpacity
                    onPress={() => {
                      setSpringTargetField('midterm');
                      setIsSpringModalOpen(true);
                    }}
                    style={[
                      styles.examPickerBtn,
                      { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous },
                    ]}
                  >
                    <Icon name="calendar" size={15} color={palette.primaryLight} />
                    <Text style={[styles.examPickerText, { color: midtermExamDate ? palette.textPrimary : palette.textMuted }]}>
                      {midtermExamDate ? `میان‌ترم: ${midtermExamDate}` : 'ثبت تاریخ میان‌ترم'}
                    </Text>
                  </TouchableOpacity>

                  {/* Final */}
                  <TouchableOpacity
                    onPress={() => {
                      setSpringTargetField('final');
                      setIsSpringModalOpen(true);
                    }}
                    style={[
                      styles.examPickerBtn,
                      { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous },
                    ]}
                  >
                    <Icon name="calendar" size={15} color="#EF4444" />
                    <Text style={[styles.examPickerText, { color: finalExamDate ? palette.textPrimary : palette.textMuted }]}>
                      {finalExamDate ? `پایان‌ترم: ${finalExamDate}` : 'ثبت تاریخ پایان‌ترم'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 6. Professor & Location */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionLabel, { color: palette.textPrimary }]}>
                  نام استاد (اختیاری)
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous },
                  ]}
                >
                  <TextInput
                    placeholder="نام استاد را وارد نمایید"
                    placeholderTextColor={palette.textMuted}
                    value={professor}
                    onChangeText={setProfessor}
                    style={[
                      styles.textInput,
                      { color: palette.textPrimary, fontFamily: FONT_FAMILIES.persian.regular },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionLabel, { color: palette.textPrimary }]}>
                  محل برگزاری (اختیاری)
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous },
                  ]}
                >
                  <TextInput
                    placeholder="شماره کلاس یا نام دانشکده"
                    placeholderTextColor={palette.textMuted}
                    value={location}
                    onChangeText={setLocation}
                    style={[
                      styles.textInput,
                      { color: palette.textPrimary, fontFamily: FONT_FAMILIES.persian.regular },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Action Buttons matching Web */}
            <View style={[styles.actionRow, { flexDirection: getRtlRow() }]}>
              <TouchableOpacity
                onPress={onCancel}
                style={[
                  styles.cancelBtn,
                  { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelBtnText, { color: palette.textSecondary }]}>انصراف</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.saveBtn,
                  { backgroundColor: palette.primary, shadowColor: palette.primary },
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>
                  {isEditing ? 'ذخیره تغییرات' : 'ثبت کلاس'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SpringCalendarModal
        visible={isSpringModalOpen}
        onClose={() => setIsSpringModalOpen(false)}
        onSelectDate={handleSelectCalendarDate}
        initialDate={
          springTargetField === 'anchor'
            ? anchorDate
            : springTargetField === 'midterm'
            ? midtermExamDate
            : finalExamDate
        }
        title={
          springTargetField === 'anchor'
            ? 'تاریخ اولین جلسه این کلاس را انتخاب کنید'
            : springTargetField === 'midterm'
            ? 'تاریخ امتحان میان‌ترم را انتخاب کنید'
            : 'تاریخ امتحان پایان‌ترم را انتخاب کنید'
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.2,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
        shadowColor: '#000000',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flex: 1,
  },
  title: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: { width: '100%' },
  sectionContainer: { marginBottom: 16 },
  sectionLabel: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  labelRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subHint: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 10,
    writingDirection: 'rtl',
  },
  requiredStar: { color: '#EF4444' },
  inputContainer: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: {
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    padding: 0,
  },
  errorText: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 11,
    color: '#EF4444',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
  },
  daysGrid: {
    flexWrap: 'wrap',
    gap: 6,
  },
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
  slotsGrid: {
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  slotButton: {
    width: '48%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  selectedSlotGlow: {
    ...Platform.select({
      android: { elevation: 4 },
      ios: { shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    }),
  },
  slotPersianText: {
    fontSize: 12,
    lineHeight: 16,
    writingDirection: 'rtl',
  },
  slotLatinText: {
    fontFamily: FONT_FAMILIES.english.regular,
    fontSize: 10,
  },
  customTimeWell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  customTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  customTimeInput: {
    fontSize: 12,
    padding: 0,
    flex: 1,
  },
  clearCustomTimeBtn: {
    padding: 6,
  },
  customTimeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  customTimeToggleText: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 11.5,
    writingDirection: 'rtl',
  },
  recurrenceGrid: {
    flexWrap: 'wrap',
    gap: 8,
  },
  recurrenceBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  recurrenceIconText: {
    fontSize: 14,
  },
  recurrenceLabel: {
    fontSize: 11.5,
    writingDirection: 'rtl',
  },
  anchorChipCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  anchorTopRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anchorLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  anchorLabelText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11.5,
    writingDirection: 'rtl',
    flex: 1,
  },
  changeAnchorBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  changeAnchorBtnText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 10.5,
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  anchorProjectionText: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 10.5,
    color: '#10B981',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  promptAnchorBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  promptAnchorText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11,
    color: '#F59E0B',
    writingDirection: 'rtl',
  },
  examInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  examPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  examPickerText: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 11,
    writingDirection: 'rtl',
  },
  actionRow: {
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12.5,
    writingDirection: 'rtl',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  saveBtnText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12.5,
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
});
