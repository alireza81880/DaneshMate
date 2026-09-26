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
} from 'react-native';
import { NeumorphicTheme } from '../theme/colors';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicButton } from './NeumorphicButton';
import { NeumorphicInput } from './NeumorphicInput';
import { NeumorphicTimePicker } from './NeumorphicTimePicker';
import { hapticFeedback } from '../utils/haptics';

export type WeekDay = 'شنبه' | 'یکشنبه' | 'دوشنبه' | 'سه‌شنبه' | 'چهارشنبه' | 'پنج‌شنبه';
export type RecurrenceType = 'every_week' | 'even_weeks' | 'odd_weeks';

export interface ClassFormData {
  id?: string;
  name: string;
  day: WeekDay;
  time: string;
  recurrence: RecurrenceType;
  professor?: string;
  location?: string;
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

const RECURRENCE_OPTIONS: { id: RecurrenceType; label: string; icon: string }[] = [
  { id: 'every_week', label: 'هر هفته', icon: '🔁' },
  { id: 'even_weeks', label: 'هفته‌های زوج', icon: '✌️' },
  { id: 'odd_weeks', label: 'هفته‌های فرد', icon: '☝️' },
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
  const [professor, setProfessor] = useState(initialData?.professor || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [errors, setErrors] = useState<{ name?: string; time?: string }>({});

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

    // Success vibration when class is saved
    hapticFeedback.success();

    onSave({
      id: initialData?.id || Date.now().toString(),
      name: name.trim(),
      day,
      time: time.trim(),
      recurrence,
      professor: professor.trim() || undefined,
      location: location.trim() || undefined,
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
                اطلاعات زمان‌بندی و برگزاری درس را مشخص نمایید.
              </Text>
            </View>

            <View style={styles.form}>
              {/* 1. Class Name (Mandatory) */}
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

              {/* 2. Day Selection (Saturday to Thursday) */}
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

              {/* 3. Visual TimePicker Component (NO text input) */}
              <NeumorphicTimePicker
                value={time}
                onChange={(t) => {
                  setTime(t);
                  if (errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
                }}
                error={errors.time}
              />

              {/* 4. Bi-weekly / Rotating Schedule Recurrence Selector */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>
                  دوره تکرار تشکیل کلاس (چرخشی / هفتگی)
                </Text>
                <View style={styles.recurrenceRow}>
                  {RECURRENCE_OPTIONS.map((opt) => {
                    const isSelected = recurrence === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => setRecurrence(opt.id)}
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
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 5. Optional Professor's Name */}
              <NeumorphicInput
                label="نام استاد"
                optional={true}
                placeholder="نام استاد را وارد نمایید (اختیاری)"
                value={professor}
                onChangeText={setProfessor}
              />

              {/* 6. Optional Class Location */}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NeumorphicTheme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 22,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
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
    gap: 8,
  },
  dayButton: {
    flexBasis: '31%',
    flexGrow: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonUnselected: {
    backgroundColor: NeumorphicTheme.colors.background,
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px #b8b9be, -4px -4px 8px #ffffff',
      } as any,
    }),
  },
  dayButtonSelected: {
    backgroundColor: '#d8dee6',
    borderWidth: 1.5,
    borderColor: '#4361EE',
    ...Platform.select({
      web: {
        boxShadow: 'inset 3px 3px 6px #bec3cc, inset -3px -3px 6px #ffffff',
      } as any,
    }),
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  dayButtonTextSelected: {
    color: '#4361EE',
    fontWeight: '900',
  },
  recurrenceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  recurrenceBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurrenceBtnUnselected: {
    backgroundColor: NeumorphicTheme.colors.background,
    ...Platform.select({
      web: {
        boxShadow: '3px 3px 6px #b8b9be, -3px -3px 6px #ffffff',
      } as any,
    }),
  },
  recurrenceBtnSelected: {
    backgroundColor: '#d8dee6',
    borderWidth: 1.5,
    borderColor: '#4361EE',
    ...Platform.select({
      web: {
        boxShadow: 'inset 3px 3px 6px #bec3cc, inset -3px -3px 6px #ffffff',
      } as any,
    }),
  },
  recurrenceIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  recurrenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  recurrenceLabelSelected: {
    color: '#4361EE',
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
  },
});
