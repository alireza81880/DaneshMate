/**
 * Direct Unit Test Suite for Timeline Timestamp Utilities
 * 
 * Verifies getMessageTimestamp and getFileTimestamp directly from src/utils/timeline.ts
 * Covers:
 * 1. Timestamp resolution priority (direct timestamp > id > sessionTimestamp > 0)
 * 2. Prefix format 'att_<timestamp>_<uuid>' parsing
 * 3. Numeric string ID fallback
 * 4. Fallback to session timestamp
 * 5. Corrupted, missing, and non-numeric fields fallback to 0 safely without throw
 */

import { getMessageTimestamp, getFileTimestamp } from '../src/utils/timeline';
import type { AttachedFile } from '../src/types/sessionLog';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName} - ${detail || 'Assertion failed'}`);
    failed++;
  }
}

console.log('====================================================');
console.log('  DaneshMate Timeline Utilities Unit Test Suite     ');
console.log('====================================================\n');

const BASE_SESSION = 1760000000000;

// Test 1: getMessageTimestamp with explicit timestamp
assert(
  getMessageTimestamp({ id: 'msg-1', timestamp: 1761000000000 }, BASE_SESSION) === 1761000000000,
  'getMessageTimestamp: prefers explicit positive timestamp over ID and session timestamp'
);

// Test 2: getMessageTimestamp with numeric ID (> 1600000000000)
assert(
  getMessageTimestamp({ id: '1762000000000' }, BASE_SESSION) === 1762000000000,
  'getMessageTimestamp: parses valid epoch ID when timestamp is absent'
);

// Test 3: getMessageTimestamp fallback to sessionTimestamp
assert(
  getMessageTimestamp({ id: 'custom-uuid-123' }, BASE_SESSION) === BASE_SESSION,
  'getMessageTimestamp: falls back to sessionTimestamp when ID is non-numeric and timestamp is undefined'
);

// Test 4: getMessageTimestamp returns 0 when no timestamps available
assert(
  getMessageTimestamp({ id: 'custom-uuid-123' }, undefined) === 0,
  'getMessageTimestamp: returns 0 when neither timestamp nor sessionTimestamp exist'
);

// Test 5: getMessageTimestamp handles NaN and negative timestamp gracefully
assert(
  getMessageTimestamp({ id: 'custom-uuid-123', timestamp: -5 }, BASE_SESSION) === BASE_SESSION,
  'getMessageTimestamp: ignores negative timestamp and falls back to sessionTimestamp'
);

// Test 6: getFileTimestamp with addedAt
const fileWithAddedAt: AttachedFile = {
  id: 'file-1',
  name: 'document.pdf',
  type: 'pdf',
  sizeText: '1 MB',
  addedAt: 1763000000000,
};
assert(
  getFileTimestamp(fileWithAddedAt, BASE_SESSION) === 1763000000000,
  'getFileTimestamp: prefers addedAt when present'
);

// Test 7: getFileTimestamp with addedAtTimestamp fallback
const fileWithAddedAtTimestamp: AttachedFile = {
  id: 'file-2',
  name: 'slide.pptx',
  type: 'powerpoint',
  sizeText: '2 MB',
  addedAtTimestamp: 1764000000000,
};
assert(
  getFileTimestamp(fileWithAddedAtTimestamp, BASE_SESSION) === 1764000000000,
  'getFileTimestamp: resolves addedAtTimestamp if addedAt is absent'
);

// Test 8: getFileTimestamp with 'att_<timestamp>_<id>' pattern
const fileWithPrefixId: AttachedFile = {
  id: 'att_1765000000000_photo_note',
  name: 'photo.jpg',
  type: 'image',
  sizeText: '500 KB',
};
assert(
  getFileTimestamp(fileWithPrefixId, BASE_SESSION) === 1765000000000,
  'getFileTimestamp: extracts timestamp from att_<timestamp>_* pattern correctly'
);

// Test 9: getFileTimestamp with plain numeric ID
const fileWithNumericId: AttachedFile = {
  id: '1766000000000',
  name: 'audio.m4a',
  type: 'audio',
  sizeText: '3 MB',
};
assert(
  getFileTimestamp(fileWithNumericId, BASE_SESSION) === 1766000000000,
  'getFileTimestamp: parses plain numeric ID when no addedAt exists'
);

// Test 10: getFileTimestamp fallback to sessionTimestamp
const fileLegacy: AttachedFile = {
  id: 'legacy_random_id',
  name: 'notes.txt',
  type: 'other',
  sizeText: '10 KB',
};
assert(
  getFileTimestamp(fileLegacy, BASE_SESSION) === BASE_SESSION,
  'getFileTimestamp: falls back to sessionTimestamp when no valid file timestamp is found'
);

// Test 11: getFileTimestamp returns 0 when no timestamps available
assert(
  getFileTimestamp(fileLegacy, undefined) === 0,
  'getFileTimestamp: returns 0 when no timestamp information is present'
);

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All timeline utility tests completed successfully!\n');
}
