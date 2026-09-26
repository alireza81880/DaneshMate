import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LiquidBentoCard } from '../components/LiquidBentoCard';
import { NullSparkleLink } from '../components/NullSparkleLink';
import { ThemeCategory, ThemeId } from '../theme/colors';

export const SettingsScreen: React.FC = () => {
  const { themeId, setThemeId, palette, palettesByCategory } = useTheme();
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('Dark & Monochromatic');

  const categories: ThemeCategory[] = [
    'Dark & Monochromatic',
    'Premium High-Contrast',
    'Light Minimal',
    'Neumorphic',
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>تنظیمات و شخصی‌سازی تم</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          موتور پوسته ۱۲گانه Cyber-Luxe Glassmorphism & Liquid Bento 2026
        </Text>
      </View>

      {/* Category Segmented Control */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {categories.map((cat) => {
          const isSelected = activeCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.categoryTab,
                {
                  backgroundColor: isSelected ? palette.surfaceInner : palette.surfaceCard,
                  borderColor: isSelected ? palette.primary : palette.borderLuminous,
                  borderWidth: isSelected ? 1.5 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: isSelected ? palette.primary : palette.textSecondary,
                    fontWeight: isSelected ? '900' : '700',
                  },
                ]}
              >
                {cat === 'Dark & Monochromatic'
                  ? 'تاریک (Dark)'
                  : cat === 'Premium High-Contrast'
                  ? 'پرمیوم (Neon/Aurora)'
                  : cat === 'Light Minimal'
                  ? 'روشن (Minimal)'
                  : 'نئومورفیک (Neumorphic)'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Theme Presets List */}
      <View style={styles.themesList}>
        {(palettesByCategory[activeCategory] || []).map((p) => {
          const isCurrent = themeId === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => setThemeId(p.id as ThemeId)}
              style={[
                styles.themeItem,
                {
                  backgroundColor: p.surfaceCard,
                  borderColor: isCurrent ? p.primary : palette.borderLuminous,
                  borderWidth: isCurrent ? 2 : 1,
                },
              ]}
            >
              <View style={styles.themeInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.themePersianName, { color: p.textPrimary, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }]}>
                    '{p.id}'
                  </Text>
                  {isCurrent && (
                    <View style={[styles.activeTag, { backgroundColor: p.primary }]}>
                      <Text style={styles.activeTagText}>ACTIVE ✓</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.themeEngName, { color: p.textSecondary }]}>
                  {p.category} • {p.background}
                </Text>
              </View>

              {/* Color Swatch Preview */}
              <View style={styles.swatchGroup}>
                <View style={[styles.swatch, { backgroundColor: p.background, borderColor: p.borderLuminous }]} />
                <View style={[styles.swatch, { backgroundColor: p.surfaceInner, borderColor: p.borderLuminous }]} />
                <View style={[styles.swatch, { backgroundColor: p.primary, borderColor: p.primary }]} />
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Cyber-Luxe Glass Specs Bento Card */}
      <LiquidBentoCard style={styles.infoCard} borderRadius={24}>
        <View style={styles.cardHeader}>
          {Platform.OS === 'web' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={palette.primary}>
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          ) : (
            <Text style={[styles.cardIcon, { color: palette.primary }]}>✦</Text>
          )}
          <Text style={[styles.infoTitle, { color: palette.textPrimary }]}>
            معماری سایبر-لوکس و شیشه‌ای (Cyber-Luxe Glassmorphism)
          </Text>
        </View>
        <Text style={[styles.infoDesc, { color: palette.textSecondary }]}>
          پایه گرافیت ۶۰٪ با بلور ۲۴ پیکسل مایع، بوردر ۱ پیکسلی لومینوس درخشان و هایلایت درونی لبه بالایی بدون هیچگونه افت شفافیت در صفحات مختلف.
        </Text>
      </LiquidBentoCard>

      {/* Footer Branding */}
      <NullSparkleLink />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  categoryRow: {
    gap: 8,
    paddingBottom: 16,
  },
  categoryTab: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 12,
  },
  themesList: {
    gap: 12,
    marginBottom: 20,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      } as any,
    }),
  },
  themeInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themePersianName: {
    fontSize: 15,
    fontWeight: '900',
  },
  activeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  themeEngName: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  swatchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  infoCard: {
    padding: 18,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 18,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  infoDesc: {
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'right',
  },
});
