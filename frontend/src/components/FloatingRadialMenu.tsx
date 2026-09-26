import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { hapticFeedback } from '../utils/haptics';

export type MainTabType = 'home' | 'notes' | 'reports' | 'profile' | 'settings';

interface RadialMenuItem {
  id: MainTabType;
  label: string;
}

interface FloatingRadialMenuProps {
  activeTab: MainTabType;
  onTabSelect: (tab: MainTabType) => void;
  notesCount?: number;
}

const MENU_ITEMS: RadialMenuItem[] = [
  { id: 'home', label: 'داشبورد' },
  { id: 'notes', label: 'یادداشت کلاس' },
  { id: 'reports', label: 'گزارشات' },
  { id: 'profile', label: 'پروفایل' },
  { id: 'settings', label: 'تنظیمات پوسته' },
];

const RADIUS = 96;

/**
 * Ultra-Modern Vector Icon Node (Replacing childish system emojis)
 */
const VectorIconNode: React.FC<{ type: MainTabType; color: string; size?: number }> = ({
  type,
  color,
  size = 20,
}) => {
  if (Platform.OS === 'web') {
    switch (type) {
      case 'home':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'notes':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        );
      case 'reports':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        );
      case 'profile':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'settings':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5" fill={color} />
            <circle cx="17.5" cy="10.5" r=".5" fill={color} />
            <circle cx="8.5" cy="7.5" r=".5" fill={color} />
            <circle cx="6.5" cy="12.5" r=".5" fill={color} />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
        );
    }
  }

  // Fallback for native runtime
  const symbols: Record<MainTabType, string> = {
    home: '⌂',
    notes: '🎙',
    reports: '❙❙❙',
    profile: '●',
    settings: '✦',
  };
  return <Text style={{ color, fontSize: size, fontWeight: '900' }}>{symbols[type]}</Text>;
};

export const FloatingRadialMenu: React.FC<FloatingRadialMenuProps> = ({
  activeTab,
  onTabSelect,
  notesCount = 0,
}) => {
  const { palette } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const animation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the glowing ring when collapsed
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation;
    if (!isOpen) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (pulseLoop) pulseLoop.stop();
    };
  }, [isOpen]);

  const toggleMenu = () => {
    hapticFeedback.light();
    const toValue = isOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 6,
      tension: 65,
      useNativeDriver: true,
    }).start();
    setIsOpen(!isOpen);
  };

  const handleSelect = (tab: MainTabType) => {
    hapticFeedback.light();
    onTabSelect(tab);
    Animated.timing(animation, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  return (
    <>
      {/* Backdrop blur dismiss layer */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.backdropLayer} />
        </TouchableWithoutFeedback>
      )}

      {/* Floating Center Anchor */}
      <View style={styles.anchorWrapper} pointerEvents="box-none">
        {/* Fan-Out Child Vector Items (180° to 0° arc upward) */}
        {MENU_ITEMS.map((item, index) => {
          const angleDeg = 180 - index * (180 / (MENU_ITEMS.length - 1));
          const angleRad = (angleDeg * Math.PI) / 180;
          const targetX = Math.round(Math.cos(angleRad) * RADIUS);
          const targetY = -Math.round(Math.sin(angleRad) * RADIUS);

          const translateX = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, targetX],
          });
          const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, targetY],
          });
          const scale = animation.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [0, 0.5, 1],
          });
          const opacity = animation.interpolate({
            inputRange: [0, 0.2, 1],
            outputRange: [0, 0.3, 1],
          });

          const isSelected = activeTab === item.id;
          const badgeCount = item.id === 'notes' && notesCount > 0 ? notesCount : undefined;

          const iconColor = isSelected
            ? '#FFFFFF'
            : palette.isDark
            ? palette.textPrimary
            : palette.textPrimary;

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.radialItemContainer,
                {
                  transform: [{ translateX }, { translateY }, { scale }],
                  opacity,
                },
              ]}
              pointerEvents={isOpen ? 'auto' : 'none'}
            >
              <Pressable
                onPress={() => handleSelect(item.id)}
                style={({ pressed }) => [
                  styles.radialItemBtn,
                  {
                    backgroundColor: isSelected ? palette.primary : palette.surfaceCard,
                    borderColor: isSelected ? palette.primaryLight : palette.borderLuminous,
                    shadowColor: isSelected ? palette.primary : '#000000',
                  },
                  pressed && { transform: [{ scale: 0.92 }] },
                ]}
                accessibilityLabel={item.label}
              >
                <VectorIconNode type={item.id} color={iconColor} size={20} />

                {badgeCount ? (
                  <View style={[styles.badgePill, { backgroundColor: palette.secondaryAccent || '#EC4899' }]}>
                    <Text style={styles.badgePillText}>{badgeCount}</Text>
                  </View>
                ) : null}
              </Pressable>

              {/* Text Label Tooltip */}
              <View
                style={[
                  styles.itemLabelBubble,
                  {
                    backgroundColor: palette.isDark ? 'rgba(15, 18, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    borderColor: palette.borderLuminous,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.itemLabelText,
                    { color: isSelected ? palette.primary : palette.textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            </Animated.View>
          );
        })}

        {/* Central Orb Trigger Button */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              borderColor: palette.primary,
              transform: [{ scale: pulseAnim }],
              opacity: isOpen ? 0 : 0.45,
            },
          ]}
          pointerEvents="none"
        />

        <Pressable
          onPress={toggleMenu}
          style={({ pressed }) => [
            styles.mainOrb,
            {
              backgroundColor: palette.surfaceCard,
              borderColor: isOpen ? palette.primary : palette.borderLuminous,
              shadowColor: palette.primary,
            },
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isOpen ? 'بستن منو' : 'باز کردن منوی ناوبری شعاعی'}
        >
          {isOpen ? (
            <Text style={[styles.closeIcon, { color: palette.textPrimary }]}>✕</Text>
          ) : (
            <VectorIconNode type={activeTab} color={palette.primary} size={22} />
          )}

          {!isOpen && (
            <View style={[styles.accentDot, { backgroundColor: palette.primary }]} />
          )}
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdropLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 7, 12, 0.65)',
    zIndex: 90,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        cursor: 'pointer',
      } as any,
    }),
  },
  anchorWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: '50%',
    marginLeft: -32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  pulseRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
  },
  mainOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)',
        cursor: 'pointer',
        transition: 'border-color 0.25s ease',
      } as any,
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: '900',
  },
  accentDot: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  radialItemContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
  },
  radialItemBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        cursor: 'pointer',
      } as any,
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  badgePill: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  itemLabelBubble: {
    position: 'absolute',
    bottom: -22,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 54,
    alignItems: 'center',
  },
  itemLabelText: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
});
