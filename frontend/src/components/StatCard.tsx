import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { FONT_FAMILIES } from '../theme/typography';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicProgressRing } from './NeumorphicProgressRing';

interface StatCardProps {
  title: string;
  value: string;
  metricLabel: string;
  progress: number;
  accentColor?: string;
  trendText?: string;
  trendPositive?: boolean;
  subFootnote?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  metricLabel,
  progress,
  accentColor,
  trendText,
  trendPositive = true,
  subFootnote,
  style,
}) => {
  const { palette } = useTheme();
  const effectiveAccent = accentColor || palette.primary;

  return (
    <NeumorphicCard style={[styles.card, style]} borderRadius={24}>
      <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>

      <View style={styles.ringContainer}>
        <NeumorphicProgressRing
          progress={progress}
          size={98}
          strokeWidth={9}
          valueText={value}
          label={metricLabel}
          accentColor={effectiveAccent}
        />
      </View>

      <View style={styles.footerRow}>
        {trendText && (
          <View
            style={[
              styles.trendBadge,
              trendPositive
                ? { backgroundColor: 'rgba(16, 185, 129, 0.15)' }
                : { backgroundColor: palette.surfaceInner },
            ]}
          >
            <Text
              style={[
                styles.trendText,
                trendPositive
                  ? { color: '#059669' }
                  : { color: palette.textSecondary },
              ]}
            >
              {trendText}
            </Text>
          </View>
        )}
        {subFootnote && (
          <Text style={[styles.footnote, { color: palette.textMuted }]}>
            {subFootnote}
          </Text>
        )}
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
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  ringContainer: {
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  trendText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 10.5,
    lineHeight: 14,
    writingDirection: 'rtl',
  },
  footnote: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
