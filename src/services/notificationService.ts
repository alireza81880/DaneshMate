import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ActionPerformed } from '@capacitor/local-notifications';
import { parseTime, toPersianDigits } from '../utils/time';

const CHANNEL_ID = 'daneshmate-reminders';

/**
 * Generate exactly 8 bi-weekly session calendar dates for a 16-week academic horizon.
 * Uses local calendar date arithmetic to prevent daylight saving/timezone drift.
 * Occurrences: anchor (+0 days), +14 days, +28 days, +42 days, +56 days, +70 days, +84 days, +98 days.
 * Note: +112 days is 16 full weeks later and marks the end/beyond the semester, so it is strictly excluded.
 */
export function generateBiWeeklyOccurrences(anchorTimestamp: number): number[] {
  const occurrences: number[] = [];
  const base = new Date(anchorTimestamp);
  for (let i = 0; i < 8; i++) {
    const occ = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    occ.setDate(occ.getDate() + i * 14);
    occurrences.push(occ.getTime());
  }
  return occurrences;
}

/**
 * Generate 16 weekly session calendar dates for a 16-week academic semester.
 */
export function generateWeeklyOccurrences(anchorOrStartTimestamp: number): number[] {
  const occurrences: number[] = [];
  const base = new Date(anchorOrStartTimestamp);
  for (let i = 0; i < 16; i++) {
    const occ = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    occ.setDate(occ.getDate() + i * 7);
    occurrences.push(occ.getTime());
  }
  return occurrences;
}

export interface ScheduleReminderOptions {
  id?: string;
  logId?: string;
  classId?: string;
  className: string;
  location?: string;
  notesText?: string;
  trigger?: string;
  reminderMode?: 'before_class' | 'exact_time';
  minutesBefore?: number;
  exactTime?: string;
  exactTimestamp?: number;
  sessionDateStr?: string;
  snoozedUntil?: string; // Legacy compatibility only
  classTime?: string;
  classDay?: string;
  isClassReminder?: boolean;
  recurrence?: string;
  anchorDate?: string;
  anchorTimestamp?: number;
  scheduledSessionTimestamps?: number[];
}

export type NotificationActionListener = (actionId: 'tap', data: {
  itemId: string;
  className: string;
  isClassReminder?: boolean;
  logId?: string;
  classId?: string;
  occurrenceDate?: string;
  occurrenceTimestamp?: number;
  classTime?: string;
  classDay?: string;
  notesText?: string;
  location?: string;
}) => void;

