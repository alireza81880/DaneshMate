/**
 * DaneshMate High-Precision Jalali (Solar Hijri) Calendar & DateTime Utility
 */

export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

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

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (w) => PERSIAN_DIGITS_MAP[w] || w);
}

/**
 * Standard Gregorian to Jalali Algorithm (accurate for 1000+ years)
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
 * Backward-compatible alias for gregorianToJalali
 */
export const toJalali = gregorianToJalali;

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
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  while (gm < 13 && gd > sal_g[gm]) {
    gd -= sal_g[gm];
    gm++;
  }
  return [gy, gm, gd];
}

export function getCurrentJalaliDate(): [number, number, number] {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Formats a Date object into standard Jalali string: "۱۴۰۵/۰۷/۰۴"
 */
export function formatJalaliDate(date: Date = new Date(), persianDigits = true): string {
  const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const formattedMonth = jm.toString().padStart(2, '0');
  const formattedDay = jd.toString().padStart(2, '0');
  const result = `${jy}/${formattedMonth}/${formattedDay}`;
  return persianDigits ? toPersianDigits(result) : result;
}

/**
 * Returns full timestamp formatted like "۱۴۰۵/۰۷/۰۴ - ۱۶:۲۷"
 */
export function getFullJalaliDateTimeString(date: Date = new Date()): string {
  const datePart = formatJalaliDate(date, true);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timePart = toPersianDigits(`${hours}:${minutes}`);
  return `${datePart} - ${timePart}`;
}

/**
 * Helper to get days in a given Jalali month (1-6: 31 days, 7-11: 30 days, 12: 29/30 days)
 */
export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // Check leap year for Esfand
  const isLeap = ((year + 38) * 31) % 128 < 31;
  return isLeap ? 30 : 29;
}

/**
 * Converts Jalali date components to UNIX epoch timestamp (ms) at 00:00:00 local time
 */
export function jalaliToTimestamp(jy: number, jm: number, jd: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  const d = new Date(gy, gm - 1, gd, 0, 0, 0, 0);
  return d.getTime();
}

/**
 * Calculates whether a 14-day cycle session is active on a given date relative to anchor date:
 * Condition: Math.floor((currentDate - anchorDate) / (7 * 24 * 60 * 60 * 1000)) % 2 === 0
 */
export function is14DayCycleActive(anchorTimestamp: number, targetDate: Date = new Date()): boolean {
  const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
  const anchorMidnight = new Date(anchorTimestamp);
  anchorMidnight.setHours(0, 0, 0, 0);
  const anchorMs = anchorMidnight.getTime();

  if (targetMidnight < anchorMs) {
    return false;
  }
  const weekDiff = Math.floor((targetMidnight - anchorMs) / (7 * 24 * 60 * 60 * 1000));
  return weekDiff % 2 === 0;
}
