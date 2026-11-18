import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import {
  SCHEMA_VERSION,
  clearAllStored,
  exportStoredData,
  readStored,
  restoreStoredData,
} from '../storage';
import { formatDateKey } from '../constants/date';
import { syncCustomFoodsToDb } from './nutritionDatabaseService';
import { initializeAllStores } from '../stores';

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

async function writeTempCacheFile(fileName: string, content: string): Promise<File> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(content);
  return file;
}

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

    // Let Android users pick a persistent destination directory via SAF first.
    if (Platform.OS === 'android') {
      try {
        const directory = await Directory.pickDirectoryAsync();
        const createdFile = directory.createFile(fileName, 'application/json');
        await createdFile.write(jsonString);
        return { success: true };
      } catch (err) {
        console.warn('Directory picker skipped or failed, falling back to share sheet:', err);
      }
    }

    const file = await writeTempCacheFile(fileName, jsonString);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
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
    const pickedFile = new File(fileUri);
    const fileContent = await pickedFile.text();
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

    try {
      const restoredCustomFoods = (await readStored('customFoods')) ?? [];
      await syncCustomFoodsToDb(restoredCustomFoods);
    } catch (err) {
      console.warn('Failed to sync custom foods to SQLite on restore:', err);
    }

    await initializeAllStores(true);

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
    try {
      await syncCustomFoodsToDb([]);
    } catch (err) {
      console.warn('Failed to clear custom foods from SQLite:', err);
    }
    await initializeAllStores(true);
    if (onSuccess) onSuccess();
    return { success: true };
  } catch (e) {
    console.error('Clear data error:', e);
    return { success: false, message: 'Failed to reset application data.' };
  }
}

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export finance transactions as a standard CSV spreadsheet file.
 */
export async function exportTransactionsCsv(): Promise<{ success: boolean; message?: string; count?: number }> {
  try {
    const [transactionsRaw, accountsRaw] = await Promise.all([
      readStored('financeTransactions'),
      readStored('financeAccounts'),
    ]);
    const transactions = transactionsRaw ?? [];
    const accounts = accountsRaw ?? [];

    if (transactions.length === 0) {
      return { success: false, message: 'No transactions found to export.' };
    }

    const accountsById = new Map(accounts.map((a) => [a.id, a]));
    const resolvePocketName = (accId?: string, subId?: string, deletedName?: string) => {
      if (!accId) return '';
      const acc = accountsById.get(accId);
      const sub = acc?.subAccounts?.find((s) => s.id === subId);
      if (sub) return sub.name;
      return deletedName ? `${deletedName} (Deleted)` : subId || '';
    };

    const headers = [
      'ID',
      'Date',
      'Type',
      'Category',
      'Amount',
      'Description',
      'Account ID',
      'Account',
      'Pocket',
      'Currency',
      'To Account',
      'To Pocket',
      'To Amount',
      'To Currency',
      'Exchange Rate',
    ];
    const rows = transactions.map((t) => {
      const srcAcc = accountsById.get(t.accountId);
      const dstAcc = t.toAccountId ? accountsById.get(t.toAccountId) : undefined;
      return [
        escapeCsvCell(t.id),
        escapeCsvCell(t.date),
        escapeCsvCell(t.type),
        escapeCsvCell(t.category),
        escapeCsvCell(t.amount),
        escapeCsvCell(t.description),
        escapeCsvCell(t.accountId),
        escapeCsvCell(srcAcc?.name ?? ''),
        escapeCsvCell(resolvePocketName(t.accountId, t.subAccountId, t.deletedSubAccountName)),
        escapeCsvCell(srcAcc?.currency ?? ''),
        escapeCsvCell(dstAcc?.name ?? ''),
        escapeCsvCell(resolvePocketName(t.toAccountId, t.toSubAccountId, t.deletedToSubAccountName)),
        escapeCsvCell(t.toAmount ?? ''),
        escapeCsvCell(dstAcc?.currency ?? ''),
        escapeCsvCell(t.exchangeRate ?? ''),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const fileName = `lenvry_transactions_${formatDateKey(new Date())}.csv`;
    const file = await writeTempCacheFile(fileName, csvContent);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
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
