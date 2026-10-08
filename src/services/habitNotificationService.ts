import { Platform } from 'react-native';
import { readStoredOr, updateStored } from '../storage';
import { Habit } from '../types/habits';
import { DEFAULT_NOTIFICATION_SETTINGS, NotificationSettings } from '../types/settings';
import { isAndroidExpoGo } from '../utils/expoGoHelper';

// On Android Expo Go (SDK 53+), importing/calling expo-notifications causes an immediate crash.
// Provide safe fallbacks so the app runs smoothly in Expo Go without errors.
let Notifications: any = null;
if (!isAndroidExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
  } catch (err) {
    console.warn('Failed to load expo-notifications:', err);
  }
}

let createAudioPlayerFunc: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const expoAudio = require('expo-audio');
  createAudioPlayerFunc = expoAudio.createAudioPlayer;
} catch {
  console.log('Native expo-audio module not loaded in Expo Go. Sound preview disabled.');
}

export interface SoundOption {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  file?: any;
  soundFileName?: string; // used for Android notification channel
  channelId: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'chime',
    name: 'Crystal Chime',
    subtitle: 'Clear & soothing',
    icon: 'notifications',
    file: require('../../assets/sounds/chime.wav'),
    soundFileName: 'chime.wav',
    channelId: 'habit_reminder_chime',
  },
  {
    id: 'digital',
    name: 'Digital Beep',
    subtitle: 'Modern & focused',
    icon: 'alarm',
    file: require('../../assets/sounds/digital.wav'),
    soundFileName: 'digital.wav',
    channelId: 'habit_reminder_digital',
  },
  {
    id: 'marimba',
    name: 'Wood Marimba',
    subtitle: 'Lively & rhythmic',
    icon: 'musical-notes',
    file: require('../../assets/sounds/marimba.wav'),
    soundFileName: 'marimba.wav',
    channelId: 'habit_reminder_marimba',
  },
  {
    id: 'zen',
    name: 'Zen Singing Bowl',
    subtitle: 'Harmonic & relaxing',
    icon: 'sparkles',
    file: require('../../assets/sounds/zen.wav'),
    soundFileName: 'zen.wav',
    channelId: 'habit_reminder_zen',
  },
  {
    id: 'system',
    name: 'Default System',
    subtitle: 'Default device sound',
    icon: 'phone-portrait-outline',
    soundFileName: 'default',
    channelId: 'habit_reminder_system',
  },
];

// Re-exported so existing importers keep working.
export type { NotificationSettings };

// Global preview player instance
let currentPreviewPlayer: any = null;
let currentPreviewId: string | null = null;

/**
 * Play preview sound for testing or selection
 */
export async function playSoundPreview(soundId: string, onStop?: () => void): Promise<boolean> {
  try {
    stopSoundPreview();

    const sound = SOUND_OPTIONS.find((s) => s.id === soundId) || SOUND_OPTIONS[0];
    if (!sound.file || !createAudioPlayerFunc) {
      // System default sound or running in Expo Go without native expo-audio
      return false;
    }

    const player = createAudioPlayerFunc(sound.file);
    currentPreviewPlayer = player;
    currentPreviewId = soundId;

    player.play();

    // Auto cleanup after 3 seconds
    setTimeout(() => {
      if (currentPreviewPlayer === player) {
        stopSoundPreview();
        if (onStop) onStop();
      }
    }, 3000);

    return true;
  } catch (error) {
    console.warn('Failed to play sound preview', error);
    return false;
  }
}

/**
 * Stop active sound preview
 */
export function stopSoundPreview(): void {
  if (currentPreviewPlayer) {
    try {
      currentPreviewPlayer.pause();
    } catch {
      // ignore
    }
    currentPreviewPlayer = null;
    currentPreviewId = null;
  }
}

/**
 * Check if a sound is currently previewing
 */
export function getActivePreviewId(): string | null {
  return currentPreviewId;
}

