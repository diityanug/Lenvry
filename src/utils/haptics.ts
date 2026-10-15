import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Trigger success haptic notification (e.g. habit completed, transaction saved, workout logged).
 */
export const hapticSuccess = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
};

/**
 * Trigger light haptic tap (e.g. checkbox uncheck, chip select, tab switch).
 */
export const hapticLight = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
};

/**
 * Trigger medium haptic bump (e.g. water cup added, counter increment).
 */
export const hapticMedium = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
};

/**
 * Trigger warning haptic (e.g. delete action, reset).
 */
export const hapticWarning = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}
};

/**
 * Trigger selection tick (e.g. wheel picker, date navigation).
 */
export const hapticSelection = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {}
};
