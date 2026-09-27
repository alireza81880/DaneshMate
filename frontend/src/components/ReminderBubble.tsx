import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ReminderBubbleProps {
  time: string;
  triggerText: string;
  snoozedUntil?: string;
}

export const ReminderBubble: React.FC<ReminderBubbleProps> = React.memo(
  ({ time, triggerText, snoozedUntil }) => {
    const { palette } = useTheme();

    const gpuAcceleratedCardStyle = useMemo(
      () => [
        styles.chatBubble,
        {
          backgroundColor: palette.surfaceCard,
          borderColor: 'rgba(244, 63, 94, 0.3)',
          transform: Platform.OS === 'web' ? ([{ translateZ: 0 }] as any) : [{ perspective: 1000 }],
        },
      ],
      [palette.surfaceCard]
    );

    return (
      <View style={styles.messageRowLeft}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarIcon}>🔔</Text>
        </View>

        <View style={gpuAcceleratedCardStyle}>
          <View style={styles.bubbleHeader}>
            <Text style={styles.bubbleSender}>یادآور فعال</Text>
            <Text style={[styles.bubbleTime, { color: palette.textMuted }]}>
              {time.includes('-') ? time.split('-')[0].trim() : (time.includes('/') ? time : '1405/7/5')}
            </Text>
          </View>

          <Text style={[styles.reminderAlertText, { color: palette.textPrimary }]}>
            زمان‌بندی مرور: {triggerText}
          </Text>

          {snoozedUntil ? (
            <View style={styles.snoozeStatusBadge}>
              <Text style={styles.snoozeStatusText}>
                وضعیت تعویق: فعال ({snoozedUntil})
              </Text>
            </View>
          ) : null}

          {/* Bubble Footer: Time on Bottom-Left */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', paddingTop: 6, marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' }}>
            <Text style={{ fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: palette.textMuted }}>
              {time.includes('-') ? time.split('-').pop()?.trim() : time}
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

ReminderBubble.displayName = 'ReminderBubble';

const styles = StyleSheet.create({
  messageRowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    maxWidth: '92%',
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: '#F43F5E',
  },
  avatarIcon: {
    fontSize: 16,
  },
  chatBubble: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 6,
  },
  bubbleSender: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
    color: '#F43F5E',
  },
  bubbleTime: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  reminderAlertText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  snoozeStatusBadge: {
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  snoozeStatusText: {
    color: '#F43F5E',
    fontSize: 10,
    fontWeight: '800',
  },
});
