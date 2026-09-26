import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, SafeAreaView, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ThemeCategory, ThemeId } from '../theme/colors';
import { NeumorphicButton } from './NeumorphicButton';
import { DonationBadge } from './DonationBadge';
import { NullSparkleLink } from './NullSparkleLink';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: ThemeCategory[] = ['Light', 'Dark', 'Premium'];

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { themeId, setThemeId, palette, palettesByCategory } = useTheme();
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('Light');

  const currentPalettes = palettesByCategory[activeCategory] || [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.textPrimary }]}>
              موتور پوسته پیشرفته ۲۰۲۶ DaneshMate
            </Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              ۱۵ پالت رنگی مدرن نئومورفیسم با سایه‌پردازی دوگانه عمقی (Dual-Shadow)
            </Text>
          </View>

          {/* Category Tabs: Light, Dark, Premium */}
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[
                    styles.catBtn,
                    {
                      backgroundColor: isSelected ? palette.surfaceInner : palette.surfaceCard,
                      borderColor: isSelected ? palette.primary : palette.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catBtnText,
                      {
                        color: isSelected ? palette.primary : palette.textSecondary,
                        fontWeight: isSelected ? '900' : '700',
                      },
                    ]}
                  >
                    {cat === 'Light' ? 'روشن (Light)' : cat === 'Dark' ? 'تاریک (Dark)' : 'پرمیوم (Premium)'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Palettes List for the selected category */}
          <View style={styles.palettesList}>
            {currentPalettes.map((p) => {
              const isSelected = themeId === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setThemeId(p.id)}
                  style={[
                    styles.paletteCard,
                    {
                      backgroundColor: p.surfaceCard,
                      borderColor: isSelected ? p.primary : p.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.paletteRow}>
                    <View style={styles.swatchGroup}>
                      <View style={[styles.colorCircle, { backgroundColor: p.background, borderColor: p.shadowDark }]} />
                      <View style={[styles.colorCircle, { backgroundColor: p.primary, marginLeft: -10 }]} />
                    </View>

                    <View style={styles.paletteTextGroup}>
                      <Text style={[styles.paletteName, { color: p.textPrimary }]}>{p.persianName}</Text>
                      <Text style={[styles.paletteEnName, { color: p.textSecondary }]}>
                        {p.name} • {p.background}
                      </Text>
                    </View>

                    <View style={[styles.radioIndicator, isSelected && { backgroundColor: p.primary }]}>
                      {isSelected && <Text style={styles.radioCheck}>✓</Text>}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <NeumorphicButton title="اعمال و بستن" variant="primary" size="md" onPress={onClose} />
            <DonationBadge compact style={{ marginTop: 14 }} />
            <NullSparkleLink style={{ marginTop: 2, marginBottom: 8 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 22, paddingBottom: 40 },
  header: { marginBottom: 18, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 11.5, textAlign: 'center', lineHeight: 18 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  catBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  catBtnText: { fontSize: 11.5 },
  palettesList: { gap: 10, marginBottom: 20 },
  paletteCard: { borderRadius: 18, padding: 14 },
  paletteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  swatchGroup: { flexDirection: 'row', alignItems: 'center' },
  colorCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  paletteTextGroup: { flex: 1, marginHorizontal: 12 },
  paletteName: { fontSize: 13.5, fontWeight: '800', textAlign: 'right' },
  paletteEnName: { fontSize: 10.5, marginTop: 2, textAlign: 'right' },
  radioIndicator: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  radioCheck: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  footer: { marginTop: 4 },
});
