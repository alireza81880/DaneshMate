import { Capacitor, registerPlugin, PluginListenerHandle } from '@capacitor/core';
import {
  MYKET_CONFIG,
  SUPPORT_PRODUCTS_METADATA,
  SupportProductMetadata,
  MyketSupportSku,
} from '../config/myketConfig';

export interface MyketBillingAvailability {
  available: boolean;
  isMyketInstalled: boolean;
  isNative: boolean;
  isSetupDone?: boolean;
}

export interface SupportProductDetail {
  sku: MyketSupportSku;
  internalLabel: string;
  title: string;
  price: string; // Authoritative price directly from Myket SkuDetails.getPrice()
  description: string;
  icon: string;
  badge?: string;
  type: string;
}

export interface PurchaseSuccessResult {
  success: boolean;
  sku: MyketSupportSku;
  orderId: string;
  purchaseTime: number;
  purchaseToken: string;
  developerPayload: string;
  recovered?: boolean;
}

export interface NativeSkuProduct {
  sku: string;
  title: string;
  price: string;
  description: string;
  type: string;
}

interface MyketBillingPluginInterface {
  isAvailable(): Promise<{ available: boolean; isMyketInstalled: boolean; isSetupDone?: boolean }>;
  init(): Promise<{ initialized: boolean; isMyketInstalled: boolean; message?: string }>;
  dispose(): Promise<{ disposed: boolean }>;
  queryProducts(options?: { skus?: string[] }): Promise<{ products: NativeSkuProduct[] }>;
  purchase(options: { sku: string; developerPayload?: string }): Promise<{
    success: boolean;
    sku: string;
    orderId?: string;
    purchaseTime?: number;
    purchaseToken?: string;
    developerPayload?: string;
    recovered?: boolean;
  }>;
  refreshPurchases(): Promise<{ consumedCount: number }>;
  consumePendingPurchases(): Promise<{ consumedCount: number }>;
  addListener(
    eventName: 'onPurchaseRecovered',
    listenerFunc: (info: { sku: string; orderId?: string; purchaseTime?: number; recovered: boolean }) => void
  ): Promise<PluginListenerHandle>;
}

const NativeMyketBilling = registerPlugin<MyketBillingPluginInterface>('MyketBilling');

class MyketBillingService {
  private isInitialized = false;
  private pendingPayloadBySku: Map<string, string> = new Map();

  /**
   * Check if native Myket store and billing plugin are available.
   */
  public async isAvailable(): Promise<MyketBillingAvailability> {
    const isNative = Capacitor.isNativePlatform();
    if (!isNative) {
      return {
        available: false,
        isMyketInstalled: false,
        isNative: false,
        isSetupDone: false,
      };
    }

    try {
      const res = await NativeMyketBilling.isAvailable();
      return {
        available: Boolean(res.available),
        isMyketInstalled: Boolean(res.isMyketInstalled),
        isNative: true,
        isSetupDone: Boolean(res.isSetupDone),
      };
    } catch (err) {
      console.warn('[MyketBillingService] Error checking availability:', err);
      return {
        available: false,
        isMyketInstalled: false,
        isNative: true,
        isSetupDone: false,
      };
    }
  }

