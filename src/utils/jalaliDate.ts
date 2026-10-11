/**
 * DaneshMate - Jalali (Solar Hijri) Date & Digit Utilities
 * 
 * Pure algorithmic conversions between Gregorian and Jalali calendars,
 * Persian/Latin digit conversions, and date/time formatting.
 * Independent of React UI state and storage.
 */

export const PERSIAN_DIGITS_MAP: Record<string, string> = {
  '0': '۰',
  '1': '۱',
  '2': '۲',
  '3': '۳',
  '4': '۴',
  '5': '۵',
  '6': '۶',
  '7': '۷',
  '8': '۸',
  '9': '۹',
};

/**
 * Convert numbers or Latin digits to Persian digits (e.g. 1405 -> ۱۴۰۵)
 */
export const toPersianDigits = (input: string | number | undefined | null): string => {
  if (input === undefined || input === null) return '';
  return String(input).replace(/[0-9]/g, (w) => PERSIAN_DIGITS_MAP[w] || w);
};

export const LATIN_DIGITS_MAP: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

/**
 * Convert Persian and Arabic digits to Latin digits (e.g. ۱۴۰۵ -> 1405)
 */
export function toLatinDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  return String(input).replace(/[۰-۹٠-٩]/g, (w) => LATIN_DIGITS_MAP[w] || w);
}

export const PERSIAN_MONTHS: string[] = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/**
 * Converts a Gregorian date (gy, gm, gd) to Jalali (jy, jm, jd).
 * gm is 1-indexed (1 = January, 12 = December).
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

/**
 * Converts a Jalali date (jy, jm, jd) to Gregorian (gy, gm, gd).
 * jm is 1-indexed (1 = Farvardin, 12 = Esfand).
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let gy: number;
  let days: number;
  const sal_a = [0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336];
  jy += 1595;
  days =
    -355668 +
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    jd +
    sal_a[jm - 1];
  gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_g = [
    0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
  ];
  let gm = 0;
  while (gm < 13 && gd > sal_g[gm]) {
    gd -= sal_g[gm];
    gm++;
  }
  return [gy, gm, gd];
}

/**
 * Returns number of days in a given Jalali month (accounting for leap years).
 */
export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  const isLeap = ((year + 38) * 31) % 128 < 31;
  return isLeap ? 30 : 29;
}

/**
 * Converts a Jalali date to midnight epoch timestamp (in milliseconds).
 */
export function jalaliToTimestamp(jy: number, jm: number, jd: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  const d = new Date(gy, gm - 1, gd, 0, 0, 0, 0);
  return d.getTime();
}

/**
 * Format timestamp into Persian Jalali date (e.g. "۱۴۰۵/۰۷/۰۵")
 */
export function formatJalaliDate(timestamp: number | Date): string {
  if (!timestamp) return '';
  if (typeof timestamp === 'number' && (isNaN(timestamp) || timestamp <= 0)) return '';
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  if (!d || isNaN(d.getTime()) || d.getTime() <= 0) return '';
  try {
    const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${toPersianDigits(jy)}/${toPersianDigits(jm.toString().padStart(2, '0'))}/${toPersianDigits(jd.toString().padStart(2, '0'))}`;
  } catch {
    return '';
  }
}

/**
 * Robustly parse Jalali date/time string (e.g. "۱۴۰۵/۰۷/۰۵ - ۱۴:۳۰") into numeric milliseconds timestamp
 */
export function parseJalaliDateTimeToTimestamp(createdAtStr?: string): number {
  if (!createdAtStr) return 0;
  try {
    const clean = toLatinDigits(createdAtStr).trim();
    const parts = clean.split('-').map((s) => s.trim());
    if (parts.length >= 1 && parts[0].includes('/')) {
      const dateParts = parts[0].split('/').map((s) => parseInt(s, 10));
      if (dateParts.length === 3 && !dateParts.some(isNaN)) {
        const [jy, jm, jd] = dateParts;
        let hour = 12;
        let minute = 0;
        if (parts.length >= 2) {
          const timeMatch = parts[1].match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            hour = parseInt(timeMatch[1], 10);
            minute = parseInt(timeMatch[2], 10);
          }
        }
        const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
        const d = new Date(gy, gm - 1, gd, hour, minute, 0);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      }
    }
  } catch {
    // fallback
  }
  return 0;
}

/**
 * Format timestamp into Persian local time (e.g. "۱۲:۳۴")
 */
export function formatPersianTime(timestamp: number | Date): string {
  if (!timestamp) return '';
  if (typeof timestamp === 'number' && (isNaN(timestamp) || timestamp <= 0)) return '';
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  if (!d || isNaN(d.getTime()) || d.getTime() <= 0) return '';
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${toPersianDigits(h)}:${toPersianDigits(m)}`;
}

export interface JalaliDateDefaults {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/**
 * Compute today's Jalali date & safe future default reminder time based on local device clock
 */
export function getTodayJalaliDefaults(referenceDate: Date = new Date()): JalaliDateDefaults {
  const now = referenceDate;
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  let h = now.getHours() + 1;
  let m = 0;
  if (h >= 24) {
    h = 23;
    m = 59;
  }
  return { year: jy, month: jm, day: jd, hour: h, minute: m };
}
