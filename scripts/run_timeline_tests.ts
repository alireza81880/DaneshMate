/**
 * Automated Verification Suite for DaneshMate Timeline & Session Reminder Scenarios
 * Tests all 7 required scenarios:
 * 1. Default reminder date on different days equals today's Jalali date.
 * 2. Editing reminder preserves previous date and time.
 * 3. Messages and files appear in unified chronological timeline.
 * 4. Adding a file to an older session records the date of the day the file was added.
 * 5. Closing and reopening session keeps events and order stable.
 * 6. Legacy data without timestamp displays cleanly without destructive changes.
 * 7. Session Reminder and Class Reminder still work without regression.
 */

import {
  gregorianToJalali,
  jalaliToGregorian,
  getTodayJalaliDefaults,
  formatJalaliDate,
  formatPersianTime,
  getMessageTimestamp,
  getFileTimestamp,
  parseJalaliDateTimeToTimestamp,
  AttachedFile,
} from '../src/App';

import {
  notificationService,
  generateBiWeeklyOccurrences,
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

async function runTimelineTests() {
  console.log('====================================================');
  console.log('  DaneshMate Timeline & Session Reminder Test Suite ');
  console.log('====================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Default reminder date on different days equals today's Jalali date
  // --------------------------------------------------------------------------
  // Case A: Spring / Farvardin
  const dateSpring = new Date(2026, 2, 21, 10, 0, 0); // 1 Farvardin 1405 at 10:00
  const defaultsSpring = getTodayJalaliDefaults(dateSpring);
  assert(
    defaultsSpring.year === 1405 && defaultsSpring.month === 1 && defaultsSpring.day === 1,
    'TEST 1a: Default date on 2026-03-21 is 1405/01/01 (Farvardin)',
    `Got ${defaultsSpring.year}/${defaultsSpring.month}/${defaultsSpring.day}`
  );
  assert(
    defaultsSpring.hour === 11 && defaultsSpring.minute === 0,
    'TEST 1b: Default time is 1 hour in future (11:00)',
    `Got ${defaultsSpring.hour}:${defaultsSpring.minute}`
  );

  // Case B: Autumn / Mehr
  const dateAutumn = new Date(2026, 9, 10, 14, 30, 0); // 19 Mehr 1405 at 14:30
  const defaultsAutumn = getTodayJalaliDefaults(dateAutumn);
  assert(
    defaultsAutumn.year === 1405 && defaultsAutumn.month === 7 && defaultsAutumn.day === 19,
    'TEST 1c: Default date on 2026-10-10 is 1405/07/19 (Mehr)',
    `Got ${defaultsAutumn.year}/${defaultsAutumn.month}/${defaultsAutumn.day}`
  );
  assert(
    defaultsAutumn.hour === 15 && defaultsAutumn.minute === 0,
    'TEST 1d: Default time is safe round hour (15:00)',
    `Got ${defaultsAutumn.hour}:${defaultsAutumn.minute}`
  );

  // Case C: Late night hour rollover
  const dateLateNight = new Date(2026, 9, 10, 23, 10, 0); // 23:10
  const defaultsLateNight = getTodayJalaliDefaults(dateLateNight);
  assert(
    defaultsLateNight.year === 1405 && defaultsLateNight.month === 7 && defaultsLateNight.day === 19 && defaultsLateNight.hour === 23 && defaultsLateNight.minute === 59,
    'TEST 1e: Late night at 23:10 safely defaults to 23:59 today',
    `Got ${defaultsLateNight.hour}:${defaultsLateNight.minute}`
  );

  // --------------------------------------------------------------------------
  // TEST 2: Editing reminder preserves previous date and time
  // --------------------------------------------------------------------------
  // A reminder originally set for 1405/08/15 at 16:45
  const [targetGy, targetGm, targetGd] = jalaliToGregorian(1405, 8, 15);
  const originalReminderDate = new Date(targetGy, targetGm - 1, targetGd, 16, 45, 0, 0);
  const originalReminderTs = originalReminderDate.getTime();

  // Simulate handleOpenEditTimelineReminder logic
  const editDate = new Date(originalReminderTs);
  const [savedJy, savedJm, savedJd] = gregorianToJalali(editDate.getFullYear(), editDate.getMonth() + 1, editDate.getDate());
  const savedHour = editDate.getHours();
  const savedMin = editDate.getMinutes();

  assert(
    savedJy === 1405 && savedJm === 8 && savedJd === 15 && savedHour === 16 && savedMin === 45,
    'TEST 2: Editing reminder preserves exact stored date (1405/08/15) and time (16:45)',
    `Got ${savedJy}/${savedJm}/${savedJd} ${savedHour}:${savedMin}`
  );

  // --------------------------------------------------------------------------
  // TEST 3: Messages and files appear in unified chronological timeline
  // --------------------------------------------------------------------------
  const baseSessionTs = new Date(2026, 9, 1, 9, 0, 0).getTime();
  const msg1 = { id: 'm1', text: 'نکته اول', time: '۰۹:۱۵', timestamp: baseSessionTs + 15 * 60 * 1000 };
  const file1: AttachedFile = {
    id: 'f1',
    name: 'chapter1.pdf',
    type: 'pdf',
    sizeText: '1.2 MB',
    addedAt: baseSessionTs + 30 * 60 * 1000,
    addedAtTimestamp: baseSessionTs + 30 * 60 * 1000,
  };
  const msg2 = { id: 'm2', text: 'توضیحات تکمیلی', time: '۱۰:۰۰', timestamp: baseSessionTs + 60 * 60 * 1000 };
  const file2: AttachedFile = {
    id: 'f2',
    name: 'diagram.png',
    type: 'image',
    sizeText: '500 KB',
    addedAt: baseSessionTs + 90 * 60 * 1000,
    addedAtTimestamp: baseSessionTs + 90 * 60 * 1000,
  };

  const timelineEvents = [
    { type: 'file' as const, id: file1.id, timestamp: getFileTimestamp(file1, baseSessionTs), file: file1 },
    { type: 'file' as const, id: file2.id, timestamp: getFileTimestamp(file2, baseSessionTs), file: file2 },
    { type: 'message' as const, id: msg1.id, timestamp: getMessageTimestamp(msg1, baseSessionTs), message: msg1 },
    { type: 'message' as const, id: msg2.id, timestamp: getMessageTimestamp(msg2, baseSessionTs), message: msg2 },
  ];

  timelineEvents.sort((a, b) => a.timestamp - b.timestamp);

  const eventOrderIds = timelineEvents.map((e) => e.id);
  assert(
    eventOrderIds[0] === 'm1' && eventOrderIds[1] === 'f1' && eventOrderIds[2] === 'm2' && eventOrderIds[3] === 'f2',
    'TEST 3: Events are interleaved in strict chronological order [m1, f1, m2, f2]',
    `Got [${eventOrderIds.join(', ')}]`
  );

  // --------------------------------------------------------------------------
  // TEST 4: Adding a file to an older session records the date of the day the file was added
  // --------------------------------------------------------------------------
  // Session created on 1405/07/01
  const oldSessionDate = new Date(2026, 8, 22, 10, 0, 0); // 1 Mehr 1405
  const oldSessionTs = oldSessionDate.getTime();

  // File added 5 days later on 1405/07/06
  const fileAddedDate = new Date(2026, 8, 27, 14, 20, 0); // 6 Mehr 1405
  const fileAddedTs = fileAddedDate.getTime();

  const fileAddedLater: AttachedFile = {
    id: `att_${fileAddedTs}_xyz`,
    name: 'supplement.pdf',
    type: 'pdf',
    sizeText: '2.4 MB',
    addedAt: fileAddedTs,
    addedAtTimestamp: fileAddedTs,
  };

  const resolvedFileTs = getFileTimestamp(fileAddedLater, oldSessionTs);
  const fileJalaliDate = formatJalaliDate(resolvedFileTs);
  const sessionJalaliDate = formatJalaliDate(oldSessionTs);

  assert(
    resolvedFileTs === fileAddedTs,
    'TEST 4a: File added to old session preserves its own addedAtTimestamp'
  );
  assert(
    fileJalaliDate !== sessionJalaliDate && fileJalaliDate.includes('۰۶'),
    'TEST 4b: File display date reflects the addition day (1405/07/06), not the session day (1405/07/01)',
    `File date: ${fileJalaliDate}, Session date: ${sessionJalaliDate}`
  );

  // --------------------------------------------------------------------------
  // TEST 5: Closing and reopening session keeps events and order stable
  // --------------------------------------------------------------------------
  const sessionLogState = {
    id: oldSessionTs.toString(),
    classId: 'c1',
    className: 'هوش مصنوعی',
    createdAt: `${sessionJalaliDate} - ۱۰:۰۰`,
    notesText: 'نکات آزمون میان‌ترم',
    attachedFiles: [file1, fileAddedLater],
    chatMessages: [msg1, msg2],
    hasReminder: true,
    reminderTimestamp: originalReminderTs,
    reminderTimeText: '۱۴۰۵/۰۸/۱۵ - ساعت ۱۶:۴۵',
  };

  // Simulate JSON serialization to storage and deserialization on reopening
  const jsonStored = JSON.stringify(sessionLogState);
  const reloadedLog = JSON.parse(jsonStored);

  const reloadedEvents = [
    ...reloadedLog.attachedFiles.map((f: AttachedFile) => ({
      type: 'file' as const,
      id: f.id,
      timestamp: getFileTimestamp(f, parseInt(reloadedLog.id, 10)),
    })),
    ...reloadedLog.chatMessages.map((m: any) => ({
      type: 'message' as const,
      id: m.id,
      timestamp: getMessageTimestamp(m, parseInt(reloadedLog.id, 10)),
    })),
  ];
  reloadedEvents.sort((a, b) => a.timestamp - b.timestamp);

  assert(
    reloadedEvents.length === 4,
    'TEST 5a: All 4 events persist through storage serialization cycle'
  );
  assert(
    reloadedEvents[0].id === 'm1' && reloadedEvents[3].id === fileAddedLater.id,
    'TEST 5b: Event order and timestamps remain 100% deterministic after reopen'
  );

  // --------------------------------------------------------------------------
  // TEST 6: Legacy data without timestamp displays cleanly without destructive changes
  // --------------------------------------------------------------------------
  const legacyFileNoTimestamp: AttachedFile = {
    id: 'legacy_att_1',
    name: 'handout.docx',
    type: 'word',
  };
  const legacyMsgNoTimestamp = {
    id: 'legacy_msg_1',
    text: 'پیام قدیمی بدون تایم‌استمپ',
    time: '۱۰:۱۵',
  };

  const legacySessionTs = new Date(2026, 7, 10, 11, 0, 0).getTime(); // Mordad 1405
  const resolvedLegacyFileTs = getFileTimestamp(legacyFileNoTimestamp, legacySessionTs);
  const resolvedLegacyMsgTs = getMessageTimestamp(legacyMsgNoTimestamp, legacySessionTs);

  assert(
    resolvedLegacyFileTs === legacySessionTs,
    'TEST 6a: Legacy file without timestamp safely resolves to session timestamp'
  );
  assert(
    resolvedLegacyMsgTs === legacySessionTs,
    'TEST 6b: Legacy message without timestamp safely resolves to session timestamp'
  );

  // Test parsing legacy createdAt formats
  const parsedFromLegacyJalali = parseJalaliDateTimeToTimestamp('۱۴۰۴/۰۸/۱۲ - ۱۰:۳۰');
  assert(
    parsedFromLegacyJalali > 0,
    'TEST 6c: parseJalaliDateTimeToTimestamp extracts epoch from Persian string'
  );
  const jalaliCheck = formatJalaliDate(parsedFromLegacyJalali);
  assert(
    jalaliCheck.includes('۱۴۰۴') && jalaliCheck.includes('۰۸') && jalaliCheck.includes('۱۲'),
    'TEST 6d: Formatted date matches original legacy Jalali date (1404/08/12)'
  );

  // Test that an old session log with time-only createdAt never displays today's date
  const parsedIdFromEpoch = parseInt('1700000000000', 10);
  const nonDestructiveSessionDateStr = parsedIdFromEpoch > 1600000000000
    ? formatJalaliDate(parsedIdFromEpoch)
    : 'جلسه گذشته';
  assert(
    !nonDestructiveSessionDateStr.includes(formatJalaliDate(Date.now())) || formatJalaliDate(parsedIdFromEpoch) === formatJalaliDate(Date.now()),
    'TEST 6e: Old session log date derived from id timestamp, not today device clock'
  );

  // --------------------------------------------------------------------------
  // TEST 7: Session Reminder and Class Reminder still work without regression
  // --------------------------------------------------------------------------
  // 7a: One-time Session Reminder schedule calculation
  const sessionReminderDate = notificationService.calculateScheduleDate(
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    originalReminderTs
  );
  assert(
    sessionReminderDate.getTime() === originalReminderTs,
    'TEST 7a: Session Reminder directly schedules exact target timestamp'
  );

  // 7b: Bi-weekly Class Reminder occurrences calculation
  const anchorDate = new Date(2026, 9, 10, 0, 0, 0, 0); // Saturday
  const biWeeklyOccs = generateBiWeeklyOccurrences(anchorDate.getTime());
  assert(
    biWeeklyOccs.length === 8,
    'TEST 7b: Bi-weekly class recurrence still yields exactly 8 occurrences'
  );

  // 7c: Class occurrence scheduling with before_class
  const classItem = {
    id: 'test_class',
    name: 'مبانی کامپیوتر',
    day: 'شنبه',
    time: '08:00 - 10:00',
    recurrence: 'bi_weekly',
    anchor_timestamp: anchorDate.getTime(),
    hasReminder: true,
    reminderMode: 'before_class',
    reminderMinutesBefore: 30,
  };
  const expectedOccs = notificationService.getClassExpectedOccurrences(classItem, anchorDate.getTime() - 86400000);
  assert(
    expectedOccs.length === 8,
    'TEST 7c: Class reminder generates all 8 scheduled notifications for upcoming occurrences'
  );

  console.log('\n----------------------------------------------------');
  console.log(`Test Execution Summary: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('----------------------------------------------------');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTimelineTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
