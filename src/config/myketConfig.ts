/**
 * Myket In-App Purchase Configuration & Metadata Definitions
 * Consumable developer-support purchases (No subscriptions, No premium locks).
 * 
 * IMPORTANT: In compliance with Myket rules, all authoritative purchase prices
 * MUST be queried dynamically from Myket via SkuDetails. No prices are hardcoded here.
 */

export type MyketSupportSku = 'support_10k' | 'support_30k' | 'support_50k';

export interface SupportProductMetadata {
  sku: MyketSupportSku;
  internalLabel: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
}

export const MYKET_CONFIG = {
  // Myket package identifier
  packageId: 'ir.mservices.market',
  // Consumable support tiers allowlist
  supportedSkus: ['support_10k', 'support_30k', 'support_50k'] as const,
} as const;

export const SUPPORT_PRODUCTS_METADATA: readonly SupportProductMetadata[] = [
  {
    sku: 'support_10k',
    internalLabel: 'حمایت ۱۰ هزار تومانی',
    title: 'یک فنجان چای داغ',
    description: 'حمایت داوطلبانه نمادین برای همراهی با توسعه دانش‌میت',
    icon: '☕',
  },
  {
    sku: 'support_30k',
    internalLabel: 'حمایت ۳۰ هزار تومانی',
    title: 'یک دفترچه یادداشت',
    description: 'حمایت ویژه از زیرساخت و به‌روزرسانی مداوم برنامه',
    icon: '📓',
    badge: 'پیشنهادی',
  },
  {
    sku: 'support_50k',
    internalLabel: 'حمایت ۵۰ هزار تومانی',
    title: 'یک کتابخانه پویا',
    description: 'حمایت طلایی برای پایداری و رشد امکانات پیشرفته دانش‌میت',
    icon: '🌟',
  },
];
