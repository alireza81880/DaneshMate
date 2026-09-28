import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { NeumorphicCard } from './NeumorphicCard';
import { NeumorphicButton } from './NeumorphicButton';
import { toPersianDigits } from '../utils/jalali';
import { hapticFeedback } from '../utils/haptics';

interface NeumorphicTimePickerProps {
  value: string; // e.g. "08:00 - 10:00"
  onChange: (timeString: string) => void;
  error?: string;
}

// Exactly 5 standardized 2-hour presets
const STANDARDIZED_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
];

const HOUR_OPTIONS = Array.from({ length: 14 }, (_, i) => i + 7); // 07 to 20
const MINUTE_OPTIONS = [0, 15, 30, 45];

export const NeumorphicTimePicker: React.FC<NeumorphicTimePickerProps> = ({
  value,
  onChange,
  error,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Time state
  const [startHour, setStartHour] = useState(8);
  const [startMin, setStartMin] = useState(0);
  const [endHour, setEndHour] = useState(10);
  const [endMin, setEndMin] = useState(0);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const openCustomModal = () => {
    hapticFeedback.light();
    setStep(1);
    setPickerError(null);

    if (value && value.includes('-')) {
      const parts = value.split('-').map((s) => s.trim());
      if (parts.length === 2) {
        const parseDigits = (str: string) =>
          str.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
        const [sh, sm] = parts[0].split(':').map((n) => parseInt(parseDigits(n), 10));
        const [eh, em] = parts[1].split(':').map((n) => parseInt(parseDigits(n), 10));
        if (!isNaN(sh)) setStartHour(sh);
        if (!isNaN(sm)) setStartMin(sm);
        if (!isNaN(eh)) setEndHour(eh);
        if (!isNaN(em)) setEndMin(em);
      }
    } else {
      setStartHour(8);
      setStartMin(0);
      setEndHour(10);
      setEndMin(0);
    }
    setIsModalOpen(true);
  };

  const handleSelectPreset = (slot: string) => {
    hapticFeedback.selection();
    onChange(slot);
  };

  // Step 1: Select start time and auto advance to step 2
  const handleProceedToEndTime = (hour?: number, min?: number) => {
    hapticFeedback.selection();
    const sHour = hour !== undefined ? hour : startHour;
    const sMin = min !== undefined ? min : startMin;
    setStartHour(sHour);
    setStartMin(sMin);

    // Auto set end time to start + 1h 30m or start + 2h
    let newEndHour = sHour + 1;
    let newEndMin = sMin + 30;
    if (newEndMin >= 60) {
      newEndHour += 1;
      newEndMin -= 60;
    }
    if (newEndHour > 22) {
      newEndHour = 22;
      newEndMin = 0;
    }
    setEndHour(newEndHour);
    setEndMin(newEndMin);
    setPickerError(null);
    setStep(2);
  };

  const handleApplyDurationShortcut = (durationMinutes: number) => {
    hapticFeedback.selection();
    const totalStart = startHour * 60 + startMin;
    const totalEnd = totalStart + durationMinutes;
    let eHour = Math.floor(totalEnd / 60);
    let eMin = totalEnd % 60;
    if (eHour > 23) {
      eHour = 23;
      eMin = 59;
    }
    setEndHour(eHour);
    setEndMin(eMin);
    setPickerError(null);
  };

  const handleConfirmCustom = () => {
    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;
    if (endTotal <= startTotal) {
      hapticFeedback.warning();
      setPickerError('ساعت اتمام کلاس باید پس از ساعت شروع باشد.');
      return;
    }
    hapticFeedback.success();
    const formatted = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')} - ${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    onChange(formatted);
    setIsModalOpen(false);
  };

  const handleClearCustom = () => {
    hapticFeedback.light();
    onChange(STANDARDIZED_SLOTS[0]);
  };

  const isCustomTime = !STANDARDIZED_SLOTS.includes(value) && value.length > 0;
  const isEndValid = endHour * 60 + endMin > startHour * 60 + startMin;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          ساعت برگزاری کلاس <Text style={styles.requiredStar}>*</Text>
        </Text>
        <Text style={styles.subHint}>۵ بازه استاندارد ۲ ساعته یا ساعت دلخواه</Text>
      </View>

      {/* Selected Time Tactile Banner */}
      <View style={[styles.selectedBanner, !!error && styles.selectedBannerError]}>
        <Text style={styles.selectedBannerIcon}>⏰</Text>
        <Text style={styles.selectedBannerText}>
          {value ? `ساعت فعال کلاس: ${toPersianDigits(value)}` : 'لطفاً ساعت برگزاری را مشخص کنید'}
        </Text>
      </View>

      {/* Exactly 5 Standardized 2-Hour Presets (Elevated/Inset Neumorphic states) */}
      <View style={styles.presetsGrid}>
        {STANDARDIZED_SLOTS.map((slot) => {
          const isSelected = value === slot && !isCustomTime;
          return (
            <Pressable
              key={slot}
              onPress={() => handleSelectPreset(slot)}
              style={[
                styles.slotBtn,
                isSelected ? styles.slotBtnSelected : styles.slotBtnUnselected,
              ]}
            >
              <Text
                style={[
                  styles.slotBtnText,
                  isSelected && styles.slotBtnTextSelected,
                ]}
              >
                {toPersianDigits(slot)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Automated Custom Time Selection (Zero Error, Replaces Raw TextInput) */}
      <View style={styles.customSection}>
        {isCustomTime ? (
          <View style={styles.customSelectedCard}>
            <View style={styles.customSelectedInfo}>
              <Text style={styles.customSelectedIcon}>⚙️</Text>
              <View>
                <Text style={styles.customSelectedSubLabel}>ساعت دلخواه تأییدشده:</Text>
                <Text style={styles.customSelectedValue}>{toPersianDigits(value)}</Text>
              </View>
            </View>
            <View style={styles.customSelectedActions}>
              <Pressable onPress={openCustomModal} style={styles.editBtn}>
                <Text style={styles.editBtnText}>ویرایش</Text>
              </Pressable>
              <Pressable onPress={handleClearCustom} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={openCustomModal} style={styles.customTriggerBtn}>
            <Text style={styles.customTriggerIcon}>⚙️</Text>
            <Text style={styles.customTriggerText}>
              انتخاب ساعت دلخواه (تنظیم خودکار شروع و پایان بدون خطا)
            </Text>
          </Pressable>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* 2-Step Automated Custom Time Picker Modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={styles.modalCentered}>
            <NeumorphicCard style={styles.modalCard} borderRadius={26}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>تنظیم دقیق و خودکار ساعت کلاس</Text>
                <Text style={styles.modalSubtitle}>
                  {step === 1 ? 'گام ۱ از ۲: ساعت شروع کلاس' : 'گام ۲ از ۲: ساعت پایان کلاس'}
                </Text>
              </View>

              {/* Step Navigation Tabs */}
              <View style={styles.stepTabs}>
                <Pressable
                  onPress={() => setStep(1)}
                  style={[styles.stepTab, step === 1 && styles.stepTabActive]}
                >
                  <Text style={[styles.stepTabText, step === 1 && styles.stepTabTextActive]}>
                    ۱. ساعت شروع {step === 2 ? '✓' : ''}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleProceedToEndTime()}
                  style={[styles.stepTab, step === 2 && styles.stepTabActive]}
                >
                  <Text style={[styles.stepTabText, step === 2 && styles.stepTabTextActive]}>
                    ۲. ساعت پایان
                  </Text>
                </Pressable>
              </View>

              {/* STEP 1: START TIME SELECTION */}
              {step === 1 && (
                <View style={styles.stepContainer}>
                  {/* Start Time Preview */}
                  <View style={styles.timePreviewCard}>
                    <Text style={styles.previewSubLabel}>ساعت شروع انتخابی:</Text>
                    <Text style={styles.timePreviewText}>
                      {toPersianDigits(
                        `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`
                      )}
                    </Text>
                  </View>

                  {/* Hours Selection */}
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeBlockLabel}>ساعت شروع:</Text>
                    <View style={styles.hoursRow}>
                      {HOUR_OPTIONS.map((h) => {
                        const isSel = startHour === h;
                        return (
                          <Pressable
                            key={h}
                            onPress={() => {
                              hapticFeedback.selection();
                              setStartHour(h);
                              if (endHour <= h) setEndHour(Math.min(h + 2, 22));
                            }}
                            style={[styles.smallChip, isSel && styles.chipActive]}
                          >
                            <Text style={[styles.smallChipText, isSel && styles.chipTextActive]}>
                              {toPersianDigits(h.toString().padStart(2, '0'))}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Minutes Selection */}
                  <View style={[styles.timeBlock, { marginTop: 8 }]}>
                    <Text style={styles.timeBlockLabel}>دقیقه شروع:</Text>
                    <View style={styles.minutesList}>
                      {MINUTE_OPTIONS.map((m) => {
                        const isSel = startMin === m;
                        return (
                          <Pressable
                            key={m}
                            onPress={() => {
                              hapticFeedback.selection();
                              setStartMin(m);
                            }}
                            style={[styles.minuteChip, isSel && styles.chipActive]}
                          >
                            <Text style={[styles.smallChipText, isSel && styles.chipTextActive]}>
                              :{toPersianDigits(m.toString().padStart(2, '0'))}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <Text style={styles.hintNotice}>
                    💡 پس از تعیین ساعت شروع، با دکمه زیر مستقیماً به تعیین ساعت پایان می‌روید.
                  </Text>

                  <View style={styles.actionRow}>
                    <NeumorphicButton
                      title="انصراف"
                      size="sm"
                      onPress={() => setIsModalOpen(false)}
                      style={styles.actionBtn}
                    />
                    <NeumorphicButton
                      title="مرحله بعد: ساعت پایان ➔"
                      variant="primary"
                      size="sm"
                      onPress={() => handleProceedToEndTime()}
                      style={[styles.actionBtn, { flex: 1.5 }]}
                    />
                  </View>
                </View>
              )}

              {/* STEP 2: END TIME SELECTION */}
              {step === 2 && (
                <View style={styles.stepContainer}>
                  {/* Confirmed Start Badge */}
                  <View style={styles.startBadgeRow}>
                    <Text style={styles.startBadgeText}>
                      ✓ ساعت شروع: {toPersianDigits(`${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`)}
                    </Text>
                    <Pressable onPress={() => setStep(1)}>
                      <Text style={styles.changeStartLink}>ویرایش شروع</Text>
                    </Pressable>
                  </View>

                  {/* Quick Duration Shortcuts */}
                  <View style={styles.shortcutsRow}>
                    {[
                      { label: '+۱:۳۰ ساعت', mins: 90 },
                      { label: '+۱:۴۵ ساعت', mins: 105 },
                      { label: '+۲:۰۰ ساعت', mins: 120 },
                    ].map((item) => (
                      <Pressable
                        key={item.mins}
                        onPress={() => handleApplyDurationShortcut(item.mins)}
                        style={styles.shortcutChip}
                      >
                        <Text style={styles.shortcutText}>{item.label}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Hours Selection (Valid End Hours) */}
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeBlockLabel}>ساعت پایان:</Text>
                    <View style={styles.hoursRow}>
                      {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((h) => {
                        const isSel = endHour === h;
                        const isTooEarly = h < startHour;
                        return (
                          <Pressable
                            key={h}
                            disabled={isTooEarly}
                            onPress={() => {
                              hapticFeedback.selection();
                              setEndHour(h);
                              setPickerError(null);
                            }}
                            style={[
                              styles.smallChip,
                              isSel && styles.chipActive,
                              isTooEarly && styles.chipDisabled,
                            ]}
                          >
                            <Text
                              style={[
                                styles.smallChipText,
                                isSel && styles.chipTextActive,
                                isTooEarly && styles.chipTextDisabled,
                              ]}
                            >
                              {toPersianDigits(h.toString().padStart(2, '0'))}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Minutes Selection */}
                  <View style={[styles.timeBlock, { marginTop: 8 }]}>
                    <Text style={styles.timeBlockLabel}>دقیقه پایان:</Text>
                    <View style={styles.minutesList}>
                      {MINUTE_OPTIONS.map((m) => {
                        const isSel = endMin === m;
                        return (
                          <Pressable
                            key={m}
                            onPress={() => {
                              hapticFeedback.selection();
                              setEndMin(m);
                              setPickerError(null);
                            }}
                            style={[styles.minuteChip, isSel && styles.chipActive]}
                          >
                            <Text style={[styles.smallChipText, isSel && styles.chipTextActive]}>
                              :{toPersianDigits(m.toString().padStart(2, '0'))}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Validation Preview Banner */}
                  {isEndValid ? (
                    <View style={styles.summaryBanner}>
                      <Text style={styles.summaryText}>
                        بازه تأییدشده: از{' '}
                        {toPersianDigits(`${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`)}{' '}
                        تا{' '}
                        {toPersianDigits(`${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorBannerText}>
                        ⚠️ ساعت اتمام باید بعد از ساعت شروع باشد.
                      </Text>
                    </View>
                  )}

                  {pickerError ? <Text style={styles.errorText}>{pickerError}</Text> : null}

                  <View style={styles.actionRow}>
                    <NeumorphicButton
                      title="مرحله قبل"
                      size="sm"
                      onPress={() => setStep(1)}
                      style={styles.actionBtn}
                    />
                    <NeumorphicButton
                      title="تأیید و ذخیره ساعت"
                      variant="primary"
                      size="sm"
                      disabled={!isEndValid}
                      onPress={handleConfirmCustom}
                      style={[styles.actionBtn, { flex: 1.5 }]}
                    />
                  </View>
                </View>
              )}
            </NeumorphicCard>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  subHint: {
    fontSize: 10.5,
    color: '#94a3b8',
  },
  requiredStar: {
    color: '#e11d48',
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#d8dee6',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 10,
    ...Platform.select({
      web: { boxShadow: 'inset 2px 2px 5px #bec3cc, inset -2px -2px 5px #ffffff' } as any,
    }),
  },
  selectedBannerError: {
    borderWidth: 1,
    borderColor: '#f87171',
  },
  selectedBannerIcon: {
    fontSize: 14,
  },
  selectedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  slotBtn: {
    width: '31.5%',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBtnUnselected: {
    backgroundColor: '#e6ebf2',
    ...Platform.select({
      web: { boxShadow: '3px 3px 6px #bec3cc, -3px -3px 6px #ffffff' } as any,
    }),
  },
  slotBtnSelected: {
    backgroundColor: '#2563eb',
  },
  slotBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  slotBtnTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  customSection: {
    marginTop: 4,
  },
  customTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e6ebf2',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...Platform.select({
      web: { boxShadow: '2px 2px 5px #bec3cc, -2px -2px 5px #ffffff' } as any,
    }),
  },
  customTriggerIcon: {
    fontSize: 13,
  },
  customTriggerText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  customSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#dbeafe',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  customSelectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customSelectedIcon: {
    fontSize: 14,
  },
  customSelectedSubLabel: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '600',
  },
  customSelectedValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  customSelectedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  clearBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 7,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ef4444',
  },
  errorText: {
    fontSize: 11,
    color: '#e11d48',
    marginTop: 6,
    textAlign: 'right',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCentered: {
    width: '100%',
    maxWidth: 420,
  },
  modalCard: {
    padding: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  stepTabs: {
    flexDirection: 'row',
    backgroundColor: '#d8dee6',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  stepTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 9,
    alignItems: 'center',
  },
  stepTabActive: {
    backgroundColor: '#2563eb',
  },
  stepTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  stepTabTextActive: {
    color: '#ffffff',
  },
  stepContainer: {
    width: '100%',
  },
  timePreviewCard: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  previewSubLabel: {
    fontSize: 10.5,
    color: '#dbeafe',
    fontWeight: '600',
    marginBottom: 2,
  },
  timePreviewText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timeBlock: {
    backgroundColor: '#d8dee6',
    borderRadius: 14,
    padding: 10,
  },
  timeBlockLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'right',
  },
  hoursRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  smallChip: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#e6ebf2',
    minWidth: 34,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#2563eb',
  },
  chipDisabled: {
    opacity: 0.35,
  },
  smallChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  chipTextDisabled: {
    color: '#94a3b8',
  },
  minutesList: {
    flexDirection: 'row',
    gap: 6,
  },
  minuteChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e6ebf2',
    alignItems: 'center',
  },
  hintNotice: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'right',
  },
  startBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  startBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  changeStartLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  shortcutChip: {
    flex: 1,
    backgroundColor: '#e6ebf2',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  shortcutText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  summaryBanner: {
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  errorBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
  },
});
