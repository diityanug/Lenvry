import { create } from 'zustand';
import { readStored, updateStored, writeStored } from '../storage';
import { Workout } from '../types/fitness';

interface FitnessState {
  workouts: Workout[];
  isLoaded: boolean;
  loadFitness: (force?: boolean) => Promise<void>;
  addWorkout: (workout: Workout) => Promise<boolean>;
  updateWorkout: (workout: Workout) => Promise<boolean>;
  deleteWorkout: (id: string) => Promise<boolean>;
  setWorkouts: (workouts: Workout[]) => Promise<boolean>;
}

export const useFitnessStore = create<FitnessState>((set, get) => ({
  workouts: [],
  isLoaded: false,
  loadFitness: async (force = false) => {
    if (get().isLoaded && !force) return;
    try {
      const stored = await readStored('fitnessWorkouts');
      set({ workouts: stored ?? [], isLoaded: true });
    } catch (e) {
      console.warn('Failed to load workouts', e);
    }
  },
  addWorkout: async (workout: Workout) => {
    const previous = get().workouts;
    set({ workouts: [workout, ...previous] });
    try {
      const persisted = await updateStored('fitnessWorkouts', (current) => [workout, ...current]);
      set({ workouts: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to add workout', e);
      set({ workouts: previous });
      return false;
    }
  },
  updateWorkout: async (workout: Workout) => {
    const previous = get().workouts;
    set({ workouts: previous.map((w) => (w.id === workout.id ? workout : w)) });
    try {
      const persisted = await updateStored('fitnessWorkouts', (current) =>
        current.map((w) => (w.id === workout.id ? workout : w))
      );
      set({ workouts: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to update workout', e);
      set({ workouts: previous });
      return false;
    }
  },
  deleteWorkout: async (id: string) => {
    const previous = get().workouts;
    set({ workouts: previous.filter((w) => w.id !== id) });
    try {
      const persisted = await updateStored('fitnessWorkouts', (current) =>
        current.filter((w) => w.id !== id)
      );
      set({ workouts: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to delete workout', e);
      set({ workouts: previous });
      return false;
    }
  },
  setWorkouts: async (workouts: Workout[]) => {
    const previous = get().workouts;
    set({ workouts });
    try {
      const persisted = await writeStored('fitnessWorkouts', workouts);
      set({ workouts: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist workouts', e);
      set({ workouts: previous });
      return false;
    }
  },
}));
