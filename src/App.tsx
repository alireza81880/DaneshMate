import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { persistenceAdapter } from './storage/persistenceAdapter';
import { syncBridge, SyncState } from './api/syncBridge';

type WeekDay = 'شنبه' | 'یکشنبه' | 'دوشنبه' | 'سه‌شنبه' | 'چهارشنبه' | 'پنج‌شنبه';
type RecurrenceType = 'every_week' | 'even_weeks' | 'odd_weeks' | 'bi_weekly' | 'biweekly';
type ThemeCategory = 'Dark & Monochromatic' | 'Premium High-Contrast' | 'Light Minimal' | 'Neumorphic';
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

interface ClassItem {
  id: string;
  name: string;
  day: WeekDay;
  time: string;
  recurrence: RecurrenceType;
  recurrence_type?: 'even' | 'odd' | 'weekly' | 'bi_weekly';
  anchor_date?: string;
  anchor_timestamp?: number;
  scheduled_session_timestamps?: number[];
  professor?: string;
  location?: string;
}

interface ClassSessionLog {
  id: string;
  classId: string;
  className: string;
  createdAt: string;
  notesText: string;
  attachedFiles?: AttachedFile[];
  voiceMemoSeconds?: number;
  hasReminder: boolean;
  reminderTrigger?: string;
  reminderTimeText?: string;
  snoozedUntil?: string;
}

interface PaletteTheme {
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
const THEMES_2026: Record<string, PaletteTheme> = {
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

const COMMON_SLOTS = [
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

const toPersianDigits = (input: string | number): string =>
  String(input).replace(/[0-9]/g, (w) => PERSIAN_DIGITS_MAP[w] || w);

const PERSIAN_MONTHS = [
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

function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
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

function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  const isLeap = ((year + 38) * 31) % 128 < 31;
  return isLeap ? 30 : 29;
}

function jalaliToTimestamp(jy: number, jm: number, jd: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  const d = new Date(gy, gm - 1, gd, 0, 0, 0, 0);
  return d.getTime();
}

const WEEK_DAYS: WeekDay[] = [
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
    label: 'هفته‌های زوج',
    bg: 'rgba(16, 185, 129, 0.15)',
    color: '#10B981',
    lightColor: '#047857',
  },
  odd_weeks: {
    label: 'هفته‌های فرد',
    bg: 'rgba(249, 115, 22, 0.15)',
    color: '#F97316',
    lightColor: '#C2410C',
  },
};

// Preset Alert Triggers required by specs
const ALERT_TRIGGERS = [
  '24 hours before class',
  'Today',
  'Tomorrow',
  '2 days before next class',
];

// Snooze Intervals
const SNOOZE_OPTIONS = [
  '+1 hour',
  '+4 hours',
  '+24 hours',
];

// College quick attachment sample presets
const SAMPLE_FILES: AttachedFile[] = [
  { id: 'f-1', name: 'Lecture-Slides-Ch4.pptx', type: 'powerpoint', sizeText: '4.8 MB' },
  { id: 'f-2', name: 'Algorithm-Summary.pdf', type: 'pdf', sizeText: '1.2 MB' },
  { id: 'f-3', name: 'Whiteboard-Formulas.png', type: 'image', sizeText: '2.4 MB' },
  { id: 'f-4', name: 'Homework-Questions.docx', type: 'word', sizeText: '420 KB' },
];

const NAME_REGEX = /^[a-zA-Z\u0600-\u06FF\uFB8A\u067E\u0686\u06AF\u200c\s]+$/;

export default function App() {
  const [currentThemeId, setCurrentThemeId] = useState<string>('deep-space');
  const [activeThemeCategory, setActiveThemeCategory] = useState<ThemeCategory>('Dark & Monochromatic');
  const theme = THEMES_2026[currentThemeId] || THEMES_2026['deep-space'];

  // Navigation: Active Tab & Floating Radial Menu State
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [isRadialOpen, setIsRadialOpen] = useState(false);

  // User Profile - Strict Zero-Data Cold Start (No hardcoded names)
  const [userProfile, setUserProfile] = useState<{
    firstName: string;
    lastName: string;
    passedUnits?: string;
  } | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [pFirstName, setPFirstName] = useState('');
  const [pLastName, setPLastName] = useState('');
  const [pPassedUnits, setPPassedUnits] = useState('');
  const [pErrors, setPErrors] = useState<{ firstName?: string; lastName?: string }>({});

  // Classes State - Initialized strictly empty
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedDayFilter, setSelectedDayFilter] = useState<'همه' | WeekDay>('همه');
  const [searchQuery, setSearchQuery] = useState('');

  // Class Add/Edit Modal
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDay, setFormDay] = useState<WeekDay>('شنبه');
  const [formTime, setFormTime] = useState(COMMON_SLOTS[0]);
  const [formCustomTime, setFormCustomTime] = useState('');
  const [formRecurrence, setFormRecurrence] = useState<RecurrenceType>('every_week');
  const [formAnchorDate, setFormAnchorDate] = useState<string>('');
  const [formAnchorTimestamp, setFormAnchorTimestamp] = useState<number | undefined>(undefined);
  const [formAnchorLabel, setFormAnchorLabel] = useState<string>('');
  const [formScheduledSessions, setFormScheduledSessions] = useState<number[]>([]);
  const [isJalaliSpringModalOpen, setIsJalaliSpringModalOpen] = useState<boolean>(false);
  const [calSelectedYear, setCalSelectedYear] = useState<number>(1405);
  const [calSelectedMonth, setCalSelectedMonth] = useState<number>(7);
  const [calSelectedDay, setCalSelectedDay] = useState<number>(4);
  const [formProfessor, setFormProfessor] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [classErrors, setClassErrors] = useState<{ name?: string }>({});

  // 2-Step Automated Custom Time Picker Modal (Zero-Error)
  const [isTimePickerModalOpen, setIsTimePickerModalOpen] = useState(false);
  const [timePickerStep, setTimePickerStep] = useState<1 | 2>(1);
  const [pickerStartHour, setPickerStartHour] = useState(8);
  const [pickerStartMin, setPickerStartMin] = useState(0);
  const [pickerEndHour, setPickerEndHour] = useState(10);
  const [pickerEndMin, setPickerEndMin] = useState(0);
  const [timePickerError, setTimePickerError] = useState<string | null>(null);

  const handleOpenCustomTimePicker = (existingTime?: string) => {
    setTimePickerError(null);
    setTimePickerStep(1);
    const target = existingTime || formCustomTime || (COMMON_SLOTS.includes(formTime) ? '' : formTime);
    if (target && target.includes('-')) {
      const parts = target.split('-').map((s) => s.trim());
      if (parts.length === 2) {
        const parseDigits = (str: string) => str.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
        const [sh, sm] = parts[0].split(':').map((n) => parseInt(parseDigits(n), 10));
        const [eh, em] = parts[1].split(':').map((n) => parseInt(parseDigits(n), 10));
        if (!isNaN(sh)) setPickerStartHour(sh);
        if (!isNaN(sm)) setPickerStartMin(sm);
        if (!isNaN(eh)) setPickerEndHour(eh);
        if (!isNaN(em)) setPickerEndMin(em);
      }
    } else {
      setPickerStartHour(8);
      setPickerStartMin(0);
      setPickerEndHour(10);
      setPickerEndMin(0);
    }
    setIsTimePickerModalOpen(true);
  };

