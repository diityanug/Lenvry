import React from 'react';
import { Text, View, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MONTHS, DAYS } from '../../types/finance';
import { financeStyles as styles } from '../../styles/financeStyles';

interface CalendarModalProps {
  visible: boolean;
  txDate: Date;
  viewDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const CalendarModal = ({
  visible, txDate, viewDate, onClose, onSelectDate, onPrevMonth, onNextMonth
}: CalendarModalProps) => (
  <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
    <View style={styles.modalOverlayCenter}>
      <View style={styles.modalContentSmall}>
        <View style={styles.calendarHeaderRow}>
          <TouchableOpacity onPress={onPrevMonth} style={styles.calendarNavBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color="#FAFAFA" />
          </TouchableOpacity>
          <Text style={styles.calendarMonthText}>{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</Text>
          <TouchableOpacity onPress={onNextMonth} style={styles.calendarNavBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={22} color="#FAFAFA" />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarDaysHeader}>
          {DAYS.map(d => <Text key={d} style={styles.calendarDayName}>{d}</Text>)}
        </View>
        <View style={styles.calendarGrid}>
          {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() }).map((_, i) => (
            <View key={`blank-${i}`} style={styles.calendarCell} />
          ))}
          {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
            const day = i + 1;
            const isSelected = txDate.getDate() === day && txDate.getMonth() === viewDate.getMonth() && txDate.getFullYear() === viewDate.getFullYear();
            const isToday = new Date().getDate() === day && new Date().getMonth() === viewDate.getMonth() && new Date().getFullYear() === viewDate.getFullYear();
            return (
              <TouchableOpacity 
                key={`day-${day}`} 
                style={[styles.calendarCell, isSelected && styles.calendarCellSelected, isToday && !isSelected && styles.calendarCellToday]} 
                onPress={() => onSelectDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))}
                activeOpacity={0.7}
              >
                <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected, isToday && !isSelected && styles.calendarDayTextToday]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity 
          style={styles.dialogBtnCancel} 
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.dialogBtnCancelText}>CLOSE</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);