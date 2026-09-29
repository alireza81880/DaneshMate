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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { FONT_FAMILIES } from '../theme/typography';
import { Icon } from '../components/Icon';
import { NeumorphicCard } from '../components/NeumorphicCard';
import { NeumorphicButton } from '../components/NeumorphicButton';
import { NullSparkleLink } from '../components/NullSparkleLink';
import { DonationBadge } from '../components/DonationBadge';
import { UserProfileData } from '../components/ProfileSetupModal';
import { getRtlRow } from '../utils/rtl';

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
  const insets = useSafeAreaInsets();
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
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: 14,
          paddingBottom: Math.max(insets.bottom + 96, 120),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
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
            <Icon name="profile" size={30} color={palette.primary} />
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

      {/* Footer Support & Branding */}
      <DonationBadge style={{ marginTop: 20 }} />
      <NullSparkleLink style={{ marginTop: 4 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
  },
  noticeBox: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  noticeText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  profileCard: {
    padding: 20,
    marginBottom: 20,
  },
  avatarSection: {
    flexDirection: getRtlRow(),
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
    fontFamily: FONT_FAMILIES.english.bold,
    fontSize: 22,
    fontWeight: '700',
  },
  identityInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  fullName: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  badgeText: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 11,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  statsRow: {
    flexDirection: getRtlRow(),
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
    fontFamily: FONT_FAMILIES.english.bold,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
    marginTop: 2,
    writingDirection: 'rtl',
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  formCard: {
    padding: 20,
  },
  cardTitle: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontFamily: FONT_FAMILIES.persian.semiBold,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
  },
  inputWell: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  errorText: {
    fontFamily: FONT_FAMILIES.persian.regular,
    color: '#EF4444',
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
  },
  formActions: {
    marginTop: 10,
  },
  actionsContainer: {
    marginTop: 8,
  },
});
