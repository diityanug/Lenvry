import { create } from 'zustand';
import { readStored, writeStored } from '../storage';
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
  loadNutrition: () => Promise<void>;
  addLog: (log: NutritionLog) => Promise<void>;
  updateLog: (log: NutritionLog) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  setLogs: (logs: NutritionLog[]) => Promise<void>;
  setTarget: (target: NutritionTarget) => Promise<void>;
  setCustomFoods: (foods: FoodItem[]) => Promise<void>;
  setWaterLogs: (logs: WaterLog[]) => Promise<void>;
  logWater: (amountMl: number, dateStr: string) => Promise<void>;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  logs: [],
  customFoods: [],
  target: DEFAULT_NUTRITION_TARGET,
  waterLogs: [],
  isLoaded: false,
  loadNutrition: async () => {
    try {
      const [logs, customFoods, target, waterLogs] = await Promise.all([
        readStored('nutritionLogs'),
        readStored('customFoods'),
        readStored('nutritionTargets'),
        readStored('waterLogs'),
      ]);

      set({
        logs: logs ?? [],
        customFoods: customFoods ?? [],
        target: target ?? DEFAULT_NUTRITION_TARGET,
        waterLogs: waterLogs ?? [],
        isLoaded: true,
      });
    } catch (e) {
      console.warn('Failed to load nutrition data', e);
    }
  },
  addLog: async (log: NutritionLog) => {
    const updated = [log, ...get().logs];
    set({ logs: updated });
    try {
      await writeStored('nutritionLogs', updated);
    } catch (e) {
      console.warn('Failed to add nutrition log', e);
    }
  },
  updateLog: async (log: NutritionLog) => {
    const updated = get().logs.map((l) => (l.id === log.id ? log : l));
    set({ logs: updated });
    try {
      await writeStored('nutritionLogs', updated);
    } catch (e) {
      console.warn('Failed to update nutrition log', e);
    }
  },
  deleteLog: async (id: string) => {
    const updated = get().logs.filter((l) => l.id !== id);
    set({ logs: updated });
    try {
      await writeStored('nutritionLogs', updated);
    } catch (e) {
      console.warn('Failed to delete nutrition log', e);
    }
  },
  setLogs: async (logs: NutritionLog[]) => {
    set({ logs });
    try {
      await writeStored('nutritionLogs', logs);
    } catch (e) {
      console.warn('Failed to persist nutrition logs', e);
    }
  },
  setTarget: async (target: NutritionTarget) => {
    set({ target });
    try {
      await writeStored('nutritionTargets', target);
    } catch (e) {
      console.warn('Failed to persist nutrition target', e);
    }
  },
  setCustomFoods: async (foods: FoodItem[]) => {
    set({ customFoods: foods });
    try {
      await writeStored('customFoods', foods);
    } catch (e) {
      console.warn('Failed to persist custom foods', e);
    }
  },
  setWaterLogs: async (waterLogs: WaterLog[]) => {
    set({ waterLogs });
    try {
      await writeStored('waterLogs', waterLogs);
    } catch (e) {
      console.warn('Failed to persist water logs', e);
    }
  },
  logWater: async (amountMl: number, dateStr: string) => {
    const current = get().waterLogs;
    const existing = current.find((w) => w.date === dateStr);
    let updated: WaterLog[];

    if (existing) {
      updated = current.map((w) =>
        w.date === dateStr ? { ...w, amountMl: Math.max(0, w.amountMl + amountMl) } : w
      );
    } else {
      updated = [{ date: dateStr, amountMl: Math.max(0, amountMl), targetMl: 2000 }, ...current];
    }

    set({ waterLogs: updated });
    try {
      await writeStored('waterLogs', updated);
    } catch (e) {
      console.warn('Failed to persist water logs', e);
    }
  },
}));
