import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { FONT_FAMILIES } from '../theme/typography';
import { Icon } from './Icon';
import { NeumorphicButton } from './NeumorphicButton';
import { NeumorphicCard } from './NeumorphicCard';
import { hapticFeedback } from '../utils/haptics';
import { updateChecker } from '../services/updateChecker';

export interface UpdateNotificationModalProps {
  visible: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes?: string;
  downloadUrl?: string;
  onClose: () => void;
  onSnooze?: () => void;
}

/**
 * Interactive Frosted-Glass Neumorphic In-App Update Modal
 * Matches 2026 design constitution with layered shadows, specular highlights,
 * and direct GitHub release APK installation.
 */
export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  visible,
  currentVersion,
  latestVersion,
  releaseNotes,
  downloadUrl,
  onClose,
  onSnooze,
}) => {
  const { palette } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const handleDownload = async () => {
    hapticFeedback.success();
    await updateChecker.openDownloadUrl(downloadUrl);
  };

  const handleSnooze = async () => {
    hapticFeedback.light();
    await updateChecker.snooze(24);
    if (onSnooze) {
      onSnooze();
    } else {
      onClose();
    }
  };

  const handleDismiss = () => {
    hapticFeedback.light();
    onClose();
  };

  // Format notes lines
  const notesText = releaseNotes?.trim() || 'بهینه‌سازی‌های جامع هسته محلی Rust، ارتقای سرعت بارگذاری و رفع ایرادات جزئی.';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdropOverlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: palette.isDark
                ? 'rgba(15, 23, 42, 0.92)'
                : 'rgba(248, 250, 252, 0.94)',
              borderColor: palette.borderLuminous,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              shadowColor: palette.isDark ? '#000000' : '#4F46E5',
            },
          ]}
        >
          {/* Top Specular Border Light */}
          <View pointerEvents="none" style={styles.topSpecularLine} />

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.sparkleIconBadge, { backgroundColor: palette.primary + '18' }]}>
                <Icon name="sparkles" size={18} color={palette.primary} />
              </View>
              <View>
                <Text style={[styles.kickerText, { color: palette.primary }]}>
                  به‌روزرسانی رسمی
                </Text>
                <Text style={[styles.mainTitle, { color: palette.textPrimary }]}>
                  نسخه جدید دانش‌میت منتشر شد
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleDismiss}
              hitSlop={12}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: palette.surfaceInner },
                pressed && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="بستن پنجره به‌روزرسانی"
            >
              <Icon name="close" size={14} color={palette.textSecondary} />
            </Pressable>
          </View>

          {/* Version Comparison Pill */}
          <View
            style={[
              styles.versionPill,
              {
                backgroundColor: palette.isDark
                  ? 'rgba(30, 41, 59, 0.8)'
                  : 'rgba(241, 245, 249, 0.9)',
                borderColor: palette.borderLuminous,
              },
            ]}
          >
            <View style={styles.versionCol}>
              <Text style={[styles.versionLabel, { color: palette.textSecondary }]}>نسخه فعلی</Text>
              <Text style={[styles.versionValue, { color: palette.textPrimary }]}>v{currentVersion}</Text>
            </View>
            <View style={styles.arrowIconContainer}>
              <Text style={[styles.arrowIcon, { color: palette.primary }]}>←</Text>
            </View>
            <View style={styles.versionCol}>
              <Text style={[styles.versionLabel, { color: palette.primary }]}>نسخه جدید</Text>
              <Text style={[styles.versionValue, { color: palette.primary, fontWeight: '800' }]}>
                {latestVersion.startsWith('v') ? latestVersion : `v${latestVersion}`}
              </Text>
            </View>
          </View>

          {/* Changelog Card */}
          <View style={styles.changelogSection}>
            <Text style={[styles.changelogHeaderTitle, { color: palette.textPrimary }]}>
              تغییرات و قابلیت‌های این نگارش:
            </Text>

            <NeumorphicCard
              variant="concave"
              intensity="subtle"
              style={styles.notesCard}
            >
              <ScrollView
                style={styles.notesScrollView}
                contentContainerStyle={styles.notesScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.notesBodyText, { color: palette.textSecondary }]}>
                  {notesText}
                </Text>
              </ScrollView>
            </NeumorphicCard>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <NeumorphicButton
              title="دانلود و نصب مستقیم"
              variant="primary"
              size="lg"
              onPress={handleDownload}
              style={styles.downloadButton}
              hapticType="success"
              icon={
                <Text style={styles.buttonIcon}>↓</Text>
              }
            />

            <NeumorphicButton
              title="بعداً یادآوری کن (۲۴ ساعت)"
              variant="standard"
              size="md"
              onPress={handleSnooze}
              style={styles.snoozeButton}
              hapticType="light"
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
      } as any,
    }),
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  topSpecularLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sparkleIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sparkleIconText: {
    fontSize: 18,
  },
  kickerText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
    marginBottom: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  mainTitle: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  versionCol: {
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  arrowIconContainer: {
    paddingHorizontal: 12,
  },
  arrowIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  changelogSection: {
    marginBottom: 20,
  },
  changelogHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'right',
  },
  notesCard: {
    padding: 12,
    borderRadius: 14,
  },
  notesScrollView: {
    maxHeight: 140,
  },
  notesScrollContent: {
    paddingVertical: 4,
  },
  notesBodyText: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'right',
  },
  actionsContainer: {
    gap: 10,
  },
  downloadButton: {
    width: '100%',
  },
  snoozeButton: {
    width: '100%',
  },
  buttonIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});
