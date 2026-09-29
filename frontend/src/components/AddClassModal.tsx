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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Icon, IconName } from './Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { rtlStyles } from '../utils/rtl';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicButton } from './NeumorphicButton';
import { NeumorphicInput } from './NeumorphicInput';
import { NeumorphicTimePicker } from './NeumorphicTimePicker';
import { SpringJalaliPicker } from './SpringJalaliPicker';
import { toPersianDigits } from '../utils/jalali';
import { hapticFeedback } from '../utils/haptics';

export type WeekDay = 'شنبه' | 'یکشنبه' | 'دوشنبه' | 'سه‌شنبه' | 'چهارشنبه' | 'پنج‌شنبه';
export type RecurrenceType = 'every_week' | 'even_weeks' | 'odd_weeks' | 'bi_weekly' | 'biweekly';
export type SimpleRecurrenceType = 'even' | 'odd' | 'weekly' | 'bi_weekly';

export interface ClassFormData {
  id?: string;
  name: string;
  day: WeekDay;
  time: string;
  recurrence: RecurrenceType;
  recurrence_type?: SimpleRecurrenceType; // 'even' | 'odd' | 'weekly' | 'bi_weekly'
  anchor_date?: string; // e.g. "1405/07/04"
  anchor_timestamp?: number; // UNIX epoch ms of first session
  scheduled_session_timestamps?: number[]; // Projected 8 bi-weekly session timestamps for 16-week term
  firstSessionDate?: string;
  professor?: string;
  location?: string;
  midtermExamDate?: string;
  finalExamDate?: string;
}

