import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicButton } from './NeumorphicButton';
import { NeumorphicTheme } from '../theme/colors';

interface ServerStatusProps {
  status: 'online' | 'checking' | 'offline';
  engineName?: string;
  responseTimeMs?: number | null;
  memorySafe?: boolean;
  onPing: () => void;
  isPinging?: boolean;
}

/**
 * ServerStatus (کارت وضعیت سرور بک‌اند Rust Axum)
 * Features dual-tone indicator glow, real-time response time, and an inner-shadow interactive ping trigger.
 */
export const ServerStatus: React.FC<ServerStatusProps> = ({
  status,
  engineName = 'Rust Axum v0.7 + Tokio',
  responseTimeMs,
  memorySafe = true,
  onPing,
  isPinging = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isPinging) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 300, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPinging, pulseAnim]);

  const isOnline = status === 'online';

  return (
    <NeumorphicCard style={styles.card} borderRadius={24}>
      <View style={styles.topRow}>
        <View style={styles.leftInfo}>
          {/* Status Indicator with Neumorphic Well */}
          <View style={styles.indicatorContainer}>
            <View style={styles.indicatorWell}>
              <Animated.View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isOnline
                      ? NeumorphicTheme.colors.success
                      : status === 'checking'
                      ? NeumorphicTheme.colors.warning
                      : NeumorphicTheme.colors.danger,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
            </View>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.title}>سرور پرسرعت Rust</Text>
                {memorySafe && (
                  <View style={styles.safeTag}>
                    <Text style={styles.safeTagText}>Memory-Safe 🛡️</Text>
                  </View>
                )}
              </View>
              <Text style={styles.engineText}>{engineName}</Text>
            </View>
          </View>
        </View>

        {/* Physical Ping Trigger */}
        <NeumorphicButton
          title={isPinging ? '...' : 'تست پینگ'}
          size="sm"
          onPress={onPing}
          disabled={isPinging}
          variant={isOnline ? 'standard' : 'primary'}
          style={styles.pingBtn}
        />
      </View>

      {/* Latency & Metrics Sub-shelf (Recessed Inset Plate) */}
      <View style={styles.recessedPlate}>
        <View style={styles.metricItem}>
          <Text style={styles.plateLabel}>زمان پاسخ (Latency):</Text>
          <Text style={[styles.plateValue, { color: isOnline ? '#0d9488' : '#64748b' }]}>
            {responseTimeMs ? `${responseTimeMs} ms` : isPinging ? 'در حال سنجش...' : 'آماده تست'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <Text style={styles.plateLabel}>معماری:</Text>
          <Text style={styles.plateValue}>Zero-Cost Async</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <Text style={styles.plateLabel}>وضعیت:</Text>
          <Text
            style={[
              styles.plateValue,
              { color: isOnline ? '#0d9488' : status === 'checking' ? '#eab308' : '#e11d48' },
            ]}
          >
            {isOnline ? 'Active' : status === 'checking' ? 'Connecting' : 'Standby'}
          </Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leftInfo: {
    flex: 1,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorWell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d5dbe3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    boxShadow: 'inset 2px 2px 4px #b8b9be, inset -2px -2px 4px #ffffff',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  safeTag: {
    backgroundColor: 'rgba(67, 97, 238, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  safeTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#4361EE',
  },
  engineText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  pingBtn: {
    marginLeft: 8,
  },
  recessedPlate: {
    backgroundColor: '#d8dee6',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: 'inset 3px 3px 6px #bec3cc, inset -3px -3px 6px #ffffff',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  plateLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  plateValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#c6ccd6',
  },
});
