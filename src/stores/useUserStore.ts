import { create } from 'zustand';
import { readStored, writeStored } from '../storage';

interface UserState {
  userName: string;
  isLoaded: boolean;
  loadUserName: (force?: boolean) => Promise<void>;
  updateUserName: (name: string) => Promise<boolean>;
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
    const previous = get().userName;
    set({ userName: name });
    try {
      const persisted = await writeStored('userName', name);
      set({ userName: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist user name', e);
      set({ userName: previous });
      return false;
    }
  },
}));
