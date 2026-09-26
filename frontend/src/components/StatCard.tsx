import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicProgressRing } from './NeumorphicProgressRing';

interface StatCardProps {
  title: string;
  value: string;
  metricLabel: string;
  progress: number; // 0 to 1
  accentColor?: string;
  trendText?: string;
  trendPositive?: boolean;
  subFootnote?: string;
  style?: ViewStyle;
}

/**
 * StatCard (کارت آماری نئومورفیک)
 * Combines high visual depth, convex extrusion, and an interactive progress ring.
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  metricLabel,
  progress,
  accentColor = '#4361EE',
  trendText,
  trendPositive = true,
  subFootnote,
  style,
}) => {
  return (
    <NeumorphicCard style={[styles.card, style]} borderRadius={24}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.ringContainer}>
        <NeumorphicProgressRing
          progress={progress}
          size={98}
          strokeWidth={9}
          valueText={value}
          label={metricLabel}
          accentColor={accentColor}
        />
      </View>

      <View style={styles.footerRow}>
        {trendText && (
          <View
            style={[
              styles.trendBadge,
              trendPositive ? styles.trendBadgePositive : styles.trendBadgeNeutral,
            ]}
          >
            <Text
              style={[
                styles.trendText,
                trendPositive ? styles.trendTextPositive : styles.trendTextNeutral,
              ]}
            >
              {trendText}
            </Text>
          </View>
        )}
        {subFootnote && <Text style={styles.footnote}>{subFootnote}</Text>}
      </View>
    </NeumorphicCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
  },
  ringContainer: {
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  trendBadgePositive: {
    backgroundColor: 'rgba(46, 196, 182, 0.15)',
  },
  trendBadgeNeutral: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  trendText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  trendTextPositive: {
    color: '#0d9488',
  },
  trendTextNeutral: {
    color: '#475569',
  },
  footnote: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
  },
});
