import { describe, expect, it } from 'bun:test';
import {
  computeDailyFitnessMetrics,
  formatRoutineExerciseSummary,
} from '../utils/fitnessHelpers';
import { parseNonNegativeDecimal, sanitizeDecimalInput } from '../utils/math';
import { Workout } from '../types/fitness';

describe('fitnessHelpers', () => {
  it('excludes cardio duration and distance from strength sets, reps, and volume', () => {
    const workouts: Workout[] = [
      {
        id: '1',
        exercise: 'Bench Press',
        category: 'Chest',
        sets: '4',
        reps: '10',
        weight: '60',
        date: '2026-11-18',
      },
      {
        id: '2',
        exercise: 'Treadmill Run',
        category: 'Cardio',
        sets: '30',
        reps: '5',
        weight: '0',
        date: '2026-11-18',
      },
      {
        id: '3',
        exercise: 'Lateral Raise',
        category: 'Shoulders',
        sets: '3',
        reps: '12',
        weight: '7,5',
        date: '2026-11-18',
      },
    ];

    const metrics = computeDailyFitnessMetrics(workouts);
    expect(metrics.exerciseCount).toBe(3);
    expect(metrics.daySets).toBe(7);
    expect(metrics.dayReps).toBe(22);
    expect(metrics.dayVolume).toBe(4 * 10 * 60 + 3 * 12 * 7.5);
  });

  it('formats cardio and bodyweight routine presets without confusing @ 0kg labels', () => {
    expect(
      formatRoutineExerciseSummary({
        exercise: 'Treadmill Run',
        category: 'Cardio',
        sets: '30',
        reps: '5',
        weight: '0',
      })
    ).toBe('Treadmill Run (30 min • 5 km)');

    expect(
      formatRoutineExerciseSummary({
        exercise: 'Plank',
        category: 'Core',
        sets: '3',
        reps: '60',
        weight: '0',
      })
    ).toBe('Plank (3x60 • Bodyweight)');

    expect(
      formatRoutineExerciseSummary({
        exercise: 'Bench Press',
        category: 'Chest',
        sets: '4',
        reps: '10',
        weight: '60',
      })
    ).toBe('Bench Press (4x10 @ 60kg)');
  });
});

describe('decimal sanitization and parsing helpers', () => {
  it('normalizes comma decimals and rejects non-numeric characters', () => {
    expect(sanitizeDecimalInput('12,5kg')).toBe('12.5');
    expect(sanitizeDecimalInput('1.2.3')).toBe('1.23');
    expect(parseNonNegativeDecimal('12,5')).toBe(12.5);
    expect(parseNonNegativeDecimal('-5', 0)).toBe(0);
    expect(parseNonNegativeDecimal('')).toBe(0);
  });
});
