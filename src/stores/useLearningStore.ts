import { create } from 'zustand';
import { readStored, updateStored } from '../storage';
import { LearningCourse, LearningStatus } from '../types/learning';

interface LearningState {
  courses: LearningCourse[];
  isLoaded: boolean;
  loadCourses: (force?: boolean) => Promise<void>;
  saveCourse: (course: LearningCourse) => Promise<boolean>;
  deleteCourse: (id: string) => Promise<boolean>;
  updateCourseStatus: (id: string, status: LearningStatus) => Promise<boolean>;
}

function upsertCourse(list: LearningCourse[], course: LearningCourse): LearningCourse[] {
  const exists = list.some((c) => c.id === course.id);
  return exists ? list.map((c) => (c.id === course.id ? course : c)) : [course, ...list];
}

export const useLearningStore = create<LearningState>((set, get) => ({
  courses: [],
  isLoaded: false,
  loadCourses: async (force = false) => {
    if (get().isLoaded && !force) return;
    try {
      const stored = await readStored('learningCourses');
      set({ courses: stored ?? [], isLoaded: true });
    } catch (e) {
      console.warn('Failed to load learningCourses', e);
    }
  },
  saveCourse: async (savedCourse: LearningCourse) => {
    const previous = get().courses;
    set({ courses: upsertCourse(previous, savedCourse) });
    try {
      const persisted = await updateStored('learningCourses', (current) =>
        upsertCourse(current, savedCourse)
      );
      set({ courses: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist learning course', e);
      set({ courses: previous });
      return false;
    }
  },
  deleteCourse: async (id: string) => {
    const previous = get().courses;
    set({ courses: previous.filter((c) => c.id !== id) });
    try {
      const persisted = await updateStored('learningCourses', (current) =>
        current.filter((c) => c.id !== id)
      );
      set({ courses: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist course deletion', e);
      set({ courses: previous });
      return false;
    }
  },
  updateCourseStatus: async (id: string, status: LearningStatus) => {
    const previous = get().courses;
    const nowIso = new Date().toISOString();
    set({
      courses: previous.map((c) => (c.id === id ? { ...c, status, updatedAt: nowIso } : c)),
    });
    try {
      const persisted = await updateStored('learningCourses', (current) =>
        current.map((c) => (c.id === id ? { ...c, status, updatedAt: nowIso } : c))
      );
      set({ courses: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist course status update', e);
      set({ courses: previous });
      return false;
    }
  },
}));
