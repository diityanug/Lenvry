import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STEPS_LOGS_KEY = '@lenvry_steps_logs';

export interface StepTrackerStatus {
  isAvailable: boolean;
  hasPermission: boolean;
}

/**
 * Check if the current device hardware supports pedometer step counting.
 */
export async function checkPedometerAvailability(): Promise<boolean> {
  try {
    return await Pedometer.isAvailableAsync();
  } catch (error) {
    console.warn('Pedometer availability check failed:', error);
    return false;
  }
}

/**
 * Request permission to access physical activity / motion sensor data.
 */
export async function requestPedometerPermissions(): Promise<boolean> {
  try {
    const { status } = await Pedometer.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Pedometer permission request failed:', error);
    return false;
  }
}

/**
 * Fetch total steps recorded by the device OS from midnight (00:00) until right now.
 */
export async function fetchTodaySystemSteps(): Promise<number | null> {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) return null;

    const { status } = await Pedometer.getPermissionsAsync();
    if (status !== 'granted') {
      const requestRes = await Pedometer.requestPermissionsAsync();
      if (requestRes.status !== 'granted') return null;
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(startOfDay, now);
    if (result && typeof result.steps === 'number') {
      return result.steps;
    }
    return null;
  } catch (error) {
    console.warn('Failed to fetch system step count:', error);
    return null;
  }
}

/**
 * Subscribe to real-time step events while the app is active.
 * Calls onStepAdded with the number of new steps detected since last event.
 */
export function subscribeLivePedometer(
  onStepDelta: (stepDelta: number) => void
): (() => void) | null {
  try {
    let lastReportedSteps: number | null = null;

    const subscription = Pedometer.watchStepCount((result) => {
      if (result && typeof result.steps === 'number') {
        if (lastReportedSteps === null) {
          // Initialize baseline with the first reading; do not emit delta for existing steps
          lastReportedSteps = result.steps;
          return;
        }

        const delta = result.steps - lastReportedSteps;
        if (delta > 0) {
          lastReportedSteps = result.steps;
          onStepDelta(delta);
        } else if (result.steps < lastReportedSteps) {
          // In case sensor counter was reset
          lastReportedSteps = result.steps;
        }
      }
    });

    return () => {
      try {
        subscription.remove();
      } catch (err) {
        console.warn('Failed to unsubscribe pedometer:', err);
      }
    };
  } catch (error) {
    console.warn('Failed to start live pedometer tracking:', error);
    return null;
  }
}

/**
 * Helper to get local date key YYYY-MM-DD
 */
export function getTodayDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Atomically increment today's steps in AsyncStorage and return updated total.
 */
export async function incrementTodayStepsInStorage(
  delta: number,
  goal?: number
): Promise<number> {
  if (delta <= 0) return 0;

  try {
    const todayKey = getTodayDateKey();
    const stored = await AsyncStorage.getItem(STEPS_LOGS_KEY);
    const stepsMap: Record<string, { steps: number; goal?: number }> = stored
      ? JSON.parse(stored)
      : {};

    const existingData = stepsMap[todayKey];
    const currentSteps = typeof existingData?.steps === 'number' ? existingData.steps : 0;
    const existingGoal = existingData?.goal || goal || 6000;
    const newTotal = currentSteps + delta;

    stepsMap[todayKey] = {
      steps: newTotal,
      goal: existingGoal,
    };

    await AsyncStorage.setItem(STEPS_LOGS_KEY, JSON.stringify(stepsMap));
    return newTotal;
  } catch (err) {
    console.error('Failed to increment today steps in storage:', err);
    return 0;
  }
}

/**
 * Helper to update and persist today's steps in AsyncStorage.
 * Ensures steps never decrease due to stale state.
 */
export async function syncTodayStepsToStorage(
  steps: number,
  goal?: number
): Promise<void> {
  try {
    const todayKey = getTodayDateKey();
    const stored = await AsyncStorage.getItem(STEPS_LOGS_KEY);
    const stepsMap: Record<string, { steps: number; goal?: number }> = stored
      ? JSON.parse(stored)
      : {};

    const existingData = stepsMap[todayKey];
    const existingSteps = typeof existingData?.steps === 'number' ? existingData.steps : 0;
    const existingGoal = existingData?.goal || goal || 6000;

    // Steps should only increase or stay same, never decrease due to stale memory state
    const finalSteps = Math.max(existingSteps, steps);

    stepsMap[todayKey] = {
      steps: finalSteps,
      goal: existingGoal,
    };

    await AsyncStorage.setItem(STEPS_LOGS_KEY, JSON.stringify(stepsMap));
  } catch (err) {
    console.error('Failed to sync today steps to storage:', err);
  }
}
