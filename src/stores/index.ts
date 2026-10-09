import { useUserStore } from './useUserStore';
import { useHabitsStore } from './useHabitsStore';
import { useFitnessStore } from './useFitnessStore';
import { useNutritionStore } from './useNutritionStore';
import { useFinanceStore } from './useFinanceStore';
import { useNotesStore } from './useNotesStore';

export * from './useUserStore';
export * from './useHabitsStore';
export * from './useFitnessStore';
export * from './useNutritionStore';
export * from './useFinanceStore';
export * from './useNotesStore';

/**
 * Pre-warm all global stores in parallel on application launch
 */
export async function initializeAllStores() {
  await Promise.all([
    useUserStore.getState().loadUserName(),
    useHabitsStore.getState().loadHabits(),
    useFitnessStore.getState().loadFitness(),
    useNutritionStore.getState().loadNutrition(),
    useFinanceStore.getState().loadFinance(),
    useNotesStore.getState().loadNotes(),
  ]);
}
