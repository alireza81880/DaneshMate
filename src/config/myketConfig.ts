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
  mainSubtitle: 'اگه دانشمیت تونسته تو مدیریت کلاس‌ها و برنامه‌ریزی‌ها بهت کمک کنه، با یه حمایت دلخواه بهم انرژی بده تا بتونم اپلیکیشن رو بدون تبلیغات نگه دارم و با سرعت بیشتری امکانات جدید بهش اضافه کنم.',
  compactSubtitle: 'اگه دانشمیت برات مفید بوده، با یه حمایت کوچیک کمکم کن ادامه‌ش بدم.',
  successTitle: 'دمت گرم! انرژی این قهوه رسید ☕❤️',
  successSubtitle: 'حمایتت به ادامه توسعه و بهتر شدن دانشمیت کمک میکنه.',
  successMicroCopy: 'امیدوارم نتیجه‌ش رو تو نسخه‌های بعدی ببینی ✨',
} as const;

export const SUPPORT_PRODUCTS_METADATA: readonly SupportProductMetadata[] = [
  {
    sku: 'support_coffee',
    title: '☕ یک قهوه برای انرژیِ امروز',
    description: 'یه حمایت کوچیک برای ادامه مسیر',
    icon: '☕',
  },
  {
    sku: 'support_treat',
    title: '🍩 قهوه و شیرینی برای آپدیت بعدی',
    description: 'برای ادامه توسعه و بهتر شدن دانشمیت',
    icon: '🍩',
    badge: 'پیشنهادی',
  },
  {
    sku: 'support_code',
    title: '🦉 یه شب‌بیداری برای توسعه فیچرهای جدید',
    description: 'برای اضافه کردن امکانات تازه به دانشمیت',
    icon: '🦉',
  },
];
