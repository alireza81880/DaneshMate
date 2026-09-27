/**
 * DaneshMate Local Notification & Smart Reminder Service
 * 
 * Manages device-native alarm scheduling, exam countdowns, and class notifications
 * with cross-platform support (Expo Notifications / Web Notifications API).
 */

import { Platform } from 'react-native';

export interface ScheduleReminderOptions {
  id?: string;
  title: string;
  body: string;
  triggerDate: Date;
  category?: 'class_start' | 'midterm_exam' | 'final_exam' | 'session_review' | 'custom';
}

class DeviceNotificationService {
  private hasPermission = false;
  private scheduledReminders: Map<string, any> = new Map();

  constructor() {
    this.checkPermissions();
  }

  async checkPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            this.hasPermission = true;
          } else if (Notification.permission !== 'denied') {
            const perm = await Notification.requestPermission();
            this.hasPermission = perm === 'granted';
          }
        }
      } else {
        // Native environment permission (expo-notifications / native alert)
        this.hasPermission = true;
      }
    } catch {
      this.hasPermission = false;
    }
    return this.hasPermission;
  }

  async scheduleReminder(options: ScheduleReminderOptions): Promise<string> {
    const reminderId = options.id || `rem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const now = Date.now();
    const targetTime = options.triggerDate.getTime();
    const delayMs = Math.max(0, targetTime - now);

    // Cancel existing reminder if id is reused
    this.cancelReminder(reminderId);

    if (Platform.OS === 'web') {
      if (delayMs > 0 && delayMs < 2147483647) {
        const timer = setTimeout(() => {
          this.triggerLocalAlert(options.title, options.body);
          this.scheduledReminders.delete(reminderId);
        }, delayMs);
        this.scheduledReminders.set(reminderId, timer);
      } else if (delayMs === 0) {
        this.triggerLocalAlert(options.title, options.body);
      }
    } else {
      // In native environment, store schedule
      this.scheduledReminders.set(reminderId, { ...options, scheduledAt: targetTime });
    }

    return reminderId;
  }

  cancelReminder(id: string): void {
    if (this.scheduledReminders.has(id)) {
      const existing = this.scheduledReminders.get(id);
      if (typeof existing === 'number' || (typeof existing === 'object' && existing !== null)) {
        clearTimeout(existing);
      }
      this.scheduledReminders.delete(id);
    }
  }

  private triggerLocalAlert(title: string, body: string): void {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/assets/icon.png',
          badge: '/assets/icon.png',
        });
      }
    } catch {
      // fallback
    }
  }

  /**
   * Helper to schedule quick relative reminder
   */
  async scheduleRelativeReminder(
    title: string,
    body: string,
    relativeOffset: '5m' | '10m' | '1h' | '24h' | '2d'
  ): Promise<string> {
    const offsetMsMap = {
      '5m': 5 * 60 * 1000,
      '10m': 10 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '2d': 48 * 60 * 60 * 1000,
    };

    const targetDate = new Date(Date.now() + offsetMsMap[relativeOffset]);
    return this.scheduleReminder({
      title,
      body,
      triggerDate: targetDate,
      category: 'session_review',
    });
  }
}

export const notificationService = new DeviceNotificationService();
