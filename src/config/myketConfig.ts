/**
 * Myket In-App Purchase Configuration & Metadata Definitions
 * Consumable developer-support purchases (No subscriptions, No premium locks).
 * 
 * IMPORTANT: Neutral semantic SKU names (support_coffee, support_treat, support_code).
 * All authoritative prices MUST be queried dynamically from Myket via SkuDetails.
 * Absolutely NO hardcoded prices.
 */

export type MyketSupportSku = 'support_coffee' | 'support_treat' | 'support_code';

export interface SupportProductMetadata {
  sku: MyketSupportSku;
  title: string;
  description: string;
  icon: string;
  badge?: string;
}

export const MYKET_CONFIG = {
  // Myket package identifier
  packageId: 'ir.mservices.market',
  // Consumable support tiers allowlist (Strictly neutral semantic IDs)
  supportedSkus: ['support_coffee', 'support_treat', 'support_code'] as const,
  // Main copy
  mainTitle: '☕ یه قهوه مهمونم میکنی؟',
  mainSubtitle: 'دانشمیت به‌صورت مستقل توسعه پیدا میکنه. اگه برنامه برات مفید بوده، با یه قهوه کوچیک کمک کن ادامه‌ش بدم ❤️',
  compactSubtitle: 'اگه دانشمیت برات مفید بوده، با یه حمایت کوچیک کمکم کن ادامه‌ش بدم.',
} as const;

export const SUPPORT_PRODUCTS_METADATA: readonly SupportProductMetadata[] = [
  {
    sku: 'support_coffee',
    title: '☕ یک قهوه برای توسعه‌دهنده',
    description: 'حمایت داوطلبانه برای شارژ انرژی و ادامه توسعه',
    icon: '☕',
  },
  {
    sku: 'support_treat',
    title: '🍪 قهوه و شیرینی برای ادامه مسیر',
    description: 'حمایت ویژه برای استمرار و ارتقای مداوم برنامه',
    icon: '🍪',
    badge: 'پیشنهادی',
  },
  {
    sku: 'support_code',
    title: '⚡ یه شب کدنویسی بیشتر',
    description: 'حمایت پرانرژی برای افزودن قابلیت‌های جدید و پیشرفته',
    icon: '⚡',
  },
];
