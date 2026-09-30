import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Check if the application is currently running inside Expo Go.
 * In SDK 53+, remote notifications and certain native modules are removed from Expo Go.
 */
export const isRunningInExpoGo: boolean =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const isAndroidExpoGo: boolean =
  Platform.OS === 'android' && isRunningInExpoGo;
