/**
 * DaneshMate Rust Backend Sync Bridge
 * 
 * High-speed HTTP client connecting the offline-first persistence adapter
 * to the Axum + Tokio Rust microservice.
 */

import {
  persistenceAdapter,
  StudentProfileData,
} from '../storage/persistenceAdapter';
import { universalNativeBridge } from './nativeBridge';

export const RUST_BACKEND_URL =
  (typeof window !== 'undefined' && (window as any).__RUST_BACKEND_URL__) ||
  'http://localhost:8080';

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

class SyncBridge {
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

  /**
   * Convert local models to memory-safe Rust payload format
   */
  private formatPayload(
    profile: StudentProfileData | null,
    classes: any[],
    logs: any[],
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
      classes: (classes || []).map((c) => ({
        id: c.id,
        name: c.name,
        day: String(c.day),
        time_slot: c.time,
        recurrence: c.recurrence,
        professor: c.professor,
        location: c.location,
      })),
      session_logs: (logs || []).map((l) => ({
        id: l.id,
        class_id: l.classId,
        class_name: l.className,
        notes: l.notesText || undefined,
        voice_memo_seconds: l.voiceMemoSeconds,
        attachments_meta: (l.attachedFiles || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          file_type: String(f.type),
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

  /**
   * Fetch current snapshot from Embedded Local Native Library
   */
  async fetchCloudSnapshot(): Promise<SyncResponse | null> {
    this.notify('syncing', 'Reading from Embedded Native Library...');
    try {
      const data = await universalNativeBridge.syncData();
      this.notify('synced', 'Synchronized with Native Rust Core');
      return data as SyncResponse;
    } catch {
      this.notify('offline', 'Running offline (local cache active)');
      return null;
    }
  }

  /**
   * Push local state deltas to Embedded Local Native Library
   */
  async pushLocalDeltas(
    profile: StudentProfileData | null,
    classes: any[],
    logs: any[],
    activeThemeId?: string
  ): Promise<SyncResponse | null> {
    this.notify('syncing', 'Syncing deltas via Native FFI Bridge...');
    const payload = this.formatPayload(profile, classes, logs, activeThemeId);

    try {
      const response = await universalNativeBridge.syncData(payload);
      await persistenceAdapter.clearQueuedMutations();
      this.notify('synced', 'All changes synced to Embedded Native Library');
      return response as SyncResponse;
    } catch {
      // Offline fallback: Queue mutation locally and notify UI
      await persistenceAdapter.enqueueMutation({
        type: 'UPDATE_PROFILE',
        payload,
      });
      this.notify('offline', 'Changes saved offline');
      return null;
    }
  }

  /**
   * Optimistic Sync Execution:
   * 1. Updates UI state immediately.
   * 2. Commits to offline-first local storage asynchronously.
   * 3. Syncs background deltas to the Rust backend without blocking the frame rate.
   */
  async performOptimisticSync(
    profile: StudentProfileData | null,
    classes: any[],
    logs: any[],
    activeThemeId?: string
  ): Promise<void> {
    // 1. Commit to persistent local storage in parallel
    await Promise.all([
      persistenceAdapter.saveStudentProfile(profile),
      persistenceAdapter.saveClasses(classes),
      persistenceAdapter.saveSessionLogs(logs),
      activeThemeId ? persistenceAdapter.saveActiveTheme(activeThemeId) : Promise.resolve(),
    ]);

    // 2. Non-blocking asynchronous sync with Rust backend
    this.pushLocalDeltas(profile, classes, logs, activeThemeId).catch((err) => {
      console.warn('[SyncBridge] Background sync handled silently:', err);
    });
  }
}

export const syncBridge = new SyncBridge();
