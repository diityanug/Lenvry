import { create } from 'zustand';
import { HabitCategoryIconMap, readManyStored, updateStored, writeStored } from '../storage';
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
  loadHabits: (force?: boolean) => Promise<void>;
  addHabit: (habit: Habit) => Promise<boolean>;
  updateHabit: (habit: Habit) => Promise<boolean>;
  deleteHabit: (id: string) => Promise<boolean>;
  toggleHabitForDate: (id: string, dateStr?: string) => Promise<boolean>;
  completeHabitForDate: (id: string, dateStr?: string) => Promise<boolean>;
  setHabits: (habits: Habit[]) => Promise<boolean>;
  setCategories: (categories: string[]) => Promise<boolean>;
  setCategoryConfigs: (configs: HabitCategoryIconMap) => Promise<boolean>;
}

function applyToggleHabit(habit: Habit, habitKey: string, todayKey: string): Habit {
  const isFreqOnce = !habit.frequency || habit.frequency === 'once';
  const dates = habit.completedDates ?? [];

  if (isFreqOnce) {
    const nextCompleted = !habit.completed;
    const nextDates = nextCompleted
      ? Array.from(new Set([...dates, habitKey]))
      : dates.filter((d) => d !== habitKey);
    return { ...habit, completed: nextCompleted, completedDates: nextDates };
  }

  const exists = dates.includes(habitKey);
  const nextDates = exists ? dates.filter((d) => d !== habitKey) : [...dates, habitKey];
  return {
    ...habit,
    completed: nextDates.includes(todayKey),
    completedDates: nextDates,
  };
}

function applyCompleteHabit(habit: Habit, habitKey: string, todayKey: string): Habit {
  const isFreqOnce = !habit.frequency || habit.frequency === 'once';
  const nextDates = Array.from(new Set([...(habit.completedDates ?? []), habitKey]));
  return {
    ...habit,
    completed: isFreqOnce ? true : nextDates.includes(todayKey),
    completedDates: nextDates,
  };
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  categories: DEFAULT_CATEGORIES,
  categoryConfigs: HABIT_DEFAULT_CATEGORY_CONFIG,
  isLoaded: false,
  loadHabits: async (force = false) => {
    if (get().isLoaded && !force) return;
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
    const previous = get().habits;
    set({ habits: [habit, ...previous] });
    try {
      const persisted = await updateStored('habits', (current) => [habit, ...current]);
      set({ habits: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to save habit', e);
      set({ habits: previous });
      return false;
    }
  },
  updateHabit: async (habit: Habit) => {
    const previous = get().habits;
    set({ habits: previous.map((h) => (h.id === habit.id ? habit : h)) });
    try {
      const persisted = await updateStored('habits', (current) =>
        current.map((h) => (h.id === habit.id ? habit : h))
      );
      set({ habits: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to update habit', e);
      set({ habits: previous });
      return false;
    }
  },
  deleteHabit: async (id: string) => {
    const previous = get().habits;
    set({ habits: previous.filter((h) => h.id !== id) });
    try {
      const persisted = await updateStored('habits', (current) => current.filter((h) => h.id !== id));
      set({ habits: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to delete habit', e);
      set({ habits: previous });
      return false;
    }
  },
  toggleHabitForDate: async (id: string, dateStr?: string) => {
    const todayKey = formatDateKey(new Date());
    const habitKey = dateStr || todayKey;
    const previous = get().habits;
    const targetHabit = previous.find((h) => h.id === id);
    const willBeCompleted = targetHabit
      ? !targetHabit.frequency || targetHabit.frequency === 'once'
        ? !targetHabit.completed
        : !(targetHabit.completedDates ?? []).includes(habitKey)
      : false;

    if (willBeCompleted) {
      hapticSuccess();
    } else {
      hapticLight();
    }

    set({
      habits: previous.map((h) => (h.id === id ? applyToggleHabit(h, habitKey, todayKey) : h)),
    });
    try {
      const persisted = await updateStored('habits', (current) =>
        current.map((h) => (h.id === id ? applyToggleHabit(h, habitKey, todayKey) : h))
      );
      set({ habits: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to toggle habit', e);
      set({ habits: previous });
      return false;
    }
  },
  completeHabitForDate: async (id: string, dateStr?: string) => {
    const todayKey = formatDateKey(new Date());
    const habitKey = dateStr || todayKey;
    const previous = get().habits;

    set({
      habits: previous.map((h) => (h.id === id ? applyCompleteHabit(h, habitKey, todayKey) : h)),
    });
    try {
      const persisted = await updateStored('habits', (current) =>
        current.map((h) => (h.id === id ? applyCompleteHabit(h, habitKey, todayKey) : h))
      );
      set({ habits: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to complete habit', e);
      set({ habits: previous });
      return false;
    }
  },
  setHabits: async (habits: Habit[]) => {
    const previous = get().habits;
    set({ habits });
    try {
      const persisted = await writeStored('habits', habits);
      set({ habits: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist habits', e);
      set({ habits: previous });
      return false;
    }
  },
  setCategories: async (categories: string[]) => {
    const previous = get().categories;
    set({ categories });
    try {
      const persisted = await writeStored('habitCategories', categories);
      set({ categories: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist habit categories', e);
      set({ categories: previous });
      return false;
    }
  },
  setCategoryConfigs: async (categoryConfigs: HabitCategoryIconMap) => {
    const previous = get().categoryConfigs;
    set({ categoryConfigs });
    try {
      const persisted = await writeStored('habitCategoryIcons', categoryConfigs);
      set({
        categoryConfigs: {
          ...HABIT_DEFAULT_CATEGORY_CONFIG,
          ...persisted,
        },
      });
      return true;
    } catch (e) {
      console.warn('Failed to persist habit category icons', e);
      set({ categoryConfigs: previous });
      return false;
    }
  },
}));
