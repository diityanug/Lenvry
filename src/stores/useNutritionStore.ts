import { create } from 'zustand';
import { readManyStored, updateStored, writeStored } from '../storage';
import {
  NutritionLog,
  NutritionTarget,
  WaterLog,
  DEFAULT_NUTRITION_TARGET,
  FoodItem,
} from '../types/nutrition';

interface NutritionState {
  logs: NutritionLog[];
  customFoods: FoodItem[];
  target: NutritionTarget;
  waterLogs: WaterLog[];
  isLoaded: boolean;
  loadNutrition: (force?: boolean) => Promise<void>;
  addLog: (log: NutritionLog) => Promise<boolean>;
  updateLog: (log: NutritionLog) => Promise<boolean>;
  deleteLog: (id: string) => Promise<boolean>;
  setLogs: (logs: NutritionLog[]) => Promise<boolean>;
  setTarget: (target: NutritionTarget) => Promise<boolean>;
  setCustomFoods: (foods: FoodItem[]) => Promise<boolean>;
  setWaterLogs: (logs: WaterLog[]) => Promise<boolean>;
  logWater: (amountMl: number, dateStr: string) => Promise<boolean>;
}

function applyWaterDelta(current: WaterLog[], amountMl: number, dateStr: string): WaterLog[] {
  const existing = current.find((w) => w.date === dateStr);
  if (existing) {
    return current.map((w) =>
      w.date === dateStr ? { ...w, amountMl: Math.max(0, w.amountMl + amountMl) } : w
    );
  }
  return [{ date: dateStr, amountMl: Math.max(0, amountMl), targetMl: 2000 }, ...current];
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  logs: [],
  customFoods: [],
  target: DEFAULT_NUTRITION_TARGET,
  waterLogs: [],
  isLoaded: false,
  loadNutrition: async (force = false) => {
    if (get().isLoaded && !force) return;
    try {
      const stored = await readManyStored([
        'nutritionLogs',
        'customFoods',
        'nutritionTargets',
        'waterLogs',
      ]);

      set({
        logs: stored.nutritionLogs ?? [],
        customFoods: stored.customFoods ?? [],
        target: stored.nutritionTargets ?? DEFAULT_NUTRITION_TARGET,
        waterLogs: stored.waterLogs ?? [],
        isLoaded: true,
      });
    } catch (e) {
      console.warn('Failed to load nutrition data', e);
    }
  },
  addLog: async (log: NutritionLog) => {
    const previous = get().logs;
    set({ logs: [log, ...previous] });
    try {
      const persisted = await updateStored('nutritionLogs', (current) => [log, ...current]);
      set({ logs: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to add nutrition log', e);
      set({ logs: previous });
      return false;
    }
  },
  updateLog: async (log: NutritionLog) => {
    const previous = get().logs;
    set({ logs: previous.map((l) => (l.id === log.id ? log : l)) });
    try {
      const persisted = await updateStored('nutritionLogs', (current) =>
        current.map((l) => (l.id === log.id ? log : l))
      );
      set({ logs: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to update nutrition log', e);
      set({ logs: previous });
      return false;
    }
  },
  deleteLog: async (id: string) => {
    const previous = get().logs;
    set({ logs: previous.filter((l) => l.id !== id) });
    try {
      const persisted = await updateStored('nutritionLogs', (current) =>
        current.filter((l) => l.id !== id)
      );
      set({ logs: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to delete nutrition log', e);
      set({ logs: previous });
      return false;
    }
  },
  setLogs: async (logs: NutritionLog[]) => {
    const previous = get().logs;
    set({ logs });
    try {
      const persisted = await writeStored('nutritionLogs', logs);
      set({ logs: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist nutrition logs', e);
      set({ logs: previous });
      return false;
    }
  },
  setTarget: async (target: NutritionTarget) => {
    const previous = get().target;
    set({ target });
    try {
      const persisted = await writeStored('nutritionTargets', target);
      set({ target: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist nutrition target', e);
      set({ target: previous });
      return false;
    }
  },
  setCustomFoods: async (foods: FoodItem[]) => {
    const previous = get().customFoods;
    set({ customFoods: foods });
    try {
      const persisted = await writeStored('customFoods', foods);
      set({ customFoods: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist custom foods', e);
      set({ customFoods: previous });
      return false;
    }
  },
  setWaterLogs: async (waterLogs: WaterLog[]) => {
    const previous = get().waterLogs;
    set({ waterLogs });
    try {
      const persisted = await writeStored('waterLogs', waterLogs);
      set({ waterLogs: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist water logs', e);
      set({ waterLogs: previous });
      return false;
    }
  },
  logWater: async (amountMl: number, dateStr: string) => {
    const previous = get().waterLogs;
    set({ waterLogs: applyWaterDelta(previous, amountMl, dateStr) });
    try {
      const persisted = await updateStored('waterLogs', (current) =>
        applyWaterDelta(current, amountMl, dateStr)
      );
      set({ waterLogs: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist water logs', e);
      set({ waterLogs: previous });
      return false;
    }
  },
}));
