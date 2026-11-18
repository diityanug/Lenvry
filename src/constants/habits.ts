import { formatDateKey, formatDisplayDate } from './date';

export const DEFAULT_CATEGORIES = [
  'Health',
  'Faith',
  'Productivity',
  'Learning',
  'Fitness',
  'Mindfulness',
];

export interface HabitCategoryIconItem {
  icon: string;
  label: string;
  color: string;
  bg: string;
}

export const AVAILABLE_HABIT_ICONS: HabitCategoryIconItem[] = [
  { icon: 'moon-outline', label: 'Faith', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)' },
  { icon: 'heart-outline', label: 'Spiritual', color: '#B84B6E', bg: 'rgba(184, 75, 110, 0.12)' },
  { icon: 'fitness-outline', label: 'Health', color: '#16794B', bg: 'rgba(22, 121, 75, 0.12)' },
  { icon: 'barbell-outline', label: 'Fitness', color: '#C96D12', bg: 'rgba(201, 109, 18, 0.12)' },
  { icon: 'leaf-outline', label: 'Mindful', color: '#3D7A5A', bg: 'rgba(61, 122, 90, 0.12)' },
  { icon: 'book-outline', label: 'Learning', color: '#B85D43', bg: 'rgba(184, 93, 67, 0.12)' },
  { icon: 'briefcase-outline', label: 'Work', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)' },
  { icon: 'flame-outline', label: 'Focus', color: '#C93B3B', bg: 'rgba(201, 59, 59, 0.12)' },
  { icon: 'flash-outline', label: 'Energy', color: '#C96D12', bg: 'rgba(201, 109, 18, 0.12)' },
  { icon: 'water-outline', label: 'Hydrate', color: '#0D8A7E', bg: 'rgba(13, 138, 126, 0.12)' },
  { icon: 'bed-outline', label: 'Sleep', color: '#4F5BD5', bg: 'rgba(79, 91, 213, 0.12)' },
  { icon: 'sunny-outline', label: 'Morning', color: '#C96D12', bg: 'rgba(201, 109, 18, 0.12)' },
  { icon: 'time-outline', label: 'Routine', color: '#0D8A7E', bg: 'rgba(13, 138, 126, 0.12)' },
  { icon: 'wallet-outline', label: 'Finance', color: '#16794B', bg: 'rgba(22, 121, 75, 0.12)' },
  { icon: 'people-outline', label: 'Social', color: '#C93B3B', bg: 'rgba(201, 59, 59, 0.12)' },
  { icon: 'happy-outline', label: 'Wellbeing', color: '#C96D12', bg: 'rgba(201, 109, 18, 0.12)' },
  { icon: 'brush-outline', label: 'Creative', color: '#8E558A', bg: 'rgba(142, 85, 138, 0.12)' },
  { icon: 'musical-notes-outline', label: 'Music', color: '#B85D43', bg: 'rgba(184, 93, 67, 0.12)' },
  { icon: 'walk-outline', label: 'Walking', color: '#3D7A5A', bg: 'rgba(61, 122, 90, 0.12)' },
  { icon: 'bicycle-outline', label: 'Cycling', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)' },
  { icon: 'trophy-outline', label: 'Goals', color: '#C96D12', bg: 'rgba(201, 109, 18, 0.12)' },
  { icon: 'sparkles-outline', label: 'Habits', color: '#B85D43', bg: 'rgba(184, 93, 67, 0.12)' },
  { icon: 'compass-outline', label: 'Life', color: '#0D8A7E', bg: 'rgba(13, 138, 126, 0.12)' },
  { icon: 'pricetag-outline', label: 'General', color: '#57524A', bg: 'rgba(87, 82, 74, 0.12)' },
];

export const HABIT_DEFAULT_CATEGORY_CONFIG: Record<string, HabitCategoryIconItem> = {
  Health: { icon: 'fitness-outline', label: 'Health', color: '#16794B', bg: 'rgba(22, 121, 75, 0.12)' },
  Faith: { icon: 'moon-outline', label: 'Faith', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)' },
  Productivity: { icon: 'flash-outline', label: 'Productivity', color: '#C96D12', bg: 'rgba(201, 109, 18, 0.12)' },
  Learning: { icon: 'book-outline', label: 'Learning', color: '#B85D43', bg: 'rgba(184, 93, 67, 0.12)' },
  Fitness: { icon: 'barbell-outline', label: 'Fitness', color: '#C96D12', bg: 'rgba(201, 109, 18, 0.12)' },
  Mindfulness: { icon: 'leaf-outline', label: 'Mindfulness', color: '#3D7A5A', bg: 'rgba(61, 122, 90, 0.12)' },
};

export { formatDateKey, formatDisplayDate };

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
