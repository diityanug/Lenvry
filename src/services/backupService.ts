import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import { SCHEMA_VERSION, clearAllStored, exportStoredData, restoreStoredData } from '../storage';

/**
 * Shape of a backup file written by this build.
 *
 * The payload itself lives under `data`, keyed by raw storage key, so it stays
 * readable — and files written by earlier builds (flat, no envelope) still
 * restore through the same code path.
 */
interface BackupFile {
  app: string;
  schemaVersion: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export async function exportBackup(): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await exportStoredData();

    const payload: BackupFile = {
      app: 'lenvry',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const fileName = `lenvry_backup_${Date.now()}.json`;

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
    const parsed = JSON.parse(fileContent) as unknown;

    // Current format nests the rows under `data`; legacy backups are flat.
    const source = isRecord(parsed) && isRecord(parsed.data) ? parsed.data : parsed;

    if (!isRecord(source)) {
      return { success: false, message: 'Invalid backup file format.' };
    }

    // Values from a file are untrusted: the storage layer validates every row.
    const restoredKeys = await restoreStoredData(source);
    if (restoredKeys === 0) {
      return { success: false, message: 'Invalid backup file format.' };
    }

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
    await clearAllStored();
    if (onSuccess) onSuccess();
    return { success: true };
  } catch (e) {
    console.error('Clear data error:', e);
    return { success: false, message: 'Failed to reset application data.' };
  }
}

/**
 * Export finance transactions as a standard CSV spreadsheet file.
 */
export async function exportTransactionsCsv(): Promise<{ success: boolean; message?: string; count?: number }> {
  try {
    const data = await exportStoredData();
    const transactions = Array.isArray(data.financeTransactions) ? (data.financeTransactions as any[]) : [];

    if (transactions.length === 0) {
      return { success: false, message: 'No transactions found to export.' };
    }

    // CSV Headers
    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Description', 'Account ID'];
    const escapeCsv = (str: unknown) => {
      const val = String(str ?? '');
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows = transactions.map((t) => [
      escapeCsv(t.id),
      escapeCsv(t.date),
      escapeCsv(t.type),
      escapeCsv(t.category),
      escapeCsv(t.amount),
      escapeCsv(t.description),
      escapeCsv(t.accountId),
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const fileName = `lenvry_transactions_${new Date().toISOString().slice(0, 10)}.csv`;

    const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    if (!baseDir) {
      return { success: false, message: 'Storage directory is unavailable.' };
    }

    const fileUri = `${baseDir}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Transactions (CSV)',
        UTI: 'public.comma-separated-values-text',
      });
      return { success: true, count: transactions.length };
    }
    return { success: false, message: 'Sharing feature is not supported on this device.' };
  } catch (e) {
    console.error('CSV Export error:', e);
    return { success: false, message: 'Failed to export transactions to CSV.' };
  }
}

