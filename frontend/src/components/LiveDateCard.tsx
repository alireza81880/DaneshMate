import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { NeumorphicCard } from './NeumorphicCard';
import { Icon } from './Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { rtlStyles } from '../utils/rtl';
import { gregorianToJalali, toPersianDigits } from '../utils/jalali';

interface LiveDateCardProps {
  style?: object;
}

interface SafeDateInfo {
  formattedFullDate: string;
  timeStr: string;
  dayNum: string;
}

function getSafeDateDisplay(date: Date): SafeDateInfo {
  try {
    const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const formattedFullDate = `${toPersianDigits(jy)}/${toPersianDigits(jm)}/${toPersianDigits(jd)}`;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${toPersianDigits(hours)}:${toPersianDigits(minutes)}`;
    const dayNum = toPersianDigits(jd);
    return { formattedFullDate, timeStr, dayNum };
  } catch {
    return {
      formattedFullDate: '۱۴۰۵/۰۷/۰۵',
      timeStr: '۱۲:۰۰',
      dayNum: '۵',
    };
  }
}

export const LiveDateCard: React.FC<LiveDateCardProps> = ({ style }) => {
  const { palette } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { formattedFullDate, timeStr, dayNum } = useMemo(
    () => getSafeDateDisplay(currentDate),
    [currentDate]
  );

  return (
    <NeumorphicCard style={[styles.card, style]} borderRadius={24}>
      <View style={[styles.container, rtlStyles.row]}>
        {/* Date Text Info */}
        <View style={styles.textGroup}>
          <View style={[styles.badgeRow, rtlStyles.row]}>
            <View style={[styles.liveIndicator, rtlStyles.row, { backgroundColor: palette.surfaceInner }]}>
              <View style={[styles.liveDot, { backgroundColor: palette.primary }]} />
              <Text style={[styles.liveText, { color: palette.primary }]}>امروز</Text>
            </View>
            <Text style={[styles.timeLabel, { color: palette.textSecondary }]}>
              ساعت: {timeStr}
            </Text>
          </View>

          <Text style={[styles.fullDateText, { color: palette.textPrimary }]}>
            {formattedFullDate}
          </Text>
        </View>

        {/* Calendar Icon Plate */}
        <View
          style={[
            styles.calendarPlate,
            {
              backgroundColor: palette.surfaceInner,
              borderColor: palette.borderLuminous || palette.border,
            },
          ]}
        >
          <View style={styles.calendarInner}>
            <Icon name="calendar" size={16} color={palette.primary} />
            <Text style={[styles.calendarDayNum, { color: palette.primary }]}>
              {dayNum}
            </Text>
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textGroup: {
    flex: 1,
    paddingHorizontal: 8,
  },
  badgeRow: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  liveIndicator: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 10.5,
    lineHeight: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  timeLabel: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fullDateText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  calendarPlate: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      } as any,
    }),
  },
  calendarInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayNum: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 13,
    lineHeight: 16,
    marginTop: 2,
  },
});
