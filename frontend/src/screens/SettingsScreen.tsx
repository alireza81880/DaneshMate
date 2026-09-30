import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from '../components/Icon';
import { FONT_FAMILIES } from '../theme/typography';
import { LiquidBentoCard } from '../components/LiquidBentoCard';
import { NullSparkleLink } from '../components/NullSparkleLink';
import { DonationBadge } from '../components/DonationBadge';
import { ThemeCategory, ThemeId } from '../theme/colors';
import { getRtlRow } from '../utils/rtl';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { themeId, setThemeId, palette, palettesByCategory } = useTheme();
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('Dark & Monochromatic');

  const categories: ThemeCategory[] = [
    'Dark & Monochromatic',
    'Premium High-Contrast',
    'Light Minimal',
    'Neumorphic',
  ];

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: 14,
          paddingBottom: Math.max(insets.bottom + 96, 120),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>تنظیمات و شخصی‌سازی تم</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          موتور پوسته ۱۲گانه Cyber-Luxe Glassmorphism & Liquid Bento 2026
        </Text>
      </View>

      {/* Category Segmented Control matching Web */}
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
                  backgroundColor: isSelected ? palette.primary : palette.surfaceInner,
                  borderColor: isSelected ? palette.primaryLight : palette.borderLuminous,
                  borderWidth: 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: isSelected ? '#FFFFFF' : palette.textSecondary,
                    fontFamily: isSelected ? FONT_FAMILIES.persian.bold : FONT_FAMILIES.persian.medium,
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
          <Icon name="sparkles" size={20} color={palette.primary} />
          <Text style={[styles.infoTitle, { color: palette.textPrimary }]}>
            معماری سایبر-لوکس و شیشه‌ای (Cyber-Luxe Glassmorphism)
          </Text>
        </View>
        <Text style={[styles.infoDesc, { color: palette.textSecondary }]}>
          پایه گرافیت ۶۰٪ با بلور ۲۴ پیکسل مایع، بوردر ۱ پیکسلی لومینوس درخشان و هایلایت درونی لبه بالایی بدون هیچگونه افت شفافیت در صفحات مختلف.
        </Text>
      </LiquidBentoCard>

      {/* Footer Support & Branding */}
      <DonationBadge style={{ marginTop: 16 }} />
      <NullSparkleLink style={{ marginTop: 4 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 18,
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: getRtlRow(),
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
    fontFamily: FONT_FAMILIES.persian.medium,
    fontSize: 12,
    writingDirection: 'rtl',
  },
  themesList: {
    gap: 12,
    marginBottom: 20,
  },
  themeItem: {
    flexDirection: getRtlRow(),
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
      android: {
        elevation: 3,
      },
    }),
  },
  themeInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  nameRow: {
    flexDirection: getRtlRow(),
    alignItems: 'center',
    gap: 8,
  },
  themePersianName: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 15,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  activeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeTagText: {
    fontFamily: FONT_FAMILIES.persian.bold,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  themeEngName: {
    fontFamily: FONT_FAMILIES.english.semiBold,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
    writingDirection: 'ltr',
  },
  swatchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 12,
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
    flexDirection: getRtlRow(),
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 18,
  },
  infoTitle: {
    fontFamily: FONT_FAMILIES.persian.bold,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  infoDesc: {
    fontFamily: FONT_FAMILIES.persian.regular,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