/**
 * Get notification settings from storage
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    return await readStoredOr('notificationSettings');
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

/**
 * Save notification settings
 */
export async function saveNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  try {
    // Read-modify-write is done under the storage lock so two quick toggles
    // (e.g. sound + vibration) cannot drop one of the changes.
    return await updateStored('notificationSettings', (current) => ({ ...current, ...settings }));
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications || !Notifications.getPermissionsAsync) {
    return false;
  }
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted' && Notifications.requestPermissionsAsync) {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Error requesting notification permission', err);
    return false;
  }
}

/**
 * Set up Android notification channels for each sound
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android' || !Notifications || !Notifications.setNotificationChannelAsync) return;

  try {
    for (const option of SOUND_OPTIONS) {
      await Notifications.setNotificationChannelAsync(option.channelId, {
        name: `Habit: ${option.name}`,
        description: `Notification channel for habit reminders with ${option.name}`,
        importance: Notifications.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 300, 150, 300],
        lightColor: '#10B981',
        sound: option.soundFileName || 'default',
        enableVibrate: true,
        bypassDnd: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC ?? 1,
      });
    }
  } catch (err) {
    console.warn('Failed to configure Android notification channels', err);
  }
}

/**
 * Global initialization of notifications
 */
export async function initializeNotifications(): Promise<void> {
  if (!Notifications) {
    return;
  }
  // Set in-app foreground notification presentation behavior
  if (Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async (notification: any) => {
        const data = notification?.request?.content?.data;
        if (data && data.targetDate) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const todayKey = `${year}-${month}-${day}`;

          // If this is a one-time reminder and today is NOT the target date, do not ring!
          if (data.frequency === 'once' && todayKey !== data.targetDate) {
            return {
              shouldShowBanner: false,
              shouldShowList: false,
              shouldPlaySound: false,
              shouldSetBadge: false,
            };
          }
          // If scheduled for a future date, do not ring today!
          if (todayKey < data.targetDate) {
            return {
              shouldShowBanner: false,
              shouldShowList: false,
              shouldPlaySound: false,
              shouldSetBadge: false,
            };
          }
        }

        return {
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });
  }

  await setupNotificationChannels();
}

/**
 * Parse reminder time string "HH:MM AM/PM" to 24h hour and minute
 */
function parseTimeString(timeStr?: string): { hour: number; minute: number } | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const numbers = clean.replace(/[^0-9:]/g, '').split(':');

  let h = parseInt(numbers[0] || '0', 10);
  let m = parseInt(numbers[1] || '0', 10);
  if (isNaN(h)) return null;
  if (isNaN(m)) m = 0;

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return { hour: Math.max(0, Math.min(23, h)), minute: Math.max(0, Math.min(59, m)) };
}

/**
 * Cancel any existing scheduled notifications for a habit
 */
export async function cancelHabitReminder(notificationId?: string): Promise<void> {
  if (!notificationId || !Notifications || !Notifications.cancelScheduledNotificationAsync) return;

  try {
    // If multiple IDs separated by comma
    const ids = notificationId.split(',').map((id) => id.trim()).filter(Boolean);
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  } catch (e) {
    console.warn('Failed to cancel scheduled notification', e);
  }
}

/**
 * Schedule reminder notification(s) for a habit
 * Returns notification identifier string (or comma-separated string if multiple)
 */
