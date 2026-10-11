/**
 * DaneshMate - Session Log & Timeline Data Types
 * 
 * Domain model types for academic session logs, attached files,
 * and session-associated artifacts.
 */

export type FileCategory = 'image' | 'audio' | 'pdf' | 'powerpoint' | 'word' | 'other';

export interface AttachedFile {
  id: string;
  name: string;
  type: FileCategory;
  sizeText: string;
  uri?: string;
  url?: string;
  addedAt?: number;
  addedAtTimestamp?: number;
}

export interface ClassSessionLog {
  id: string;
  classId: string;
  className: string;
  classCode?: string;
  createdAt: string;
  notesText: string;
  attachedFiles?: AttachedFile[];
  voiceMemoSeconds?: number;
  voiceMemoUri?: string;
  hasReminder: boolean;
  reminderTimestamp?: number;
  reminderTrigger?: string;
  reminderTimeText?: string;
  snoozedUntil?: string;
  notificationId?: number;
  chatMessages?: Array<{ id: string; text: string; time: string; timestamp?: number }>;
  acknowledgedAt?: number;
}
