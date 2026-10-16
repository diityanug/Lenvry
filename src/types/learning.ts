export type LearningStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

export type CourseColor = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan';

export interface LearningCourse {
  id: string;
  title: string;              // Course title
  status: LearningStatus;     // Current progress status
  link?: string;              // External link (URL)
  startDate: string;          // Start date ISO string
  provider: string;           // Provider (Udemy, Coursera, YouTube, etc.)
  level: CourseLevel;         // Difficulty level
  hours: number;              // Total studied or course hours
  notes?: string;             // Additional notes
  color?: CourseColor;        // Card accent color theme
  createdAt: string;
  updatedAt: string;
}

export const COURSE_COLOR_KEYS: CourseColor[] = [
  'violet',
  'blue',
  'emerald',
  'rose',
  'amber',
  'cyan',
];

export const COURSE_COLORS: Record<
  CourseColor,
  {
    name: string;
    primary: string;
    cardBg: string;
    border: string;
    glow: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
    ink: string;
  }
> = {
  violet: {
    name: 'Purple / Violet',
    primary: '#A855F7',
    cardBg: '#14111E',
    border: 'rgba(168, 85, 247, 0.35)',
    glow: 'rgba(168, 85, 247, 0.22)',
    badgeBg: 'rgba(168, 85, 247, 0.22)',
    badgeText: '#E9D5FF',
    accent: '#C084FC',
    ink: '#FAF5FF',
  },
  blue: {
    name: 'Sky Blue',
    primary: '#38BDF8',
    cardBg: '#0F1624',
    border: 'rgba(56, 189, 248, 0.35)',
    glow: 'rgba(56, 189, 248, 0.22)',
    badgeBg: 'rgba(56, 189, 248, 0.22)',
    badgeText: '#BAE6FD',
    accent: '#38BDF8',
    ink: '#F0F9FF',
  },
  emerald: {
    name: 'Emerald Green',
    primary: '#10B981',
    cardBg: '#0C1A14',
    border: 'rgba(16, 185, 129, 0.35)',
    glow: 'rgba(16, 185, 129, 0.22)',
    badgeBg: 'rgba(16, 185, 129, 0.22)',
    badgeText: '#A7F3D0',
    accent: '#34D399',
    ink: '#ECFDF5',
  },
  rose: {
    name: 'Coral Rose',
    primary: '#FB7185',
    cardBg: '#1A0F14',
    border: 'rgba(251, 113, 133, 0.35)',
    glow: 'rgba(251, 113, 133, 0.22)',
    badgeBg: 'rgba(251, 113, 133, 0.22)',
    badgeText: '#FECDD3',
    accent: '#F43F5E',
    ink: '#FFF1F2',
  },
  amber: {
    name: 'Warm Amber',
    primary: '#F59E0B',
    cardBg: '#1A150D',
    border: 'rgba(245, 158, 11, 0.35)',
    glow: 'rgba(245, 158, 11, 0.22)',
    badgeBg: 'rgba(245, 158, 11, 0.22)',
    badgeText: '#FDE68A',
    accent: '#FBBF24',
    ink: '#FFFBEB',
  },
  cyan: {
    name: 'Electric Cyan',
    primary: '#06B6D4',
    cardBg: '#0B191D',
    border: 'rgba(6, 182, 212, 0.35)',
    glow: 'rgba(6, 182, 212, 0.22)',
    badgeBg: 'rgba(6, 182, 212, 0.22)',
    badgeText: '#A5F3FC',
    accent: '#22D3EE',
    ink: '#ECFEFF',
  },
};

export const PROVIDER_DEFAULT_COLORS: Record<string, CourseColor> = {
  Udemy: 'violet',
  Coursera: 'blue',
  YouTube: 'rose',
  Dicoding: 'cyan',
  edX: 'emerald',
  Pluralsight: 'amber',
  Skillshare: 'emerald',
  Documentation: 'blue',
  Other: 'violet',
};

export const LEARNING_STATUS_CONFIG: Record<
  LearningStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  'In Progress': {
    label: 'In Progress',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.16)',
    icon: 'play-circle-outline',
  },
  'Completed': {
    label: 'Completed',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.16)',
    icon: 'checkmark-circle-outline',
  },
  'Not Started': {
    label: 'Not Started',
    color: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.16)',
    icon: 'time-outline',
  },
  'On Hold': {
    label: 'On Hold (Pending)',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.16)',
    icon: 'pause-circle-outline',
  },
};

export const COURSE_LEVEL_CONFIG: Record<
  CourseLevel,
  { label: string; color: string; bg: string }
> = {
  'Beginner': {
    label: 'Beginner',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.15)',
  },
  'Intermediate': {
    label: 'Intermediate',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.15)',
  },
  'Advanced': {
    label: 'Advanced',
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.15)',
  },
  'All Levels': {
    label: 'All Levels',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
  },
};

export const COURSE_PROVIDERS = [
  'Udemy',
  'Coursera',
  'YouTube',
  'Dicoding',
  'edX',
  'Pluralsight',
  'Skillshare',
  'Documentation',
  'Other',
] as const;
