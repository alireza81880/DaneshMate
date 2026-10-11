/**
 * DaneshMate - Pure Timeline & Session Timestamp Resolution Utilities
 * 
 * Functional, pure timestamp extraction and normalization logic
 * for chat messages and attached files in academic session logs.
 * Independent of React UI state and storage.
 */

import type { AttachedFile } from '../types/sessionLog';

/**
 * Safe timestamp resolution for chat messages with legacy fallback.
 * 
 * Resolution order:
 * 1. msg.timestamp if it is a valid positive number
 * 2. msg.id parsed as a numeric millisecond timestamp (> 1600000000000)
 * 3. sessionTimestamp if provided and > 0
 * 4. Fallback: 0
 */
export function getMessageTimestamp(
  msg: { id: string; timestamp?: number; time?: string },
  sessionTimestamp?: number
): number {
  if (typeof msg.timestamp === 'number' && !isNaN(msg.timestamp) && msg.timestamp > 0) {
    return msg.timestamp;
  }
  const parsed = parseInt(msg.id, 10);
  if (!isNaN(parsed) && parsed > 1600000000000) {
    return parsed;
  }
  if (sessionTimestamp && sessionTimestamp > 0) {
    return sessionTimestamp;
  }
  return 0;
}

/**
 * Safe timestamp resolution for attached files with legacy fallback.
 * 
 * Resolution order:
 * 1. file.addedAt if it is a valid positive number
 * 2. file.addedAtTimestamp if it is a valid positive number
 * 3. file.id with prefix 'att_' (e.g. 'att_1760000000000_abc') parsed timestamp
 * 4. file.id parsed directly as a numeric timestamp (> 1600000000000)
 * 5. sessionTimestamp if provided and > 0
 * 6. Fallback: 0
 */
export function getFileTimestamp(
  file: AttachedFile,
  sessionTimestamp?: number
): number {
  if (typeof file.addedAt === 'number' && !isNaN(file.addedAt) && file.addedAt > 0) {
    return file.addedAt;
  }
  if (typeof file.addedAtTimestamp === 'number' && !isNaN(file.addedAtTimestamp) && file.addedAtTimestamp > 0) {
    return file.addedAtTimestamp;
  }
  if (file.id && file.id.startsWith('att_')) {
    const parts = file.id.split('_');
    if (parts.length >= 2) {
      const parsed = parseInt(parts[1], 10);
      if (!isNaN(parsed) && parsed > 1600000000000) {
        return parsed;
      }
    }
  }
  const parsed = parseInt(file.id, 10);
  if (!isNaN(parsed) && parsed > 1600000000000) {
    return parsed;
  }
  if (sessionTimestamp && sessionTimestamp > 0) {
    return sessionTimestamp;
  }
  return 0;
}
