import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ActionPerformed } from '@capacitor/local-notifications';
import { parseTime } from '../utils/time';

const CHANNEL_ID = 'daneshmate-reminders';

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
        }
      } catch {}

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
   * Calculate scheduled Date for a recurring class based on:
   * 1. Real first session date (anchor timestamp / scheduled sessions), completely independent of broken even/odd assumptions.
   * 2. Recurrence pattern (weekly = 7 days, bi-weekly = 14 days from first session).
   * 3. Configurable alert offset (minutes before class or exact clock time).
   */
  public calculateClassReminderDate(options: {
    classDay?: string;
    classTime?: string;
    reminderMode?: 'before_class' | 'exact_time';
    minutesBefore?: number;
    exactTime?: string;
    recurrence?: string;
    anchorTimestamp?: number;
    scheduledSessionTimestamps?: number[];
    trigger?: string;
  }): Date {
    const now = Date.now();

    // 1. Parse class start time (default 08:00)
    let classHour = 8;
    let classMin = 0;
    if (options.classTime) {
      const match = options.classTime.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        classHour = parseInt(match[1], 10);
        classMin = parseInt(match[2], 10);
      }
    }

    // 2. Determine target hour and minute for the notification
    const isExact = options.reminderMode === 'exact_time' && Boolean(options.exactTime);
    let remHour = classHour;
    let remMin = classMin;
    let minutesOffset = 0;

    if (isExact && options.exactTime) {
      const parsedExact = parseTime(options.exactTime);
      if (parsedExact) {
        remHour = parsedExact.hour;
        remMin = parsedExact.minute;
      }
    } else {
      minutesOffset = this.parseMinutesBefore(options.trigger, options.minutesBefore);
    }

    const computeFireTimestamp = (baseDate: Date): number => {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), remHour, remMin, 0, 0);
      if (!isExact && minutesOffset > 0) {
        return d.getTime() - minutesOffset * 60 * 1000;
      }
      return d.getTime();
    };

    const isBiWeekly =
      options.recurrence === 'bi_weekly' ||
      options.recurrence === 'biweekly' ||
      options.recurrence === 'even_weeks' ||
      options.recurrence === 'odd_weeks';

    // 3. Bi-weekly / Alternating weeks: Strictly based on real session anchor date (14-day intervals)
    if (isBiWeekly) {
      let sessions = options.scheduledSessionTimestamps && options.scheduledSessionTimestamps.length > 0
        ? [...options.scheduledSessionTimestamps]
        : [];

      if (sessions.length === 0 && options.anchorTimestamp) {
        const base = options.anchorTimestamp;
        for (let i = 0; i < 20; i++) {
          sessions.push(base + i * 14 * 24 * 60 * 60 * 1000);
        }
      }

      if (sessions.length > 0) {
        sessions.sort((a, b) => a - b);
        for (const sTimestamp of sessions) {
          const sDate = new Date(sTimestamp);
          const fireTime = computeFireTimestamp(sDate);
          if (fireTime > now) {
            return new Date(fireTime);
          }
        }
        // If all pre-generated sessions have passed, project forward every 14 days
        let lastSession = sessions[sessions.length - 1];
        for (let step = 0; step < 52; step++) {
          lastSession += 14 * 24 * 60 * 60 * 1000;
          const sDate = new Date(lastSession);
          const fireTime = computeFireTimestamp(sDate);
          if (fireTime > now) {
            return new Date(fireTime);
          }
        }
      }
    }

    // 4. Weekly schedule or fallback if no anchor was specified
    const PERSIAN_DAY_TO_JS: Record<string, number> = {
      'یکشنبه': 0,
      'دوشنبه': 1,
      'سه‌شنبه': 2,
      'چهارشنبه': 3,
      'پنج‌شنبه': 4,
      'جمعه': 5,
      'شنبه': 6,
    };
    const targetDayIndex = options.classDay ? PERSIAN_DAY_TO_JS[options.classDay] : undefined;
    const nowDate = new Date(now);

    if (targetDayIndex !== undefined) {
      let daysAhead = (targetDayIndex - nowDate.getDay() + 7) % 7;
      let candidateDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + daysAhead);

      // If an anchor timestamp is set in the future, don't schedule before the real first session
      if (options.anchorTimestamp) {
        const anchorDate = new Date(options.anchorTimestamp);
        const candMidnight = new Date(candidateDate.getFullYear(), candidateDate.getMonth(), candidateDate.getDate()).getTime();
        const anchorMidnight = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate()).getTime();
        if (candMidnight < anchorMidnight) {
          candidateDate = anchorDate;
        }
      }

      let fireTime = computeFireTimestamp(candidateDate);
      if (fireTime <= now) {
        const stepDays = isBiWeekly ? 14 : 7;
        candidateDate = new Date(candidateDate.getFullYear(), candidateDate.getMonth(), candidateDate.getDate() + stepDays);
        fireTime = computeFireTimestamp(candidateDate);
      }
      return new Date(fireTime);
    }

    // Default 24h fallback
    const fallbackDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + 1, remHour, remMin, 0, 0);
    return fallbackDate;
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

    const scheduleDate = opts.isClassReminder
      ? this.calculateClassReminderDate({
          classDay: opts.classDay,
          classTime: opts.classTime,
          reminderMode: opts.reminderMode,
          minutesBefore: opts.minutesBefore,
          exactTime: opts.exactTime,
          recurrence: opts.recurrence,
          anchorTimestamp: opts.anchorTimestamp,
          scheduledSessionTimestamps: opts.scheduledSessionTimestamps,
          trigger: opts.trigger,
        })
      : this.calculateScheduleDate(
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

    // Concise, readable Persian notification titles & bodies (Part 8)
    let notifTitle = '';
    let notifBody = '';

    if (opts.isClassReminder) {
      // CLASS REMINDER
      notifTitle = '🎓 یادآوری کلاس';
      notifBody = `کلاس ${opts.className}\nشروع: ${opts.classTime || ''}`;
    } else {
      // SESSION / TIMELINE REMINDER (One-time)
      notifTitle = '📚 یادآوری جلسه';
      const timeStr = opts.exactTime || scheduleDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      const dateStr = opts.sessionDateStr || scheduleDate.toLocaleDateString('fa-IR');
      notifBody = `مرور جلسه ${opts.className} را فراموش نکن.\nتاریخ: ${dateStr}\nساعت: ${timeStr}`;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: notifTitle,
              body: notifBody,
              schedule: {
                at: scheduleDate,
                allowWhileIdle: true, // Fire even in Doze / sleep mode
              },
              channelId: CHANNEL_ID,
              smallIcon: 'ic_launcher_foreground',
              sound: 'beep.wav',
              // No action buttons (Part 7: purely informational)
              extra: {
                id: targetId,
                logId: opts.logId,
                classId: opts.classId,
                className: opts.className,
                location: opts.location,
                classTime: opts.classTime,
                classDay: opts.classDay,
                isClassReminder: Boolean(opts.isClassReminder),
                notesText: opts.notesText,
                occurrenceDate,
                occurrenceTimestamp,
              },
            },
          ],
        });
        console.log(`[NotificationService] Scheduled notification #${notifId} for ${scheduleDate.toLocaleString('fa-IR')}`);
      } catch (err: any) {
        console.error('[NotificationService] Native schedule failure:', err);
        throw new Error(err?.message || 'خطا در زمان‌بندی آلارم در سیستم‌عامل اندروید');
      }
    } else {
      console.log(`[NotificationService Web] Simulated schedule for #${notifId} at ${scheduleDate.toISOString()}`);
    }

    return { scheduled: true, at: scheduleDate };
  }

  /**
   * Schedule class-level recurring reminder (Real first session date & recurrence cycle)
   */
  public async scheduleClassReminder(classItem: any): Promise<{ scheduled: boolean; at: Date }> {
    const classId = classItem.id;
    const isExact = classItem.reminderMode === 'exact_time' && Boolean(classItem.reminderExactTime);
    return this.scheduleReminder({
      id: `cls_${classId}`,
      classId,
      className: classItem.name,
      location: classItem.location,
      trigger: classItem.reminderTriggerText,
      reminderMode: classItem.reminderMode || (isExact ? 'exact_time' : 'before_class'),
      minutesBefore: isExact ? undefined : (classItem.reminderMinutesBefore ?? 30),
      exactTime: isExact ? classItem.reminderExactTime : undefined,
      classTime: classItem.time,
      classDay: classItem.day || classItem.reminderDay,
      isClassReminder: true,
      recurrence: classItem.recurrence,
      anchorDate: classItem.anchor_date,
      anchorTimestamp: classItem.anchor_timestamp,
      scheduledSessionTimestamps: classItem.scheduled_session_timestamps,
    });
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
   * Cancel class reminder
   */
  public async cancelClassReminder(classId: string): Promise<void> {
    await this.cancelReminder(`cls_${classId}`);
  }

  /**
   * Synchronize pending native notifications with local active session logs & classes (No Snooze)
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

      // 2. Sync class-level recurring reminders
      const activeClassesWithReminder = classes.filter((c) => c.hasReminder);
      for (const cls of activeClassesWithReminder) {
        const classTargetId = `cls_${cls.id}`;
        const notifId = this.getNotificationId(classTargetId);
        activeExpectedIds.add(notifId);

        if (!pendingIds.has(notifId)) {
          try {
            await this.scheduleClassReminder(cls);
          } catch (e) {
            console.warn('[NotificationService] Reschedule error for class:', e);
          }
        }
      }

      // 3. Cancel orphaned native notifications
      for (const p of pending.notifications) {
        if (!activeExpectedIds.has(p.id)) {
          await LocalNotifications.cancel({ notifications: [{ id: p.id }] }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[NotificationService] Sync failed:', e);
    }
  }
}

export const notificationService = new NotificationService();
