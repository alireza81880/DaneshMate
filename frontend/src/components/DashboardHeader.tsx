import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { NeumorphicTheme } from '../theme/colors';

interface DashboardHeaderProps {
  studentName: string;
  studentId: string;
  major: string;
  termString: string;
  notificationCount?: number;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
}

/**
 * DashboardHeader (هدر خوش‌آمدگویی نئومورفیک)
 * Features tactile dual-shadow action buttons, prominent typography hierarchy,
 * and specular lighting glints.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  studentName,
  studentId,
  major,
  termString,
  notificationCount = 2,
  onProfilePress,
  onNotificationPress,
}) => {
  const bellScale = useRef(new Animated.Value(1)).current;

  const handleNotificationPress = () => {
    Animated.sequence([
      Animated.timing(bellScale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.timing(bellScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    if (onNotificationPress) onNotificationPress();
  };

  return (
    <View style={styles.container}>
      <View style={styles.textSection}>
        <View style={styles.welcomeKickerRow}>
          <Text style={styles.welcomeKicker}>دانش‌میت · دستیار هوشمند دانشجو</Text>
          <View style={styles.kickerPill}>
            <Text style={styles.kickerPillText}>{termString}</Text>
          </View>
        </View>

        <Text style={styles.studentName}>سلام، {studentName} 👋</Text>
        <Text style={styles.studentMeta}>
          {major} · شماره دانشجویی: {studentId}
        </Text>
      </View>

      {/* Right Controls: Notification Bell + Avatar */}
      <View style={styles.actionButtons}>
        {/* Notification Neumorphic Button */}
        <Animated.View style={{ transform: [{ scale: bellScale }] }}>
          <Pressable onPress={handleNotificationPress} style={styles.circleBtn}>
            <Text style={styles.iconEmoji}>🔔</Text>
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount}</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* User Avatar Well */}
        <Pressable onPress={onProfilePress} style={[styles.circleBtn, styles.avatarBtn]}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarText}>AR</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 4,
  },
  textSection: {
    flex: 1,
    paddingRight: 12,
  },
  welcomeKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  welcomeKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4361EE',
    letterSpacing: 0.2,
  },
  kickerPill: {
    backgroundColor: '#d8dee6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  kickerPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  studentName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  studentMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: NeumorphicTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    boxShadow: '5px 5px 10px #b8b9be, -5px -5px 10px #ffffff',
  },
  iconEmoji: {
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#e11d48',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E5EC',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  avatarBtn: {
    backgroundColor: '#E0E5EC',
  },
  avatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbe0ea',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 2px 2px 4px #b8b9be, inset -2px -2px 4px #ffffff',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4361EE',
  },
});
