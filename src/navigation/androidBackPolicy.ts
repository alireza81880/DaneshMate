/**
 * DaneshMate - Android Back Button Navigation Policy
 * 
 * Pure decision logic for determining the appropriate action when the user
 * presses the Android hardware Back button or performs the system back gesture.
 * 
 * Priority Rules:
 * 1. Close attached file preview modal if open.
 * 2. Close session time picker dialog if open.
 * 3. Close session date picker dialog if open.
 * 4. Close Timeline Review modal and return to Logs if active.
 * 5. Default fallback outside active modals / Timeline: exit application.
 * 
 * Independent of React UI state, Capacitor listeners, and DOM.
 */

export interface AndroidBackNavigationState {
  selectedChatSessionLog: any | null;
  previewFile: any | null;
  isSessionDatePickerOpen: boolean;
  isSessionTimePickerOpen: boolean;
}

export type AndroidBackAction =
  | 'close_preview_file'
  | 'close_time_picker'
  | 'close_date_picker'
  | 'close_timeline_review'
  | 'exit_app';

/**
 * Resolves the appropriate Android Back button action based on current UI state.
 * When in Timeline Review (or any sub-dialog opened from it), navigation closes
 * the top-most modal/picker and returns to Logs without exiting the app.
 * Outside Timeline Review, it preserves the existing app exit behavior.
 */
export function resolveAndroidBackAction(state: AndroidBackNavigationState): AndroidBackAction {
  if (state.selectedChatSessionLog) {
    if (state.previewFile) return 'close_preview_file';
    if (state.isSessionTimePickerOpen) return 'close_time_picker';
    if (state.isSessionDatePickerOpen) return 'close_date_picker';
    return 'close_timeline_review';
  }
  return 'exit_app';
}
