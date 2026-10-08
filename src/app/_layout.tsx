import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { ensureSchema, updateStored } from '../storage';
import CurvedTabBar from '../components/Navigation/CurvedTabBar';
import HabitAlarmModal, { HabitAlarmData } from '../components/Habits/HabitAlarmModal';
import {
  initializeNotifications,
  getNotificationSettings,
} from '../services/habitNotificationService';
import { isAndroidExpoGo } from '../utils/expoGoHelper';
import { COLORS } from '../constants/theme';

let Notifications: any = null;
if (!isAndroidExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch (err) {
    console.warn('Failed to load expo-notifications in _layout:', err);
  }
}

export default function AppLayout() {
  const [alarmData, setAlarmData] = useState<HabitAlarmData | null>(null);

  useEffect(() => {
    // Validate storage schema once per launch.
    ensureSchema();

    // Init notifications.
    initializeNotifications();

    if (!Notifications || !Notifications.addNotificationReceivedListener) {
      return;
    }

    // Foreground notification listener.
    const receivedSubscription = Notifications.addNotificationReceivedListener(async (notification: any) => {
      const data = notification?.request?.content?.data as any;
      if (data && data.habitTitle) {
        if (data.targetDate) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const todayKey = `${year}-${month}-${day}`;

          if (data.frequency === 'once' && todayKey !== data.targetDate) return;
          if (todayKey < data.targetDate) return;
        }

        const settings = await getNotificationSettings();
        if (settings.fullScreenAlarm) {
          setAlarmData({
            habitId: data.habitId || '',
            habitTitle: data.habitTitle,
            habitCategory: data.habitCategory,
            reminderTime: data.reminderTime,
            soundId: data.soundId || settings.defaultSound || 'chime',
          });
        }
      }
    });

    // Tapped notification listener.
    const responseSubscription = Notifications.addNotificationResponseReceivedListener?.(async (response: any) => {
      const data = response?.notification?.request?.content?.data as any;
      if (data && data.habitTitle) {
        if (data.targetDate) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const todayKey = `${year}-${month}-${day}`;

          if (data.frequency === 'once' && todayKey !== data.targetDate) return;
          if (todayKey < data.targetDate) return;
        }

        const settings = await getNotificationSettings();
        setAlarmData({
          habitId: data.habitId || '',
          habitTitle: data.habitTitle,
          habitCategory: data.habitCategory,
          reminderTime: data.reminderTime,
          soundId: data.soundId || settings.defaultSound || 'chime',
        });
      }
    });

    return () => {
      receivedSubscription?.remove?.();
      responseSubscription?.remove?.();
    };
  }, []);

  const handleCompleteHabit = async (habitId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await updateStored('habits', (current) =>
        current.map((h) => {
          if (h.id !== habitId) return h;
          return {
            ...h,
            completed: true,
            completedDates: Array.from(new Set([...(h.completedDates ?? []), today])),
          };
        })
      );
    } catch (e) {
      console.warn('Failed to mark habit complete from alarm', e);
    }
    setAlarmData(null);
  };

  const handleSnoozeHabit = async (habitId: string) => {
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
            type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL || 'timeInterval',
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

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgCanvas }}>
      <Tabs
        initialRouteName="index"
        backBehavior="initialRoute"
        tabBar={(props: any) => <CurvedTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Tabs.Screen name="fitness" options={{ title: 'Fitness' }} />
        <Tabs.Screen name="habits" options={{ title: 'To-Do' }} />
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="nutrition" options={{ title: 'Meal' }} />
        <Tabs.Screen name="finance" options={{ title: 'Finance' }} />
      </Tabs>

      {/* Global full-screen alarm */}
      <HabitAlarmModal
        visible={!!alarmData}
        data={alarmData}
        onComplete={handleCompleteHabit}
        onSnooze={handleSnoozeHabit}
        onDismiss={handleDismissAlarm}
      />
    </View>
  );
}