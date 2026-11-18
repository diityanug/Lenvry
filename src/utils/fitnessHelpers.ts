import { RoutinePreset } from '../constants/fitness';
import { Workout } from '../types/fitness';

export interface DailyFitnessMetrics {
  dayVolume: number;
  daySets: number;
  dayReps: number;
  exerciseCount: number;
}

/** Checks whether a workout or routine exercise is cardio-based (duration/distance instead of sets/reps). */
export function isCardioCategory(category?: string): boolean {
  return (category || '').trim().toLowerCase() === 'cardio';
}

/**
 * Computes daily strength volume, sets, and reps while excluding Cardio items
 * (where `sets` represents minutes and `reps` represents distance in km).
 */
export function computeDailyFitnessMetrics(workouts: Workout[]): DailyFitnessMetrics {
  let rawVolume = 0;
  let daySets = 0;
  let dayReps = 0;

  for (const item of workouts) {
    if (isCardioCategory(item.category)) continue;
    const sets = Math.max(0, parseInt(item.sets || '0', 10) || 0);
    const reps = Math.max(0, parseInt(item.reps || '0', 10) || 0);
    const weight = Math.max(0, parseFloat((item.weight || '0').replace(',', '.')) || 0);
    daySets += sets;
    dayReps += reps;
    rawVolume += sets * reps * weight;
  }

  return {
    dayVolume: Math.round(rawVolume * 100) / 100,
    daySets,
    dayReps,
    exerciseCount: workouts.length,
  };
}

/** Formats a routine preset exercise chip without confusing `@ 0kg` or `30x5` labels on cardio/bodyweight moves. */
export function formatRoutineExerciseSummary(
  ex: RoutinePreset['exercises'][number]
): string {
  if (isCardioCategory(ex.category)) {
    const dist = parseFloat((ex.reps || '0').replace(',', '.')) || 0;
    return dist > 0
      ? `${ex.exercise} (${ex.sets} min • ${dist} km)`
      : `${ex.exercise} (${ex.sets} min)`;
  }

  const weight = parseFloat((ex.weight || '0').replace(',', '.')) || 0;
  if (weight <= 0) {
    return `${ex.exercise} (${ex.sets}x${ex.reps} • Bodyweight)`;
  }
  return `${ex.exercise} (${ex.sets}x${ex.reps} @ ${ex.weight}kg)`;
}
