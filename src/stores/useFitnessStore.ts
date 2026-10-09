import { create } from 'zustand';
import { readStored, writeStored } from '../storage';
import { Workout } from '../types/fitness';

interface FitnessState {
  workouts: Workout[];
  isLoaded: boolean;
  loadFitness: () => Promise<void>;
  addWorkout: (workout: Workout) => Promise<void>;
  updateWorkout: (workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  setWorkouts: (workouts: Workout[]) => Promise<void>;
}

export const useFitnessStore = create<FitnessState>((set, get) => ({
  workouts: [],
  isLoaded: false,
  loadFitness: async () => {
    try {
      const stored = await readStored('fitnessWorkouts');
      set({ workouts: stored ?? [], isLoaded: true });
    } catch (e) {
      console.warn('Failed to load workouts', e);
    }
  },
  addWorkout: async (workout: Workout) => {
    const updated = [workout, ...get().workouts];
    set({ workouts: updated });
    try {
      await writeStored('fitnessWorkouts', updated);
    } catch (e) {
      console.warn('Failed to add workout', e);
    }
  },
  updateWorkout: async (workout: Workout) => {
    const updated = get().workouts.map((w) => (w.id === workout.id ? workout : w));
    set({ workouts: updated });
    try {
      await writeStored('fitnessWorkouts', updated);
    } catch (e) {
      console.warn('Failed to update workout', e);
    }
  },
  deleteWorkout: async (id: string) => {
    const updated = get().workouts.filter((w) => w.id !== id);
    set({ workouts: updated });
    try {
      await writeStored('fitnessWorkouts', updated);
    } catch (e) {
      console.warn('Failed to delete workout', e);
    }
  },
  setWorkouts: async (workouts: Workout[]) => {
    set({ workouts });
    try {
      await writeStored('fitnessWorkouts', workouts);
    } catch (e) {
      console.warn('Failed to persist workouts', e);
    }
  },
}));
