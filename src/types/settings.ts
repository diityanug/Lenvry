export interface NotificationSettings {
  enabled: boolean;
  defaultSound: string;
  vibrate: boolean;
  fullScreenAlarm: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  defaultSound: 'chime',
  vibrate: true,
  fullScreenAlarm: true,
};

// App-level notification settings.
// Kept separate for storage schema validation and to prevent circular imports.