  const handleNextTimeStep = (hour?: number, min?: number) => {
    const sHour = hour !== undefined ? hour : pickerStartHour;
    const sMin = min !== undefined ? min : pickerStartMin;
    setPickerStartHour(sHour);
    setPickerStartMin(sMin);

    // Auto-calculate end time: start + 1h 30m or start + 2h
    let newEndHour = sHour + 1;
    let newEndMin = sMin + 30;
    if (newEndMin >= 60) {
      newEndHour += 1;
      newEndMin -= 60;
    }
    if (newEndHour > 22) {
      newEndHour = 22;
      newEndMin = 0;
    }
    setPickerEndHour(newEndHour);
    setPickerEndMin(newEndMin);
    setTimePickerError(null);
    setTimePickerStep(2);
  };

  const handleApplyDurationShortcut = (addMinutes: number) => {
    const totalStartMins = pickerStartHour * 60 + pickerStartMin;
    const totalEndMins = totalStartMins + addMinutes;
    let eHour = Math.floor(totalEndMins / 60);
    let eMin = totalEndMins % 60;
    if (eHour > 23) {
      eHour = 23;
      eMin = 59;
    }
    setPickerEndHour(eHour);
    setPickerEndMin(eMin);
    setTimePickerError(null);
  };

  const handleConfirmCustomTime = () => {
    const startTotal = pickerStartHour * 60 + pickerStartMin;
    const endTotal = pickerEndHour * 60 + pickerEndMin;
    if (endTotal <= startTotal) {
      setTimePickerError('ساعت اتمام کلاس باید پس از ساعت شروع باشد.');
      return;
    }
    const formatted = `${pickerStartHour.toString().padStart(2, '0')}:${pickerStartMin.toString().padStart(2, '0')} - ${pickerEndHour.toString().padStart(2, '0')}:${pickerEndMin.toString().padStart(2, '0')}`;
    setFormCustomTime(formatted);
    setFormTime(formatted);
    setIsTimePickerModalOpen(false);
  };

  const handleClearCustomTime = () => {
    setFormCustomTime('');
    setFormTime(COMMON_SLOTS[0]);
  };

  // Delete modal
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Multimodal In-Class Session Capture State - Initialized strictly empty
  const [sessionLogs, setSessionLogs] = useState<ClassSessionLog[]>([]);

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
  const [sessionIsPlayingAudio, setSessionIsPlayingAudio] = useState(false);

  // Flexible Reminders & Snooze
  const [sessionHasReminder, setSessionHasReminder] = useState(true);
  const [sessionSelectedReminder, setSessionSelectedReminder] = useState<string>(ALERT_TRIGGERS[0]);
  const [sessionActiveSnooze, setSessionActiveSnooze] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Live Date
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Offline-First Snapshot Hydration & Cloud Sync
  useEffect(() => {
    persistenceAdapter.loadAppSnapshot().then((snapshot) => {
      if (snapshot) {
        if (snapshot.studentProfile) setUserProfile(snapshot.studentProfile);
        if (snapshot.classes && snapshot.classes.length > 0) setClasses(snapshot.classes);
        if (snapshot.sessionLogs && snapshot.sessionLogs.length > 0) setSessionLogs(snapshot.sessionLogs);
        if (snapshot.activeThemeId && THEMES_2026[snapshot.activeThemeId]) {
          setCurrentThemeId(snapshot.activeThemeId);
        }
      }
      // Non-blocking async fetch from Rust server
      syncBridge.fetchCloudSnapshot().then((cloudData) => {
        if (cloudData && cloudData.success && cloudData.student_profile && !snapshot?.studentProfile) {
          setUserProfile({
            firstName: cloudData.student_profile.first_name,
            lastName: cloudData.student_profile.last_name,
            passedUnits: cloudData.student_profile.passed_units,
          });
        }
      }).catch(() => {});
    });
  }, []);

  // Chat inline audio playback ticker
  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    const maxSec = selectedChatSessionLog?.voiceMemoSeconds || 60;
    if (chatAudioPlaying) {
      t = setInterval(() => {
        setChatAudioSeconds((prev) => {
          if (prev >= maxSec) {
            setChatAudioPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / chatAudioSpeed);
    }
    return () => clearInterval(t);
  }, [chatAudioPlaying, selectedChatSessionLog, chatAudioSpeed]);

  // Reset chat viewer state when changing session
  useEffect(() => {
    setChatAudioPlaying(false);
    setChatAudioSeconds(0);
    setChatFollowUps([]);
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

  const getPersianDateString = (d: Date = currentDate): string => {
    try {
      const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }).formatToParts(d);
      const year = parts.find((p) => p.type === 'year')?.value || '1405';
      const month = parts.find((p) => p.type === 'month')?.value || '7';
      const day = parts.find((p) => p.type === 'day')?.value || '5';
      return `${year}/${month}/${day}`;
    } catch {
      return '1405/7/5';
    }
  };

  const getTimeString = () => {
    return currentDate.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
    setEditingId(null);
    setFormName('');
    setFormDay('شنبه');
    setFormTime(COMMON_SLOTS[0]);
    setFormCustomTime('');
    setFormRecurrence('every_week');
    setFormAnchorDate('');
    setFormAnchorTimestamp(undefined);
    setFormAnchorLabel('');
    setFormScheduledSessions([]);
    setFormProfessor('');
    setFormLocation('');
    setClassErrors({});
    setIsClassModalOpen(true);
  };

  const handleOpenEdit = (item: ClassItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormDay(item.day);
    setFormTime(item.time);
    setFormCustomTime(!COMMON_SLOTS.includes(item.time) ? item.time : '');
    setFormRecurrence(item.recurrence);
    setFormAnchorDate(item.anchor_date || '');
    setFormAnchorTimestamp(item.anchor_timestamp);
    setFormAnchorLabel(item.anchor_date ? `مبدأ دوره: ${item.anchor_date}` : '');
    setFormScheduledSessions(item.scheduled_session_timestamps || []);
    setFormProfessor(item.professor || '');
    setFormLocation(item.location || '');
    setClassErrors({});
    setIsClassModalOpen(true);
  };

  const handleSelectAnchorDateWeb = (year: number, month: number, day: number) => {
    const formattedDate = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    const timestamp = jalaliToTimestamp(year, month, day);
    const monthName = PERSIAN_MONTHS[month - 1];
    const [gy, gm, gd] = jalaliToGregorian(year, month, day);
    const d = new Date(gy, gm - 1, gd);
    const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    const dayName = dayNames[d.getDay()] || '';
    const label = `${dayName} ${toPersianDigits(day)} ${monthName}`;

    // Generate 8 bi-weekly sessions for 16 academic weeks
    const sessions: number[] = [];
    for (let i = 0; i < 8; i++) {
      sessions.push(timestamp + i * (14 * 24 * 60 * 60 * 1000));
    }

    setFormAnchorDate(formattedDate);
    setFormAnchorTimestamp(timestamp);
    setFormAnchorLabel(label);
    setFormScheduledSessions(sessions);
    setIsJalaliSpringModalOpen(false);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setClassErrors({ name: 'ورود نام کلاس الزامی است' });
      return;
    }

    const finalTime = formCustomTime.trim() ? formCustomTime.trim() : formTime;
    const recType: 'even' | 'odd' | 'weekly' | 'bi_weekly' =
      formRecurrence === 'even_weeks'
        ? 'even'
        : formRecurrence === 'odd_weeks'
        ? 'odd'
        : formRecurrence === 'bi_weekly' || formRecurrence === 'biweekly'
        ? 'bi_weekly'
        : 'weekly';

    if (editingId) {
      const updatedClasses = classes.map((c) =>
        c.id === editingId
          ? {
              ...c,
              name: formName.trim(),
              day: formDay,
              time: finalTime,
              recurrence: formRecurrence,
              recurrence_type: recType,
              anchor_date: formAnchorDate || undefined,
              anchor_timestamp: formAnchorTimestamp,
              scheduled_session_timestamps:
                formScheduledSessions.length > 0 ? formScheduledSessions : undefined,
              professor: formProfessor.trim() || undefined,
              location: formLocation.trim() || undefined,
            }
          : c
      );
      setClasses(updatedClasses);
      syncBridge.performOptimisticSync(userProfile, updatedClasses, sessionLogs, currentThemeId);
    } else {
      const newClass: ClassItem = {
        id: Date.now().toString(),
        name: formName.trim(),
        day: formDay,
        time: finalTime,
        recurrence: formRecurrence,
        recurrence_type: recType,
        anchor_date: formAnchorDate || undefined,
        anchor_timestamp: formAnchorTimestamp,
        scheduled_session_timestamps:
          formScheduledSessions.length > 0 ? formScheduledSessions : undefined,
        professor: formProfessor.trim() || undefined,
        location: formLocation.trim() || undefined,
      };
      const updatedClasses = [newClass, ...classes];
      setClasses(updatedClasses);
      syncBridge.performOptimisticSync(userProfile, updatedClasses, sessionLogs, currentThemeId);
    }
    setIsClassModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      const updatedClasses = classes.filter((c) => c.id !== deletingId);
      const updatedLogs = sessionLogs.filter((l) => l.classId !== deletingId);
      setClasses(updatedClasses);
      setSessionLogs(updatedLogs);
      syncBridge.performOptimisticSync(userProfile, updatedClasses, updatedLogs, currentThemeId);
      setDeletingId(null);
    }
  };

