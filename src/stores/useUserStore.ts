import { create } from 'zustand';
import { readStored, writeStored } from '../storage';

interface UserState {
  userName: string;
  isLoaded: boolean;
  loadUserName: (force?: boolean) => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  userName: 'User',
  isLoaded: false,
  loadUserName: async (force = false) => {
    if (get().isLoaded && !force) return;
    try {
      const stored = await readStored('userName');
      set({ userName: stored || 'User', isLoaded: true });
    } catch (e) {
      console.warn('Failed to load user name', e);
    }
  },
  updateUserName: async (name: string) => {
    set({ userName: name });
    try {
      await writeStored('userName', name);
    } catch (e) {
      console.warn('Failed to persist user name', e);
    }
  },
}));
