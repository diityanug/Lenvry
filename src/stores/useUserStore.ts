import { create } from 'zustand';
import { readStored, writeStored } from '../storage';

interface UserState {
  userName: string;
  isLoaded: boolean;
  loadUserName: () => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  userName: 'User',
  isLoaded: false,
  loadUserName: async () => {
    try {
      const stored = await readStored('userName');
      if (stored) {
        set({ userName: stored, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
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