class NotificationService {
  private channelCreated = false;
  private listeners: Set<NotificationActionListener> = new Set();
  private setupListenerInitialized = false;
  private pendingAction: { actionId: 'tap'; data: any } | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.initNativeActionListener();
      }, 300);
    }
  }

  /**
   * Register a callback listener in the React app for notification tap navigation
   */
  public addActionListener(fn: NotificationActionListener): () => void {
    this.listeners.add(fn);
    if (this.pendingAction) {
      const act = this.pendingAction;
      this.pendingAction = null;
      try {
        fn(act.actionId, act.data);
      } catch (err) {
        console.warn('[NotificationService] Pending action dispatch error:', err);
      }
    }
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notifyActionListeners(actionId: 'tap', data: any) {
    if (this.listeners.size === 0) {
      this.pendingAction = { actionId, data };
      return;
    }
    for (const listener of this.listeners) {
      try {
        listener(actionId, data);
      } catch (err) {
        console.warn('[NotificationService] Listener error:', err);
      }
    }
  }

  /**
   * Listen to native notification tap events (to open app and navigate to relevant session/class)
   */
  private initNativeActionListener() {
    if (!Capacitor.isNativePlatform() || this.setupListenerInitialized) return;

    try {
      LocalNotifications.addListener('localNotificationActionPerformed', async (action: ActionPerformed) => {
        console.log('[NotificationService] localNotificationActionPerformed (Normal Tap):', action);
        const { notification } = action;
        const extra = notification.extra || {};
        const itemId = extra.logId || extra.classId || extra.id || String(notification.id);
        const className = extra.className || notification.title || '';
        const isClassReminder = Boolean(extra.isClassReminder);
        const occurrenceDate = extra.occurrenceDate || new Date().toISOString().split('T')[0];

        // Normal tap opens the app / navigates
        this.notifyActionListeners('tap', {
          itemId,
          className,
          isClassReminder,
          logId: extra.logId,
          classId: extra.classId,
          occurrenceDate,
          occurrenceTimestamp: extra.occurrenceTimestamp,
          classTime: extra.classTime,
          classDay: extra.classDay,
          notesText: extra.notesText,
          location: extra.location,
        });
      });

      this.setupListenerInitialized = true;
    } catch (e) {
      console.warn('[NotificationService] Failed to bind localNotificationActionPerformed:', e);
    }
  }

  /**
   * Compute stable positive 32-bit integer ID from log/class string
   */
  public getNotificationId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash) % 2147483647;
  }

  /**
   * Compute deterministic, collision-resistant positive 31-bit integer ID for each class occurrence
   */
  public getClassOccurrenceNotificationId(classId: string, occurrenceTimestamp: number): number {
    const key = `cls_${classId}_${occurrenceTimestamp}`;
    let hash = 2166136261;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const id = (hash >>> 0) % 2147483647;
    return id === 0 ? 1 : id;
  }

  /**
   * Ensure dedicated high-priority notification channel exists on Android
   */
  public async ensureChannel(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    if (!this.channelCreated) {
      try {
        await LocalNotifications.createChannel({
          id: CHANNEL_ID,
          name: 'یادآورهای هوشمند دانش‌میت',
          description: 'اعلان‌های صوتی و هشدارهای پیش از شروع کلاس‌ها و جلسات درسی',
          importance: 4, // High importance
          visibility: 1, // Public visibility on lockscreen
          vibration: true,
          lights: true,
          lightColor: '#3B82F6',
        });
        this.channelCreated = true;
      } catch (e) {
        console.warn('[NotificationService] Channel creation notice:', e);
      }
    }
  }

  /**
   * Request display and exact alarm permissions
   */
  public async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;

    try {
      await this.ensureChannel();

      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') {
          return false;
        }
      }

      // Check Exact Alarm for Android 12+ (API 31+)
      try {
        const exactStatus = await LocalNotifications.checkExactNotificationSetting();
        if (exactStatus.exact_alarm !== 'granted') {
          console.info('[NotificationService] Exact alarm setting status:', exactStatus);
          await LocalNotifications.changeExactNotificationSetting();
        }
      } catch (exactErr) {
        console.warn('[NotificationService] Exact alarm check notice:', exactErr);
      }

      return true;
    } catch (err) {
      console.error('[NotificationService] Permission check error:', err);
      return false;
    }
  }

  /**
   * Parse minutes before class from trigger string or explicit number
   */
  public parseMinutesBefore(trigger?: string, explicitMinutes?: number): number {
    if (explicitMinutes !== undefined && !isNaN(explicitMinutes)) {
      return explicitMinutes;
    }
    if (!trigger) return 30; // default 30 minutes before class

    const trg = trigger.toLowerCase();
    if (trg.includes('15') || trg.includes('۱۵')) return 15;
    if (trg.includes('30') || trg.includes('۳۰')) return 30;
    if (trg.includes('45') || trg.includes('۴۵')) return 45;
    if (trg.includes('2 hour') || trg.includes('۲ ساعت') || trg.includes('120')) return 120;
    if (trg.includes('1 hour') || trg.includes('۱ ساعت') || trg.includes('60')) return 60;
    if (trg.includes('24 hour') || trg.includes('۲۴ ساعت') || trg.includes('1 day') || trg.includes('۱ روز') || trg.includes('1440')) return 1440;
    if (trg.includes('2 days') || trg.includes('۲ روز')) return 2880;

    const numMatch = trigger.match(/(\d+)/);
    if (numMatch) {
      const val = parseInt(numMatch[1], 10);
      if (trg.includes('hour') || trg.includes('ساعت')) return val * 60;
      if (trg.includes('day') || trg.includes('روز')) return val * 1440;
      return val;
    }

    return 30;
  }

  /**
   * Calculate scheduled Date based on class weekday, class time, "before class" minutes, or exact timestamp
   */
  public calculateScheduleDate(
    trigger?: string,
    _legacySnooze?: string,
    classTime?: string,
    classDay?: string,
    explicitMinutesBefore?: number,
    exactTime?: string,
    exactTimestamp?: number
  ): Date {
    const now = Date.now();

    // 1. Handle exact timestamp directly if provided (One-time session reminder)
    if (exactTimestamp && !isNaN(exactTimestamp) && exactTimestamp > 0) {
      return new Date(exactTimestamp);
    }

    // Map Persian weekday to JavaScript Date.getDay() (Sunday=0 ... Saturday=6)
    const PERSIAN_DAY_TO_JS: Record<string, number> = {
      'یکشنبه': 0,
      'دوشنبه': 1,
      'سه‌شنبه': 2,
      'چهارشنبه': 3,
      'پنج‌شنبه': 4,
      'جمعه': 5,
      'شنبه': 6,
    };
    const targetDayIndex = classDay ? PERSIAN_DAY_TO_JS[classDay] : undefined;
    const nowDate = new Date(now);

    // 2. Handle Exact Clock Time for weekly class reminder (e.g. "18:30")
    if (exactTime && exactTime.includes(':')) {
      const parts = exactTime.split(':').map((s) => parseInt(s.trim().replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const remHour = parts[0];
        const remMin = parts[1];

        if (targetDayIndex !== undefined) {
          let daysAhead = (targetDayIndex - nowDate.getDay() + 7) % 7;
          let scheduledAt = new Date(
            nowDate.getFullYear(),
            nowDate.getMonth(),
            nowDate.getDate() + daysAhead,
            remHour,
            remMin,
            0,
            0
          );
          if (scheduledAt.getTime() <= now) {
            scheduledAt = new Date(
              scheduledAt.getFullYear(),
              scheduledAt.getMonth(),
              scheduledAt.getDate() + 7,
              remHour,
              remMin,
              0,
              0
            );
          }
          return scheduledAt;
        } else {
          let scheduledAt = new Date(
            nowDate.getFullYear(),
            nowDate.getMonth(),
            nowDate.getDate(),
            remHour,
            remMin,
            0,
            0
          );
          if (scheduledAt.getTime() <= now) {
            scheduledAt.setDate(scheduledAt.getDate() + 1);
          }
          return scheduledAt;
        }
      }
    }

    // 3. Parse class start hour & minute (e.g. "08:00 - 10:00" -> 8:00)
    let classHour = 8;
    let classMin = 0;
    if (classTime) {
      const match = classTime.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        classHour = parseInt(match[1], 10);
        classMin = parseInt(match[2], 10);
      }
    }

    const minutesBefore = this.parseMinutesBefore(trigger, explicitMinutesBefore);

    if (targetDayIndex !== undefined) {
      // Calculate next occurrence of this weekday
      let daysAhead = (targetDayIndex - nowDate.getDay() + 7) % 7;
      let targetClassDate = new Date(
        nowDate.getFullYear(),
        nowDate.getMonth(),
        nowDate.getDate() + daysAhead,
        classHour,
        classMin,
        0,
        0
      );

      // Subtract configurable "before class" minutes
      let scheduledAt = new Date(targetClassDate.getTime() - minutesBefore * 60 * 1000);

      // If scheduled time has already passed for this week's occurrence, schedule for next week (+7 days)
      if (scheduledAt.getTime() <= now) {
        targetClassDate = new Date(
          targetClassDate.getFullYear(),
          targetClassDate.getMonth(),
          targetClassDate.getDate() + 7,
          classHour,
          classMin,
          0,
          0
        );
        scheduledAt = new Date(targetClassDate.getTime() - minutesBefore * 60 * 1000);
      }

      return scheduledAt;
    }

    // Fallback relative to today/tomorrow
    let targetClassDate = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate(),
      classHour,
      classMin,
      0,
      0
    );

    let scheduledAt = new Date(targetClassDate.getTime() - minutesBefore * 60 * 1000);
    if (scheduledAt.getTime() <= now) {
      scheduledAt.setDate(scheduledAt.getDate() + 1);
    }

    return scheduledAt;
  }

  /**
   * Calculate exact notification fire Date for an occurrence day based on class time and reminder settings.
   */
  public calculateOccurrenceFireDate(
    occurrenceTimestamp: number,
    classTime?: string,
    reminderMode?: 'before_class' | 'exact_time',
    minutesBefore?: number,
    exactTime?: string,
    trigger?: string
  ): Date {
    const baseDate = new Date(occurrenceTimestamp);

    // Parse class start hour & minute (default 08:00)
    let classHour = 8;
    let classMin = 0;
    if (classTime) {
      const match = classTime.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        classHour = parseInt(match[1], 10);
        classMin = parseInt(match[2], 10);
      }
    }

    const isExact = reminderMode === 'exact_time' && Boolean(exactTime);
    if (isExact && exactTime) {
      const parsedExact = parseTime(exactTime);
      const remHour = parsedExact ? parsedExact.hour : classHour;
      const remMin = parsedExact ? parsedExact.minute : classMin;
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), remHour, remMin, 0, 0);
    }

    const minutesOffset = this.parseMinutesBefore(trigger, minutesBefore);
    const classStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), classHour, classMin, 0, 0);
    return new Date(classStart.getTime() - minutesOffset * 60 * 1000);
  }

  /**
   * Determine all expected future occurrences (and deterministic notification IDs) for a class within 16-week horizon.
   */
  public getClassExpectedOccurrences(
    classItem: any,
    now: number = Date.now()
  ): { occurrenceTimestamp: number; fireDate: Date; notifId: number }[] {
    if (!classItem.hasReminder) return [];

    const isBiWeekly =
      classItem.recurrence === 'bi_weekly' ||
      classItem.recurrence === 'biweekly' ||
      classItem.recurrence === 'even_weeks' ||
      classItem.recurrence === 'odd_weeks';

    let sessionTimestamps: number[] = [];

    if (isBiWeekly) {
      // Requirement 11: If bi-weekly and NO anchor_timestamp, do NOT guess. Return empty.
      if (!classItem.anchor_timestamp) {
        console.warn(`[NotificationService] Class ${classItem.id} (${classItem.name}) is bi-weekly but has no anchor_timestamp; skipping reminders.`);
        return [];
      }
      sessionTimestamps = generateBiWeeklyOccurrences(classItem.anchor_timestamp);
    } else {
      // Weekly schedule
      let startTimestamp = classItem.anchor_timestamp;
      if (!startTimestamp) {
        const PERSIAN_DAY_TO_JS: Record<string, number> = {
          'یکشنبه': 0, 'دوشنبه': 1, 'سه‌شنبه': 2, 'چهارشنبه': 3, 'پنج‌شنبه': 4, 'جمعه': 5, 'شنبه': 6,
        };
        const targetDayIndex = classItem.day ? PERSIAN_DAY_TO_JS[classItem.day] : undefined;
        const nowDate = new Date(now);
        if (targetDayIndex !== undefined) {
          const daysAhead = (targetDayIndex - nowDate.getDay() + 7) % 7;
          const nextDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + daysAhead);
          startTimestamp = nextDay.getTime();
        } else {
          startTimestamp = now;
        }
      }
      sessionTimestamps = generateWeeklyOccurrences(startTimestamp);
    }

    const isExact = classItem.reminderMode === 'exact_time' && Boolean(classItem.reminderExactTime);
    const minsBefore = isExact ? undefined : (classItem.reminderMinutesBefore ?? 30);

    const occurrences: { occurrenceTimestamp: number; fireDate: Date; notifId: number }[] = [];

    for (const occTs of sessionTimestamps) {
      const fireDate = this.calculateOccurrenceFireDate(
        occTs,
        classItem.time,
        classItem.reminderMode || (isExact ? 'exact_time' : 'before_class'),
        minsBefore,
        classItem.reminderExactTime,
        classItem.reminderTriggerText
      );

      // Only schedule future occurrences
      if (fireDate.getTime() > now) {
        const notifId = this.getClassOccurrenceNotificationId(classItem.id, occTs);
        occurrences.push({
          occurrenceTimestamp: occTs,
          fireDate,
          notifId,
        });
      }
    }

    return occurrences;
  }

  /**
   * Schedule a local notification (Clean, Informational, No Snooze Buttons)
   */
  public async scheduleReminder(opts: ScheduleReminderOptions): Promise<{ scheduled: boolean; at: Date }> {
    const hasPerm = await this.requestPermissions();
    if (!hasPerm) {
      throw new Error('مجوز نمایش اعلان‌ها تأیید نشد. لطفاً در تنظیمات سیستم مجوز نوتیفیکیشن را فعال فرمایید.');
    }

    await this.ensureChannel();

    const targetId = opts.logId || opts.classId || opts.id || 'default_reminder';
    const notifId = this.getNotificationId(targetId);

    // Cancel any previous notification for this item to prevent duplicates
    await this.cancelReminder(targetId);

    const scheduleDate = this.calculateScheduleDate(
      opts.trigger,
      opts.snoozedUntil,
      opts.classTime,
      opts.classDay,
      opts.minutesBefore,
      opts.exactTime,
      opts.exactTimestamp
    );

    const occurrenceDate = scheduleDate.toISOString().split('T')[0];
    const occurrenceTimestamp = scheduleDate.getTime();

    console.log(`[SESSION REMINDER] schedule requested for id=${targetId} at ${scheduleDate.toISOString()} (notifId=${notifId})`);

    // Concise, readable Persian notification titles & bodies (Part 8)
    const notifTitle = '📚 یادآوری جلسه';
    const rawTime = opts.exactTime || scheduleDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const rawDate = opts.sessionDateStr || scheduleDate.toLocaleDateString('fa-IR');
    const timeStr = toPersianDigits(rawTime);
    const dateStr = toPersianDigits(rawDate);
    const notifBody = `مرور جلسه ${opts.className} رو فراموش نکن.\nتاریخ: ${dateStr}\nساعت: ${timeStr}`;

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: notifTitle,
              body: notifBody,
              largeBody: notifBody,
              isExactNotification: true,
              schedule: {
                at: scheduleDate,
                allowWhileIdle: true, // Fire even in Doze / sleep mode
              },
              channelId: CHANNEL_ID,
              smallIcon: 'ic_launcher_foreground',
              sound: 'beep.wav',
              extra: {
                id: targetId,
                logId: opts.logId,
                classId: opts.classId,
                className: opts.className,
                location: opts.location,
                classTime: opts.classTime,
                classDay: opts.classDay,
                isClassReminder: false,
                notesText: opts.notesText,
                occurrenceDate,
                occurrenceTimestamp,
              },
            },
          ],
        });
        console.log(`[SESSION REMINDER] native schedule returned successfully for id=${targetId} (notifId=${notifId}) at ${scheduleDate.toLocaleString('fa-IR')}`);
        console.log(`[NotificationService] Scheduled notification #${notifId} for ${scheduleDate.toLocaleString('fa-IR')}`);
      } catch (err: any) {
        console.error('[NotificationService] Native schedule failure:', err);
        throw new Error(err?.message || 'خطا در زمان‌بندی آلارم در سیستم‌عامل اندروید');
      }
    } else {
      console.log(`[SESSION REMINDER] simulated web schedule for id=${targetId} (notifId=${notifId}) at ${scheduleDate.toISOString()}`);
      console.log(`[NotificationService Web] Simulated schedule for #${notifId} at ${scheduleDate.toISOString()}`);
    }

    return { scheduled: true, at: scheduleDate };
  }

  /**
   * Schedule all class-level recurring reminder occurrences (up to 8 alarms for bi-weekly, 16 for weekly)
   */
  public async scheduleClassReminder(classItem: any): Promise<{ scheduled: boolean; scheduledCount: number; occurrences: Date[]; at?: Date }> {
    const classId = classItem.id;

    // 1. Cancel previous occurrences for this class before scheduling new ones
    await this.cancelClassReminder(classId, classItem);

    if (!classItem.hasReminder) {
      return { scheduled: false, scheduledCount: 0, occurrences: [] };
    }

    const isBiWeekly =
      classItem.recurrence === 'bi_weekly' ||
      classItem.recurrence === 'biweekly' ||
      classItem.recurrence === 'even_weeks' ||
      classItem.recurrence === 'odd_weeks';

    if (isBiWeekly && !classItem.anchor_timestamp) {
      console.warn(`[NotificationService] Cannot schedule bi-weekly reminder for class ${classItem.name}: missing anchor_timestamp.`);
      return { scheduled: false, scheduledCount: 0, occurrences: [] };
    }

    const expectedOccurrences = this.getClassExpectedOccurrences(classItem);
    if (expectedOccurrences.length === 0) {
      console.info(`[NotificationService] No upcoming occurrences to schedule for class ${classItem.name}.`);
      return { scheduled: false, scheduledCount: 0, occurrences: [] };
    }

    // 2. Ensure permission & channel once for all occurrences
    const hasPerm = await this.requestPermissions();
    if (!hasPerm) {
      throw new Error('مجوز نمایش اعلان‌ها تأیید نشد. لطفاً در تنظیمات سیستم مجوز نوتیفیکیشن را فعال فرمایید.');
    }
    await this.ensureChannel();

    // 3. Batch prepare all future occurrence notifications
    const notifTitle = '🎓 یادآوری کلاس';

    const notificationsBatch = expectedOccurrences.map(({ occurrenceTimestamp, fireDate, notifId }) => {
      const occurrenceDate = new Date(occurrenceTimestamp).toISOString().split('T')[0];
      let startTime = classItem.time || '';
      const timeMatch = startTime.match(/(\d{1,2}:\d{2})/);
      if (timeMatch) {
        startTime = timeMatch[1];
      }
      const timeStr = toPersianDigits(startTime);
      const notifBody = `کلاس ${classItem.name}\nشروع: ${timeStr}`;

      return {
        id: notifId,
        title: notifTitle,
        body: notifBody,
        largeBody: notifBody,
        isExactNotification: true,
        schedule: {
          at: fireDate,
          allowWhileIdle: true,
        },
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher_foreground',
        sound: 'beep.wav',
        extra: {
          id: `cls_${classId}_${occurrenceTimestamp}`,
          classId: classId,
          className: classItem.name,
          location: classItem.location,
          classTime: classItem.time,
          classDay: classItem.day,
          isClassReminder: true,
          occurrenceDate,
          occurrenceTimestamp,
        },
      };
    });

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({ notifications: notificationsBatch });
        console.log(`[NotificationService] Successfully scheduled ${notificationsBatch.length} occurrences for class ${classItem.name}`);
      } catch (err: any) {
        console.error('[NotificationService] Native batch schedule failure:', err);
        throw new Error(err?.message || 'خطا در زمان‌بندی آلارم در سیستم‌عامل اندروید');
      }
    } else {
      console.log(`[NotificationService Web] Simulated batch schedule for ${notificationsBatch.length} occurrences of class ${classItem.name}`);
    }

    const fireDates = expectedOccurrences.map((o) => o.fireDate);
    return {
      scheduled: true,
      scheduledCount: notificationsBatch.length,
      occurrences: fireDates,
      at: fireDates[0],
    };
  }

  /**
   * Cancel native notification for a given session log or class
   */
  public async cancelReminder(id: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const notifId = this.getNotificationId(id);
      await LocalNotifications.cancel({
        notifications: [{ id: notifId }],
      });
      // Also remove from delivered notifications
      await LocalNotifications.removeDeliveredNotifications({
        notifications: [{ id: notifId, title: '', body: '' }],
      }).catch(() => {});
      console.log(`[NotificationService] Cancelled notification #${notifId}`);
    } catch (e) {
      console.warn('[NotificationService] Cancel error (tolerated):', e);
    }
  }

  /**
   * Cancel all notifications for a given class (all occurrence IDs + legacy single ID)
   */
  public async cancelClassReminder(classId: string, classItem?: any): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const idsToCancel = new Set<number>();

      // 1. Cancel legacy single notification ID
      idsToCancel.add(this.getNotificationId(`cls_${classId}`));

      // 2. If anchor or scheduled timestamps are known, compute and cancel all occurrence IDs
      const anchorTs = classItem?.anchor_timestamp;
      if (anchorTs) {
        const biWeeklyOccs = generateBiWeeklyOccurrences(anchorTs);
        for (const ts of biWeeklyOccs) {
          idsToCancel.add(this.getClassOccurrenceNotificationId(classId, ts));
        }
        const weeklyOccs = generateWeeklyOccurrences(anchorTs);
        for (const ts of weeklyOccs) {
          idsToCancel.add(this.getClassOccurrenceNotificationId(classId, ts));
        }
      }

      if (classItem?.scheduled_session_timestamps) {
        for (const ts of classItem.scheduled_session_timestamps) {
          idsToCancel.add(this.getClassOccurrenceNotificationId(classId, ts));
        }
      }

      // 3. Inspect pending native notifications to catch any orphaned/previous occurrence of this class
      try {
        const pending = await LocalNotifications.getPending();
        for (const p of pending.notifications) {
          if (p.extra?.classId === classId || p.extra?.id?.startsWith(`cls_${classId}`)) {
            idsToCancel.add(p.id);
          }
        }
      } catch (err) {
        console.warn('[NotificationService] Pending inspection during cancel warning:', err);
      }

      const notifArray = Array.from(idsToCancel).map((id) => ({ id }));
      if (notifArray.length > 0) {
        await LocalNotifications.cancel({ notifications: notifArray });
        await LocalNotifications.removeDeliveredNotifications({
          notifications: notifArray.map((n) => ({ id: n.id, title: '', body: '' })),
        }).catch(() => {});
        console.log(`[NotificationService] Cancelled ${notifArray.length} occurrence alarms for class ${classId}`);
      }
    } catch (e) {
      console.warn('[NotificationService] Cancel error (tolerated):', e);
    }
  }

  /**
   * Synchronize pending native notifications with local active session logs & classes (Multi-Occurrence Support)
   */
  public async syncPendingNotifications(sessionLogs: any[], classes: any[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await this.ensureChannel();
      const pending = await LocalNotifications.getPending();
      const pendingIds = new Set(pending.notifications.map((n) => n.id));
      const now = Date.now();

      const activeExpectedIds = new Set<number>();

      // 1. Sync one-time session log reminders (if in future)
      const activeLogsWithReminder = sessionLogs.filter(
        (l) => l.hasReminder && l.reminderTimestamp && l.reminderTimestamp > now
      );
      for (const log of activeLogsWithReminder) {
        const notifId = this.getNotificationId(log.id);
        activeExpectedIds.add(notifId);

        if (!pendingIds.has(notifId)) {
          const cls = classes.find((c) => c.id === log.classId);
          try {
            await this.scheduleReminder({
              id: log.id,
              logId: log.id,
              classId: log.classId,
              className: log.className || cls?.name || 'جلسه درسی',
              location: cls?.location,
              notesText: log.notesText,
              trigger: log.reminderTrigger,
              exactTimestamp: log.reminderTimestamp,
              classTime: cls?.time,
              classDay: cls?.day,
            });
          } catch (e) {
            console.warn('[NotificationService] Reschedule error for session log:', e);
          }
        }
      }

      // 2. Sync class-level recurring occurrences
      const activeClassesWithReminder = classes.filter((c) => c.hasReminder);
      for (const cls of activeClassesWithReminder) {
        const expectedOccurrences = this.getClassExpectedOccurrences(cls, now);
        const missingNotifications: any[] = [];

        const isBiWeekly =
          cls.recurrence === 'bi_weekly' ||
          cls.recurrence === 'biweekly' ||
          cls.recurrence === 'even_weeks' ||
          cls.recurrence === 'odd_weeks';

        const notifTitle = '🎓 یادآوری کلاس';

        expectedOccurrences.forEach(({ occurrenceTimestamp, fireDate, notifId }) => {
          activeExpectedIds.add(notifId);

          if (!pendingIds.has(notifId)) {
            const occurrenceDate = new Date(occurrenceTimestamp).toISOString().split('T')[0];
            let startTime = cls.time || '';
            const timeMatch = startTime.match(/(\d{1,2}:\d{2})/);
            if (timeMatch) {
              startTime = timeMatch[1];
            }
            const timeStr = toPersianDigits(startTime);
            const notifBody = `کلاس ${cls.name}\nشروع: ${timeStr}`;

            missingNotifications.push({
              id: notifId,
              title: notifTitle,
              body: notifBody,
              largeBody: notifBody,
              isExactNotification: true,
              schedule: {
                at: fireDate,
                allowWhileIdle: true,
              },
              channelId: CHANNEL_ID,
              smallIcon: 'ic_launcher_foreground',
              sound: 'beep.wav',
              extra: {
                id: `cls_${cls.id}_${occurrenceTimestamp}`,
                classId: cls.id,
                className: cls.name,
                location: cls.location,
                classTime: cls.time,
                classDay: cls.day,
                isClassReminder: true,
                occurrenceDate,
                occurrenceTimestamp,
              },
            });
          }
        });

        if (missingNotifications.length > 0) {
          try {
            await LocalNotifications.schedule({ notifications: missingNotifications });
            console.log(`[NotificationService] Restored ${missingNotifications.length} missing notifications for class ${cls.name}`);
          } catch (err) {
            console.warn(`[NotificationService] Error restoring occurrences for class ${cls.name}:`, err);
          }
        }
      }

      // 3. Cancel orphaned native notifications
      const orphanedIds = pending.notifications.filter((p) => !activeExpectedIds.has(p.id)).map((p) => ({ id: p.id }));
      if (orphanedIds.length > 0) {
        await LocalNotifications.cancel({ notifications: orphanedIds }).catch(() => {});
        console.log(`[NotificationService] Cancelled ${orphanedIds.length} orphaned notifications`);
      }
    } catch (e) {
      console.warn('[NotificationService] Sync failed:', e);
    }
  }
}

export const notificationService = new NotificationService();
