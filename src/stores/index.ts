import { useUserStore } from './useUserStore';
import { useHabitsStore } from './useHabitsStore';
import { useFitnessStore } from './useFitnessStore';
import { useNutritionStore } from './useNutritionStore';
import { useFinanceStore } from './useFinanceStore';
import { useNotesStore } from './useNotesStore';
import { useLearningStore } from './useLearningStore';

export * from './useUserStore';
export * from './useHabitsStore';
export * from './useFitnessStore';
export * from './useNutritionStore';
export * from './useFinanceStore';
export * from './useNotesStore';
export * from './useLearningStore';

/**
 * Pre-warm all global stores in parallel on application launch
 */
export async function initializeAllStores(force = false) {
  await Promise.all([
    useUserStore.getState().loadUserName(force),
    useHabitsStore.getState().loadHabits(force),
    useFitnessStore.getState().loadFitness(force),
    useNutritionStore.getState().loadNutrition(force),
    useFinanceStore.getState().loadFinance(force),
    useNotesStore.getState().loadNotes(force),
    useLearningStore.getState().loadCourses(force),
  ]);
}
