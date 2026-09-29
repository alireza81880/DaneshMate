import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { rtlStyles } from '../utils/rtl';

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
              borderColor: palette.borderLuminous || palette.border,
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <Icon name="trash" size={24} color="#e11d48" />
          </View>

          <Text style={[styles.title, { color: palette.textPrimary }]}>حذف کلاس</Text>
          <Text style={[styles.desc, { color: palette.textSecondary }]}>
            آیا از حذف {className ? `کلاس «${className}»` : 'این کلاس'} از برنامه هفتگی خود اطمینان
            دارید؟
          </Text>

          <View style={[styles.actionsRow, rtlStyles.row]}>
            <Pressable
              onPress={onCancel}
              style={[
                styles.cancelButton,
                { backgroundColor: palette.surfaceInner, borderColor: palette.border },
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
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
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
      } as any,
    }),
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  desc: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 22,
    paddingHorizontal: 10,
  },
  actionsRow: {
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12.5,
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#e11d48',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
  },
  deleteText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#ffffff',
    writingDirection: 'rtl',
  },
});
