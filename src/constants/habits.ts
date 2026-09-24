export const DEFAULT_CATEGORIES = [
  'Health',
  'Productivity',
  'Learning',
  'Fitness',
  'Mindfulness',
];

export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getCategoryIcon = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'health': return 'heartbeat';
    case 'productivity': return 'briefcase';
    case 'learning': return 'book-open';
    case 'fitness': return 'dumbbell';
    case 'mindfulness': return 'spa';
    default: return 'check-circle';
  }
};

export const MASONRY_STYLES = [
  { bg: '#1E1B4B', text: '#C7D2FE', height: 170 },
  { bg: '#142E1F', text: '#A7F3D0', height: 210 },
  { bg: '#31102A', text: '#FBCFE8', height: 190 },
  { bg: '#2D1B00', text: '#FED7AA', height: 160 },
  { bg: '#1E293B', text: '#E2E8F0', height: 180 },
];