import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicTheme } from '../theme/colors';
import { gregorianToJalali, toPersianDigits } from '../utils/jalali';

interface LiveDateCardProps {
  style?: object;
}

/**
 * LiveDateCard Component
 * Displays the current Jalali date and time.
 *
 * Uses the pure-JS Jalali converter instead of Intl persian calendar:
 * Hermes on Android has limited Intl calendar support, and a throw during render
 * closes a release build immediately.
 */
export const LiveDateCard: React.FC<LiveDateCardProps> = ({ style }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [jy, jm, jd] = gregorianToJalali(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate()
  );
  const formattedFullDate = `${jy}/${jm}/${jd}`;
  const hh = currentDate.getHours().toString().padStart(2, '0');
  const mm = currentDate.getMinutes().toString().padStart(2, '0');
  const timeStr = toPersianDigits(`${hh}:${mm}`);

  return (
    <NeumorphicCard style={[styles.card, style]} borderRadius={24}>
      <View style={styles.container}>
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

        <View style={styles.calendarPlate}>
          <View style={styles.calendarInner}>
            <Text style={styles.calendarTopBar}>🗓️</Text>
            <Text style={styles.calendarDayNum}>{toPersianDigits(jd)}</Text>
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
