import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Info,
  ChevronUp,
} from 'lucide-react';
import { PaletteTheme } from '../../App';
import {
  myketBillingService,
  SupportProductDetail,
  PurchaseSuccessResult,
} from '../../services/myketBillingService';
import {
  MYKET_CONFIG,
  SUPPORT_PRODUCTS_METADATA,
  MyketSupportSku,
} from '../../config/myketConfig';

export interface MyketSupportCardProps {
  theme: PaletteTheme;
  variant?: 'full' | 'compact';
  className?: string;
}

type SupportUIStatus =
  | 'idle'
  | 'initializing'
  | 'loading-products'
  | 'ready'
  | 'purchasing'
  | 'success'
  | 'error';

export const MyketSupportCard: React.FC<MyketSupportCardProps> = React.memo(({
  theme,
  variant = 'full',
  className = '',
}) => {
  const isCompact = variant === 'compact';
  const [isExpanded, setIsExpanded] = useState<boolean>(!isCompact);
  const [status, setStatus] = useState<SupportUIStatus>('loading-products');
  const [isMyketInstalled, setIsMyketInstalled] = useState<boolean>(true);
  const [products, setProducts] = useState<SupportProductDetail[]>([]);
  const [selectedSku, setSelectedSku] = useState<MyketSupportSku>('support_treat');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelledMessage, setCancelledMessage] = useState<string | null>(null);
  const [recoveredNotice, setRecoveredNotice] = useState<string | null>(null);
  const [lastSuccessResult, setLastSuccessResult] = useState<PurchaseSuccessResult | null>(null);

  /**
   * Load availability and query products live from Myket
   */
  const loadMyketProducts = useCallback(async () => {
    setStatus('loading-products');
    setErrorMessage(null);
    setCancelledMessage(null);

    try {
      const avail = await myketBillingService.isAvailable();
      setIsMyketInstalled(avail.isMyketInstalled);

      if (!avail.available || !avail.isMyketInstalled) {
        setIsMyketInstalled(false);
        setStatus('idle');
        return;
      }

      setIsMyketInstalled(true);
      const items = await myketBillingService.getProducts();
      setProducts(items);
      setStatus('ready');
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err);

      if (rawMsg.includes('MYKET_NOT_INSTALLED') || rawMsg.includes('MYKET_UNAVAILABLE')) {
        setIsMyketInstalled(false);
        setStatus('idle');
      } else {
        setErrorMessage(mapErrorCodeToPersian(rawMsg));
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    loadMyketProducts();

    // Listen for background-recovered unconsumed purchases
    let unsubscribe: (() => void) | null = null;
    myketBillingService
      .onPurchaseRecovered((info) => {
        if (info && info.recovered) {
          setRecoveredNotice('یک خرید پیشین با موفقیت تایید و ثبت شد. ممنون از همراهیت! ☕❤️');
          setTimeout(() => setRecoveredNotice(null), 8000);
        }
      })
      .then((handle) => {
        if (handle) {
          unsubscribe = () => handle.remove();
        }
      })
      .catch(() => {});

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadMyketProducts]);

  /**
   * Toggle or expand in compact mode
   */
  const handleCompactExpand = useCallback(() => {
    setIsExpanded(true);
    if (products.length === 0 && status !== 'loading-products') {
      loadMyketProducts();
    }
  }, [products.length, status, loadMyketProducts]);

  /**
   * Execute purchase flow through Myket Billing
   */
  const handlePurchase = useCallback(async () => {
    if (status === 'purchasing' || status === 'loading-products') {
      return;
    }

    setStatus('purchasing');
    setErrorMessage(null);
    setCancelledMessage(null);

    try {
      const result = await myketBillingService.purchaseSupport(selectedSku);
      setLastSuccessResult(result);
      setStatus('success');
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err);

      const isCanceled =
        rawMsg.includes('USER_CANCELED') ||
        rawMsg.toLowerCase().includes('cancel') ||
        rawMsg.includes('لغو') ||
        rawMsg.includes('-1005');

      if (isCanceled) {
        setCancelledMessage('خرید لغو شد.');
        setErrorMessage(null);
        setStatus('ready');
        setTimeout(() => setCancelledMessage((prev) => (prev === 'خرید لغو شد.' ? null : prev)), 3500);
      } else if (rawMsg.includes('MYKET_NOT_INSTALLED')) {
        setIsMyketInstalled(false);
        setStatus('idle');
      } else {
        setErrorMessage(mapErrorCodeToPersian(rawMsg));
        setStatus('error');
      }
    }
  }, [selectedSku, status]);

  /**
   * Reset success state so user can support again if desired
   */
  const handleResetSuccess = useCallback(() => {
    setStatus('ready');
    setLastSuccessResult(null);
    setErrorMessage(null);
    setCancelledMessage(null);
  }, []);

  return (
    <div
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderLuminous,
      }}
      className={`liquid-glass rounded-3xl p-5 sm:p-6 border select-none transition-all ${className}`}
      dir="rtl"
    >
      {/* COMPACT COLLAPSED FOOTER MODE */}
      {isCompact && !isExpanded ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              style={{
                color: theme.primary,
                borderColor: theme.borderLuminous,
                backgroundColor: theme.innerBg,
                boxShadow: `0 0 16px ${theme.glowColor}25`,
              }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 shadow-xs"
            >
              <Coffee className="w-5 h-5 opacity-90" />
            </div>
            <div>
              <h4 style={{ color: theme.textPrimary }} className="text-sm font-black tracking-tight flex items-center gap-1.5">
                <span>{MYKET_CONFIG.mainTitle}</span>
              </h4>
              <p style={{ color: theme.textSecondary }} className="text-xs font-medium mt-0.5 leading-snug">
                {MYKET_CONFIG.compactSubtitle}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleCompactExpand}
              aria-label="نمایش گزینه‌های حمایت با مایکت"
              style={{
                backgroundColor: theme.primary,
                color: '#FFFFFF',
                boxShadow: `0 3px 12px ${theme.glowColor}30`,
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
            >
              <Coffee className="w-4 h-4" />
              <span>☕ حمایت با مایکت</span>
            </button>
          </div>
        </div>
      ) : (
        /* EXPANDED / FULL SUPPORT MODE */
        <div>
          {/* Header */}
          <div
            style={{ borderColor: theme.borderLuminous }}
            className="flex items-center justify-between pb-4 mb-4 border-b"
          >
            <div className="flex-1 pl-2">
              <div className="flex items-center gap-2">
                <h3 style={{ color: theme.textPrimary }} className="text-base sm:text-lg font-black tracking-tight">
                  {MYKET_CONFIG.mainTitle}
                </h3>
                <span
                  style={{
                    color: theme.primary,
                    backgroundColor: theme.innerBg,
                    borderColor: theme.borderLuminous,
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs"
                >
                  مایکت
                </span>
              </div>
              <p style={{ color: theme.textSecondary }} className="text-xs font-semibold mt-1 leading-relaxed max-w-2xl">
                {MYKET_CONFIG.mainSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={loadMyketProducts}
                disabled={status === 'loading-products' || status === 'purchasing'}
                title="بررسی مجدد و به‌روزرسانی قیمت‌ها"
                aria-label="بررسی مجدد اتصال به مایکت"
                style={{
                  color: theme.textSecondary,
                  backgroundColor: theme.innerBg,
                  borderColor: theme.borderLuminous,
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center border hover:opacity-80 active:scale-95 transition-all disabled:opacity-40"
              >
                <RefreshCw
                  className={`w-4 h-4 ${status === 'loading-products' ? 'animate-spin' : ''}`}
                />
              </button>

              {isCompact && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  title="بستن بخش حمایت"
                  aria-label="بستن گزینه‌های حمایت"
                  style={{
                    color: theme.textSecondary,
                    backgroundColor: theme.innerBg,
                    borderColor: theme.borderLuminous,
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border hover:opacity-80 active:scale-95 transition-all"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}

              {!isCompact && (
                <div
                  style={{
                    color: theme.primary,
                    borderColor: theme.borderLuminous,
                    backgroundColor: theme.innerBg,
                    boxShadow: `0 0 16px ${theme.glowColor}25`,
                  }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs"
                >
                  <Heart className="w-5 h-5 fill-current opacity-90" />
                </div>
              )}
            </div>
          </div>

          {/* Recovered background purchase banner */}
          {recoveredNotice && (
            <div
              style={{
                backgroundColor: `${theme.primary}15`,
                borderColor: theme.primary,
                color: theme.textPrimary,
              }}
              className="mb-4 p-3 rounded-2xl border text-xs font-medium flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: theme.primary }} />
              <span>{recoveredNotice}</span>
            </div>
          )}

          {/* Success State with Soft Scale-in & Gentle Glow */}
          {status === 'success' ? (
            <div
              style={{
                backgroundColor: theme.innerBg,
                borderColor: theme.primary,
                boxShadow: `0 0 28px ${theme.glowColor}30`,
              }}
              className="p-6 rounded-2xl border text-center space-y-3.5 my-2 transition-all animate-in fade-in zoom-in-95 duration-300"
            >
              <div
                style={{
                  backgroundColor: `${theme.primary}20`,
                  color: theme.primary,
                  boxShadow: `0 0 24px ${theme.glowColor}35`,
                }}
                className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl shadow-inner transition-transform"
              >
                ☕❤️
              </div>
              <div className="space-y-1">
                <h4 style={{ color: theme.textPrimary }} className="text-base font-black">
                  {MYKET_CONFIG.successTitle}
                </h4>
                <p style={{ color: theme.textSecondary }} className="text-xs font-semibold leading-relaxed max-w-md mx-auto">
                  {MYKET_CONFIG.successSubtitle}
                </p>
                <p
                  style={{ color: theme.secondaryAccent || theme.primaryLight || theme.primary }}
                  className="text-[11px] font-bold mt-1"
                >
                  {MYKET_CONFIG.successMicroCopy}
                </p>
              </div>
              {lastSuccessResult?.orderId && (
                <p style={{ color: theme.textMuted }} className="text-[11px] font-mono select-text" dir="ltr">
                  کد سفارش: {lastSuccessResult.orderId}
                </p>
              )}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResetSuccess}
                  style={{
                    color: theme.primary,
                    borderColor: theme.borderLuminous,
                    backgroundColor: theme.cardBg,
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold border hover:opacity-85 active:scale-95 transition-all cursor-pointer"
                >
                  حمایت دوباره
                </button>
              </div>
            </div>
          ) : !isMyketInstalled ? (
            /* Myket Not Installed State */
            <div
              style={{
                backgroundColor: theme.innerBg,
                borderColor: theme.borderLuminous,
              }}
              className="p-5 rounded-2xl border space-y-3.5 my-2"
            >
              <div className="flex items-start gap-3">
                <div
                  style={{
                    color: theme.textSecondary,
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderLuminous,
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 mt-0.5"
                >
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 style={{ color: theme.textPrimary }} className="text-sm font-bold">
                    عدم شناسایی برنامه مایکت
                  </h4>
                  <p style={{ color: theme.textSecondary }} className="text-xs font-medium mt-1 leading-relaxed">
                    برای حمایت از توسعه دانشمیت، مایکت باید روی دستگاه نصب باشد.
                  </p>
                </div>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={loadMyketProducts}
                  style={{
                    backgroundColor: theme.primary,
                    color: '#FFFFFF',
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all shadow-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>بررسی مجدد</span>
                </button>
              </div>
            </div>
          ) : (
            /* Ready / Selection State */
            <div className="space-y-4">
              {/* Subtle error alert */}
              {errorMessage && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    color: theme.textPrimary,
                  }}
                  className="p-3 rounded-2xl border text-xs font-medium flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              {/* Subtle cancelled alert (calm neutral styling) */}
              {cancelledMessage && (
                <div
                  style={{
                    backgroundColor: theme.innerBg,
                    borderColor: theme.borderLuminous,
                    color: theme.textSecondary,
                  }}
                  className="p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2"
                >
                  <Info className="w-4 h-4 shrink-0" style={{ color: theme.primary }} />
                  <span>{cancelledMessage}</span>
                </div>
              )}

              {/* 3 Support Product Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SUPPORT_PRODUCTS_METADATA.map((meta) => {
                  const remote = products.find((p) => p.sku === meta.sku);
                  const isSelected = selectedSku === meta.sku;
                  const isRecommended = meta.sku === 'support_treat';
                  const priceText =
                    status === 'loading-products'
                      ? 'در حال دریافت قیمت...'
                      : remote?.price || 'در حال استعلام...';

                  return (
                    <button
                      key={meta.sku}
                      type="button"
                      onClick={() => {
                        setSelectedSku(meta.sku);
                        setErrorMessage(null);
                        setCancelledMessage(null);
                      }}
                      aria-pressed={isSelected}
                      aria-label={`${meta.title}، ${priceText}`}
                      style={{
                        backgroundColor: isSelected
                          ? `${theme.primary}15`
                          : isRecommended
                          ? `${theme.secondaryAccent || theme.primary}0a`
                          : theme.innerBg,
                        borderColor: isSelected
                          ? theme.primary
                          : isRecommended
                          ? `${theme.secondaryAccent || theme.primary}50`
                          : theme.borderLuminous,
                        boxShadow: isSelected
                          ? `0 0 16px ${theme.glowColor}25`
                          : isRecommended
                          ? `0 0 10px ${(theme.secondaryAccent || theme.glowColor)}15`
                          : 'none',
                      }}
                      className="relative p-4 rounded-2xl border text-right transition-all flex flex-col justify-between group hover:border-opacity-100 active:scale-98 min-h-[115px] cursor-pointer"
                    >
                      {/* Recommended badge with theme-compatible accent */}
                      {meta.badge && (
                        <span
                          style={{
                            backgroundColor: theme.secondaryAccent || theme.primary,
                            color: '#FFFFFF',
                            boxShadow: `0 2px 8px ${theme.glowColor}35`,
                          }}
                          className="absolute -top-2 left-3 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs tracking-wide"
                        >
                          {meta.badge}
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xl select-none" role="img" aria-hidden="true">
                            {meta.icon}
                          </span>
                          <div
                            style={{
                              borderColor: isSelected ? theme.primary : theme.borderLuminous,
                              backgroundColor: isSelected ? theme.primary : 'transparent',
                            }}
                            className="w-4 h-4 rounded-full border flex items-center justify-center transition-all"
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>

                        <div className="mt-2">
                          <h4 style={{ color: theme.textPrimary }} className="text-xs font-bold leading-snug">
                            {meta.title}
                          </h4>
                          <p
                            style={{ color: theme.textMuted }}
                            className="text-[11px] font-medium mt-1 leading-snug line-clamp-2"
                          >
                            {meta.description}
                          </p>
                        </div>
                      </div>

                      {/* Real live price returned exclusively by Myket */}
                      <div className="mt-3 pt-2 border-t border-dashed" style={{ borderColor: theme.borderLuminous }}>
                        <span
                          style={{
                            color: isSelected ? theme.primary : theme.textPrimary,
                          }}
                          className={`text-xs font-black tracking-tight ${
                            status === 'loading-products' ? 'animate-pulse opacity-75' : ''
                          }`}
                        >
                          {priceText}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePurchase}
                  disabled={status === 'purchasing' || status === 'loading-products' || !isMyketInstalled}
                  style={{
                    backgroundColor: theme.primary,
                    color: '#FFFFFF',
                    boxShadow: `0 4px 16px ${theme.glowColor}30`,
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
                >
                  {status === 'purchasing' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال اتصال به مایکت...</span>
                    </>
                  ) : status === 'loading-products' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال دریافت قیمت...</span>
                    </>
                  ) : (
                    <>
                      <Coffee className="w-4 h-4" />
                      <span>☕ حمایت با مایکت</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Maps Myket error codes / English errors to polite Persian explanations
 */
function mapErrorCodeToPersian(rawError: string): string {
  if (!rawError) return 'خطای ناشناخته در انجام عملیات پرداخت.';

  if (
    rawError.includes('USER_CANCELED') ||
    rawError.toLowerCase().includes('cancel') ||
    rawError.includes('لغو') ||
    rawError.includes('-1005')
  ) {
    return 'خرید لغو شد.';
  }
  if (rawError.includes('MYKET_NOT_INSTALLED')) {
    return 'برای حمایت از توسعه دانشمیت، مایکت باید روی دستگاه نصب باشد.';
  }
  if (rawError.includes('BILLING_NOT_INITIALIZED')) {
    return 'سرویس پرداخت مایکت در حال حاضر آماده نیست. لطفاً مجدداً بررسی کنید.';
  }
  if (rawError.includes('PAYLOAD_MISMATCH')) {
    return 'اعتبارسنجی امنیتی تراکنش ناموفق بود. مبلغی کسر نگردید.';
  }
  if (rawError.includes('CONSUME_FAILED')) {
    return 'تراکنش در مایکت تایید شد اما ثبت مصرف با تاخیر مواجه شد. در اجرای بعدی برنامه آزاد خواهد شد.';
  }
  if (rawError.includes('PURCHASE_IN_PROGRESS')) {
    return 'یک تراکنش پرداخت در حال پردازش است. لطفاً شکیبا باشید.';
  }
  if (rawError.includes('BILLING_BUSY')) {
    return 'سرویس پرداخت مایکت مشغول است. لطفاً لحظاتی دیگر تلاش کنید.';
  }
  if (rawError.includes('INVALID_SKU') || rawError.includes('SKU_NOT_FOUND')) {
    return 'بسته حمایت مالی انتخاب‌شده معتبر نیست.';
  }
  if (rawError.includes('QUERY_EMPTY') || rawError.includes('NO_PRODUCTS_FOUND')) {
    return 'دریافت مشخصات بسته‌ها از مایکت ممکن نشد. لطفاً از اتصال اینترنت اطمینان حاصل فرمایید.';
  }

  const sanitized = rawError.replace(/\[.*?\]/g, '').replace(/^[A-Z_]+:\s*/, '').trim();
  return sanitized || 'خطا در برقراری ارتباط با مایکت.';
}