export async function scheduleHabitReminder(habit: Habit): Promise<string | undefined> {
  if (!Notifications || !Notifications.scheduleNotificationAsync) {
    return undefined;
  }

  if (!habit.reminderTime) {
    if (habit.notificationId) {
      await cancelHabitReminder(habit.notificationId);
    }
    return undefined;
  }

  // Cancel previous first
  if (habit.notificationId) {
    await cancelHabitReminder(habit.notificationId);
  }

  const parsed = parseTimeString(habit.reminderTime);
  if (!parsed) return undefined;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return undefined;

  const settings = await getNotificationSettings();
  if (!settings.enabled) return undefined;

  const soundId = habit.reminderSound || settings.defaultSound || 'chime';
  const soundOption = SOUND_OPTIONS.find((s) => s.id === soundId) || SOUND_OPTIONS[0];

  const content: any = {
    title: `⏰ Time for: ${habit.title}`,
    body: habit.description ? habit.description : 'Complete your daily habit now!',
    sound: soundOption.soundFileName || 'default',
    data: {
      habitId: habit.id,
      habitTitle: habit.title,
      habitCategory: habit.category,
      reminderTime: habit.reminderTime,
      soundId,
      fullScreenAlarm: settings.fullScreenAlarm,
      targetDate: habit.date,
      frequency: habit.frequency || 'once',
    },
  };

  const scheduledIds: string[] = [];

  try {
    const freq = habit.frequency || 'once';
    const now = new Date();

    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth();
    let targetDay = now.getDate();

    if (habit.date) {
      const parts = habit.date.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          targetYear = y;
          targetMonth = m;
          targetDay = d;
        }
      }
    }

    if (freq === 'once') {
      // Exactly schedule on the specific habit.date at parsed.hour:minute
      const target = new Date(targetYear, targetMonth, targetDay, parsed.hour, parsed.minute, 0, 0);

      // Only schedule if the target time is in the future
      if (target.getTime() > now.getTime()) {
        const id = await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes?.DATE || 'date',
            date: target,
            channelId: soundOption.channelId,
          },
        });
        scheduledIds.push(id);
      } else {
        // Time on this date has already passed
        return undefined;
      }
    } else if (freq === 'daily') {
      // Repeat daily
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.DAILY || 'daily',
          hour: parsed.hour,
          minute: parsed.minute,
          channelId: soundOption.channelId,
        },
      });
      scheduledIds.push(id);
    } else if (freq === 'weekdays') {
      // Repeat Monday to Friday (weekdays 2=Mon to 6=Fri in UNCalendar/Weekly)
      for (const weekday of [2, 3, 4, 5, 6]) {
        const id = await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes?.WEEKLY || 'weekly',
            weekday,
            hour: parsed.hour,
            minute: parsed.minute,
            channelId: soundOption.channelId,
          },
        });
        scheduledIds.push(id);
      }
    } else if (freq === 'custom_days' && Array.isArray(habit.repeatDays) && habit.repeatDays.length > 0) {
      // habit.repeatDays: 0=Sun, 1=Mon, ..., 6=Sat
      // expo-notifications weekly: 1=Sun, 2=Mon, ..., 7=Sat
      for (const d of habit.repeatDays) {
        const weekday = d + 1;
        const id = await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes?.WEEKLY || 'weekly',
            weekday,
            hour: parsed.hour,
            minute: parsed.minute,
            channelId: soundOption.channelId,
          },
        });
        scheduledIds.push(id);
      }
    }

    return scheduledIds.join(',');
  } catch (err) {
    console.warn('Failed to schedule habit reminder notification', err);
    return undefined;
  }
}

/**
 * Trigger a test notification in 3 seconds to let user hear sound and see banner
 */
export async function triggerTestNotification(soundId: string): Promise<boolean> {
  if (!Notifications || !Notifications.scheduleNotificationAsync) {
    return false;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return false;

  const soundOption = SOUND_OPTIONS.find((s) => s.id === soundId) || SOUND_OPTIONS[0];

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Notification Sound Test',
        body: `Alarm sounding with tone: ${soundOption.name}`,
        sound: soundOption.soundFileName || 'default',
        data: {
          isTest: true,
          habitTitle: 'Habit Reminder Test',
          soundId,
          reminderTime: 'Now',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL || 'timeInterval',
        seconds: 3,
        channelId: soundOption.channelId,
      },
    });
    return true;
  } catch (e) {
    console.warn('Failed to schedule test notification', e);
    return false;
  }
}
