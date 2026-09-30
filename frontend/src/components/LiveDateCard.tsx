import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { NeumorphicCard } from './NeumorphicCard';
import { Icon } from './Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { getRtlRow } from '../utils/rtl';
import { getFullJalaliDateTimeString, toPersianDigits, gregorianToJalali, PERSIAN_MONTHS } from '../utils/jalali';

interface LiveDateCardProps {
  style?: object;
}

const WEEK_DAYS = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

export const LiveDateCard: React.FC<LiveDateCardProps> = ({ style }) => {
  const { palette } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [jy, jm, jd] = gregorianToJalali(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate()
  );
  const weekDayName = WEEK_DAYS[currentDate.getDay()];
  const monthName = PERSIAN_MONTHS[jm - 1];
  const dateString = `${weekDayName}، ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;

  const hours = currentDate.getHours().toString().padStart(2, '0');
  const minutes = currentDate.getMinutes().toString().padStart(2, '0');
  const seconds = currentDate.getSeconds().toString().padStart(2, '0');
  const timeString = `${toPersianDigits(hours)}:${toPersianDigits(minutes)}:${toPersianDigits(seconds)}`;

  return (
    <NeumorphicCard style={[styles.card, style]} borderRadius={24}>
      <View style={[styles.container, { flexDirection: getRtlRow() }]}>
        {/* Calendar Icon and Date Text Group */}
        <View style={[styles.leftGroup, { flexDirection: getRtlRow() }]}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: palette.surfaceInner,
                borderColor: palette.borderLuminous,
              },
            ]}
          >
            <Icon name="calendar" size={22} color={palette.primary} />
          </View>
          <View style={styles.textGroup}>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              تقویم دانشگاهی امروز
            </Text>
            <Text style={[styles.dateText, { color: palette.textPrimary }]}>
              {dateString}
            </Text>
          </View>
        </View>

        {/* Live Clock Display */}
        <Text style={[styles.clockText, { color: palette.primary }]}>
          {timeString}
        </Text>
      </View>
    </NeumorphicCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 20,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftGroup: {
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dateText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  clockText: {
    fontFamily: FONT_FAMILIES.english.bold,
    fontSize: 17,
    letterSpacing: 0.5,
    textAlign: 'left',
  },
});
