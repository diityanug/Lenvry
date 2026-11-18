import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import type * as NotificationsModule from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ensureSchema } from '../storage';
import { initializeAllStores, useHabitsStore } from '../stores';
import CurvedTabBar from '../components/Navigation/CurvedTabBar';
import { ModalPortalHost, ModalPortalProvider } from '../components/Common/BottomSheetModal';
import HabitAlarmModal, { HabitAlarmData } from '../components/Habits/HabitAlarmModal';
import {
  initializeNotifications,
  getNotificationSettings,
  shouldSuppressNotificationForDate,
} from '../services/habitNotificationService';
import { isAndroidExpoGo } from '../utils/expoGoHelper';
import { syncFoodSeedIfNeeded } from '../services/foodSeedSyncService';
import { COLORS } from '../constants/theme';
import { formatDateKey } from '../constants/date';
import { ErrorBoundary } from '../components/Shared/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: 'index',
};

type NotificationsApi = typeof NotificationsModule;
type CurvedTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

let Notifications: NotificationsApi | null = null;
if (!isAndroidExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications') as NotificationsApi;
  } catch (err) {
    console.warn('Failed to load expo-notifications in _layout:', err);
  }
}

async function resolveAlarmPayload(
  rawData: Record<string, unknown> | undefined,
  requireFullScreenEnabled: boolean
): Promise<HabitAlarmData | null> {
  if (!rawData || typeof rawData.habitTitle !== 'string' || !rawData.habitTitle) {
    return null;
  }
  if (shouldSuppressNotificationForDate(rawData)) {
    return null;
  }

  const settings = await getNotificationSettings();
  if (requireFullScreenEnabled && !settings.fullScreenAlarm) {
    return null;
  }

  return {
    habitId: typeof rawData.habitId === 'string' ? rawData.habitId : '',
    habitTitle: rawData.habitTitle,
    habitCategory: typeof rawData.habitCategory === 'string' ? rawData.habitCategory : undefined,
    reminderTime: typeof rawData.reminderTime === 'string' ? rawData.reminderTime : undefined,
    soundId:
      typeof rawData.soundId === 'string' && rawData.soundId
        ? rawData.soundId
        : settings.defaultSound || 'chime',
  };
}

const renderTabBar = (props: CurvedTabBarProps) => <CurvedTabBar {...props} />;

export default function AppLayout() {
  const [alarmData, setAlarmData] = useState<HabitAlarmData | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        await ensureSchema();
        await Promise.all([initializeAllStores(), initializeNotifications()]);
      } catch (err) {
        console.warn('Failed during app bootstrap:', err);
      } finally {
        if (active) setIsReady(true);
        void syncFoodSeedIfNeeded();
      }
    }

    bootstrap();

    if (!Notifications?.addNotificationReceivedListener) {
      return () => {
        active = false;
      };
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(async (notification) => {
      const payload = await resolveAlarmPayload(
        notification?.request?.content?.data as Record<string, unknown> | undefined,
        true
      );
      if (payload) setAlarmData(payload);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener?.(
      async (response) => {
        const payload = await resolveAlarmPayload(
          response?.notification?.request?.content?.data as Record<string, unknown> | undefined,
          false
        );
        if (payload) setAlarmData(payload);
      }
    );

    return () => {
      active = false;
      receivedSubscription?.remove?.();
      responseSubscription?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  const handleCompleteHabit = async (habitId: string) => {
    try {
      const today = formatDateKey(new Date());
      await useHabitsStore.getState().completeHabitForDate(habitId, today);
    } catch (e) {
      console.warn('Failed to mark habit complete from alarm', e);
    }
    setAlarmData(null);
  };

  const handleSnoozeHabit = async () => {
    try {
      if (alarmData && Notifications?.scheduleNotificationAsync) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⏰ Snooze 5 Min: ${alarmData.habitTitle}`,
            body: 'Snooze time is up! Complete your habit now.',
            sound: alarmData.soundId ? `${alarmData.soundId}.wav` : 'default',
            data: alarmData,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 300,
          },
        });
      }
    } catch (e) {
      console.warn('Failed to snooze habit', e);
    }
    setAlarmData(null);
  };

  const handleDismissAlarm = () => {
    setAlarmData(null);
  };

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: COLORS.bgCanvas }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary fallbackTitle="Lenvry Encountered an Issue">
          <ModalPortalProvider>
            <View style={{ flex: 1, backgroundColor: COLORS.bgCanvas }}>
              <Tabs
                backBehavior="initialRoute"
                detachInactiveScreens={false}
                tabBar={renderTabBar}
                screenOptions={{
                  headerShown: false,
                  animation: 'none',
                  lazy: false,
                }}
              >
                <Tabs.Screen name="fitness" options={{ title: 'Fitness' }} />
                <Tabs.Screen name="habits" options={{ title: 'To-Do' }} />
                <Tabs.Screen name="index" options={{ title: 'Home' }} />
                <Tabs.Screen name="nutrition" options={{ title: 'Meal' }} />
                <Tabs.Screen name="finance" options={{ title: 'Finance' }} />
              </Tabs>

              <ModalPortalHost />

              <HabitAlarmModal
                visible={!!alarmData}
                data={alarmData}
                onComplete={handleCompleteHabit}
                onSnooze={handleSnoozeHabit}
                onDismiss={handleDismissAlarm}
              />
            </View>
          </ModalPortalProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
