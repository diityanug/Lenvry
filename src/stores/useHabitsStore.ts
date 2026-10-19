import { create } from 'zustand';
import { HabitCategoryIconMap, readManyStored, writeStored } from '../storage';
import { Habit } from '../types/habits';
import {
  DEFAULT_CATEGORIES,
  HABIT_DEFAULT_CATEGORY_CONFIG,
  formatDateKey,
} from '../constants/habits';
import { hapticSuccess, hapticLight } from '../utils/haptics';

interface HabitsState {
  habits: Habit[];
  categories: string[];
  categoryConfigs: HabitCategoryIconMap;
  isLoaded: boolean;
  loadHabits: () => Promise<void>;
  addHabit: (habit: Habit) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitForDate: (id: string, dateStr?: string) => Promise<void>;
  setHabits: (habits: Habit[]) => Promise<void>;
  setCategories: (categories: string[]) => Promise<void>;
  setCategoryConfigs: (configs: HabitCategoryIconMap) => Promise<void>;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  categories: DEFAULT_CATEGORIES,
  categoryConfigs: HABIT_DEFAULT_CATEGORY_CONFIG,
  isLoaded: false,
  loadHabits: async () => {
    try {
      const stored = await readManyStored(['habits', 'habitCategories', 'habitCategoryIcons']);
      set({
        habits: stored.habits ?? [],
        categories: stored.habitCategories ?? DEFAULT_CATEGORIES,
        categoryConfigs: {
          ...HABIT_DEFAULT_CATEGORY_CONFIG,
          ...(stored.habitCategoryIcons ?? {}),
        },
        isLoaded: true,
      });
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
    const todayKey = formatDateKey(new Date());
    const habitKey = dateStr || todayKey;
    const targetHabit = get().habits.find((h) => h.id === id);
    const willBeCompleted = targetHabit
      ? (!targetHabit.frequency || targetHabit.frequency === 'once'
          ? !targetHabit.completed
          : !(targetHabit.completedDates ?? []).includes(habitKey))
      : false;

    if (willBeCompleted) {
      hapticSuccess();
    } else {
      hapticLight();
    }

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
        completed: nextDates.includes(todayKey),
        completedDates: nextDates,
      };
    });

    set({ habits: updated });
    try {
      await writeStored('habits', updated);
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
  setCategories: async (categories: string[]) => {
    set({ categories });
    try {
      await writeStored('habitCategories', categories);
    } catch (e) {
      console.warn('Failed to persist habit categories', e);
    }
  },
  setCategoryConfigs: async (categoryConfigs: HabitCategoryIconMap) => {
    set({ categoryConfigs });
    try {
      await writeStored('habitCategoryIcons', categoryConfigs);
    } catch (e) {
      console.warn('Failed to persist habit category icons', e);
    }
  },
}));
