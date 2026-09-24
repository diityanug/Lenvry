import React, { useState } from 'react';
import { Text, View, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fitnessStyles as styles } from '../../styles/fitnessStyles';

interface CalendarModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function CalendarModal({ visible, selectedDate, onClose, onSelectDate }: CalendarModalProps) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const getFormattedDateKey = (date: Date) => date.toISOString().split('T')[0];

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlayCenter}>
        <View style={styles.calendarBox}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => setViewDate(new Date(year, month - 1, 1))} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color="#FAFAFA" />
            </TouchableOpacity>
            <Text style={styles.calendarMonthText}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity onPress={() => setViewDate(new Date(year, month + 1, 1))} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={22} color="#FAFAFA" />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarDaysHeader}>
            {DAYS_SHORT.map(d => <Text key={d} style={styles.calendarDayName}>{d}</Text>)}
          </View>

          <View style={styles.calendarGrid}>
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <View key={`blank-${i}`} style={styles.calendarCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const d = new Date(year, month, day);
              const isSelected = getFormattedDateKey(selectedDate) === getFormattedDateKey(d);
              const isToday = getFormattedDateKey(new Date()) === getFormattedDateKey(d);

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.calendarCell,
                    isSelected && styles.calendarCellSelected,
                    isToday && !isSelected && styles.calendarCellToday,
                  ]}
                  onPress={() => {
                    onSelectDate(d);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      isSelected && styles.calendarDayTextSelected,
                      isToday && !isSelected && styles.calendarDayTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}