export interface AddClassModalProps {
  visible?: boolean;
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

interface RecurrenceOption {
  id: RecurrenceType;
  recType: SimpleRecurrenceType;
  label: string;
  icon: IconName;
  isBiweekly: boolean;
}

const RECURRENCE_OPTIONS: RecurrenceOption[] = [
  { id: 'every_week', recType: 'weekly', label: 'هر هفته', icon: 'repeat', isBiweekly: false },
  { id: 'even_weeks', recType: 'even', label: 'هفته‌های زوج', icon: 'calendar-check', isBiweekly: true },
  { id: 'odd_weeks', recType: 'odd', label: 'هفته‌های فرد', icon: 'calendar', isBiweekly: true },
  { id: 'bi_weekly', recType: 'bi_weekly', label: 'یک هفته در میان', icon: 'calendar', isBiweekly: true },
];

/**
 * AddClassModal
 * High-performance, Neumorphic Class Creation & Editing Modal
 * Features:
 * - 5 Standard 2-hour slots + zero-error 2-step automated custom time picker
 * - Bi-Weekly / Odd-Even session forecasting (16 academic weeks -> exactly 8 sessions)
 * - Spring-animated Jalali calendar integration (`SpringJalaliPicker` with tension: 50, friction: 7)
 * - Rust C-ABI core data alignment (`anchor_timestamp: i64`, `recurrence_type: String`)
 */
export const AddClassModal: React.FC<AddClassModalProps> = ({
  visible = true,
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
  const [recurrenceType, setRecurrenceType] = useState<SimpleRecurrenceType>(() => {
    if (initialData?.recurrence_type) return initialData.recurrence_type;
    if (initialData?.recurrence === 'even_weeks') return 'even';
    if (initialData?.recurrence === 'odd_weeks') return 'odd';
    if (initialData?.recurrence === 'bi_weekly') return 'bi_weekly';
    return 'weekly';
  });

  // Anchor date & 8-session projection state
  const [anchorDate, setAnchorDate] = useState<string>(
    initialData?.anchor_date || initialData?.firstSessionDate || ''
  );
  const [anchorTimestamp, setAnchorTimestamp] = useState<number | undefined>(
    initialData?.anchor_timestamp
  );
  const [anchorFormattedLabel, setAnchorFormattedLabel] = useState<string>(() => {
    if (initialData?.anchor_date) {
      return `مبدأ دوره: ${initialData.anchor_date}`;
    }
    return '';
  });
  const [scheduledSessionTimestamps, setScheduledSessionTimestamps] = useState<number[]>(
    initialData?.scheduled_session_timestamps || []
  );

  const [professor, setProfessor] = useState(initialData?.professor || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [errors, setErrors] = useState<{ name?: string; time?: string }>({});

  // Spring-Animated Persian Calendar Modal State
  const [isJalaliModalOpen, setIsJalaliModalOpen] = useState(false);

  // Trigger Condition: Immediately pop up calendar when user selects Even Weeks, Odd Weeks, or Bi-Weekly
  const handleSelectRecurrence = (opt: RecurrenceOption) => {
    hapticFeedback.selection();
    setRecurrence(opt.id);
    setRecurrenceType(opt.recType);

    if (opt.isBiweekly) {
      // Immediately open the Spring-Animated Jalali Calendar Modal
      setIsJalaliModalOpen(true);
    } else {
      // Weekly recurrence does not need bi-weekly anchor forecasting
      setScheduledSessionTimestamps([]);
    }
  };

  // Callback when anchor date is selected in SpringJalaliPicker
  const handleSelectAnchorDate = (
    dateStr: string,
    timestamp: number,
    formattedLabel: string,
    sessions: number[]
  ) => {
    setAnchorDate(dateStr);
    setAnchorTimestamp(timestamp);
    setAnchorFormattedLabel(formattedLabel);
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
      hapticFeedback.warning();
      setErrors(newErrors);
      return;
    }

    hapticFeedback.success();

    // Map to final ClassFormData payload aligned with Rust core
    onSave({
      id: initialData?.id || Date.now().toString(),
      name: name.trim(),
      day,
      time: time.trim(),
      recurrence,
      recurrence_type: recurrenceType,
      anchor_date: anchorDate.trim() || undefined,
      anchor_timestamp: anchorTimestamp,
      scheduled_session_timestamps:
        scheduledSessionTimestamps.length > 0 ? scheduledSessionTimestamps : undefined,
      firstSessionDate: anchorDate.trim() || undefined,
      professor: professor.trim() || undefined,
      location: location.trim() || undefined,
      midtermExamDate: initialData?.midtermExamDate,
      finalExamDate: initialData?.finalExamDate,
    });
  };

  if (!visible) return null;

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
            {/* Modal Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {isEditing ? 'ویرایش مشخصات کلاس' : 'افزودن کلاس جدید'}
              </Text>
              <Text style={styles.subtitle}>
                برنامه‌ریزی جلسات هفتگی و چرخشی با پیش‌بینی خودکار تقویم ترم
              </Text>
            </View>

            <View style={styles.form}>
              {/* 1. Class Name */}
              <NeumorphicInput
                label="نام کلاس / عنوان درس"
                placeholder="مثال: طراحی الگوریتم، ریاضی مهندسی"
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
                        onPress={() => {
                          hapticFeedback.selection();
                          setDay(d);
                        }}
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

              {/* 3. Interactive TimePicker (5 Standard Presets + Zero-Error 2-Step Custom) */}
              <NeumorphicTimePicker
                value={time}
                onChange={(t) => {
                  setTime(t);
                  if (errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
                }}
                error={errors.time}
              />

              {/* 4. Recurrence Selector (Weekly, Even Weeks, Odd Weeks, Bi-Weekly) */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>
                  چرخه برگزاری کلاس <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.recurrenceGrid}>
                  {RECURRENCE_OPTIONS.map((opt) => {
                    const isSelected = recurrence === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => handleSelectRecurrence(opt)}
                        style={[
                          styles.recurrenceBtn,
                          isSelected
                            ? styles.recurrenceBtnSelected
                            : styles.recurrenceBtnUnselected,
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
                      </Pressable>
                    );
                  })}
                </View>

                {/* 5. Neumorphic Soft-Inset Anchor Date Chip with 8-Session Projection */}
                {recurrence !== 'every_week' && anchorDate ? (
                  <View style={styles.anchorChipCard}>
                    <View style={styles.anchorChipTopRow}>
                      <View style={styles.anchorBadge}>
                        <Text style={styles.anchorBadgeIcon}>📅</Text>
                        <Text style={styles.anchorBadgeText}>
                          مبدأ دوره: {anchorFormattedLabel || anchorDate} • پیش‌بینی ۸ جلسه تا پایان ترم
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          hapticFeedback.light();
                          setIsJalaliModalOpen(true);
                        }}
                        style={styles.changeAnchorButton}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.changeAnchorText}>تغییر تاریخ مبدأ</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Forecasted Sessions Micro-Badge */}
                    {scheduledSessionTimestamps.length > 0 && (
                      <View style={styles.forecastInfo}>
                        <Text style={styles.forecastInfoText}>
                          ✓ ۸ جلسه تحصیلی به فواصل ۱۴ روزه در تقویم ترم ثبت گردید.
                        </Text>
                      </View>
                    )}
                  </View>
                ) : recurrence !== 'every_week' ? (
                  <TouchableOpacity
                    onPress={() => setIsJalaliModalOpen(true)}
                    style={styles.setAnchorPromptBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.setAnchorPromptIcon}>⚠️</Text>
                    <Text style={styles.setAnchorPromptText}>
                      برای کلاس چرخشی، لطفاً تاریخ اولین جلسه (مبدأ) را مشخص نمایید
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* 6. Professor Name (Optional) */}
              <NeumorphicInput
                label="نام استاد (اختیاری)"
                placeholder="نام استاد یا مدرس را وارد نمایید"
                value={professor}
                onChangeText={setProfessor}
              />

