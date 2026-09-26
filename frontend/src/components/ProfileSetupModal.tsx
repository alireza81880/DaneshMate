import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicButton } from './NeumorphicButton';
import { NeumorphicInput } from './NeumorphicInput';

export interface UserProfileData {
  firstName: string;
  lastName: string;
  passedUnits?: string;
}

interface ProfileSetupModalProps {
  initialProfile?: UserProfileData | null;
  onSave: (profile: UserProfileData) => void;
  onCancel?: () => void;
  isFirstTime?: boolean;
}

/**
 * Strict regex accepting Persian and English letters + spaces and half-space (zwnj).
 * Explicitly rejects numbers, symbols, and punctuation.
 */
const NAME_REGEX = /^[a-zA-Z\u0600-\u06FF\uFB8A\u067E\u0686\u06AF\u200c\s]+$/;

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  initialProfile,
  onSave,
  onCancel,
  isFirstTime = false,
}) => {
  const { palette } = useTheme();
  const [firstName, setFirstName] = useState(initialProfile?.firstName || '');
  const [lastName, setLastName] = useState(initialProfile?.lastName || '');
  const [passedUnits, setPassedUnits] = useState(initialProfile?.passedUnits || '');
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  const handleSave = () => {
    const newErrors: { firstName?: string; lastName?: string } = {};
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    // 1. First Name Validation
    if (!trimmedFirst) {
      newErrors.firstName = 'ورود نام الزامی است.';
    } else if (!NAME_REGEX.test(trimmedFirst)) {
      newErrors.firstName = 'نام فقط باید شامل حروف (فارسی یا انگلیسی) باشد؛ اعداد و نمادها مجاز نیستند.';
    }

    // 2. Last Name Validation
    if (!trimmedLast) {
      newErrors.lastName = 'ورود نام خانوادگی الزامی است.';
    } else if (!NAME_REGEX.test(trimmedLast)) {
      newErrors.lastName = 'نام خانوادگی فقط باید شامل حروف (فارسی یا انگلیسی) باشد؛ اعداد و نمادها مجاز نیستند.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      passedUnits: passedUnits.trim() || undefined,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <NeumorphicCard style={styles.card} borderRadius={28}>
            <View style={[styles.iconCircle, { backgroundColor: palette.background }]}>
              <Text style={styles.iconText}>👤</Text>
            </View>

            <Text style={[styles.title, { color: palette.textPrimary }]}>
              {isFirstTime ? 'ثبت مشخصات دانشجو' : 'ویرایش پروفایل دانشجو'}
            </Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              {isFirstTime
                ? 'برای شخصی‌سازی و ورود به سامانه DaneshMate، مشخصات خود را وارد نمایید.'
                : 'اطلاعات نام و واحدهای گذرانده خود را بروزرسانی نمایید.'}
            </Text>

            <View style={styles.formContainer}>
              {/* First Name - Strict letters only */}
              <NeumorphicInput
                label="نام"
                placeholder="نام خود را وارد کنید"
                value={firstName}
                onChangeText={(val) => {
                  setFirstName(val);
                  if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
                error={errors.firstName}
                autoFocus={isFirstTime}
              />

              {/* Last Name - Strict letters only */}
              <NeumorphicInput
                label="نام خانوادگی"
                placeholder="نام خانوادگی خود را وارد کنید"
                value={lastName}
                onChangeText={(val) => {
                  setLastName(val);
                  if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
                error={errors.lastName}
              />

              {/* Passed Units - Optional */}
              <NeumorphicInput
                label="کل واحدهای گذرانده شده"
                optional={true}
                placeholder="تعداد واحدها (در صورت تمایل)"
                keyboardType="numeric"
                value={passedUnits}
                onChangeText={setPassedUnits}
              />
            </View>

            <View style={styles.buttonRow}>
              {onCancel && !isFirstTime && (
                <NeumorphicButton
                  title="انصراف"
                  size="md"
                  onPress={onCancel}
                  style={styles.cancelBtn}
                />
              )}
              <NeumorphicButton
                title={isFirstTime ? 'ورود به دانش‌میت' : 'ذخیره تغییرات'}
                variant="primary"
                size="md"
                onPress={handleSave}
                style={styles.saveBtn}
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
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.7)',
      } as any,
    }),
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  formContainer: {
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
});
