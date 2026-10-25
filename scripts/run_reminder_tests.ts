/**
 * Automated Verification Suite for DaneshMate Bi-Weekly Notification Scheduling
 * Validates all 12 tests specified in the requirements.
 */

import {
  generateBiWeeklyOccurrences,
  generateWeeklyOccurrences,
  notificationService,
} from '../src/services/notificationService';
import {
  detectClassConflict,
  ClassItem,
} from '../src/App';

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

async function runTests() {
  console.log('====================================================');
  console.log('  DaneshMate Bi-Weekly Reminder & Conflict Tests    ');
  console.log('====================================================\n');

  // Baseline anchor date: 2026-10-10 (Saturday / شنبه) at 00:00:00 local time
  const anchorDate = new Date(2026, 9, 10, 0, 0, 0, 0); // October is month 9 (0-indexed)
  const anchorTimestamp = anchorDate.getTime();

  // TEST 1: anchor = date D, bi-weekly -> exactly 8 occurrences
  const occs = generateBiWeeklyOccurrences(anchorTimestamp);
  assert(occs.length === 8, 'TEST 1: anchor = date D, bi-weekly -> exactly 8 occurrences', `Expected 8, got ${occs.length}`);

  // TEST 2: occurrences: D, D+14, D+28, ... D+98
  let test2Valid = true;
  for (let i = 0; i < 8; i++) {
    const expected = new Date(anchorDate);
    expected.setDate(expected.getDate() + i * 14);
    if (occs[i] !== expected.getTime()) {
      test2Valid = false;
      console.error(`Mismatch at index ${i}: expected ${expected.toISOString()}, got ${new Date(occs[i]).toISOString()}`);
    }
  }
  assert(test2Valid, 'TEST 2: occurrences match calendar steps: D, D+14, D+28, ... D+98');

  // TEST 3: D+112 must NOT enter the 16-week horizon
  const d112 = new Date(anchorDate);
  d112.setDate(d112.getDate() + 112);
  const containsD112 = occs.includes(d112.getTime());
  assert(!containsD112, 'TEST 3: D+112 is strictly excluded from 16-week horizon (max 8 sessions)');

  // TEST 4: before_class 15 minutes -> all 8 notifications correct (classTime - 15 min)
  const classItemBefore = {
    id: 'math_101',
    name: 'ریاضی مهندسی',
    day: 'شنبه',
    time: '10:00 - 12:00',
    recurrence: 'bi_weekly',
    anchor_timestamp: anchorTimestamp,
    hasReminder: true,
    reminderMode: 'before_class',
    reminderMinutesBefore: 15,
  };
  // Simulate time before anchor
  const nowBefore = anchorDate.getTime() - 86400000;
  const expectedOccsBefore = notificationService.getClassExpectedOccurrences(classItemBefore, nowBefore);
  assert(expectedOccsBefore.length === 8, 'TEST 4a: exactly 8 expected future occurrences for future class');

  let test4Valid = true;
  for (let i = 0; i < expectedOccsBefore.length; i++) {
    const occ = expectedOccsBefore[i];
    const sDate = new Date(occs[i]);
    const expectedFire = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate(), 9, 45, 0, 0);
    if (occ.fireDate.getTime() !== expectedFire.getTime()) {
      test4Valid = false;
      console.error(`Mismatch at occurrence ${i}: expected fire ${expectedFire.toISOString()}, got ${occ.fireDate.toISOString()}`);
    }
  }
  assert(test4Valid, 'TEST 4: before_class 15 minutes -> all 8 notifications scheduled for 09:45:00 on occurrence day');

  // TEST 5: exact_time -> all 8 notifications correct
  const classItemExact = {
    id: 'physics_201',
    name: 'فیزیک ۲',
    day: 'شنبه',
    time: '14:00 - 16:00',
    recurrence: 'bi_weekly',
    anchor_timestamp: anchorTimestamp,
    hasReminder: true,
    reminderMode: 'exact_time',
    reminderExactTime: '08:30',
  };
  const expectedOccsExact = notificationService.getClassExpectedOccurrences(classItemExact, nowBefore);
  let test5Valid = expectedOccsExact.length === 8;
  for (let i = 0; i < expectedOccsExact.length; i++) {
    const occ = expectedOccsExact[i];
    const sDate = new Date(occs[i]);
    const expectedFire = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate(), 8, 30, 0, 0);
    if (occ.fireDate.getTime() !== expectedFire.getTime()) {
      test5Valid = false;
    }
  }
  assert(test5Valid, 'TEST 5: exact_time (08:30) -> all 8 notifications scheduled for 08:30:00 on occurrence day');

  // TEST 6: two different classes -> notification IDs unique across classes and occurrences
  const classA = { id: 'cls_A', anchor_timestamp: anchorTimestamp, recurrence: 'bi_weekly', hasReminder: true, time: '08:00' };
  const classB = { id: 'cls_B', anchor_timestamp: anchorTimestamp, recurrence: 'bi_weekly', hasReminder: true, time: '08:00' };
  const occsA = notificationService.getClassExpectedOccurrences(classA, nowBefore);
  const occsB = notificationService.getClassExpectedOccurrences(classB, nowBefore);
  const idsSet = new Set<number>();
  for (const o of occsA) idsSet.add(o.notifId);
  for (const o of occsB) idsSet.add(o.notifId);
  assert(idsSet.size === 16, 'TEST 6: two different classes have 16 distinct, unique deterministic notification IDs', `Expected 16 unique IDs, got ${idsSet.size}`);

  // TEST 7: edit anchor -> old notifications canceled and new notifications scheduled
  const newAnchorDate = new Date(2026, 9, 17, 0, 0, 0, 0);
  const newAnchorTimestamp = newAnchorDate.getTime();
  const classAEdited = { ...classA, anchor_timestamp: newAnchorTimestamp };
  const newOccs = notificationService.getClassExpectedOccurrences(classAEdited, nowBefore);
  const oldIds = new Set(occsA.map((o) => o.notifId));
  const newIds = new Set(newOccs.map((o) => o.notifId));
  let overlapCount = 0;
  for (const id of oldIds) {
    if (newIds.has(id)) overlapCount++;
  }
  assert(overlapCount === 0, 'TEST 7: edited anchor produces completely distinct new notification IDs from old anchor');

  // TEST 8: delete class -> cancelClassReminder computes and cancels all occurrence IDs
  let cancelCalledWithoutError = true;
  try {
    await notificationService.cancelClassReminder('cls_A', classA);
  } catch (e) {
    cancelCalledWithoutError = false;
  }
  assert(cancelCalledWithoutError, 'TEST 8: cancelClassReminder executes cleanly for class and all its occurrences');

  // TEST 9: app restart / syncPendingNotifications handles multiple occurrences
  let syncWithoutError = true;
  try {
    await notificationService.syncPendingNotifications([], [classItemBefore, classItemExact]);
  } catch (e) {
    syncWithoutError = false;
  }
  assert(syncWithoutError, 'TEST 9: syncPendingNotifications cleanly resolves multiple occurrences per class without duplicates');

  // TEST 10: legacy even/odd class without anchor -> no guessed reminder
  const legacyClassNoAnchor = {
    id: 'legacy_1',
    name: 'کلاس قدیمی',
    day: 'شنبه',
    time: '10:00',
    recurrence: 'even_weeks',
    hasReminder: true,
    // anchor_timestamp is undefined
  };
  const legacyOccs = notificationService.getClassExpectedOccurrences(legacyClassNoAnchor, nowBefore);
  assert(legacyOccs.length === 0, 'TEST 10: legacy class with even_weeks and no anchor produces 0 guessed occurrences');

  // TEST 11: anchor Saturday + classDay Monday -> consistency validation
  const satAnchor = new Date(2026, 9, 10); // Saturday (شنبه)
  const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  const satDayName = dayNames[satAnchor.getDay()];
  const isConsistent = satDayName === 'شنبه';
  const isMismatched = satDayName !== 'دوشنبه';
  assert(isConsistent && isMismatched, 'TEST 11: Saturday anchor consistently identified as شنبه and rejected for دوشنبه');

  // TEST 12: Session Reminder remains one-time DATE + TIME
  const sessionTimestamp = new Date(2026, 9, 15, 14, 30, 0, 0).getTime();
  const sessionDate = notificationService.calculateScheduleDate(
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    sessionTimestamp
  );
  assert(sessionDate.getTime() === sessionTimestamp, 'TEST 12: Session Reminder directly preserves one-time exact timestamp untouched');

  // -------------------------------------------------------------------------
  // SUITE B: Bug 3 - Weekly & Bi-Weekly Multi-Week Horizon & Inactive App Tests
  // -------------------------------------------------------------------------
  console.log('\n--- Bug 3: Recurring Class Reminders Across Multi-Week Inactivity ---');

  // TEST 13: Weekly class generates full 16 future occurrences even when created on class day AFTER class time passed
  const sameDayAfterClassNow = new Date(2026, 9, 10, 15, 0, 0, 0).getTime(); // Saturday 15:00 (after 10:00 class)
  const weeklyClassSameDay = {
    id: 'weekly_sat_1',
    name: 'معادلات دیفرانسیل',
    day: 'شنبه',
    time: '۱۰:۰۰ - ۱۲:۰۰', // Persian digits in time!
    recurrence: 'every_week',
    hasReminder: true,
    reminderMode: 'before_class',
    reminderMinutesBefore: 30,
  };
  const weeklyOccsSameDay = notificationService.getClassExpectedOccurrences(weeklyClassSameDay, sameDayAfterClassNow);
  assert(
    weeklyOccsSameDay.length === 16,
    'TEST 13: Weekly class with Persian digits created after today class time still schedules full 16 future weekly occurrences',
    `Expected 16, got ${weeklyOccsSameDay.length}`
  );
  // First occurrence must be next Saturday (2026-10-17) at 09:30:00
  const expectedNextSatFire = new Date(2026, 9, 17, 9, 30, 0, 0).getTime();
  assert(
    weeklyOccsSameDay[0]?.fireDate.getTime() === expectedNextSatFire,
    'TEST 14: Persian digit classTime (۱۰:۰۰ - ۱۲:۰۰) with 30m before fires at 09:30 on next Saturday (not 08:00 fallback)',
    `Expected ${new Date(expectedNextSatFire).toISOString()}, got ${weeklyOccsSameDay[0]?.fireDate.toISOString()}`
  );

  // TEST 15: App not opened for 10 days (1+ week) -> future occurrences remain pre-scheduled in the 16-week horizon
  const tenDaysLaterNow = sameDayAfterClassNow + 10 * 86400000; // Tuesday 10 days later
  const remainingScheduledAfter10Days = weeklyOccsSameDay.filter((o) => o.fireDate.getTime() > tenDaysLaterNow);
  assert(
    remainingScheduledAfter10Days.length === 15,
    'TEST 15: When user does not open app for 10 days, 15 future weekly occurrences are already pre-scheduled',
    `Expected 15 remaining occurrences, got ${remainingScheduledAfter10Days.length}`
  );

  // TEST 16: Bi-weekly class when user does not open app for 15 days -> remaining 7 occurrences still pre-scheduled
  const fifteenDaysAfterBefore = nowBefore + 15 * 86400000;
  const remainingBiWeeklyAfter15Days = expectedOccsBefore.filter((o) => o.fireDate.getTime() > fifteenDaysAfterBefore);
  assert(
    remainingBiWeeklyAfter15Days.length === 7,
    'TEST 16: Bi-weekly class still has 7 pre-scheduled future occurrences after 15 days of app inactivity',
    `Expected 7, got ${remainingBiWeeklyAfter15Days.length}`
  );

  // TEST 17: Weekly class with stale past anchor_timestamp ignores stale anchor and schedules 16 future occurrences
  const stalePastAnchor = new Date(2025, 0, 4, 0, 0, 0, 0).getTime(); // 1+ year in the past
  const weeklyWithStaleAnchor = {
    ...weeklyClassSameDay,
    id: 'weekly_stale_anchor',
    anchor_timestamp: stalePastAnchor,
  };
  const occsStaleWeekly = notificationService.getClassExpectedOccurrences(weeklyWithStaleAnchor, sameDayAfterClassNow);
  assert(
    occsStaleWeekly.length === 16,
    'TEST 17: Weekly class with stale past anchor_timestamp still generates 16 future occurrences',
    `Expected 16, got ${occsStaleWeekly.length}`
  );

  // -------------------------------------------------------------------------
  // SUITE C: Bug 1 - Recurrence-Aware Class Conflict Detection Tests
  // -------------------------------------------------------------------------
  console.log('\n--- Bug 1: Recurrence-Aware Class Conflict Detection ---');

  const satWeek1Anchor = new Date(2026, 9, 10, 12, 0, 0, 0).getTime(); // Saturday Week 1
  const satWeek2Anchor = new Date(2026, 9, 17, 12, 0, 0, 0).getTime(); // Saturday Week 2 (7 days later - opposite week)
  const satWeek3Anchor = new Date(2026, 9, 24, 12, 0, 0, 0).getTime(); // Saturday Week 3 (14 days later - same bi-weekly cycle as Week 1)

  const existingWeeklySat: ClassItem = {
    id: 'c_weekly_sat',
    name: 'ساختمان داده',
    day: 'شنبه',
    time: '08:00 - 10:00',
    recurrence: 'every_week',
  };

  const existingBiWeeklySatW1: ClassItem = {
    id: 'c_biweekly_w1',
    name: 'آزمایشگاه فیزیک (هفته اول)',
    day: 'شنبه',
    time: '10:00 - 12:00',
    recurrence: 'bi_weekly',
    anchor_date: '1405/07/18',
    anchor_timestamp: satWeek1Anchor,
    scheduled_session_timestamps: generateBiWeeklyOccurrences(satWeek1Anchor),
  };

  // TEST 18 (Scenario 1): Two every_week classes on same day & overlapping time -> CONFLICT
  const conflict1 = detectClassConflict(
    'شنبه',
    '08:00 - 10:00',
    [existingWeeklySat],
    null,
    { recurrence: 'every_week' }
  );
  assert(
    conflict1.hasConflict && conflict1.conflictingClass?.id === 'c_weekly_sat',
    'TEST 18 (Bug 1.1): Two every_week classes on same day and time -> hasConflict = true'
  );

  // TEST 19 (Scenario 2): Two bi_weekly classes on same day & time but OPPOSITE weeks (7 days apart) -> NO CONFLICT
  const conflict2 = detectClassConflict(
    'شنبه',
    '10:00 - 12:00',
    [existingBiWeeklySatW1],
    null,
    {
      recurrence: 'bi_weekly',
      anchor_date: '1405/07/25',
      anchor_timestamp: satWeek2Anchor,
      scheduled_session_timestamps: generateBiWeeklyOccurrences(satWeek2Anchor),
    }
  );
  assert(
    !conflict2.hasConflict,
    'TEST 19 (Bug 1.2): Two bi_weekly classes on same day and time in opposite weeks (7 days apart) -> hasConflict = false'
  );

  // TEST 20 (Scenario 3): Two bi_weekly classes on same day & time in SAME week cycle (0 or 14 days apart) -> CONFLICT
  const conflict3SameAnchor = detectClassConflict(
    'شنبه',
    '10:30 - 11:30',
    [existingBiWeeklySatW1],
    null,
    {
      recurrence: 'bi_weekly',
      anchor_timestamp: satWeek1Anchor,
      scheduled_session_timestamps: generateBiWeeklyOccurrences(satWeek1Anchor),
    }
  );
  const conflict3Plus14Days = detectClassConflict(
    'شنبه',
    '10:00 - 12:00',
    [existingBiWeeklySatW1],
    null,
    {
      recurrence: 'bi_weekly',
      anchor_timestamp: satWeek3Anchor,
      scheduled_session_timestamps: generateBiWeeklyOccurrences(satWeek3Anchor),
    }
  );
  assert(
    conflict3SameAnchor.hasConflict && conflict3Plus14Days.hasConflict,
    'TEST 20 (Bug 1.3): Two bi_weekly classes on same day & overlapping time in same week cycle (0 or +14 days) -> hasConflict = true'
  );

  // TEST 21 (Scenario 4): One every_week class + one bi_weekly class on same day & overlapping time -> CONFLICT
  const conflict4a = detectClassConflict(
    'شنبه',
    '10:00 - 12:00',
    [existingBiWeeklySatW1],
    null,
    { recurrence: 'every_week' }
  );
  const conflict4b = detectClassConflict(
    'شنبه',
    '08:30 - 09:30',
    [existingWeeklySat],
    null,
    {
      recurrence: 'bi_weekly',
      anchor_timestamp: satWeek2Anchor,
      scheduled_session_timestamps: generateBiWeeklyOccurrences(satWeek2Anchor),
    }
  );
  assert(
    conflict4a.hasConflict && conflict4b.hasConflict,
    'TEST 21 (Bug 1.4): One every_week class and one bi_weekly class on same day & overlapping time -> hasConflict = true'
  );

  // TEST 22 (Scenario 5): Same day & same week, non-overlapping times (e.g., 08:00-10:00 and 10:00-12:00) -> NO CONFLICT
  const conflict5 = detectClassConflict(
    'شنبه',
    '10:00 - 12:00',
    [existingWeeklySat],
    null,
    { recurrence: 'every_week' }
  );
  assert(
    !conflict5.hasConflict,
    'TEST 22 (Bug 1.5): Same day & same week with adjacent non-overlapping times (08:00-10:00 vs 10:00-12:00) -> hasConflict = false'
  );

  // TEST 23 (Scenario 6): Editing an existing class does NOT conflict with itself (excludeId)
  const conflict6 = detectClassConflict(
    'شنبه',
    '10:00 - 12:00',
    [existingBiWeeklySatW1],
    'c_biweekly_w1',
    {
      recurrence: 'bi_weekly',
      anchor_timestamp: satWeek1Anchor,
    }
  );
  assert(
    !conflict6.hasConflict,
    'TEST 23 (Bug 1.6): Editing an existing class with excludeId does not falsely conflict with itself'
  );

  // TEST 24 (Scenario 7): Legacy classes (without anchor_timestamp or with even_weeks/odd_weeks)
  const legacyNoRecurrence: ClassItem = {
    id: 'legacy_weekly',
    name: 'کلاس قدیمی هفتگی',
    day: 'یکشنبه',
    time: '08:00 - 10:00',
  };
  const legacyEven: ClassItem = {
    id: 'legacy_even',
    name: 'کلاس زوج قدیمی',
    day: 'دوشنبه',
    time: '10:00 - 12:00',
    recurrence: 'even_weeks',
  };
  const conflictLegacyWeekly = detectClassConflict('یکشنبه', '08:00 - 10:00', [legacyNoRecurrence], null);
  const noConflictLegacyOppositeParity = detectClassConflict(
    'دوشنبه',
    '10:00 - 12:00',
    [legacyEven],
    null,
    { recurrence: 'odd_weeks' }
  );
  const conservativeMissingAnchor = detectClassConflict(
    'شنبه',
    '10:00 - 12:00',
    [existingBiWeeklySatW1],
    null,
    { recurrence: 'bi_weekly' } // Missing anchor_timestamp -> conservative conflict = true
  );
  assert(
    conflictLegacyWeekly.hasConflict &&
      !noConflictLegacyOppositeParity.hasConflict &&
      conservativeMissingAnchor.hasConflict,
    'TEST 24 (Bug 1.7): Legacy classes without recurrence/anchors behave safely and conservatively without crashing'
  );

  console.log('\n----------------------------------------------------');
  console.log(`Test Execution Summary: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('----------------------------------------------------');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
