/**
 * DaneshMate Offline-First Persistence Adapter
 * 
 * Asynchronous storage engine with cross-environment resilience (React Native & Web).
 * Automatically caches student profiles, academic schedules, session logs, and themes.
 */

export interface StudentProfileData {
  firstName: string;
  lastName: string;
  passedUnits?: string;
}

export interface ClassItemData {
  id: string;
  name: string;
  day: any;
  time: string;
  recurrence: 'every_week' | 'even_weeks' | 'odd_weeks';
  professor?: string;
  location?: string;
}

export interface AttachedFileData {
  id: string;
  name: string;
  type: any;
  sizeText: string;
  uri?: string;
  url?: string;
}

export interface SessionLogData {
  id: string;
  classId: string;
  className: string;
  createdAt: string;
  notesText: string;
  voiceMemoSeconds?: number;
  voiceMemoUri?: string;
  attachedFiles?: AttachedFileData[];
  hasReminder?: boolean;
  reminderTrigger?: string;
  reminderTimeText?: string;
  snoozedUntil?: string;
  notificationId?: number;
}

export interface AppSnapshot {
  studentProfile: StudentProfileData | null;
  classes: any[];
  sessionLogs: any[];
  activeThemeId: string;
  lastSavedAt: number;
}

export interface QueuedMutation {
  id: string;
  type: 'UPDATE_PROFILE' | 'ADD_CLASS' | 'UPDATE_CLASS' | 'DELETE_CLASS' | 'ADD_SESSION_LOG' | 'DELETE_SESSION_LOG';
  payload: any;
  timestamp: number;
}

// Storage keys
const STORAGE_KEYS = {
  PROFILE: '@daneshmate/student_profile',
  CLASSES: '@daneshmate/classes',
  LOGS: '@daneshmate/session_logs',
  THEME: '@daneshmate/active_theme',
  MUTATION_QUEUE: '@daneshmate/offline_mutations',
  LAST_SYNC: '@daneshmate/last_synced_timestamp',
};

// In-memory fallback if storage is restricted or unavailable
const memoryCache: Record<string, string> = {};

class PersistenceAdapter {
  private isStorageAvailable(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async getRawItem(key: string): Promise<string | null> {
    try {
      if (this.isStorageAvailable()) {
        return window.localStorage.getItem(key);
      }
      return memoryCache[key] ?? null;
    } catch (err) {
      console.warn(`[PersistenceAdapter] Read failure for ${key}:`, err);
      return memoryCache[key] ?? null;
    }
  }

  private async setRawItem(key: string, value: string): Promise<void> {
    try {
      if (this.isStorageAvailable()) {
        window.localStorage.setItem(key, value);
      }
      memoryCache[key] = value;
    } catch (err) {
      console.warn(`[PersistenceAdapter] Write failure for ${key}:`, err);
      memoryCache[key] = value;
    }
  }

  private async removeRawItem(key: string): Promise<void> {
    try {
      if (this.isStorageAvailable()) {
        window.localStorage.removeItem(key);
      }
      delete memoryCache[key];
    } catch (err) {
      console.warn(`[PersistenceAdapter] Remove failure for ${key}:`, err);
      delete memoryCache[key];
    }
  }

  /**
   * Load entire application snapshot instantly from local storage
   */
  async loadAppSnapshot(): Promise<AppSnapshot | null> {
    try {
      const [profileRaw, classesRaw, logsRaw, themeRaw] = await Promise.all([
        this.getRawItem(STORAGE_KEYS.PROFILE),
        this.getRawItem(STORAGE_KEYS.CLASSES),
        this.getRawItem(STORAGE_KEYS.LOGS),
        this.getRawItem(STORAGE_KEYS.THEME),
      ]);

      if (!profileRaw && !classesRaw && !logsRaw && !themeRaw) {
        return null;
      }

      return {
        studentProfile: profileRaw ? JSON.parse(profileRaw) : null,
        classes: classesRaw ? JSON.parse(classesRaw) : [],
        sessionLogs: logsRaw ? JSON.parse(logsRaw) : [],
        activeThemeId: themeRaw ? JSON.parse(themeRaw) : 'clean-minimal',
        lastSavedAt: Date.now(),
      };
    } catch (error) {
      console.error('[PersistenceAdapter] Failed to parse app snapshot:', error);
      return null;
    }
  }

  /**
   * Persist student profile data
   */
  async saveStudentProfile(profile: StudentProfileData | null): Promise<void> {
    if (profile) {
      await this.setRawItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } else {
      await this.removeRawItem(STORAGE_KEYS.PROFILE);
    }
  }

  /**
   * Persist academic class items
   */
  async saveClasses(classes: any[]): Promise<void> {
    await this.setRawItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }

  /**
   * Persist multimedia class session logs
   */
  async saveSessionLogs(logs: any[]): Promise<void> {
    await this.setRawItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  /**
   * Persist selected active theme id
   */
  async saveActiveTheme(themeId: string): Promise<void> {
    await this.setRawItem(STORAGE_KEYS.THEME, JSON.stringify(themeId));
  }

  /**
   * Queue offline delta mutations for eventual cloud synchronization
   */
  async enqueueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): Promise<void> {
    const queue = await this.getQueuedMutations();
    const newEntry: QueuedMutation = {
      ...mutation,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };
    queue.push(newEntry);
    await this.setRawItem(STORAGE_KEYS.MUTATION_QUEUE, JSON.stringify(queue));
  }

  /**
   * Retrieve all pending offline mutations
   */
  async getQueuedMutations(): Promise<QueuedMutation[]> {
    try {
      const raw = await this.getRawItem(STORAGE_KEYS.MUTATION_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear processed offline mutations
   */
  async clearQueuedMutations(): Promise<void> {
    await this.removeRawItem(STORAGE_KEYS.MUTATION_QUEUE);
  }

  /**
   * Clear all local storage records (e.g. on account reset)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.removeRawItem(STORAGE_KEYS.PROFILE),
      this.removeRawItem(STORAGE_KEYS.CLASSES),
      this.removeRawItem(STORAGE_KEYS.LOGS),
      this.removeRawItem(STORAGE_KEYS.THEME),
      this.removeRawItem(STORAGE_KEYS.MUTATION_QUEUE),
      this.removeRawItem(STORAGE_KEYS.LAST_SYNC),
    ]);
  }

  async resetToZeroState(): Promise<void> {
    await this.clearAll();
  }
}

export const persistenceAdapter = new PersistenceAdapter();
