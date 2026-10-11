import React, { useRef } from 'react';
import {
  Trash2,
  Mic,
  Play,
  Pause,
  FileText,
  Bell,
  Plus,
  Paperclip,
  ExternalLink,
  Send,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import type { PaletteTheme } from '../../App';
import type { AttachedFile, ClassSessionLog, FileCategory } from '../../types/sessionLog';
import {
  formatJalaliDate,
  parseJalaliDateTimeToTimestamp,
  formatPersianTime,
} from '../../utils/jalaliDate';
import { getMessageTimestamp, getFileTimestamp } from '../../utils/timeline';

export interface SessionTimelineModalProps {
  sessionLog: ClassSessionLog | null;
  theme: PaletteTheme;
  fileToast: string | null;
  chatAudioPlaying: boolean;
  chatAudioSeconds: number;
  chatAudioSpeed: 1 | 1.5 | 2;
  chatInputText: string;
  onClose: () => void;
  onDeleteSession: (log: ClassSessionLog) => void;
  onToggleAudioPlayback: () => void;
  onAudioSpeedChange: () => void;
  onDeleteAudio: () => void;
  onOpenEditReminder: () => void;
  onToggleReminder: () => void;
  onOpenSetReminder: () => void;
  onOpenFile: (file: AttachedFile) => void;
  onDeleteFile: (fileId: string) => void;
  onNativePickFile: () => void;
  onUploadSystemFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendFollowUp: (e: React.FormEvent) => void;
  onChangeInputText: (text: string) => void;
}

function formatTimer(sec: number | null | undefined): string {
  if (!sec || isNaN(sec)) return '۰۰:۰۰';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const toFa = (n: number) => n.toString().padStart(2, '0').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
  return `${toFa(m)}:${toFa(s)}`;
}

function truncateFileNameMiddle(name: string, maxLen = 22): string {
  if (!name || name.length <= maxLen) return name;
  const lastDot = name.lastIndexOf('.');
  const ext = lastDot !== -1 ? name.slice(lastDot) : '';
  const base = lastDot !== -1 ? name.slice(0, lastDot) : name;
  if (base.length <= 12) return name;
  const start = base.slice(0, 8);
  const end = base.slice(-4);
  return `${start}...${end}${ext}`;
}

function formatPersianReminderText(trigger?: string, customText?: string): string {
  const raw = (trigger || customText || '').trim().toLowerCase();
  if (!raw) return '۲۴ ساعت قبل از کلاس';

  const numMatch = raw.match(/(\d+)/);
  if (numMatch) {
    const num = numMatch[1];
    if (raw.includes('day') || raw.includes('روز')) {
      return `${num} روز قبل از کلاس`;
    }
    if (raw.includes('minute') || raw.includes('دقیقه')) {
      return `${num} دقیقه قبل از کلاس`;
    }
    return `${num} ساعت قبل از کلاس`;
  }

  if (raw.includes('same_day') || raw.includes('همان روز')) {
    return 'صبح همان روز کلاس';
  }
  if (raw.includes('night_before') || raw.includes('شب قبل')) {
    return 'شب قبل از کلاس';
  }
  return trigger || customText || '۲۴ ساعت قبل از کلاس';
}

function renderFileTypeTag(type: FileCategory, isDark: boolean) {
  const badges: Record<FileCategory, { tag: string; bg: string; color: string; lightColor: string }> = {
    pdf: { tag: 'PDF', bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', lightColor: '#DC2626' },
    powerpoint: { tag: 'PPTX', bg: 'rgba(249, 115, 22, 0.15)', color: '#F97316', lightColor: '#C2410C' },
    word: { tag: 'DOCX', bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', lightColor: '#1D4ED8' },
    image: { tag: 'IMG', bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', lightColor: '#047857' },
    audio: { tag: 'AUDIO', bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', lightColor: '#6D28D9' },
    other: { tag: 'FILE', bg: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8', lightColor: '#475569' },
  };
  const b = badges[type] || badges.other;
  return (
    <span
      style={{ backgroundColor: b.bg, color: isDark ? b.color : b.lightColor }}
      className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
    >
      {b.tag}
    </span>
  );
}

export const SessionTimelineModal: React.FC<SessionTimelineModalProps> = React.memo(({
  sessionLog,
  theme,
  fileToast,
  chatAudioPlaying,
  chatAudioSeconds,
  chatAudioSpeed,
  chatInputText,
  onClose,
  onDeleteSession,
  onToggleAudioPlayback,
  onAudioSpeedChange,
  onDeleteAudio,
  onOpenEditReminder,
  onToggleReminder,
  onOpenSetReminder,
  onOpenFile,
  onDeleteFile,
  onNativePickFile,
  onUploadSystemFiles,
  onSendFollowUp,
  onChangeInputText,
}) => {
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  if (!sessionLog) return null;

  const parsedId = parseInt(sessionLog.id, 10);
  const parsedCreated = parseJalaliDateTimeToTimestamp(sessionLog.createdAt);
  const sessionTimestamp = (parsedId > 1600000000000 ? parsedId : 0) || parsedCreated;
  const sessionCreationDateStr = sessionTimestamp > 0
    ? formatJalaliDate(sessionTimestamp)
    : (sessionLog.createdAt.includes('/') ? sessionLog.createdAt.split('-')[0].trim() : (sessionLog.createdAt ? sessionLog.createdAt.split('-')[0].trim() : 'جلسه گذشته'));
  const sessionTimeDisplay = sessionLog.createdAt.split('-').pop()?.trim() || sessionLog.createdAt;

  const chatDocFiles = (sessionLog.attachedFiles || []).filter((f) => {
    if (sessionLog.voiceMemoUri && (f.uri === sessionLog.voiceMemoUri || f.url === sessionLog.voiceMemoUri)) return false;
    if ((sessionLog.voiceMemoUri || sessionLog.voiceMemoSeconds) && f.type === 'audio') return false;
    return true;
  });

  type TimelineEvent =
    | { type: 'message'; id: string; timestamp: number; message: { id: string; text: string; time: string; timestamp?: number } }
    | { type: 'file'; id: string; timestamp: number; file: AttachedFile };

  const activeChatMessages = sessionLog.chatMessages || [];

  const timelineEvents: TimelineEvent[] = [
    ...chatDocFiles.map((f, idx) => ({
      type: 'file' as const,
      id: f.id,
      timestamp: getFileTimestamp(f, sessionTimestamp) || (sessionTimestamp ? sessionTimestamp + idx : idx),
      file: f,
    })),
    ...activeChatMessages.map((m, idx) => ({
      type: 'message' as const,
      id: m.id,
      timestamp: getMessageTimestamp(m, sessionTimestamp) || (sessionTimestamp ? sessionTimestamp + chatDocFiles.length + idx : chatDocFiles.length + idx),
      message: m,
    })),
  ];

  timelineEvents.sort((a, b) => a.timestamp - b.timestamp);

  let lastDatePill = sessionCreationDateStr;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderLuminous,
        }}
        className="liquid-glass rounded-3xl max-w-xl w-full h-[92vh] max-h-[850px] border shadow-2xl flex flex-col overflow-hidden transition-all"
      >
        {/* Top Navigation Header (Distinct Two-Row Layout) */}
        <div
          style={{
            backgroundColor: theme.innerBg,
            borderBottomColor: theme.borderLuminous,
          }}
          className="p-3.5 border-b space-y-2.5 flex-shrink-0"
        >
          {/* Row 1: Top Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              style={{ color: theme.primary, borderColor: theme.borderLuminous }}
              className="flex items-center gap-1 text-xs font-black cursor-pointer hover:opacity-80 py-1.5 px-3 rounded-xl border bg-black/10"
            >
              <span className="text-base font-bold">›</span>
              <span>بازگشت</span>
            </button>

            <button
              onClick={() => onDeleteSession(sessionLog)}
              className="flex items-center gap-1.5 text-rose-400 hover:text-rose-500 text-xs font-bold cursor-pointer py-1.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف جلسه</span>
            </button>
          </div>

          {/* Row 2: Class Title & Numeric Jalali Timestamp Banner */}
          <div
            style={{ backgroundColor: theme.cardBg, borderColor: theme.borderLuminous }}
            className="p-2.5 rounded-xl border text-center"
          >
            <h3 style={{ color: theme.textPrimary }} className="text-sm font-black flex items-center justify-center gap-1.5">
              <span>🎓</span>
              <span>{sessionLog.className}</span>
            </h3>
            <span style={{ color: theme.textMuted }} className="text-[11px] font-mono block mt-0.5">
              تایم‌لاین تعاملی جلسه • {sessionCreationDateStr} • ساعت {sessionTimeDisplay}
            </span>
          </div>
        </div>

        {/* Toast for file opening intent */}
        {fileToast && (
          <div
            style={{ backgroundColor: theme.primary }}
            className="py-1.5 px-4 text-center text-xs font-bold text-white shadow-sm transition-all"
          >
            {fileToast}
          </div>
        )}

        {/* Chat Timeline Stream */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-4 space-y-3 sm:space-y-4">
          {/* Date Separator Pill */}
          <div className="flex justify-center">
            <span
              style={{
                backgroundColor: theme.innerBg,
                borderColor: theme.borderLuminous,
                color: theme.textSecondary,
              }}
              className="px-3 py-1 rounded-full text-[11px] font-bold border font-mono"
            >
              {sessionCreationDateStr}
            </span>
          </div>

          {/* 1. Concise System Welcome Badge */}
          <div className="flex justify-center">
            <div
              style={{
                backgroundColor: theme.innerBg,
                borderColor: theme.borderLuminous,
                color: theme.textSecondary,
              }}
              className="px-4 py-2 rounded-2xl border text-xs font-bold text-center max-w-md shadow-xs"
            >
              ✦ جلسه «{sessionLog.className}»
            </div>
          </div>

          {/* 2. Interactive Voice Memo Chat Bubble */}
          {sessionLog.voiceMemoSeconds && (
            <div className="flex items-start gap-2 sm:gap-2.5 w-full min-w-0 max-w-full">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400 border border-purple-500/30 flex-shrink-0 mt-1">
                <Mic className="w-4 h-4" />
              </div>

              <div
                style={{
                  backgroundColor: theme.innerBg,
                  borderColor: theme.borderLuminous,
                }}
                className="flex-1 min-w-0 max-w-full rounded-2xl p-2.5 sm:p-3.5 border shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 gap-2 min-w-0">
                  <span className="text-xs font-black text-purple-400 truncate min-w-0">
                    صوت ضبط شده جلسه
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{ color: theme.textMuted }} className="text-[10px] font-mono whitespace-nowrap">
                      {sessionCreationDateStr}
                    </span>
                    <button
                      type="button"
                      onClick={onDeleteAudio}
                      className="p-1 rounded-lg hover:bg-rose-500/15 text-rose-400 cursor-pointer transition-colors"
                      title="حذف صوت ضبط شده"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.borderLuminous }}
                  className="rounded-xl p-3 border space-y-2.5 w-full min-w-0"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onToggleAudioPlayback}
                      style={{ backgroundColor: theme.primary }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 cursor-pointer shadow-md hover:opacity-90 active:scale-95"
                    >
                      {chatAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-[-1px]" />}
                    </button>

                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between h-4 px-1 gap-1">
                        {[35, 75, 25, 95, 60, 100, 45, 80, 50, 70, 90, 40, 85].map((h, i) => (
                          <span
                            key={i}
                            style={{
                              height: chatAudioPlaying ? `${h}%` : '20%',
                              backgroundColor: chatAudioPlaying ? theme.primary : theme.textMuted,
                              width: '3px',
                            }}
                            className="rounded-full transition-all duration-300"
                          />
                        ))}
                      </div>

                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (chatAudioSeconds / (sessionLog.voiceMemoSeconds || 60)) * 100
                              )
                            )}%`,
                            backgroundColor: theme.primary,
                          }}
                          className="h-full rounded-full transition-all duration-200"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span style={{ color: theme.textMuted }}>
                          {formatTimer(chatAudioSeconds)} / {formatTimer(sessionLog.voiceMemoSeconds)}
                        </span>
                        <span style={{ color: chatAudioPlaying ? theme.primary : theme.textMuted }} className="font-bold">
                          {chatAudioPlaying ? 'درحال پخش...' : 'متوقف'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onAudioSpeedChange}
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.borderLuminous,
                        color: theme.primary,
                      }}
                      className="px-2 py-1 rounded-lg border text-[10px] font-black cursor-pointer hover:border-white/20 flex-shrink-0"
                    >
                      {chatAudioSpeed}x
                    </button>
                  </div>
                </div>

                <div className="flex justify-start pt-1.5 mt-1 border-t border-white/5">
                  <span style={{ color: theme.textMuted }} className="text-[10px] font-mono">
                    {sessionTimeDisplay}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Lecture Notes Message Bubble */}
          {sessionLog.notesText && (
            <div className="flex items-start gap-2 sm:gap-2.5 w-full min-w-0 max-w-full">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0 mt-1">
                <FileText className="w-4 h-4" />
              </div>

              <div
                style={{
                  backgroundColor: theme.innerBg,
                  borderColor: theme.borderLuminous,
                }}
                className="flex-1 min-w-0 max-w-full rounded-2xl p-2.5 sm:p-3.5 border shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 gap-2 min-w-0">
                  <span className="text-xs font-black text-emerald-400 truncate min-w-0">
                    نکات و خلاصه تدریس استاد
                  </span>
                  <span style={{ color: theme.textMuted }} className="text-[10px] font-mono whitespace-nowrap flex-shrink-0">
                    {sessionCreationDateStr}
                  </span>
                </div>

                <p style={{ color: theme.textPrimary }} className="text-xs leading-relaxed break-words py-1">
                  {sessionLog.notesText}
                </p>

                <div className="flex justify-start pt-1.5 mt-1 border-t border-white/5">
                  <span style={{ color: theme.textMuted }} className="text-[10px] font-mono">
                    {sessionTimeDisplay}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Interactive Session Reminder Controller in Timeline */}
          <div className="w-full min-w-0 max-w-full">
            {sessionLog.hasReminder ? (
              <div className="flex items-start gap-2 sm:gap-2.5 w-full min-w-0 max-w-full">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0 mt-1">
                  <Bell className="w-4 h-4" />
                </div>

                <div
                  style={{
                    backgroundColor: theme.innerBg,
                    borderColor: 'rgba(244, 63, 94, 0.3)',
                  }}
                  className="flex-1 min-w-0 max-w-full rounded-2xl p-2.5 sm:p-3.5 border shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 gap-2 min-w-0">
                    <span className="text-xs font-black text-rose-400 flex items-center gap-1.5 truncate min-w-0">
                      <span>یادآور این جلسه</span>
                    </span>
                    <span style={{ color: theme.textMuted }} className="text-[10px] font-mono whitespace-nowrap flex-shrink-0">
                      {sessionLog.reminderTimestamp ? formatJalaliDate(sessionLog.reminderTimestamp) : sessionCreationDateStr}
                    </span>
                  </div>

                  <div className="text-right py-1 space-y-0.5 min-w-0">
                    <span style={{ color: theme.textMuted }} className="text-[10px] font-bold block">
                      یادآوری:
                    </span>
                    <div className="text-xs font-black text-sky-400 break-words">
                      {sessionLog.reminderTimeText || formatPersianReminderText(sessionLog.reminderTrigger, sessionLog.reminderTimeText)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 mt-2 border-t border-white/5 w-full min-w-0">
                    <button
                      type="button"
                      onClick={onOpenEditReminder}
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.borderLuminous,
                        color: theme.textPrimary,
                      }}
                      className="flex-1 min-w-0 py-2 px-2.5 rounded-xl text-xs font-bold border hover:border-white/30 cursor-pointer transition-colors text-center"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      type="button"
                      onClick={onToggleReminder}
                      className="flex-1 min-w-0 py-2 px-2.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer transition-colors text-center"
                    >
                      🔕 لغو یادآور
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: theme.innerBg,
                  borderColor: theme.borderLuminous,
                }}
                className="rounded-2xl p-3 border flex items-center justify-between gap-2 w-full min-w-0 max-w-full"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-500/20 text-slate-400 flex-shrink-0">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <span style={{ color: theme.textSecondary }} className="text-xs font-semibold truncate">
                    برای این جلسه یادآور تنظیم نشده است
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenSetReminder}
                  style={{ backgroundColor: theme.primary }}
                  className="py-1.5 px-3 rounded-xl text-xs font-black text-white cursor-pointer hover:opacity-90 transition-all flex items-center gap-1 shadow-sm flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تنظیم یادآور</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. Chronological Unified Events Stream (Interleaved Messages & Attached Files) */}
          {timelineEvents.map((ev) => {
            const evDateStr = formatJalaliDate(ev.timestamp) || sessionCreationDateStr;
            const showDayPill = evDateStr !== lastDatePill;
            if (showDayPill) {
              lastDatePill = evDateStr;
            }

            return (
              <React.Fragment key={ev.id}>
                {showDayPill && (
                  <div className="flex justify-center my-1.5">
                    <span
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.borderLuminous,
                        color: theme.textSecondary,
                      }}
                      className="px-3 py-0.5 rounded-full text-[10px] font-bold border font-mono opacity-90 shadow-xs"
                    >
                      {evDateStr}
                    </span>
                  </div>
                )}

                {ev.type === 'message' ? (
                  <div className="flex justify-end">
                    <div
                      style={{ backgroundColor: theme.primary }}
                      className="rounded-2xl rounded-br-sm p-3 text-white max-w-[85%] shadow-md space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1">
                        <span className="text-[10px] font-bold text-white/80">شما</span>
                        <span className="text-[9px] text-white/70 font-mono">
                          {evDateStr}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed break-words">{ev.message.text}</p>
                      <div className="flex justify-start pt-0.5">
                        <span className="text-[9px] text-white/70 font-mono">
                          {formatPersianTime(ev.timestamp) || ev.message.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 sm:gap-2.5 w-full min-w-0 max-w-full">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0 mt-1">
                      <Paperclip className="w-4 h-4" />
                    </div>

                    <div
                      style={{
                        backgroundColor: theme.innerBg,
                        borderColor: theme.borderLuminous,
                      }}
                      className="flex-1 min-w-0 max-w-full rounded-2xl p-2.5 sm:p-3 border shadow-sm overflow-hidden"
                    >
                      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/5 gap-2 min-w-0">
                        <span className="text-xs font-black text-blue-400 truncate min-w-0 flex items-center gap-1">
                          <span>فایل پیوست</span>
                        </span>
                        <span style={{ color: theme.textMuted }} className="text-[10px] font-mono whitespace-nowrap flex-shrink-0">
                          {evDateStr}
                        </span>
                      </div>

                      <div
                        style={{
                          backgroundColor: theme.cardBg,
                          borderColor: theme.borderLuminous,
                        }}
                        className="p-2 sm:p-2.5 rounded-xl border flex items-center justify-between gap-1.5 sm:gap-2 transition-all group w-full min-w-0 max-w-full box-border"
                      >
                        <div
                          onClick={() => onOpenFile(ev.file)}
                          className="flex items-center gap-1.5 sm:gap-2 overflow-hidden cursor-pointer flex-1 min-w-0"
                          title={ev.file.name}
                        >
                          <div className="shrink-0">{renderFileTypeTag(ev.file.type, theme.isDark)}</div>
                          <span
                            style={{ color: theme.textPrimary }}
                            className="text-xs font-bold truncate group-hover:text-blue-400 transition-colors min-w-0 flex-1"
                          >
                            {truncateFileNameMiddle(ev.file.name, 16)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                          <span style={{ color: theme.textMuted }} className="text-[10px] whitespace-nowrap hidden sm:inline">
                            {ev.file.sizeText}
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenFile(ev.file)}
                            className="p-2 sm:p-1.5 hover:bg-blue-500/15 rounded-xl text-blue-400 cursor-pointer shrink-0 transition-all active:scale-95 flex items-center justify-center"
                            title="باز کردن فایل"
                            aria-label="باز کردن فایل"
                          >
                            <ExternalLink className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFile(ev.file.id);
                            }}
                            className="p-2 sm:p-1.5 bg-rose-500/15 hover:bg-rose-500/25 rounded-xl text-rose-400 cursor-pointer transition-all active:scale-95 shrink-0 flex items-center justify-center border border-rose-500/20"
                            title="حذف فایل پیوست"
                            aria-label="حذف فایل پیوست"
                          >
                            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-start pt-1.5 mt-1 border-t border-white/5">
                        <span style={{ color: theme.textMuted }} className="text-[10px] font-mono">
                          {formatPersianTime(ev.timestamp) || sessionTimeDisplay}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Hidden Native Operating System File Picker */}
        <input
          type="file"
          ref={chatFileInputRef}
          onChange={onUploadSystemFiles}
          multiple
          className="hidden"
          accept="*/*"
        />

        {/* Bottom Interactive Message Bar (With Real System File Picker) */}
        <form
          onSubmit={onSendFollowUp}
          style={{
            backgroundColor: theme.innerBg,
            borderTopColor: theme.borderLuminous,
          }}
          className="p-3 border-t flex items-center gap-2 flex-shrink-0"
        >
          <button
            type="button"
            onClick={() => {
              if (Capacitor.isNativePlatform()) {
                onNativePickFile();
              } else {
                chatFileInputRef.current?.click();
              }
            }}
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderLuminous,
              color: theme.primary,
            }}
            className="w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer hover:opacity-80 shadow-sm flex-shrink-0"
            title="انتخاب و پیوست فایل واقعی از حافظه دستگاه"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!chatInputText.trim()}
            style={{ backgroundColor: chatInputText.trim() ? theme.primary : 'transparent' }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity flex-shrink-0 ${
              chatInputText.trim() ? 'cursor-pointer hover:opacity-90 shadow-sm' : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4 translate-x-[-1px]" />
          </button>

          <input
            type="text"
            value={chatInputText}
            onChange={(e) => onChangeInputText(e.target.value)}
            placeholder="افزودن یادداشت تکمیلی یا نکته جدید به جلسه..."
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderLuminous,
              color: theme.textPrimary,
            }}
            className="flex-1 py-2 px-3.5 rounded-xl border text-xs focus:outline-none text-right min-w-0"
          />
        </form>
      </div>
    </div>
  );
});
