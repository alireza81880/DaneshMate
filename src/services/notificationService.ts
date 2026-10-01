import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ActionPerformed } from '@capacitor/local-notifications';
import { persistenceAdapter } from '../storage/persistenceAdapter';

const CHANNEL_ID = 'daneshmate-reminders';
export const REMINDER_ACTION_TYPE_ID = 'DANESHMATE_REMINDER_ACTIONS';

export interface ScheduleReminderOptions {
  id?: string;
  logId?: string;
  classId?: string;
  className: string;
  classCode?: string;
  location?: string;
  notesText?: string;
  trigger?: string;
  minutesBefore?: number;
  snoozedUntil?: string;
  classTime?: string;
  classDay?: string;
  isClassReminder?: boolean;
}

export type NotificationActionListener = (actionId: 'snooze' | 'dismiss' | 'tap', data: {
  itemId: string;
  className: string;
  classCode?: string;
  isClassReminder?: boolean;
}) => void;

class NotificationService {
  private channelCreated = false;
  private actionTypesRegistered = false;
  private listeners: Set<NotificationActionListener> = new Set();
  private setupListenerInitialized = false;

  constructor() {
    this.initNativeActionListener();
  }

  /**
   * Register a callback listener in the React app for notification actions
   */
  public addActionListener(fn: NotificationActionListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notifyActionListeners(actionId: 'snooze' | 'dismiss' | 'tap', data: any) {
    for (const listener of this.listeners) {
      try {
        listener(actionId, data);
      } catch (err) {
        console.warn('[NotificationService] Listener error:', err);
      }
    }
  }

  /**
   * Listen to native notification action events (Dismiss / Snooze / Tap)
   */
  private initNativeActionListener() {
    if (!Capacitor.isNativePlatform() || this.setupListenerInitialized) return;

    try {
      LocalNotifications.addListener('localNotificationActionPerformed', async (action: ActionPerformed) => {
        console.log('[NotificationService] localNotificationActionPerformed:', action);
        const { actionId, notification } = action;
        const extra = notification.extra || {};
        const itemId = extra.logId || extra.classId || extra.id || String(notification.id);
        const className = extra.className || notification.title || '';
        const classCode = extra.classCode;
        const isClassReminder = Boolean(extra.isClassReminder);

        if (actionId === 'dismiss') {
          // Action: "فهمیدم" (Problem 5: acknowledge/dismiss reminder and prevent it from firing again for this occurrence)
          await this.acknowledgeReminder(itemId);
          this.notifyActionListeners('dismiss', { itemId, className, classCode, isClassReminder });
        } else if (actionId === 'snooze') {
          // Action: "بعداً یادآوری کن" (Problem 4: snooze the reminder)
          await this.snoozeReminder(itemId, '+10 min', {
            className,
            classCode,
            isClassReminder,
            classTime: extra.classTime,
            classDay: extra.classDay,
            notesText: extra.notesText,
            location: extra.location,
          });
          this.notifyActionListeners('snooze', { itemId, className, classCode, isClassReminder });
        } else {
          // General tap on notification
          this.notifyActionListeners('tap', { itemId, className, classCode, isClassReminder });
        }
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
   * Ensure dedicated high-priority notification channel & action types exist on Android
   */
  public async ensureChannel(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    if (!this.channelCreated) {
      try {
        await LocalNotifications.createChannel({
          id: CHANNEL_ID,
          name: 'یادآورهای هوشمند دانش‌میت',
          description: 'اعلان‌های صوتی و هشدارهای پیش از شروع کلاس‌ها',
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

    if (!this.actionTypesRegistered) {
      try {
        // Register Action Types: "بعداً یادآوری کن" and "فهمیدم" (Problem 3)
        await LocalNotifications.registerActionTypes({
          types: [
            {
              id: REMINDER_ACTION_TYPE_ID,
              actions: [
                {
                  id: 'dismiss',
                  title: 'فهمیدم',
                },
                {
                  id: 'snooze',
                  title: 'بعداً یادآوری کن',
                },
              ],
            },
          ],
        });
        this.actionTypesRegistered = true;
      } catch (e) {
        console.warn('[NotificationService] registerActionTypes notice:', e);
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
    if (trg.includes('1 min') || trg.includes('۱ دقیقه') || trg.includes('test') || trg.includes('تست')) {
      return -1; // special flag for immediate 1-minute test
    }
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
   * Parse snooze milliseconds
   */
  public parseSnoozeDurationMs(snoozeStr: string): number {
    const s = snoozeStr.toLowerCase();
    if (s.includes('1 min') || s.includes('۱ دقیقه')) return 60 * 1000;
    if (s.includes('5 min') || s.includes('۵ دقیقه')) return 5 * 60 * 1000;
    if (s.includes('10 min') || s.includes('۱۰ دقیقه')) return 10 * 60 * 1000;
    if (s.includes('15 min') || s.includes('۱۵ دقیقه')) return 15 * 60 * 1000;
    if (s.includes('30 min') || s.includes('۳۰ دقیقه')) return 30 * 60 * 1000;
    if (s.includes('1 hour') || s.includes('۱ ساعت')) return 60 * 60 * 1000;
    if (s.includes('2 hour') || s.includes('۲ ساعت')) return 2 * 60 * 60 * 1000;
    if (s.includes('4 hour') || s.includes('۴ ساعت')) return 4 * 60 * 60 * 1000;
    if (s.includes('24 hour') || s.includes('۲۴ ساعت')) return 24 * 60 * 60 * 1000;

    const match = s.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (s.includes('hour') || s.includes('ساعت')) return num * 60 * 60 * 1000;
      if (s.includes('day') || s.includes('روز')) return num * 24 * 60 * 60 * 1000;
      return num * 60 * 1000;
    }

    return 10 * 60 * 1000; // default 10 minutes
  }

  /**
   * Calculate scheduled Date based on class weekday, class time, and "before class" minutes (Problem 1)
   */
  public calculateScheduleDate(
    trigger?: string,
    snooze?: string,
    classTime?: string,
    classDay?: string,
    explicitMinutesBefore?: number
  ): Date {
    const now = Date.now();

    // 1. Handle Snooze first
    if (snooze) {
      const durationMs = this.parseSnoozeDurationMs(snooze);
      return new Date(now + durationMs);
    }

    // 2. Handle Test 1-Minute trigger
    const trg = (trigger || '').toLowerCase();
    if (trg.includes('1 minute') || trg.includes('1 min') || trg.includes('test') || trg.includes('۱ دقیقه')) {
      return new Date(now + 60 * 1000); // 1 minute test
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
    const minutesBefore = this.parseMinutesBefore(trigger, explicitMinutesBefore);

    // If 1-minute test was detected by parseMinutesBefore
    if (minutesBefore === -1) {
      return new Date(now + 60 * 1000);
    }

    const nowDate = new Date(now);

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

      // Subtract configurable "before class" minutes (Problem 1)
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

    // If day is not explicitly specified, calculate relative to today or tomorrow
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

    if (trg.includes('tomorrow') || trg.includes('فردا')) {
      scheduledAt.setDate(scheduledAt.getDate() + 1);
      return scheduledAt;
    }

    if (trg.includes('2 days') || trg.includes('۲ روز')) {
      scheduledAt.setDate(scheduledAt.getDate() + 2);
      return scheduledAt;
    }

    if (scheduledAt.getTime() <= now) {
      // If today's time has passed, schedule for tomorrow
      scheduledAt.setDate(scheduledAt.getDate() + 1);
    }

    return scheduledAt;
  }

  /**
   * Schedule a local notification with class identification and action buttons (Problems 1, 2, 3)
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
      opts.minutesBefore
    );

    // Problem 2: Identify class when class number / class code exists
    const codePart = opts.classCode ? ` (کد: ${opts.classCode})` : (opts.location ? ` (${opts.location})` : '');
    const notifTitle = `🎓 یادآور کلاس: ${opts.className}${codePart}`;

    let notifBody = '';
    if (opts.notesText) {
      notifBody = `${opts.notesText.substring(0, 90)}...`;
    } else {
      const codeInfo = opts.classCode ? ` با کد ${opts.classCode}` : '';
      const locInfo = opts.location ? ` در ${opts.location}` : '';
      const timeInfo = opts.classTime ? ` (ساعت ${opts.classTime})` : '';
      notifBody = `زمان حضور در جلسه درس ${opts.className}${codeInfo}${locInfo}${timeInfo} نزدیک است.`;
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
              // Problem 3: Attach action type providing "بعداً یادآوری کن" and "فهمیدم"
              actionTypeId: REMINDER_ACTION_TYPE_ID,
              extra: {
                id: targetId,
                logId: opts.logId,
                classId: opts.classId,
                className: opts.className,
                classCode: opts.classCode,
                location: opts.location,
                classTime: opts.classTime,
                classDay: opts.classDay,
                isClassReminder: Boolean(opts.isClassReminder),
                notesText: opts.notesText,
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
   * Schedule class-level recurring reminder (Problem 1)
   */
  public async scheduleClassReminder(classItem: any): Promise<{ scheduled: boolean; at: Date }> {
    const classId = classItem.id;
    return this.scheduleReminder({
      id: `cls_${classId}`,
      classId,
      className: classItem.name,
      classCode: classItem.classCode,
      location: classItem.location,
      trigger: classItem.reminderTriggerText,
      minutesBefore: classItem.reminderMinutesBefore ?? 30,
      classTime: classItem.time,
      classDay: classItem.day,
      isClassReminder: true,
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
   * Acknowledge/dismiss reminder ("فهمیدم") so it won't fire again for this occurrence (Problem 5)
   */
  public async acknowledgeReminder(itemId: string): Promise<void> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const key = `${itemId}_${todayStr}`;
      await persistenceAdapter.saveAcknowledgedReminder(key, Date.now());
      await this.cancelReminder(itemId);
      console.log(`[NotificationService] Reminder acknowledged and dismissed for key: ${key}`);
    } catch (e) {
      console.warn('[NotificationService] Failed to acknowledge reminder:', e);
    }
  }

  /**
   * Snooze reminder ("بعداً یادآوری کن") with selectable duration (Problem 4)
   */
  public async snoozeReminder(
    itemId: string,
    snoozeDuration: string = '+10 min',
    extra: Partial<ScheduleReminderOptions> = {}
  ): Promise<Date> {
    const newScheduleDate = new Date(Date.now() + this.parseSnoozeDurationMs(snoozeDuration));

    await this.scheduleReminder({
      id: itemId,
      logId: extra.logId || (!extra.isClassReminder ? itemId : undefined),
      classId: extra.classId || (extra.isClassReminder ? itemId.replace('cls_', '') : undefined),
      className: extra.className || 'کلاس',
      classCode: extra.classCode,
      location: extra.location,
      notesText: extra.notesText,
      trigger: `Snoozed ${snoozeDuration}`,
      snoozedUntil: snoozeDuration,
      classTime: extra.classTime,
      classDay: extra.classDay,
      isClassReminder: extra.isClassReminder,
    });

    return newScheduleDate;
  }

  /**
   * Synchronize pending native notifications with local active session logs & classes
   */
  public async syncPendingNotifications(sessionLogs: any[], classes: any[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await this.ensureChannel();
      const pending = await LocalNotifications.getPending();
      const pendingIds = new Set(pending.notifications.map((n) => n.id));
      const todayStr = new Date().toISOString().split('T')[0];

      const activeExpectedIds = new Set<number>();

      // 1. Sync session logs reminders
      const activeLogsWithReminder = sessionLogs.filter((l) => l.hasReminder);
      for (const log of activeLogsWithReminder) {
        const notifId = this.getNotificationId(log.id);
        activeExpectedIds.add(notifId);

        const ackKey = `${log.id}_${todayStr}`;
        const isAcked = await persistenceAdapter.isReminderAcknowledged(ackKey);

        if (!isAcked && !pendingIds.has(notifId)) {
          const cls = classes.find((c) => c.id === log.classId);
          try {
            await this.scheduleReminder({
              id: log.id,
              logId: log.id,
              classId: log.classId,
              className: log.className || cls?.name || 'کلاس',
              classCode: log.classCode || cls?.classCode,
              location: cls?.location,
              notesText: log.notesText,
              trigger: log.reminderTrigger,
              snoozedUntil: log.snoozedUntil,
              classTime: cls?.time,
              classDay: cls?.day,
            });
          } catch (e) {
            console.warn('[NotificationService] Reschedule error for log:', e);
          }
        }
      }

      // 2. Sync class-level reminders (Problem 1)
      const activeClassesWithReminder = classes.filter((c) => c.hasReminder);
      for (const cls of activeClassesWithReminder) {
        const classTargetId = `cls_${cls.id}`;
        const notifId = this.getNotificationId(classTargetId);
        activeExpectedIds.add(notifId);

        const ackKey = `${classTargetId}_${todayStr}`;
        const isAcked = await persistenceAdapter.isReminderAcknowledged(ackKey);

        if (!isAcked && !pendingIds.has(notifId)) {
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
