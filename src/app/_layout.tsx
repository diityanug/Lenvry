import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
  } catch (err) {
    console.warn('Failed to load expo-notifications in _layout:', err);
  }
}

export default function AppLayout() {
  const [alarmData, setAlarmData] = useState<HabitAlarmData | null>(null);

  useEffect(() => {
    // Initialize notifications & channels safely
    initializeNotifications();

    if (!Notifications || !Notifications.addNotificationReceivedListener) {
      return;
    }

    // Listener 1: Notification received while app is in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(async (notification: any) => {
      const data = notification?.request?.content?.data as any;
      if (data && data.habitTitle) {
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

    // Listener 2: User tapped notification banner / lock screen alert
    const responseSubscription = Notifications.addNotificationResponseReceivedListener?.(async (response: any) => {
      const data = response?.notification?.request?.content?.data as any;
      if (data && data.habitTitle) {
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
      const raw = await AsyncStorage.getItem('@lenvry_habits');
      if (raw) {
        const habits: any[] = JSON.parse(raw);
        const today = new Date().toISOString().split('T')[0];
        const updated = habits.map((h) => {
          if (h.id === habitId) {
            const dates = Array.isArray(h.completedDates) ? h.completedDates : [];
            return {
              ...h,
              completed: true,
              completedDates: Array.from(new Set([...dates, today])),
            };
          }
          return h;
        });
        await AsyncStorage.setItem('@lenvry_habits', JSON.stringify(updated));
      }
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
            title: `⏰ Tunda 5 Min: ${alarmData.habitTitle}`,
            body: 'Waktu tunda habis! Yuk selesaikan habit ini sekarang.',
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

      {/* Global In-App Full-Screen Alarm Modal */}
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