/**
 * DaneshMate Embedded Core - End-to-End FFI Smoke Test (Web & Universal)
 */

import { universalNativeBridge, NativeSyncResponse } from '../api/nativeBridge';

export interface SmokeTestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

export interface SmokeTestSuiteReport {
  timestamp: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  totalDurationMs: number;
  results: SmokeTestResult[];
}

export async function runFfiSmokeTests(): Promise<SmokeTestSuiteReport> {
  const results: SmokeTestResult[] = [];
  const suiteStartTime = Date.now();

  // Test 1: Zero-Data Cold Start State (Null Profile & Empty Classes)
  {
    const t0 = performance.now();
    try {
      await universalNativeBridge.resetStore();
      const snapshot: NativeSyncResponse = await universalNativeBridge.syncData();
      const passed =
        snapshot.success === true &&
        Array.isArray(snapshot.classes) &&
        snapshot.classes.length === 0 &&
        (snapshot.student_profile === null || snapshot.student_profile === undefined);

      results.push({
        name: 'daneshmate_init_core & Zero-Data Cold Start',
        passed,
        durationMs: Math.round(performance.now() - t0),
        details: passed
          ? 'Verified zero default state (profile is null and classes array is empty)'
          : 'Failed: initial state contained mock or non-empty records',
      });
    } catch (err: any) {
      results.push({
        name: 'daneshmate_init_core & Zero-Data Cold Start',
        passed: false,
        durationMs: Math.round(performance.now() - t0),
        details: err?.message || String(err),
      });
    }
  }

  // Test 2: Mutation & Round-Trip
  {
    const t0 = performance.now();
    try {
      const mutationPayload = {
        student_profile: {
          first_name: 'علیرضا',
          last_name: 'رادمنش',
          passed_units: '88',
        },
        classes: [
          {
            id: 'test-class-999',
            name: 'هوش مصنوعی و یادگیری ماشین',
            day: 'سه‌شنبه',
            time_slot: '14:00 - 16:00',
            recurrence: 'every_week',
            professor: 'دکتر حسینی',
          },
        ],
        session_logs: [
          {
            id: 'test-log-999',
            class_id: 'test-class-999',
            class_name: 'هوش مصنوعی و یادگیری ماشین',
            notes: 'آزمون صحه‌گذاری انتقال داده FFI',
            has_reminder: true,
          },
        ],
      };

      const syncRes = await universalNativeBridge.syncData(mutationPayload);
      const queryRes = await universalNativeBridge.syncData();

      const passed =
        syncRes.success === true &&
        queryRes.classes.some((c) => c.id === 'test-class-999') &&
        queryRes.student_profile?.passed_units === '88';

      results.push({
        name: 'daneshmate_sync_data Mutation & Persistence',
        passed,
        durationMs: Math.round(performance.now() - t0),
        details: passed
          ? 'Mutations synced and persisted across FFI read cycles'
          : 'Data did not persist',
      });
    } catch (err: any) {
      results.push({
        name: 'daneshmate_sync_data Mutation & Persistence',
        passed: false,
        durationMs: Math.round(performance.now() - t0),
        details: err?.message || String(err),
      });
    }
  }

  // Test 3: UTF-8 Encoding
  {
    const t0 = performance.now();
    try {
      const persianStr = 'آزمایش نویسه‌های پیچیده فارسی: گ، چ، پ، ژ | علائم: «» ؟ ! 🎓 ⚡';
      const res = await universalNativeBridge.syncData({
        classes: [{ id: 'utf8-test', name: persianStr, day: 'چهارشنبه', time_slot: '10:00 - 12:00', recurrence: 'every_week' }],
      });
      const target = res.classes.find((c) => c.id === 'utf8-test');
      const passed = target?.name === persianStr;

      results.push({
        name: 'UTF-8 Persian & Emoji Encoding Integrity',
        passed,
        durationMs: Math.round(performance.now() - t0),
        details: passed ? 'Persian glyphs and emojis preserved identically' : 'Encoding corrupted',
      });
    } catch (err: any) {
      results.push({
        name: 'UTF-8 Persian & Emoji Encoding Integrity',
        passed: false,
        durationMs: Math.round(performance.now() - t0),
        details: err?.message || String(err),
      });
    }
  }

  // Test 4: Stress benchmark
  {
    const t0 = performance.now();
    const ITERATIONS = 50;
    try {
      for (let i = 0; i < ITERATIONS; i++) {
        await universalNativeBridge.syncData({ active_theme_id: 'clean-minimal' });
      }
      const totalElapsed = performance.now() - t0;
      const avgMs = totalElapsed / ITERATIONS;
      results.push({
        name: `Stress Benchmark (${ITERATIONS} Sequential Sync Cycles)`,
        passed: true,
        durationMs: Math.round(totalElapsed),
        details: `Average latency: ${avgMs.toFixed(3)} ms per sync operation`,
      });
    } catch (err: any) {
      results.push({
        name: 'Stress Benchmark (Sequential Sync Cycles)',
        passed: false,
        durationMs: Math.round(performance.now() - t0),
        details: err?.message || String(err),
      });
    }
  }

  // Test 5: Full Persian Student Dataset Round-Trip (علیرضا محمدزاده، ریاضی مهندسی، یادداشت جلسه اول)
  {
    const t0 = performance.now();
    try {
      const studentPayload = {
        student_profile: {
          first_name: 'علیرضا',
          last_name: 'محمدزاده',
          major: 'مهندسی کامپیوتر',
          university: 'دانشگاه تهران',
          current_term: 'ترم ۵',
        },
        classes: [
          {
            id: 'class-persian-real',
            name: 'ریاضی مهندسی',
            day: 'دوشنبه',
            time_slot: '08:00 - 10:00',
            recurrence: 'every_week',
            professor: 'دکتر محمدی',
          },
        ],
        session_logs: [
          {
            id: 'log-persian-real',
            class_id: 'class-persian-real',
            class_name: 'ریاضی مهندسی',
            notes: 'یادداشت جلسه اول: بررسی سری فوریه و تبدیل لاپلاس',
          },
        ],
      };

      const res = await universalNativeBridge.syncData(studentPayload);
      const passed =
        res.success === true &&
        res.student_profile?.first_name === 'علیرضا' &&
        res.student_profile?.last_name === 'محمدزاده' &&
        res.classes.some((c) => c.name === 'ریاضی مهندسی') &&
        res.session_logs.some((l) => l.notes.includes('یادداشت جلسه اول'));

      results.push({
        name: 'Persian Real-World Dataset Integrity',
        passed,
        durationMs: Math.round(performance.now() - t0),
        details: passed
          ? 'Persian student profile, class name and session notes fully verified without corruption'
          : 'Persian verification failed',
      });
    } catch (err: any) {
      results.push({
        name: 'Persian Real-World Dataset Integrity',
        passed: false,
        durationMs: Math.round(performance.now() - t0),
        details: err?.message || String(err),
      });
    }
  }

  // Test 6: Delete all classes mutation (Empty array overwrites existing classes)
  {
    const t0 = performance.now();
    try {
      const res = await universalNativeBridge.syncData({ classes: [] });
      const passed = res.success === true && Array.isArray(res.classes) && res.classes.length === 0;

      results.push({
        name: 'Delete All Classes (Zero Array Mutation)',
        passed,
        durationMs: Math.round(performance.now() - t0),
        details: passed ? 'Successfully cleared all class records via empty array mutation' : 'Failed to clear classes',
      });
    } catch (err: any) {
      results.push({
        name: 'Delete All Classes (Zero Array Mutation)',
        passed: false,
        durationMs: Math.round(performance.now() - t0),
        details: err?.message || String(err),
      });
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedCount,
    failedCount,
    totalDurationMs: Date.now() - suiteStartTime,
    results,
  };
}
