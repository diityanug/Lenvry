export const GYM_CATEGORIES = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Cardio',
];

export const EXERCISE_SUGGESTIONS: Record<string, string[]> = {
  Chest: ['Bench Press', 'Incline Dumbbell Press', 'Chest Fly', 'Dips', 'Push-ups'],
  Back: ['Lat Pulldown', 'Deadlift', 'Barbell Row', 'Pull-ups', 'Cable Row'],
  Legs: ['Squats', 'Leg Press', 'Romanian Deadlift', 'Lunges', 'Leg Extension', 'Calf Raise'],
  Shoulders: ['Overhead Press', 'Lateral Raise', 'Front Raise', 'Face Pull', 'Shrugs'],
  Arms: ['Bicep Curl', 'Hammer Curl', 'Tricep Pushdown', 'Skull Crusher', 'Preacher Curl'],
  Core: ['Plank', 'Cable Crunch', 'Hanging Leg Raise', 'Russian Twist', 'Ab Wheel'],
  Cardio: ['Treadmill Run', 'Stationary Bike', 'Rowing Machine', 'Jump Rope', 'Stair Climber'],
};

export const getCategoryIcon = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'chest': return 'fitness-outline';
    case 'back': return 'body-outline';
    case 'legs': return 'walk-outline';
    case 'shoulders': return 'triangle-outline';
    case 'arms': return 'barbell-outline';
    case 'core': return 'shield-outline';
    case 'cardio': return 'heart-outline';
    default: return 'barbell-outline';
  }
};

export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];