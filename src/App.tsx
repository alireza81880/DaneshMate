import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  User,
  Settings,
  Check,
  X,
  Search,
  Mic,
  Bell,
  Play,
  Pause,
  RotateCcw,
  BarChart2,
  Home,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Palette,
  FileText,
  Upload,
  Calendar,
  MapPin,
  Paperclip,
  MessageSquare,
  Send,
  ExternalLink,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { persistenceAdapter, AppSnapshot } from './storage/persistenceAdapter';
import { syncBridge, SyncState } from './api/syncBridge';
import { nativeStorageService } from './services/nativeStorageService';
import { audioRecordingService } from './services/audioRecordingService';
import { filePickerService } from './services/filePickerService';
import { notificationService } from './services/notificationService';
import { SpringTimePicker } from './components/SpringTimePicker';
import { DashboardHeaderClock } from './components/Dashboard/DashboardHeaderClock';
import { ClassFormModal } from './components/ClassModal/ClassFormModal';
import { SettingsScreen } from './components/Settings/SettingsScreen';
import { MyketSupportCard } from './components/Settings/MyketSupportCard';

export type WeekDay = 'شنبه' | 'یکشنبه' | 'دوشنبه' | 'سه‌شنبه' | 'چهارشنبه' | 'پنج‌شنبه';
export type RecurrenceType = 'every_week' | 'even_weeks' | 'odd_weeks' | 'bi_weekly' | 'biweekly';
export type ThemeCategory = 'Dark & Monochromatic' | 'Premium High-Contrast' | 'Light Minimal' | 'Neumorphic';
type MainTab = 'home' | 'notes' | 'reports' | 'profile' | 'settings';
export type FileCategory = 'image' | 'audio' | 'pdf' | 'powerpoint' | 'word' | 'other';

export interface AttachedFile {
  id: string;
  name: string;
  type: FileCategory;
  sizeText: string;
  uri?: string;
  url?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  classCode?: string;
  day: WeekDay;
  time: string;
  recurrence: RecurrenceType;
  recurrence_type?: 'even' | 'odd' | 'weekly' | 'bi_weekly';
  anchor_date?: string;
  anchor_timestamp?: number;
  scheduled_session_timestamps?: number[];
  professor?: string;
  location?: string;
  hasReminder?: boolean;
  reminderMode?: 'before_class' | 'exact_time';
  reminderMinutesBefore?: number;
  reminderExactTime?: string;
  reminderDay?: WeekDay;
  reminderTriggerText?: string;
}

interface ClassSessionLog {
  id: string;
  classId: string;
  className: string;
  classCode?: string;
  createdAt: string;
  notesText: string;
  attachedFiles?: AttachedFile[];
  voiceMemoSeconds?: number;
  voiceMemoUri?: string;
  hasReminder: boolean;
  reminderTimestamp?: number;
  reminderTrigger?: string;
  reminderTimeText?: string;
  snoozedUntil?: string;
  notificationId?: number;
  chatMessages?: Array<{ id: string; text: string; time: string }>;
  acknowledgedAt?: number;
}

export interface PaletteTheme {
  id: string;
  name: string;
  category: ThemeCategory;
  bg: string;
  canvasGradient?: string;
  cardBg: string;
  innerBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  secondaryAccent: string;
  borderLuminous: string;
  shadowFlat: string;
  shadowPressed: string;
  glowColor: string;
  isDark: boolean;
}

// 12-Theme Engine Specifications - Strictly English Technical Keys
export const THEMES_2026: Record<string, PaletteTheme> = {
  // === DARK & MONOCHROMATIC (4) ===
  'deep-space': {
    id: 'deep-space',
    name: 'deep-space',
    category: 'Dark & Monochromatic',
    bg: '#090D16',
    canvasGradient: 'radial-gradient(ellipse at top, #141B2D 0%, #090D16 70%)',
    cardBg: 'rgba(22, 26, 34, 0.75)',
    innerBg: 'rgba(15, 18, 26, 0.85)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    secondaryAccent: '#8B5CF6',
    borderLuminous: 'rgba(255, 255, 255, 0.1)',
    shadowFlat: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
    shadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.6)',
    glowColor: 'rgba(59, 130, 246, 0.35)',
    isDark: true,
  },
  'slate': {
    id: 'slate',
    name: 'slate',
    category: 'Dark & Monochromatic',
    bg: '#0F172A',
    cardBg: 'rgba(30, 41, 59, 0.75)',
    innerBg: 'rgba(15, 23, 42, 0.85)',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    primary: '#38BDF8',
    primaryLight: '#7DD3FC',
    secondaryAccent: '#818CF8',
    borderLuminous: 'rgba(255, 255, 255, 0.08)',
    shadowFlat: '0 8px 30px rgba(0, 0, 0, 0.5)',
    shadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.6)',
    glowColor: 'rgba(56, 189, 248, 0.25)',
    isDark: true,
  },
  'oled-black': {
    id: 'oled-black',
    name: 'oled-black',
    category: 'Dark & Monochromatic',
    bg: '#000000',
    cardBg: 'rgba(14, 14, 18, 0.85)',
    innerBg: '#050505',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    secondaryAccent: '#10B981',
    borderLuminous: 'rgba(255, 255, 255, 0.12)',
    shadowFlat: '0 8px 32px rgba(0, 0, 0, 0.85)',
    shadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.9)',
    glowColor: 'rgba(255, 255, 255, 0.25)',
    isDark: true,
  },
  'midnight': {
    id: 'midnight',
    name: 'midnight',
    category: 'Dark & Monochromatic',
    bg: '#0B0D17',
    cardBg: 'rgba(20, 24, 38, 0.75)',
    innerBg: 'rgba(12, 14, 24, 0.9)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    secondaryAccent: '#EC4899',
    borderLuminous: 'rgba(255, 255, 255, 0.09)',
    shadowFlat: '0 8px 32px rgba(0, 0, 0, 0.55)',
    shadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.7)',
    glowColor: 'rgba(99, 102, 241, 0.3)',
    isDark: true,
  },

  // === PREMIUM HIGH-CONTRAST (4) ===
  'cyberpunk-neon': {
    id: 'cyberpunk-neon',
    name: 'cyberpunk-neon',
    category: 'Premium High-Contrast',
    bg: '#090814',
    cardBg: 'rgba(25, 20, 45, 0.75)',
    innerBg: 'rgba(14, 11, 28, 0.9)',
    textPrimary: '#FDF4FF',
    textSecondary: '#E879F9',
    textMuted: '#A855F7',
    primary: '#EC4899',
    primaryLight: '#F472B6',
    secondaryAccent: '#06B6D4',
    borderLuminous: 'rgba(236, 72, 153, 0.3)',
    shadowFlat: '0 8px 32px rgba(236, 72, 153, 0.2)',
    shadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.7)',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    isDark: true,
  },
  'aurora-borealis': {
    id: 'aurora-borealis',
    name: 'aurora-borealis',
    category: 'Premium High-Contrast',
    bg: '#061412',
    cardBg: 'rgba(12, 36, 32, 0.75)',
    innerBg: 'rgba(6, 20, 18, 0.9)',
    textPrimary: '#ECFDF5',
    textSecondary: '#6EE7B7',
    textMuted: '#059669',
    primary: '#10B981',
    primaryLight: '#34D399',
    secondaryAccent: '#06B6D4',
    borderLuminous: 'rgba(16, 185, 129, 0.25)',
    shadowFlat: '0 8px 32px rgba(16, 185, 129, 0.2)',
    shadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.7)',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    isDark: true,
  },
  'sunset-gradient': {
    id: 'sunset-gradient',
    name: 'sunset-gradient',
    category: 'Premium High-Contrast',
    bg: '#150A19',
    cardBg: 'rgba(40, 18, 48, 0.75)',
    innerBg: 'rgba(22, 9, 28, 0.9)',
    textPrimary: '#FFF7ED',
    textSecondary: '#FDBA74',
    textMuted: '#EA580C',
    primary: '#F97316',
    primaryLight: '#FB923C',
    secondaryAccent: '#EC4899',
    borderLuminous: 'rgba(249, 115, 22, 0.3)',
    shadowFlat: '0 8px 32px rgba(249, 115, 22, 0.2)',
    shadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.7)',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    isDark: true,
  },
  'hacker-green': {
    id: 'hacker-green',
    name: 'hacker-green',
    category: 'Premium High-Contrast',
    bg: '#040D07',
    cardBg: 'rgba(8, 28, 14, 0.8)',
    innerBg: 'rgba(4, 16, 8, 0.95)',
    textPrimary: '#DCFCE7',
    textSecondary: '#86EFAC',
    textMuted: '#15803D',
    primary: '#22C55E',
    primaryLight: '#4ADE80',
    secondaryAccent: '#16A34A',
    borderLuminous: 'rgba(34, 197, 94, 0.3)',
    shadowFlat: '0 8px 32px rgba(34, 197, 94, 0.2)',
    shadowPressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.8)',
    glowColor: 'rgba(34, 197, 94, 0.45)',
    isDark: true,
  },

  // === LIGHT MINIMAL (4) ===
  'clean-minimal': {
    id: 'clean-minimal',
    name: 'clean-minimal',
    category: 'Light Minimal',
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    innerBg: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#475569',
    primary: '#0284C7',
    primaryLight: '#0369A1',
    secondaryAccent: '#4F46E5',
    borderLuminous: 'rgba(15, 23, 42, 0.12)',
    shadowFlat: '0 4px 20px rgba(0, 0, 0, 0.08)',
    shadowPressed: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    glowColor: 'rgba(2, 132, 199, 0.2)',
    isDark: false,
  },
  'soft-blue': {
    id: 'soft-blue',
    name: 'soft-blue',
    category: 'Light Minimal',
    bg: '#F0F7FF',
    cardBg: '#FFFFFF',
    innerBg: '#E2EFFF',
    textPrimary: '#0A2138',
    textSecondary: '#1E3A5F',
    textMuted: '#33557A',
    primary: '#1D4ED8',
    primaryLight: '#1E40AF',
    secondaryAccent: '#6D28D9',
    borderLuminous: 'rgba(30, 58, 138, 0.16)',
    shadowFlat: '0 8px 24px rgba(30, 64, 175, 0.1)',
    shadowPressed: 'inset 0 2px 4px rgba(30, 64, 175, 0.08)',
    glowColor: 'rgba(29, 78, 216, 0.2)',
    isDark: false,
  },
  'pearl': {
    id: 'pearl',
    name: 'pearl',
    category: 'Light Minimal',
    bg: '#FAF8F5',
    cardBg: '#FFFFFF',
    innerBg: '#F4ECE4',
    textPrimary: '#241405',
    textSecondary: '#4A280B',
    textMuted: '#6E431B',
    primary: '#B45309',
    primaryLight: '#92400E',
    secondaryAccent: '#0F766E',
    borderLuminous: 'rgba(66, 32, 6, 0.15)',
    shadowFlat: '0 8px 24px rgba(41, 24, 7, 0.08)',
    shadowPressed: 'inset 0 2px 4px rgba(41, 24, 7, 0.08)',
    glowColor: 'rgba(180, 83, 9, 0.2)',
    isDark: false,
  },
  'morning': {
    id: 'morning',
    name: 'morning',
    category: 'Light Minimal',
    bg: '#FCFBF7',
    cardBg: '#FFFFFF',
    innerBg: '#FEF3C7',
    textPrimary: '#2D1603',
    textSecondary: '#5A2C08',
    textMuted: '#7C4010',
    primary: '#D97706',
    primaryLight: '#B45309',
    secondaryAccent: '#047857',
    borderLuminous: 'rgba(120, 53, 15, 0.18)',
    shadowFlat: '0 8px 24px rgba(58, 30, 5, 0.08)',
    shadowPressed: 'inset 0 2px 4px rgba(58, 30, 5, 0.08)',
    glowColor: 'rgba(217, 119, 6, 0.2)',
    isDark: false,
  },

  // === NEUMORPHIC (2) ===
  'neo-ice': {
    id: 'neo-ice',
    name: 'neo-ice',
    category: 'Neumorphic',
    bg: '#E2E8F0',
    cardBg: '#E2E8F0',
    innerBg: '#CBD5E1',
    textPrimary: '#0A0F1D',
    textSecondary: '#334155',
    textMuted: '#475569',
    primary: '#2563EB',
    primaryLight: '#1D4ED8',
    secondaryAccent: '#6D28D9',
    borderLuminous: 'rgba(15, 23, 42, 0.16)',
    shadowFlat: '6px 6px 14px #BAC7D5, -6px -6px 14px #FFFFFF',
    shadowPressed: 'inset 3px 3px 6px #BAC7D5, inset -3px -3px 6px #FFFFFF',
    glowColor: 'rgba(37, 99, 235, 0.25)',
    isDark: false,
  },
  'neo-mauve': {
    id: 'neo-mauve',
    name: 'neo-mauve',
    category: 'Neumorphic',
    bg: '#ECE7F0',
    cardBg: '#ECE7F0',
    innerBg: '#DCD4E4',
    textPrimary: '#1E0A3C',
    textSecondary: '#4A1572',
    textMuted: '#581C87',
    primary: '#7C3AED',
    primaryLight: '#6D28D9',
    secondaryAccent: '#BE185D',
    borderLuminous: 'rgba(46, 16, 101, 0.18)',
    shadowFlat: '6px 6px 14px #C7BDD0, -6px -6px 14px #FFFFFF',
    shadowPressed: 'inset 3px 3px 6px #C7BDD0, inset -3px -3px 6px #FFFFFF',
    glowColor: 'rgba(124, 58, 237, 0.25)',
    isDark: false,
  },
};

export const COMMON_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
];

const PERSIAN_DIGITS_MAP: Record<string, string> = {
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

export const toPersianDigits = (input: string | number): string =>
  String(input).replace(/[0-9]/g, (w) => PERSIAN_DIGITS_MAP[w] || w);

export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
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

export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  const isLeap = ((year + 38) * 31) % 128 < 31;
  return isLeap ? 30 : 29;
}

export function jalaliToTimestamp(jy: number, jm: number, jd: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  const d = new Date(gy, gm - 1, gd, 0, 0, 0, 0);
  return d.getTime();
}

export const WEEK_DAYS: WeekDay[] = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
];

const RECURRENCE_CONFIG: Record<
  RecurrenceType,
  { label: string; bg: string; color: string; lightColor: string }
> = {
  every_week: {
    label: 'هر هفته',
    bg: 'rgba(59, 130, 246, 0.15)',
    color: '#3B82F6',
    lightColor: '#1D4ED8',
  },
  bi_weekly: {
    label: 'یک هفته در میان',
    bg: 'rgba(99, 102, 241, 0.15)',
    color: '#6366F1',
    lightColor: '#4338CA',
  },
  biweekly: {
    label: 'یک هفته در میان',
    bg: 'rgba(99, 102, 241, 0.15)',
    color: '#6366F1',
    lightColor: '#4338CA',
  },
  even_weeks: {
    label: 'یک هفته در میان',
    bg: 'rgba(99, 102, 241, 0.15)',
    color: '#6366F1',
    lightColor: '#4338CA',
  },
  odd_weeks: {
    label: 'یک هفته در میان',
    bg: 'rgba(99, 102, 241, 0.15)',
    color: '#6366F1',
    lightColor: '#4338CA',
  },
};

// Clean Persian Alert Triggers for quick selection
const QUICK_ALERT_TRIGGERS = [
  '۱۵ دقیقه قبل',
  '۳۰ دقیقه قبل',
  '۱ ساعت قبل',
  '۱ روز قبل',
];

