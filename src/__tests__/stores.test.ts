import { beforeEach, describe, expect, it, mock } from 'bun:test';

const memoryStore = new Map<string, string>();
let shouldFailSetItem = false;

mock.module('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => memoryStore.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      if (shouldFailSetItem) {
        throw new Error('Disk full');
      }
      memoryStore.set(key, value);
    },
    removeItem: async (key: string) => {
      memoryStore.delete(key);
    },
    multiGet: async (keys: readonly string[]) =>
      keys.map((k) => [k, memoryStore.get(k) ?? null] as [string, string | null]),
    multiSet: async (entries: readonly [string, string][]) => {
      for (const [k, v] of entries) {
        memoryStore.set(k, v);
      }
    },
    multiRemove: async (keys: readonly string[]) => {
      for (const k of keys) {
        memoryStore.delete(k);
      }
    },
  },
}));

mock.module('react-native', () => ({
  Platform: { OS: 'ios' },
}));

mock.module('expo-haptics', () => ({
  impactAsync: async () => {},
  notificationAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

const { useHabitsStore } = await import('../stores/useHabitsStore');
const { useUserStore } = await import('../stores/useUserStore');
const { readStored, writeStored } = await import('../storage');

describe('Zustand store persistence and rollback', () => {
  beforeEach(() => {
    memoryStore.clear();
    shouldFailSetItem = false;
    useHabitsStore.setState({ habits: [], isLoaded: false });
    useUserStore.setState({ userName: 'User', isLoaded: false });
  });

  it('idempotently completes a habit from alarm and syncs both store and storage', async () => {
    await writeStored('habits', [
      {
        id: 'h1',
        title: 'Morning Walk',
        category: 'Fitness',
        completed: false,
        date: '2026-10-10',
        frequency: 'daily',
        completedDates: [],
      },
    ]);
    await useHabitsStore.getState().loadHabits(true);

    const ok1 = await useHabitsStore.getState().completeHabitForDate('h1', '2026-10-12');
    const ok2 = await useHabitsStore.getState().completeHabitForDate('h1', '2026-10-12');

    expect(ok1).toBe(true);
    expect(ok2).toBe(true);

    const inMemory = useHabitsStore.getState().habits[0];
    expect(inMemory.completedDates).toEqual(['2026-10-12']);

    const persisted = await readStored('habits');
    expect(persisted?.[0].completedDates).toEqual(['2026-10-12']);
  });

  it('rolls back userName in store when storage write fails', async () => {
    await writeStored('userName', 'Adi');
    await useUserStore.getState().loadUserName(true);
    expect(useUserStore.getState().userName).toBe('Adi');

    shouldFailSetItem = true;
    const ok = await useUserStore.getState().updateUserName('NewName');

    expect(ok).toBe(false);
    expect(useUserStore.getState().userName).toBe('Adi');
  });
});
