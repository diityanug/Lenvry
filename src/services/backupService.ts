import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export const APP_KEYS = [
  '@wakemove_user_name',
  '@finance_tx',
  '@finance_acc',
  '@finance_exp_cat',
  '@finance_inc_cat',
  '@finance_category_budgets',
  '@finance_recurring',
  '@lenvry_habits',
  '@lenvry_habit_categories',
  '@lenvry_habit_category_icons',
  '@fitness_workouts',
  '@fitness_install_date',
  '@lenvry_steps_logs',
  '@lenvry_general_notes',
  '@wakemove_nutrition_logs',
  '@wakemove_nutrition_targets',
  '@wakemove_custom_foods',
  '@wakemove_water_logs',
];

export async function exportBackup(): Promise<{ success: boolean; message?: string }> {
  try {
    const stores = await AsyncStorage.multiGet(APP_KEYS);
    const backupData: Record<string, any> = {};

    stores.forEach(([key, value]) => {
      if (value !== null) {
        try {
          backupData[key] = JSON.parse(value);
        } catch {
          backupData[key] = value;
        }
      }
    });

    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `wakemove_backup_${Date.now()}.json`;

    // Modern Android: Use StorageAccessFramework to let user pick folder (e.g., Download) or save directly
    if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
      try {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const createdUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'application/json'
          );
          await FileSystem.writeAsStringAsync(createdUri, jsonString, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          return { success: true };
        }
      } catch (err) {
        console.warn('SAF storage request failed, falling back to share sheet:', err);
      }
    }

    const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    if (!baseDir) {
      return { success: false, message: 'Storage directory is unavailable.' };
    }

    const fileUri = `${baseDir}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, jsonString);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Backup File',
        UTI: 'public.json',
      });
      return { success: true };
    }
    return { success: false, message: 'Sharing feature is not supported on this device.' };
  } catch (e) {
    console.error('Backup error:', e);
    return { success: false, message: 'Failed to export backup data.' };
  }
}

export async function importRestore(
  onSuccess?: () => void
): Promise<{ success: boolean; message?: string; canceled?: boolean }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, canceled: true };
    }

    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    const parsedData = JSON.parse(fileContent);

    const keyValuePairs: [string, string][] = [];
    APP_KEYS.forEach((key) => {
      if (parsedData[key] !== undefined) {
        keyValuePairs.push([
          key,
          typeof parsedData[key] === 'string'
            ? parsedData[key]
            : JSON.stringify(parsedData[key]),
        ]);
      }
    });

    if (keyValuePairs.length === 0) {
      return { success: false, message: 'Invalid backup file format.' };
    }

    await AsyncStorage.multiSet(keyValuePairs);
    if (onSuccess) onSuccess();
    return { success: true };
  } catch (e) {
    console.error('Restore error:', e);
    return { success: false, message: 'Corrupted backup file or cannot be read.' };
  }
}

export async function clearAllAppData(
  onSuccess?: () => void
): Promise<{ success: boolean; message?: string }> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys);
    if (onSuccess) onSuccess();
    return { success: true };
  } catch (e) {
    console.error('Clear data error:', e);
    return { success: false, message: 'Failed to reset application data.' };
  }
}