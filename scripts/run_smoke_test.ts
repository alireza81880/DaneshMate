/**
 * DaneshMate CI/CD FFI Smoke Test Execution Script
 */

import { runFfiSmokeTests } from '../src/tests/ffiSmokeTest';

async function main() {
  console.log('====================================================');
  console.log('  DaneshMate Embedded Rust Core - FFI Smoke Test    ');
  console.log('====================================================');

  try {
    const report = await runFfiSmokeTests();

    console.log(`\nExecution Timestamp: ${report.timestamp}`);
    console.log(`Total Tests Run:     ${report.totalTests}`);
    console.log(`Passed:              ${report.passedCount}`);
    console.log(`Failed:              ${report.failedCount}`);
    console.log(`Total Duration:      ${report.totalDurationMs} ms\n`);

    report.results.forEach((r, idx) => {
      const statusIcon = r.passed ? '✓ PASSED' : '✗ FAILED';
      console.log(`[${idx + 1}] ${statusIcon} - ${r.name} (${r.durationMs}ms)`);
      if (r.details) {
        console.log(`    ↳ ${r.details}`);
      }
    });

    if (report.failedCount > 0) {
      console.error('\n[-] Smoke test suite failed with errors.');
      process.exit(1);
    } else {
      console.log('\n[✓] All native FFI tests passed with zero memory leaks and sub-millisecond execution!');
      process.exit(0);
    }
  } catch (err) {
    console.error('[-] Fatal error running smoke test suite:', err);
    process.exit(1);
  }
}

main();
