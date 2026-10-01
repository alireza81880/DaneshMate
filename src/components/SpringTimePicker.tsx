import React, { useState, useEffect, useRef } from 'react';
import { Clock, X, Check, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

export interface SpringTimePickerTheme {
  cardBg: string;
  innerBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  borderLuminous: string;
  glowColor: string;
  isDark?: boolean;
}

export interface SpringTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hour: number, minute: number, formattedTime: string) => void;
  initialHour?: number;
  initialMinute?: number;
  title?: string;
  subtitle?: string;
  confirmText?: string;
  theme: SpringTimePickerTheme;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function toPersianDigits(n: number | string): string {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n
    .toString()
    .replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
}

export const SpringTimePicker: React.FC<SpringTimePickerProps> = React.memo(({
  isOpen,
  onClose,
  onConfirm,
  initialHour = 8,
  initialMinute = 0,
  title = 'تنظیم ساعت',
  subtitle = 'ساعت و دقیقه مورد نظر را انتخاب نمایید',
  confirmText,
  theme,
}) => {
  // Local transient state for smooth 60fps wheel drag without parent re-renders
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);

  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<{ hour?: any; min?: any }>({});

  const ITEM_HEIGHT = 44; // Exact height of each row in px (3 rows = 132px)

  // Sync internal state with props whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const validH = Math.min(23, Math.max(0, initialHour));
      const validM = Math.min(59, Math.max(0, initialMinute));
      setSelectedHour(validH);
      setSelectedMinute(validM);

      // Center scroll position on selected items after render
      const timer = setTimeout(() => {
        if (hourListRef.current) {
          hourListRef.current.scrollTop = validH * ITEM_HEIGHT;
        }
        if (minuteListRef.current) {
          minuteListRef.current.scrollTop = validM * ITEM_HEIGHT;
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isOpen, initialHour, initialMinute]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current.hour) clearTimeout(scrollTimeoutRef.current.hour);
      if (scrollTimeoutRef.current.min) clearTimeout(scrollTimeoutRef.current.min);
    };
  }, []);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const formatted = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onConfirm(selectedHour, selectedMinute, formatted);
    onClose();
  };

  const handleHourScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    const index = Math.round(top / ITEM_HEIGHT);
    if (index >= 0 && index < 24 && index !== selectedHour) {
      setSelectedHour(index);
    }
  };

  const handleMinuteScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    const index = Math.round(top / ITEM_HEIGHT);
    if (index >= 0 && index < 60 && index !== selectedMinute) {
      setSelectedMinute(index);
    }
  };

  const stepHour = (delta: number) => {
    const next = (selectedHour + delta + 24) % 24;
    setSelectedHour(next);
    if (hourListRef.current) {
      hourListRef.current.scrollTo({ top: next * ITEM_HEIGHT, behavior: 'smooth' });
    }
  };

  const stepMinute = (delta: number) => {
    const next = (selectedMinute + delta + 60) % 60;
    setSelectedMinute(next);
    if (minuteListRef.current) {
      minuteListRef.current.scrollTo({ top: next * ITEM_HEIGHT, behavior: 'smooth' });
    }
  };

  const selectHourDirectly = (h: number) => {
    setSelectedHour(h);
    if (hourListRef.current) {
      hourListRef.current.scrollTo({ top: h * ITEM_HEIGHT, behavior: 'smooth' });
    }
  };

  const selectMinuteDirectly = (m: number) => {
    setSelectedMinute(m);
    if (minuteListRef.current) {
      minuteListRef.current.scrollTo({ top: m * ITEM_HEIGHT, behavior: 'smooth' });
    }
  };

  const formattedPersianHour = toPersianDigits(selectedHour.toString().padStart(2, '0'));
  const formattedPersianMin = toPersianDigits(selectedMinute.toString().padStart(2, '0'));

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[80] flex items-center justify-center p-3.5 sm:p-4 select-none animate-in fade-in duration-150">
      {/* Outer Modal Container with Layered Neumorphic Glass & Ambient Radial Lighting */}
      <div
        dir="rtl"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderLuminous,
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.8), 0 0 24px ${theme.glowColor}`,
        }}
        className="liquid-glass relative rounded-3xl p-5 max-w-[320px] w-full border shadow-2xl transition-all animate-in zoom-in-95 duration-200 overflow-hidden"
      >
        {/* Ambient Top Glow Mesh Accent */}
        <div
          style={{
            background: `radial-gradient(circle at 50% 0%, ${theme.primary}25, transparent 70%)`,
          }}
          className="absolute -top-10 inset-x-0 h-28 pointer-events-none z-0"
        />

        <div className="relative z-10 space-y-3.5">
          {/* HEADER: RTL Layout (Right: Icon & Titles, Left: Close Button) */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div
                style={{
                  backgroundColor: theme.primary,
                  boxShadow: `0 0 12px ${theme.glowColor}`,
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
              >
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-right">
                <h3 style={{ color: theme.textPrimary }} className="text-xs font-black tracking-tight">
                  {title}
                </h3>
                <p style={{ color: theme.textSecondary }} className="text-[10px] leading-tight opacity-90">
                  {subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: theme.innerBg,
                borderColor: theme.borderLuminous,
                color: theme.textSecondary,
              }}
              className="w-7 h-7 rounded-lg border flex items-center justify-center hover:text-white hover:border-white/30 cursor-pointer transition-all active:scale-95"
              aria-label="بستن"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* CURRENT TIME DISPLAY (Left = Hour, Right = Minute) */}
          <div
            style={{
              backgroundColor: theme.innerBg,
              borderColor: theme.borderLuminous,
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
            }}
            className="p-2.5 rounded-2xl border text-center transition-all relative overflow-hidden flex flex-col items-center justify-center"
          >
            <div dir="ltr" className="flex items-center justify-center gap-3">
              {/* Hour (ساعت - LEFT) */}
              <div className="flex flex-col items-center">
                <span
                  style={{
                    color: theme.primaryLight,
                    textShadow: `0 0 16px ${theme.glowColor}`,
                  }}
                  className="text-2xl sm:text-3xl font-black font-mono tracking-wider transition-all duration-100 min-w-[42px] text-center"
                >
                  {formattedPersianHour}
                </span>
                <span style={{ color: theme.textMuted }} className="text-[9px] font-bold">
                  ساعت
                </span>
              </div>

              <span
                style={{ color: theme.primaryLight }}
                className="text-2xl font-bold font-mono opacity-60 animate-pulse pb-3"
              >
                :
              </span>

              {/* Minute (دقیقه - RIGHT) */}
              <div className="flex flex-col items-center">
                <span
                  style={{
                    color: theme.primaryLight,
                    textShadow: `0 0 16px ${theme.glowColor}`,
                  }}
                  className="text-2xl sm:text-3xl font-black font-mono tracking-wider transition-all duration-100 min-w-[42px] text-center"
                >
                  {formattedPersianMin}
                </span>
                <span style={{ color: theme.textMuted }} className="text-[9px] font-bold">
                  دقیقه
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1 mt-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400 opacity-80" />
              <span style={{ color: theme.textMuted }} className="text-[10px] font-bold">
                ساعت انتخابی
              </span>
            </div>
          </div>

          {/* 3D DRUM WHEEL PICKER (Left = Hour, Right = Minute) */}
          <div
            dir="ltr"
            style={{
              backgroundColor: theme.innerBg,
              borderColor: theme.borderLuminous,
              boxShadow: 'inset 0 4px 14px rgba(0,0,0,0.6)',
            }}
            className="rounded-2xl border p-2.5 overflow-hidden"
          >
            {/* Top Control Bar: Chevrons Up & Column Labels (Left = Hour, Right = Minute) */}
            <div className="flex items-center justify-between gap-3 relative z-10 mb-1">
              {/* LEFT COLUMN: Hour Header */}
              <div className="flex-1 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => stepHour(-1)}
                  style={{ color: theme.textSecondary }}
                  className="w-full py-1 hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-90"
                  title="ساعت قبل"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <div className="text-[10.5px] font-bold text-slate-400 tracking-tight font-sans">
                  ساعت
                </div>
              </div>

              {/* RIGHT COLUMN: Minute Header */}
              <div className="flex-1 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => stepMinute(-1)}
                  style={{ color: theme.textSecondary }}
                  className="w-full py-1 hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-90"
                  title="دقیقه قبل"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <div className="text-[10.5px] font-bold text-slate-400 tracking-tight font-sans">
                  دقیقه
                </div>
              </div>
            </div>

            {/* WHEEL AREA WITH EXACT MATHEMATICALLY-ALIGNED GLASS SELECTION BAR */}
            <div className="relative h-[132px] overflow-hidden my-1">
              {/* Cylindrical Vignette Masks (Top & Bottom of wheels) */}
              <div className="absolute top-0 inset-x-0 h-9 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none z-20" />
              <div className="absolute bottom-0 inset-x-0 h-9 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-20" />

              {/* PRECISION GLASS SELECTION BAR: Centered precisely over the active middle row at top-[44px] */}
              <div
                style={{
                  borderColor: `${theme.primary}75`,
                  backgroundColor: `${theme.primary}18`,
                  boxShadow: `0 0 14px ${theme.glowColor}25, inset 0 0 8px ${theme.glowColor}15`,
                }}
                className="absolute top-[44px] inset-x-1 h-[44px] rounded-xl border pointer-events-none z-0 transition-all duration-200"
              />

              {/* Wheels Container (Left = Hour, Right = Minute) */}
              <div className="flex items-center justify-between gap-3 h-[132px] relative z-10">
                {/* LEFT COLUMN: Hour Wheel (ساعت: 00-23) */}
                <div
                  ref={hourListRef}
                  onScroll={handleHourScroll}
                  style={{ height: ITEM_HEIGHT * 3 }}
                  className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar py-[44px] select-none text-center"
                >
                  {HOURS.map((h) => {
                    const isSel = selectedHour === h;
                    const diff = Math.abs(selectedHour - h);
                    const isNearby = diff === 1 || diff === 23;
                    return (
                      <div
                        key={h}
                        onClick={() => selectHourDirectly(h)}
                        style={{
                          height: ITEM_HEIGHT,
                          color: isSel ? '#FFFFFF' : theme.textSecondary,
                          transform: isSel ? 'scale(1.15)' : isNearby ? 'scale(0.88)' : 'scale(0.75)',
                          textShadow: isSel ? `0 0 12px ${theme.glowColor}` : 'none',
                        }}
                        className={`snap-center flex items-center justify-center font-mono text-base cursor-pointer transition-all duration-150 ${
                          isSel
                            ? 'font-black opacity-100'
                            : isNearby
                            ? 'font-semibold opacity-40 hover:opacity-75'
                            : 'opacity-20'
                        }`}
                      >
                        {toPersianDigits(h.toString().padStart(2, '0'))}
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT COLUMN: Minute Wheel (دقیقه: 00-59) */}
                <div
                  ref={minuteListRef}
                  onScroll={handleMinuteScroll}
                  style={{ height: ITEM_HEIGHT * 3 }}
                  className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar py-[44px] select-none text-center"
                >
                  {MINUTES.map((m) => {
                    const isSel = selectedMinute === m;
                    const diff = Math.abs(selectedMinute - m);
                    const isNearby = diff === 1 || diff === 59;
                    return (
                      <div
                        key={m}
                        onClick={() => selectMinuteDirectly(m)}
                        style={{
                          height: ITEM_HEIGHT,
                          color: isSel ? '#FFFFFF' : theme.textSecondary,
                          transform: isSel ? 'scale(1.15)' : isNearby ? 'scale(0.88)' : 'scale(0.75)',
                          textShadow: isSel ? `0 0 12px ${theme.glowColor}` : 'none',
                        }}
                        className={`snap-center flex items-center justify-center font-mono text-base cursor-pointer transition-all duration-150 ${
                          isSel
                            ? 'font-black opacity-100'
                            : isNearby
                            ? 'font-semibold opacity-40 hover:opacity-75'
                            : 'opacity-20'
                        }`}
                      >
                        {toPersianDigits(m.toString().padStart(2, '0'))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Control Bar: Chevrons Down (Left = Hour, Right = Minute) */}
            <div className="flex items-center justify-between gap-3 relative z-10 mt-1">
              <div className="flex-1 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => stepHour(1)}
                  style={{ color: theme.textSecondary }}
                  className="w-full py-1 hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-90"
                  title="ساعت بعد"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => stepMinute(1)}
                  style={{ color: theme.textSecondary }}
                  className="w-full py-1 hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-90"
                  title="دقیقه بعد"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* HELPER TEXT */}
          <p style={{ color: theme.textMuted }} className="text-[10px] text-center opacity-75 font-medium">
            برای تغییر زمان، هر ستون را بالا یا پایین بکشید
          </p>

          {/* CONFIRM & CANCEL ACTIONS */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: theme.innerBg,
                borderColor: theme.borderLuminous,
                color: theme.textSecondary,
              }}
              className="px-3.5 py-2.5 rounded-2xl text-xs font-bold border hover:text-white cursor-pointer transition-colors active:scale-95"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              style={{
                backgroundColor: theme.primary,
                boxShadow: `0 0 14px ${theme.glowColor}`,
              }}
              className="flex-1 py-2.5 px-3 rounded-2xl text-xs font-black text-white shadow-md cursor-pointer hover:opacity-95 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{confirmText || `انتخاب ساعت ${formattedPersianHour}:${formattedPersianMin}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
