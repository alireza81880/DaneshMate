/**
 * DaneshMate - Dedicated Direct Unit Test Suite for Android Back Navigation Policy
 * 
 * Verifies pure navigation decision rules directly from:
 *   src/navigation/androidBackPolicy.ts
 * 
 * Hierarchy of Priorities:
 *   1. File preview modal ('close_preview_file')
 *   2. Session time picker dialog ('close_time_picker')
 *   3. Session date picker dialog ('close_date_picker')
 *   4. Timeline Review root modal ('close_timeline_review')
 *   5. Outside Timeline Review fallback ('exit_app')
 */

import {
  resolveAndroidBackAction,
  AndroidBackNavigationState,
  AndroidBackAction,
} from '../src/navigation/androidBackPolicy';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${testName} - ${detail || 'Assertion failed'}`);
    failedCount++;
  }
}

function runDirectAndroidBackPolicyTests() {
  console.log('====================================================');
  console.log('  DaneshMate Android Back Policy Direct Unit Tests  ');
  console.log('====================================================\n');

  const dummySession = {
    id: 'session_test_101',
    classId: 'class_math_1',
    sessionNumber: 1,
    dateText: '1405/07/20',
  };

  const dummyFile = {
    id: 'file_doc_1',
    name: 'exam_notes.pdf',
    type: 'pdf',
  };

  // -------------------------------------------------------------------------
  // SUITE 1: Baseline Individual States
  // -------------------------------------------------------------------------
  console.log('--- 1. Baseline Individual States ---');

  // 1.1 Only file preview open
  const res1_1 = resolveAndroidBackAction({
    selectedChatSessionLog: dummySession,
    previewFile: dummyFile,
    isSessionDatePickerOpen: false,
    isSessionTimePickerOpen: false,
  });
  assert(
    res1_1 === 'close_preview_file',
    '1.1: File preview open in Timeline Review -> close_preview_file',
    `Expected 'close_preview_file', got '${res1_1}'`
  );

  // 1.2 Only time picker open
  const res1_2 = resolveAndroidBackAction({
    selectedChatSessionLog: dummySession,
    previewFile: null,
    isSessionDatePickerOpen: false,
    isSessionTimePickerOpen: true,
  });
  assert(
    res1_2 === 'close_time_picker',
    '1.2: Time picker open in Timeline Review -> close_time_picker',
    `Expected 'close_time_picker', got '${res1_2}'`
  );

  // 1.3 Only date picker open
  const res1_3 = resolveAndroidBackAction({
    selectedChatSessionLog: dummySession,
    previewFile: null,
    isSessionDatePickerOpen: true,
    isSessionTimePickerOpen: false,
  });
  assert(
    res1_3 === 'close_date_picker',
    '1.3: Date picker open in Timeline Review -> close_date_picker',
    `Expected 'close_date_picker', got '${res1_3}'`
  );

  // 1.4 Timeline Review open with no active sub-dialogs
  const res1_4 = resolveAndroidBackAction({
    selectedChatSessionLog: dummySession,
    previewFile: null,
    isSessionDatePickerOpen: false,
    isSessionTimePickerOpen: false,
  });
  assert(
    res1_4 === 'close_timeline_review',
    '1.4: Timeline Review open without overlays -> close_timeline_review',
    `Expected 'close_timeline_review', got '${res1_4}'`
  );

  // 1.5 Outside Timeline Review (Standard app state)
  const res1_5 = resolveAndroidBackAction({
    selectedChatSessionLog: null,
    previewFile: null,
    isSessionDatePickerOpen: false,
    isSessionTimePickerOpen: false,
  });
  assert(
    res1_5 === 'exit_app',
    '1.5: Outside Timeline Review -> exit_app',
    `Expected 'exit_app', got '${res1_5}'`
  );

  // -------------------------------------------------------------------------
  // SUITE 2: Priority & Conflict Resolution (Simultaneous Overlays)
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Priority & Conflict Resolution (Simultaneous States) ---');

  // 2.1 Highest priority: Preview + TimePicker + DatePicker all simultaneously active
  const res2_1 = resolveAndroidBackAction({
    selectedChatSessionLog: dummySession,
    previewFile: dummyFile,
    isSessionDatePickerOpen: true,
    isSessionTimePickerOpen: true,
  });
  assert(
    res2_1 === 'close_preview_file',
    '2.1: Priority 1 (Preview) overrides TimePicker + DatePicker -> close_preview_file',
    `Expected 'close_preview_file', got '${res2_1}'`
  );

  // 2.2 Preview + TimePicker simultaneously active
  const res2_2 = resolveAndroidBackAction({
    selectedChatSessionLog: dummySession,
    previewFile: dummyFile,
    isSessionDatePickerOpen: false,
    isSessionTimePickerOpen: true,
  });
  assert(
    res2_2 === 'close_preview_file',
    '2.2: Priority 1 (Preview) overrides TimePicker -> close_preview_file',
    `Expected 'close_preview_file', got '${res2_2}'`
  );

  // 2.3 Preview + DatePicker simultaneously active
  const res2_3 = resolveAndroidBackAction({
    selectedChatSessionLog: dummySession,
    previewFile: dummyFile,
    isSessionDatePickerOpen: true,
    isSessionTimePickerOpen: false,
  });
  assert(
    res2_3 === 'close_preview_file',
    '2.3: Priority 1 (Preview) overrides DatePicker -> close_preview_file',
    `Expected 'close_preview_file', got '${res2_3}'`
  );

  // 2.4 Priority 2 vs Priority 3: TimePicker + DatePicker simultaneously active
  const res2_4 = resolveAndroidBackAction({
    selectedChatSessionLog: dummySession,
    previewFile: null,
    isSessionDatePickerOpen: true,
    isSessionTimePickerOpen: true,
  });
  assert(
    res2_4 === 'close_time_picker',
    '2.4: Priority 2 (TimePicker) overrides DatePicker -> close_time_picker',
    `Expected 'close_time_picker', got '${res2_4}'`
  );

  // -------------------------------------------------------------------------
  // SUITE 3: Session State Boundaries & Outside Timeline Fallbacks
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Session State Boundaries & Outside Fallback Invariants ---');

  // 3.1 Outside Timeline Review even if lingering overlay flags were present
  const res3_1 = resolveAndroidBackAction({
    selectedChatSessionLog: null,
    previewFile: dummyFile,
    isSessionDatePickerOpen: true,
    isSessionTimePickerOpen: true,
  });
  assert(
    res3_1 === 'exit_app',
    '3.1: Outside Timeline Review with lingering flags -> exit_app invariant maintained',
    `Expected 'exit_app', got '${res3_1}'`
  );

  // 3.2 Outside Timeline with only picker flags
  const res3_2 = resolveAndroidBackAction({
    selectedChatSessionLog: null,
    previewFile: null,
    isSessionDatePickerOpen: true,
    isSessionTimePickerOpen: false,
  });
  assert(
    res3_2 === 'exit_app',
    '3.2: Outside Timeline with date picker flag true -> exit_app',
    `Expected 'exit_app', got '${res3_2}'`
  );

  // 3.3 Minimal or alternative session object in Timeline Review
  const res3_3 = resolveAndroidBackAction({
    selectedChatSessionLog: { id: 'minimal_session' },
    previewFile: null,
    isSessionDatePickerOpen: false,
    isSessionTimePickerOpen: false,
  });
  assert(
    res3_3 === 'close_timeline_review',
    '3.3: Minimal truthy session object -> close_timeline_review',
    `Expected 'close_timeline_review', got '${res3_3}'`
  );

  // 3.4 Valid action type safety check
  const allowedActions: AndroidBackAction[] = [
    'close_preview_file',
    'close_time_picker',
    'close_date_picker',
    'close_timeline_review',
    'navigate_back_from_profile',
    'exit_app',
  ];
  const allResults = [res1_1, res1_2, res1_3, res1_4, res1_5, res2_1, res2_2, res2_3, res2_4, res3_1, res3_2, res3_3];
  const allValidTypes = allResults.every(r => allowedActions.includes(r));
  assert(
    allValidTypes,
    '3.4: All returned actions conform strictly to AndroidBackAction union type'
  );

  // -------------------------------------------------------------------------
  // SUITE 4: Profile Page Back Navigation & Root Exit Hierarchy (Bug 2 Fix)
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Profile Page Back Navigation & Root Exit Hierarchy ---');

  // 4.1 User is on Profile tab -> Back must NOT exit app; returns navigate_back_from_profile
  const res4_1 = resolveAndroidBackAction({
    selectedChatSessionLog: null,
    previewFile: null,
    isSessionDatePickerOpen: false,
    isSessionTimePickerOpen: false,
    activeTab: 'profile',
    isEditingProfile: false,
  });
  assert(
    res4_1 === 'navigate_back_from_profile',
    '4.1: Back on Profile tab -> navigate_back_from_profile (does NOT exit app)',
    `Expected 'navigate_back_from_profile', got '${res4_1}'`
  );

  // 4.2 User is editing profile on dashboard -> Back closes profile edit mode without exiting
  const res4_2 = resolveAndroidBackAction({
    selectedChatSessionLog: null,
    previewFile: null,
    isSessionDatePickerOpen: false,
    isSessionTimePickerOpen: false,
    activeTab: 'home',
    isEditingProfile: true,
  });
  assert(
    res4_2 === 'navigate_back_from_profile',
    '4.2: Back while editing profile -> navigate_back_from_profile (does NOT exit app)',
    `Expected 'navigate_back_from_profile', got '${res4_2}'`
  );

  // 4.3 User is on root home tab (not on profile, no modal open) -> Back exits app
  const res4_3 = resolveAndroidBackAction({
    selectedChatSessionLog: null,
    previewFile: null,
    isSessionDatePickerOpen: false,
    isSessionTimePickerOpen: false,
    activeTab: 'home',
    isEditingProfile: false,
  });
  assert(
    res4_3 === 'exit_app',
    '4.3: Back on root Home tab -> exit_app',
    `Expected 'exit_app', got '${res4_3}'`
  );

  // 4.4 Priority check: Timeline Review open while activeTab is profile -> closes modal/picker first before profile
  const res4_4a = resolveAndroidBackAction({
    selectedChatSessionLog: dummySession,
    previewFile: dummyFile,
    isSessionDatePickerOpen: true,
    isSessionTimePickerOpen: true,
    activeTab: 'profile',
    isEditingProfile: true,
  });
  const res4_4b = resolveAndroidBackAction({
    selectedChatSessionLog: dummySession,
    previewFile: null,
    isSessionDatePickerOpen: false,
    isSessionTimePickerOpen: false,
    activeTab: 'profile',
    isEditingProfile: false,
  });
  assert(
    res4_4a === 'close_preview_file' && res4_4b === 'close_timeline_review',
    '4.4: Open Timeline Review / Preview modals take strict priority over Profile tab back navigation',
    `Got '${res4_4a}' and '${res4_4b}'`
  );

  // 4.5 Sequential 2-step flow: Profile -> Back (returns to Home) -> Back again (exits app)
  let simulatedActiveTab = 'profile';
  const step1Action = resolveAndroidBackAction({
    selectedChatSessionLog: null,
    previewFile: null,
    isSessionDatePickerOpen: false,
    isSessionTimePickerOpen: false,
    activeTab: simulatedActiveTab,
  });
  if (step1Action === 'navigate_back_from_profile') {
    simulatedActiveTab = 'home';
  }
  const step2Action = resolveAndroidBackAction({
    selectedChatSessionLog: null,
    previewFile: null,
    isSessionDatePickerOpen: false,
    isSessionTimePickerOpen: false,
    activeTab: simulatedActiveTab,
  });
  assert(
    step1Action === 'navigate_back_from_profile' && simulatedActiveTab === 'home' && step2Action === 'exit_app',
    '4.5: Two-step flow (Profile -> Back -> Root Home -> Back -> exit_app) executes in exact order',
    `step1=${step1Action}, tabAfterStep1=${simulatedActiveTab}, step2=${step2Action}`
  );

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------');
  console.log(`Android Back Policy Direct Unit Tests: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('----------------------------------------------------');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runDirectAndroidBackPolicyTests();
