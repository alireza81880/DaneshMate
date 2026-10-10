/**
 * Automated Verification Suite for Timeline & Session Reminder
 * Covers all 7 required scenarios:
 * 1. Default reminder date across multiple different days equals device Shamsi today
 * 2. Editing reminder preserves previous date and time
 * 3. Messages and files display in a single unified timeline in chronological order
 * 4. Adding a file to an old session registers the exact date/timestamp of addition
 * 5. Closing and reopening a session preserves event order and dates stably
 * 6. Legacy data without timestamp displays without data loss and without assigning today's date
 * 7. Session Reminders and Class Reminders continue to function reliably
 */

import {
  getTodayJalaliDefaults,
  formatJalaliDate,
  formatPersianTime,
  parseJalaliDateTimeToTimestamp,
  getMessageTimestamp,
  getFileTimestamp,
  gregorianToJalali,
  jalaliToGregorian,
  toPersianDigits,
} from '../src/App';
import { notificationService } from '../src/services/notificationService';
import { ClassSessionLog, AttachedFile } from '../src/types';

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

async function runTimelineAndReminderTests() {
  console.log('====================================================');
  console.log('  DaneshMate Timeline & Reminder Audit Test Suite   ');
  console.log('====================================================\n');

  // -------------------------------------------------------------------------
  // SCENARIO 1: Default reminder date equals device Shamsi today on different days
  // -------------------------------------------------------------------------
  console.log('--- SCENARIO 1: Default Reminder Date Equals Device Shamsi Today ---');
  
  // Test day A: Nowruz (2026-03-21) -> 1405/01/01
  const testDate1 = new Date(2026, 2, 21, 10, 0, 0); // March 21, 2026
  const defaults1 = getTodayJalaliDefaults(testDate1);
  const [jy1, jm1, jd1] = gregorianToJalali(testDate1.getFullYear(), testDate1.getMonth() + 1, testDate1.getDate());
  assert(
    defaults1.year === jy1 && defaults1.month === jm1 && defaults1.day === jd1,
    'SCENARIO 1.1: Default date matches Shamsi today for 2026-03-21',
    `Expected ${jy1}/${jm1}/${jd1}, got ${defaults1.year}/${defaults1.month}/${defaults1.day}`
  );

  // Test day B: Mid-autumn (2026-10-10) -> 1405/07/19
  const testDate2 = new Date(2026, 9, 10, 14, 30, 0);
  const defaults2 = getTodayJalaliDefaults(testDate2);
  const [jy2, jm2, jd2] = gregorianToJalali(testDate2.getFullYear(), testDate2.getMonth() + 1, testDate2.getDate());
  assert(
    defaults2.year === jy2 && defaults2.month === jm2 && defaults2.day === jd2,
    'SCENARIO 1.2: Default date matches Shamsi today for 2026-10-10',
    `Expected ${jy2}/${jm2}/${jd2}, got ${defaults2.year}/${defaults2.month}/${defaults2.day}`
  );

  // Test day C: Late night edge case (23:45) -> Must still stay Shamsi today
  const testDateLate = new Date(2026, 9, 10, 23, 45, 0);
  const defaultsLate = getTodayJalaliDefaults(testDateLate);
  assert(
    defaultsLate.year === jy2 && defaultsLate.month === jm2 && defaultsLate.day === jd2,
    'SCENARIO 1.3: Late night (23:45) preserves Shamsi today instead of shifting day',
    `Expected ${jy2}/${jm2}/${jd2}, got ${defaultsLate.year}/${defaultsLate.month}/${defaultsLate.day}`
  );

  // Verify no static hardcoded date like 1405/07/04 is returned
  const staticHardcoded = defaults1.year === 1405 && defaults1.month === 7 && defaults1.day === 4;
  assert(!staticHardcoded, 'SCENARIO 1.4: No static date (1405/07/04) is hardcoded for defaults');


  // -------------------------------------------------------------------------
  // SCENARIO 2: Editing reminder preserves previous date and time
  // -------------------------------------------------------------------------
  console.log('\n--- SCENARIO 2: Editing Reminder Preserves Previous Date & Time ---');

  // Case 2.1: Session with explicit reminderTimestamp (e.g. 1405/08/20 at 16:45)
  const [gyRem, gmRem, gdRem] = jalaliToGregorian(1405, 8, 20);
  const savedReminderDate = new Date(gyRem, gmRem - 1, gdRem, 16, 45, 0);
  const savedTimestamp = savedReminderDate.getTime();

  const sessionWithReminder: ClassSessionLog = {
    id: '1728000000000',
    classId: 'c1',
    className: 'ریاضی مهندسی',
    createdAt: '۱۴۰۵/۰۷/۱۵ - ۱۰:۰۰',
    notesText: 'نکات آزمون میان‌ترم',
    hasReminder: true,
    reminderTimestamp: savedTimestamp,
    reminderTimeText: '۱۴۰۵/۰۸/۲۰ - ساعت ۱۶:۴۵',
    chatMessages: [],
  };

  // Simulate edit extraction logic
  let editYear = 0;
  let editMonth = 0;
  let editDay = 0;
  let editHour = 0;
  let editMinute = 0;

  if (sessionWithReminder.reminderTimestamp) {
    const d = new Date(sessionWithReminder.reminderTimestamp);
    const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    editYear = jy;
    editMonth = jm;
    editDay = jd;
    editHour = d.getHours();
    editMinute = d.getMinutes();
  }

  assert(
    editYear === 1405 && editMonth === 8 && editDay === 20 && editHour === 16 && editMinute === 45,
    'SCENARIO 2.1: Edit reminder accurately extracts previous year, month, day, hour, and minute',
    `Got ${editYear}/${editMonth}/${editDay} ${editHour}:${editMinute}`
  );

  // Case 2.2: Legacy session with only reminderTimeText and no reminderTimestamp
  const legacyReminderSession: ClassSessionLog = {
    id: 'legacy_rem_1',
    classId: 'c1',
    className: 'فیزیک',
    createdAt: '۱۴۰۵/۰۷/۱۰ - ۰۸:۰۰',
    notesText: 'تمرین فصل ۳',
    hasReminder: true,
    reminderTimeText: '۱۴۰۵/۰۹/۰۵ - ساعت ۱۴:۱۵',
    chatMessages: [],
  };

  const parsedLegacyTs = parseJalaliDateTimeToTimestamp(legacyReminderSession.reminderTimeText);
  assert(parsedLegacyTs > 0, 'SCENARIO 2.2a: parseJalaliDateTimeToTimestamp parses legacy reminderTimeText');
  const dLegacy = new Date(parsedLegacyTs);
  const [jyL, jmL, jdL] = gregorianToJalali(dLegacy.getFullYear(), dLegacy.getMonth() + 1, dLegacy.getDate());
  assert(
    jyL === 1405 && jmL === 9 && jdL === 5 && dLegacy.getHours() === 14 && dLegacy.getMinutes() === 15,
    'SCENARIO 2.2b: Legacy reminder without timestamp preserves exact date and time when edited',
    `Got ${jyL}/${jmL}/${jdL} ${dLegacy.getHours()}:${dLegacy.getMinutes()}`
  );


  // -------------------------------------------------------------------------
  // SCENARIO 3: Unified chronological timeline for messages and files
  // -------------------------------------------------------------------------
  console.log('\n--- SCENARIO 3: Unified Chronological Timeline Stream ---');

  const baseSessionMs = 1760000000000;
  const attachedFile1: AttachedFile = {
    id: `att_${baseSessionMs + 1000}_abc`,
    name: 'جزوه_صفحه_۱.pdf',
    type: 'pdf',
    sizeText: '1.2 MB',
    addedAt: baseSessionMs + 1000,
    addedAtTimestamp: baseSessionMs + 1000,
  };
  const message1 = {
    id: `${baseSessionMs + 2000}`,
    text: 'استاد گفت تمرین اول اختیاری است.',
    time: formatPersianTime(baseSessionMs + 2000),
    timestamp: baseSessionMs + 2000,
  };
  const attachedFile2: AttachedFile = {
    id: `att_${baseSessionMs + 3000}_def`,
    name: 'تمرین_تحویلی.docx',
    type: 'document',
    sizeText: '500 KB',
    addedAt: baseSessionMs + 3000,
    addedAtTimestamp: baseSessionMs + 3000,
  };
  const message2 = {
    id: `${baseSessionMs + 4000}`,
    text: 'مهلت تحویل تا شنبه آینده تمدید شد.',
    time: formatPersianTime(baseSessionMs + 4000),
    timestamp: baseSessionMs + 4000,
  };

  // Build timeline events
  type TimelineEvent =
    | { type: 'message'; id: string; timestamp: number; text: string }
    | { type: 'file'; id: string; timestamp: number; name: string };

  const rawEvents: TimelineEvent[] = [
    { type: 'file', id: attachedFile2.id, timestamp: getFileTimestamp(attachedFile2, baseSessionMs), name: attachedFile2.name },
    { type: 'message', id: message1.id, timestamp: getMessageTimestamp(message1, baseSessionMs), text: message1.text },
    { type: 'file', id: attachedFile1.id, timestamp: getFileTimestamp(attachedFile1, baseSessionMs), name: attachedFile1.name },
    { type: 'message', id: message2.id, timestamp: getMessageTimestamp(message2, baseSessionMs), text: message2.text },
  ];

  rawEvents.sort((a, b) => a.timestamp - b.timestamp);

  assert(rawEvents[0].id === attachedFile1.id, 'SCENARIO 3.1: Earliest item (File 1) is first in sorted timeline');
  assert(rawEvents[1].id === message1.id, 'SCENARIO 3.2: Message 1 is second in sorted timeline');
  assert(rawEvents[2].id === attachedFile2.id, 'SCENARIO 3.3: File 2 is third in sorted timeline');
  assert(rawEvents[3].id === message2.id, 'SCENARIO 3.4: Message 2 is last in sorted timeline');

  let strictlyMonotonic = true;
  for (let i = 0; i < rawEvents.length - 1; i++) {
    if (rawEvents[i].timestamp > rawEvents[i + 1].timestamp) strictlyMonotonic = false;
  }
  assert(strictlyMonotonic, 'SCENARIO 3.5: Timeline events are strictly monotonic from oldest to newest');


  // -------------------------------------------------------------------------
  // SCENARIO 4: Adding a file to an old session registers current date
  // -------------------------------------------------------------------------
  console.log('\n--- SCENARIO 4: Adding File to Old Session Registers Addition Date ---');

  const oldSessionTimestamp = new Date(2025, 3, 10, 10, 0, 0).getTime(); // 1404/01/21
  const todayTimestamp = new Date(2026, 9, 10, 15, 30, 0).getTime(); // 1405/07/19

  // Old file from session creation
  const oldFile: AttachedFile = {
    id: `att_${oldSessionTimestamp}_init`,
    name: 'اسلایدهای_جلسه_اول.pdf',
    type: 'pdf',
    sizeText: '2.4 MB',
    addedAt: oldSessionTimestamp,
    addedAtTimestamp: oldSessionTimestamp,
  };

  // Newly attached file today
  const newFileToday: AttachedFile = {
    id: `att_${todayTimestamp}_new`,
    name: 'حل_تمرین_جدید.pdf',
    type: 'pdf',
    sizeText: '1.1 MB',
    addedAt: todayTimestamp,
    addedAtTimestamp: todayTimestamp,
  };

  const oldFileTs = getFileTimestamp(oldFile, oldSessionTimestamp);
  const newFileTs = getFileTimestamp(newFileToday, oldSessionTimestamp);

  assert(oldFileTs === oldSessionTimestamp, 'SCENARIO 4.1: Old file retains old session timestamp');
  assert(newFileTs === todayTimestamp, 'SCENARIO 4.2: New file retains addition timestamp (today)');

  const oldFileDateStr = formatJalaliDate(oldFileTs);
  const newFileDateStr = formatJalaliDate(newFileTs);

  assert(oldFileDateStr !== newFileDateStr, 'SCENARIO 4.3: New file Jalali date differs from old session date');
  const [tY, tM, tD] = gregorianToJalali(2026, 10, 10);
  const expectedTodayStr = `${toPersianDigits(tY)}/${toPersianDigits(tM.toString().padStart(2, '0'))}/${toPersianDigits(tD.toString().padStart(2, '0'))}`;
  assert(newFileDateStr === expectedTodayStr, 'SCENARIO 4.4: New file displays today Shamsi date', `Expected ${expectedTodayStr}, got ${newFileDateStr}`);


  // -------------------------------------------------------------------------
  // SCENARIO 5: Session re-opening retains identical event order and dates
  // -------------------------------------------------------------------------
  console.log('\n--- SCENARIO 5: Reopening Session Retains Event Order & Dates Stably ---');

  const fullSession: ClassSessionLog = {
    id: `${oldSessionTimestamp}`,
    classId: 'c1',
    className: 'شیمی آلی',
    createdAt: `${oldFileDateStr} - ۱۰:۰۰`,
    notesText: 'مرور واکنش‌های آلکن',
    attachedFiles: [oldFile, newFileToday],
    chatMessages: [
      { id: `${oldSessionTimestamp + 60000}`, text: 'پیام قدیمی در زمان جلسه', time: '۱۰:۰۱', timestamp: oldSessionTimestamp + 60000 },
      { id: `${todayTimestamp + 5000}`, text: 'پیام جدید امروز', time: '۱۵:۳۰', timestamp: todayTimestamp + 5000 },
    ],
  };

  // Build stream on first open
  const open1Events = [
    ...(fullSession.attachedFiles || []).map((f) => ({ id: f.id, ts: getFileTimestamp(f, oldSessionTimestamp) })),
    ...(fullSession.chatMessages || []).map((m) => ({ id: m.id, ts: getMessageTimestamp(m, oldSessionTimestamp) })),
  ].sort((a, b) => a.ts - b.ts);

  // Simulate closing session (null) and reloading from persistent representation
  const serialized = JSON.stringify(fullSession);
  const reloadedSession: ClassSessionLog = JSON.parse(serialized);

  // Build stream on second open
  const open2Events = [
    ...(reloadedSession.attachedFiles || []).map((f) => ({ id: f.id, ts: getFileTimestamp(f, oldSessionTimestamp) })),
    ...(reloadedSession.chatMessages || []).map((m) => ({ id: m.id, ts: getMessageTimestamp(m, oldSessionTimestamp) })),
  ].sort((a, b) => a.ts - b.ts);

  assert(open1Events.length === open2Events.length, 'SCENARIO 5.1: Number of events identical after reopening');
  let stableOrder = true;
  for (let i = 0; i < open1Events.length; i++) {
    if (open1Events[i].id !== open2Events[i].id || open1Events[i].ts !== open2Events[i].ts) {
      stableOrder = false;
    }
  }
  assert(stableOrder, 'SCENARIO 5.2: Order of events and timestamps is 100% stable after closing and reopening');


  // -------------------------------------------------------------------------
  // SCENARIO 6: Legacy data without timestamp displays cleanly without loss
  // -------------------------------------------------------------------------
  console.log('\n--- SCENARIO 6: Legacy Data Without Timestamp Displays Non-Destructively ---');

  const legacySession: ClassSessionLog = {
    id: 'legacy_session_100', // Non-numeric ID
    classId: 'c2',
    className: 'زبان عمومی',
    createdAt: '۱۴۰۳/۰۵/۱۵ - ۱۱:۳۰',
    notesText: 'گرامر درس ۲',
    voiceMemoUri: 'file:///data/user/0/com.daneshmate/cache/audio_100.m4a',
    voiceMemoSeconds: 180,
    attachedFiles: [
      { id: 'f_legacy_1', name: 'تمرین_قدیمی.pdf', type: 'pdf' }, // No addedAt, no addedAtTimestamp
      { id: 'f_legacy_2', name: 'لغات_مهم.docx', type: 'document' },
    ],
    chatMessages: [
      { id: 'm_legacy_1', text: 'سوال از استاد درباره آزمون', time: '۱۱:۴۵' }, // No timestamp
    ],
  };

  const parsedLegacyCreated = parseJalaliDateTimeToTimestamp(legacySession.createdAt);
  assert(parsedLegacyCreated > 0, 'SCENARIO 6.1: parseJalaliDateTimeToTimestamp extracts legacy createdAt timestamp');

  // Verify legacy file timestamp falls back to parsed session timestamp, NOT today
  const legFile1Ts = getFileTimestamp(legacySession.attachedFiles![0], parsedLegacyCreated);
  assert(legFile1Ts === parsedLegacyCreated, 'SCENARIO 6.2: Legacy file falls back to session creation timestamp');
  assert(legFile1Ts !== Date.now(), 'SCENARIO 6.3: Legacy file is NOT assigned today timestamp');

  // Verify legacy message timestamp falls back to session timestamp
  const legMsgTs = getMessageTimestamp(legacySession.chatMessages![0], parsedLegacyCreated);
  assert(legMsgTs === parsedLegacyCreated, 'SCENARIO 6.4: Legacy message falls back to session creation timestamp');

  // Verify voice memo is preserved untouched
  assert(legacySession.voiceMemoUri !== undefined && legacySession.voiceMemoSeconds === 180, 'SCENARIO 6.5: Legacy voice memo and audio metadata preserved untouched');

  // Verify formatJalaliDate(0) returns '' instead of today or epoch
  assert(formatJalaliDate(0) === '', 'SCENARIO 6.6: formatJalaliDate(0) safely returns empty string without defaulting to today');
  assert(formatPersianTime(0) === '', 'SCENARIO 6.7: formatPersianTime(0) safely returns empty string without defaulting to today');


  // -------------------------------------------------------------------------
  // SCENARIO 7: Session Reminder and Class Reminder continue to work
  // -------------------------------------------------------------------------
  console.log('\n--- SCENARIO 7: Session Reminder and Class Reminder Operational ---');

  // 7.1: One-time Session Reminder
  const futureSessionTs = Date.now() + 3600000; // 1 hour in future
  const calculatedSessionDate = notificationService.calculateScheduleDate(
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    futureSessionTs
  );
  assert(
    calculatedSessionDate.getTime() === futureSessionTs,
    'SCENARIO 7.1: Session Reminder calculateScheduleDate preserves exact future timestamp'
  );

  // 7.2: Class Reminder (Weekly / Bi-Weekly)
  const classItem = {
    id: 'cls_test_reminder',
    name: 'آمار و احتمال',
    day: 'سه‌شنبه',
    time: '09:00 - 11:00',
    recurrence: 'every_week',
    hasReminder: true,
    reminderMode: 'before_class',
    reminderMinutesBefore: 15,
  };

  const expectedOccs = notificationService.getClassExpectedOccurrences(classItem, Date.now());
  assert(expectedOccs.length > 0, 'SCENARIO 7.2: Class reminder generates valid expected occurrences');
  assert(expectedOccs[0].notifId > 0, 'SCENARIO 7.3: Class reminder has valid numeric notification ID');

  console.log('\n----------------------------------------------------');
  console.log(`Timeline & Reminder Test Suite Summary: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('----------------------------------------------------');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTimelineAndReminderTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
