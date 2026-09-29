import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from '../components/Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { NeumorphicCard } from '../components/NeumorphicCard';
import { NullSparkleLink } from '../components/NullSparkleLink';
import { DynamicClassItemData } from '../components/DynamicClassItem';
import { ClassSessionLog } from '../components/ClassSessionCaptureModal';
import { getRtlRow } from '../utils/rtl';

interface AnalyticsScreenProps {
  classes: DynamicClassItemData[];
  sessionLogs: ClassSessionLog[];
  passedUnits?: string;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  classes,
  sessionLogs,
  passedUnits,
}) => {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  // Metrics calculations
  const totalClassesCount = classes.length;
  // Estimate: each 2-hour slot is approx 2 academic hours
  const totalWeeklyHours = totalClassesCount * 2;
  const remindersCount = sessionLogs.filter((s) => s.hasReminder).length;
  const totalNotesCount = sessionLogs.length;
  const audioRecordingsCount = sessionLogs.filter((s) => s.voiceMemoSeconds).length;

  // Day breakdown
  const dayBreakdown: Record<string, number> = {
    شنبه: 0,
    یکشنبه: 0,
    دوشنبه: 0,
    سه‌شنبه: 0,
    چهارشنبه: 0,
    پنج‌شنبه: 0,
  };
  classes.forEach((c) => {
    if (dayBreakdown[c.day] !== undefined) {
      dayBreakdown[c.day] += 1;
    }
  });

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
      {/* Title */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>گزارشات و آمار تحصیلی</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          تحلیل بار کاری هفتگی، پایش جلسات و وضعیت یادآورهای فعال
        </Text>
      </View>

      {/* Top Metric Cards */}
      <View style={styles.gridRow}>
        <NeumorphicCard style={styles.metricCard} borderRadius={20}>
          <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>ساعات کلاس هفتگی</Text>
          <Text style={[styles.metricNumber, { color: palette.primary }]}>{totalWeeklyHours} ساعت</Text>
          <Text style={[styles.metricSub, { color: palette.textMuted }]}>{totalClassesCount} درس ثبت شده</Text>
        </NeumorphicCard>

        <NeumorphicCard style={styles.metricCard} borderRadius={20}>
          <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>واحدهای گذرانده</Text>
          <Text style={[styles.metricNumber, { color: palette.textPrimary }]}>{passedUnits || '—'}</Text>
          <Text style={[styles.metricSub, { color: palette.textMuted }]}>کل کارنامه تحصیلی</Text>
        </NeumorphicCard>
      </View>

      <View style={styles.gridRow}>
        <NeumorphicCard style={styles.metricCard} borderRadius={20}>
          <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>یادآورهای فعال</Text>
          <Text style={[styles.metricNumber, { color: '#e11d48' }]}>{remindersCount} هشدار</Text>
          <Text style={[styles.metricSub, { color: palette.textMuted }]}>تکالیف و مرور پیش‌رو</Text>
        </NeumorphicCard>

        <NeumorphicCard style={styles.metricCard} borderRadius={20}>
          <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>جلسات ثبت‌شده</Text>
          <Text style={[styles.metricNumber, { color: palette.textPrimary }]}>{totalNotesCount} لاگ</Text>
          <Text style={[styles.metricSub, { color: palette.textMuted }]}>{audioRecordingsCount} فایل صوتی استاد</Text>
        </NeumorphicCard>
      </View>

      {/* Weekly Workload Breakdown */}
      <NeumorphicCard style={styles.chartCard} borderRadius={22}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          توزیع هفتگی جلسات درس (Weekly Workload)
        </Text>
        <Text style={[styles.sectionDesc, { color: palette.textSecondary }]}>
          تعداد ساعات و کلاس‌های برگزار شده در طول ایام هفته
        </Text>

        <View style={styles.daysList}>
          {Object.entries(dayBreakdown).map(([day, count]) => {
            const percentage = totalClassesCount > 0 ? (count / totalClassesCount) * 100 : 0;
            return (
              <View key={day} style={styles.dayRow}>
                <View style={styles.dayLabelGroup}>
                  <Text style={[styles.dayName, { color: palette.textPrimary }]}>{day}</Text>
                  <Text style={[styles.dayCount, { color: palette.textSecondary }]}>{count} کلاس ({count * 2}h)</Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: palette.surfaceInner }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(percentage, 3)}%`,
                        backgroundColor: count > 0 ? palette.primary : 'transparent',
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </NeumorphicCard>

      {/* Attendance & Session Health Card */}
      <NeumorphicCard style={styles.healthCard} borderRadius={22}>
        <View style={styles.healthRow}>
          <View style={[styles.healthIconCircle, { backgroundColor: palette.surfaceInner, borderColor: palette.borderLuminous }]}>
            <Icon name="reports" size={22} color={palette.primary} />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[styles.healthTitle, { color: palette.textPrimary }]}>شاخص آمادگی امتحانات</Text>
            <Text style={[styles.healthText, { color: palette.textSecondary }]}>
              {totalNotesCount > 0
                ? `شما برای ${totalNotesCount} جلسه یادداشت یا صوت ثبت کرده‌اید. پایش مستمر دروس احتمال موفقیت ترم را تا ۸۵٪ افزایش می‌دهد.`
                : 'هنوز یادداشت چندرسانه‌ای برای جلسات ثبت نکرده‌اید. از برگه «یادداشت کلاس» برای ضبط نکات استفاده کنید.'}
            </Text>
          </View>
        </View>
      </NeumorphicCard>

      {/* Footer Branding */}
      <NullSparkleLink />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20 },
  header: { marginBottom: 20, alignItems: 'flex-end' },
  title: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  gridRow: { flexDirection: getRtlRow(), flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  metricCard: { flex: 1, minWidth: 120, padding: 16 },
  metricLabel: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
  },
  metricNumber: {
    fontFamily: FONT_FAMILIES.english.bold,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'right',
  },
  metricSub: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
  },
  chartCard: { padding: 18, marginTop: 4, marginBottom: 14 },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  sectionDesc: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 16,
  },
  daysList: { gap: 10 },
  dayRow: { gap: 4 },
  dayLabelGroup: { flexDirection: getRtlRow(), justifyContent: 'space-between', alignItems: 'center' },
  dayName: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  dayCount: {
    fontFamily: FONT_FAMILIES.english.semiBold,
    fontSize: 11,
    fontWeight: '600',
  },
  barTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  healthCard: { padding: 18 },
  healthRow: { flexDirection: getRtlRow(), alignItems: 'center', gap: 14 },
  healthIconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  healthTitle: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  healthText: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
