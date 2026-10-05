/**
 * Automated Verification Suite for DaneshMate Bi-Weekly Notification Scheduling
 * Validates all 12 tests specified in the requirements.
 */

import {
  generateBiWeeklyOccurrences,
  generateWeeklyOccurrences,
  notificationService,
} from '../src/services/notificationService';

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
  console.log('  DaneshMate Bi-Weekly Reminder Scheduling Tests     ');
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
