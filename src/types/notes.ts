export type NoteCategory = 'General' | 'Personal' | 'Work' | 'Ideas' | 'Lists';

export interface NoteCategoryConfig {
  id: NoteCategory;
  label: string;
  icon: string;
  color: string;
  isSensitive?: boolean;
}

export const NOTE_CATEGORIES: Record<NoteCategory, NoteCategoryConfig> = {
  General: { id: 'General', label: 'General Note', icon: 'document-text-outline', color: '#F59E0B' },
  Personal: { id: 'Personal', label: 'Personal & Credentials', icon: 'shield-checkmark-outline', color: '#EC4899', isSensitive: true },
  Work: { id: 'Work', label: 'Work & Study', icon: 'briefcase-outline', color: '#38BDF8' },
  Ideas: { id: 'Ideas', label: 'Ideas & Thoughts', icon: 'bulb-outline', color: '#A855F7' },
  Lists: { id: 'Lists', label: 'Lists & Shopping', icon: 'list-outline', color: '#10B981' },
};

export type StickyNoteColor = 'amber' | 'blue' | 'emerald' | 'rose' | 'purple';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface StickyNote {
  id: string;
  title: string;
  type: 'text' | 'checklist';
  category?: NoteCategory;
  description?: string;
  checklist?: ChecklistItem[];
  color?: StickyNoteColor;
  createdAt: string;
  updatedAt?: string;
}

export const STICKY_COLORS: Record<
  StickyNoteColor,
  {
    bg: string;
    border: string;
    accent: string;
    headerBg: string;
    label: string;
  }
> = {
  amber: {
    bg: 'rgba(245, 158, 11, 0.09)',
    border: 'rgba(245, 158, 11, 0.35)',
    accent: '#F59E0B',
    headerBg: 'rgba(245, 158, 11, 0.20)',
    label: 'Yellow',
  },
  blue: {
    bg: 'rgba(56, 189, 248, 0.09)',
    border: 'rgba(56, 189, 248, 0.35)',
    accent: '#38BDF8',
    headerBg: 'rgba(56, 189, 248, 0.20)',
    label: 'Blue',
  },
  emerald: {
    bg: 'rgba(16, 185, 129, 0.09)',
    border: 'rgba(16, 185, 129, 0.35)',
    accent: '#10B981',
    headerBg: 'rgba(16, 185, 129, 0.20)',
    label: 'Green',
  },
  rose: {
    bg: 'rgba(244, 63, 94, 0.09)',
    border: 'rgba(244, 63, 94, 0.35)',
    accent: '#F43F5E',
    headerBg: 'rgba(244, 63, 94, 0.20)',
    label: 'Pink',
  },
  purple: {
    bg: 'rgba(168, 85, 247, 0.09)',
    border: 'rgba(168, 85, 247, 0.35)',
    accent: '#A855F7',
    headerBg: 'rgba(168, 85, 247, 0.20)',
    label: 'Purple',
  },
};
