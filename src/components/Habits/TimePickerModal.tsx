import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';

interface TimePickerModalProps {
  visible: boolean;
  initialTime?: string;
  onClose: () => void;
  onConfirm: (timeString: string) => void;
  onClear?: () => void;
}

const PRESET_TIMES = [
  { label: '06:00 AM', hour: '06', minute: '00', period: 'AM' as const },
  { label: '07:30 AM', hour: '07', minute: '30', period: 'AM' as const },
  { label: '12:00 PM', hour: '12', minute: '00', period: 'PM' as const },
  { label: '05:00 PM', hour: '05', minute: '00', period: 'PM' as const },
  { label: '08:00 PM', hour: '08', minute: '00', period: 'PM' as const },
  { label: '09:30 PM', hour: '09', minute: '30', period: 'PM' as const },
];

const parseInitialTime = (timeStr?: string) => {
  if (!timeStr) {
    return { hour: '07', minute: '00', period: 'AM' as const };
  }
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const numbers = clean.replace(/[^0-9:]/g, '').split(':');

  let h = parseInt(numbers[0] || '7', 10);
  let m = parseInt(numbers[1] || '0', 10);
  if (isNaN(h)) h = 7;
  if (isNaN(m)) m = 0;

  let period: 'AM' | 'PM' = 'AM';
  if (isPM) {
    period = 'PM';
  } else if (isAM) {
    period = 'AM';
  } else {
    if (h >= 12) {
      period = 'PM';
      if (h > 12) h -= 12;
    } else {
      period = 'AM';
      if (h === 0) h = 12;
    }
  }

  if (h > 12) h = 12;
  if (h < 1) h = 1;
  if (m > 59) m = 59;
  if (m < 0) m = 0;

  return {
    hour: h.toString().padStart(2, '0'),
    minute: m.toString().padStart(2, '0'),
    period,
  };
};