              {/* 7. Location (Optional) */}
              <NeumorphicInput
                label="محل برگزاری (اختیاری)"
                placeholder="شماره کلاس، نام دانشکده، یا لینک آنلاین"
                value={location}
                onChangeText={setLocation}
              />

              {/* Action Buttons */}
              <View style={styles.actions}>
                <NeumorphicButton
                  title="انصراف"
                  size="md"
                  onPress={onCancel}
                  style={styles.cancelBtn}
                />
                <NeumorphicButton
                  title={isEditing ? 'ذخیره تغییرات' : 'ثبت درس در برنامه'}
                  variant="primary"
                  size="md"
                  onPress={handleSave}
                  style={styles.submitBtn}
                />
              </View>
            </View>
          </NeumorphicCard>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Spring-Animated Persian Calendar Modal Component (tension: 50, friction: 7) */}
      <SpringJalaliPicker
        visible={isJalaliModalOpen}
        onClose={() => setIsJalaliModalOpen(false)}
        onSelectDate={handleSelectAnchorDate}
        initialDate={anchorDate}
        title="تاریخ اولین جلسه این درس را مشخص کنید"
        subtitle="برای محاسبه دقیق چرخه ۱۴ روزه (هفته‌های زوج و فرد) و پیش‌بینی ۸ جلسه تا پایان ترم"
      />
    </SafeAreaView>
  );
};

export default AddClassModal;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    padding: 22,
    backgroundColor: '#e6ebf2',
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'right',
  },
  requiredStar: {
    color: '#e11d48',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayButton: {
    width: '31.5%',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonUnselected: {
    backgroundColor: '#e6ebf2',
    ...Platform.select({
      web: { boxShadow: '2px 2px 5px #bec3cc, -2px -2px 5px #ffffff' } as any,
    }),
  },
  dayButtonSelected: {
    backgroundColor: '#2563eb',
  },
  dayButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  dayButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  recurrenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recurrenceBtn: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  recurrenceBtnUnselected: {
    backgroundColor: '#e6ebf2',
    ...Platform.select({
      web: { boxShadow: '2px 2px 5px #bec3cc, -2px -2px 5px #ffffff' } as any,
    }),
  },
  recurrenceBtnSelected: {
    backgroundColor: '#2563eb',
  },
  recurrenceIcon: {
    fontSize: 14,
  },
  recurrenceLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  recurrenceLabelSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  anchorChipCard: {
    marginTop: 10,
    backgroundColor: '#d8dee6',
    borderRadius: 14,
    padding: 10,
    ...Platform.select({
      web: { boxShadow: 'inset 2px 2px 5px #bec3cc, inset -2px -2px 5px #ffffff' } as any,
    }),
  },
  anchorChipTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  anchorBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  anchorBadgeIcon: {
    fontSize: 13,
  },
  anchorBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e293b',
    flexShrink: 1,
  },
  changeAnchorButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeAnchorText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  forecastInfo: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  forecastInfoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
    textAlign: 'right',
  },
  setAnchorPromptBtn: {
    marginTop: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  setAnchorPromptIcon: {
    fontSize: 13,
  },
  setAnchorPromptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 1.5,
  },
});
