export type NoteCategory = 'General' | 'Personal' | 'Finance' | 'Work' | 'Ideas' | 'Lists';

export interface NoteCategoryConfig {
  id: NoteCategory;
  label: string;
  icon: string;
  color: string;
  isSensitive?: boolean;
}

export const NOTE_CATEGORIES: Record<NoteCategory, NoteCategoryConfig> = {
  General: { id: 'General', label: 'General Note', icon: 'document-text-outline', color: '#B45309' },
  Personal: { id: 'Personal', label: 'Personal', icon: 'shield-checkmark-outline', color: '#C93B3B', isSensitive: true },
  Finance: { id: 'Finance', label: 'Finance', icon: 'wallet-outline', color: '#16794B', isSensitive: true },
  Work: { id: 'Work', label: 'Work', icon: 'briefcase-outline', color: '#2563EB' },
  Ideas: { id: 'Ideas', label: 'Ideas', icon: 'bulb-outline', color: '#B85D43' },
  Lists: { id: 'Lists', label: 'Lists', icon: 'list-outline', color: '#0D8A7E' },
};

export type StickyNoteColor = 'amber' | 'blue' | 'emerald' | 'rose' | 'purple';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface NoteEntry {
  id: string;
  title: string;
  content: string;
}

export interface StickyNote {
  id: string;
  title: string;
  type: 'text' | 'checklist';
  category?: NoteCategory;
  description?: string;
  entries?: NoteEntry[];
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
    bg: '#FEF7EC',
    border: 'rgba(180, 83, 9, 0.25)',
    accent: '#B45309',
    headerBg: '#FBEBD2',
    label: 'Ochre',
  },
  blue: {
    bg: '#EFF5FF',
    border: 'rgba(37, 99, 235, 0.24)',
    accent: '#2563EB',
    headerBg: '#DFEBFB',
    label: 'Steel',
  },
  emerald: {
    bg: '#EEF7F1',
    border: 'rgba(22, 121, 75, 0.24)',
    accent: '#16794B',
    headerBg: '#DCEFE3',
    label: 'Sage',
  },
  rose: {
    bg: '#FDF0F0',
    border: 'rgba(201, 59, 59, 0.24)',
    accent: '#C93B3B',
    headerBg: '#FADCDC',
    label: 'Clay',
  },
  purple: {
    bg: '#FFF4EF',
    border: 'rgba(184, 93, 67, 0.26)',
    accent: '#B85D43',
    headerBg: '#FCE6DC',
    label: 'Terracotta',
  },
};
