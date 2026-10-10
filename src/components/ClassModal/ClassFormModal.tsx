import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  Edit2,
  Calendar,
  Bell,
  Check,
} from 'lucide-react';
import { SpringTimePicker } from '../SpringTimePicker';
import { generateBiWeeklyOccurrences } from '../../services/notificationService';
import {
  ClassItem,
  WeekDay,
  RecurrenceType,
  PaletteTheme,
  WEEK_DAYS,
  COMMON_SLOTS,
  PERSIAN_MONTHS,
  toPersianDigits,
  detectClassConflict,
  gregorianToJalali,
  jalaliToGregorian,
  getDaysInJalaliMonth,
  jalaliToTimestamp,
} from '../../App';

export interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClass: ClassItem | null;
  classes: ClassItem[];
  theme: PaletteTheme;
  onSave: (savedClass: ClassItem, isNew: boolean) => void;
}

export const ClassFormModal: React.FC<ClassFormModalProps> = React.memo(({
  isOpen,
  onClose,
  editingClass,
  classes,
  theme,
  onSave,
}) => {
  // Local Form Input States - Completely isolated from App.tsx root
  const [formName, setFormName] = useState('');
  const [formHasReminder, setFormHasReminder] = useState(false);
  const [formReminderMode, setFormReminderMode] = useState<'before_class' | 'exact_time'>('exact_time');
  const [formReminderBefore, setFormReminderBefore] = useState<number>(30);
  const [formReminderDay, setFormReminderDay] = useState<WeekDay>('شنبه');
  const [formReminderExactTime, setFormReminderExactTime] = useState<string>('08:40');
  const [isReminderTimePickerOpen, setIsReminderTimePickerOpen] = useState(false);
  const [reminderPickerHour, setReminderPickerHour] = useState(8);
  const [reminderPickerMin, setReminderPickerMin] = useState(40);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [formDay, setFormDay] = useState<WeekDay>('شنبه');
  const [formTime, setFormTime] = useState(COMMON_SLOTS[0]);
  const [formCustomTime, setFormCustomTime] = useState('');
  const [formRecurrence, setFormRecurrence] = useState<RecurrenceType>('every_week');
  const [formAnchorDate, setFormAnchorDate] = useState<string>('');
  const [formAnchorTimestamp, setFormAnchorTimestamp] = useState<number | undefined>(undefined);
  const [formAnchorLabel, setFormAnchorLabel] = useState<string>('');
  const [formScheduledSessions, setFormScheduledSessions] = useState<number[]>([]);
  const [isJalaliSpringModalOpen, setIsJalaliSpringModalOpen] = useState<boolean>(false);
  const [calSelectedYear, setCalSelectedYear] = useState<number>(() => {
    const [jy] = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
    return jy;
  });
  const [calSelectedMonth, setCalSelectedMonth] = useState<number>(() => {
    const [, jm] = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
    return jm;
  });
  const [calSelectedDay, setCalSelectedDay] = useState<number>(() => {
    const [, , jd] = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
    return jd;
  });
  const [formProfessor, setFormProfessor] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [classErrors, setClassErrors] = useState<{ name?: string }>({});

  // Class Start & End Time Pickers (reusing shared SpringTimePicker)
  const [isClassStartTimePickerOpen, setIsClassStartTimePickerOpen] = useState(false);
  const [isClassEndTimePickerOpen, setIsClassEndTimePickerOpen] = useState(false);
  const [classPickerStartHour, setClassPickerStartHour] = useState(8);
  const [classPickerStartMin, setClassPickerStartMin] = useState(0);
  const [classPickerEndHour, setClassPickerEndHour] = useState(10);
  const [classPickerEndMin, setClassPickerEndMin] = useState(0);

  // Synchronize local form state whenever the modal opens or the target class changes
  useEffect(() => {
    if (isOpen) {
      if (editingClass) {
        setFormName(editingClass.name);
        setFormHasReminder(Boolean(editingClass.hasReminder));
        setFormReminderMode(editingClass.reminderMode || (editingClass.reminderExactTime ? 'exact_time' : 'before_class'));
        setFormReminderBefore(editingClass.reminderMinutesBefore ?? 30);
        setFormReminderDay(editingClass.reminderDay || editingClass.day || 'شنبه');
        setFormReminderExactTime(editingClass.reminderExactTime || '08:40');
        if (editingClass.reminderExactTime && editingClass.reminderExactTime.includes(':')) {
          const parts = editingClass.reminderExactTime.split(':').map((s) => parseInt(s.trim().replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10));
          if (!isNaN(parts[0])) setReminderPickerHour(parts[0]);
          if (!isNaN(parts[1])) setReminderPickerMin(parts[1]);
        } else {
          setReminderPickerHour(8);
          setReminderPickerMin(40);
        }
        setIsReminderTimePickerOpen(false);
        setConflictError(null);
        setFormDay(editingClass.day);
        setFormTime(editingClass.time);
        setFormCustomTime(!COMMON_SLOTS.includes(editingClass.time) ? editingClass.time : '');
        const rawRec = editingClass.recurrence;
        const normRec: RecurrenceType = (rawRec === 'even_weeks' || rawRec === 'odd_weeks' || rawRec === 'biweekly')
          ? 'bi_weekly'
          : (rawRec || 'every_week');
        setFormRecurrence(normRec);
        setFormAnchorDate(editingClass.anchor_date || '');
        setFormAnchorTimestamp(editingClass.anchor_timestamp);
        setFormAnchorLabel(editingClass.anchor_date ? `تاریخ اولین جلسه: ${editingClass.anchor_date}` : '');
        setFormScheduledSessions(editingClass.scheduled_session_timestamps || []);
        if (editingClass.anchor_timestamp) {
          const d = new Date(editingClass.anchor_timestamp);
          const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
          setCalSelectedYear(jy);
          setCalSelectedMonth(jm);
          setCalSelectedDay(jd);
        } else {
          const [jy, jm, jd] = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
          setCalSelectedYear(jy);
          setCalSelectedMonth(jm);
          setCalSelectedDay(jd);
        }
        setFormProfessor(editingClass.professor || '');
        setFormLocation(editingClass.location || '');
        setClassErrors({});
      } else {
        setFormName('');
        setFormHasReminder(false);
        setFormReminderMode('before_class');
        setFormReminderBefore(30);
        setFormReminderExactTime('08:40');
        setFormReminderDay('شنبه');
        setReminderPickerHour(8);
        setReminderPickerMin(40);
        setIsReminderTimePickerOpen(false);
        setConflictError(null);
        setFormDay('شنبه');
        setFormTime(COMMON_SLOTS[0]);
        setFormCustomTime('');
        setFormRecurrence('every_week');
        setFormAnchorDate('');
        setFormAnchorTimestamp(undefined);
        setFormAnchorLabel('');
        setFormScheduledSessions([]);
        const [jy, jm, jd] = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
        setCalSelectedYear(jy);
        setCalSelectedMonth(jm);
        setCalSelectedDay(jd);
        setFormProfessor('');
        setFormLocation('');
        setClassErrors({});
      }
    }
  }, [isOpen, editingClass]);

  const handleOpenClassStartTimePicker = (existingTime?: string) => {
    const target = existingTime || formCustomTime || (COMMON_SLOTS.includes(formTime) ? '' : formTime);
    if (target && target.includes('-')) {
      const parts = target.split('-').map((s) => s.trim());
      if (parts.length === 2) {
        const parseDigits = (str: string) => str.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
        const [sh, sm] = parts[0].split(':').map((n) => parseInt(parseDigits(n), 10));
        const [eh, em] = parts[1].split(':').map((n) => parseInt(parseDigits(n), 10));
        if (!isNaN(sh)) setClassPickerStartHour(sh);
        if (!isNaN(sm)) setClassPickerStartMin(sm);
        if (!isNaN(eh)) setClassPickerEndHour(eh);
        if (!isNaN(em)) setClassPickerEndMin(em);
      }
    } else {
      setClassPickerStartHour(8);
      setClassPickerStartMin(0);
      setClassPickerEndHour(10);
      setClassPickerEndMin(0);
    }
    setIsClassStartTimePickerOpen(true);
  };

  const handleConfirmClassStartTime = (h: number, m: number) => {
    setClassPickerStartHour(h);
    setClassPickerStartMin(m);
    // Auto calculate suggested end time: start + 1h 30m or start + 2h
    let newEndHour = h + 1;
    let newEndMin = m + 30;
    if (newEndMin >= 60) {
      newEndHour += 1;
      newEndMin -= 60;
    }
    if (newEndHour > 22) {
      newEndHour = 22;
      newEndMin = 0;
    }
    setClassPickerEndHour(newEndHour);
    setClassPickerEndMin(newEndMin);
    // Seamlessly transition to End Time Picker
    setIsClassStartTimePickerOpen(false);
    setTimeout(() => {
      setIsClassEndTimePickerOpen(true);
    }, 120);
  };

  const handleConfirmClassEndTime = (h: number, m: number) => {
    setClassPickerEndHour(h);
    setClassPickerEndMin(m);
    const startTotal = classPickerStartHour * 60 + classPickerStartMin;
    const endTotal = h * 60 + m;
    let finalEndHour = h;
    let finalEndMin = m;
    if (endTotal <= startTotal) {
      finalEndHour = (classPickerStartHour + 1) % 24;
      finalEndMin = classPickerStartMin;
    }
    const formattedStart = `${classPickerStartHour.toString().padStart(2, '0')}:${classPickerStartMin.toString().padStart(2, '0')}`;
    const formattedEndSafe = `${finalEndHour.toString().padStart(2, '0')}:${finalEndMin.toString().padStart(2, '0')}`;
    const finalFormatted = `${formattedStart} - ${formattedEndSafe}`;
    setFormCustomTime(finalFormatted);
    setFormTime(finalFormatted);
    setConflictError(null);
    setIsClassEndTimePickerOpen(false);
  };

  const handleClearCustomTime = () => {
    setFormCustomTime('');
    setFormTime(COMMON_SLOTS[0]);
    setConflictError(null);
  };

  const handleSelectAnchorDateWeb = (year: number, month: number, day: number) => {
    const formattedDate = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    const timestamp = jalaliToTimestamp(year, month, day);
    const monthName = PERSIAN_MONTHS[month - 1];
    const [gy, gm, gd] = jalaliToGregorian(year, month, day);
    const d = new Date(gy, gm - 1, gd);
    const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    const dayName = dayNames[d.getDay()] || '';
    const label = `${dayName} ${toPersianDigits(day)} ${monthName}`;

    // Generate exactly 8 bi-weekly sessions for 16 academic weeks (14-day intervals)
    const sessions = generateBiWeeklyOccurrences(timestamp);

    // Automatically align form day with selected first session
    const validWeekdays: WeekDay[] = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه'];
    if (validWeekdays.includes(dayName as WeekDay)) {
      setFormDay(dayName as WeekDay);
    }

    setFormAnchorDate(formattedDate);
    setFormAnchorTimestamp(timestamp);
    setFormAnchorLabel(label);
    setFormScheduledSessions(sessions);
    setConflictError(null);
    setIsJalaliSpringModalOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setClassErrors({ name: 'ورود نام کلاس الزامی است' });
      return;
    }

    // Requirements 12 & 13: Strict validation for bi-weekly classes
    if (formRecurrence !== 'every_week') {
      if (!formAnchorDate || !formAnchorTimestamp) {
        setConflictError('برای کلاس یک هفته در میان، تاریخ اولین جلسه را مشخص کنید.');
        return;
      }

      const anchorD = new Date(formAnchorTimestamp);
      const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
      const anchorDayName = dayNames[anchorD.getDay()];
      if (anchorDayName !== formDay) {
        setConflictError('روز کلاس باید با تاریخ اولین جلسه یکسان باشد.');
        return;
      }
    }

    const finalTime = formCustomTime.trim() ? formCustomTime.trim() : formTime;

    // Detect class time conflict and block saving with clear Persian error
    const editingId = editingClass ? editingClass.id : null;
    const conflict = detectClassConflict(formDay, finalTime, classes, editingId);
    if (conflict.hasConflict && conflict.conflictingClass) {
      const c = conflict.conflictingClass;
      setConflictError(
        `امکان ثبت کلاس وجود ندارد.\nاین جلسه با «${c.name}» در ${c.day}، ساعت ${toPersianDigits(c.time)} تداخل دارد.`
      );
      return;
    }

    const recType: 'even' | 'odd' | 'weekly' | 'bi_weekly' =
      formRecurrence === 'every_week' ? 'weekly' : 'bi_weekly';

    const recurrencePrefix = formRecurrence === 'every_week'
      ? `هر هفته (${formDay})`
      : `هر دو هفته یک‌بار (${formDay})`;

    const reminderTriggerText = formReminderMode === 'before_class'
      ? (formReminderBefore === 0
          ? `هم‌زمان با شروع کلاس • ${recurrencePrefix}`
          : `${toPersianDigits(formReminderBefore)} دقیقه قبل از شروع کلاس • ${recurrencePrefix}`)
      : `ساعت ${toPersianDigits(formReminderExactTime)} • ${recurrencePrefix}`;

    const isNew = !editingClass;
    const savedClass: ClassItem = {
      id: editingClass ? editingClass.id : Date.now().toString(),
      name: formName.trim(),
      day: formDay,
      time: finalTime,
      recurrence: formRecurrence,
      recurrence_type: recType,
      anchor_date: formAnchorDate || undefined,
      anchor_timestamp: formAnchorTimestamp,
      scheduled_session_timestamps:
        formScheduledSessions.length > 0 ? formScheduledSessions : undefined,
      professor: formProfessor.trim() || undefined,
      location: formLocation.trim() || undefined,
      hasReminder: formHasReminder,
      reminderMode: formReminderMode,
      reminderMinutesBefore: formHasReminder && formReminderMode === 'before_class' ? formReminderBefore : undefined,
      reminderDay: formHasReminder ? formDay : undefined,
      reminderExactTime: formHasReminder && formReminderMode === 'exact_time' ? formReminderExactTime : undefined,
      reminderTriggerText: formHasReminder ? reminderTriggerText : undefined,
    };

    onSave(savedClass, isNew);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* CLASS ADD/EDIT MODAL */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderLuminous,
          }}
          className="liquid-glass rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border shadow-2xl transition-all"
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <h3 style={{ color: theme.textPrimary }} className="text-base font-black">
              {editingClass ? 'ویرایش کلاس' : 'افزودن کلاس جدید'}
            </h3>
            <button
              onClick={onClose}
              style={{ color: theme.textSecondary }}
              className="p-1 rounded-lg hover:opacity-75 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {conflictError && (
            <div className="p-3.5 mb-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold text-right whitespace-pre-line flex items-start gap-2.5 leading-relaxed shadow-lg">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="flex-1">{conflictError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                نام درس <span className="text-rose-500">*</span>
              </label>
              <div
                style={{
                  backgroundColor: theme.innerBg,
                  borderColor: classErrors.name ? '#EF4444' : theme.borderLuminous,
                }}
                className="rounded-2xl p-3 border"
              >
                <input
                  type="text"
                  placeholder="مثال: ریاضی عمومی ۲"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (classErrors.name) setClassErrors({});
                  }}
                  style={{ color: theme.textPrimary }}
                  className="w-full bg-transparent text-sm font-semibold outline-none text-right placeholder-slate-500"
                  autoFocus
                />
              </div>
              {classErrors.name && (
                <span className="text-xs text-rose-500 font-semibold block mt-1 text-right">
                  {classErrors.name}
                </span>
              )}
            </div>

            <div>
              <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                روز برگزاری
              </label>
              <div className="grid grid-cols-3 gap-2">
                {WEEK_DAYS.map((d) => {
                  const isSel = formDay === d;
                  return (
                    <button
                      type="button"
                      key={d}
                      onClick={() => {
                        setFormDay(d);
                        setConflictError(null);
                        // Requirements 12 & 13: If bi-weekly and anchor date doesn't match new day, clear it so user selects a valid anchor
                        if (formRecurrence !== 'every_week' && formAnchorTimestamp) {
                          const anchorD = new Date(formAnchorTimestamp);
                          const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
                          if (dayNames[anchorD.getDay()] !== d) {
                            setFormAnchorDate('');
                            setFormAnchorTimestamp(undefined);
                            setFormAnchorLabel('');
                            setFormScheduledSessions([]);
                          }
                        }
                      }}
                      style={{
                        backgroundColor: isSel ? theme.primary : theme.innerBg,
                        borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                        color: isSel ? '#FFFFFF' : theme.textSecondary,
                      }}
                      className="py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center"
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ color: theme.textPrimary }} className="text-xs font-bold text-right">
                  بازه زمانی برگزاری (ساعت) <span className="text-rose-500">*</span>
                </label>
                <span style={{ color: theme.textMuted }} className="text-[10.5px]">
                  ۵ بازه استاندارد ۲ ساعته یا ساعت دلخواه
                </span>
              </div>

              {/* 5 Standard 2-Hour Presets with Neumorphic Tactile States */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2.5">
                {COMMON_SLOTS.map((slot) => {
                  const isSel = formTime === slot && !formCustomTime;
                  return (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => {
                        setFormTime(slot);
                        setFormCustomTime('');
                      }}
                      style={{
                        backgroundColor: isSel ? theme.primary : theme.innerBg,
                        borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                        color: isSel ? '#FFFFFF' : theme.textSecondary,
                        boxShadow: isSel
                          ? `inset 0 2px 4px rgba(0,0,0,0.25), 0 0 12px ${theme.glowColor}`
                          : '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                      className="py-2.5 px-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 active:scale-98 hover:opacity-90"
                    >
                      <span className="font-mono text-[11.5px] font-extrabold dir-ltr">
                        {toPersianDigits(slot)}
                      </span>
                      <span className="text-[9.5px] font-mono opacity-80 dir-ltr">{slot}</span>
                    </button>
                  );
                })}
              </div>

              {/* Automated Custom Time Selection (Zero Error, No Manual TextInput) */}
              {formCustomTime ? (
                <div
                  style={{
                    backgroundColor: theme.innerBg,
                    borderColor: theme.primary,
                    boxShadow: `0 0 12px ${theme.glowColor}`,
                  }}
                  className="rounded-2xl p-3 border flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      style={{ backgroundColor: theme.primary }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    >
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-right">
                      <div style={{ color: theme.textMuted }} className="text-[10.5px] font-bold">
                        ساعت انتخابی کاربر (تأییدشده):
                      </div>
                      <div style={{ color: theme.primaryLight }} className="text-xs font-extrabold font-mono dir-ltr">
                        {toPersianDigits(formCustomTime)} ({formCustomTime})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenClassStartTimePicker(formCustomTime)}
                      style={{
                        backgroundColor: theme.cardBg,
                        borderColor: theme.borderLuminous,
                        color: theme.textPrimary,
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold border hover:opacity-85 cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <Edit2 className="w-3 h-3 text-sky-400" />
                      <span>ویرایش</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCustomTime}
                      className="p-1.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      title="حذف و بازگشت به ساعات پیش‌فرض"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenClassStartTimePicker()}
                  style={{
                    backgroundColor: theme.innerBg,
                    borderColor: theme.borderLuminous,
                    color: theme.textPrimary,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                  className="w-full py-2.5 px-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 hover:border-blue-400/50 hover:bg-blue-500/5 transition-all cursor-pointer group active:scale-98"
                >
                  <Clock className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span>انتخاب ساعت دلخواه (تنظیم خودکار شروع و پایان بدون خطا)</span>
                </button>
              )}
            </div>

            <div>
              <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                چرخه برگزاری کلاس <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'every_week' as RecurrenceType, label: 'هر هفته', subtitle: 'برگزاری پیوسته در تمام هفته‌ها', icon: '🔁' },
                  { key: 'bi_weekly' as RecurrenceType, label: 'یک هفته در میان', subtitle: 'بر اساس تاریخ واقعی اولین جلسه', icon: '📅' },
                ].map((opt) => {
                  const isSel = formRecurrence === opt.key;
                  return (
                    <button
                      type="button"
                      key={opt.key}
                      onClick={() => {
                        setFormRecurrence(opt.key);
                        if (opt.key !== 'every_week') {
                          setIsJalaliSpringModalOpen(true);
                        } else {
                          setFormScheduledSessions([]);
                        }
                      }}
                      style={{
                        backgroundColor: isSel ? theme.primary : theme.innerBg,
                        borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                        color: isSel ? '#FFFFFF' : theme.textSecondary,
                        boxShadow: isSel ? `0 0 10px ${theme.glowColor}` : 'none',
                      }}
                      className="py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 active:scale-95"
                    >
                      <span className="text-base">{opt.icon}</span>
                      <span className="font-extrabold">{opt.label}</span>
                      <span className="text-[10px] opacity-80 font-normal">{opt.subtitle}</span>
                    </button>
                  );
                })}
              </div>

              {/* Neumorphic soft-inset chip under the recurrence selector */}
              {formRecurrence !== 'every_week' && formAnchorDate ? (
                <div
                  style={{
                    backgroundColor: theme.innerBg,
                    borderColor: theme.borderLuminous,
                    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)',
                  }}
                  className="mt-2.5 p-3 rounded-2xl border text-right transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                      <span style={{ color: theme.textPrimary }} className="text-xs font-bold">
                        تاریخ اولین جلسه: {formAnchorLabel || formAnchorDate}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsJalaliSpringModalOpen(true)}
                      style={{ backgroundColor: theme.primary }}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white shadow-sm hover:opacity-90 cursor-pointer"
                    >
                      تغییر تاریخ اولین جلسه
                    </button>
                  </div>
                  {formScheduledSessions.length > 0 && (
                    <div className="text-[10.5px] text-emerald-400 font-semibold mt-1.5 pt-1.5 border-t border-white/5">
                      ✓ پیش‌بینی ۸ جلسه تا پایان ۱۶ هفته (هر ۱۴ روز یک‌بار) با موفقیت تنظیم گردید.
                    </div>
                  )}
                </div>
              ) : formRecurrence !== 'every_week' ? (
                <button
                  type="button"
                  onClick={() => setIsJalaliSpringModalOpen(true)}
                  className="w-full mt-2.5 p-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-500/20 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>برای کلاس چرخشی، لطفاً تاریخ اولین جلسه را مشخص نمایید</span>
                </button>
              ) : null}
            </div>

            <div>
              <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                نام استاد (اختیاری)
              </label>
              <div
                style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                className="rounded-2xl p-3 border"
              >
                <input
                  type="text"
                  placeholder="نام استاد را وارد نمایید"
                  value={formProfessor}
                  onChange={(e) => setFormProfessor(e.target.value)}
                  style={{ color: theme.textPrimary }}
                  className="w-full bg-transparent text-sm font-semibold outline-none text-right placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label style={{ color: theme.textPrimary }} className="block text-xs font-bold mb-1.5 text-right">
                محل برگزاری (اختیاری)
              </label>
              <div
                style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                className="rounded-2xl p-3 border"
              >
                <input
                  type="text"
                  placeholder="شماره کلاس یا نام دانشکده"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  style={{ color: theme.textPrimary }}
                  className="w-full bg-transparent text-sm font-semibold outline-none text-right placeholder-slate-500"
                />
              </div>
            </div>

            {/* Smart Class Reminder Setup */}
            <div
              style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
              className="rounded-2xl p-3.5 border space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${formHasReminder ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <h4 style={{ color: theme.textPrimary }} className="text-xs font-bold">
                      یادآور هوشمند شروع کلاس
                    </h4>
                    <span style={{ color: theme.textSecondary }} className="text-[10px]">
                      ارسال اعلان صوتی قبل از آغاز کلاس در روز موعد
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormHasReminder(!formHasReminder)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    formHasReminder ? 'bg-rose-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      formHasReminder ? 'left-1' : 'right-1'
                    }`}
                  />
                </button>
              </div>

              {formHasReminder && (
                <div className="space-y-3 pt-2.5 border-t border-white/5">
                  {/* Reminder Mode Selector (Before class vs Exact Time) */}
                  <div className="flex items-center justify-between">
                    <label style={{ color: theme.textPrimary }} className="block text-[11px] font-bold text-right">
                      زمان ارسال اعلان در روز {formDay}:
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormReminderMode('before_class')}
                        style={{
                          backgroundColor: formReminderMode === 'before_class' ? theme.primary : theme.innerBg,
                          color: formReminderMode === 'before_class' ? '#FFFFFF' : theme.textSecondary,
                          borderColor: theme.borderLuminous,
                        }}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-all"
                      >
                        قبل از کلاس
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormReminderMode('exact_time');
                          setIsReminderTimePickerOpen(true);
                        }}
                        style={{
                          backgroundColor: formReminderMode === 'exact_time' ? theme.primary : theme.innerBg,
                          color: formReminderMode === 'exact_time' ? '#FFFFFF' : theme.textSecondary,
                          borderColor: theme.borderLuminous,
                        }}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-all"
                      >
                        ساعت دلخواه
                      </button>
                    </div>
                  </div>

                  {/* Option A: Fast Presets for Time Before Class */}
                  {formReminderMode === 'before_class' ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                        {[
                          { label: 'هم‌زمان با کلاس', minutes: 0 },
                          { label: '۱۵ دقیقه قبل', minutes: 15 },
                          { label: '۳۰ دقیقه قبل', minutes: 30 },
                          { label: '۱ ساعت قبل', minutes: 60 },
                          { label: '۲ ساعت قبل', minutes: 120 },
                        ].map((chip) => {
                          const isSel = formReminderBefore === chip.minutes;
                          return (
                            <button
                              key={chip.minutes}
                              type="button"
                              onClick={() => setFormReminderBefore(chip.minutes)}
                              style={{
                                backgroundColor: isSel ? theme.primary : theme.innerBg,
                                color: isSel ? '#FFFFFF' : theme.textPrimary,
                                borderColor: isSel ? theme.primaryLight : theme.borderLuminous,
                                boxShadow: isSel ? `0 0 10px ${theme.glowColor}` : 'none',
                              }}
                              className="py-2 px-1 rounded-xl border text-[10.5px] font-bold text-center transition-all cursor-pointer hover:opacity-90 active:scale-95"
                            >
                              {chip.label}
                            </button>
                          );
                        })}
                      </div>
                      <p style={{ color: theme.textMuted }} className="text-[10px] text-right font-medium">
                        💡 یادآور هر هفته در روز {formDay}، {formReminderBefore === 0 ? 'هم‌زمان با شروع کلاس' : `${toPersianDigits(formReminderBefore)} دقیقه قبل از کلاس`} ارسال خواهد شد.
                      </p>
                    </div>
                  ) : (
                    /* Option B: Exact Clock Time on the Day of Class */
                    <div className="space-y-2">
                      <div
                        onClick={() => setIsReminderTimePickerOpen(true)}
                        style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                        className="p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer hover:border-sky-400/50 transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
                            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                          >
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="text-right">
                            <span style={{ color: theme.textMuted }} className="text-[10px] block">
                              ارسال در روز {formDay} رأس ساعت:
                            </span>
                            <span
                              style={{
                                color: theme.primaryLight,
                                textShadow: `0 0 8px ${theme.glowColor}`,
                              }}
                              className="text-base font-black font-mono tracking-wider dir-ltr"
                            >
                              {toPersianDigits(formReminderExactTime)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsReminderTimePickerOpen(true);
                          }}
                          style={{
                            backgroundColor: theme.primary,
                            boxShadow: `0 0 10px ${theme.glowColor}`,
                          }}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 cursor-pointer active:scale-95 transition-all"
                        >
                          تغییر ساعت
                        </button>
                      </div>
                      <p style={{ color: theme.textMuted }} className="text-[10px] text-right font-medium">
                        💡 یادآور هر هفته در روز {formDay} رأس ساعت {toPersianDigits(formReminderExactTime)} فعال خواهد شد.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                className="flex-1 py-3 rounded-2xl font-bold text-xs border cursor-pointer text-slate-400"
              >
                انصراف
              </button>
              <button
                type="submit"
                style={{ backgroundColor: theme.primary }}
                className="flex-1 py-3 rounded-2xl font-black text-xs text-white shadow-lg cursor-pointer hover:opacity-95"
              >
                {editingClass ? 'ذخیره تغییرات' : 'ثبت کلاس'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* REUSABLE SPRING TIME PICKER MODAL FOR CLASS START TIME */}
      <SpringTimePicker
        isOpen={isClassStartTimePickerOpen}
        onClose={() => setIsClassStartTimePickerOpen(false)}
        initialHour={classPickerStartHour}
        initialMinute={classPickerStartMin}
        title="تنظیم ساعت شروع کلاس"
        subtitle="ساعت و دقیقه شروع این درس"
        confirmText="تأیید و انتخاب ساعت اتمام ➔"
        theme={theme}
        onConfirm={handleConfirmClassStartTime}
      />

      {/* REUSABLE SPRING TIME PICKER MODAL FOR CLASS END TIME */}
      <SpringTimePicker
        isOpen={isClassEndTimePickerOpen}
        onClose={() => setIsClassEndTimePickerOpen(false)}
        initialHour={classPickerEndHour}
        initialMinute={classPickerEndMin}
        title="تنظیم ساعت پایان کلاس"
        subtitle="ساعت و دقیقه اتمام این درس"
        confirmText="تأیید و ثبت زمان کلاس"
        theme={theme}
        onConfirm={handleConfirmClassEndTime}
      />

      {/* REUSABLE SPRING TIME PICKER MODAL FOR CLASS REMINDER */}
      <SpringTimePicker
        isOpen={isReminderTimePickerOpen}
        onClose={() => setIsReminderTimePickerOpen(false)}
        initialHour={reminderPickerHour}
        initialMinute={reminderPickerMin}
        title="تنظیم ساعت یادآوری"
        subtitle="زمان دلخواه برای یادآوری این کلاس"
        theme={theme}
        onConfirm={(h, m, formatted) => {
          setReminderPickerHour(h);
          setReminderPickerMin(m);
          setFormReminderExactTime(formatted);
          setIsReminderTimePickerOpen(false);
        }}
      />

      {/* SPRING-ANIMATED JALALI CALENDAR MODAL FOR ANCHOR DATE */}
      {isJalaliSpringModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[65] flex items-center justify-center p-4">
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderLuminous,
            }}
            className="liquid-glass rounded-3xl p-6 max-w-sm w-full border shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div
                  style={{ backgroundColor: theme.primary }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                >
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <h3 style={{ color: theme.textPrimary }} className="text-sm font-black">
                    تاریخ اولین جلسه این درس را مشخص کنید
                  </h3>
                  <p style={{ color: theme.textSecondary }} className="text-[10px]">
                    مبدأ چرخه ۱۴ روزه و پیش‌بینی ۸ جلسه تا پایان ترم
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsJalaliSpringModalOpen(false)}
                style={{ color: theme.textSecondary }}
                className="p-1 rounded-lg hover:opacity-75 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Month Navigation Row */}
            <div
              style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
              className="flex items-center justify-between p-2 rounded-2xl border mb-3 text-xs font-bold"
            >
              <button
                type="button"
                onClick={() => {
                  if (calSelectedMonth === 1) {
                    setCalSelectedYear((y) => y - 1);
                    setCalSelectedMonth(12);
                  } else {
                    setCalSelectedMonth((m) => m - 1);
                  }
                }}
                className="px-2 py-1 rounded-lg text-sky-400 hover:bg-white/5 cursor-pointer"
              >
                ‹ ماه قبل
              </button>
              <span style={{ color: theme.textPrimary }} className="font-extrabold text-sm">
                {PERSIAN_MONTHS[calSelectedMonth - 1]} {toPersianDigits(calSelectedYear)}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (calSelectedMonth === 12) {
                    setCalSelectedYear((y) => y + 1);
                    setCalSelectedMonth(1);
                  } else {
                    setCalSelectedMonth((m) => m + 1);
                  }
                }}
                className="px-2 py-1 rounded-lg text-sky-400 hover:bg-white/5 cursor-pointer"
              >
                ماه بعد ›
              </button>
            </div>

            {/* Neumorphic Inset Well for Date Grid */}
            <div
              style={{
                backgroundColor: theme.innerBg,
                borderColor: theme.borderLuminous,
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
              }}
              className="p-3 rounded-2xl border mb-3"
            >
              {/* Week Day Labels */}
              <div className="grid grid-cols-7 gap-1 text-center pb-2 mb-2 border-b border-white/5 text-[11px] font-bold text-slate-400">
                <span>ش</span>
                <span>ی</span>
                <span>د</span>
                <span>س</span>
                <span>چ</span>
                <span>پ</span>
                <span className="text-rose-400">ج</span>
              </div>

              {/* Days Grid */}
              {(() => {
                const [gy, gm, gd] = jalaliToGregorian(calSelectedYear, calSelectedMonth, 1);
                const firstDay = new Date(gy, gm - 1, gd).getDay();
                const offset = (firstDay + 1) % 7;
                const totalDays = getDaysInJalaliMonth(calSelectedYear, calSelectedMonth);

                return (
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {Array.from({ length: offset }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-8" />
                    ))}
                    {Array.from({ length: totalDays }).map((_, i) => {
                      const dayNum = i + 1;
                      const isSel = calSelectedDay === dayNum;
                      return (
                        <button
                          type="button"
                          key={dayNum}
                          onClick={() => setCalSelectedDay(dayNum)}
                          style={{
                            backgroundColor: isSel ? theme.primary : 'transparent',
                            color: isSel ? '#FFFFFF' : theme.textPrimary,
                            boxShadow: isSel ? `0 0 10px ${theme.glowColor}` : 'none',
                          }}
                          className="h-8 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer hover:bg-white/10 active:scale-95"
                        >
                          {toPersianDigits(dayNum)}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Selected Anchor Preview Chip */}
            <div
              style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
              className="p-2.5 rounded-xl border text-center space-y-1 mb-3"
            >
              <div style={{ color: theme.primaryLight }} className="text-xs font-bold">
                مبدأ دوره: {toPersianDigits(calSelectedDay)} {PERSIAN_MONTHS[calSelectedMonth - 1]} {toPersianDigits(calSelectedYear)}
              </div>
              <div className="text-[10.5px] text-emerald-400 font-semibold">
                ✨ پیش‌بینی خودکار ۸ جلسه تا پایان ۱۶ هفته ترم تحصیلی
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsJalaliSpringModalOpen(false)}
                style={{ backgroundColor: theme.innerBg, borderColor: theme.borderLuminous }}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold border text-slate-400 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => handleSelectAnchorDateWeb(calSelectedYear, calSelectedMonth, calSelectedDay)}
                style={{ backgroundColor: theme.primary }}
                className="flex-1 py-2.5 rounded-2xl text-xs font-black text-white shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
              >
                <Check className="w-4 h-4" />
                <span>تأیید و ذخیره تاریخ مبدأ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
