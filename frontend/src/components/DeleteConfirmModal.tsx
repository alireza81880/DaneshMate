import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { NeumorphicButton } from './NeumorphicButton';

interface DeleteConfirmModalProps {
  visible: boolean;
  className?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  className,
  onConfirm,
  onCancel,
}) => {
  const { palette } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: palette.surfaceCard,
              borderColor: palette.border,
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🗑️</Text>
          </View>

          <Text style={[styles.title, { color: palette.textPrimary }]}>حذف کلاس</Text>
          <Text style={[styles.desc, { color: palette.textSecondary }]}>
            آیا از حذف {className ? `کلاس «${className}»` : 'این کلاس'} از برنامه هفتگی خود اطمینان
            دارید؟
          </Text>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={onCancel}
              style={[
                styles.cancelButton,
                { backgroundColor: palette.surfaceInner },
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.cancelText, { color: palette.textSecondary }]}>انصراف</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={styles.deleteButton}
              accessibilityRole="button"
            >
              <Text style={styles.deleteText}>حذف نهایی</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '10px 10px 30px rgba(0,0,0,0.2), -10px -10px 30px rgba(255,255,255,0.8)',
      } as any,
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '3px 3px 8px rgba(225, 29, 72, 0.35)',
      } as any,
    }),
  },
  deleteText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
  },
});
