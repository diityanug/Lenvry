import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface HabitCalendarModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

function CalendarModalContent({
  selectedDate,
  onClose,
  onSelectDate,
}: Omit<HabitCalendarModalProps, 'visible'>) {
  const [viewDate, setViewDate] = useState<Date>(() => new Date(selectedDate));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
  for (let i = 1; i <= daysInMonth; i++) daysArray.push(i);
  while (daysArray.length < 42) daysArray.push(null);

  const isSelected = (day: number) =>
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year;

  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  const handleSelectToday = () => {
    const now = new Date();
    setViewDate(now);
    onSelectDate(now);
    onClose();
  };

  return (
    <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              {/* Header Modal */}
              <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                  <Ionicons name="calendar" size={17} color={COLORS.success} style={{ marginRight: 8 }} />
                  <Text style={styles.headerTitle}>Select Date</Text>
                </View>

                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.todayPillBtn}
                    onPress={handleSelectToday}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="today-outline" size={12} color={COLORS.success} style={{ marginRight: 4 }} />
                    <Text style={styles.todayPillText}>Today</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                    <Ionicons name="close" size={18} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Month Navigation */}
              <View style={styles.navRow}>
                <TouchableOpacity
                  style={styles.monthNavBtn}
                  onPress={() => setViewDate(new Date(year, month - 1, 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={17} color={COLORS.textPrimary} />
                </TouchableOpacity>

                <Text style={styles.monthText}>{MONTHS[month]} {year}</Text>

                <TouchableOpacity
                  style={styles.monthNavBtn}
                  onPress={() => setViewDate(new Date(year, month + 1, 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={17} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Weekdays */}
              <View style={styles.weekDaysRow}>
                {DAYS_OF_WEEK.map((d, index) => (
                  <View key={index} style={styles.cellWrapper}>
                    <Text style={styles.weekDayText}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {daysArray.map((day, idx) => {
                  if (day === null) {
                    return <View key={idx} style={styles.cellWrapper} />;
                  }

                  const selected = isSelected(day);
                  const currentToday = isToday(day);

                  return (
                    <View key={idx} style={styles.cellWrapper}>
                      <TouchableOpacity
                        style={[
                          styles.dayBox,
                          selected && styles.dayBoxSelected,
                          currentToday && !selected && styles.dayBoxToday,
                        ]}
                        onPress={() => {
                          onSelectDate(new Date(year, month, day));
                          onClose();
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            selected && styles.dayTextSelected,
                            currentToday && !selected && styles.dayTextToday,
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
}

export default function CalendarModal({ visible, ...props }: HabitCalendarModalProps) {
  if (!visible) return null;
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={props.onClose}>
      <CalendarModalContent {...props} />
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
    padding: 20,
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
    height: 48,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  todayPillText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    height: 36,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCardSub,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthText: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  weekDaysRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
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
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBoxSelected: {
    backgroundColor: COLORS.success,
  },
  dayBoxToday: {
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  dayText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#08090C',
    fontWeight: '800',
  },
  dayTextToday: {
    color: COLORS.success,
    fontWeight: '700',
  },
});