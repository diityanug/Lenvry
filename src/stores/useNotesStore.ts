import { create } from 'zustand';
import { readStored, updateStored } from '../storage';
import { StickyNote } from '../types/notes';

interface NotesState {
  notes: StickyNote[];
  isLoaded: boolean;
  loadNotes: (force?: boolean) => Promise<void>;
  saveNote: (note: StickyNote) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;
}

function upsertNote(list: StickyNote[], note: StickyNote): StickyNote[] {
  const exists = list.some((n) => n.id === note.id);
  return exists ? list.map((n) => (n.id === note.id ? note : n)) : [note, ...list];
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isLoaded: false,
  loadNotes: async (force = false) => {
    if (get().isLoaded && !force) return;
    try {
      const stored = await readStored('generalNotes');
      set({ notes: stored ?? [], isLoaded: true });
    } catch (e) {
      console.warn('Failed to load generalNotes', e);
    }
  },
  saveNote: async (savedNote: StickyNote) => {
    const previous = get().notes;
    set({ notes: upsertNote(previous, savedNote) });
    try {
      const persisted = await updateStored('generalNotes', (current) =>
        upsertNote(current, savedNote)
      );
      set({ notes: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist sticky note', e);
      set({ notes: previous });
      return false;
    }
  },
  deleteNote: async (id: string) => {
    const previous = get().notes;
    set({ notes: previous.filter((n) => n.id !== id) });
    try {
      const persisted = await updateStored('generalNotes', (current) =>
        current.filter((n) => n.id !== id)
      );
      set({ notes: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist note deletion', e);
      set({ notes: previous });
      return false;
    }
  },
}));
