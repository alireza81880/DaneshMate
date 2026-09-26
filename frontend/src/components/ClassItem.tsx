import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicTheme } from '../theme/colors';

export interface ClassItemData {
  id: string;
  code: string;
  title: string;
  instructor: string;
  time: string;
  location: string;
  isCurrent?: boolean;
}

interface ClassItemProps {
  item: ClassItemData;
  onPress?: () => void;
  onCheckIn?: () => void;
  isCheckedIn?: boolean;
}

/**
 * ClassItem (کارت کلاس درس با استایل نئومورفیک تعاملی)
 * Has distinct elevated state, active class indicator badge, and physical tap feedback.
 */
export const ClassItem: React.FC<ClassItemProps> = ({
  item,
  onPress,
  onCheckIn,
  isCheckedIn = false,
}) => {
  const [pressed, setPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 4,
      speed: 15,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 14 }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.cardWrapper,
          pressed ? styles.cardPressed : styles.cardElevated,
          item.isCurrent && styles.cardActiveCurrent,
        ]}
      >
        {/* Specular Highlight Rim */}
        {!pressed && <View style={styles.topSpecular} />}

        {/* Header: Code, Title, and Time Badge */}
        <View style={styles.headerRow}>
          <View style={styles.titleArea}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{item.code}</Text>
              {item.isCurrent && (
                <View style={styles.liveTag}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>کلاس جاری</Text>
                </View>
              )}
            </View>
            <Text style={styles.classTitle}>{item.title}</Text>
          </View>

          {/* Time Well (Recessed Indicator) */}
          <View style={styles.timeWell}>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        </View>

        {/* Footer: Instructor, Location, and Quick Action */}
        <View style={styles.footerRow}>
          <View style={styles.metaRow}>
            <Text style={styles.metaInstructor}>استاد: {item.instructor}</Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.metaLocation}>{item.location}</Text>
          </View>

          {onCheckIn && (
            <Pressable
              onPress={onCheckIn}
              style={[
                styles.checkInBtn,
                isCheckedIn ? styles.checkInBtnDone : styles.checkInBtnDefault,
              ]}
            >
              <Text
                style={[
                  styles.checkInText,
                  isCheckedIn ? styles.checkInTextDone : styles.checkInTextDefault,
                ]}
              >
                {isCheckedIn ? 'حضور ثبت شد ✓' : 'ثبت ورود'}
              </Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: NeumorphicTheme.colors.background,
    borderRadius: 20,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  cardElevated: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    boxShadow: '6px 6px 14px #b8b9be, -6px -6px 14px #ffffff',
  },
  cardPressed: {
    backgroundColor: '#d9dfeb',
    borderWidth: 1,
    borderColor: '#c6ccd6',
    boxShadow: 'inset 4px 4px 8px #bec3cc, inset -4px -4px 8px #ffffff',
  },
  cardActiveCurrent: {
    borderLeftWidth: 4,
    borderLeftColor: '#4361EE',
  },
  topSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleArea: {
    flex: 1,
    marginRight: 10,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4361EE',
    letterSpacing: 0.5,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 97, 238, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#4361EE',
  },
  liveText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#4361EE',
  },
  classTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 2,
  },
  timeWell: {
    backgroundColor: '#d8dee6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    boxShadow: 'inset 2px 2px 4px #bec3cc, inset -2px -2px 4px #ffffff',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#d6dbe3',
    paddingTop: 10,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  metaInstructor: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  metaSeparator: {
    fontSize: 10,
    color: '#94a3b8',
  },
  metaLocation: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  checkInBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  checkInBtnDefault: {
    backgroundColor: '#E0E5EC',
    boxShadow: '3px 3px 6px #b8b9be, -3px -3px 6px #ffffff',
  },
  checkInBtnDone: {
    backgroundColor: '#d3ebe4',
    boxShadow: 'inset 2px 2px 4px #a3c9bd, inset -2px -2px 4px #ffffff',
  },
  checkInText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  checkInTextDefault: {
    color: '#4361EE',
  },
  checkInTextDone: {
    color: '#0d9488',
  },
});
