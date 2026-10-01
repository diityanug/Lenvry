import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';

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
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.arrowBtn} onPress={onPrevDay} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dateSelector}
        onPress={onOpenCalendar}
        activeOpacity={0.7}
      >
        <Ionicons
          name="calendar-outline"
          size={14}
          color={COLORS.success}
          style={{ marginRight: 6 }}
        />
        <Text style={styles.dateText}>{dateStr}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.arrowBtn} onPress={onNextDay} activeOpacity={0.7}>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCardSub,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});