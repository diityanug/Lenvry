import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

export default function CalendarModal({
  visible,
  selectedDate,
  onClose,
  onSelectDate,
}: HabitCalendarModalProps) {
  const [viewDate, setViewDate] = useState<Date>(selectedDate);

  useEffect(() => {
    if (visible) {
      setViewDate(selectedDate);
    }
  }, [visible, selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const today = new Date();
  const isViewingCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
  for (let i = 1; i <= daysInMonth; i++) daysArray.push(i);

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
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              {/* Header Modal */}
              <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                  <Ionicons name="calendar" size={18} color="#8E97FD" style={{ marginRight: 8 }} />
                  <Text style={styles.headerTitle}>Select Date</Text>
                </View>

                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.todayPillBtn}
                    onPress={handleSelectToday}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="today-outline" size={13} color="#8E97FD" style={{ marginRight: 4 }} />
                    <Text style={styles.todayPillText}>Today</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                    <Ionicons name="close" size={20} color="#FAFAFA" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Navigasi Bulan */}
              <View style={styles.navRow}>
                <TouchableOpacity
                  style={styles.monthNavBtn}
                  onPress={() => setViewDate(new Date(year, month - 1, 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={18} color="#FAFAFA" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setViewDate(new Date())}
                  activeOpacity={0.7}
                  style={styles.monthCenterBtn}
                >
                  <Text style={styles.monthText}>
                    {MONTHS[month]} {year}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.monthNavBtn}
                  onPress={() => setViewDate(new Date(year, month + 1, 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={18} color="#FAFAFA" />
                </TouchableOpacity>
              </View>

              {/* Header Nama Hari */}
              <View style={styles.weekDaysRow}>
                {DAYS_OF_WEEK.map((d, index) => (
                  <View key={index} style={styles.cellWrapper}>
                    <Text style={styles.weekDayText}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Grid Tanggal */}
              <View style={styles.daysGrid}>
                {daysArray.map((day, idx) => {
                  if (day === null) {
                    return <View key={idx} style={styles.cellWrapper} />;
                  }

                  const selected = isSelected(day);
                  const currentDay = isToday(day);

                  return (
                    <View key={idx} style={styles.cellWrapper}>
                      <TouchableOpacity
                        style={[
                          styles.dayBox,
                          selected && styles.dayBoxSelected,
                          currentDay && !selected && styles.dayBoxToday,
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
                            currentDay && !selected && styles.dayTextToday,
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    backgroundColor: '#18181B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    marginBottom: 16,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 151, 253, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(142, 151, 253, 0.3)',
  },
  todayPillText: {
    color: '#8E97FD',
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  monthText: {
    color: '#FAFAFA',
    fontSize: 15,
    fontWeight: '700',
  },
  weekDaysRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
  },
  cellWrapper: {
    width: '14.285%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  weekDayText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
  },
  dayBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBoxSelected: {
    backgroundColor: '#8E97FD',
  },
  dayBoxToday: {
    borderWidth: 1.5,
    borderColor: '#8E97FD',
  },
  dayText: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#09090B',
    fontWeight: '800',
  },
  dayTextToday: {
    color: '#8E97FD',
    fontWeight: '700',
  },
});