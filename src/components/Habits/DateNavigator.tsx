import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DateNavigatorProps {
  selectedDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
  onOpenCalendar?: () => void;
}

export default function DateNavigator({
  selectedDate,
  onPrevDay,
  onNextDay,
  onOpenCalendar,
}: DateNavigatorProps) {
  const dateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.arrowBtn} onPress={onPrevDay} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={20} color="#FAFAFA" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dateSelector}
        onPress={onOpenCalendar}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={16} color="#8E97FD" style={{ marginRight: 6 }} />
        <Text style={styles.dateText}>{dateStr}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.arrowBtn} onPress={onNextDay} activeOpacity={0.7}>
        <Ionicons name="chevron-forward" size={20} color="#FAFAFA" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181B',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 16,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#09090B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  dateText: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '700',
  },
});