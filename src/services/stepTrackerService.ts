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
    let lastReportedSteps = 0;

    const subscription = Pedometer.watchStepCount((result) => {
      if (result && typeof result.steps === 'number') {
        const delta = result.steps - lastReportedSteps;
        if (delta > 0) {
          lastReportedSteps = result.steps;
          onStepDelta(delta);
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
 * Helper to update and persist today's steps in AsyncStorage.
 */
export async function syncTodayStepsToStorage(
  steps: number,
  goal?: number
): Promise<void> {
  try {
    const todayIsoKey = new Date().toISOString().split('T')[0];
    const stored = await AsyncStorage.getItem(STEPS_LOGS_KEY);
    const stepsMap: Record<string, { steps: number; goal?: number }> = stored
      ? JSON.parse(stored)
      : {};

    const existingGoal = stepsMap[todayIsoKey]?.goal || goal || 6000;

    stepsMap[todayIsoKey] = {
      steps,
      goal: existingGoal,
    };

    await AsyncStorage.setItem(STEPS_LOGS_KEY, JSON.stringify(stepsMap));
  } catch (err) {
    console.error('Failed to sync today steps to storage:', err);
  }
}
