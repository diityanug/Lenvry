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

export { DAYS_SHORT, MONTHS } from './date';

export interface RoutinePreset {
  name: string;
  category: string;
  description: string;
  exercises: {
    exercise: string;
    category: string;
    sets: string;
    reps: string;
    weight: string;
  }[];
}

export const ROUTINE_PRESETS: RoutinePreset[] = [
  {
    name: 'Push Day (Chest/Shoulders/Triceps)',
    category: 'Chest',
    description: '4 exercises focusing on pushing muscles',
    exercises: [
      { exercise: 'Bench Press', category: 'Chest', sets: '4', reps: '10', weight: '60' },
      { exercise: 'Incline Dumbbell Press', category: 'Chest', sets: '3', reps: '12', weight: '22' },
      { exercise: 'Overhead Press', category: 'Shoulders', sets: '3', reps: '10', weight: '40' },
      { exercise: 'Tricep Pushdown', category: 'Arms', sets: '3', reps: '15', weight: '25' },
    ],
  },
  {
    name: 'Pull Day (Back & Biceps)',
    category: 'Back',
    description: '4 exercises targeting back and biceps',
    exercises: [
      { exercise: 'Lat Pulldown', category: 'Back', sets: '4', reps: '12', weight: '50' },
      { exercise: 'Barbell Row', category: 'Back', sets: '3', reps: '10', weight: '50' },
      { exercise: 'Face Pull', category: 'Shoulders', sets: '3', reps: '15', weight: '20' },
      { exercise: 'Bicep Curl', category: 'Arms', sets: '3', reps: '12', weight: '20' },
    ],
  },
  {
    name: 'Leg Day (Lower Body)',
    category: 'Legs',
    description: '4 exercises for quads, hamstrings & calves',
    exercises: [
      { exercise: 'Squats', category: 'Legs', sets: '4', reps: '10', weight: '80' },
      { exercise: 'Leg Press', category: 'Legs', sets: '3', reps: '12', weight: '120' },
      { exercise: 'Romanian Deadlift', category: 'Legs', sets: '3', reps: '10', weight: '70' },
      { exercise: 'Calf Raise', category: 'Legs', sets: '4', reps: '15', weight: '40' },
    ],
  },
  {
    name: 'Cardio & Core Burner',
    category: 'Cardio',
    description: 'Endurance run & core strength',
    exercises: [
      { exercise: 'Treadmill Run', category: 'Cardio', sets: '30', reps: '5', weight: '0' },
      { exercise: 'Plank', category: 'Core', sets: '3', reps: '60', weight: '0' },
      { exercise: 'Hanging Leg Raise', category: 'Core', sets: '3', reps: '15', weight: '0' },
    ],
  },
];