import React from 'react';
import { SharedCalendarModal, SharedCalendarModalProps } from '../Shared/CalendarModal';
import { COLORS } from '../../constants/theme';

export function CalendarModal(props: Omit<SharedCalendarModalProps, 'themeColor'>) {
  return (
    <SharedCalendarModal
      {...props}
      themeColor={COLORS.nutrition}
      title="Select Log Date"
    />
  );
}

export default CalendarModal;
