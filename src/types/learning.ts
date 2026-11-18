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
    name: 'Terracotta Clay',
    primary: '#B85D43',
    cardBg: '#FFF5F1',
    border: 'rgba(184, 93, 67, 0.28)',
    glow: 'rgba(184, 93, 67, 0.12)',
    badgeBg: 'rgba(184, 93, 67, 0.14)',
    badgeText: '#8C3F2A',
    accent: '#B85D43',
    ink: '#1C1917',
  },
  blue: {
    name: 'Steel Blue',
    primary: '#2563EB',
    cardBg: '#F1F6FF',
    border: 'rgba(37, 99, 235, 0.26)',
    glow: 'rgba(37, 99, 235, 0.12)',
    badgeBg: 'rgba(37, 99, 235, 0.12)',
    badgeText: '#1D4ED8',
    accent: '#2563EB',
    ink: '#1C1917',
  },
  emerald: {
    name: 'Forest Sage',
    primary: '#16794B',
    cardBg: '#EFF8F3',
    border: 'rgba(22, 121, 75, 0.26)',
    glow: 'rgba(22, 121, 75, 0.12)',
    badgeBg: 'rgba(22, 121, 75, 0.12)',
    badgeText: '#14532D',
    accent: '#16794B',
    ink: '#1C1917',
  },
  rose: {
    name: 'Muted Clay Rose',
    primary: '#C93B3B',
    cardBg: '#FFF2F2',
    border: 'rgba(201, 59, 59, 0.26)',
    glow: 'rgba(201, 59, 59, 0.12)',
    badgeBg: 'rgba(201, 59, 59, 0.12)',
    badgeText: '#991B1B',
    accent: '#C93B3B',
    ink: '#1C1917',
  },
  amber: {
    name: 'Warm Ochre',
    primary: '#C96D12',
    cardBg: '#FFF8EE',
    border: 'rgba(201, 109, 18, 0.26)',
    glow: 'rgba(201, 109, 18, 0.12)',
    badgeBg: 'rgba(201, 109, 18, 0.14)',
    badgeText: '#92400E',
    accent: '#C96D12',
    ink: '#1C1917',
  },
  cyan: {
    name: 'Slate Teal',
    primary: '#0D8A7E',
    cardBg: '#EFFAF8',
    border: 'rgba(13, 138, 126, 0.26)',
    glow: 'rgba(13, 138, 126, 0.12)',
    badgeBg: 'rgba(13, 138, 126, 0.13)',
    badgeText: '#115E59',
    accent: '#0D8A7E',
    ink: '#1C1917',
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
    color: '#2563EB',
    bg: 'rgba(37, 99, 235, 0.12)',
    icon: 'play-circle-outline',
  },
  'Completed': {
    label: 'Completed',
    color: '#16794B',
    bg: 'rgba(22, 121, 75, 0.12)',
    icon: 'checkmark-circle-outline',
  },
  'Not Started': {
    label: 'Not Started',
    color: '#57524A',
    bg: 'rgba(87, 82, 74, 0.12)',
    icon: 'time-outline',
  },
  'On Hold': {
    label: 'On Hold (Pending)',
    color: '#C96D12',
    bg: 'rgba(201, 109, 18, 0.13)',
    icon: 'pause-circle-outline',
  },
};

export const COURSE_LEVEL_CONFIG: Record<
  CourseLevel,
  { label: string; color: string; bg: string }
> = {
  'Beginner': {
    label: 'Beginner',
    color: '#16794B',
    bg: 'rgba(22, 121, 75, 0.12)',
  },
  'Intermediate': {
    label: 'Intermediate',
    color: '#2563EB',
    bg: 'rgba(37, 99, 235, 0.12)',
  },
  'Advanced': {
    label: 'Advanced',
    color: '#B85D43',
    bg: 'rgba(184, 93, 67, 0.13)',
  },
  'All Levels': {
    label: 'All Levels',
    color: '#C96D12',
    bg: 'rgba(201, 109, 18, 0.13)',
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
