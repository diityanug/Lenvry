import { useState, useMemo, useCallback } from 'react';
import {
  formatDateKey,
  isHabitActiveForDate,
  isHabitCompletedForDate,
} from '../constants/habits';
import { useDayRollover } from './useDayRollover';
import {
  useUserStore,
  useHabitsStore,
  useFitnessStore,
  useNutritionStore,
  useFinanceStore,
  useNotesStore,
  useLearningStore,
  initializeAllStores,
} from '../stores';
import { StickyNote } from '../types/notes';
import { LearningCourse, LearningStatus } from '../types/learning';
import { buildAccountsById, computeTodayExpensesIDR } from '../utils/financeCalculations';

export function useHomeDashboard() {
  const userName = useUserStore((s) => s.userName);
  const setUserName = useUserStore((s) => s.updateUserName);

  const habits = useHabitsStore((s) => s.habits);
  const toggleHabitForDate = useHabitsStore((s) => s.toggleHabitForDate);

  const transactions = useFinanceStore((s) => s.transactions);
  const accounts = useFinanceStore((s) => s.accounts);
  const workouts = useFitnessStore((s) => s.workouts);

  const nutritionLogs = useNutritionStore((s) => s.logs);
  const calorieTarget = useNutritionStore((s) => s.target.calories);

  const notes = useNotesStore((s) => s.notes);
  const saveNote = useNotesStore((s) => s.saveNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);

  const courses = useLearningStore((s) => s.courses);
  const saveCourse = useLearningStore((s) => s.saveCourse);
  const deleteCourse = useLearningStore((s) => s.deleteCourse);
  const updateCourseStatus = useLearningStore((s) => s.updateCourseStatus);

  const [currentDate, setCurrentDate] = useState(() => new Date());

  useDayRollover((now) => {
    setCurrentDate((prev) => (formatDateKey(prev) === formatDateKey(now) ? prev : now));
  });

  const todayDateObj = currentDate;
  const habitKey = useMemo(() => formatDateKey(todayDateObj), [todayDateObj]);
  const localDateKey = useMemo(() => formatDateKey(todayDateObj), [todayDateObj]);

  const accountsById = useMemo(() => buildAccountsById(accounts), [accounts]);

  const todayExpenses = useMemo(
    () => computeTodayExpensesIDR(transactions, accountsById, todayDateObj),
    [transactions, accountsById, todayDateObj]
  );

  const todayHabits = useMemo(() => {
    return habits.filter((h) => isHabitActiveForDate(h, todayDateObj));
  }, [habits, todayDateObj]);

  const habitTotalCount = todayHabits.length;
  const habitCompletedCount = useMemo(() => {
    return todayHabits.filter((h) => isHabitCompletedForDate(h, habitKey)).length;
  }, [todayHabits, habitKey]);

  const todayWorkoutCount = useMemo(() => {
    return workouts.filter((w) => w.date === localDateKey).length;
  }, [workouts, localDateKey]);

  const todayCaloriesConsumed = useMemo(() => {
    return nutritionLogs
      .filter((l) => l.date === localDateKey)
      .reduce((sum, item) => sum + (item.calories || 0), 0);
  }, [nutritionLogs, localDateKey]);

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

  const handleSaveCourse = useCallback(
    async (savedCourse: LearningCourse) => {
      await saveCourse(savedCourse);
    },
    [saveCourse]
  );

  const handleDeleteCourse = useCallback(
    async (id: string) => {
      await deleteCourse(id);
    },
    [deleteCourse]
  );

  const handleUpdateCourseStatus = useCallback(
    async (id: string, status: LearningStatus) => {
      await updateCourseStatus(id, status);
    },
    [updateCourseStatus]
  );

  const fetchDashboardData = useCallback(async () => {
    await initializeAllStores(true);
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
    courses,
    todayDateObj,
    habitKey,
    fetchDashboardData,
    toggleHabitOnHome,
    handleSaveStickyNote,
    handleDeleteStickyNote,
    handleSaveCourse,
    handleDeleteCourse,
    handleUpdateCourseStatus,
  };
}
