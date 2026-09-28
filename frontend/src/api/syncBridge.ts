/**
 * DaneshMate Mobile Sync Bridge
 *
 * Architecture:
 * - AsyncStorage (persistenceAdapter) is the single source of truth.
 * - The Rust core is an in-memory cache reached through the native bridge.
 * - If pushing to the Rust cache fails, only the LATEST snapshot is kept as pending
 *   (previously every failure appended a full copy, so the queue grew without bound).
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

/** Rust expects `voice_memo_seconds: Option<u32>`; a float or negative value fails the whole parse. */
function toU32(value: unknown): number | undefined {
  if (typeof value !== 'number' || !isFinite(value)) return undefined;
  return Math.max(0, Math.round(value));
}

function toStr(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

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
    this.listeners.forEach((l) => {
      try {
        l(state, message);
      } catch (err) {
        console.warn('[SyncBridge] listener error:', err);
      }
    });
  }

  private formatPayload(
    profile: StudentProfileData | null | undefined,
    classes: ClassItemData[],
    logs: SessionLogData[],
    activeThemeId?: string
  ): SyncPayload {
    return {
      student_profile: profile
        ? {
            first_name: toStr(profile.firstName),
            last_name: toStr(profile.lastName),
            passed_units: profile.passedUnits ? String(profile.passedUnits) : undefined,
          }
        : undefined,
      classes: (classes || []).map((c) => ({
        id: toStr(c.id),
        name: toStr(c.name),
        day: toStr(c.day),
        time_slot: toStr(c.time),
        recurrence: toStr(c.recurrence) || 'every_week',
        professor: c.professor || undefined,
        location: c.location || undefined,
      })),
      session_logs: (logs || []).map((l) => ({
        id: toStr(l.id),
        class_id: toStr(l.classId),
        class_name: toStr(l.className),
        notes: l.notesText || undefined,
        voice_memo_seconds: toU32(l.voiceMemoSeconds),
        attachments_meta: (l.attachedFiles || []).map((f) => ({
          id: toStr(f.id),
          name: toStr(f.name),
          file_type: toStr(f.type),
          size_text: toStr(f.sizeText),
          uri: f.uri,
          url: f.url,
        })),
        reminder_schedule: l.reminderTimeText || l.reminderTrigger,
        has_reminder: !!l.hasReminder,
        snoozed_until: l.snoozedUntil,
        created_at: toStr(l.createdAt) || new Date().toISOString(),
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
    profile: StudentProfileData | null | undefined,
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
    } catch (err) {
      console.warn('[SyncBridge] Rust cache sync failed, keeping latest snapshot pending:', err);
      try {
        // Keep exactly one pending snapshot (latest wins). Data itself is already safe in AsyncStorage.
        await mobilePersistenceAdapter.clearQueuedMutations();
        await mobilePersistenceAdapter.enqueueMutation({ type: 'UPDATE_PROFILE', payload });
      } catch (queueErr) {
        console.warn('[SyncBridge] Could not store pending snapshot:', queueErr);
      }
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
    try {
      await Promise.all([
        mobilePersistenceAdapter.saveStudentProfile(profile),
        mobilePersistenceAdapter.saveClasses(classes),
        mobilePersistenceAdapter.saveSessionLogs(logs),
        activeThemeId ? mobilePersistenceAdapter.saveActiveTheme(activeThemeId) : Promise.resolve(),
      ]);
    } catch (err) {
      console.error('[SyncBridge] Persisting to AsyncStorage failed:', err);
      this.notify('error', 'Local storage write failed');
      return;
    }

    this.pushLocalDeltas(profile, classes, logs, activeThemeId).catch(() => {});
  }
}

export const mobileSyncBridge = new MobileSyncBridge();
