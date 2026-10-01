import React from 'react';

/**
 * Single source of truth for time parsing, formatting, and rendering in DaneshMate.
 * Ensures consistent semantic order (HH:mm -> Hour=HH, Minute=mm) and RTL rendering.
 */

const FARSI_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const LATIN_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Convert any string or number to Persian digits
 */
export function toPersianDigits(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '';
  return String(val).replace(/\d/g, (d) => FARSI_DIGITS[parseInt(d, 10)]);
}

/**
 * Convert Persian/Arabic digits to standard ASCII English digits
 */
export function toLatinDigits(val: string): string {
  if (!val) return '';
  let result = val;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(FARSI_DIGITS[i], 'g'), LATIN_DIGITS[i]);
    // Arabic-indic digits (٠-٩)
    result = result.replace(new RegExp(String.fromCharCode(0x0660 + i), 'g'), LATIN_DIGITS[i]);
  }
  return result;
}

/**
 * Parse a time string (e.g. "18:40", "۰۸:۴۵") into numeric hour and minute
 */
export function parseTime(timeStr?: string | null): { hour: number; minute: number } | null {
  if (!timeStr) return null;
  const clean = toLatinDigits(timeStr).trim();
  const match = clean.match(/(\d{1,2})[:](\d{2})/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return { hour, minute };
}

/**
 * Format numeric hour and minute into machine-readable "HH:mm" (24-hour format)
 */
export function formatTime(hour: number, minute: number): string {
  const h = Math.min(23, Math.max(0, hour)).toString().padStart(2, '0');
  const m = Math.min(59, Math.max(0, minute)).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Format numeric hour and minute into Persian digits "HH:mm"
 */
export function formatTimeFa(hour: number, minute: number): string {
  const h = toPersianDigits(Math.min(23, Math.max(0, hour)).toString().padStart(2, '0'));
  const m = toPersianDigits(Math.min(59, Math.max(0, minute)).toString().padStart(2, '0'));
  return `${h}:${m}`;
}

/**
 * Format a time interval string in Persian digits
 */
export function formatTimeIntervalFa(intervalStr?: string): string {
  if (!intervalStr) return '';
  const clean = toLatinDigits(intervalStr).trim();
  const parts = clean.split(/[-–—]|تا/).map((s) => s.trim());
  if (parts.length === 2) {
    const t1 = parseTime(parts[0]);
    const t2 = parseTime(parts[1]);
    if (t1 && t2) {
      return `${formatTimeFa(t1.hour, t1.minute)} - ${formatTimeFa(t2.hour, t2.minute)}`;
    }
  }
  return toPersianDigits(intervalStr);
}

/**
 * React Component for rendering clock time in DaneshMate RTL UI.
 * In RTL layout:
 * - RIGHT: Hour
 * - CENTER: Colon
 * - LEFT: Minute
 */
export interface SafeTimeDisplayProps {
  value?: string | null;
  hour?: number;
  minute?: number;
  className?: string;
  hourClassName?: string;
  minClassName?: string;
  colonClassName?: string;
  showLabels?: boolean;
}

export const SafeTimeDisplay: React.FC<SafeTimeDisplayProps> = ({
  value,
  hour,
  minute,
  className = '',
  hourClassName = '',
  minClassName = '',
  colonClassName = 'opacity-60 animate-pulse',
  showLabels = false,
}) => {
  let h = hour ?? 8;
  let m = minute ?? 0;

  if (value) {
    const parsed = parseTime(value);
    if (parsed) {
      h = parsed.hour;
      m = parsed.minute;
    }
  }

  const hStr = toPersianDigits(h.toString().padStart(2, '0'));
  const mStr = toPersianDigits(m.toString().padStart(2, '0'));

  return (
    <div
      dir="rtl"
      className={`inline-flex items-center justify-center gap-1.5 select-none ${className}`}
    >
      {/* RIGHT SIDE: HOUR (ساعت) */}
      <span className="flex flex-col items-center">
        <span className={hourClassName}>{hStr}</span>
        {showLabels && <span className="text-[9px] font-bold opacity-60">ساعت</span>}
      </span>

      {/* CENTER: COLON */}
      <span className={colonClassName}>:</span>

      {/* LEFT SIDE: MINUTE (دقیقه) */}
      <span className="flex flex-col items-center">
        <span className={minClassName}>{mStr}</span>
        {showLabels && <span className="text-[9px] font-bold opacity-60">دقیقه</span>}
      </span>
    </div>
  );
};
