import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicTheme } from '../theme/colors';
import { gregorianToJalali, toPersianDigits } from '../utils/jalali';

interface LiveDateCardProps {
  style?: object;
}

interface SafeDateInfo {
  formattedFullDate: string;
  timeStr: string;
  dayNum: string;
}

/**
 * Safe date and time formatter resilient against Hermes engine / Android ICU variations.
 * Prefers offline mathematical Gregorian-to-Jalali conversion on native platforms.
 */
function getSafeDateDisplay(date: Date): SafeDateInfo {
  try {
    if (Platform.OS !== 'web') {
      const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
      const formattedFullDate = `${jy}/${jm}/${jd}`;
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      const dayNum = toPersianDigits(jd);
      return { formattedFullDate, timeStr, dayNum };
    }

    // Web Platform: Attempt standard Intl formatting with complete fallback guard
    let formattedFullDate = '1405/7/5';
    let timeStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    let dayNum = toPersianDigits(date.getDate());

    try {
      if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }).formatToParts(date);
        const year = parts.find((p) => p.type === 'year')?.value || '1405';
        const month = parts.find((p) => p.type === 'month')?.value || '7';
        const day = parts.find((p) => p.type === 'day')?.value || '5';
        formattedFullDate = `${year}/${month}/${day}`;

        const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        timeStr = timeFormatter.format(date);

        const dayFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian', { day: 'numeric' });
        const dayParsed = Number(dayFormatter.format(date)) || date.getDate();
        if (typeof Intl.NumberFormat !== 'undefined') {
          dayNum = new Intl.NumberFormat('fa-IR').format(dayParsed);
        } else {
          dayNum = toPersianDigits(dayParsed);
        }
      } else {
        const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
        formattedFullDate = `${jy}/${jm}/${jd}`;
        dayNum = toPersianDigits(jd);
      }
    } catch {
      const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
      formattedFullDate = `${jy}/${jm}/${jd}`;
      dayNum = toPersianDigits(jd);
    }

    return { formattedFullDate, timeStr, dayNum };
  } catch {
    return {
      formattedFullDate: '1405/7/5',
      timeStr: '12:00',
      dayNum: '۵',
    };
  }
}

/**
 * LiveDateCard Component
 * Prominently displays the current live day of week and formatted date
 * with Persian calendar support and real-time clock indicator.
 */
export const LiveDateCard: React.FC<LiveDateCardProps> = ({ style }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Update date periodically
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { formattedFullDate, timeStr, dayNum } = useMemo(
    () => getSafeDateDisplay(currentDate),
    [currentDate]
  );

  return (
    <NeumorphicCard style={[styles.card, style]} borderRadius={24}>
      <View style={styles.container}>
        {/* Left / Date Text Info */}
        <View style={styles.textGroup}>
          <View style={styles.badgeRow}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>امروز</Text>
            </View>
            <Text style={styles.timeLabel}>ساعت: {timeStr}</Text>
          </View>

          <Text style={styles.fullDateText}>{formattedFullDate}</Text>
        </View>

        {/* Right / Neumorphic Calendar Icon Plate */}
        <View style={styles.calendarPlate}>
          <View style={styles.calendarInner}>
            <Text style={styles.calendarTopBar}>🗓️</Text>
            <Text style={styles.calendarDayNum}>{dayNum}</Text>
          </View>
        </View>
      </View>
    </NeumorphicCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    marginBottom: 20,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textGroup: {
    flex: 1,
    paddingRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dce2ea',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #bec3cc, inset -2px -2px 4px #ffffff',
      } as any,
    }),
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4361EE',
  },
  liveText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#4361EE',
  },
  timeLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  fullDateText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1e293b',
    letterSpacing: -0.3,
    marginBottom: 2,
    textAlign: 'right',
  },
  academicTermText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'right',
  },
  calendarPlate: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: NeumorphicTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: NeumorphicTheme.colors.shadowDark,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '5px 5px 10px #b8b9be, -5px -5px 10px #ffffff',
      } as any,
    }),
  },
  calendarInner: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#d8dee6',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #bec3cc, inset -2px -2px 4px #ffffff',
      } as any,
    }),
  },
  calendarTopBar: {
    fontSize: 12,
  },
  calendarDayNum: {
    fontSize: 15,
    fontWeight: '900',
    color: '#4361EE',
    marginTop: -2,
  },
});
