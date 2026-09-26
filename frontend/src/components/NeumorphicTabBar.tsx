import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export type MainTabType = 'home' | 'notes' | 'reports' | 'profile' | 'settings';

interface TabItem {
  id: MainTabType;
  label: string;
  icon: string;
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
  const { palette } = useTheme();

  const tabs: TabItem[] = [
    { id: 'home', label: 'داشبورد', icon: '🏠' },
    { id: 'notes', label: 'یادداشت کلاس', icon: '🎙️', badge: notesCount > 0 ? notesCount : undefined },
    { id: 'reports', label: 'گزارشات', icon: '📊' },
    { id: 'profile', label: 'پروفایل', icon: '👤' },
    { id: 'settings', label: 'تنظیمات', icon: '⚙️' },
  ];

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.barContainer,
          {
            backgroundColor: palette.surfaceCard,
            borderColor: palette.border,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
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
                <Text style={styles.tabIcon}>{tab.icon}</Text>
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
                    fontWeight: isActive ? '900' : '600',
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
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  barContainer: {
    flexDirection: 'row',
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
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.12), inset -2px -2px 4px rgba(255,255,255,0.7)',
      } as any,
    }),
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
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
    fontWeight: '900',
  },
});
