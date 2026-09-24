import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fitnessStyles as styles } from '../../styles/fitnessStyles';
import { MONTHS, DAYS_SHORT } from '../../constants/fitness';

interface DateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onOpenCalendar: () => void;
}

export default function DateStrip({ selectedDate, onSelectDate, onOpenCalendar }: DateStripProps) {
  const getFormattedDateKey = (date: Date) => date.toISOString().split('T')[0];
  const currentDateKey = getFormattedDateKey(selectedDate);
  const todayKey = getFormattedDateKey(new Date());

  // Tampilkan rentang 7 hari dalam 1 baris
  const getWeekDates = () => {
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  return (
    <View style={styles.dateStripContainer}>
      <View style={styles.monthHeaderRow}>
        <TouchableOpacity style={styles.monthLabelRow} onPress={onOpenCalendar} activeOpacity={0.7}>
          <Text style={styles.monthLabelText}>
            {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </Text>
          <Ionicons name="calendar-outline" size={15} color="#FF6B00" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.todayBadge} onPress={() => onSelectDate(new Date())} activeOpacity={0.7}>
          <Text style={styles.todayBadgeText}>TODAY</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateStripRow}>
        {getWeekDates().map((d, index) => {
          const isSelected = getFormattedDateKey(d) === currentDateKey;
          const isCurrentToday = getFormattedDateKey(d) === todayKey;
          const isFuture = d > new Date();

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCard,
                isSelected && styles.dayCardActive,
                isCurrentToday && !isSelected && styles.dayCardToday,
              ]}
              onPress={() => onSelectDate(d)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayTextShort, isSelected && styles.dayTextShortActive]}>
                {DAYS_SHORT[d.getDay()]}
              </Text>
              <Text style={[styles.dayTextNumber, isSelected && styles.dayTextNumberActive]}>
                {d.getDate()}
              </Text>
              {isFuture && <View style={[styles.futureDot, isSelected && { backgroundColor: '#09090B' }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}