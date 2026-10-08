import React from 'react';
import { SharedCalendarModal, SharedCalendarModalProps } from '../Shared/CalendarModal';
import { COLORS } from '../../constants/theme';

export default function HabitCalendarModal(props: Omit<SharedCalendarModalProps, 'themeColor'>) {
  return (
    <SharedCalendarModal
      {...props}
      themeColor={COLORS.habit}
      title="Select Habit Date"
    />
  );
}