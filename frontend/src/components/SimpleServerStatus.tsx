import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicTheme } from '../theme/colors';

interface SimpleServerStatusProps {
  isOnline: boolean;
  onRefresh?: () => void;
}

/**
 * SimpleServerStatus
 * Clean, user-friendly connectivity dot without technical jargon.
 */
export const SimpleServerStatus: React.FC<SimpleServerStatusProps> = ({
  isOnline,
  onRefresh,
}) => {
  return (
    <NeumorphicCard style={styles.card} borderRadius={20}>
      <View style={styles.content}>
        <View style={styles.statusGroup}>
          {/* Recessed well for dot indicator */}
          <View style={styles.indicatorWell}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isOnline
                    ? NeumorphicTheme.colors.success
                    : NeumorphicTheme.colors.warning,
                },
              ]}
            />
          </View>
          <View>
            <Text style={styles.statusTitle}>
              {isOnline ? 'سامانه دانشگاه: آنلاین و همگام' : 'در حال بررسی اتصال...'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {isOnline
                ? 'ارتباط پایدار و آماده دریافت برنامه'
                : 'لطفاً وضعیت اینترنت خود را بررسی کنید'}
            </Text>
          </View>
        </View>

        {onRefresh && (
          <Pressable
            onPress={onRefresh}
            style={({ pressed }) => [
              styles.refreshBtn,
              pressed && styles.refreshBtnPressed,
            ]}
          >
            <Text style={styles.refreshText}>بروزرسانی</Text>
          </Pressable>
        )}
      </View>
    </NeumorphicCard>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicatorWell: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#d5dbe3',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #b8b9be, inset -2px -2px 4px #ffffff',
      } as any,
    }),
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  statusSubtitle: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  refreshBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: NeumorphicTheme.colors.background,
    ...Platform.select({
      web: {
        boxShadow: '3px 3px 6px #b8b9be, -3px -3px 6px #ffffff',
      } as any,
    }),
  },
  refreshBtnPressed: {
    backgroundColor: '#d8dee6',
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #bec3cc, inset -2px -2px 4px #ffffff',
      } as any,
    }),
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4361EE',
  },
});
