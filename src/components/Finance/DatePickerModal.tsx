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

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

const DatePickerModalContent = ({
  selectedDate,
  onClose,
  onSelectDate,
}: Omit<DatePickerModalProps, 'visible'>) => {
  const [viewDate, setViewDate] = useState<Date>(() => new Date(selectedDate || new Date()));

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const today = new Date();

  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  // Number of days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }
  while (daysArray.length < 42) {
    daysArray.push(null);
  }

  const isDaySelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    );
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const original = selectedDate ? new Date(selectedDate) : new Date();
    const newDate = new Date(
      currentYear,
      currentMonth,
      day,
      original.getHours(),
      original.getMinutes(),
      original.getSeconds()
    );
    onSelectDate(newDate);
    onClose();
  };

  const handleQuickSelectToday = () => {
    const now = new Date();
    onSelectDate(now);
    onClose();
  };

  const handleQuickSelectYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    onSelectDate(yesterday);
    onClose();
  };

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <View style={styles.iconBox}>
                  <Ionicons name="calendar" size={17} color={COLORS.finance} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Select Date</Text>
                  <Text style={styles.headerSubtitle}>Choose transaction date</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Quick Preset Buttons */}
            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={handleQuickSelectToday}
                activeOpacity={0.7}
              >
                <Ionicons name="today-outline" size={13} color={COLORS.finance} style={{ marginRight: 4 }} />
                <Text style={styles.presetBtnText}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetBtn}
                onPress={handleQuickSelectYesterday}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.presetBtnText, { color: COLORS.textSecondary }]}>Yesterday</Text>
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigator */}
            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>

              <View style={styles.monthYearCenter}>
                <Text style={styles.monthYearText}>
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.navBtn}
                onPress={handleNextMonth}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Day of Week Headers */}
            <View style={styles.weekDaysRow}>
              {DAYS_OF_WEEK.map((d, index) => (
                <View key={index} style={styles.cellWrapper}>
                  <Text style={[styles.weekDayText, index === 0 && { color: COLORS.danger }]}>
                    {d}
                  </Text>
                </View>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {daysArray.map((day, idx) => {
                if (day === null) {
                  return <View key={`empty-${idx}`} style={styles.cellWrapper} />;
                }

                const selected = isDaySelected(day);
                const todayMatch = isToday(day);

                return (
                  <View key={`day-${day}`} style={styles.cellWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.dayBox,
                        selected && styles.dayBoxSelected,
                        todayMatch && !selected && styles.dayBoxToday,
                      ]}
                      onPress={() => handleSelectDay(day)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          selected && styles.dayTextSelected,
                          todayMatch && !selected && styles.dayTextToday,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

export const DatePickerModal = ({ visible, ...props }: DatePickerModalProps) => {
  if (!visible) return null;
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={props.onClose}>
      <DatePickerModalContent {...props} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 14,
    height: 48,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.financeLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
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
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    height: 32,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetBtnText: {
    color: COLORS.finance,
    fontSize: 11,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    height: 44,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthYearCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 6,
    height: 20,
    alignItems: 'center',
  },
  cellWrapper: {
    width: '14.285%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    height: 240,
  },
  dayBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBoxSelected: {
    backgroundColor: COLORS.finance,
  },
  dayBoxToday: {
    borderWidth: 1.5,
    borderColor: COLORS.finance,
  },
  dayText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#08090C',
    fontWeight: '900',
  },
  dayTextToday: {
    color: COLORS.finance,
    fontWeight: '800',
  },
});
