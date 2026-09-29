import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Icon, IconName } from './Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { rtlStyles } from '../utils/rtl';

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
    { id: 'home', label: 'داشبورد', icon: 'home' },
    { id: 'notes', label: 'یادداشت کلاس', icon: 'notes', badge: notesCount > 0 ? notesCount : undefined },
    { id: 'reports', label: 'گزارشات', icon: 'reports' },
    { id: 'profile', label: 'پروفایل', icon: 'profile' },
    { id: 'settings', label: 'تنظیمات', icon: 'palette' },
  ];

  return (
    <View
      style={[
        styles.outerContainer,
        {
          paddingBottom: Math.max(insets.bottom + 8, Platform.OS === 'ios' ? 24 : 12),
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.barContainer,
          rtlStyles.row,
          {
            backgroundColor: palette.surfaceCard,
            borderColor: palette.border,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const iconColor = isActive ? palette.primary : palette.textSecondary;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabPress(tab.id)}
              style={({ pressed }) => [
                styles.tabBtn,
                isActive ? styles.tabBtnActive : styles.tabBtnInactive,
                {
                  backgroundColor: isActive ? palette.surfaceInner : 'transparent',
                  borderColor: isActive ? palette.primary : 'transparent',
                },
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <View style={styles.iconContainer}>
                <Icon name={tab.icon} size={20} color={iconColor} />
                {tab.badge ? (
                  <View style={[styles.badge, { backgroundColor: palette.primary }]}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                ) : null}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? palette.primary : palette.textSecondary,
                    fontFamily: isActive ? FONT_FAMILIES.persian.bold : FONT_FAMILIES.persian.medium,
                  },
                ]}
              >
                {tab.label}
              </Text>

              {/* Active Indicator Dot */}
              {isActive && (
                <View style={[styles.activeDot, { backgroundColor: palette.primary }]} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 50,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 26,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(255,255,255,0.6)',
      } as any,
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 18,
    marginHorizontal: 2,
    position: 'relative',
  },
  tabBtnInactive: {},
  tabBtnActive: {
    borderWidth: 1,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: FONT_FAMILIES.english.bold,
  },
});
