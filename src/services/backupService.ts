import { Alert } from 'react-native';
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
  '@lenvry_habits',
  '@lenvry_habit_categories',
  '@fitness_workouts',
  '@fitness_install_date',
];

export async function exportBackup(): Promise<boolean> {
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

    const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    if (!baseDir) {
      Alert.alert('Error', 'Direktori penyimpanan tidak tersedia.');
      return false;
    }

    const fileUri = `${baseDir}wakemove_backup_${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2));

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Simpan File Backup',
        UTI: 'public.json',
      });
      return true;
    }
    Alert.alert('Error', 'Fitur sharing tidak didukung di perangkat ini.');
    return false;
  } catch (error) {
    Alert.alert('Gagal Backup', 'Terjadi kesalahan saat mengekspor data.');
    return false;
  }
}

export async function importRestore(onSuccess: () => void): Promise<void> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

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
      Alert.alert('Format Salah', 'File ini bukan backup valid aplikasi.');
      return;
    }

    await AsyncStorage.multiSet(keyValuePairs);
    onSuccess();
    Alert.alert('Berhasil', 'Semua data berhasil dipulihkan.');
  } catch (error) {
    Alert.alert('Gagal Restore', 'Berkas rusak atau tidak dapat dibaca.');
  }
}

export async function clearAllAppData(onSuccess: () => void): Promise<void> {
  Alert.alert(
    'Reset Semua Data?',
    'Tindakan ini menghapus seluruh catatan kebugaran, habit, dan finansial secara permanen.',
    [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            const keys = await AsyncStorage.getAllKeys();
            await AsyncStorage.multiRemove(keys);
            onSuccess();
            Alert.alert('Selesai', 'Seluruh data lokal telah dibersihkan.');
          } catch (error) {
            Alert.alert('Error', 'Gagal mereset data aplikasi.');
          }
        },
      },
    ]
  );
}