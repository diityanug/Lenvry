export const DEFAULT_CATEGORIES = [
  'Health',
  'Faith',
  'Productivity',
  'Learning',
  'Fitness',
  'Mindfulness',
];

export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export const isHabitActiveForDate = (habit: {
  date: string;
  frequency?: string;
  repeatDays?: number[];
}, selectedDate: Date): boolean => {
  const currentDateKey = formatDateKey(selectedDate);
  const freq = habit.frequency || 'once';

  if (freq === 'once') {
    return habit.date === currentDateKey;
  }

  // If created after selected date, don't show yet
  if (habit.date > currentDateKey) {
    return false;
  }

  if (freq === 'daily') {
    return true;
  }

  if (freq === 'weekdays') {
    const day = selectedDate.getDay();
    return day >= 1 && day <= 5;
  }

  if (freq === 'custom_days') {
    const day = selectedDate.getDay();
    return habit.repeatDays ? habit.repeatDays.includes(day) : false;
  }

  return habit.date === currentDateKey;
};

export const isHabitCompletedForDate = (habit: {
  completed: boolean;
  date: string;
  frequency?: string;
  completedDates?: string[];
}, dateKey: string): boolean => {
  if (Array.isArray(habit.completedDates) && habit.completedDates.includes(dateKey)) {
    return true;
  }
  const freq = habit.frequency || 'once';
  if (freq === 'once' || !habit.completedDates || habit.completedDates.length === 0) {
    return habit.date === dateKey ? Boolean(habit.completed) : false;
  }
  return false;
};