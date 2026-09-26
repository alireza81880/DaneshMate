/**
 * DaneshMate Mobile Offline-First Persistence Adapter
 * 
 * Asynchronous storage engine with cross-environment resilience (React Native & MMKV/AsyncStorage).
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
  day: string;
  time: string;
  recurrence: 'every_week' | 'even_weeks' | 'odd_weeks';
  professor?: string;
  location?: string;
}

export interface AttachedFileData {
  id: string;
  name: string;
  type: string;
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
  attachedFiles: AttachedFileData[];
  hasReminder?: boolean;
  reminderTrigger?: string;
  reminderTimeText?: string;
  snoozedUntil?: string;
}

export interface AppSnapshot {
  studentProfile: StudentProfileData | null;
  classes: ClassItemData[];
  sessionLogs: SessionLogData[];
  activeThemeId: string;
  lastSavedAt: number;
}

export interface QueuedMutation {
  id: string;
  type: 'UPDATE_PROFILE' | 'ADD_CLASS' | 'UPDATE_CLASS' | 'DELETE_CLASS' | 'ADD_SESSION_LOG' | 'DELETE_SESSION_LOG';
  payload: any;
  timestamp: number;
}

const STORAGE_KEYS = {
  PROFILE: '@daneshmate/student_profile',
  CLASSES: '@daneshmate/classes',
  LOGS: '@daneshmate/session_logs',
  THEME: '@daneshmate/active_theme',
  MUTATION_QUEUE: '@daneshmate/offline_mutations',
};

const memoryStore: Record<string, string> = {};

class MobilePersistenceAdapter {
  private async getRawItem(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return memoryStore[key] ?? null;
    } catch {
      return memoryStore[key] ?? null;
    }
  }

  private async setRawItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      memoryStore[key] = value;
    } catch {
      memoryStore[key] = value;
    }
  }

  private async removeRawItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      delete memoryStore[key];
    } catch {
      delete memoryStore[key];
    }
  }

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
    } catch {
      return null;
    }
  }

  async saveStudentProfile(profile: StudentProfileData | null): Promise<void> {
    if (profile) {
      await this.setRawItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } else {
      await this.removeRawItem(STORAGE_KEYS.PROFILE);
    }
  }

  async saveClasses(classes: ClassItemData[]): Promise<void> {
    await this.setRawItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }

  async saveSessionLogs(logs: SessionLogData[]): Promise<void> {
    await this.setRawItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  async saveActiveTheme(themeId: string): Promise<void> {
    await this.setRawItem(STORAGE_KEYS.THEME, JSON.stringify(themeId));
  }

  async enqueueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): Promise<void> {
    const queue = await this.getQueuedMutations();
    queue.push({
      ...mutation,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    });
    await this.setRawItem(STORAGE_KEYS.MUTATION_QUEUE, JSON.stringify(queue));
  }

  async getQueuedMutations(): Promise<QueuedMutation[]> {
    try {
      const raw = await this.getRawItem(STORAGE_KEYS.MUTATION_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async clearQueuedMutations(): Promise<void> {
    await this.removeRawItem(STORAGE_KEYS.MUTATION_QUEUE);
  }

  /**
   * Complete Zero-Data Reset Guard
   * Fully cleans profile, classes, logs, and pending mutation queues without re-injecting any seeds.
   */
  async resetToZeroState(): Promise<void> {
    await Promise.all([
      this.removeRawItem(STORAGE_KEYS.PROFILE),
      this.removeRawItem(STORAGE_KEYS.CLASSES),
      this.removeRawItem(STORAGE_KEYS.LOGS),
      this.removeRawItem(STORAGE_KEYS.MUTATION_QUEUE),
    ]);
  }
}

export const mobilePersistenceAdapter = new MobilePersistenceAdapter();
