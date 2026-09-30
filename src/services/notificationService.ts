import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const CHANNEL_ID = 'daneshmate-reminders';

export interface ScheduleReminderOptions {
  logId: string;
  className: string;
  notesText?: string;
  trigger?: string;
  snoozedUntil?: string;
  classTime?: string;
  classDay?: string;
}

class NotificationService {
  private channelCreated = false;

  /**
   * Compute stable positive 32-bit integer ID from log string
   */
  public getNotificationId(logId: string): number {
    let hash = 0;
    for (let i = 0; i < logId.length; i++) {
      const char = logId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash) % 2147483647;
  }

  /**
   * Ensure dedicated high-priority notification channel exists on Android
   */
  public async ensureChannel(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.channelCreated) return;

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
          console.info('[NotificationService] Exact alarm not granted, prompt or fallback active');
        }
      } catch {}

      return true;
    } catch (err) {
      console.error('[NotificationService] Permission check error:', err);
      return false;
    }
  }

  /**
   * Calculate scheduled Date based on trigger and snooze options
   */
  public calculateScheduleDate(
    trigger?: string,
    snooze?: string,
    classTime?: string,
    classDay?: string
  ): Date {
    const now = Date.now();

    // 1. Handle Snooze first
    if (snooze) {
      const snz = snooze.toLowerCase();
      if (snz.includes('min') || snz.includes('۱ دقیقه') || snz.includes('دقیقه')) {
        return new Date(now + 60 * 1000); // 1 minute in future
      }
      if (snz.includes('1 hour') || snz.includes('۱ ساعت')) {
        return new Date(now + 60 * 60 * 1000);
      }
      if (snz.includes('4 hour') || snz.includes('۴ ساعت')) {
        return new Date(now + 4 * 60 * 60 * 1000);
      }
      if (snz.includes('24 hour') || snz.includes('۲۴ ساعت')) {
        return new Date(now + 24 * 60 * 60 * 1000);
      }
    }

    // 2. Handle Test 1-Minute trigger
    const trg = (trigger || '').toLowerCase();
    if (trg.includes('1 minute') || trg.includes('1 min') || trg.includes('test') || trg.includes('۱ دقیقه')) {
      return new Date(now + 60 * 1000); // 1 minute test
    }

    // Parse class time (e.g. "08:00 - 10:00")
    let classHour = 8;
    let classMin = 0;
    if (classTime) {
      const match = classTime.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        classHour = parseInt(match[1], 10);
        classMin = parseInt(match[2], 10);
      }
    }

    const targetDate = new Date();
    targetDate.setHours(classHour, classMin, 0, 0);

    if (trg.includes('today') || trg.includes('امروز')) {
      if (targetDate.getTime() <= now) {
        // If today's class time has passed, trigger in 1 minute
        return new Date(now + 60 * 1000);
      }
      return targetDate;
    }

    if (trg.includes('tomorrow') || trg.includes('فردا')) {
      targetDate.setDate(targetDate.getDate() + 1);
      return targetDate;
    }

    if (trg.includes('2 days') || trg.includes('۲ روز')) {
      targetDate.setDate(targetDate.getDate() + 2);
      return targetDate;
    }

    // Default: '24 hours before class'
    // If future class time is known, schedule 24h before, else schedule for next day or in 2 hours
    const defaultSchedule = new Date(now + 24 * 60 * 60 * 1000);
    return defaultSchedule;
  }

  /**
   * Schedule a local notification
   */
  public async scheduleReminder(opts: ScheduleReminderOptions): Promise<{ scheduled: boolean; at: Date }> {
    const hasPerm = await this.requestPermissions();
    if (!hasPerm) {
      throw new Error('مجوز نمایش اعلان‌ها تأیید نشد. لطفاً در تنظیمات سیستم مجوز نوتیفیکیشن را فعال فرمایید.');
    }

    await this.ensureChannel();

    const notifId = this.getNotificationId(opts.logId);
    const scheduleDate = this.calculateScheduleDate(
      opts.trigger,
      opts.snoozedUntil,
      opts.classTime,
      opts.classDay
    );

    // Cancel any previous notification for this log to prevent duplicates
    await this.cancelReminder(opts.logId);

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: `🎓 یادآور کلاس: ${opts.className}`,
              body: opts.notesText
                ? `${opts.notesText.substring(0, 80)}...`
                : `زمان حضور در جلسه درس ${opts.className} نزدیک است.`,
              schedule: {
                at: scheduleDate,
                allowWhileIdle: true, // Fire even in Doze / sleep mode
              },
              channelId: CHANNEL_ID,
              smallIcon: 'ic_launcher_foreground',
              sound: 'beep.wav',
              extra: {
                logId: opts.logId,
                className: opts.className,
              },
            },
          ],
        });
        console.log(`[NotificationService] Scheduled native notification #${notifId} for ${scheduleDate.toLocaleTimeString()}`);
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
   * Cancel native notification for a given session log
   */
  public async cancelReminder(logId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const notifId = this.getNotificationId(logId);
      await LocalNotifications.cancel({
        notifications: [{ id: notifId }],
      });
      console.log(`[NotificationService] Cancelled notification #${notifId}`);
    } catch (e) {
      console.warn('[NotificationService] Cancel error (tolerated):', e);
    }
  }

  /**
   * Synchronize pending native notifications with local active session logs on app startup/resume (Part 9)
   */
  public async syncPendingNotifications(sessionLogs: any[], classes: any[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await this.ensureChannel();
      const pending = await LocalNotifications.getPending();
      const pendingIds = new Set(pending.notifications.map((n) => n.id));

      const activeLogsWithReminder = sessionLogs.filter((l) => l.hasReminder);
      const activeExpectedIds = new Set<number>();

      for (const log of activeLogsWithReminder) {
        const notifId = this.getNotificationId(log.id);
        activeExpectedIds.add(notifId);

        // If missing from pending, re-schedule if schedule time is still in future
        if (!pendingIds.has(notifId)) {
          const cls = classes.find((c) => c.id === log.classId);
          try {
            await this.scheduleReminder({
              logId: log.id,
              className: log.className || cls?.name || 'کلاس',
              notesText: log.notesText,
              trigger: log.reminderTrigger,
              snoozedUntil: log.snoozedUntil,
              classTime: cls?.time,
              classDay: cls?.day,
            });
          } catch (e) {
            console.warn('[NotificationService] Reschedule error:', e);
          }
        }
      }

      // Cancel orphaned native notifications
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