  /**
   * Initialize native Myket Billing Client connection.
   */
  public async initialize(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const res = await NativeMyketBilling.init();
      this.isInitialized = Boolean(res.initialized);
      return this.isInitialized;
    } catch (err: any) {
      this.isInitialized = false;
      const code = err?.code || 'INIT_FAILED';
      const msg = err?.message || 'خطا در برقراری ارتباط با مایکت.';
      throw new Error(`[${code}] ${msg}`);
    }
  }

  /**
   * Dispose native Myket billing client and cleanup resources.
   */
  public async dispose(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      this.isInitialized = false;
      return;
    }
    try {
      await NativeMyketBilling.dispose();
    } catch (ignored) {}
    this.isInitialized = false;
    this.pendingPayloadBySku.clear();
  }

  /**
   * Query product details and authoritative prices strictly from Myket.
   * If Myket is unavailable, throws an error. NO prices are fabricated or hardcoded.
   */
  public async getProducts(): Promise<SupportProductDetail[]> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('MYKET_UNAVAILABLE: استعلام قیمت‌ها نیازمند اجرای برنامه روی دستگاه اندروید و دسترسی به مایکت است.');
    }

    if (!this.isInitialized) {
      const ok = await this.initialize();
      if (!ok) {
        throw new Error('BILLING_NOT_INITIALIZED: راه‌اندازی سرویس مایکت ناموفق بود.');
      }
    }

    const res = await NativeMyketBilling.queryProducts({
      skus: [...MYKET_CONFIG.supportedSkus],
    });

    if (!res || !res.products || res.products.length === 0) {
      throw new Error('QUERY_EMPTY: اطلاعات قیمت هیچ‌یک از بسته‌های حمایت مالی از سرور مایکت دریافت نشد.');
    }

    // Map each remote product with local display metadata.
    // Price MUST come authoritative from Myket SkuDetails.
    const items: SupportProductDetail[] = [];

    for (const remote of res.products) {
      const meta = SUPPORT_PRODUCTS_METADATA.find((m) => m.sku === remote.sku);
      if (meta) {
        items.push({
          sku: meta.sku,
          internalLabel: meta.internalLabel,
          title: remote.title || meta.title,
          price: remote.price, // STRICTLY from Myket
          description: remote.description || meta.description,
          icon: meta.icon,
          badge: meta.badge,
          type: remote.type || 'inapp',
        });
      }
    }

    if (items.length === 0) {
      throw new Error('NO_MATCHING_PRODUCTS: شناسه‌های بازگشتی از مایکت با لیست حمایت‌های برنامه مطابقت نداشت.');
    }

    return items;
  }

  /**
   * Securely generates a nonce token for verifying developer payload.
   */
  private generatePayloadNonce(sku: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `dm_p_${sku}_${timestamp}_${randomStr}`;
  }

  /**
   * Purchase a voluntary developer-support product through Myket In-App Billing.
   *
   * Flow:
   * 1. Validate SKU against allowlist.
   * 2. Generate unique local payload nonce.
   * 3. Invoke native launchPurchaseFlow (which persists payload before launching).
   * 4. Verify purchase result & SKU.
   * 5. Verify returned developerPayload matches local token.
   * 6. Consumes the product on native side.
   * 7. Returns success confirmation.
   */
  public async purchase(sku: MyketSupportSku): Promise<PurchaseSuccessResult> {
    if (!MYKET_CONFIG.supportedSkus.includes(sku)) {
      throw new Error(`INVALID_SKU: شناسه محصول «${sku}» در لیست محصولات مجاز حمایت تعریف نشده است.`);
    }

    if (!Capacitor.isNativePlatform()) {
      throw new Error('PLATFORM_NOT_SUPPORTED: پرداخت درون‌برنامه‌ای مایکت فقط در محیط اندروید با نرم‌افزار مایکت فعال است.');
    }

    if (!this.isInitialized) {
      const initSuccess = await this.initialize();
      if (!initSuccess) {
        throw new Error('BILLING_NOT_INITIALIZED: سرویس پرداخت مایکت آماده نیست. لطفاً از اتصال اینترنت و نصب بودن مایکت اطمینان حاصل فرمایید.');
      }
    }

    const payloadNonce = this.generatePayloadNonce(sku);
    this.pendingPayloadBySku.set(sku, payloadNonce);

    try {
      const nativeResult = await NativeMyketBilling.purchase({
        sku,
        developerPayload: payloadNonce,
      });

      if (!nativeResult || !nativeResult.success) {
        throw new Error('PURCHASE_FAILED: تراکنش خرید از سوی مایکت تایید نشد.');
      }

      if (nativeResult.sku !== sku) {
        throw new Error(`SECURITY_MISMATCH: محصول بازگشتی (${nativeResult.sku}) با درخواست (${sku}) مطابقت ندارد.`);
      }

      if (!nativeResult.recovered && nativeResult.developerPayload) {
        const expected = this.pendingPayloadBySku.get(sku);
        if (expected && nativeResult.developerPayload !== expected) {
          throw new Error('PAYLOAD_MISMATCH: اعتبارسنجی توکن پرداخت مطابقت نداشت.');
        }
      }

      this.pendingPayloadBySku.delete(sku);

      return {
        success: true,
        sku: nativeResult.sku as MyketSupportSku,
        orderId: nativeResult.orderId || '',
        purchaseTime: nativeResult.purchaseTime || Date.now(),
        purchaseToken: nativeResult.purchaseToken || '',
        developerPayload: nativeResult.developerPayload || payloadNonce,
        recovered: nativeResult.recovered,
      };
    } catch (err: any) {
      this.pendingPayloadBySku.delete(sku);
      const errMsg = err?.message || String(err);
      const code = err?.code;

      if (code === 'USER_CANCELED' || errMsg.includes('USER_CANCELED') || errMsg.includes('لغو')) {
        throw new Error('USER_CANCELED: فرآیند خرید توسط شما لغو گردید.');
      }

      if (code === 'MYKET_NOT_INSTALLED' || errMsg.includes('MYKET_NOT_INSTALLED')) {
        throw new Error('MYKET_NOT_INSTALLED: برنامه مایکت روی دستگاه شما یافت نشد. لطفاً جهت پرداخت ابتدا مایکت را نصب فرمایید.');
      }

      throw new Error(errMsg || 'PURCHASE_ERROR: خطا در انجام پرداخت درون‌برنامه‌ای مایکت.');
    }
  }

  /**
   * Refresh and consume any orphaned pending consumable purchases.
   */
  public async refreshPurchases(): Promise<number> {
    if (!Capacitor.isNativePlatform()) {
      return 0;
    }
    try {
      const res = await NativeMyketBilling.refreshPurchases();
      return res?.consumedCount || 0;
    } catch (err) {
      console.warn('[MyketBillingService] Error refreshing pending purchases:', err);
      return 0;
    }
  }

  /**
   * Alias for refreshPurchases to support existing consumers.
   */
  public async consumePendingPurchases(): Promise<number> {
    return this.refreshPurchases();
  }

  /**
   * Listen for recovered purchases consumed in the background.
   */
  public async onPurchaseRecovered(
    callback: (info: { sku: string; orderId?: string; purchaseTime?: number; recovered: boolean }) => void
  ): Promise<PluginListenerHandle | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }
    return NativeMyketBilling.addListener('onPurchaseRecovered', callback);
  }
}

export const myketBillingService = new MyketBillingService();
