import { Platform } from 'react-native';
import type * as NotificationsModule from 'expo-notifications';
import type { AudioPlayer, AudioSource } from 'expo-audio';
import { readStoredOr, updateStored } from '../storage';
import { formatDateKey } from '../constants/date';
import { Habit } from '../types/habits';
import { DEFAULT_NOTIFICATION_SETTINGS, NotificationSettings } from '../types/settings';
import { isAndroidExpoGo } from '../utils/expoGoHelper';

type NotificationsApi = typeof NotificationsModule;
type CreateAudioPlayerFn = (source: AudioSource) => AudioPlayer;

// On Android Expo Go (SDK 53+), importing/calling expo-notifications causes an immediate crash.
let Notifications: NotificationsApi | null = null;
if (!isAndroidExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications') as NotificationsApi;
  } catch (err) {
    console.warn('Failed to load expo-notifications:', err);
  }
}

let createAudioPlayerFunc: CreateAudioPlayerFn | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const expoAudio = require('expo-audio') as typeof import('expo-audio');
  createAudioPlayerFunc = expoAudio.createAudioPlayer as CreateAudioPlayerFn;
} catch {
  console.log('Native expo-audio module not loaded in Expo Go. Sound preview disabled.');
}

export interface SoundOption {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  file?: AudioSource;
  soundFileName?: string;
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

export type { NotificationSettings };

let currentPreviewPlayer: AudioPlayer | null = null;
let currentPreviewId: string | null = null;
let previewCleanupTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Checks whether a notification payload scheduled for `targetDate` should be suppressed today.
 */
export function shouldSuppressNotificationForDate(data: Record<string, unknown> | undefined): boolean {
  if (!data || typeof data.targetDate !== 'string' || !data.targetDate) {
    return false;
  }
  const todayKey = formatDateKey(new Date());
  if (data.frequency === 'once' && todayKey !== data.targetDate) {
    return true;
  }
  return todayKey < data.targetDate;
}

/**
 * Play preview sound for testing or selection
 */
export async function playSoundPreview(soundId: string, onStop?: () => void): Promise<boolean> {
  try {
    stopSoundPreview();

    const sound = SOUND_OPTIONS.find((s) => s.id === soundId) || SOUND_OPTIONS[0];
    if (!sound.file || !createAudioPlayerFunc) {
      return false;
    }

    const player = createAudioPlayerFunc(sound.file);
    currentPreviewPlayer = player;
    currentPreviewId = soundId;

    player.play();

    previewCleanupTimer = setTimeout(() => {
      if (currentPreviewPlayer === player) {
        stopSoundPreview();
        onStop?.();
      }
    }, 3000);

    return true;
  } catch (error) {
    console.warn('Failed to play sound preview', error);
    return false;
  }
}

/**
 * Stop active sound preview and release native audio resources
 */
export function stopSoundPreview(): void {
  if (previewCleanupTimer) {
    clearTimeout(previewCleanupTimer);
    previewCleanupTimer = null;
  }
  if (currentPreviewPlayer) {
    try {
      currentPreviewPlayer.pause();
      currentPreviewPlayer.remove?.();
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
    return await updateStored('notificationSettings', (current) => ({ ...current, ...settings }));
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications?.getPermissionsAsync) {
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
  if (Platform.OS !== 'android' || !Notifications?.setNotificationChannelAsync) return;

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
  if (Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification?.request?.content?.data as Record<string, unknown> | undefined;
        if (shouldSuppressNotificationForDate(data)) {
          return {
            shouldShowBanner: false,
            shouldShowList: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          };
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
  if (!notificationId || !Notifications?.cancelScheduledNotificationAsync) return;

  try {
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
 */
export async function scheduleHabitReminder(habit: Habit): Promise<string | undefined> {
  if (!Notifications?.scheduleNotificationAsync) {
    return undefined;
  }

  if (!habit.reminderTime) {
    if (habit.notificationId) {
      await cancelHabitReminder(habit.notificationId);
    }
    return undefined;
  }

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

  const content: NotificationsModule.NotificationContentInput = {
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

    const triggerTypes = Notifications.SchedulableTriggerInputTypes;

    if (freq === 'once') {
      const target = new Date(targetYear, targetMonth, targetDay, parsed.hour, parsed.minute, 0, 0);
      if (target.getTime() <= now.getTime()) {
        return undefined;
      }
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: triggerTypes.DATE,
          date: target,
          channelId: soundOption.channelId,
        },
      });
      scheduledIds.push(id);
    } else if (freq === 'daily') {
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: triggerTypes.DAILY,
          hour: parsed.hour,
          minute: parsed.minute,
          channelId: soundOption.channelId,
        },
      });
      scheduledIds.push(id);
    } else if (freq === 'weekdays') {
      for (const weekday of [2, 3, 4, 5, 6]) {
        const id = await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: triggerTypes.WEEKLY,
            weekday,
            hour: parsed.hour,
            minute: parsed.minute,
            channelId: soundOption.channelId,
          },
        });
        scheduledIds.push(id);
      }
    } else if (freq === 'custom_days' && Array.isArray(habit.repeatDays) && habit.repeatDays.length > 0) {
      for (const d of habit.repeatDays) {
        const weekday = d + 1;
        const id = await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: triggerTypes.WEEKLY,
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
  if (!Notifications?.scheduleNotificationAsync) {
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
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
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
