import { create } from 'zustand';
import { readStored, writeStored, updateStored } from '../storage';
import { Habit } from '../types/habits';
import { HabitCategoryIconItem, HABIT_DEFAULT_CATEGORY_CONFIG, formatDateKey } from '../constants/habits';

interface HabitsState {
  habits: Habit[];
  categories: string[];
  categoryConfigs: Record<string, HabitCategoryIconItem>;
  isLoaded: boolean;
  loadHabits: () => Promise<void>;
  addHabit: (habit: Habit) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitForDate: (id: string, dateStr?: string) => Promise<void>;
  setHabits: (habits: Habit[]) => Promise<void>;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  categories: ['All', 'Health', 'Productivity', 'Mindfulness', 'Fitness', 'Learning'],
  categoryConfigs: HABIT_DEFAULT_CATEGORY_CONFIG,
  isLoaded: false,
  loadHabits: async () => {
    try {
      const stored = await readStored('habits');
      set({ habits: stored ?? [], isLoaded: true });
    } catch (e) {
      console.warn('Failed to load habits', e);
    }
  },
  addHabit: async (habit: Habit) => {
    const updated = [habit, ...get().habits];
    set({ habits: updated });
    try {
      await writeStored('habits', updated);
    } catch (e) {
      console.warn('Failed to save habit', e);
    }
  },
  updateHabit: async (habit: Habit) => {
    const updated = get().habits.map((h) => (h.id === habit.id ? habit : h));
    set({ habits: updated });
    try {
      await writeStored('habits', updated);
    } catch (e) {
      console.warn('Failed to update habit', e);
    }
  },
  deleteHabit: async (id: string) => {
    const updated = get().habits.filter((h) => h.id !== id);
    set({ habits: updated });
    try {
      await writeStored('habits', updated);
    } catch (e) {
      console.warn('Failed to delete habit', e);
    }
  },
  toggleHabitForDate: async (id: string, dateStr?: string) => {
    const habitKey = dateStr || formatDateKey(new Date());

    const updated = get().habits.map((h) => {
      if (h.id !== id) return h;

      const isFreqOnce = !h.frequency || h.frequency === 'once';
      const dates = h.completedDates ?? [];

      if (isFreqOnce) {
        const nextCompleted = !h.completed;
        const nextDates = nextCompleted
          ? Array.from(new Set([...dates, habitKey]))
          : dates.filter((d) => d !== habitKey);
        return {
          ...h,
          completed: nextCompleted,
          completedDates: nextDates,
        };
      }

      const exists = dates.includes(habitKey);
      const nextDates = exists ? dates.filter((d) => d !== habitKey) : [...dates, habitKey];
      return {
        ...h,
        completed: nextDates.includes(habitKey),
        completedDates: nextDates,
      };
    });

    set({ habits: updated });
    try {
      await updateStored('habits', () => updated);
    } catch (e) {
      console.warn('Failed to toggle habit', e);
    }
  },
  setHabits: async (habits: Habit[]) => {
    set({ habits });
    try {
      await writeStored('habits', habits);
    } catch (e) {
      console.warn('Failed to persist habits', e);
    }
  },
}));
