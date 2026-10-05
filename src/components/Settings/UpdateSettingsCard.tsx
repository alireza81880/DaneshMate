import React, { useState, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ArrowUpCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { PaletteTheme } from '../../App';
import { APP_VERSION, APP_VERSION_CODE, DISTRIBUTION_CHANNEL } from '../../config/version';
import { MYKET_CONFIG, MYKET_APP_URL } from '../../config/myketConfig';
import { checkAppUpdate, UpdateCheckResult, openMyketAppPage } from '../../services/updateService';

export interface UpdateSettingsCardProps {
  theme: PaletteTheme;
}

type UpdateUIStatus = 'idle' | 'checking' | 'up-to-date' | 'update-available' | 'error';

export const UpdateSettingsCard: React.FC<UpdateSettingsCardProps> = React.memo(({ theme }) => {
  const [status, setStatus] = useState<UpdateUIStatus>('idle');
  const [checkResult, setCheckResult] = useState<UpdateCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);

  const handleCheckUpdate = useCallback(async () => {
    setStatus('checking');
    setErrorMessage(null);

    try {
      const result = await checkAppUpdate(APP_VERSION);
      setCheckResult(result);
      const now = new Date();
      setLastCheckedTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );

      if (result.isUpdateAvailable) {
        setStatus('update-available');
      } else {
        setStatus('up-to-date');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای ناشناخته در استعلام نسخه.';
      setErrorMessage(msg);
      setStatus('error');
    }
  }, []);

  const handleOpenMyketUpdate = useCallback(() => {
    openMyketAppPage();
  }, []);

  const handleOpenGitHubRelease = useCallback(() => {
    const url = checkResult?.release?.htmlUrl || 'https://github.com/alireza81880/daneshmate/releases';
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [checkResult]);

  const isMyketChannel = DISTRIBUTION_CHANNEL === 'myket';

  return (
    <div
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderLuminous,
      }}
      className="liquid-glass rounded-3xl p-6 border select-none transition-all"
    >
      {/* Header */}
      <div
        style={{ borderColor: theme.borderLuminous }}
        className="flex items-center justify-between pb-4 mb-4 border-b"
      >
        <div>
          <h3 style={{ color: theme.textPrimary }} className="text-lg font-black">
            نسخه و بروزرسانی
          </h3>
          <p style={{ color: theme.textSecondary }} className="text-xs font-semibold mt-0.5">
            بررسی و استعلام آخرین نگارش منتشر شده در مخزن رسمی دانش‌میت
          </p>
        </div>
        <div
          style={{
            color: theme.primary,
            borderColor: theme.borderLuminous,
            backgroundColor: theme.innerBg,
          }}
          className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs"
        >
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      {/* Current Version Metadata Badge */}
      <div
        style={{
          backgroundColor: theme.innerBg,
          borderColor: theme.borderLuminous,
        }}
        className="p-4 rounded-2xl border mb-5 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              style={{ backgroundColor: theme.primary }}
              className="w-2.5 h-2.5 rounded-full animate-pulse"
            />
            <span style={{ color: theme.textSecondary }} className="text-xs font-bold">
              نسخه فعلی نصب‌شده:
            </span>
            <span
              style={{ color: theme.textPrimary }}
              className="text-sm font-black font-mono tracking-wide px-2 py-0.5 rounded-md bg-white/5 border border-white/10"
            >
              v{APP_VERSION}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono" dir="ltr">
            <span style={{ color: theme.textSecondary }}>versionCode:</span>
            <span
              style={{ color: theme.primaryLight }}
              className="font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10"
            >
              {APP_VERSION_CODE}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
          <div className="flex items-center gap-1.5" style={{ color: theme.textSecondary }}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>کانال انتشار و بروزرسانی: استور مایکت (Myket)</span>
          </div>
          <span style={{ color: theme.textMuted }} className="font-mono text-[10px]">
            {MYKET_CONFIG.appPackageId}
          </span>
        </div>
      </div>

      {/* Dynamic Status Display */}
      {status === 'idle' && (
        <div className="space-y-4">
          <p style={{ color: theme.textSecondary }} className="text-xs font-medium leading-relaxed">
            برنامه در حالت آفلاین و با داده‌های محلی اجرا می‌شود. برای اطلاع از انتشار نسخه‌های جدیدتر، قابلیت‌ها و بهبودهای فنی، می‌توانید مخزن را بررسی فرمایید.
          </p>

          <button
            type="button"
            onClick={handleCheckUpdate}
            style={{
              backgroundColor: theme.primary,
              boxShadow: `0 0 16px ${theme.glowColor}`,
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-95 active:scale-95 shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>بررسی بروزرسانی</span>
          </button>
        </div>
      )}

      {status === 'checking' && (
        <div
          style={{
            backgroundColor: theme.innerBg,
            borderColor: theme.borderLuminous,
          }}
          className="p-5 rounded-2xl border flex flex-col items-center justify-center gap-3 text-center animate-in fade-in duration-200"
        >
          <RefreshCw
            style={{ color: theme.primary }}
            className="w-7 h-7 animate-spin"
          />
          <div>
            <h4 style={{ color: theme.textPrimary }} className="text-xs font-black">
              در حال استعلام از مخزن گیت‌هاب...
            </h4>
            <p style={{ color: theme.textSecondary }} className="text-[11px] font-medium mt-1">
              لطفاً چند لحظه شکیبا باشید (مهلت انتظار حداکثر ۷ ثانیه)
            </p>
          </div>
        </div>
      )}

      {status === 'up-to-date' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-emerald-300">
                شما از آخرین نسخه DaneshMate استفاده می‌کنید!
              </h4>
              <p className="text-[11px] font-semibold text-emerald-400/80 leading-relaxed">
                نگارش فعلی شما (v{APP_VERSION}) با آخرین نسخه منتشر شده در مخزن هماهنگ و به‌روز است.
              </p>
              {lastCheckedTime && (
                <span className="text-[10px] text-emerald-400/60 block pt-1 font-mono">
                  آخرین بررسی: امروز ساعت {lastCheckedTime}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCheckUpdate}
              style={{
                backgroundColor: theme.innerBg,
                borderColor: theme.borderLuminous,
                color: theme.textPrimary,
              }}
              className="px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-white/5 active:scale-95 transition-all shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بررسی مجدد</span>
            </button>
          </div>
        </div>
      )}

      {status === 'update-available' && checkResult?.release && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div
            style={{
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              borderColor: 'rgba(99, 102, 241, 0.35)',
            }}
            className="p-4 rounded-2xl border space-y-3"
          >
            <div className="flex items-start gap-3">
              <ArrowUpCircle className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-300">
                    نسخه جدید موجود است
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500 text-white font-mono">
                    v{checkResult.latestVersion}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-indigo-200/80 leading-relaxed">
                  نسخه جدید {checkResult.release.name} با امکانات و بهبودهای تازه منتشر شد.
                </p>
              </div>
            </div>

            {/* Official Myket Distribution Channel Notice */}
            {isMyketChannel && (
              <div
                style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                className="p-3 rounded-xl border flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                  >
                    M
                  </div>
                  <div>
                    <div style={{ color: theme.textPrimary }} className="font-bold text-xs">
                      مرجع انتشار رسمی: مایکت
                    </div>
                    <div style={{ color: theme.textSecondary }} className="text-[10px] mt-0.5 font-mono">
                      {MYKET_CONFIG.appPackageId}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  تأیید شده
                </span>
              </div>
            )}

            {!isMyketChannel && checkResult.release.apkAsset && (
              <div
                style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span style={{ color: theme.textPrimary }} className="font-semibold truncate font-mono text-[11px]" dir="ltr">
                    {checkResult.release.apkAsset.name}
                  </span>
                </div>
                <span style={{ color: theme.textSecondary }} className="font-bold text-[11px] shrink-0 font-mono">
                  {checkResult.release.apkAsset.sizeFormatted}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isMyketChannel ? (
              <button
                type="button"
                onClick={handleOpenMyketUpdate}
                style={{
                  backgroundColor: theme.primary,
                  boxShadow: `0 0 16px ${theme.glowColor}`,
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 active:scale-95 transition-all shadow-md"
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>بهروزرسانی در مایکت</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenGitHubRelease}
                style={{
                  backgroundColor: theme.primary,
                  boxShadow: `0 0 16px ${theme.glowColor}`,
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 active:scale-95 transition-all shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>دریافت بروزرسانی</span>
              </button>
            )}

            {checkResult.release.body && (
              <button
                type="button"
                onClick={() => setIsChangelogOpen((prev) => !prev)}
                style={{
                  backgroundColor: theme.innerBg,
                  borderColor: theme.borderLuminous,
                  color: theme.textPrimary,
                }}
                className="px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-white/5 active:scale-95 transition-all shadow-xs"
              >
                <span>مشاهده تغییرات</span>
                {isChangelogOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleCheckUpdate}
              style={{ color: theme.textSecondary }}
              className="p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all"
              title="بررسی مجدد"
              aria-label="بررسی مجدد"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Collapsible Changelog Card */}
          {isChangelogOpen && checkResult.release.body && (
            <div
              style={{
                backgroundColor: theme.innerBg,
                borderColor: theme.borderLuminous,
              }}
              className="p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span style={{ color: theme.primaryLight }} className="font-black text-xs">
                  یادداشت انتشار نسخه جدید (Release Notes)
                </span>
                <span style={{ color: theme.textMuted }} className="font-mono text-[10px]">
                  {checkResult.release.publishedAt ? checkResult.release.publishedAt.slice(0, 10) : ''}
                </span>
              </div>
              <div
                style={{ color: theme.textSecondary }}
                className="font-medium text-xs leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap pr-1"
                dir="auto"
              >
                {checkResult.release.body}
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-rose-300">
                عدم برقراری ارتباط با مخزن
              </h4>
              <p className="text-[11px] font-semibold text-rose-400/90 leading-relaxed">
                {errorMessage || 'خطا در اتصال به سرور گیت‌هاب.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckUpdate}
            style={{
              backgroundColor: theme.primary,
              boxShadow: `0 0 16px ${theme.glowColor}`,
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 active:scale-95 transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تلاش مجدد</span>
          </button>
        </div>
      )}
    </div>
  );
});