// Configurable "Before Class" Reminder Options (Part 8 Mode A)
const BEFORE_CLASS_OPTIONS = [
  { label: '۵ دقیقه قبل از شروع کلاس', minutes: 5 },
  { label: '۱۰ دقیقه قبل از شروع کلاس', minutes: 10 },
  { label: '۱۵ دقیقه قبل از شروع کلاس', minutes: 15 },
  { label: '۳۰ دقیقه قبل از شروع کلاس', minutes: 30 },
  { label: '۱ ساعت قبل از شروع کلاس', minutes: 60 },
];

// Compact 5-Option Primary Chips for Class Reminder UI (Part 8 Mode A)
const PRIMARY_BEFORE_CLASS_CHIPS = [
  { label: '۵ دقیقه', minutes: 5 },
  { label: '۱۰ دقیقه', minutes: 10 },
  { label: '۱۵ دقیقه', minutes: 15 },
  { label: '۳۰ دقیقه', minutes: 30 },
  { label: '۱ ساعت', minutes: 60 },
];

/**
 * Robust time slot interval parser handling English/Persian numerals and formats
 */
export function parseTimeInterval(timeStr: string): { start: number; end: number } | null {
  if (!timeStr) return null;
  const normalized = timeStr
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .trim();

  const parts = normalized.split(/[-–—]|تا/).map((s) => s.trim());
  if (parts.length !== 2) return null;

  const parseMins = (t: string): number | null => {
    const m = t.match(/(\d{1,2})[:](\d{2})/);
    if (!m) return null;
    const hour = parseInt(m[1], 10);
    const minute = parseInt(m[2], 10);
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 24 || minute < 0 || minute > 59) return null;
    return hour * 60 + minute;
  };

  const s = parseMins(parts[0]);
  const e = parseMins(parts[1]);
  if (s === null || e === null || e <= s) return null;
  return { start: s, end: e };
}

/**
 * Real class time conflict detector (Part 3 & 4)
 * Two classes conflict when they occur on the same weekday and their time intervals overlap.
 * Excludes class currently being edited.
 */
export function detectClassConflict(
  day: WeekDay,
  timeStr: string,
  existingClasses: ClassItem[],
  excludeId?: string | null
): { hasConflict: boolean; conflictingClass?: ClassItem } {
  const currentInterval = parseTimeInterval(timeStr);
  if (!currentInterval) {
    // If class has invalid/missing time: do not crash; skip conflict validation for that class.
    return { hasConflict: false };
  }

  for (const cls of existingClasses) {
    if (excludeId && cls.id === excludeId) continue;
    if (cls.day !== day) continue;

    const otherInterval = parseTimeInterval(cls.time);
    if (!otherInterval) continue;

    // Overlap: startA < endB and startB < endA
    if (currentInterval.start < otherInterval.end && otherInterval.start < currentInterval.end) {
      return { hasConflict: true, conflictingClass: cls };
    }
  }

  return { hasConflict: false };
}

const NAME_REGEX = /^[a-zA-Z\u0600-\u06FF\uFB8A\u067E\u0686\u06AF\u200c\s]+$/;

