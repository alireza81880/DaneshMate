/**
 * DaneshMate Mobile Rust Backend Sync Bridge
 * Connects React Native (Expo) frontend to the Rust Axum backend.
 */

import {
  mobilePersistenceAdapter,
  StudentProfileData,
  ClassItemData,
  SessionLogData,
} from '../storage/persistenceAdapter';
import { nativeDaneshMateBridge } from './nativeBridge';

export interface RustAttachedFileMeta {
  id: string;
  name: string;
  file_type: string;
  size_text: string;
  uri?: string;
  url?: string;
}

export interface RustStudentProfile {
  first_name: string;
  last_name: string;
  passed_units?: string;
}

export interface RustClassItem {
  id: string;
  name: string;
  day: string;
  time_slot: string;
  recurrence: string;
  professor?: string;
  location?: string;
}

export interface RustSessionLog {
  id: string;
  class_id: string;
  class_name: string;
  notes?: string;
  voice_memo_seconds?: number;
  attachments_meta: RustAttachedFileMeta[];
  reminder_schedule?: string;
  has_reminder: boolean;
  snoozed_until?: string;
  created_at: string;
}

export interface SyncPayload {
  student_profile?: RustStudentProfile;
  classes: RustClassItem[];
  session_logs: RustSessionLog[];
  active_theme_id?: string;
  client_timestamp?: string;
}

export interface SyncResponse {
  success: boolean;
  server_timestamp: string;
  student_profile?: RustStudentProfile;
  classes: RustClassItem[];
  session_logs: RustSessionLog[];
  active_theme_id?: string;
  message: string;
}

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

class MobileSyncBridge {
  private currentState: SyncState = 'idle';
  private listeners: ((state: SyncState, message?: string) => void)[] = [];

  public getSyncState(): SyncState {
    return this.currentState;
  }

  public subscribe(listener: (state: SyncState, message?: string) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentState);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(state: SyncState, message?: string) {
    this.currentState = state;
    this.listeners.forEach((l) => l(state, message));
  }

  private formatPayload(
    profile: StudentProfileData | null,
    classes: ClassItemData[],
    logs: SessionLogData[],
    activeThemeId?: string
  ): SyncPayload {
    return {
      student_profile: profile
        ? {
            first_name: profile.firstName,
            last_name: profile.lastName,
            passed_units: profile.passedUnits,
          }
        : undefined,
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        day: c.day,
        time_slot: c.time,
        recurrence: c.recurrence,
        professor: c.professor,
        location: c.location,
      })),
      session_logs: logs.map((l) => ({
        id: l.id,
        class_id: l.classId,
        class_name: l.className,
        notes: l.notesText || undefined,
        voice_memo_seconds: l.voiceMemoSeconds,
        attachments_meta: (l.attachedFiles || []).map((f) => ({
          id: f.id,
          name: f.name,
          file_type: f.type,
          size_text: f.sizeText,
          uri: f.uri,
          url: f.url,
        })),
        reminder_schedule: l.reminderTimeText || l.reminderTrigger,
        has_reminder: !!l.hasReminder,
        snoozed_until: l.snoozedUntil,
        created_at: l.createdAt,
      })),
      active_theme_id: activeThemeId,
      client_timestamp: new Date().toISOString(),
    };
  }

  async fetchCloudSnapshot(): Promise<SyncResponse | null> {
    this.notify('syncing', 'Reading from Embedded Native Library...');
    try {
      const data = await nativeDaneshMateBridge.syncData();
      if (!data.success) throw new Error(data.message);
      this.notify('synced', 'Synced with Embedded Native Rust Core');
      return data as SyncResponse;
    } catch {
      this.notify('offline', 'Local offline mode active');
      return null;
    }
  }

  async pushLocalDeltas(
    profile: StudentProfileData | null,
    classes: ClassItemData[],
    logs: SessionLogData[],
    activeThemeId?: string
  ): Promise<SyncResponse | null> {
    this.notify('syncing', 'Syncing deltas via Native FFI Bridge...');
    const payload = this.formatPayload(profile, classes, logs, activeThemeId);
    try {
      const response = await nativeDaneshMateBridge.syncData(payload);
      if (!response.success) throw new Error(response.message);
      await mobilePersistenceAdapter.clearQueuedMutations();
      this.notify('synced', 'Local deltas synced via Native Rust Core');
      return response as SyncResponse;
    } catch {
      await mobilePersistenceAdapter.enqueueMutation({
        type: 'UPDATE_PROFILE',
        payload,
      });
      this.notify('offline', 'Preserved offline in local store');
      return null;
    }
  }

  async performOptimisticSync(
    profile: StudentProfileData | null,
    classes: ClassItemData[],
    logs: SessionLogData[],
    activeThemeId?: string
  ): Promise<void> {
    await Promise.all([
      mobilePersistenceAdapter.saveStudentProfile(profile),
      mobilePersistenceAdapter.saveClasses(classes),
      mobilePersistenceAdapter.saveSessionLogs(logs),
      activeThemeId ? mobilePersistenceAdapter.saveActiveTheme(activeThemeId) : Promise.resolve(),
    ]);

    this.pushLocalDeltas(profile, classes, logs, activeThemeId).catch(() => {});
  }
}

export const mobileSyncBridge = new MobileSyncBridge();