  // Universal File Upload & Quick Add
  const handleNativeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const newFiles: AttachedFile[] = files.map((file) => {
        let type: FileCategory = 'other';
        if (file.type.includes('image')) type = 'image';
        else if (file.type.includes('pdf')) type = 'pdf';
        else if (
          file.type.includes('presentation') ||
          file.name.endsWith('.pptx') ||
          file.name.endsWith('.ppt')
        )
          type = 'powerpoint';
        else if (
          file.type.includes('word') ||
          file.name.endsWith('.docx') ||
          file.name.endsWith('.doc')
        )
          type = 'word';
        else if (file.type.includes('audio')) type = 'audio';

        const sizeKb = Math.round(file.size / 1024);
        const sizeText = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

        let objectUrl: string | undefined;
        try {
          objectUrl = URL.createObjectURL(file);
        } catch {
          // ignore
        }

        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          type,
          sizeText,
          uri: objectUrl,
          url: objectUrl,
        };
      });

      setSessionAttachedFiles((prev) => [...prev, ...newFiles]);
      e.target.value = '';
    }
  };

  const handleOpenFileWeb = (file: AttachedFile) => {
    const sampleUrls: Record<FileCategory, string> = {
      pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      powerpoint: 'https://view.officeapps.live.com/op/view.aspx?src=sample.pptx',
      word: 'https://view.officeapps.live.com/op/view.aspx?src=sample.docx',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80',
      audio: '',
      other: '',
    };
    const targetUrl = file.uri || file.url || sampleUrls[file.type] || sampleUrls.pdf;
    setFileToast(`در حال باز کردن «${file.name}» در نمایش‌دهنده پیش‌فرض...`);
    setTimeout(() => setFileToast(null), 3000);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteSessionAudioWeb = () => {
    if (!selectedChatSessionLog) return;
    const updatedLog: ClassSessionLog = {
      ...selectedChatSessionLog,
      voiceMemoSeconds: undefined,
    };
    setSelectedChatSessionLog(updatedLog);
    const updatedLogs = sessionLogs.map((l) => (l.id === updatedLog.id ? updatedLog : l));
    setSessionLogs(updatedLogs);
    syncBridge.performOptimisticSync(userProfile, classes, updatedLogs, currentThemeId);
    setFileToast('صوت ضبط شده جلسه حذف گردید.');
    setTimeout(() => setFileToast(null), 2500);
  };

  // Chat file input ref for native system file picking
  const chatFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleChatSystemFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedChatSessionLog) return;

    const newAttached: AttachedFile[] = [];
    Array.from(files).forEach((f) => {
      let cat: FileCategory = 'other';
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (ext === 'pdf') cat = 'pdf';
      else if (['ppt', 'pptx'].includes(ext)) cat = 'powerpoint';
      else if (['doc', 'docx'].includes(ext)) cat = 'word';
      else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) cat = 'image';
      else if (['mp3', 'm4a', 'wav', 'aac', 'ogg'].includes(ext)) cat = 'audio';

      const sizeInMB = f.size / (1024 * 1024);
      const sizeText =
        sizeInMB >= 1
          ? `${sizeInMB.toFixed(1).replace('.', '/')} مگابایت`
          : `${Math.round(f.size / 1024)} کیلوبایت`;

      newAttached.push({
        id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: f.name,
        type: cat,
        sizeText,
        url: URL.createObjectURL(f),
      });
    });

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

  const handleDeleteSessionFileWeb = (fileId: string) => {
    if (!selectedChatSessionLog) return;
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
    if (!chatInputText.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      text: chatInputText.trim(),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatFollowUps((prev) => [...prev, newMsg]);
    setChatInputText('');
  };

  const handleToggleVoiceRecording = () => {
    if (sessionIsRecording) {
      setSessionIsRecording(false);
      setSessionDuration(sessionRecordSeconds);
      const audioAttachment: AttachedFile = {
        id: `rec-${Date.now()}`,
        name: `Audio-Memo-${formatTimer(sessionRecordSeconds)}.m4a`,
        type: 'audio',
        sizeText: `${Math.round((sessionRecordSeconds * 32) / 10)} KB`,
      };
      setSessionAttachedFiles((prev) => [audioAttachment, ...prev]);
    } else {
      setSessionRecordSeconds(0);
      setSessionDuration(null);
      setSessionIsRecording(true);
    }
  };

  const handleSaveSessionLog = (e: React.FormEvent) => {
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
    let reminderText = sessionSelectedReminder;
    if (sessionActiveSnooze) {
      reminderText = `${sessionSelectedReminder} (Snoozed ${sessionActiveSnooze})`;
    }

    const newLog: ClassSessionLog = {
      id: Date.now().toString(),
      classId: sessionClassId,
      className: currentClass?.name || 'کلاس عمومی',
      createdAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      notesText: sessionNotesText.trim(),
      attachedFiles: sessionAttachedFiles,
      voiceMemoSeconds: sessionDuration || undefined,
      hasReminder: sessionHasReminder,
      reminderTrigger: sessionSelectedReminder,
      reminderTimeText: sessionHasReminder ? reminderText : undefined,
      snoozedUntil: sessionActiveSnooze || undefined,
    };

    const updatedLogs = [newLog, ...sessionLogs];
    setSessionLogs(updatedLogs);
    syncBridge.performOptimisticSync(userProfile, classes, updatedLogs, currentThemeId);
    setSessionNotesText('');
    setSessionAttachedFiles([]);
    setSessionDuration(null);
    setSessionRecordSeconds(0);
    setSessionIsRecording(false);
    setSessionHasReminder(true);
    setSessionActiveSnooze(null);
    setSessionError(null);
    setIsSessionCaptureOpen(false);
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
  const currentCategoryThemes = Object.values(THEMES_2026).filter(
    (t) => t.category === activeThemeCategory
  );

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

  // Pure Interactive "Made by null" branding & Support footer
  const renderNullFooter = () => (
    <div className="flex flex-col items-center justify-center my-6 gap-2 select-none">
      {/* Subtle Support / Donation Link */}
      <a
        href="https://donofa.ir/alirezaz_dev"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          backgroundColor: theme.innerBg,
          borderColor: theme.borderLuminous,
          color: theme.textSecondary,
        }}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-[11px] font-bold border hover:border-rose-400 hover:text-white transition-all shadow-sm group cursor-pointer"
        aria-label="حمایت مالی از پروژه در دونوفا"
      >
        <span className="text-rose-500 group-hover:scale-110 transition-transform">♥</span>
        <span>حمایت مالی از پروژه</span>
        <span style={{ color: theme.primary }} className="text-[10px]">✦</span>
      </a>

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
        className="fixed top-0 left-0 right-0 h-96 pointer-events-none z-0 opacity-40 blur-3xl"
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
                <div
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderLuminous,
                    boxShadow: theme.shadowFlat,
                  }}
                  className="liquid-glass rounded-3xl p-5 border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        backgroundColor: theme.innerBg,
                        color: theme.primary,
                        borderColor: theme.borderLuminous,
                      }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                    >
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <span style={{ color: theme.textSecondary }} className="text-xs font-bold block">
                        تقویم دانشگاهی امروز
                      </span>
                      <h3 style={{ color: theme.textPrimary }} className="text-base font-black">
                        {getPersianDateString()}
                      </h3>
                    </div>
                  </div>

                  <div style={{ color: theme.primary }} className="font-mono text-xl font-black tracking-wider">
                    {getTimeString()}
                  </div>
                </div>

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
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
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
                        className="w-14 h-14 rounded-2xl flex items-center justify-center border text-2xl shadow-sm"
                      >
                        ✦
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
                                <h4 style={{ color: theme.textPrimary }} className="font-extrabold text-sm mb-1">
                                  {cls.name}
                                </h4>
                                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: theme.textSecondary }}>
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{cls.day} • {cls.time}</span>
                                </div>
                              </div>

                              <span
                                style={{
                                  backgroundColor: recCfg.bg,
                                  color: theme.isDark ? recCfg.color : recCfg.lightColor,
                                }}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-black"
                              >
                                {recCfg.label}
                              </span>
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

                            {/* Attached files list */}
                            {log.attachedFiles && log.attachedFiles.length > 0 && (
                              <div className="space-y-1.5 mb-3">
                                {log.attachedFiles.map((file) => (
                                  <div
                                    key={file.id}
                                    style={{
                                      backgroundColor: theme.cardBg,
                                      borderColor: theme.borderLuminous,
                                    }}
                                    className="flex items-center justify-between p-2 rounded-xl border text-xs"
                                  >
                                    <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 mr-2">
                                      {renderFileTypeTag(file.type)}
                                      <span style={{ color: theme.textPrimary }} className="font-semibold truncate">
                                        {truncateFileNameMiddle(file.name, 24)}
                                      </span>
                                    </div>
                                    <span style={{ color: theme.textSecondary }} className="text-[10px] font-semibold whitespace-nowrap">
                                      {file.sizeText}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

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
                                className="flex items-center justify-between pt-2 mt-2 border-t"
                              >
                                <div className="flex items-center gap-1 text-[11px] font-bold text-rose-500">
                                  <Bell className="w-3.5 h-3.5" />
                                  <span>یادآور: {formatPersianReminderText(log.reminderTrigger, log.reminderTimeText)}</span>
                                </div>
                                {log.snoozedUntil && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-600 dark:text-rose-300">
                                    تعویق: {log.snoozedUntil}
                                  </span>
                                )}
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
              </div>
            )}

            {/* 5. SETTINGS TAB: 12-THEME ENGINE WITH STRICT ENGLISH TECHNICAL KEYS */}
            {activeTab === 'settings' && (
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
                    className="flex items-center justify-between pb-4 mb-4 border-b"
                  >
                    <div>
                      <h3 style={{ color: theme.textPrimary }} className="text-lg font-black">
                        موتور پوسته ۱۲گانه Cyber-Luxe 2026
                      </h3>
                      <p style={{ color: theme.textSecondary }} className="text-xs font-semibold mt-0.5">
                        انتخاب از بین دسته‌های Dark & Monochromatic، Premium High-Contrast، Light Minimal و Neumorphic
                      </p>
                    </div>
                    <div
                      style={{
                        color: theme.primary,
                        borderColor: theme.borderLuminous,
                        backgroundColor: theme.innerBg,
                      }}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center border"
                    >
                      <Palette className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Category switcher */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {(
                      [
                        'Dark & Monochromatic',
                        'Premium High-Contrast',
                        'Light Minimal',
                        'Neumorphic',
                      ] as ThemeCategory[]
                    ).map((cat) => {
                      const isSel = activeThemeCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveThemeCategory(cat)}
                          style={{
                            backgroundColor: isSel ? theme.primary : theme.innerBg,
                            borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                            color: isSel ? '#FFFFFF' : theme.textPrimary,
                          }}
                          className="py-2.5 px-2 rounded-xl font-bold text-xs border transition-all cursor-pointer text-center truncate shadow-xs"
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {currentCategoryThemes.map((t) => {
                      const isSelected = currentThemeId === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setCurrentThemeId(t.id);
                            syncBridge.performOptimisticSync(userProfile, classes, sessionLogs, t.id);
                          }}
                          style={{
                            backgroundColor: t.cardBg,
                            borderColor: isSelected
                              ? t.primary
                              : (theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.12)'),
                            boxShadow: isSelected ? `0 0 20px ${t.glowColor}` : theme.shadowFlat,
                          }}
                          className={`liquid-glass-interactive rounded-2xl p-4 border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-blue-500/50' : ''
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              {/* Strictly English technical keys (e.g. 'deep-space', 'neo-ice') */}
                              <span style={{ color: t.textPrimary }} className="text-sm font-black font-mono">
                                '{t.id}'
                              </span>
                              {isSelected && (
                                <span
                                  style={{ backgroundColor: t.primary }}
                                  className="text-[10px] text-white font-extrabold px-2 py-0.5 rounded-full"
                                >
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <span style={{ color: theme.textSecondary }} className="text-[11px] font-semibold block mt-0.5 font-mono">
                              {t.category} • {t.bg}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5" dir="ltr">
                            <span
                              style={{ backgroundColor: t.bg, borderColor: t.borderLuminous }}
                              className="w-5 h-5 rounded-full border shadow-sm"
                            />
                            <span
                              style={{ backgroundColor: t.innerBg, borderColor: t.borderLuminous }}
                              className="w-5 h-5 rounded-full border shadow-sm"
                            />
                            <span
                              style={{ backgroundColor: t.primary }}
                              className="w-5 h-5 rounded-full shadow-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
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
                              onClick={() =>
                                setSessionAttachedFiles((prev) => prev.filter((f) => f.id !== file.id))
                              }
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

                {/* 5. Flexible Smart Reminders & Alert Triggers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: theme.textPrimary }} className="text-xs font-bold">
                      تنظیم یادآور هوشمند (Smart Reminders)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSessionHasReminder(!sessionHasReminder)}
                      style={{
                        backgroundColor: sessionHasReminder ? theme.primary : theme.innerBg,
                        borderColor: theme.borderLuminous,
                        color: sessionHasReminder ? '#FFFFFF' : theme.textMuted,
                      }}
                      className="px-3 py-1 rounded-xl text-xs font-bold border cursor-pointer"
                    >
                      {sessionHasReminder ? 'فعال ✓' : 'غیرفعال'}
                    </button>
                  </div>

                  {sessionHasReminder && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        {ALERT_TRIGGERS.map((rem) => {
                          const isSel = sessionSelectedReminder === rem;
                          return (
                            <button
                              type="button"
                              key={rem}
                              onClick={() => setSessionSelectedReminder(rem)}
                              style={{
                                backgroundColor: isSel ? theme.primary : theme.innerBg,
                                borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                                color: isSel ? '#FFFFFF' : theme.textPrimary,
                              }}
                              className="px-2.5 py-2 rounded-xl text-xs font-bold border cursor-pointer text-center"
                            >
                              {rem}
                            </button>
                          );
                        })}
                      </div>

                      {/* Snooze Action Section */}
                      <div style={{ borderColor: theme.borderLuminous }} className="pt-2 border-t">
                        <div className="flex items-center justify-between mb-1.5">
                          <span style={{ color: theme.textSecondary }} className="text-[11px] font-bold">
                            گزینه تعویق هشدار (Snooze Handler):
                          </span>
                          {sessionActiveSnooze && (
                            <button
                              type="button"
                              onClick={() => setSessionActiveSnooze(null)}
                              className="text-[10px] text-rose-400 hover:underline"
                            >
                              لغو تعویق ✕
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {SNOOZE_OPTIONS.map((snz) => {
                            const isSnoozed = sessionActiveSnooze === snz;
                            return (
                              <button
                                type="button"
                                key={snz}
                                onClick={() => setSessionActiveSnooze(isSnoozed ? null : snz)}
                                style={{
                                  backgroundColor: isSnoozed ? theme.primary : theme.innerBg,
                                  borderColor: isSnoozed ? theme.primaryLight : theme.borderLuminous,
                                  color: isSnoozed ? '#FFFFFF' : theme.textSecondary,
                                }}
                                className="flex-1 py-1.5 rounded-xl text-xs font-bold border cursor-pointer text-center"
                              >
                                {snz}
                              </button>
                            );
                          })}
                        </div>
                      </div>
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

        {/* CLASS ADD/EDIT MODAL */}
        {isClassModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderLuminous,
              }}
              className="liquid-glass rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border shadow-2xl transition-all"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <h3 style={{ color: theme.textPrimary }} className="text-base font-black">
                  {editingId ? 'ویرایش کلاس' : 'افزودن کلاس جدید'}
                </h3>
                <button
                  onClick={() => setIsClassModalOpen(false)}
                  style={{ color: theme.textSecondary }}
                  className="p-1 rounded-lg hover:opacity-75 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveClass} className="space-y-4">
                <div>
                  <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                    نام درس <span className="text-rose-500">*</span>
                  </label>
                  <div
                    style={{
                      backgroundColor: theme.innerBg,
                      borderColor: classErrors.name ? '#EF4444' : theme.borderLuminous,
                    }}
                    className="rounded-2xl p-3 border"
                  >
                    <input
                      type="text"
                      placeholder="مثال: ریاضی عمومی ۲"
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        if (classErrors.name) setClassErrors({});
                      }}
                      style={{ color: theme.textPrimary }}
                      className="w-full bg-transparent text-sm font-semibold outline-none text-right placeholder-slate-500"
                      autoFocus
                    />
                  </div>
                  {classErrors.name && (
                    <span className="text-xs text-rose-500 font-semibold block mt-1 text-right">
                      {classErrors.name}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                    روز برگزاری
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {WEEK_DAYS.map((d) => {
                      const isSel = formDay === d;
                      return (
                        <button
                          type="button"
                          key={d}
                          onClick={() => setFormDay(d)}
                          style={{
                            backgroundColor: isSel ? theme.primary : theme.innerBg,
                            borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                            color: isSel ? '#FFFFFF' : theme.textSecondary,
                          }}
                          className="py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center"
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label style={{ color: theme.textPrimary }} className="text-xs font-bold text-right">
                      بازه زمانی برگزاری (ساعت) <span className="text-rose-500">*</span>
                    </label>
                    <span style={{ color: theme.textMuted }} className="text-[10.5px]">
                      ۵ بازه استاندارد ۲ ساعته یا ساعت دلخواه
                    </span>
                  </div>

                  {/* 5 Standard 2-Hour Presets with Neumorphic Tactile States */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2.5">
                    {COMMON_SLOTS.map((slot) => {
                      const isSel = formTime === slot && !formCustomTime;
                      return (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => {
                            setFormTime(slot);
                            setFormCustomTime('');
                          }}
                          style={{
                            backgroundColor: isSel ? theme.primary : theme.innerBg,
                            borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                            color: isSel ? '#FFFFFF' : theme.textSecondary,
                            boxShadow: isSel
                              ? `inset 0 2px 4px rgba(0,0,0,0.25), 0 0 12px ${theme.glowColor}`
                              : '0 2px 6px rgba(0,0,0,0.15)',
                          }}
                          className="py-2.5 px-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 active:scale-98 hover:opacity-90"
                        >
                          <span className="font-mono text-[11.5px] font-extrabold dir-ltr">
                            {toPersianDigits(slot)}
                          </span>
                          <span className="text-[9.5px] font-mono opacity-80 dir-ltr">{slot}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Automated Custom Time Selection (Zero Error, No Manual TextInput) */}
                  {formCustomTime ? (
                    <div
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.primary,
                        boxShadow: `0 0 12px ${theme.glowColor}`,
                      }}
                      className="rounded-2xl p-3 border flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          style={{ backgroundColor: theme.primary }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                        >
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="text-right">
                          <div style={{ color: theme.textMuted }} className="text-[10.5px] font-bold">
                            ساعت انتخابی کاربر (تأییدشده):
                          </div>
                          <div style={{ color: theme.primaryLight }} className="text-xs font-extrabold font-mono dir-ltr">
                            {toPersianDigits(formCustomTime)} ({formCustomTime})
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenCustomTimePicker(formCustomTime)}
                          style={{
                            backgroundColor: theme.cardBg,
                            borderColor: theme.borderLuminous,
                            color: theme.textPrimary,
                          }}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold border hover:opacity-85 cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Edit2 className="w-3 h-3 text-sky-400" />
                          <span>ویرایش</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleClearCustomTime}
                          className="p-1.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          title="حذف و بازگشت به ساعات پیش‌فرض"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenCustomTimePicker()}
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.borderLuminous,
                        color: theme.textPrimary,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      }}
                      className="w-full py-2.5 px-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 hover:border-blue-400/50 hover:bg-blue-500/5 transition-all cursor-pointer group active:scale-98"
                    >
                      <Clock className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                      <span>انتخاب ساعت دلخواه (تنظیم خودکار شروع و پایان بدون خطا)</span>
                    </button>
                  )}
                </div>

                <div>
                  <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                    چرخه برگزاری کلاس <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'every_week' as RecurrenceType, label: 'هر هفته', icon: '🔁' },
                      { key: 'even_weeks' as RecurrenceType, label: 'هفته‌های زوج', icon: '✌️' },
                      { key: 'odd_weeks' as RecurrenceType, label: 'هفته‌های فرد', icon: '☝️' },
                      { key: 'bi_weekly' as RecurrenceType, label: 'یک هفته در میان', icon: '📅' },
                    ].map((opt) => {
                      const isSel = formRecurrence === opt.key;
                      return (
                        <button
                          type="button"
                          key={opt.key}
                          onClick={() => {
                            setFormRecurrence(opt.key);
                            if (opt.key !== 'every_week') {
                              setIsJalaliSpringModalOpen(true);
                            } else {
                              setFormScheduledSessions([]);
                            }
                          }}
                          style={{
                            backgroundColor: isSel ? theme.primary : theme.innerBg,
                            borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                            color: isSel ? '#FFFFFF' : theme.textSecondary,
                            boxShadow: isSel ? `0 0 10px ${theme.glowColor}` : 'none',
                          }}
                          className="py-2.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 active:scale-95"
                        >
                          <span className="text-sm">{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Neumorphic soft-inset chip under the recurrence selector */}
                  {formRecurrence !== 'every_week' && formAnchorDate ? (
                    <div
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.borderLuminous,
                        boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)',
                      }}
                      className="mt-2.5 p-3 rounded-2xl border text-right transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                          <span style={{ color: theme.textPrimary }} className="text-xs font-bold">
                            مبدأ دوره: {formAnchorLabel || formAnchorDate} • پیش‌بینی ۸ جلسه تا پایان ترم
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsJalaliSpringModalOpen(true)}
                          style={{ backgroundColor: theme.primary }}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white shadow-sm hover:opacity-90 cursor-pointer"
                        >
                          تغییر تاریخ مبدأ
                        </button>
                      </div>
                      {formScheduledSessions.length > 0 && (
                        <div className="text-[10.5px] text-emerald-400 font-semibold mt-1.5 pt-1.5 border-t border-white/5">
                          ✓ ۸ جلسه تحصیلی به فواصل ۱۴ روزه در تقویم ترم ثبت گردید.
                        </div>
                      )}
                    </div>
                  ) : formRecurrence !== 'every_week' ? (
                    <button
                      type="button"
                      onClick={() => setIsJalaliSpringModalOpen(true)}
                      className="w-full mt-2.5 p-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-500/20 cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>برای کلاس چرخشی، لطفاً تاریخ اولین جلسه (مبدأ) را مشخص نمایید</span>
                    </button>
                  ) : null}
                </div>

                <div>
                  <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                    نام استاد (اختیاری)
                  </label>
                  <div
                    style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                    className="rounded-2xl p-3 border"
                  >
                    <input
                      type="text"
                      placeholder="نام استاد را وارد نمایید"
                      value={formProfessor}
                      onChange={(e) => setFormProfessor(e.target.value)}
                      style={{ color: theme.textPrimary }}
                      className="w-full bg-transparent text-sm font-semibold outline-none text-right placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                    محل برگزاری (اختیاری)
                  </label>
                  <div
                    style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                    className="rounded-2xl p-3 border"
                  >
                    <input
                      type="text"
                      placeholder="شماره کلاس یا نام دانشکده"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      style={{ color: theme.textPrimary }}
                      className="w-full bg-transparent text-sm font-semibold outline-none text-right placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsClassModalOpen(false)}
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
                    {editingId ? 'ذخیره تغییرات' : 'ثبت کلاس'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2-STEP AUTOMATED CUSTOM TIME PICKER MODAL (Zero-Error) */}
        {isTimePickerModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderLuminous,
              }}
              className="liquid-glass rounded-3xl p-6 max-w-md w-full border shadow-2xl transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: theme.primary }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <h3 style={{ color: theme.textPrimary }} className="text-sm font-black">
                      تنظیم خودکار ساعت دلخواه
                    </h3>
                    <p style={{ color: theme.textSecondary }} className="text-[10.5px]">
                      فرآیند ۲ مرحله‌ای با اعتبارسنجی خودکار و امکان خطای صفر
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTimePickerModalOpen(false)}
                  style={{ color: theme.textSecondary }}
                  className="p-1 rounded-lg hover:opacity-75 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Navigation Indicator */}
              <div className="flex items-center gap-2 mb-4 p-1 rounded-2xl bg-black/20 border border-white/5">
                <button
                  type="button"
                  onClick={() => setTimePickerStep(1)}
                  style={{
                    backgroundColor: timePickerStep === 1 ? theme.primary : 'transparent',
                    color: timePickerStep === 1 ? '#FFFFFF' : theme.textSecondary,
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">
                    ۱
                  </span>
                  <span>ساعت شروع</span>
                  {timePickerStep === 2 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (timePickerStep === 1) {
                      handleNextTimeStep();
                    }
                  }}
                  style={{
                    backgroundColor: timePickerStep === 2 ? theme.primary : 'transparent',
                    color: timePickerStep === 2 ? '#FFFFFF' : theme.textSecondary,
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">
                    ۲
                  </span>
                  <span>ساعت اتمام</span>
                </button>
              </div>

              {/* STEP 1: Select Start Time */}
              {timePickerStep === 1 && (
                <div className="space-y-4">
                  <div
                    style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                    className="p-3 rounded-2xl border text-center"
                  >
                    <span style={{ color: theme.textMuted }} className="text-xs font-bold block mb-1">
                      ساعت شروع انتخابی:
                    </span>
                    <div
                      style={{ color: theme.primaryLight }}
                      className="text-2xl font-black font-mono tracking-wider dir-ltr"
                    >
                      {toPersianDigits(pickerStartHour.toString().padStart(2, '0'))}:
                      {toPersianDigits(pickerStartMin.toString().padStart(2, '0'))}
                      <span className="text-xs font-normal opacity-60 mr-2">
                        ({pickerStartHour.toString().padStart(2, '0')}:{pickerStartMin.toString().padStart(2, '0')})
                      </span>
                    </div>
                  </div>

                  {/* Hours Grid */}
                  <div>
                    <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                      ساعت شروع:
                    </label>
                    <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                      {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((h) => {
                        const isSel = pickerStartHour === h;
                        return (
                          <button
                            type="button"
                            key={h}
                            onClick={() => {
                              setPickerStartHour(h);
                              if (pickerEndHour <= h) {
                                setPickerEndHour(Math.min(h + 2, 22));
                              }
                            }}
                            style={{
                              backgroundColor: isSel ? theme.primary : theme.innerBg,
                              borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                              color: isSel ? '#FFFFFF' : theme.textSecondary,
                              boxShadow: isSel ? `0 0 10px ${theme.glowColor}` : 'none',
                            }}
                            className="py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer font-mono text-center hover:opacity-90 active:scale-95"
                          >
                            {toPersianDigits(h.toString().padStart(2, '0'))}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Minutes Grid */}
                  <div>
                    <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                      دقیقه شروع:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 15, 30, 45].map((m) => {
                        const isSel = pickerStartMin === m;
                        return (
                          <button
                            type="button"
                            key={m}
                            onClick={() => setPickerStartMin(m)}
                            style={{
                              backgroundColor: isSel ? theme.primary : theme.innerBg,
                              borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                              color: isSel ? '#FFFFFF' : theme.textSecondary,
                            }}
                            className="py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer font-mono text-center hover:opacity-90"
                          >
                            :{toPersianDigits(m.toString().padStart(2, '0'))}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p style={{ color: theme.textMuted }} className="text-[11px] text-right leading-relaxed">
                    💡 با زدن دکمه زیر، مستقیماً به انتخاب ساعت اتمام می‌روید و بازه زمانی کلاس به طور خودکار آماده می‌شود.
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsTimePickerModalOpen(false)}
                      style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                      className="px-4 py-2.5 rounded-2xl text-xs font-bold border text-slate-400 cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNextTimeStep()}
                      style={{ backgroundColor: theme.primary }}
                      className="flex-1 py-2.5 rounded-2xl text-xs font-black text-white shadow-md cursor-pointer hover:opacity-95 flex items-center justify-center gap-1.5"
                    >
                      <span>مرحله بعدی: انتخاب ساعت اتمام</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Select End Time */}
              {timePickerStep === 2 && (
                <div className="space-y-3.5">
                  {/* Confirmed Start Time Chip */}
                  <div
                    style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                    className="p-2.5 rounded-2xl border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                        ✓
                      </span>
                      <span style={{ color: theme.textSecondary }} className="text-xs">
                        ساعت شروع کلاس:
                      </span>
                      <strong style={{ color: theme.textPrimary }} className="text-xs font-mono dir-ltr font-black">
                        {toPersianDigits(pickerStartHour.toString().padStart(2, '0'))}:
                        {toPersianDigits(pickerStartMin.toString().padStart(2, '0'))}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTimePickerStep(1)}
                      style={{ color: theme.primaryLight }}
                      className="text-xs font-bold hover:underline cursor-pointer"
                    >
                      ویرایش شروع
                    </button>
                  </div>

                  {/* Fast Duration Shortcuts */}
                  <div>
                    <label style={{ color: theme.textPrimary }} className="block text-[11px] font-bold mb-1.5 text-right">
                      تنظیم سریع بر اساس طول استاندارد کلاس:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: '+۱:۳۰ ساعت', mins: 90 },
                        { label: '+۱:۴۵ ساعت', mins: 105 },
                        { label: '+۲:۰۰ ساعت', mins: 120 },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.mins}
                          onClick={() => handleApplyDurationShortcut(item.mins)}
                          style={{
                            backgroundColor: theme.innerBg,
                            borderColor: theme.borderLuminous,
                            color: theme.textPrimary,
                          }}
                          className="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer hover:border-sky-400 hover:text-sky-400 text-center"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* End Hour Grid */}
                  <div>
                    <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                      ساعت اتمام:
                    </label>
                    <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                      {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((h) => {
                        const isSel = pickerEndHour === h;
                        const isTooEarly = h < pickerStartHour;
                        return (
                          <button
                            type="button"
                            key={h}
                            disabled={isTooEarly}
                            onClick={() => {
                              setPickerEndHour(h);
                              setTimePickerError(null);
                            }}
                            style={{
                              backgroundColor: isSel
                                ? theme.primary
                                : isTooEarly
                                ? 'rgba(255, 255, 255, 0.03)'
                                : theme.innerBg,
                              borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                              color: isSel ? '#FFFFFF' : isTooEarly ? 'rgba(148, 163, 184, 0.3)' : theme.textSecondary,
                              boxShadow: isSel ? `0 0 10px ${theme.glowColor}` : 'none',
                              opacity: isTooEarly ? 0.4 : 1,
                              cursor: isTooEarly ? 'not-allowed' : 'pointer',
                            }}
                            className="py-2 rounded-xl text-xs font-bold border transition-all font-mono text-center hover:opacity-90 active:scale-95"
                          >
                            {toPersianDigits(h.toString().padStart(2, '0'))}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* End Minute Grid */}
                  <div>
                    <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                      دقیقه اتمام:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 15, 30, 45].map((m) => {
                        const isSel = pickerEndMin === m;
                        return (
                          <button
                            type="button"
                            key={m}
                            onClick={() => {
                              setPickerEndMin(m);
                              setTimePickerError(null);
                            }}
                            style={{
                              backgroundColor: isSel ? theme.primary : theme.innerBg,
                              borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                              color: isSel ? '#FFFFFF' : theme.textSecondary,
                            }}
                            className="py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer font-mono text-center hover:opacity-90"
                          >
                            :{toPersianDigits(m.toString().padStart(2, '0'))}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Validation State & Preview Banner */}
                  {(() => {
                    const startTotal = pickerStartHour * 60 + pickerStartMin;
                    const endTotal = pickerEndHour * 60 + pickerEndMin;
                    const isValid = endTotal > startTotal;
                    const durationMins = endTotal - startTotal;
                    const durHours = Math.floor(durationMins / 60);
                    const durMins = durationMins % 60;

                    if (!isValid) {
                      return (
                        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs text-right font-bold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>ساعت اتمام باید بعد از ساعت شروع باشد.</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                        className="p-2.5 rounded-xl border text-center space-y-1"
                      >
                        <div style={{ color: theme.primaryLight }} className="text-xs font-bold">
                          بازه تأییدشده: از{' '}
                          <span className="font-mono dir-ltr">
                            {toPersianDigits(pickerStartHour.toString().padStart(2, '0'))}:
                            {toPersianDigits(pickerStartMin.toString().padStart(2, '0'))}
                          </span>{' '}
                          تا{' '}
                          <span className="font-mono dir-ltr">
                            {toPersianDigits(pickerEndHour.toString().padStart(2, '0'))}:
                            {toPersianDigits(pickerEndMin.toString().padStart(2, '0'))}
                          </span>
                        </div>
                        <div style={{ color: theme.textMuted }} className="text-[10.5px]">
                          طول جلسه:{' '}
                          {durHours > 0 ? `${toPersianDigits(durHours)} ساعت` : ''}{' '}
                          {durMins > 0 ? `و ${toPersianDigits(durMins)} دقیقه` : ''}
                        </div>
                      </div>
                    );
                  })()}

                  {timePickerError && (
                    <div className="text-xs text-rose-500 font-bold text-right">{timePickerError}</div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setTimePickerStep(1)}
                      style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                      className="px-4 py-2.5 rounded-2xl text-xs font-bold border text-slate-400 cursor-pointer"
                    >
                      مرحله قبل
                    </button>
                    <button
                      type="button"
                      disabled={pickerEndHour * 60 + pickerEndMin <= pickerStartHour * 60 + pickerStartMin}
                      onClick={handleConfirmCustomTime}
                      style={{
                        backgroundColor:
                          pickerEndHour * 60 + pickerEndMin > pickerStartHour * 60 + pickerStartMin
                            ? theme.primary
                            : '#64748B',
                        opacity: pickerEndHour * 60 + pickerEndMin > pickerStartHour * 60 + pickerStartMin ? 1 : 0.5,
                        cursor:
                          pickerEndHour * 60 + pickerEndMin > pickerStartHour * 60 + pickerStartMin
                            ? 'pointer'
                            : 'not-allowed',
                      }}
                      className="flex-1 py-2.5 rounded-2xl text-xs font-black text-white shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>تأیید و ذخیره ساعت انتخابی</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SPRING-ANIMATED JALALI CALENDAR MODAL (tension: 50, friction: 7) */}
        {isJalaliSpringModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[65] flex items-center justify-center p-4">
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
                      تاریخ اولین جلسه این درس را مشخص کنید
                    </h3>
                    <p style={{ color: theme.textSecondary }} className="text-[10px]">
                      مبدأ چرخه ۱۴ روزه و پیش‌بینی ۸ جلسه تا پایان ترم
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsJalaliSpringModalOpen(false)}
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
                    if (calSelectedMonth === 1) {
                      setCalSelectedYear((y) => y - 1);
                      setCalSelectedMonth(12);
                    } else {
                      setCalSelectedMonth((m) => m - 1);
                    }
                  }}
                  className="px-2 py-1 rounded-lg text-sky-400 hover:bg-white/5 cursor-pointer"
                >
                  ‹ ماه قبل
                </button>
                <span style={{ color: theme.textPrimary }} className="font-extrabold text-sm">
                  {PERSIAN_MONTHS[calSelectedMonth - 1]} {toPersianDigits(calSelectedYear)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (calSelectedMonth === 12) {
                      setCalSelectedYear((y) => y + 1);
                      setCalSelectedMonth(1);
                    } else {
                      setCalSelectedMonth((m) => m + 1);
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
                  const [gy, gm, gd] = jalaliToGregorian(calSelectedYear, calSelectedMonth, 1);
                  const firstDay = new Date(gy, gm - 1, gd).getDay();
                  const offset = (firstDay + 1) % 7;
                  const totalDays = getDaysInJalaliMonth(calSelectedYear, calSelectedMonth);

                  return (
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {Array.from({ length: offset }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-8" />
                      ))}
                      {Array.from({ length: totalDays }).map((_, i) => {
                        const dayNum = i + 1;
                        const isSel = calSelectedDay === dayNum;
                        return (
                          <button
                            type="button"
                            key={dayNum}
                            onClick={() => setCalSelectedDay(dayNum)}
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

              {/* Selected Anchor Preview Chip */}
              <div
                style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                className="p-2.5 rounded-xl border text-center space-y-1 mb-3"
              >
                <div style={{ color: theme.primaryLight }} className="text-xs font-bold">
                  مبدأ دوره: {toPersianDigits(calSelectedDay)} {PERSIAN_MONTHS[calSelectedMonth - 1]} {toPersianDigits(calSelectedYear)}
                </div>
                <div className="text-[10.5px] text-emerald-400 font-semibold">
                  ✨ پیش‌بینی خودکار ۸ جلسه تا پایان ۱۶ هفته ترم تحصیلی
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsJalaliSpringModalOpen(false)}
                  style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold border text-slate-400 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAnchorDateWeb(calSelectedYear, calSelectedMonth, calSelectedDay)}
                  style={{ backgroundColor: theme.primary }}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-black text-white shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
                >
                  <Check className="w-4 h-4" />
                  <span>تأیید و ذخیره تاریخ مبدأ</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
                      const idToDelete = selectedChatSessionLog.id;
                      setSelectedChatSessionLog(null);
                      setSessionLogs((prev) => prev.filter((l) => l.id !== idToDelete));
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
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
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
                  <div className="flex items-start gap-2.5 max-w-[94%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400 border border-purple-500/30 flex-shrink-0 mt-1">
                      <Mic className="w-4 h-4" />
                    </div>

                    <div
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.borderLuminous,
                      }}
                      className="flex-1 rounded-2xl p-3.5 border shadow-sm"
                    >
                      {/* Bubble Header: Title on Right, Date on Top-Left */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                        <span className="text-xs font-black text-purple-400">
                          صوت ضبط شده جلسه
                        </span>
                        <div className="flex items-center gap-2">
                          <span style={{ color: theme.textMuted }} className="text-[10px] font-mono">
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
                        className="rounded-xl p-3 border space-y-2.5"
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

                          <div className="flex-1 space-y-1.5">
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
                            className="px-2 py-1 rounded-lg border text-[10px] font-black cursor-pointer hover:border-white/20"
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

                {/* 3. Interactive Documents & Slides Bubbles */}
                {selectedChatSessionLog.attachedFiles && selectedChatSessionLog.attachedFiles.length > 0 && (
                  <div className="flex items-start gap-2.5 max-w-[94%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0 mt-1">
                      <Paperclip className="w-4 h-4" />
                    </div>

                    <div
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.borderLuminous,
                      }}
                      className="flex-1 rounded-2xl p-3.5 border shadow-sm"
                    >
                      {/* Bubble Header: Title on Right, Date on Top-Left */}
                      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/5">
                        <span className="text-xs font-black text-blue-400">
                          مستندات و فایل‌های کلاسی ({selectedChatSessionLog.attachedFiles.length})
                        </span>
                        <span style={{ color: theme.textMuted }} className="text-[10px] font-mono">
                          {selectedChatSessionLog.createdAt.includes('/') ? selectedChatSessionLog.createdAt.split('-')[0].trim() : getJalaliDateNumeric()}
                        </span>
                      </div>

                      <div className="space-y-2 w-full min-w-0">
                        {selectedChatSessionLog.attachedFiles.map((file) => (
                          <div
                            key={file.id}
                            style={{
                              backgroundColor: theme.cardBg,
                              borderColor: theme.borderLuminous,
                            }}
                            className="p-2.5 rounded-xl border flex items-center justify-between transition-all group w-full max-w-full min-w-0 overflow-hidden"
                          >
                            <div
                              onClick={() => handleOpenFileWeb(file)}
                              className="flex items-center gap-2 overflow-hidden cursor-pointer flex-1 min-w-0 mr-2"
                              title={file.name}
                            >
                              <div className="flex-shrink-0">{renderFileTypeTag(file.type)}</div>
                              <span
                                style={{ color: theme.textPrimary }}
                                className="text-xs font-bold truncate group-hover:text-blue-400 transition-colors min-w-0 flex-1"
                              >
                                {truncateFileNameMiddle(file.name, 22)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span style={{ color: theme.textMuted }} className="text-[10px] whitespace-nowrap">
                                {file.sizeText}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenFileWeb(file)}
                                className="p-1 hover:bg-blue-500/10 rounded-lg text-blue-400 cursor-pointer"
                                title="باز کردن فایل"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSessionFileWeb(file.id);
                                }}
                                className="p-1 hover:bg-rose-500/15 rounded-lg text-rose-400 cursor-pointer transition-colors"
                                title="حذف فایل پیوست"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                )}

                {/* 4. Lecture Notes Message Bubble */}
                {selectedChatSessionLog.notesText && (
                  <div className="flex items-start gap-2.5 max-w-[94%] min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0 mt-1">
                      <FileText className="w-4 h-4" />
                    </div>

                    <div
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.borderLuminous,
                      }}
                      className="flex-1 rounded-2xl p-3.5 border shadow-sm min-w-0"
                    >
                      {/* Bubble Header: Title on Right, Date on Top-Left */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                        <span className="text-xs font-black text-emerald-400">
                          نکات و خلاصه تدریس استاد
                        </span>
                        <span style={{ color: theme.textMuted }} className="text-[10px] font-mono">
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

                {/* 5. Smart Reminder Bubble (Persian Translation Fixed) */}
                {selectedChatSessionLog.hasReminder && (
                  <div className="flex items-start gap-2.5 max-w-[94%] min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0 mt-1">
                      <Bell className="w-4 h-4" />
                    </div>

                    <div
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: 'rgba(244, 63, 94, 0.3)',
                      }}
                      className="flex-1 rounded-2xl p-3.5 border shadow-sm min-w-0"
                    >
                      {/* Bubble Header: Title on Right, Date on Top-Left */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                        <span className="text-xs font-black text-rose-400">
                          یادآور فعال
                        </span>
                        <span style={{ color: theme.textMuted }} className="text-[10px] font-mono">
                          {selectedChatSessionLog.createdAt.includes('/') ? selectedChatSessionLog.createdAt.split('-')[0].trim() : getJalaliDateNumeric()}
                        </span>
                      </div>

                      <p style={{ color: theme.textPrimary }} className="text-xs font-bold py-1">
                        زمان مرور: یادآور {formatPersianReminderText(selectedChatSessionLog.reminderTrigger, selectedChatSessionLog.reminderTimeText)}
                      </p>

                      {selectedChatSessionLog.snoozedUntil && (
                        <div className="mt-1.5 inline-block px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-300 text-[10px] font-bold">
                          وضعیت تعویق: فعال ({selectedChatSessionLog.snoozedUntil})
                        </div>
                      )}

                      {/* Bubble Footer: Time on Bottom-Left */}
                      <div className="flex justify-start pt-1.5 mt-1 border-t border-white/5">
                        <span style={{ color: theme.textMuted }} className="text-[10px] font-mono">
                          {selectedChatSessionLog.createdAt.split('-').pop()?.trim() || selectedChatSessionLog.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

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
                  onClick={() => chatFileInputRef.current?.click()}
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
      </main>

      {/* FLOATING CIRCULAR RADIAL MENU (CIRCLE MENU) - Hidden when modal is active */}
      {!selectedChatSessionLog && !isSessionCaptureOpen && !isClassModalOpen && !isEditingProfile && !deletingId && (
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