export default function App() {
  const initialSnap = useRef<AppSnapshot | null>(persistenceAdapter.getInitialSnapshotSync()).current;

  const [currentThemeId, setCurrentThemeId] = useState<string>(() => initialSnap?.activeThemeId || 'deep-space');
  const theme = THEMES_2026[currentThemeId] || THEMES_2026['deep-space'];

  // Navigation: Active Tab & Floating Radial Menu State
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [isRadialOpen, setIsRadialOpen] = useState(false);

  // User Profile - Strict Zero-Data Cold Start (No hardcoded names, loaded synchronously from persistent storage)
  const [userProfile, setUserProfile] = useState<{
    firstName: string;
    lastName: string;
    passedUnits?: string;
  } | null>(() => initialSnap?.studentProfile || null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [pFirstName, setPFirstName] = useState('');
  const [pLastName, setPLastName] = useState('');
  const [pPassedUnits, setPPassedUnits] = useState('');
  const [pErrors, setPErrors] = useState<{ firstName?: string; lastName?: string }>({});

  // Classes State - Initialized synchronously from persistent storage for instant first paint
  const [classes, setClasses] = useState<ClassItem[]>(() => initialSnap?.classes || []);
  const [selectedDayFilter, setSelectedDayFilter] = useState<'همه' | WeekDay>('همه');
  const [searchQuery, setSearchQuery] = useState('');

  // Class Add/Edit Modal (State isolated in ClassFormModal)
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // Delete modal
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Multimodal In-Class Session Capture State - Initialized synchronously from persistent storage
  const [sessionLogs, setSessionLogs] = useState<ClassSessionLog[]>(() => initialSnap?.sessionLogs || []);

  const [isSessionCaptureOpen, setIsSessionCaptureOpen] = useState(false);
  const [sessionClassId, setSessionClassId] = useState<string>('');
  const [sessionNotesText, setSessionNotesText] = useState('');
  const [sessionAttachedFiles, setSessionAttachedFiles] = useState<AttachedFile[]>([]);

  // Interactive Chat-Style Session Viewer State
  const [selectedChatSessionLog, setSelectedChatSessionLog] = useState<ClassSessionLog | null>(null);
  const [chatAudioPlaying, setChatAudioPlaying] = useState(false);
  const [chatAudioSeconds, setChatAudioSeconds] = useState(0);
  const [chatAudioSpeed, setChatAudioSpeed] = useState<1 | 1.5 | 2>(1);
  const [chatFollowUps, setChatFollowUps] = useState<Array<{ id: string; text: string; time: string }>>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [fileToast, setFileToast] = useState<string | null>(null);

  // Voice recording
  const [sessionIsRecording, setSessionIsRecording] = useState(false);
  const [sessionRecordSeconds, setSessionRecordSeconds] = useState(0);
  const [sessionDuration, setSessionDuration] = useState<number | null>(null);
  const [sessionVoiceUri, setSessionVoiceUri] = useState<string | null>(null);
  const [sessionIsPlayingAudio, setSessionIsPlayingAudio] = useState(false);

  // Audio elements for real native/web audio playback
  const chatAudioRef = useRef<HTMLAudioElement | null>(null);
  const sessionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Session Reminders
  const [sessionHasReminder, setSessionHasReminder] = useState(true);
  const [sessionSelectedReminder, setSessionSelectedReminder] = useState<string>(QUICK_ALERT_TRIGGERS[0]);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // In-App File & Media Preview State (Problem 7)
  const [previewFile, setPreviewFile] = useState<AttachedFile | null>(null);

  // Manual Session Timeline Reminder Configurator (Date + Time)
  const [isTimelineReminderOpen, setIsTimelineReminderOpen] = useState(false);
  const [timelineReminderTrigger, setTimelineReminderTrigger] = useState<string>(QUICK_ALERT_TRIGGERS[0]);
  const [isSessionDatePickerOpen, setIsSessionDatePickerOpen] = useState(false);
  const [isSessionTimePickerOpen, setIsSessionTimePickerOpen] = useState(false);
  const [sessionPickerYear, setSessionPickerYear] = useState(1405);
  const [sessionPickerMonth, setSessionPickerMonth] = useState(7);
  const [sessionPickerDay, setSessionPickerDay] = useState(4);
  const [sessionPickerHour, setSessionPickerHour] = useState(8);
  const [sessionPickerMin, setSessionPickerMin] = useState(0);

  // Offline-First Snapshot Hydration & Cloud Sync & Native Notification Action Listener
  useEffect(() => {
    // If initial snapshot was not loaded synchronously, load from local storage
    if (!initialSnap) {
      persistenceAdapter.loadAppSnapshot().then((snapshot) => {
        if (snapshot) {
          if (snapshot.studentProfile) setUserProfile(snapshot.studentProfile);
          if (snapshot.classes && snapshot.classes.length > 0) setClasses(snapshot.classes);
          if (snapshot.sessionLogs && snapshot.sessionLogs.length > 0) setSessionLogs(snapshot.sessionLogs);
          if (snapshot.activeThemeId && THEMES_2026[snapshot.activeThemeId]) {
            setCurrentThemeId(snapshot.activeThemeId);
          }
        }
      });
    }

    // Part 1: Defer heavy native notification reconciliation and cloud sync until after first paint
    const deferTimer = setTimeout(() => {
      const logs = initialSnap?.sessionLogs || sessionLogs;
      const clss = initialSnap?.classes || classes;
      if (logs.length > 0 || clss.length > 0) {
        notificationService.syncPendingNotifications(logs, clss).catch(() => {});
      }

      syncBridge.fetchCloudSnapshot().then((cloudData) => {
        if (cloudData && cloudData.success && cloudData.student_profile && !initialSnap?.studentProfile) {
          setUserProfile({
            firstName: cloudData.student_profile.first_name,
            lastName: cloudData.student_profile.last_name,
            passedUnits: cloudData.student_profile.passed_units,
          });
        }
      }).catch(() => {});
    }, 1000);

    // Native notification tap listener (navigates to relevant session if applicable)
    const unsubscribeAction = notificationService.addActionListener((actionId, data) => {
      if (actionId === 'tap' && data.logId) {
        const found = sessionLogs.find((l) => l.id === data.logId);
        if (found) {
          setSelectedChatSessionLog(found);
        }
      }
    });

    return () => {
      clearTimeout(deferTimer);
      unsubscribeAction();
    };
  }, []);

  // Real inline audio playback via HTMLAudioElement
  useEffect(() => {
    if (chatAudioPlaying) {
      if (chatAudioRef.current) {
        chatAudioRef.current.pause();
        chatAudioRef.current = null;
      }
      const rawUri =
        selectedChatSessionLog?.voiceMemoUri ||
        selectedChatSessionLog?.attachedFiles?.find((f) => f.type === 'audio')?.uri ||
        selectedChatSessionLog?.attachedFiles?.find((f) => f.type === 'audio')?.url;

      const playableUrl = nativeStorageService.getWebViewUrl(rawUri);
      if (!playableUrl) {
        setChatAudioPlaying(false);
        setFileToast('فایل صوتی برای پخش در دسترس نیست یا حذف شده است.');
        setTimeout(() => setFileToast(null), 3000);
        return;
      }

      const audio = new Audio(playableUrl);
      chatAudioRef.current = audio;
      audio.playbackRate = chatAudioSpeed;

      audio.onended = () => {
        setChatAudioPlaying(false);
        setChatAudioSeconds(0);
      };
      audio.ontimeupdate = () => {
        setChatAudioSeconds(Math.floor(audio.currentTime));
      };
      audio.onerror = () => {
        setChatAudioPlaying(false);
        setFileToast('خطا در پخش فایل صوتی جلسه.');
        setTimeout(() => setFileToast(null), 3000);
      };

      audio.play().catch((err) => {
        console.warn('[AudioPlayback] play error:', err);
        setChatAudioPlaying(false);
      });
    } else {
      if (chatAudioRef.current) {
        chatAudioRef.current.pause();
      }
    }
  }, [chatAudioPlaying, selectedChatSessionLog]);

  useEffect(() => {
    if (chatAudioRef.current) {
      chatAudioRef.current.playbackRate = chatAudioSpeed;
    }
  }, [chatAudioSpeed]);

  // Session capture audio playback effect
  useEffect(() => {
    if (sessionIsPlayingAudio) {
      if (sessionAudioRef.current) {
        sessionAudioRef.current.pause();
        sessionAudioRef.current = null;
      }
      const rawUri =
        sessionVoiceUri ||
        sessionAttachedFiles.find((f) => f.type === 'audio')?.uri ||
        sessionAttachedFiles.find((f) => f.type === 'audio')?.url;

      const playableUrl = nativeStorageService.getWebViewUrl(rawUri || undefined);
      if (!playableUrl) {
        setSessionIsPlayingAudio(false);
        setSessionError('فایل صوتی برای پخش در دسترس نیست.');
        return;
      }

      const audio = new Audio(playableUrl);
      sessionAudioRef.current = audio;
      audio.onended = () => setSessionIsPlayingAudio(false);
      audio.onerror = () => {
        setSessionIsPlayingAudio(false);
        setSessionError('خطا در پخش فایل صوتی.');
      };
      audio.play().catch(() => setSessionIsPlayingAudio(false));
    } else {
      if (sessionAudioRef.current) {
        sessionAudioRef.current.pause();
        sessionAudioRef.current = null;
      }
    }
  }, [sessionIsPlayingAudio, sessionVoiceUri, sessionAttachedFiles]);

  // Reset chat viewer state when changing session
  useEffect(() => {
    if (chatAudioRef.current) {
      chatAudioRef.current.pause();
      chatAudioRef.current = null;
    }
    setChatAudioPlaying(false);
    setChatAudioSeconds(0);
    setChatFollowUps(selectedChatSessionLog?.chatMessages || []);
    setIsTimelineReminderOpen(false);
    setFileToast(null);
  }, [selectedChatSessionLog?.id]);

  // Voice recording ticker
  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (sessionIsRecording) {
      t = setInterval(() => {
        setSessionRecordSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(t);
  }, [sessionIsRecording]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { firstName?: string; lastName?: string } = {};
    const trimmedFirst = pFirstName.trim();
    const trimmedLast = pLastName.trim();

    if (!trimmedFirst) {
      errors.firstName = 'ورود نام الزامی است';
    } else if (!NAME_REGEX.test(trimmedFirst)) {
      errors.firstName = 'نام فقط باید شامل حروف (فارسی یا انگلیسی) باشد.';
    }

    if (!trimmedLast) {
      errors.lastName = 'ورود نام خانوادگی الزامی است';
    } else if (!NAME_REGEX.test(trimmedLast)) {
      errors.lastName = 'نام خانوادگی فقط باید شامل حروف (فارسی یا انگلیسی) باشد.';
    }

    if (Object.keys(errors).length > 0) {
      setPErrors(errors);
      return;
    }

    const updatedProfile = {
      firstName: trimmedFirst,
      lastName: trimmedLast,
      passedUnits: pPassedUnits.trim() || undefined,
    };
    setUserProfile(updatedProfile);
    setIsEditingProfile(false);
    syncBridge.performOptimisticSync(updatedProfile, classes, sessionLogs, currentThemeId);
  };

  const handleOpenAdd = () => {
    setEditingClass(null);
    setIsClassModalOpen(true);
  };

  const handleOpenEdit = (item: ClassItem) => {
    setEditingClass(item);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (classForNotif: ClassItem, isNew: boolean) => {
    let updatedClasses: ClassItem[];
    if (isNew) {
      updatedClasses = [classForNotif, ...classes];
    } else {
      updatedClasses = classes.map((c) => (c.id === classForNotif.id ? classForNotif : c));
    }

    // Immediate optimistic UI update
    setClasses(updatedClasses);
    setIsClassModalOpen(false);
    setEditingClass(null);

    // Asynchronous background persistence and notification scheduling
    (async () => {
      try {
        if (classForNotif.hasReminder) {
          // If editing, explicitly cancel previous occurrences first before scheduling new ones
          if (!isNew && editingClass) {
            await notificationService.cancelClassReminder(editingClass.id, editingClass);
          }
          await notificationService.scheduleClassReminder(classForNotif);
        } else if (!isNew) {
          await notificationService.cancelClassReminder(classForNotif.id, editingClass || undefined);
        }
      } catch (err) {
        console.warn('[ClassReminder] Schedule error:', err);
      }
      await persistenceAdapter.saveClasses(updatedClasses);
      syncBridge.pushLocalDeltas(userProfile, updatedClasses, sessionLogs, currentThemeId).catch(() => {});
    })();
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      const clsToDelete = classes.find((c) => c.id === deletingId);
      await notificationService.cancelClassReminder(deletingId, clsToDelete).catch(() => {});
      const logsToDelete = sessionLogs.filter((l) => l.classId === deletingId);
      for (const log of logsToDelete) {
        await notificationService.cancelReminder(log.id);
        if (log.voiceMemoUri) await nativeStorageService.deleteFile(log.voiceMemoUri);
        if (log.attachedFiles) {
          for (const f of log.attachedFiles) {
            if (f.uri) await nativeStorageService.deleteFile(f.uri);
          }
        }
      }
      const updatedClasses = classes.filter((c) => c.id !== deletingId);
      const updatedLogs = sessionLogs.filter((l) => l.classId !== deletingId);
      setClasses(updatedClasses);
      setSessionLogs(updatedLogs);
      persistenceAdapter.saveClasses(updatedClasses);
      persistenceAdapter.saveSessionLogs(updatedLogs);
      syncBridge.performOptimisticSync(userProfile, updatedClasses, updatedLogs, currentThemeId);
      setDeletingId(null);
    }
  };

  // Pick real native files from Android storage
  const handlePickNativeFiles = async () => {
    try {
      const picked = await filePickerService.pickFiles();
      if (picked.length > 0) {
        setSessionAttachedFiles((prev) => [...prev, ...picked]);
        setFileToast(`${picked.length} فایل واقعی از حافظه دستگاه پیوست گردید.`);
        setTimeout(() => setFileToast(null), 3000);
      }
    } catch (err: any) {
      setSessionError(err?.message || 'خطا در انتخاب فایل');
    }
  };

  // Universal File Upload & Quick Add (Web fallback)
  const handleNativeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const newFiles: AttachedFile[] = [];
      for (const file of files) {
        const cat = filePickerService.determineCategory(file.name, file.type);
        const sizeText = filePickerService.formatFileSize(file.size);
        const saved = await nativeStorageService.saveAttachment(undefined, file.name, file);
        newFiles.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type: cat,
          sizeText,
          uri: saved.persistentUri,
          url: saved.webViewUrl,
        });
      }
      setSessionAttachedFiles((prev) => [...prev, ...newFiles]);
      setFileToast(`${newFiles.length} فایل پیوست گردید.`);
      setTimeout(() => setFileToast(null), 3000);
      e.target.value = '';
    }
  };

  const handleOpenFileWeb = async (file: AttachedFile) => {
    try {
      await filePickerService.openWithNativeChooser(file);
    } catch (err: any) {
      setFileToast(err?.message || 'خطا در باز کردن فایل با برنامه‌های گوشی.');
      setTimeout(() => setFileToast(null), 3500);
    }
  };

  const handleSaveExactSessionReminder = async (timestamp: number, exactHour?: number, exactMinute?: number) => {
    if (!selectedChatSessionLog) return;
    const currentClass = classes.find((c) => c.id === selectedChatSessionLog.classId);
    try {
      const h = exactHour !== undefined ? exactHour : sessionPickerHour;
      const m = exactMinute !== undefined ? exactMinute : sessionPickerMin;
      const jDateStr = `${toPersianDigits(sessionPickerYear)}/${toPersianDigits(sessionPickerMonth.toString().padStart(2, '0'))}/${toPersianDigits(sessionPickerDay.toString().padStart(2, '0'))}`;
      const jTimeStr = `${toPersianDigits(h.toString().padStart(2, '0'))}:${toPersianDigits(m.toString().padStart(2, '0'))}`;
      const reminderTimeText = `${jDateStr} - ساعت ${jTimeStr}`;

      console.log(`[SESSION REMINDER] schedule requested for log ${selectedChatSessionLog.id} at ${jDateStr} ${jTimeStr} (ts: ${timestamp})`);

      await notificationService.scheduleReminder({
        id: selectedChatSessionLog.id,
        logId: selectedChatSessionLog.id,
        classId: selectedChatSessionLog.classId,
        className: selectedChatSessionLog.className,
        location: currentClass?.location,
        notesText: selectedChatSessionLog.notesText,
        trigger: 'زمان مشخص',
        exactTimestamp: timestamp,
        exactTime: jTimeStr,
        sessionDateStr: jDateStr,
        classTime: currentClass?.time,
        classDay: currentClass?.day,
      });

      console.log(`[SESSION REMINDER] native schedule returned successfully for log ${selectedChatSessionLog.id}`);

      const updatedLog: ClassSessionLog = {
        ...selectedChatSessionLog,
        hasReminder: true,
        reminderTimestamp: timestamp,
        reminderTrigger: 'زمان مشخص',
        reminderTimeText,
        notificationId: notificationService.getNotificationId(selectedChatSessionLog.id),
      };
      setSelectedChatSessionLog(updatedLog);
      const updatedLogs = sessionLogs.map((l) => (l.id === updatedLog.id ? updatedLog : l));
      setSessionLogs(updatedLogs);
      await persistenceAdapter.saveSessionLogs(updatedLogs);
      console.log(`[SESSION REMINDER] persisted for log ${selectedChatSessionLog.id}`);

      syncBridge.performOptimisticSync(userProfile, classes, updatedLogs, currentThemeId);
      setIsTimelineReminderOpen(false);
      setIsSessionDatePickerOpen(false);
      setIsSessionTimePickerOpen(false);
      setFileToast('یادآور دقیق جلسه با موفقیت تنظیم شد.');
      setTimeout(() => setFileToast(null), 2500);
    } catch (err: any) {
      console.error('[SESSION REMINDER] Error in handleSaveExactSessionReminder:', err);
      setFileToast(err?.message || 'خطا در فعال‌سازی یادآور');
      setTimeout(() => setFileToast(null), 3000);
    }
  };

  const handleToggleTimelineReminder = async () => {
    if (!selectedChatSessionLog) return;

    if (selectedChatSessionLog.hasReminder) {
      await notificationService.cancelReminder(selectedChatSessionLog.id);
      const updatedLog: ClassSessionLog = {
        ...selectedChatSessionLog,
        hasReminder: false,
        reminderTimestamp: undefined,
        reminderTrigger: undefined,
        reminderTimeText: undefined,
      };
      setSelectedChatSessionLog(updatedLog);
      const updatedLogs = sessionLogs.map((l) => (l.id === updatedLog.id ? updatedLog : l));
      setSessionLogs(updatedLogs);
      persistenceAdapter.saveSessionLogs(updatedLogs);
      syncBridge.performOptimisticSync(userProfile, classes, updatedLogs, currentThemeId);
      setFileToast('یادآور این جلسه لغو شد.');
      setTimeout(() => setFileToast(null), 2500);
    } else {
      setIsSessionDatePickerOpen(true);
    }
  };

  const handleDeleteSessionAudioWeb = async () => {
    if (!selectedChatSessionLog) return;
    if (selectedChatSessionLog.voiceMemoUri) {
      await nativeStorageService.deleteFile(selectedChatSessionLog.voiceMemoUri);
    }
    const cleanAttached = (selectedChatSessionLog.attachedFiles || []).filter((f) => f.type !== 'audio');
    const updatedLog: ClassSessionLog = {
      ...selectedChatSessionLog,
      voiceMemoSeconds: undefined,
      voiceMemoUri: undefined,
      attachedFiles: cleanAttached,
    };
    if (chatAudioRef.current) {
      chatAudioRef.current.pause();
      chatAudioRef.current = null;
    }
    setChatAudioPlaying(false);
    setChatAudioSeconds(0);
    setSelectedChatSessionLog(updatedLog);
    const updatedLogs = sessionLogs.map((l) => (l.id === updatedLog.id ? updatedLog : l));
    setSessionLogs(updatedLogs);
    syncBridge.performOptimisticSync(userProfile, classes, updatedLogs, currentThemeId);
    setFileToast('صوت ضبط شده جلسه و فایل فیزیکی آن حذف گردید.');
    setTimeout(() => setFileToast(null), 2500);
  };

  // Chat file input ref for native system file picking
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const handleChatNativeFilePicker = async () => {
    if (!selectedChatSessionLog) return;
    try {
      const picked = await filePickerService.pickFiles();
      if (picked.length > 0) {
        const updatedFiles = [...(selectedChatSessionLog.attachedFiles || []), ...picked];
        const updatedLog: ClassSessionLog = { ...selectedChatSessionLog, attachedFiles: updatedFiles };
        setSelectedChatSessionLog(updatedLog);
        const updatedLogs = sessionLogs.map((l) => (l.id === updatedLog.id ? updatedLog : l));
        setSessionLogs(updatedLogs);
        syncBridge.performOptimisticSync(userProfile, classes, updatedLogs, currentThemeId);
        setFileToast(`${picked.length} فایل واقعی از حافظه دستگاه پیوست گردید.`);
        setTimeout(() => setFileToast(null), 3000);
      }
    } catch (err: any) {
      setFileToast(err?.message || 'خطا در افزودن فایل به جلسه');
      setTimeout(() => setFileToast(null), 3000);
    }
  };

  const getJalaliDateNumeric = (d: Date = new Date()): string => {
    try {
      return new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }).format(d);
    } catch {
      return '1405/7/5';
    }
  };

  const truncateFileNameMiddle = (name: string, maxLen = 22): string => {
    if (!name || name.length <= maxLen) return name;
    const lastDot = name.lastIndexOf('.');
    const ext = lastDot !== -1 ? name.slice(lastDot) : '';
    const base = lastDot !== -1 ? name.slice(0, lastDot) : name;
    if (base.length <= 12) return name;
    const start = base.slice(0, 8);
    const end = base.slice(-4);
    return `${start}...${end}${ext}`;
  };

  const formatPersianReminderText = (trigger?: string, customText?: string): string => {
    const raw = (trigger || customText || '').trim().toLowerCase();
    if (!raw) return '۲۴ ساعت قبل از کلاس';

    const numMatch = raw.match(/(\d+)/);
    if (numMatch) {
      const num = numMatch[1];
      if (raw.includes('day') || raw.includes('روز')) {
        return `${num} روز قبل از کلاس`;
      }
      if (raw.includes('minute') || raw.includes('دقیقه')) {
        return `${num} دقیقه قبل از کلاس`;
      }
      return `${num} ساعت قبل از کلاس`;
    }

    if (raw.includes('same_day') || raw.includes('همان روز')) {
      return 'صبح همان روز کلاس';
    }
    if (raw.includes('night_before') || raw.includes('شب قبل')) {
      return 'شب قبل از کلاس';
    }
    return trigger || customText || '۲۴ ساعت قبل از کلاس';
  };

  const handleChatSystemFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedChatSessionLog) return;

    const newAttached: AttachedFile[] = [];
    for (const f of Array.from(files)) {
      const cat = filePickerService.determineCategory(f.name, f.type);
      const sizeText = filePickerService.formatFileSize(f.size);
      const saved = await nativeStorageService.saveAttachment(undefined, f.name, f);
      newAttached.push({
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: f.name,
        type: cat,
        sizeText,
        uri: saved.persistentUri,
        url: saved.webViewUrl,
      });
    }

    const updatedFiles = [...(selectedChatSessionLog.attachedFiles || []), ...newAttached];
    const updatedLog: ClassSessionLog = { ...selectedChatSessionLog, attachedFiles: updatedFiles };
    setSelectedChatSessionLog(updatedLog);
    const updatedLogs = sessionLogs.map((l) => (l.id === updatedLog.id ? updatedLog : l));
    setSessionLogs(updatedLogs);
    syncBridge.performOptimisticSync(userProfile, classes, updatedLogs, currentThemeId);
    setFileToast(`${newAttached.length} فایل واقعی از حافظه دستگاه پیوست گردید.`);
    setTimeout(() => setFileToast(null), 3000);

    if (e.target) e.target.value = '';
  };

  const handleDeleteSessionFileWeb = async (fileId: string) => {
    if (!selectedChatSessionLog) return;
    const fileToDelete = (selectedChatSessionLog.attachedFiles || []).find((f) => f.id === fileId);
    if (fileToDelete) {
      await filePickerService.deleteFile(fileToDelete);
    }
    const updatedFiles = (selectedChatSessionLog.attachedFiles || []).filter((f) => f.id !== fileId);
    const updatedLog: ClassSessionLog = {
      ...selectedChatSessionLog,
      attachedFiles: updatedFiles,
    };
    setSelectedChatSessionLog(updatedLog);
    const updatedLogs = sessionLogs.map((l) => (l.id === updatedLog.id ? updatedLog : l));
    setSessionLogs(updatedLogs);
    syncBridge.performOptimisticSync(userProfile, classes, updatedLogs, currentThemeId);
    setFileToast('فایل پیوست با موفقیت حذف گردید.');
    setTimeout(() => setFileToast(null), 2500);
  };

  const handleSendChatFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !selectedChatSessionLog) return;
    const newMsg = {
      id: Date.now().toString(),
      text: chatInputText.trim(),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };
    const updatedMessages = [...(selectedChatSessionLog.chatMessages || []), newMsg];
    setChatFollowUps(updatedMessages);
    setChatInputText('');

    const updatedLog: ClassSessionLog = {
      ...selectedChatSessionLog,
      chatMessages: updatedMessages,
    };
    setSelectedChatSessionLog(updatedLog);
    const updatedLogs = sessionLogs.map((l) => (l.id === updatedLog.id ? updatedLog : l));
    setSessionLogs(updatedLogs);
    persistenceAdapter.saveSessionLogs(updatedLogs);
    syncBridge.performOptimisticSync(userProfile, classes, updatedLogs, currentThemeId);
  };

  const handleToggleVoiceRecording = async () => {
    if (sessionIsRecording) {
      try {
        const result = await audioRecordingService.stop();
        setSessionIsRecording(false);
        setSessionDuration(result.durationSeconds);
        setSessionVoiceUri(result.persistentUri);
        // Part 11: The recorded session voice memo must NOT be inserted into attachedFiles.
        // It appears exclusively in the dedicated audio player.
        setFileToast('صوت جلسه با میکروفون دستگاه با موفقیت ضبط و ذخیره گردید.');
        setTimeout(() => setFileToast(null), 3000);
      } catch (err: any) {
        setSessionIsRecording(false);
        setSessionError(err?.message || 'خطا در توقف و پردازش ضبط صدا');
      }
    } else {
      try {
        setSessionError(null);
        await audioRecordingService.start();
        setSessionRecordSeconds(0);
        setSessionDuration(null);
        setSessionVoiceUri(null);
        setSessionIsRecording(true);
      } catch (err: any) {
        setSessionIsRecording(false);
        setSessionError(err?.message || 'عدم دسترسی به میکروفون');
      }
    }
  };

  const handleDeleteFullSessionLog = async (log: ClassSessionLog) => {
    // 1. Cancel notification
    await notificationService.cancelReminder(log.id);
    // 2. Delete physical audio
    if (log.voiceMemoUri) {
      await nativeStorageService.deleteFile(log.voiceMemoUri);
    }
    // 3. Delete physical attachments
    if (log.attachedFiles) {
      for (const f of log.attachedFiles) {
        if (f.uri) await nativeStorageService.deleteFile(f.uri);
      }
    }
    // 4. Update state and sync
    setSelectedChatSessionLog(null);
    const updatedLogs = sessionLogs.filter((l) => l.id !== log.id);
    setSessionLogs(updatedLogs);
    syncBridge.performOptimisticSync(userProfile, classes, updatedLogs, currentThemeId);
    setFileToast('جلسه درسی و کلیه فایل‌ها و یادآورهای آن با موفقیت حذف گردید.');
    setTimeout(() => setFileToast(null), 2500);
  };

  const handleSaveSessionLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionClassId) {
      setSessionError('لطفاً کلاس مربوطه را انتخاب کنید.');
      return;
    }
    if (!sessionNotesText.trim() && sessionAttachedFiles.length === 0 && !sessionDuration) {
      setSessionError('لطفاً حداقل یک فایل الصاق کرده یا یادداشت جلسه را وارد فرمایید.');
      return;
    }

    const currentClass = classes.find((c) => c.id === sessionClassId);
    const [gy, gm, gd] = jalaliToGregorian(sessionPickerYear, sessionPickerMonth, sessionPickerDay);
    const targetDate = new Date(gy, gm - 1, gd, sessionPickerHour, sessionPickerMin, 0);
    const exactTimestamp = targetDate.getTime();
    const jDateStr = `${toPersianDigits(sessionPickerYear)}/${toPersianDigits(sessionPickerMonth.toString().padStart(2, '0'))}/${toPersianDigits(sessionPickerDay.toString().padStart(2, '0'))}`;
    const jTimeStr = `${toPersianDigits(sessionPickerHour.toString().padStart(2, '0'))}:${toPersianDigits(sessionPickerMin.toString().padStart(2, '0'))}`;
    const reminderTimeText = `${jDateStr} - ساعت ${jTimeStr}`;

    const newLogId = Date.now().toString();
    const notificationId = sessionHasReminder ? notificationService.getNotificationId(newLogId) : undefined;

    // Clean up any duplicate records where attachedFiles contains the session voice memo
    const cleanAttachedFiles = sessionAttachedFiles.filter(
      (f) => !sessionVoiceUri || (f.uri !== sessionVoiceUri && f.url !== sessionVoiceUri)
    );

    const newLog: ClassSessionLog = {
      id: newLogId,
      classId: sessionClassId,
      className: currentClass?.name || 'کلاس عمومی',
      classCode: currentClass?.classCode,
      createdAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      notesText: sessionNotesText.trim(),
      attachedFiles: cleanAttachedFiles,
      voiceMemoSeconds: sessionDuration || undefined,
      voiceMemoUri: sessionVoiceUri || undefined,
      hasReminder: sessionHasReminder,
      reminderTimestamp: sessionHasReminder ? exactTimestamp : undefined,
      reminderTrigger: 'زمان مشخص',
      reminderTimeText: sessionHasReminder ? reminderTimeText : undefined,
      notificationId,
      chatMessages: [],
    };

    const updatedLogs = [newLog, ...sessionLogs];

    // Direct, sequential awaitable scheduling and persistence to guarantee native alarm registration
    if (sessionHasReminder) {
      try {
        console.log(`[SESSION REMINDER] schedule requested for new session log ${newLogId}`);
        await notificationService.scheduleReminder({
          id: newLogId,
          logId: newLogId,
          classId: sessionClassId,
          className: currentClass?.name || 'کلاس عمومی',
          location: currentClass?.location,
          notesText: sessionNotesText.trim(),
          trigger: 'زمان مشخص',
          exactTimestamp,
          exactTime: jTimeStr,
          sessionDateStr: jDateStr,
          classTime: currentClass?.time,
          classDay: currentClass?.day,
        });
        console.log(`[SESSION REMINDER] native schedule returned successfully for new session log ${newLogId}`);
      } catch (notifErr) {
        console.warn('[SessionCapture] Notification schedule notice:', notifErr);
      }
    }
    await persistenceAdapter.saveSessionLogs(updatedLogs);
    console.log(`[SESSION REMINDER] persisted session log ${newLogId}`);
    syncBridge.pushLocalDeltas(userProfile, classes, updatedLogs, currentThemeId).catch(() => {});

    // Update state and close modal cleanly after persistence is guaranteed
    setSessionLogs(updatedLogs);
    setSessionNotesText('');
    setSessionAttachedFiles([]);
    setSessionDuration(null);
    setSessionVoiceUri(null);
    setSessionRecordSeconds(0);
    setSessionIsRecording(false);
    setSessionHasReminder(true);
    setSessionError(null);
    setIsSessionCaptureOpen(false);
    setFileToast('جلسه درسی با موفقیت ذخیره گردید.');
    setTimeout(() => setFileToast(null), 2500);
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const filteredClasses = classes.filter((c) => {
    const matchesDay = selectedDayFilter === 'همه' || c.day === selectedDayFilter;
    if (!matchesDay) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    const nameMatch = c.name.toLowerCase().includes(query);
    const profMatch = c.professor ? c.professor.toLowerCase().includes(query) : false;
    return nameMatch || profMatch;
  });

  const deletingTargetClass = classes.find((c) => c.id === deletingId);

  const handleSelectTheme = useCallback((themeId: string) => {
    setCurrentThemeId(themeId);
    syncBridge.performOptimisticSync(userProfile, classes, sessionLogs, themeId);
  }, [userProfile, classes, sessionLogs]);

  // Academic metrics for Analytics tab
  const totalWeeklyHours = classes.length * 2;
  const remindersCount = sessionLogs.filter((s) => s.hasReminder).length;
  const dayBreakdown: Record<string, number> = {
    شنبه: 0,
    یکشنبه: 0,
    دوشنبه: 0,
    سه‌شنبه: 0,
    چهارشنبه: 0,
    پنج‌شنبه: 0,
  };
  classes.forEach((c) => {
    if (dayBreakdown[c.day] !== undefined) {
      dayBreakdown[c.day] += 1;
    }
  });

  // Radial Menu Items with Vector Icons (Strictly NO childish emojis)
  const RADIAL_ITEMS: { id: MainTab; label: string; icon: React.ReactNode; angleDeg: number }[] = [
    { id: 'home', label: 'داشبورد', icon: <Home className="w-5 h-5" />, angleDeg: 180 },
    { id: 'notes', label: 'یادداشت', icon: <Mic className="w-5 h-5" />, angleDeg: 135 },
    { id: 'reports', label: 'گزارشات', icon: <BarChart2 className="w-5 h-5" />, angleDeg: 90 },
    { id: 'profile', label: 'پروفایل', icon: <User className="w-5 h-5" />, angleDeg: 45 },
    { id: 'settings', label: 'تنظیمات پوسته', icon: <Palette className="w-5 h-5" />, angleDeg: 0 },
  ];

  const renderFileTypeTag = (type: FileCategory) => {
    const badges: Record<FileCategory, { tag: string; bg: string; color: string; lightColor: string }> = {
      pdf: { tag: 'PDF', bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', lightColor: '#DC2626' },
      powerpoint: { tag: 'PPTX', bg: 'rgba(249, 115, 22, 0.15)', color: '#F97316', lightColor: '#C2410C' },
      word: { tag: 'DOCX', bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', lightColor: '#1D4ED8' },
      image: { tag: 'IMG', bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', lightColor: '#047857' },
      audio: { tag: 'AUDIO', bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', lightColor: '#6D28D9' },
      other: { tag: 'FILE', bg: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8', lightColor: '#475569' },
    };
    const b = badges[type] || badges.other;
    return (
      <span
        style={{ backgroundColor: b.bg, color: theme.isDark ? b.color : b.lightColor }}
        className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
      >
        {b.tag}
      </span>
    );
  };

  // Pure Interactive "Made by null" branding footer
  const renderNullFooter = () => (
    <div className="flex flex-col items-center justify-center my-6 gap-2 select-none">
      {/* Strictly LTR, NO wrapper pill container, NO background borders, effects ONLY on "null" */}
      <div className="flex items-center justify-center py-1 select-none" dir="ltr">
        <span
          style={{ color: theme.textSecondary }}
          className="text-xs font-medium tracking-wide"
        >
          Made by{' '}
        </span>
        <a
          href="https://alireza81880.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: theme.primary, textDecoration: 'none' }}
          className="inline-flex items-center gap-1 ml-1.5 cursor-pointer transition-transform hover:scale-110 active:scale-95 group"
          aria-label="Visit null website profile"
        >
          <span
            className="sparkle-star text-xs font-black inline-block"
            style={{ color: theme.primary }}
          >
            ✦
          </span>
          <span
            className="shimmer-text font-black text-xs tracking-wider underline underline-offset-4"
            style={{
              textShadow: `0 0 12px ${theme.glowColor}`,
            }}
          >
            null
          </span>
          <span
            className="sparkle-star-delayed text-xs font-black inline-block"
            style={{ color: theme.secondaryAccent || theme.primaryLight }}
          >
            ✦
          </span>
        </a>
      </div>
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        backgroundImage: theme.canvasGradient || undefined,
        color: theme.textPrimary,
      }}
      className="min-h-screen flex flex-col items-center p-4 sm:p-6 transition-colors duration-300 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden selection:bg-blue-500/30"
      dir="rtl"
    >
      {/* Subtle Radial Glow Light in Background */}
      <div
        style={{
          background: `radial-gradient(circle at 50% 0%, ${theme.glowColor} 0%, transparent 70%)`,
        }}
        className="fixed top-0 left-0 right-0 h-96 pointer-events-none z-0 opacity-40 blur-3xl transform-gpu will-change-transform"
      />

      {/* TOP HEADER: Clean Brand Title & Student Name (Strictly NO technical badges or action icons) */}
      <header
        style={{ borderColor: theme.borderLuminous }}
        className="w-full max-w-4xl flex items-center justify-between py-4 mb-6 z-10 border-b"
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderLuminous,
              boxShadow: `0 0 16px ${theme.glowColor}`,
              color: theme.primary,
            }}
            className="w-11 h-11 rounded-2xl flex items-center justify-center border backdrop-blur-xl"
          >
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight" style={{ color: theme.textPrimary }}>
                DaneshMate
              </h1>
              {userProfile && (
                <span style={{ color: theme.textSecondary }} className="text-sm font-bold">
                  • {userProfile.firstName} {userProfile.lastName}
                </span>
              )}
            </div>
            <p style={{ color: theme.textSecondary }} className="text-xs font-semibold">
              سامانه هوشمند دانشجویی و مدیریت کلاس‌ها
            </p>
          </div>
        </div>

        {/* User Avatar Button (Header Profile Shortcut - Creative Cyber-Luxe Glass Avatar) */}
        {userProfile && (
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderLuminous,
              boxShadow: `0 2px 14px ${theme.glowColor}`,
            }}
            className="relative w-11 h-11 rounded-2xl border flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-xl group"
            title={`پروفایل ${userProfile.firstName} ${userProfile.lastName}`}
            aria-label="مشاهده پروفایل کاربر"
          >
            <span
              style={{ color: theme.primary }}
              className="relative flex items-center justify-center w-full h-full"
            >
              <User className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              {/* Active Student Status Dot */}
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span
                  style={{ backgroundColor: '#10B981' }}
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                />
                <span
                  style={{ backgroundColor: '#10B981' }}
                  className="relative inline-flex rounded-full h-2 w-2 border border-black/40"
                />
              </span>
            </span>
          </button>
        )}
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-4xl z-10 pb-32">
        {!userProfile || isEditingProfile ? (
          /* ONBOARDING PROFILE SETUP */
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderLuminous,
            }}
            className="liquid-glass rounded-3xl p-8 max-w-lg mx-auto mb-8 border transition-all"
          >
            <div
              style={{
                backgroundColor: theme.innerBg,
                color: theme.primary,
                borderColor: theme.borderLuminous,
              }}
              className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border"
            >
              <User className="w-8 h-8" />
            </div>
            <h2 style={{ color: theme.textPrimary }} className="text-xl font-black text-center mb-1">
              {userProfile ? 'ویرایش مشخصات دانشجو' : 'ثبت‌نام و راه‌اندازی DaneshMate'}
            </h2>
            <p style={{ color: theme.textSecondary }} className="text-xs text-center mb-6 leading-relaxed">
              {userProfile
                ? 'نام و مشخصات تحصیلی خود را بروزرسانی نمایید.'
                : 'برای فعال‌سازی سامانه، لطفاً نام خود را وارد فرمایید.'}
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                  نام <span className="text-rose-500">*</span>
                </label>
                <div
                  style={{
                    backgroundColor: theme.innerBg,
                    borderColor: pErrors.firstName ? '#EF4444' : theme.borderLuminous,
                  }}
                  className="rounded-2xl p-3 border"
                >
                  <input
                    type="text"
                    placeholder="فقط حروف فارسی یا انگلیسی"
                    value={pFirstName}
                    onChange={(e) => {
                      setPFirstName(e.target.value);
                      if (pErrors.firstName) setPErrors((p) => ({ ...p, firstName: undefined }));
                    }}
                    style={{ color: theme.textPrimary }}
                    className="w-full bg-transparent text-sm font-semibold outline-none text-right placeholder-slate-500"
                    autoFocus
                  />
                </div>
                {pErrors.firstName && (
                  <span className="text-xs text-rose-500 font-semibold block mt-1 text-right flex items-center justify-end gap-1">
                    <span>{pErrors.firstName}</span>
                    <AlertTriangle className="w-3 h-3 inline" />
                  </span>
                )}
              </div>

              <div>
                <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                  نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <div
                  style={{
                    backgroundColor: theme.innerBg,
                    borderColor: pErrors.lastName ? '#EF4444' : theme.borderLuminous,
                  }}
                  className="rounded-2xl p-3 border"
                >
                  <input
                    type="text"
                    placeholder="فقط حروف فارسی یا انگلیسی"
                    value={pLastName}
                    onChange={(e) => {
                      setPLastName(e.target.value);
                      if (pErrors.lastName) setPErrors((p) => ({ ...p, lastName: undefined }));
                    }}
                    style={{ color: theme.textPrimary }}
                    className="w-full bg-transparent text-sm font-semibold outline-none text-right placeholder-slate-500"
                  />
                </div>
                {pErrors.lastName && (
                  <span className="text-xs text-rose-500 font-semibold block mt-1 text-right flex items-center justify-end gap-1">
                    <span>{pErrors.lastName}</span>
                    <AlertTriangle className="w-3 h-3 inline" />
                  </span>
                )}
              </div>

              <div>
                <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                  تعداد واحدهای گذرانده (اختیاری)
                </label>
                <div
                  style={{
                    backgroundColor: theme.innerBg,
                    borderColor: theme.borderLuminous,
                  }}
                  className="rounded-2xl p-3 border"
                >
                  <input
                    type="text"
                    placeholder="مثال: ۸۴"
                    value={pPassedUnits}
                    onChange={(e) => setPPassedUnits(e.target.value)}
                    style={{ color: theme.textPrimary }}
                    className="w-full bg-transparent text-sm font-semibold outline-none text-right placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  style={{ backgroundColor: theme.primary }}
                  className="w-full py-3.5 rounded-2xl font-black text-sm text-white shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
                >
                  تأیید و ورود به داشبورد
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            {/* 1. DASHBOARD TAB */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                {/* Live Date Card */}
                <DashboardHeaderClock theme={theme} />

                {/* Academic Metrics Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderLuminous,
                      boxShadow: theme.shadowFlat,
                    }}
                    className="liquid-glass rounded-3xl p-5 border"
                  >
                    <span style={{ color: theme.textSecondary }} className="text-xs font-bold block mb-1">
                      واحدهای گذرانده
                    </span>
                    <span style={{ color: theme.textPrimary }} className="text-3xl font-black">
                      {userProfile.passedUnits || '—'}
                    </span>
                    <span style={{ color: theme.textSecondary }} className="text-[11px] font-semibold block mt-1">
                      ثبت شده در پروفایل
                    </span>
                  </div>

                  <div
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderLuminous,
                      boxShadow: theme.shadowFlat,
                    }}
                    className="liquid-glass rounded-3xl p-5 border"
                  >
                    <span style={{ color: theme.textSecondary }} className="text-xs font-bold block mb-1">
                      کلاس‌های فعال هفتگی
                    </span>
                    <span style={{ color: theme.primary }} className="text-3xl font-black">
                      {classes.length} درس
                    </span>
                    <span style={{ color: theme.textSecondary }} className="text-[11px] font-semibold block mt-1">
                      در برنامه مصوب
                    </span>
                  </div>

                  <div
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderLuminous,
                      boxShadow: theme.shadowFlat,
                    }}
                    className="liquid-glass rounded-3xl p-5 border"
                  >
                    <span style={{ color: theme.textSecondary }} className="text-xs font-bold block mb-1">
                      لاگ‌های چندرسانه‌ای
                    </span>
                    <span style={{ color: theme.secondaryAccent || theme.primaryLight }} className="text-3xl font-black">
                      {sessionLogs.length} ثبت
                    </span>
                    <span style={{ color: theme.textSecondary }} className="text-[11px] font-semibold block mt-1">
                      فایل‌ها، صوت و یادداشت‌ها
                    </span>
                  </div>
                </div>

                {/* Filter and Class Management */}
                <div
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderLuminous,
                    boxShadow: theme.shadowFlat,
                  }}
                  className="liquid-glass rounded-3xl p-6 border space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="w-full sm:w-auto flex items-center justify-between gap-4">
                      <div>
                        <h3 style={{ color: theme.textPrimary }} className="text-base font-black">
                          برنامه زمان‌بندی کلاس‌ها
                        </h3>
                        <p style={{ color: theme.textSecondary }} className="text-xs font-semibold">
                          مدیریت دوره‌ها، اساتید و محل تشکیل
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex items-center gap-2">
                      <button
                        onClick={handleOpenAdd}
                        style={{ backgroundColor: theme.primary }}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:opacity-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>افزودن کلاس جدید</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div
                    style={{
                      backgroundColor: theme.innerBg,
                      borderColor: theme.borderLuminous,
                    }}
                    className="rounded-2xl p-3 border flex items-center gap-2"
                  >
                    <Search style={{ color: theme.textSecondary }} className="w-4 h-4" />
                    <input
                      type="text"
                      placeholder="جستجوی سریع درس یا نام استاد..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ color: theme.textPrimary }}
                      className="w-full bg-transparent text-xs font-semibold outline-none text-right placeholder-slate-400 dark:placeholder-slate-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{ color: theme.textSecondary }}
                        className="hover:opacity-75 cursor-pointer p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Day Filters */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x">
                    {(['همه', ...WEEK_DAYS] as const).map((day) => {
                      const isSel = selectedDayFilter === day;
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDayFilter(day)}
                          style={{
                            backgroundColor: isSel ? theme.primary : theme.innerBg,
                            borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                            color: isSel ? '#FFFFFF' : theme.textPrimary,
                          }}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer shadow-xs"
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  {/* Class Cards List */}
                  {filteredClasses.length === 0 ? (
                    <div
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.borderLuminous,
                        boxShadow: theme.shadowPressed,
                      }}
                      className="p-10 rounded-3xl text-center border flex flex-col items-center justify-center space-y-3"
                    >
                      <div
                        style={{
                          backgroundColor: theme.cardBg,
                          borderColor: theme.borderLuminous,
                          color: theme.primary,
                        }}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm"
                      >
                        <BookOpen className="w-7 h-7" />
                      </div>
                      <h4 style={{ color: theme.textPrimary }} className="text-sm font-black">
                        {searchQuery ? `نتیجه‌ای برای «${searchQuery}» یافت نشد` : 'هنوز کلاسی ثبت نکرده‌اید'}
                      </h4>
                      <p style={{ color: theme.textSecondary }} className="text-xs max-w-sm leading-relaxed">
                        {searchQuery
                          ? 'می‌توانید عبارت جستجو را پاک کرده یا نام درس دیگری را امتحان کنید.'
                          : 'برای تعریف درس جدید، تعیین ساعات هفتگی و اساتید، روی دکمه «افزودن کلاس» ضربه بزنید.'}
                      </p>
                      <button
                        onClick={searchQuery ? () => setSearchQuery('') : handleOpenAdd}
                        style={{ backgroundColor: theme.primary }}
                        className="mt-2 px-5 py-2.5 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:opacity-95 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{searchQuery ? 'پاک کردن جستجو' : 'افزودن کلاس'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {filteredClasses.map((cls) => {
                        const recCfg = RECURRENCE_CONFIG[cls.recurrence];
                        return (
                          <div
                            key={cls.id}
                            style={{
                              backgroundColor: theme.innerBg,
                              borderColor: theme.borderLuminous,
                              boxShadow: theme.shadowFlat,
                            }}
                            className="rounded-2xl p-4 border flex flex-col justify-between transition-all"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 style={{ color: theme.textPrimary }} className="font-extrabold text-sm">
                                    {cls.name}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: theme.textSecondary }}>
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{cls.day} • {cls.time}</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <span
                                  style={{
                                    backgroundColor: recCfg.bg,
                                    color: theme.isDark ? recCfg.color : recCfg.lightColor,
                                  }}
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-black"
                                >
                                  {recCfg.label}
                                </span>
                                {cls.hasReminder && (
                                  (cls.recurrence !== 'every_week' && !cls.anchor_timestamp) ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(cls)}
                                      className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 text-[10px] font-bold flex items-center gap-1 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                                      title="برای فعال‌سازی آلارم یک هفته در میان، تاریخ اولین جلسه را مشخص فرمایید"
                                    >
                                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                                      <span>تعیین تاریخ اولین جلسه</span>
                                    </button>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-500 text-[10px] font-bold flex items-center gap-1 border border-rose-500/20">
                                      <Bell className="w-3 h-3" />
                                      <span>یادآور فعال</span>
                                    </span>
                                  )
                                )}
                              </div>
                            </div>

                            {(cls.professor || cls.location) && (
                              <div className="flex flex-wrap gap-2 text-[11px] mb-3">
                                {cls.professor && (
                                  <span
                                    style={{
                                      backgroundColor: theme.cardBg,
                                      color: theme.textPrimary,
                                      borderColor: theme.borderLuminous,
                                    }}
                                    className="px-2.5 py-1 rounded-md border flex items-center gap-1 font-semibold"
                                  >
                                    <User className="w-3 h-3 text-blue-500" />
                                    <span>استاد: {cls.professor}</span>
                                  </span>
                                )}
                                {cls.location && (
                                  <span
                                    style={{
                                      backgroundColor: theme.cardBg,
                                      color: theme.textPrimary,
                                      borderColor: theme.borderLuminous,
                                    }}
                                    className="px-2.5 py-1 rounded-md border flex items-center gap-1 font-semibold"
                                  >
                                    <MapPin className="w-3 h-3 text-emerald-500" />
                                    <span>محل: {cls.location}</span>
                                  </span>
                                )}
                              </div>
                            )}

                            <div
                              style={{
                                borderTopColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
                              }}
                              className="flex items-center justify-between gap-2 pt-3 mt-2 border-t"
                            >
                              <button
                                onClick={() => {
                                  setSessionClassId(cls.id);
                                  setIsSessionCaptureOpen(true);
                                }}
                                style={{ color: theme.primary }}
                                className="text-xs font-bold flex items-center gap-1 cursor-pointer hover:underline"
                              >
                                <Mic className="w-3.5 h-3.5" />
                                <span>ثبت لاگ جلسه</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenEdit(cls)}
                                  style={{
                                    backgroundColor: theme.cardBg,
                                    borderColor: theme.borderLuminous,
                                    color: theme.textPrimary,
                                  }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                                >
                                  <Edit2 className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                                  <span>ویرایش</span>
                                </button>
                                <button
                                  onClick={() => setDeletingId(cls.id)}
                                  style={{
                                    backgroundColor: theme.cardBg,
                                    borderColor: theme.borderLuminous,
                                    color: '#E11D48',
                                  }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer active:scale-95 hover:bg-rose-500/10 shadow-xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Compact Myket support card at bottom of Home tab */}
                <MyketSupportCard theme={theme} variant="compact" />
              </div>
            )}

            {/* 2. NOTES & MULTIMEDIA TAB */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderLuminous,
                  }}
                  className="liquid-glass rounded-3xl p-6 border"
                >
                  <div
                    style={{ borderColor: theme.borderLuminous }}
                    className="flex items-center justify-between pb-3 mb-4 border-b"
                  >
                    <h3 style={{ color: theme.textPrimary }} className="text-lg font-black">
                      یادداشت‌ها و رسانه کلاس‌ها
                    </h3>
                  </div>

                  {sessionLogs.length === 0 ? (
                    <div
                      style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                      className="p-10 rounded-2xl text-center border"
                    >
                      <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-blue-500/15 text-blue-500">
                        <Mic className="w-6 h-6" />
                      </div>
                      <h4 style={{ color: theme.textPrimary }} className="text-sm font-bold mb-1">
                        هنوز هیچ لاگ کلاسی ثبت نشده است
                      </h4>
                      <p style={{ color: theme.textSecondary }} className="text-xs font-semibold max-w-sm mx-auto mb-4">
                        هنگام برگزاری کلاس می‌توانید فایل‌های کلاسی، صدای استاد و نکات مهم را در یک نگاه ثبت فرمایید.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessionLogs.map((log) => {
                        const timeOnly = log.createdAt.split('-').pop()?.trim() || log.createdAt;
                        const dateOnly = log.createdAt.includes('/') ? log.createdAt.split('-')[0].trim() : getJalaliDateNumeric();
                        const fullNumericDate = `ثبت شده: ${dateOnly} - ${timeOnly}`;

                        return (
                          <div
                            key={log.id}
                            style={{
                              backgroundColor: theme.innerBg,
                              borderColor: theme.borderLuminous,
                              boxShadow: theme.shadowFlat,
                            }}
                            className="rounded-2xl p-4 border"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span style={{ color: theme.primary }} className="font-extrabold text-sm">
                                {log.className}
                              </span>
                              <span style={{ color: theme.textSecondary }} className="text-xs font-mono font-semibold">
                                {fullNumericDate}
                              </span>
                            </div>

                            {/* Attached files list (Excludes voice memo if present) */}
                            {(() => {
                              const docFiles = (log.attachedFiles || []).filter((f) => {
                                if (log.voiceMemoUri && (f.uri === log.voiceMemoUri || f.url === log.voiceMemoUri)) return false;
                                if ((log.voiceMemoUri || log.voiceMemoSeconds) && f.type === 'audio') return false;
                                return true;
                              });
                              if (docFiles.length === 0) return null;
                              return (
                                <div className="space-y-1.5 mb-3">
                                  {docFiles.map((file) => (
                                    <div
                                      key={file.id}
                                      onClick={() => handleOpenFileWeb(file)}
                                      style={{
                                        backgroundColor: theme.cardBg,
                                        borderColor: theme.borderLuminous,
                                      }}
                                      className="flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer hover:border-blue-500/40 transition-all group"
                                      title="مشاهده یا باز کردن فایل پیوست"
                                    >
                                      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 mr-2">
                                        {renderFileTypeTag(file.type)}
                                        <span style={{ color: theme.textPrimary }} className="font-semibold truncate group-hover:text-blue-400 transition-colors">
                                          {truncateFileNameMiddle(file.name, 24)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <span style={{ color: theme.textSecondary }} className="text-[10px] font-semibold whitespace-nowrap">
                                          {file.sizeText}
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-400 transition-colors" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}

                            {log.voiceMemoSeconds && (
                              <div className="flex items-center gap-2 mb-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                                <span style={{ color: theme.primary }} className="font-bold flex items-center gap-1.5">
                                  <Mic className="w-3.5 h-3.5" />
                                  <span>صوت ضبط شده جلسه ({formatTimer(log.voiceMemoSeconds)})</span>
                                </span>
                              </div>
                            )}

                            {log.notesText && (
                              <p style={{ color: theme.textPrimary }} className="text-xs font-medium leading-relaxed my-2">
                                {log.notesText}
                              </p>
                            )}

                            {log.hasReminder && (
                              <div
                                style={{
                                  borderTopColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
                                }}
                                className="flex items-center gap-1.5 pt-2 mt-2 border-t text-[11px] font-bold text-rose-500"
                              >
                                <Bell className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>یادآوری: {log.reminderTimeText || formatPersianReminderText(log.reminderTrigger, log.reminderTimeText)}</span>
                              </div>
                            )}

                            {/* Open Interactive Chat Timeline Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedChatSessionLog(log)}
                              style={{
                                backgroundColor: theme.cardBg,
                                borderColor: theme.borderLuminous,
                                color: theme.primary,
                              }}
                              className="w-full mt-3 py-2 px-3 rounded-xl border flex items-center justify-between text-xs font-bold cursor-pointer hover:opacity-85 transition-all active:scale-[0.99]"
                            >
                              <span className="flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>مرور تایملاین جلسه</span>
                              </span>
                              <span className="text-base font-black">‹</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bottom Glassmorphic Action Button for New Session Registration */}
                  <div className="pt-5">
                    <button
                      onClick={() => {
                        if (classes.length > 0) setSessionClassId(classes[0].id);
                        setIsSessionCaptureOpen(true);
                      }}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                        backdropFilter: 'blur(16px)',
                        borderColor: theme.borderLuminous,
                        color: theme.textPrimary,
                        boxShadow: theme.shadowFlat,
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl border flex items-center justify-center gap-2 text-sm font-black cursor-pointer hover:bg-white/12 active:scale-[0.98] transition-all group"
                    >
                      <Plus className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                      <span>ثبت جلسه جدید</span>
                    </button>
                  </div>
                </div>

                {/* Compact Myket support card at bottom of Notes tab */}
                <MyketSupportCard theme={theme} variant="compact" />
              </div>
            )}

            {/* 3. REPORTS & ANALYTICS TAB */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderLuminous,
                  }}
                  className="liquid-glass rounded-3xl p-6 border"
                >
                  <h3 style={{ color: theme.textPrimary }} className="text-lg font-black mb-1">
                    گزارشات و پایش تحصیلی
                  </h3>
                  <p style={{ color: theme.textSecondary }} className="text-xs font-semibold mb-6">
                    تحلیل بار کاری هفتگی، تراکم کلاس‌ها و آمادگی امتحانات
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div
                      style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                      className="p-4 rounded-2xl text-center border"
                    >
                      <span style={{ color: theme.textSecondary }} className="text-xs font-bold block mb-1">ساعات هفتگی</span>
                      <span style={{ color: theme.primary }} className="text-2xl font-black">{totalWeeklyHours} ساعت</span>
                    </div>

                    <div
                      style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                      className="p-4 rounded-2xl text-center border"
                    >
                      <span style={{ color: theme.textSecondary }} className="text-xs font-bold block mb-1">تعداد کلاس‌ها</span>
                      <span style={{ color: theme.textPrimary }} className="text-2xl font-black">{classes.length} جلسه</span>
                    </div>

                    <div
                      style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                      className="p-4 rounded-2xl text-center border"
                    >
                      <span style={{ color: theme.textSecondary }} className="text-xs font-bold block mb-1">یادآورهای فعال</span>
                      <span style={{ color: '#E11D48' }} className="text-2xl font-black">{remindersCount} هشدار</span>
                    </div>

                    <div
                      style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                      className="p-4 rounded-2xl text-center border"
                    >
                      <span style={{ color: theme.textSecondary }} className="text-xs font-bold block mb-1">واحدهای سپری شده</span>
                      <span style={{ color: theme.secondaryAccent || theme.primaryLight }} className="text-2xl font-black">
                        {userProfile.passedUnits || '—'}
                      </span>
                    </div>
                  </div>

                  <h4 style={{ color: theme.textPrimary }} className="text-sm font-black mb-3">
                    تراکم کلاس‌ها در طول هفته
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(dayBreakdown).map(([day, count]) => {
                      const pct = classes.length > 0 ? (count / classes.length) * 100 : 0;
                      return (
                        <div key={day} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span style={{ color: theme.textPrimary }}>{day}</span>
                            <span style={{ color: theme.textSecondary }}>{count} کلاس ({Math.round(pct)}%)</span>
                          </div>
                          <div
                            style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                            className="w-full h-2.5 rounded-full overflow-hidden border"
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                backgroundColor: count > 0 ? theme.primary : 'transparent',
                              }}
                              className="h-full rounded-full transition-all duration-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Compact Myket support card at bottom of Reports tab */}
                <MyketSupportCard theme={theme} variant="compact" />
              </div>
            )}

            {/* 4. PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderLuminous,
                  }}
                  className="liquid-glass rounded-3xl p-6 border"
                >
                  <div
                    style={{ borderColor: theme.borderLuminous }}
                    className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b"
                  >
                    <div
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.primary,
                        boxShadow: `0 0 24px ${theme.glowColor}`,
                      }}
                      className="w-20 h-20 rounded-3xl border-2 flex items-center justify-center text-2xl font-black shadow-lg relative group transition-transform duration-300 hover:scale-105"
                    >
                      <User className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" style={{ color: theme.primary }} />
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                        <span
                          style={{ backgroundColor: '#10B981' }}
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        />
                        <span
                          style={{ backgroundColor: '#10B981' }}
                          className="relative inline-flex rounded-full h-4 w-4 border-2 border-black/50"
                        />
                      </span>
                    </div>

                    <div className="flex-1 text-center sm:text-right">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                        <h3 style={{ color: theme.textPrimary }} className="text-xl font-black">
                          {userProfile.firstName} {userProfile.lastName}
                        </h3>
                        <span
                          style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: theme.primary }}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        >
                          دانشجوی DaneshMate ✦
                        </span>
                      </div>
                      <p style={{ color: theme.textSecondary }} className="text-xs font-semibold">
                        پنل مشخصات و آمار تحصیلی کاربر
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setPFirstName(userProfile.firstName);
                        setPLastName(userProfile.lastName);
                        setPPassedUnits(userProfile.passedUnits || '');
                        setIsEditingProfile(true);
                      }}
                      style={{
                        backgroundColor: theme.primary,
                      }}
                      className="px-4 py-2.5 rounded-2xl text-xs font-black text-white flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>ویرایش مشخصات</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-6 text-center">
                    <div
                      style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                      className="p-3.5 rounded-2xl border"
                    >
                      <span style={{ color: theme.textSecondary }} className="text-[11px] font-bold block mb-1">کلاس‌های هفتگی</span>
                      <span style={{ color: theme.primary }} className="text-xl font-black">{classes.length} درس</span>
                    </div>
                    <div
                      style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                      className="p-3.5 rounded-2xl border"
                    >
                      <span style={{ color: theme.textSecondary }} className="text-[11px] font-bold block mb-1">واحدهای گذرانده</span>
                      <span style={{ color: theme.textPrimary }} className="text-xl font-black">{userProfile.passedUnits || '—'}</span>
                    </div>
                    <div
                      style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                      className="p-3.5 rounded-2xl border"
                    >
                      <span style={{ color: theme.textSecondary }} className="text-[11px] font-bold block mb-1">لاگ‌های ثبت شده</span>
                      <span style={{ color: theme.primaryLight }} className="text-xl font-black">{sessionLogs.length} لاگ</span>
                    </div>
                  </div>
                </div>

                {/* Compact Myket support card at bottom of Profile tab */}
                <MyketSupportCard theme={theme} variant="compact" />
              </div>
            )}

            {/* 5. SETTINGS TAB: MODULAR SETTINGS SCREEN (THEME ENGINE & UPDATE SYSTEM) */}
            {activeTab === 'settings' && (
              <SettingsScreen
                theme={theme}
                currentThemeId={currentThemeId}
                onSelectTheme={handleSelectTheme}
              />
            )}

            {/* Interactive "Made by null" branding footer visible across all tabs */}
            {renderNullFooter()}
          </div>
        )}

        {/* MULTIMODAL CLASS SESSION CAPTURE MODAL */}
        {isSessionCaptureOpen && (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderLuminous,
              }}
              className="liquid-glass rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border shadow-2xl transition-all"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <h3 style={{ color: theme.textPrimary }} className="text-base font-black">
                  ثبت جلسه و رسانه چندرسانه‌ای
                </h3>
                <button
                  onClick={() => setIsSessionCaptureOpen(false)}
                  style={{ color: theme.textSecondary }}
                  className="p-1 rounded-lg hover:opacity-75 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {sessionError && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold text-right">
                  {sessionError}
                </div>
              )}

              <form onSubmit={handleSaveSessionLog} className="space-y-4">
                {/* 1. Class Target Selector */}
                <div>
                  <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                    کلاس مربوطه <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {classes.map((cls) => {
                      const isSel = sessionClassId === cls.id;
                      return (
                        <button
                          type="button"
                          key={cls.id}
                          onClick={() => setSessionClassId(cls.id)}
                          style={{
                            backgroundColor: isSel ? theme.primary : theme.innerBg,
                            borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                            color: isSel ? '#FFFFFF' : theme.textPrimary,
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap cursor-pointer transition-all"
                        >
                          {cls.name} ({cls.day})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Simplified & Clean File Attachments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label style={{ color: theme.textPrimary }} className="text-xs font-bold text-right">
                      پیوست‌های جلسه
                    </label>
                    {sessionAttachedFiles.length > 0 && (
                      <span style={{ color: theme.primary }} className="text-[11px] font-bold">
                        {sessionAttachedFiles.length} فایل پیوست شده
                      </span>
                    )}
                  </div>

                  {/* Attached File-Chips UI */}
                  {sessionAttachedFiles.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 mb-2">
                      {sessionAttachedFiles.map((file) => (
                        <div
                          key={file.id}
                          style={{
                            backgroundColor: theme.innerBg,
                            borderColor: theme.borderLuminous,
                          }}
                          className="flex items-center justify-between p-2 rounded-xl border text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {renderFileTypeTag(file.type)}
                            <span style={{ color: theme.textPrimary }} className="font-semibold truncate">
                              {file.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: theme.textMuted }} className="text-[10px]">
                              {file.sizeText}
                            </span>
                            <button
                              type="button"
                              onClick={async () => {
                                if (file.uri) {
                                  await nativeStorageService.deleteFile(file.uri);
                                }
                                setSessionAttachedFiles((prev) => prev.filter((f) => f.id !== file.id));
                              }}
                              className="text-slate-400 hover:text-rose-400 cursor-pointer p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                      className="p-3 rounded-xl border text-center text-xs text-slate-500 mb-2"
                    >
                      هیچ فایلی پیوست نشده است. می‌توانید جزوات، اسلایدها و تصاویر تخته را اضافه کنید.
                    </div>
                  )}

                  {/* Clean Bottom-Anchored Neumorphic/Glass Action Button */}
                  <label
                    onClick={(e) => {
                      if (Capacitor.isNativePlatform()) {
                        e.preventDefault();
                        handlePickNativeFiles();
                      }
                    }}
                    style={{
                      backgroundColor: theme.innerBg,
                      borderColor: theme.primary,
                      color: theme.primary,
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs font-black cursor-pointer hover:opacity-90 transition-all shadow-sm active:scale-[0.99]"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span>انتخاب و پیوست فایل</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleNativeFileUpload}
                      className="hidden"
                      accept="image/*,audio/*,.pdf,.ppt,.pptx,.doc,.docx"
                    />
                  </label>
                </div>

                {/* 3. Live Voice Recording Widget */}
                <div>
                  <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                    ضبط صدای جلسه (Voice Memo Widget)
                  </label>
                  <div
                    style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                    className="p-3.5 rounded-2xl border flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={handleToggleVoiceRecording}
                      style={{
                        backgroundColor: sessionIsRecording ? '#EF4444' : theme.primary,
                      }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg shadow-md cursor-pointer hover:opacity-95"
                    >
                      {sessionIsRecording ? <Pause className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <div className="flex-1 text-right">
                      <div style={{ color: theme.textPrimary }} className="text-xs font-bold font-mono">
                        {sessionIsRecording
                          ? `در حال ضبط زنده: ${formatTimer(sessionRecordSeconds)}`
                          : sessionDuration
                          ? `صوت ضبط شده: ${formatTimer(sessionDuration)} (به فایل‌ها الصاق شد)`
                          : 'برای ضبط صدای استاد کلیک کنید'}
                      </div>
                      <span style={{ color: theme.textMuted }} className="text-[10px] block">
                        {sessionIsRecording
                          ? 'روی کلید کلیک کنید تا متوقف شود'
                          : 'صوت ضبط شده به صورت خودکار به لیست الصاقات افزوده می‌شود'}
                      </span>
                    </div>

                    {sessionDuration && !sessionIsRecording && (
                      <button
                        type="button"
                        onClick={() => setSessionIsPlayingAudio(!sessionIsPlayingAudio)}
                        style={{ backgroundColor: theme.cardBg }}
                        className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {sessionIsPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{sessionIsPlayingAudio ? 'توقف' : 'پخش'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. Rich Multi-line Session Notes */}
                <div>
                  <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                    یادداشت تشریحی و خلاصه درس (Rich Session Notes)
                  </label>
                  <div
                    style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                    className="rounded-2xl p-3 border"
                  >
                    <textarea
                      rows={3}
                      value={sessionNotesText}
                      onChange={(e) => setSessionNotesText(e.target.value)}
                      placeholder="شرح تکالیف، نکات کلیدی مطرح‌شده در جلسه، سرفصل‌های کوئیز..."
                      style={{ color: theme.textPrimary }}
                      className="w-full bg-transparent text-xs font-medium outline-none text-right placeholder-slate-500 resize-none"
                    />
                  </div>
                </div>

                {/* 5. Session Reminder & Alert Triggers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: theme.textPrimary }} className="text-xs font-bold">
                      تنظیم یادآور جلسه
                    </span>
                    <button
                      type="button"
                      onClick={() => setSessionHasReminder(!sessionHasReminder)}
                      style={{
                        backgroundColor: sessionHasReminder ? theme.primary : theme.innerBg,
                        borderColor: theme.borderLuminous,
                        color: sessionHasReminder ? '#FFFFFF' : theme.textMuted,
                      }}
                      className="px-3 py-1 rounded-xl text-xs font-bold border cursor-pointer transition-all"
                    >
                      {sessionHasReminder ? 'فعال ✓' : 'غیرفعال'}
                    </button>
                  </div>

                  {sessionHasReminder && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Date Selector Button */}
                        <button
                          type="button"
                          onClick={() => setIsSessionDatePickerOpen(true)}
                          style={{
                            backgroundColor: theme.innerBg,
                            borderColor: theme.borderLuminous,
                            color: theme.textPrimary,
                          }}
                          className="p-2.5 rounded-xl border text-right transition-all cursor-pointer hover:border-sky-400/50 flex flex-col gap-0.5 group active:scale-98"
                        >
                          <span style={{ color: theme.textMuted }} className="text-[9.5px] font-bold">
                            تاریخ یادآوری
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black font-mono text-sky-400">
                              {toPersianDigits(sessionPickerYear)}/{toPersianDigits(sessionPickerMonth.toString().padStart(2, '0'))}/{toPersianDigits(sessionPickerDay.toString().padStart(2, '0'))}
                            </span>
                            <Calendar className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                          </div>
                        </button>

                        {/* Time Selector Button */}
                        <button
                          type="button"
                          onClick={() => setIsSessionTimePickerOpen(true)}
                          style={{
                            backgroundColor: theme.innerBg,
                            borderColor: theme.borderLuminous,
                            color: theme.textPrimary,
                          }}
                          className="p-2.5 rounded-xl border text-right transition-all cursor-pointer hover:border-sky-400/50 flex flex-col gap-0.5 group active:scale-98"
                        >
                          <span style={{ color: theme.textMuted }} className="text-[9.5px] font-bold">
                            ساعت یادآوری
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black font-mono text-sky-400 [direction:ltr]">
                              {toPersianDigits(sessionPickerHour.toString().padStart(2, '0'))}:{toPersianDigits(sessionPickerMin.toString().padStart(2, '0'))}
                            </span>
                            <Clock className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                          </div>
                        </button>
                      </div>

                      <p style={{ color: theme.textMuted }} className="text-[10px] text-right font-medium">
                        💡 یادآور یک‌باره این جلسه در تاریخ {toPersianDigits(sessionPickerDay)} {PERSIAN_MONTHS[sessionPickerMonth - 1]} رأس ساعت {toPersianDigits(sessionPickerHour.toString().padStart(2, '0'))}:{toPersianDigits(sessionPickerMin.toString().padStart(2, '0'))} ارسال خواهد شد.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsSessionCaptureOpen(false)}
                    style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                    className="flex-1 py-3 rounded-2xl font-bold text-xs border cursor-pointer text-slate-400"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: theme.primary }}
                    className="flex-1 py-3 rounded-2xl font-black text-xs text-white shadow-lg cursor-pointer hover:opacity-95"
                  >
                    ذخیره لاگ و الصاقات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CLASS ADD/EDIT MODAL (Isolated Component) */}
        <ClassFormModal
          isOpen={isClassModalOpen}
          onClose={() => {
            setIsClassModalOpen(false);
            setEditingClass(null);
          }}
          editingClass={editingClass}
          classes={classes}
          theme={theme}
          onSave={handleSaveClass}
        />

        {/* DELETE CONFIRMATION MODAL */}
        {deletingId && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderLuminous,
              }}
              className="liquid-glass rounded-3xl p-6 max-w-sm w-full border text-center shadow-2xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 style={{ color: theme.textPrimary }} className="text-base font-black mb-2">
                حذف درس از برنامه
              </h3>
              <p style={{ color: theme.textSecondary }} className="text-xs leading-relaxed mb-6">
                آیا از حذف {deletingTargetClass ? `کلاس «${deletingTargetClass.name}»` : 'این کلاس'} اطمینان دارید؟
                لاگ‌های ثبت شده این درس نیز حذف خواهند شد.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                  className="flex-1 py-3 rounded-xl font-bold text-xs border cursor-pointer text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 rounded-xl font-black text-xs text-white bg-rose-600 shadow-md cursor-pointer hover:bg-rose-700"
                >
                  حذف نهایی
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INTERACTIVE CHAT-STYLE SESSION VIEWER MODAL */}
        {selectedChatSessionLog && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderLuminous,
              }}
              className="liquid-glass rounded-3xl max-w-xl w-full h-[92vh] max-h-[850px] border shadow-2xl flex flex-col overflow-hidden transition-all"
            >
              {/* Top Navigation Header (Distinct Two-Row Layout) */}
              <div
                style={{
                  backgroundColor: theme.innerBg,
                  borderBottomColor: theme.borderLuminous,
                }}
                className="p-3.5 border-b space-y-2.5 flex-shrink-0"
              >
                {/* Row 1: Top Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedChatSessionLog(null)}
                    style={{ color: theme.primary, borderColor: theme.borderLuminous }}
                    className="flex items-center gap-1 text-xs font-black cursor-pointer hover:opacity-80 py-1.5 px-3 rounded-xl border bg-black/10"
                  >
                    <span className="text-base font-bold">›</span>
                    <span>بازگشت</span>
                  </button>

                  <button
                    onClick={() => {
                      if (selectedChatSessionLog) {
                        handleDeleteFullSessionLog(selectedChatSessionLog);
                      }
                    }}
                    className="flex items-center gap-1.5 text-rose-400 hover:text-rose-500 text-xs font-bold cursor-pointer py-1.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف جلسه</span>
                  </button>
                </div>

                {/* Row 2: Class Title & Numeric Jalali Timestamp Banner (e.g. 1405/7/5) */}
                <div
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.borderLuminous }}
                  className="p-2.5 rounded-xl border text-center"
                >
                  <h3 style={{ color: theme.textPrimary }} className="text-sm font-black flex items-center justify-center gap-1.5">
                    <span>🎓</span>
                    <span>{selectedChatSessionLog.className}</span>
                  </h3>
                  <span style={{ color: theme.textMuted }} className="text-[11px] font-mono block mt-0.5">
                    تایم‌لاین تعاملی جلسه • {getJalaliDateNumeric()} • ساعت {selectedChatSessionLog.createdAt.split('-').pop()?.trim() || selectedChatSessionLog.createdAt}
                  </span>
                </div>
              </div>

              {/* Toast for file opening intent */}
              {fileToast && (
                <div
                  style={{ backgroundColor: theme.primary }}
                  className="py-1.5 px-4 text-center text-xs font-bold text-white shadow-sm transition-all"
                >
                  {fileToast}
                </div>
              )}

              {/* Chat Timeline Stream */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-4 space-y-3 sm:space-y-4">
                {/* Date Separator Pill */}
                <div className="flex justify-center">
                  <span
                    style={{
                      backgroundColor: theme.innerBg,
                      borderColor: theme.borderLuminous,
                      color: theme.textSecondary,
                    }}
                    className="px-3 py-1 rounded-full text-[11px] font-bold border font-mono"
                  >
                    {selectedChatSessionLog.createdAt.includes('/') ? selectedChatSessionLog.createdAt.split('-')[0].trim() : getJalaliDateNumeric()}
                  </span>
                </div>

                {/* 1. Concise System Welcome Badge */}
                <div className="flex justify-center">
                  <div
                    style={{
                      backgroundColor: theme.innerBg,
                      borderColor: theme.borderLuminous,
                      color: theme.textSecondary,
                    }}
                    className="px-4 py-2 rounded-2xl border text-xs font-bold text-center max-w-md shadow-xs"
                  >
                    ✦ جلسه «{selectedChatSessionLog.className}»
                  </div>
                </div>

                {/* 2. Interactive Voice Memo Chat Bubble */}
                {selectedChatSessionLog.voiceMemoSeconds && (
                  <div className="flex items-start gap-2 sm:gap-2.5 w-full min-w-0 max-w-full">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400 border border-purple-500/30 flex-shrink-0 mt-1">
                      <Mic className="w-4 h-4" />
                    </div>

                    <div
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.borderLuminous,
                      }}
                      className="flex-1 min-w-0 max-w-full rounded-2xl p-2.5 sm:p-3.5 border shadow-sm overflow-hidden"
                    >
                      {/* Bubble Header: Title on Right, Date on Top-Left */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 gap-2 min-w-0">
                        <span className="text-xs font-black text-purple-400 truncate min-w-0">
                          صوت ضبط شده جلسه
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span style={{ color: theme.textMuted }} className="text-[10px] font-mono whitespace-nowrap">
                            {selectedChatSessionLog.createdAt.includes('/') ? selectedChatSessionLog.createdAt.split('-')[0].trim() : getJalaliDateNumeric()}
                          </span>
                          <button
                            type="button"
                            onClick={handleDeleteSessionAudioWeb}
                            className="p-1 rounded-lg hover:bg-rose-500/15 text-rose-400 cursor-pointer transition-colors"
                            title="حذف صوت ضبط شده"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Inline Audio Player Widget */}
                      <div
                        style={{ backgroundColor: theme.cardBg, borderColor: theme.borderLuminous }}
                        className="rounded-xl p-3 border space-y-2.5 w-full min-w-0"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setChatAudioPlaying(!chatAudioPlaying)}
                            style={{ backgroundColor: theme.primary }}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 cursor-pointer shadow-md hover:opacity-90 active:scale-95"
                          >
                            {chatAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-[-1px]" />}
                          </button>

                          <div className="flex-1 space-y-1.5 min-w-0">
                            {/* Animated sound wave bars */}
                            <div className="flex items-center justify-between h-4 px-1 gap-1">
                              {[35, 75, 25, 95, 60, 100, 45, 80, 50, 70, 90, 40, 85].map((h, i) => (
                                <span
                                  key={i}
                                  style={{
                                    height: chatAudioPlaying ? `${h}%` : '20%',
                                    backgroundColor: chatAudioPlaying ? theme.primary : theme.textMuted,
                                    width: '3px',
                                  }}
                                  className="rounded-full transition-all duration-300"
                                />
                              ))}
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.round(
                                      (chatAudioSeconds / (selectedChatSessionLog.voiceMemoSeconds || 60)) * 100
                                    )
                                  )}%`,
                                  backgroundColor: theme.primary,
                                }}
                                className="h-full rounded-full transition-all duration-200"
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span style={{ color: theme.textMuted }}>
                                {formatTimer(chatAudioSeconds)} / {formatTimer(selectedChatSessionLog.voiceMemoSeconds)}
                              </span>
                              <span style={{ color: chatAudioPlaying ? theme.primary : theme.textMuted }} className="font-bold">
                                {chatAudioPlaying ? 'درحال پخش...' : 'متوقف'}
                              </span>
                            </div>
                          </div>

                          {/* Speed Toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              if (chatAudioSpeed === 1) setChatAudioSpeed(1.5);
                              else if (chatAudioSpeed === 1.5) setChatAudioSpeed(2);
                              else setChatAudioSpeed(1);
                            }}
                            style={{
                              backgroundColor: theme.innerBg,
                              borderColor: theme.borderLuminous,
                              color: theme.primary,
                            }}
                            className="px-2 py-1 rounded-lg border text-[10px] font-black cursor-pointer hover:border-white/20 flex-shrink-0"
                          >
                            {chatAudioSpeed}x
                          </button>
                        </div>
                      </div>

                      {/* Bubble Footer: Time on Bottom-Left */}
                      <div className="flex justify-start pt-1.5 mt-1 border-t border-white/5">
                        <span style={{ color: theme.textMuted }} className="text-[10px] font-mono">
                          {selectedChatSessionLog.createdAt.split('-').pop()?.trim() || selectedChatSessionLog.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Interactive Documents & Slides Bubbles (Excludes voice memo if present) */}
                {(() => {
                  const chatDocFiles = (selectedChatSessionLog.attachedFiles || []).filter((f) => {
                    if (selectedChatSessionLog.voiceMemoUri && (f.uri === selectedChatSessionLog.voiceMemoUri || f.url === selectedChatSessionLog.voiceMemoUri)) return false;
                    if ((selectedChatSessionLog.voiceMemoUri || selectedChatSessionLog.voiceMemoSeconds) && f.type === 'audio') return false;
                    return true;
                  });
                  if (chatDocFiles.length === 0) return null;
                  return (
                    <div className="flex items-start gap-2 sm:gap-2.5 w-full min-w-0 max-w-full">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0 mt-1">
                        <Paperclip className="w-4 h-4" />
                      </div>

                      <div
                        style={{
                          backgroundColor: theme.innerBg,
                          borderColor: theme.borderLuminous,
                        }}
                        className="flex-1 min-w-0 max-w-full rounded-2xl p-2.5 sm:p-3.5 border shadow-sm overflow-hidden"
                      >
                        {/* Bubble Header: Title on Right, Date on Top-Left */}
                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/5 gap-2 min-w-0">
                          <span className="text-xs font-black text-blue-400 truncate min-w-0">
                            مستندات و فایل‌های کلاسی ({chatDocFiles.length})
                          </span>
                          <span style={{ color: theme.textMuted }} className="text-[10px] font-mono whitespace-nowrap flex-shrink-0">
                            {selectedChatSessionLog.createdAt.includes('/') ? selectedChatSessionLog.createdAt.split('-')[0].trim() : getJalaliDateNumeric()}
                          </span>
                        </div>

                        <div className="space-y-2 w-full min-w-0">
                          {chatDocFiles.map((file) => (
                          <div
                            key={file.id}
                            style={{
                              backgroundColor: theme.cardBg,
                              borderColor: theme.borderLuminous,
                            }}
                            className="p-2 sm:p-2.5 rounded-xl border flex items-center justify-between gap-1.5 sm:gap-2 transition-all group w-full min-w-0 max-w-full box-border"
                          >
                            <div
                              onClick={() => handleOpenFileWeb(file)}
                              className="flex items-center gap-1.5 sm:gap-2 overflow-hidden cursor-pointer flex-1 min-w-0"
                              title={file.name}
                            >
                              <div className="shrink-0">{renderFileTypeTag(file.type)}</div>
                              <span
                                style={{ color: theme.textPrimary }}
                                className="text-xs font-bold truncate group-hover:text-blue-400 transition-colors min-w-0 flex-1"
                              >
                                {truncateFileNameMiddle(file.name, 14)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                              <span style={{ color: theme.textMuted }} className="text-[10px] whitespace-nowrap hidden sm:inline">
                                {file.sizeText}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenFileWeb(file)}
                                className="p-2 sm:p-1.5 hover:bg-blue-500/15 rounded-xl text-blue-400 cursor-pointer shrink-0 transition-all active:scale-95 flex items-center justify-center"
                                title="باز کردن فایل"
                                aria-label="باز کردن فایل"
                              >
                                <ExternalLink className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSessionFileWeb(file.id);
                                }}
                                className="p-2 sm:p-1.5 bg-rose-500/15 hover:bg-rose-500/25 rounded-xl text-rose-400 cursor-pointer transition-all active:scale-95 shrink-0 flex items-center justify-center border border-rose-500/20"
                                title="حذف فایل پیوست"
                                aria-label="حذف فایل پیوست"
                              >
                                <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bubble Footer: Time on Bottom-Left */}
                      <div className="flex justify-start pt-2 mt-2 border-t border-white/5">
                        <span style={{ color: theme.textMuted }} className="text-[10px] font-mono">
                          {selectedChatSessionLog.createdAt.split('-').pop()?.trim() || selectedChatSessionLog.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {/* 4. Lecture Notes Message Bubble */}
                {selectedChatSessionLog.notesText && (
                  <div className="flex items-start gap-2 sm:gap-2.5 w-full min-w-0 max-w-full">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0 mt-1">
                      <FileText className="w-4 h-4" />
                    </div>

                    <div
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.borderLuminous,
                      }}
                      className="flex-1 min-w-0 max-w-full rounded-2xl p-2.5 sm:p-3.5 border shadow-sm overflow-hidden"
                    >
                      {/* Bubble Header: Title on Right, Date on Top-Left */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 gap-2 min-w-0">
                        <span className="text-xs font-black text-emerald-400 truncate min-w-0">
                          نکات و خلاصه تدریس استاد
                        </span>
                        <span style={{ color: theme.textMuted }} className="text-[10px] font-mono whitespace-nowrap flex-shrink-0">
                          {selectedChatSessionLog.createdAt.includes('/') ? selectedChatSessionLog.createdAt.split('-')[0].trim() : getJalaliDateNumeric()}
                        </span>
                      </div>

                      <p style={{ color: theme.textPrimary }} className="text-xs leading-relaxed break-words py-1">
                        {selectedChatSessionLog.notesText}
                      </p>

                      {/* Bubble Footer: Time on Bottom-Left */}
                      <div className="flex justify-start pt-1.5 mt-1 border-t border-white/5">
                        <span style={{ color: theme.textMuted }} className="text-[10px] font-mono">
                          {selectedChatSessionLog.createdAt.split('-').pop()?.trim() || selectedChatSessionLog.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Interactive Session Reminder Controller in Timeline (Problem 6) */}
                <div className="w-full min-w-0 max-w-full">
                  {selectedChatSessionLog.hasReminder ? (
                    <div className="flex items-start gap-2 sm:gap-2.5 w-full min-w-0 max-w-full">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0 mt-1">
                        <Bell className="w-4 h-4" />
                      </div>

                      <div
                        style={{
                          backgroundColor: theme.innerBg,
                          borderColor: 'rgba(244, 63, 94, 0.3)',
                        }}
                        className="flex-1 min-w-0 max-w-full rounded-2xl p-2.5 sm:p-3.5 border shadow-sm overflow-hidden"
                      >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 gap-2 min-w-0">
                          <span className="text-xs font-black text-rose-400 flex items-center gap-1.5 truncate min-w-0">
                            <span>یادآور این جلسه</span>
                          </span>
                          <span style={{ color: theme.textMuted }} className="text-[10px] font-mono whitespace-nowrap flex-shrink-0">
                            {selectedChatSessionLog.createdAt.includes('/') ? selectedChatSessionLog.createdAt.split('-')[0].trim() : getJalaliDateNumeric()}
                          </span>
                        </div>

                        <div className="text-right py-1 space-y-0.5 min-w-0">
                          <span style={{ color: theme.textMuted }} className="text-[10px] font-bold block">
                            یادآوری:
                          </span>
                          <div className="text-xs font-black text-sky-400 break-words">
                            {selectedChatSessionLog.reminderTimeText || formatPersianReminderText(selectedChatSessionLog.reminderTrigger, selectedChatSessionLog.reminderTimeText)}
                          </div>
                        </div>

                        {/* Action buttons: [ ویرایش ] and [ لغو یادآور ] (Part 12) */}
                        <div className="flex items-center gap-2 pt-2 mt-2 border-t border-white/5 w-full min-w-0">
                          <button
                            type="button"
                            onClick={() => setIsSessionDatePickerOpen(true)}
                            style={{
                              backgroundColor: theme.innerBg,
                              borderColor: theme.borderLuminous,
                              color: theme.textPrimary,
                            }}
                            className="flex-1 min-w-0 py-2 px-2.5 rounded-xl text-xs font-bold border hover:border-white/30 cursor-pointer transition-colors text-center"
                          >
                            ✏️ ویرایش
                          </button>
                          <button
                            type="button"
                            onClick={handleToggleTimelineReminder}
                            className="flex-1 min-w-0 py-2 px-2.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer transition-colors text-center"
                          >
                            🔕 لغو یادآور
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.borderLuminous,
                      }}
                      className="rounded-2xl p-3 border flex items-center justify-between gap-2 w-full min-w-0 max-w-full"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-500/20 text-slate-400 flex-shrink-0">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <span style={{ color: theme.textSecondary }} className="text-xs font-semibold truncate">
                          برای این جلسه یادآور تنظیم نشده است
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSessionDatePickerOpen(true)}
                        style={{ backgroundColor: theme.primary }}
                        className="py-1.5 px-3 rounded-xl text-xs font-black text-white cursor-pointer hover:opacity-90 transition-all flex items-center gap-1 shadow-sm flex-shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>تنظیم یادآور</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 6. User Follow-up Messages */}
                {chatFollowUps.map((msg) => (
                  <div key={msg.id} className="flex justify-end">
                    <div
                      style={{ backgroundColor: theme.primary }}
                      className="rounded-2xl rounded-br-sm p-3 text-white max-w-[85%] shadow-md space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1">
                        <span className="text-[10px] font-bold text-white/80">شما</span>
                        <span className="text-[9px] text-white/70 font-mono">
                          {getJalaliDateNumeric()}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed break-words">{msg.text}</p>
                      <div className="flex justify-start pt-0.5">
                        <span className="text-[9px] text-white/70 font-mono">
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hidden Native Operating System File Picker */}
              <input
                type="file"
                ref={chatFileInputRef}
                onChange={handleChatSystemFileUpload}
                multiple
                className="hidden"
                accept="*/*"
              />

              {/* Bottom Interactive Message Bar (With Real System File Picker) */}
              <form
                onSubmit={handleSendChatFollowUp}
                style={{
                  backgroundColor: theme.innerBg,
                  borderTopColor: theme.borderLuminous,
                }}
                className="p-3 border-t flex items-center gap-2 flex-shrink-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (Capacitor.isNativePlatform()) {
                      handleChatNativeFilePicker();
                    } else {
                      chatFileInputRef.current?.click();
                    }
                  }}
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderLuminous,
                    color: theme.primary,
                  }}
                  className="w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer hover:opacity-80 shadow-sm flex-shrink-0"
                  title="انتخاب و پیوست فایل واقعی از حافظه دستگاه"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={!chatInputText.trim()}
                  style={{ backgroundColor: chatInputText.trim() ? theme.primary : 'transparent' }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity flex-shrink-0 ${
                    chatInputText.trim() ? 'cursor-pointer hover:opacity-90 shadow-sm' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4 translate-x-[-1px]" />
                </button>

                <input
                  type="text"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  placeholder="افزودن یادداشت تکمیلی یا نکته جدید به جلسه..."
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderLuminous,
                    color: theme.textPrimary,
                  }}
                  className="flex-1 py-2 px-3.5 rounded-xl border text-xs focus:outline-none text-right min-w-0"
                />
              </form>
            </div>
          </div>
        )}

        {/* IN-APP FILE & MEDIA VIEWER MODAL (Problem 7) */}
        {previewFile && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[150] flex items-center justify-center p-3 sm:p-5">
            <div
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderLuminous,
              }}
              className="liquid-glass rounded-3xl p-4 sm:p-6 max-w-2xl w-full border shadow-2xl transition-all flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 mr-2">
                  <div className="flex-shrink-0">{renderFileTypeTag(previewFile.type)}</div>
                  <div className="min-w-0">
                    <h3 style={{ color: theme.textPrimary }} className="text-sm font-black truncate">
                      {previewFile.name}
                    </h3>
                    <span style={{ color: theme.textSecondary }} className="text-[10px] font-semibold">
                      اندازه فایل: {previewFile.sizeText}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                  className="w-8 h-8 rounded-xl border flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Viewer Content */}
              <div className="flex-1 overflow-y-auto flex items-center justify-center p-2 min-h-[220px]">
                {previewFile.type === 'image' ? (
                  <div className="w-full flex items-center justify-center">
                    <img
                      src={filePickerService.getFileUrl(previewFile)}
                      alt={previewFile.name}
                      className="max-h-[65vh] w-auto max-w-full rounded-2xl object-contain shadow-xl border border-white/5"
                    />
                  </div>
                ) : previewFile.type === 'pdf' ? (
                  <div className="w-full h-[60vh] flex flex-col items-center justify-center">
                    <iframe
                      src={filePickerService.getFileUrl(previewFile)}
                      title={previewFile.name}
                      className="w-full h-full rounded-2xl border border-white/10 bg-white"
                    />
                  </div>
                ) : previewFile.type === 'audio' ? (
                  <div
                    style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                    className="w-full p-6 rounded-2xl border text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-blue-500/20 text-blue-400">
                      <Mic className="w-8 h-8" />
                    </div>
                    <audio
                      src={filePickerService.getFileUrl(previewFile)}
                      controls
                      autoPlay
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div
                    style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                    className="w-full p-8 rounded-2xl border text-center space-y-3"
                  >
                    <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-amber-500/20 text-amber-400">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h4 style={{ color: theme.textPrimary }} className="text-sm font-bold">
                      {previewFile.name}
                    </h4>
                    <p style={{ color: theme.textSecondary }} className="text-xs">
                      فایل سند و چندرسانه‌ای ذخیره شده در حافظه دستگاه
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-white/10 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                  className="py-2 px-4 rounded-xl text-xs font-bold border text-slate-400 cursor-pointer"
                >
                  بستن
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = filePickerService.openFile(previewFile);
                    if (url) {
                      setFileToast('در حال هدایت به فایل...');
                      setTimeout(() => setFileToast(null), 2500);
                    }
                  }}
                  style={{ backgroundColor: theme.primary }}
                  className="py-2 px-4 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-1.5 cursor-pointer hover:opacity-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>مشاهده با برنامه دیگر / دانلود</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SESSION REMINDER JALALI DATE PICKER MODAL (Rendered on top of chat view) */}
        {isSessionDatePickerOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderLuminous,
              }}
              className="liquid-glass rounded-3xl p-6 max-w-sm w-full border shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: theme.primary }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <h3 style={{ color: theme.textPrimary }} className="text-sm font-black">
                      انتخاب تاریخ یادآور جلسه
                    </h3>
                    <p style={{ color: theme.textSecondary }} className="text-[10px]">
                      تاریخ شمسی مورد نظر برای ارسال آلارم
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSessionDatePickerOpen(false)}
                  style={{ color: theme.textSecondary }}
                  className="p-1 rounded-lg hover:opacity-75 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Month Navigation Row */}
              <div
                style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                className="flex items-center justify-between p-2 rounded-2xl border mb-3 text-xs font-bold"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (sessionPickerMonth === 1) {
                      setSessionPickerYear((y) => y - 1);
                      setSessionPickerMonth(12);
                    } else {
                      setSessionPickerMonth((m) => m - 1);
                    }
                  }}
                  className="px-2 py-1 rounded-lg text-sky-400 hover:bg-white/5 cursor-pointer"
                >
                  ‹ ماه قبل
                </button>
                <span style={{ color: theme.textPrimary }} className="font-extrabold text-sm">
                  {PERSIAN_MONTHS[sessionPickerMonth - 1]} {toPersianDigits(sessionPickerYear)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (sessionPickerMonth === 12) {
                      setSessionPickerYear((y) => y + 1);
                      setSessionPickerMonth(1);
                    } else {
                      setSessionPickerMonth((m) => m + 1);
                    }
                  }}
                  className="px-2 py-1 rounded-lg text-sky-400 hover:bg-white/5 cursor-pointer"
                >
                  ماه بعد ›
                </button>
              </div>

              {/* Neumorphic Inset Well for Date Grid */}
              <div
                style={{
                  backgroundColor: theme.innerBg,
                  borderColor: theme.borderLuminous,
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
                }}
                className="p-3 rounded-2xl border mb-3"
              >
                {/* Week Day Labels */}
                <div className="grid grid-cols-7 gap-1 text-center pb-2 mb-2 border-b border-white/5 text-[11px] font-bold text-slate-400">
                  <span>ش</span>
                  <span>ی</span>
                  <span>د</span>
                  <span>س</span>
                  <span>چ</span>
                  <span>پ</span>
                  <span className="text-rose-400">ج</span>
                </div>

                {/* Days Grid */}
                {(() => {
                  const [gy, gm, gd] = jalaliToGregorian(sessionPickerYear, sessionPickerMonth, 1);
                  const firstDay = new Date(gy, gm - 1, gd).getDay();
                  const offset = (firstDay + 1) % 7;
                  const totalDays = getDaysInJalaliMonth(sessionPickerYear, sessionPickerMonth);

                  return (
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {Array.from({ length: offset }).map((_, i) => (
                        <div key={`empty-sess-${i}`} className="h-8" />
                      ))}
                      {Array.from({ length: totalDays }).map((_, i) => {
                        const dayNum = i + 1;
                        const isSel = sessionPickerDay === dayNum;
                        return (
                          <button
                            type="button"
                            key={dayNum}
                            onClick={() => setSessionPickerDay(dayNum)}
                            style={{
                              backgroundColor: isSel ? theme.primary : 'transparent',
                              color: isSel ? '#FFFFFF' : theme.textPrimary,
                              boxShadow: isSel ? `0 0 10px ${theme.glowColor}` : 'none',
                            }}
                            className="h-8 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer hover:bg-white/10 active:scale-95"
                          >
                            {toPersianDigits(dayNum)}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Selected Date Preview */}
              <div
                style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                className="p-2.5 rounded-xl border text-center space-y-0.5 mb-3"
              >
                <div style={{ color: theme.primaryLight }} className="text-xs font-bold">
                  تاریخ انتخابی: {toPersianDigits(sessionPickerDay)} {PERSIAN_MONTHS[sessionPickerMonth - 1]} {toPersianDigits(sessionPickerYear)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSessionDatePickerOpen(false)}
                  style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold border text-slate-400 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSessionDatePickerOpen(false);
                    // Open time picker right after date selection for a streamlined flow
                    setTimeout(() => setIsSessionTimePickerOpen(true), 120);
                  }}
                  style={{ backgroundColor: theme.primary }}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-black text-white shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
                >
                  <Check className="w-4 h-4" />
                  <span>تأیید تاریخ و انتخاب ساعت ➔</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REUSABLE SPRING TIME PICKER MODAL FOR SESSION TIMELINE REMINDER (Rendered on top of chat view) */}
        <SpringTimePicker
          isOpen={isSessionTimePickerOpen}
          onClose={() => setIsSessionTimePickerOpen(false)}
          initialHour={sessionPickerHour}
          initialMinute={sessionPickerMin}
          title="تنظیم ساعت یادآور جلسه"
          subtitle="ساعت موعد یادآوری این جلسه تحصیلی"
          confirmText="ذخیره یادآور جلسه"
          theme={theme}
          zIndex="z-[210]"
          onConfirm={async (h, m) => {
            setSessionPickerHour(h);
            setSessionPickerMin(m);
            if (selectedChatSessionLog) {
              const [gy, gm, gd] = jalaliToGregorian(sessionPickerYear, sessionPickerMonth, sessionPickerDay);
              const targetDate = new Date(gy, gm - 1, gd, h, m, 0);
              await handleSaveExactSessionReminder(targetDate.getTime(), h, m);
            }
          }}
        />

      </main>

      {/* FLOATING CIRCULAR RADIAL MENU (CIRCLE MENU) - Hidden when modal is active */}
      {!selectedChatSessionLog && !isSessionCaptureOpen && !isClassModalOpen && !isEditingProfile && !deletingId && !previewFile && (
        <>
          {/* Backdrop blur dismiss layer */}
          {isRadialOpen && (
            <div
              onClick={() => setIsRadialOpen(false)}
              className={`fixed inset-0 z-40 transition-opacity ${
                theme.isDark ? 'bg-black/60 backdrop-blur-md' : 'bg-slate-900/25 backdrop-blur-sm'
              }`}
            />
          )}

          {/* Anchored Floating Radial Circle Orb at bottom-center */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center pointer-events-auto">
        {/* Fan-Out Child Circular Glassmorphic Vector Icon Nodes (180° to 0° Arc Upward) */}
        {RADIAL_ITEMS.map((item, index) => {
          const angleDeg = 180 - index * (180 / (RADIAL_ITEMS.length - 1));
          const angleRad = (angleDeg * Math.PI) / 180;
          const radius = 100;
          const targetX = Math.round(Math.cos(angleRad) * radius);
          const targetY = -Math.round(Math.sin(angleRad) * radius);

          const isSelected = activeTab === item.id;
          const badgeCount = item.id === 'notes' && sessionLogs.length > 0 ? sessionLogs.length : undefined;

          return (
            <div
              key={item.id}
              style={{
                transform: isRadialOpen
                  ? `translate(${targetX}px, ${targetY}px) scale(1)`
                  : 'translate(0px, 0px) scale(0)',
                opacity: isRadialOpen ? 1 : 0,
                pointerEvents: isRadialOpen ? 'auto' : 'none',
                transition: `all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.15) ${index * 0.03}s`,
              }}
              className="absolute flex flex-col items-center justify-center"
            >
              <button
                onClick={() => {
                  setActiveTab(item.id);
                  setIsRadialOpen(false);
                }}
                style={{
                  backgroundColor: isSelected ? theme.primary : (theme.isDark ? theme.cardBg : '#FFFFFF'),
                  borderColor: isSelected ? theme.primaryLight : theme.borderLuminous,
                  boxShadow: isSelected
                    ? `0 0 20px ${theme.glowColor}, 0 8px 24px rgba(0,0,0,0.25)`
                    : (theme.isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 20px rgba(0,0,0,0.12)'),
                  color: isSelected ? '#FFFFFF' : (theme.isDark ? theme.textPrimary : theme.primary),
                }}
                className="w-13 h-13 rounded-full flex items-center justify-center text-xl border-2 backdrop-blur-2xl cursor-pointer hover:scale-110 active:scale-95 transition-transform relative"
                title={item.label}
              >
                {item.icon}
                {badgeCount && (
                  <span
                    style={{ backgroundColor: theme.secondaryAccent || '#EC4899' }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-sm"
                  >
                    {badgeCount}
                  </span>
                )}
              </button>

              {/* Label tooltip */}
              <div
                style={{
                  backgroundColor: theme.isDark ? 'rgba(10, 13, 22, 0.95)' : '#FFFFFF',
                  borderColor: theme.borderLuminous,
                  color: isSelected ? theme.primary : (theme.isDark ? '#F8FAFC' : '#0F172A'),
                  boxShadow: theme.isDark ? '0 4px 14px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.12)',
                }}
                className="px-2.5 py-1 mt-1 rounded-md text-[10px] font-black border tracking-wider whitespace-nowrap shadow-md pointer-events-none transition-colors"
              >
                {item.label}
              </div>
            </div>
          );
        })}

        {/* Pulse Ring when Collapsed */}
        {!isRadialOpen && (
          <span
            style={{
              borderColor: theme.primary,
            }}
            className="absolute w-20 h-20 rounded-full border-2 animate-ping opacity-25 pointer-events-none"
          />
        )}

          {/* Central Orb Trigger Button */}
          <button
            onClick={() => setIsRadialOpen(!isRadialOpen)}
            style={{
              backgroundColor: theme.isDark ? theme.cardBg : '#FFFFFF',
              borderColor: isRadialOpen ? theme.primary : theme.borderLuminous,
              boxShadow: theme.isDark
                ? `0 12px 32px rgba(0, 0, 0, 0.6), 0 0 24px ${theme.glowColor}`
                : `0 10px 28px rgba(0, 0, 0, 0.12), 0 0 16px ${theme.glowColor}`,
              color: isRadialOpen ? (theme.isDark ? '#FFFFFF' : theme.textPrimary) : theme.primary,
            }}
            className="w-16 h-16 rounded-full flex items-center justify-center border-2 backdrop-blur-2xl cursor-pointer transition-all hover:scale-105 active:scale-95 relative group"
            aria-label={isRadialOpen ? 'بستن منوی شعاعی' : 'باز کردن منوی ناوبری شعاعی'}
          >
            {isRadialOpen ? (
              <X className="w-6 h-6" style={{ color: theme.isDark ? '#FFFFFF' : theme.textPrimary }} />
            ) : (
              RADIAL_ITEMS.find((r) => r.id === activeTab)?.icon || <Home className="w-6 h-6" />
            )}

            {!isRadialOpen && (
              <span
                style={{ backgroundColor: theme.primary }}
                className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full"
              />
            )}
          </button>
        </div>
      </>
    )}
    </div>
  );
}
