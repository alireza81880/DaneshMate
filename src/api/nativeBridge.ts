/**
 * DaneshMate Embedded Native FFI Bridge (Web / Universal Adapter)
 */

export interface NativeSyncResponse {
  success: boolean;
  server_timestamp: string;
  student_profile?: any;
  classes: any[];
  session_logs: any[];
  active_theme_id?: string;
  message: string;
}

let inMemoryStore: any = {
  student_profile: null,
  classes: [],
  session_logs: [],
  active_theme_id: 'clean-minimal',
};

export const universalNativeBridge = {
  resetStore: async (): Promise<void> => {
    inMemoryStore = {
      student_profile: null,
      classes: [],
      session_logs: [],
      active_theme_id: 'clean-minimal',
    };
    if (typeof window !== 'undefined' && (window as any).__daneshmate_native_reset__) {
      try {
        (window as any).__daneshmate_native_reset__();
      } catch (e) {
        console.warn('Native reset error:', e);
      }
    }
  },

  syncData: async (payload?: any): Promise<NativeSyncResponse> => {
    // If WebAssembly / Native JSI is present:
    if (typeof window !== 'undefined' && (window as any).__daneshmate_native_sync__) {
      try {
        const res = (window as any).__daneshmate_native_sync__(payload ? JSON.stringify(payload) : '');
        return typeof res === 'string' ? JSON.parse(res) : res;
      } catch (e) {
        console.warn('Native JSI error:', e);
      }
    }

    if (payload) {
      if (payload.student_profile !== undefined) inMemoryStore.student_profile = payload.student_profile;
      if (payload.classes !== undefined) inMemoryStore.classes = payload.classes;
      if (payload.session_logs !== undefined) inMemoryStore.session_logs = payload.session_logs;
      if (payload.active_theme_id !== undefined) inMemoryStore.active_theme_id = payload.active_theme_id;
    }

    return {
      success: true,
      server_timestamp: new Date().toISOString(),
      student_profile: inMemoryStore.student_profile,
      classes: inMemoryStore.classes,
      session_logs: inMemoryStore.session_logs,
      active_theme_id: inMemoryStore.active_theme_id,
      message: 'Synchronized via Embedded Local Native Library Engine',
    };
  },
};
