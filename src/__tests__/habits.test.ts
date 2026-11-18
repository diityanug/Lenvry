import { describe, expect, it } from 'bun:test';
import { formatDateKey } from '../constants/date';
import { isHabitActiveForDate, isHabitCompletedForDate } from '../constants/habits';

describe('habits schedule and completion helpers', () => {
  it('formats dates as local YYYY-MM-DD keys', () => {
    expect(formatDateKey(new Date(2026, 9, 5))).toBe('2026-10-05');
    expect(formatDateKey(new Date(2026, 0, 9))).toBe('2026-01-09');
  });

  it('handles once, daily, weekdays, and custom_days schedules accurately', () => {
    const monday = new Date(2026, 9, 5); // 2026-10-05 (Monday = 1)
    const sunday = new Date(2026, 9, 11); // 2026-10-11 (Sunday = 0)
    const beforeCreation = new Date(2026, 9, 4);

    const onceHabit = { date: '2026-10-05', frequency: 'once' };
    expect(isHabitActiveForDate(onceHabit, monday)).toBe(true);
    expect(isHabitActiveForDate(onceHabit, sunday)).toBe(false);

    const dailyHabit = { date: '2026-10-05', frequency: 'daily' };
    expect(isHabitActiveForDate(dailyHabit, beforeCreation)).toBe(false);
    expect(isHabitActiveForDate(dailyHabit, monday)).toBe(true);
    expect(isHabitActiveForDate(dailyHabit, sunday)).toBe(true);

    const weekdayHabit = { date: '2026-10-05', frequency: 'weekdays' };
    expect(isHabitActiveForDate(weekdayHabit, monday)).toBe(true);
    expect(isHabitActiveForDate(weekdayHabit, sunday)).toBe(false);

    const customHabit = { date: '2026-10-05', frequency: 'custom_days', repeatDays: [0, 3] };
    expect(isHabitActiveForDate(customHabit, monday)).toBe(false);
    expect(isHabitActiveForDate(customHabit, sunday)).toBe(true);
  });

  it('evaluates completion per date for both one-off and recurring habits', () => {
    const recurring = {
      completed: false,
      date: '2026-10-01',
      frequency: 'daily',
      completedDates: ['2026-10-05'],
    };
    expect(isHabitCompletedForDate(recurring, '2026-10-05')).toBe(true);
    expect(isHabitCompletedForDate(recurring, '2026-10-06')).toBe(false);

    const oneOff = {
      completed: true,
      date: '2026-10-05',
      frequency: 'once',
    };
    expect(isHabitCompletedForDate(oneOff, '2026-10-05')).toBe(true);
    expect(isHabitCompletedForDate(oneOff, '2026-10-06')).toBe(false);
  });
});
