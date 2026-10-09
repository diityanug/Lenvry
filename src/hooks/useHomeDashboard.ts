import { useMemo, useCallback } from 'react';
import {
  formatDateKey,
  isHabitActiveForDate,
  isHabitCompletedForDate,
} from '../constants/habits';
import {
  useUserStore,
  useHabitsStore,
  useFitnessStore,
  useNutritionStore,
  useFinanceStore,
  useNotesStore,
  initializeAllStores,
} from '../stores';
import { StickyNote } from '../types/notes';

export function useHomeDashboard() {
  const userName = useUserStore((s) => s.userName);
  const setUserName = useUserStore((s) => s.updateUserName);

  const habits = useHabitsStore((s) => s.habits);
  const toggleHabitForDate = useHabitsStore((s) => s.toggleHabitForDate);

  const transactions = useFinanceStore((s) => s.transactions);
  const workouts = useFitnessStore((s) => s.workouts);

  const nutritionLogs = useNutritionStore((s) => s.logs);
  const calorieTarget = useNutritionStore((s) => s.target.calories);

  const notes = useNotesStore((s) => s.notes);
  const saveNote = useNotesStore((s) => s.saveNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);

  const todayDateObj = useMemo(() => new Date(), []);
  const habitKey = useMemo(() => formatDateKey(todayDateObj), [todayDateObj]);
  const dateIsoKey = useMemo(() => todayDateObj.toISOString().split('T')[0], [todayDateObj]);

  const todayExpenses = useMemo(() => {
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return (
          d.getFullYear() === todayDateObj.getFullYear() &&
          d.getMonth() === todayDateObj.getMonth() &&
          d.getDate() === todayDateObj.getDate() &&
          t.type === 'expense'
        );
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, todayDateObj]);

  const todayHabits = useMemo(() => {
    return habits.filter((h) => isHabitActiveForDate(h, todayDateObj));
  }, [habits, todayDateObj]);

  const habitTotalCount = todayHabits.length;
  const habitCompletedCount = useMemo(() => {
    return todayHabits.filter((h) => isHabitCompletedForDate(h, habitKey)).length;
  }, [todayHabits, habitKey]);

  const todayWorkoutCount = useMemo(() => {
    return workouts.filter((w) => w.date === dateIsoKey).length;
  }, [workouts, dateIsoKey]);

  const todayCaloriesConsumed = useMemo(() => {
    return nutritionLogs
      .filter((l) => l.date === dateIsoKey)
      .reduce((sum, item) => sum + (item.calories || 0), 0);
  }, [nutritionLogs, dateIsoKey]);

  const toggleHabitOnHome = useCallback(
    async (id: string) => {
      await toggleHabitForDate(id, habitKey);
    },
    [toggleHabitForDate, habitKey]
  );

  const handleSaveStickyNote = useCallback(
    async (savedNote: StickyNote) => {
      await saveNote(savedNote);
    },
    [saveNote]
  );

  const handleDeleteStickyNote = useCallback(
    async (id: string) => {
      await deleteNote(id);
    },
    [deleteNote]
  );

  const fetchDashboardData = useCallback(async () => {
    await initializeAllStores();
  }, []);

  return {
    userName,
    setUserName,
    todayExpenses,
    habitCompletedCount,
    habitTotalCount,
    todayHabits,
    todayWorkoutCount,
    todayCaloriesConsumed,
    calorieTarget,
    notes,
    fetchDashboardData,
    toggleHabitOnHome,
    handleSaveStickyNote,
    handleDeleteStickyNote,
  };
}
