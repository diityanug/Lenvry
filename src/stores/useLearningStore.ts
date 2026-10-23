import { create } from 'zustand';
import { readStored, writeStored } from '../storage';
import { LearningCourse, LearningStatus } from '../types/learning';

interface LearningState {
  courses: LearningCourse[];
  isLoaded: boolean;
  loadCourses: (force?: boolean) => Promise<void>;
  saveCourse: (course: LearningCourse) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  updateCourseStatus: (id: string, status: LearningStatus) => Promise<void>;
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
    const current = get().courses;
    const exists = current.some((c) => c.id === savedCourse.id);
    const updated = exists
      ? current.map((c) => (c.id === savedCourse.id ? savedCourse : c))
      : [savedCourse, ...current];
    set({ courses: updated });
    try {
      await writeStored('learningCourses', updated);
    } catch (e) {
      console.warn('Failed to persist learning course', e);
    }
  },
  deleteCourse: async (id: string) => {
    const updated = get().courses.filter((c) => c.id !== id);
    set({ courses: updated });
    try {
      await writeStored('learningCourses', updated);
    } catch (e) {
      console.warn('Failed to persist course deletion', e);
    }
  },
  updateCourseStatus: async (id: string, status: LearningStatus) => {
    const current = get().courses;
    const updated = current.map((c) =>
      c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c
    );
    set({ courses: updated });
    try {
      await writeStored('learningCourses', updated);
    } catch (e) {
      console.warn('Failed to persist course status update', e);
    }
  },
}));
