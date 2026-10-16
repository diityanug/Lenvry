import { useState, useEffect, useMemo, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
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
  useLearningStore,
  initializeAllStores,
} from '../stores';
import { StickyNote } from '../types/notes';
import { LearningCourse, LearningStatus } from '../types/learning';

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

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const now = new Date();
        setCurrentDate((prev) => {
          if (
            prev.getDate() !== now.getDate() ||
            prev.getMonth() !== now.getMonth() ||
            prev.getFullYear() !== now.getFullYear()
          ) {
            return now;
          }
          return prev;
        });
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);

    const intervalId = setInterval(() => {
      const now = new Date();
      setCurrentDate((prev) => {
        if (
          prev.getDate() !== now.getDate() ||
          prev.getMonth() !== now.getMonth() ||
          prev.getFullYear() !== now.getFullYear()
        ) {
          return now;
        }
        return prev;
      });
    }, 30000);

    return () => {
      sub.remove();
      clearInterval(intervalId);
    };
  }, []);

  const todayDateObj = currentDate;
  const habitKey = useMemo(() => formatDateKey(todayDateObj), [todayDateObj]);
  const localDateKey = useMemo(() => formatDateKey(todayDateObj), [todayDateObj]);

  const todayExpenses = useMemo(() => {
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        const isToday =
          d.getFullYear() === todayDateObj.getFullYear() &&
          d.getMonth() === todayDateObj.getMonth() &&
          d.getDate() === todayDateObj.getDate();
        if (!isToday || t.type !== 'expense') return false;

        // Isolate IDR transactions so USD accounts ($ amounts) aren't mixed with Rupiah
        const acc = accounts.find((a) => a.id === t.accountId);
        return acc ? acc.currency !== 'USD' : true;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, accounts, todayDateObj]);

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
