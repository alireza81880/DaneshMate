import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { rtlStyles } from '../utils/rtl';

interface DashboardHeaderProps {
  studentName: string;
  studentId: string;
  major: string;
  termString: string;
  notificationCount?: number;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  studentName,
  studentId,
  major,
  termString,
  notificationCount = 0,
  onProfilePress,
  onNotificationPress,
}) => {
  const { palette } = useTheme();
  const bellScale = useRef(new Animated.Value(1)).current;

  const handleNotificationPress = () => {
    Animated.sequence([
      Animated.timing(bellScale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.timing(bellScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    if (onNotificationPress) onNotificationPress();
  };

  return (
    <View style={[styles.container, rtlStyles.row]}>
      <View style={styles.textSection}>
        <View style={[styles.welcomeKickerRow, rtlStyles.row]}>
          <Text style={[styles.welcomeKicker, { color: palette.primary }]}>
            دانش‌میت · دستیار دانشجو
          </Text>
          <View style={[styles.kickerPill, { backgroundColor: palette.surfaceInner }]}>
            <Text style={[styles.kickerPillText, { color: palette.textSecondary }]}>
              {termString}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.studentName, { color: palette.textPrimary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          سلام، {studentName}
        </Text>
        <Text
          style={[styles.studentMeta, { color: palette.textSecondary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {major} · شماره دانشجویی: {studentId}
        </Text>
      </View>

      {/* Action Buttons: Notification Bell + Avatar */}
      <View style={[styles.actionButtons, rtlStyles.row]}>
        <Animated.View style={{ transform: [{ scale: bellScale }] }}>
          <Pressable
            onPress={handleNotificationPress}
            style={[
              styles.circleBtn,
              {
                backgroundColor: palette.surfaceCard,
                borderColor: palette.borderLuminous || palette.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="اعلان‌ها"
          >
            <Icon name="bell" size={18} color={palette.primary} />
            {notificationCount > 0 && (
              <View style={[styles.badge, { backgroundColor: palette.danger || '#ef4444' }]}>
                <Text style={styles.badgeText}>{notificationCount}</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        <Pressable
          onPress={onProfilePress}
          style={[
            styles.circleBtn,
            {
              backgroundColor: palette.surfaceCard,
              borderColor: palette.borderLuminous || palette.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="پروفایل کاربری"
        >
          <View style={[styles.avatarInner, { backgroundColor: palette.surfaceInner }]}>
            <Icon name="profile" size={18} color={palette.primary} />
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 4,
  },
  textSection: {
    flex: 1,
    paddingHorizontal: 8,
  },
  welcomeKickerRow: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  welcomeKicker: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  kickerPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  kickerPillText: {
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 9.5,
    lineHeight: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  studentName: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  studentMeta: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 11.5,
    lineHeight: 18,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionButtons: {
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      } as any,
    }),
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: FONT_FAMILIES.english.bold,
  },
  avatarInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