function TimePickerContent({
  initialTime,
  onClose,
  onConfirm,
  onClear,
}: Omit<TimePickerModalProps, 'visible'>) {
  const initial = parseInitialTime(initialTime);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period);
  const [activeSegment, setActiveSegment] = useState<'hour' | 'minute'>('hour');
  const [hourTypingState, setHourTypingState] = useState<'fresh' | 'typed_one'>('fresh');
  const [minuteTypingState, setMinuteTypingState] = useState<'fresh' | 'typed_first'>('fresh');

  const handleSelectSegment = (seg: 'hour' | 'minute') => {
    setActiveSegment(seg);
    if (seg === 'hour') setHourTypingState('fresh');
    if (seg === 'minute') setMinuteTypingState('fresh');
  };

  const handleAdjustHour = (delta: number) => {
    let num = parseInt(hour, 10) + delta;
    if (num > 12) num = 1;
    if (num < 1) num = 12;
    setHour(num.toString().padStart(2, '0'));
    setHourTypingState('fresh');
  };

  const handleAdjustMinute = (delta: number) => {
    let num = parseInt(minute, 10) + delta;
    if (num > 59) num = 0;
    if (num < 0) num = 55;
    setMinute(num.toString().padStart(2, '0'));
    setMinuteTypingState('fresh');
  };

  const handlePressDigit = (digit: string) => {
    const num = parseInt(digit, 10);

    if (activeSegment === 'hour') {
      if (hourTypingState === 'fresh') {
        if (digit === '1') {
          setHour('01');
          setHourTypingState('typed_one');
        } else if (digit === '0') {
          setHour('12');
          setHourTypingState('fresh');
          setActiveSegment('minute');
          setMinuteTypingState('fresh');
        } else {
          // 2 to 9
          setHour(`0${digit}`);
          setHourTypingState('fresh');
          setActiveSegment('minute');
          setMinuteTypingState('fresh');
        }
      } else {
        // Already typed '1'
        if (num <= 2) {
          setHour(`1${digit}`);
        } else {
          setHour(`0${digit}`);
        }
        setHourTypingState('fresh');
        setActiveSegment('minute');
        setMinuteTypingState('fresh');
      }
    } else {
      // Minute segment
      if (minuteTypingState === 'fresh') {
        if (num <= 5) {
          setMinute(`${digit}0`);
          setMinuteTypingState('typed_first');
        } else {
          setMinute(`0${digit}`);
          setMinuteTypingState('fresh');
        }
      } else {
        // Second digit of minute
        const firstDigit = minute.charAt(0);
        setMinute(`${firstDigit}${digit}`);
        setMinuteTypingState('fresh');
      }
    }
  };

  const handleBackspace = () => {
    if (activeSegment === 'minute') {
      if (minuteTypingState === 'typed_first') {
        setMinute('00');
        setMinuteTypingState('fresh');
      } else {
        setMinute('00');
        setActiveSegment('hour');
        setHourTypingState('fresh');
      }
    } else {
      setHour('01');
      setHourTypingState('fresh');
    }
  };

  const handleClearCurrent = () => {
    if (activeSegment === 'hour') {
      setHour('01');
      setHourTypingState('fresh');
    } else {
      setMinute('00');
      setMinuteTypingState('fresh');
    }
  };

  const handleApplyPreset = (p: typeof PRESET_TIMES[0]) => {
    setHour(p.hour);
    setMinute(p.minute);
    setPeriod(p.period);
    setHourTypingState('fresh');
    setMinuteTypingState('fresh');
  };

  const handleConfirm = () => {
    const formatted = `${hour}:${minute} ${period}`;
    onConfirm(formatted);
  };

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <Ionicons name="alarm" size={18} color={COLORS.success} style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.headerTitle}>Reminder Time</Text>
                  <Text style={styles.headerSubtitle}>Set hour, minute, and AM/PM</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Main Time Display Area */}
            <View style={styles.clockDisplayCard}>
              {/* Hour & Minute Digits */}
              <View style={styles.digitsRow}>
                {/* Hour Segment */}
                <View style={styles.segmentCol}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleAdjustHour(1)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="chevron-up" size={16} color={COLORS.textPrimary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.digitBox,
                      activeSegment === 'hour' && styles.digitBoxActive,
                    ]}
                    onPress={() => handleSelectSegment('hour')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.digitText,
                        activeSegment === 'hour' && styles.digitTextActive,
                      ]}
                    >
                      {hour}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleAdjustHour(-1)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="chevron-down" size={16} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.segmentLabel}>HOUR</Text>
                </View>

                {/* Colon Separator */}
                <Text style={styles.colonSeparator}>:</Text>

                {/* Minute Segment */}
                <View style={styles.segmentCol}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleAdjustMinute(5)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="chevron-up" size={16} color={COLORS.textPrimary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.digitBox,
                      activeSegment === 'minute' && styles.digitBoxActive,
                    ]}
                    onPress={() => handleSelectSegment('minute')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.digitText,
                        activeSegment === 'minute' && styles.digitTextActive,
                      ]}
                    >
                      {minute}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleAdjustMinute(-5)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="chevron-down" size={16} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.segmentLabel}>MINUTE</Text>
                </View>

                {/* AM / PM Toggle Column */}
                <View style={styles.periodCol}>
                  <TouchableOpacity
                    style={[
                      styles.periodBtn,
                      period === 'AM' && styles.periodBtnActive,
                    ]}
                    onPress={() => setPeriod('AM')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.periodBtnText,
                        period === 'AM' && styles.periodBtnTextActive,
                      ]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.periodBtn,
                      period === 'PM' && styles.periodBtnActive,
                    ]}
                    onPress={() => setPeriod('PM')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.periodBtnText,
                        period === 'PM' && styles.periodBtnTextActive,
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Minutes row */}
              <View style={styles.quickMinutesRow}>
                <Text style={styles.quickMinutesLabel}>Set minute:</Text>
                {['00', '15', '30', '45'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.quickMinuteChip,
                      minute === m && styles.quickMinuteChipActive,
                    ]}
                    onPress={() => {
                      setMinute(m);
                      setMinuteTypingState('fresh');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickMinuteChipText,
                        minute === m && styles.quickMinuteChipTextActive,
                      ]}
                    >
                      :{m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick Presets Row */}
            <View style={styles.presetsSection}>
              <Text style={styles.sectionSmallLabel}>COMMON PRESETS</Text>
              <View style={styles.presetsGrid}>
                {PRESET_TIMES.map((p) => {
                  const isCurrent =
                    hour === p.hour && minute === p.minute && period === p.period;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      style={[
                        styles.presetChip,
                        isCurrent && styles.presetChipActive,
                      ]}
                      onPress={() => handleApplyPreset(p)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          isCurrent && styles.presetChipTextActive,
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Custom Numeric Keypad */}
            <View style={styles.keypadContainer}>
              <View style={styles.keypadRow}>
                {['1', '2', '3'].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={styles.keypadBtn}
                    onPress={() => handlePressDigit(d)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.keypadDigitText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.keypadRow}>
                {['4', '5', '6'].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={styles.keypadBtn}
                    onPress={() => handlePressDigit(d)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.keypadDigitText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.keypadRow}>
                {['7', '8', '9'].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={styles.keypadBtn}
                    onPress={() => handlePressDigit(d)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.keypadDigitText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.keypadRow}>
                <TouchableOpacity
                  style={[styles.keypadBtn, styles.keypadActionBtn]}
                  onPress={handleClearCurrent}
                  activeOpacity={0.6}
                >
                  <Text style={styles.keypadActionText}>CLR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.keypadBtn}
                  onPress={() => handlePressDigit('0')}
                  activeOpacity={0.6}
                >
                  <Text style={styles.keypadDigitText}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.keypadBtn, styles.keypadActionBtn]}
                  onPress={handleBackspace}
                  activeOpacity={0.6}
                >
                  <Ionicons name="backspace-outline" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.footerRow}>
              {onClear ? (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={onClear}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={14} color={COLORS.danger} style={{ marginRight: 4 }} />
                  <Text style={styles.clearBtnText}>No Reminder</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={16} color="#08090C" style={{ marginRight: 6 }} />
                <Text style={styles.confirmBtnText}>SET REMINDER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default function TimePickerModal({ visible, ...props }: TimePickerModalProps) {
  if (!visible) return null;
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={props.onClose}>
      <TimePickerContent {...props} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 12,
    height: 48,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clockDisplayCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  segmentCol: {
    alignItems: 'center',
  },
  stepperBtn: {
    width: 32,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBox: {
    width: 64,
    height: 54,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitBoxActive: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successSoft,
  },
  digitText: {
    color: COLORS.textSecondary,
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  digitTextActive: {
    color: COLORS.success,
  },
  segmentLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  colonSeparator: {
    color: COLORS.textMuted,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  periodCol: {
    marginLeft: 8,
    gap: 6,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  periodBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  periodBtnTextActive: {
    color: '#08090C',
    fontWeight: '900',
  },
  quickMinutesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickMinutesLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginRight: 2,
  },
  quickMinuteChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickMinuteChipActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  quickMinuteChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  quickMinuteChipTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  presetsSection: {
    marginBottom: 12,
  },
  sectionSmallLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipActive: {
    backgroundColor: COLORS.successSoft,
    borderColor: COLORS.success,
  },
  presetChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: COLORS.success,
    fontWeight: '800',
  },
  keypadContainer: {
    marginBottom: 14,
    gap: 6,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  keypadBtn: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  keypadDigitText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  keypadActionBtn: {
    backgroundColor: COLORS.bgCard,
  },
  keypadActionText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearBtnText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.success,
  },
  confirmBtnText: {
    color: '#08090C',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
