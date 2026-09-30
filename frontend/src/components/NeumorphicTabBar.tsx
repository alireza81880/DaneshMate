import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Icon, IconName } from './Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { getRtlRow } from '../utils/rtl';

export type MainTabType = 'home' | 'notes' | 'reports' | 'profile' | 'settings';

interface TabItem {
  id: MainTabType;
  label: string;
  icon: IconName;
  badge?: number;
}

interface NeumorphicTabBarProps {
  activeTab: MainTabType;
  onTabPress: (tab: MainTabType) => void;
  notesCount?: number;
}

export const NeumorphicTabBar: React.FC<NeumorphicTabBarProps> = ({
  activeTab,
  onTabPress,
  notesCount = 0,
}) => {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  const tabs: TabItem[] = [
    { id: 'home', label: 'خانه', icon: 'home' },
    { id: 'notes', label: 'یادداشت‌ها', icon: 'notes', badge: notesCount > 0 ? notesCount : undefined },
    { id: 'reports', label: 'گزارش‌ها', icon: 'reports' },
    { id: 'profile', label: 'پروفایل', icon: 'profile' },
    { id: 'settings', label: 'پوسته‌ها', icon: 'palette' },
  ];

  const barBg = palette.isDark ? '#141A28' : palette.surfaceCard;

  return (
    <View
      style={[
        styles.outerContainer,
        {
          paddingBottom: Math.max(insets.bottom + 6, Platform.OS === 'ios' ? 20 : 10),
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.barContainer,
          {
            flexDirection: getRtlRow(),
            backgroundColor: barBg,
            borderColor: palette.borderLuminous,
            borderTopColor: palette.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)',
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const iconColor = isActive ? '#FFFFFF' : palette.textSecondary;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabPress(tab.id)}
              style={({ pressed }) => [
                styles.tabBtn,
                {
                  backgroundColor: isActive ? palette.primary : 'transparent',
                },
                isActive && styles.activeTabGlow,
                pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <View style={styles.iconContainer}>
                <Icon name={tab.icon} size={19} color={iconColor} />
                {tab.badge ? (
                  <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                ) : null}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? '#FFFFFF' : palette.textSecondary,
                    fontFamily: isActive ? FONT_FAMILIES.persian.bold : FONT_FAMILIES.persian.medium,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    zIndex: 90,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 22,
    borderWidth: 1.2,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
        shadowColor: '#000000',
      },
    }),
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 16,
    gap: 3,
  },
  activeTabGlow: {
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 10.5,
    lineHeight: 14,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
