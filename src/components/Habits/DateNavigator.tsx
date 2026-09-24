import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDisplayDate } from '../../constants/habits';
import { habitStyles as styles } from '../../styles/habitStyles';

interface DateNavigatorProps {
  selectedDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
}

export default function DateNavigator({ selectedDate, onPrevDay, onNextDay }: DateNavigatorProps) {
  return (
    <View style={styles.dateNavContainer}>
      <TouchableOpacity onPress={onPrevDay} style={styles.dateNavBtn} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={20} color="#FAFAFA" />
      </TouchableOpacity>
      <View style={styles.dateNavTextContainer}>
        <Ionicons name="calendar-outline" size={16} color="#8E97FD" style={{ marginRight: 6 }} />
        <Text style={styles.dateNavDisplayText}>{formatDisplayDate(selectedDate)}</Text>
      </View>
      <TouchableOpacity onPress={onNextDay} style={styles.dateNavBtn} activeOpacity={0.7}>
        <Ionicons name="chevron-forward" size={20} color="#FAFAFA" />
      </TouchableOpacity>
    </View>
  );
}