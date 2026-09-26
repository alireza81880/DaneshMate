import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { NeumorphicCard } from '../components/NeumorphicCard';
import { NeumorphicButton } from '../components/NeumorphicButton';
import { NullSparkleLink } from '../components/NullSparkleLink';
import { UserProfileData } from '../components/ProfileSetupModal';

interface ProfileScreenProps {
  userProfile: UserProfileData;
  onUpdateProfile: (data: UserProfileData) => void;
  totalClasses: number;
  totalNotes: number;
  onOpenSettings: () => void;
}

const NAME_REGEX = /^[a-zA-Z\u0600-\u06FF\uFB8A\u067E\u0686\u06AF\u200c\s]+$/;

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userProfile,
  onUpdateProfile,
  totalClasses,
  totalNotes,
  onOpenSettings,
}) => {
  const { palette } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(userProfile.firstName);
  const [lastName, setLastName] = useState(userProfile.lastName);
  const [passedUnits, setPassedUnits] = useState(userProfile.passedUnits || '');

  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const [savedNotice, setSavedNotice] = useState(false);

  const initials = `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`.toUpperCase();

  const handleSave = () => {
    const errs: { firstName?: string; lastName?: string } = {};
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst) {
      errs.firstName = 'ورود نام الزامی است.';
    } else if (!NAME_REGEX.test(trimmedFirst)) {
      errs.firstName = 'نام فقط شامل حروف فارسی یا انگلیسی است.';
    }

    if (!trimmedLast) {
      errs.lastName = 'ورود نام خانوادگی الزامی است.';
    } else if (!NAME_REGEX.test(trimmedLast)) {
      errs.lastName = 'نام خانوادگی فقط شامل حروف فارسی یا انگلیسی است.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onUpdateProfile({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      passedUnits: passedUnits.trim() || undefined,
    });

    setIsEditing(false);
    setErrors({});
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>پروفایل دانشجویی</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          مدیریت اطلاعات هویتی و سوابق تحصیلی در DaneshMate
        </Text>
      </View>

      {savedNotice && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>اطلاعات شما با موفقیت بروزرسانی شد ✓</Text>
        </View>
      )}

      {/* Profile Card */}
      <NeumorphicCard style={styles.profileCard} borderRadius={26}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: palette.surfaceInner, borderColor: palette.primary }]}>
            {Platform.OS === 'web' ? (
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={palette.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ) : (
              <Text style={[styles.avatarText, { color: palette.primary }]}>DM</Text>
            )}
          </View>

          <View style={styles.identityInfo}>
            <Text style={[styles.fullName, { color: palette.textPrimary }]}>
              {userProfile.firstName} {userProfile.lastName}
            </Text>
            <View style={[styles.badgePill, { backgroundColor: palette.surfaceInner }]}>
              <Text style={[styles.badgeText, { color: palette.primary }]}>دانشجوی رسمی DaneshMate</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { borderColor: palette.border }]}>
          <View style={styles.statCol}>
            <Text style={[styles.statValue, { color: palette.primary }]}>{totalClasses}</Text>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>کلاس هفتگی</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: palette.divider }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statValue, { color: palette.textPrimary }]}>{userProfile.passedUnits || '—'}</Text>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>واحد گذرانده</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: palette.divider }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statValue, { color: palette.primary }]}>{totalNotes}</Text>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>لاگ ثبت‌شده</Text>
          </View>
        </View>
      </NeumorphicCard>

      {/* Edit Form or Read-only details */}
      {isEditing ? (
        <NeumorphicCard style={styles.formCard} borderRadius={22}>
          <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>ویرایش اطلاعات کاربری</Text>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: palette.textSecondary }]}>نام</Text>
            <View
              style={[
                styles.inputWell,
                { backgroundColor: palette.surfaceInner, borderColor: errors.firstName ? '#EF4444' : palette.border },
              ]}
            >
              <TextInput
                style={[styles.input, { color: palette.textPrimary }]}
                value={firstName}
                onChangeText={(t) => {
                  setFirstName(t);
                  if (errors.firstName) setErrors((e) => ({ ...e, firstName: undefined }));
                }}
                placeholder="نام خود را وارد کنید"
                placeholderTextColor={palette.textMuted}
                textAlign="right"
              />
            </View>
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: palette.textSecondary }]}>نام خانوادگی</Text>
            <View
              style={[
                styles.inputWell,
                { backgroundColor: palette.surfaceInner, borderColor: errors.lastName ? '#EF4444' : palette.border },
              ]}
            >
              <TextInput
                style={[styles.input, { color: palette.textPrimary }]}
                value={lastName}
                onChangeText={(t) => {
                  setLastName(t);
                  if (errors.lastName) setErrors((e) => ({ ...e, lastName: undefined }));
                }}
                placeholder="نام خانوادگی را وارد کنید"
                placeholderTextColor={palette.textMuted}
                textAlign="right"
              />
            </View>
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
          </View>

          {/* Passed Units */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: palette.textSecondary }]}>واحدهای گذرانده (اختیاری)</Text>
            <View style={[styles.inputWell, { backgroundColor: palette.surfaceInner, borderColor: palette.border }]}>
              <TextInput
                style={[styles.input, { color: palette.textPrimary }]}
                value={passedUnits}
                onChangeText={setPassedUnits}
                placeholder="تعداد واحدهای پاس شده"
                placeholderTextColor={palette.textMuted}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.formActions}>
            <NeumorphicButton title="ذخیره اطلاعات" variant="primary" size="md" onPress={handleSave} />
            <NeumorphicButton
              title="انصراف"
              size="md"
              onPress={() => {
                setFirstName(userProfile.firstName);
                setLastName(userProfile.lastName);
                setPassedUnits(userProfile.passedUnits || '');
                setIsEditing(false);
                setErrors({});
              }}
              style={{ marginTop: 8 }}
            />
          </View>
        </NeumorphicCard>
      ) : (
        <View style={styles.actionsContainer}>
          <NeumorphicButton
            title="ویرایش مشخصات"
            variant="primary"
            size="lg"
            onPress={() => setIsEditing(true)}
          />

          <NeumorphicButton
            title="تنظیمات پوسته و ظاهر برنامه"
            size="md"
            onPress={onOpenSettings}
            style={{ marginTop: 12 }}
          />
        </View>
      )}

      {/* Footer Branding */}
      <NullSparkleLink />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  noticeBox: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  noticeText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  profileCard: {
    padding: 20,
    marginBottom: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
  },
  identityInfo: {
    flex: 1,
  },
  fullName: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  formCard: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 6,
  },
  inputWell: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 4,
  },
  formActions: {
    marginTop: 10,
  },
  actionsContainer: {
    marginTop: 8,
  },
});
