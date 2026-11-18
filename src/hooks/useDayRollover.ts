import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { formatDateKey } from '../constants/date';

type TickListener = (now: Date) => void;

const listeners = new Set<TickListener>();
let appStateSub: ReturnType<typeof AppState.addEventListener> | null = null;
let midnightTimer: ReturnType<typeof setTimeout> | null = null;

function notifyAll() {
  const now = new Date();
  listeners.forEach((fn) => fn(now));
}

function scheduleNextMidnight() {
  if (midnightTimer) clearTimeout(midnightTimer);
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  const msToMidnight = Math.max(1000, midnight.getTime() - now.getTime());

  midnightTimer = setTimeout(() => {
    notifyAll();
    scheduleNextMidnight();
  }, msToMidnight);
}

function startSharedWatcher() {
  if (!appStateSub) {
    appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') notifyAll();
    });
  }
  if (!midnightTimer) {
    scheduleNextMidnight();
  }
}

function stopSharedWatcherIfIdle() {
  if (listeners.size > 0) return;
  appStateSub?.remove();
  appStateSub = null;
  if (midnightTimer) {
    clearTimeout(midnightTimer);
    midnightTimer = null;
  }
}

/**
 * Subscribes to a shared AppState-active and midnight rollover watcher so all mounted
 * screens share a single listener and timer.
 */
export function useDayRollover(onTick: TickListener): void {
  const callbackRef = useRef(onTick);

  useEffect(() => {
    callbackRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    const handler: TickListener = (now) => callbackRef.current(now);
    listeners.add(handler);
    startSharedWatcher();

    return () => {
      listeners.delete(handler);
      stopSharedWatcherIfIdle();
    };
  }, []);
}

/**
 * Manages `todayDate` and `selectedDate` for date-based screens, automatically advancing
 * `selectedDate` to the new day when the user was viewing Today across midnight or app resume.
 */
export function useActiveDate(onActivate?: () => void) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [todayDate, setTodayDate] = useState<Date>(() => new Date());
  const lastTodayKeyRef = useRef(formatDateKey(todayDate));
  const onActivateRef = useRef(onActivate);

  useEffect(() => {
    onActivateRef.current = onActivate;
  }, [onActivate]);

  const syncToToday = useCallback((now = new Date()) => {
    setTodayDate((prev) => (formatDateKey(prev) === formatDateKey(now) ? prev : now));
    const newTodayKey = formatDateKey(now);
    const oldTodayKey = lastTodayKeyRef.current;
    lastTodayKeyRef.current = newTodayKey;

    if (newTodayKey !== oldTodayKey) {
      setSelectedDate((prevDate) => (formatDateKey(prevDate) === oldTodayKey ? now : prevDate));
    }
    onActivateRef.current?.();
  }, []);

  useDayRollover(syncToToday);

  useFocusEffect(
    useCallback(() => {
      syncToToday();
    }, [syncToToday])
  );

  return { selectedDate, setSelectedDate, todayDate, syncToToday };
}
