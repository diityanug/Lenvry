import { create } from 'zustand';
import { readStored, writeStored } from '../storage';
import { StickyNote } from '../types/notes';

interface NotesState {
  notes: StickyNote[];
  isLoaded: boolean;
  loadNotes: () => Promise<void>;
  saveNote: (note: StickyNote) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isLoaded: false,
  loadNotes: async () => {
    try {
      const stored = await readStored('generalNotes');
      set({ notes: stored ?? [], isLoaded: true });
    } catch (e) {
      console.warn('Failed to load generalNotes', e);
    }
  },
  saveNote: async (savedNote: StickyNote) => {
    const current = get().notes;
    const exists = current.some((n) => n.id === savedNote.id);
    const updated = exists
      ? current.map((n) => (n.id === savedNote.id ? savedNote : n))
      : [savedNote, ...current];
    set({ notes: updated });
    try {
      await writeStored('generalNotes', updated);
    } catch (e) {
      console.warn('Failed to persist sticky note', e);
    }
  },
  deleteNote: async (id: string) => {
    const updated = get().notes.filter((n) => n.id !== id);
    set({ notes: updated });
    try {
      await writeStored('generalNotes', updated);
    } catch (e) {
      console.warn('Failed to persist note deletion', e);
    }
  },
}));
