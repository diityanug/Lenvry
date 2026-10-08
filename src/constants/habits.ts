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
  { icon: 'moon-outline', label: 'Faith', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' },
  { icon: 'heart-outline', label: 'Spiritual', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.16)' },
  { icon: 'fitness-outline', label: 'Health', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' },
  { icon: 'barbell-outline', label: 'Fitness', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' },
  { icon: 'leaf-outline', label: 'Mindful', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.16)' },
  { icon: 'book-outline', label: 'Learning', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.16)' },
  { icon: 'briefcase-outline', label: 'Work', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' },
  { icon: 'flame-outline', label: 'Focus', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.16)' },
  { icon: 'flash-outline', label: 'Energy', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.16)' },
  { icon: 'water-outline', label: 'Hydrate', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.16)' },
  { icon: 'bed-outline', label: 'Sleep', color: '#818CF8', bg: 'rgba(129, 140, 248, 0.16)' },
  { icon: 'sunny-outline', label: 'Morning', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' },
  { icon: 'time-outline', label: 'Routine', color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.16)' },
  { icon: 'wallet-outline', label: 'Finance', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' },
  { icon: 'people-outline', label: 'Social', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.16)' },
  { icon: 'happy-outline', label: 'Wellbeing', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.16)' },
  { icon: 'brush-outline', label: 'Creative', color: '#D946EF', bg: 'rgba(217, 70, 239, 0.16)' },
  { icon: 'musical-notes-outline', label: 'Music', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.16)' },
  { icon: 'walk-outline', label: 'Walking', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' },
  { icon: 'bicycle-outline', label: 'Cycling', color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.16)' },
  { icon: 'trophy-outline', label: 'Goals', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' },
  { icon: 'sparkles-outline', label: 'Habits', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.16)' },
  { icon: 'compass-outline', label: 'Life', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' },
  { icon: 'pricetag-outline', label: 'General', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.16)' },
];

export const HABIT_DEFAULT_CATEGORY_CONFIG: Record<string, HabitCategoryIconItem> = {
  Health: { icon: 'fitness-outline', label: 'Health', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  Faith: { icon: 'moon-outline', label: 'Faith', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)' },
  Productivity: { icon: 'flash-outline', label: 'Productivity', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.12)' },
  Learning: { icon: 'book-outline', label: 'Learning', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)' },
  Fitness: { icon: 'barbell-outline', label: 'Fitness', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  Mindfulness: { icon: 'leaf-outline', label: 'Mindfulness', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)' },
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