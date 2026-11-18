import { beforeEach, describe, expect, it, mock } from 'bun:test';

const memoryStore = new Map<string, string>();
const writtenFiles = new Map<string, string>();
const sharedFiles: { uri: string; mimeType?: string }[] = [];

mock.module('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => memoryStore.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      memoryStore.set(key, value);
    },
    removeItem: async (key: string) => {
      memoryStore.delete(key);
    },
    multiGet: async (keys: readonly string[]) =>
      keys.map((k) => [k, memoryStore.get(k) ?? null] as [string, string | null]),
    multiSet: async (entries: readonly [string, string][]) => {
      for (const [k, v] of entries) {
        memoryStore.set(k, v);
      }
    },
    multiRemove: async (keys: readonly string[]) => {
      for (const k of keys) {
        memoryStore.delete(k);
      }
    },
  },
}));

mock.module('react-native', () => ({
  Platform: { OS: 'ios' },
}));

class MockFile {
  uri: string;
  constructor(...parts: (string | { uri: string })[]) {
    this.uri = parts
      .map((p) => (typeof p === 'string' ? p : p.uri))
      .join('/');
  }
  create() {}
  async write(content: string) {
    writtenFiles.set(this.uri, content);
  }
  async text() {
    return writtenFiles.get(this.uri) ?? '';
  }
}

mock.module('expo-file-system', () => ({
  Paths: { cache: { uri: 'file:///cache' }, document: { uri: 'file:///doc' } },
  File: MockFile,
  Directory: {
    pickDirectoryAsync: async () => {
      throw new Error('Canceled');
    },
  },
}));

mock.module('expo-sharing', () => ({
  isAvailableAsync: async () => true,
  shareAsync: async (uri: string, opts?: { mimeType?: string }) => {
    sharedFiles.push({ uri, mimeType: opts?.mimeType });
  },
}));

mock.module('expo-document-picker', () => ({
  getDocumentAsync: async () => ({ canceled: true, assets: [] }),
}));

mock.module('expo-sqlite', () => ({
  openDatabaseAsync: async () => ({
    execAsync: async () => {},
    getFirstAsync: async () => ({ user_version: 99, count: 9999 }),
    getAllAsync: async () => [],
    prepareAsync: async () => ({ executeAsync: async () => {}, finalizeAsync: async () => {} }),
    withTransactionAsync: async (fn: () => Promise<void>) => fn(),
  }),
}));

mock.module('../services/nutritionDatabaseService', () => ({
  syncCustomFoodsToDb: async () => {},
}));

mock.module('../stores', () => ({
  initializeAllStores: async () => {},
}));

const { writeStored } = await import('../storage');
const { exportBackup, exportTransactionsCsv } = await import('../services/backupService');

describe('backupService', () => {
  beforeEach(() => {
    memoryStore.clear();
    writtenFiles.clear();
    sharedFiles.length = 0;
  });

  it('exports transactions to CSV with proper escaping (regression test for @finance_tx key)', async () => {
    await writeStored('financeAccounts', [
      {
        id: 'acc_1',
        name: 'BCA',
        type: 'Bank',
        currency: 'IDR',
        subAccounts: [{ id: 'sub_1', name: 'Main' }],
      },
      {
        id: 'acc_2',
        name: 'Wise',
        type: 'Bank',
        currency: 'USD',
        subAccounts: [{ id: 'sub_2', name: 'USD Pocket' }],
      },
    ]);
    await writeStored('financeTransactions', [
      {
        id: 'tx_1',
        type: 'expense',
        amount: 55000,
        description: 'Lunch, "Nasi Padang"',
        category: 'Food & Beverages',
        date: '2026-10-12T12:00:00.000Z',
        accountId: 'acc_1',
        subAccountId: 'sub_1',
      },
      {
        id: 'tx_fx',
        type: 'transfer',
        amount: 1600000,
        toAmount: 100,
        exchangeRate: 16000,
        description: 'USD Topup',
        category: 'Transfer',
        date: '2026-10-13T12:00:00.000Z',
        accountId: 'acc_1',
        subAccountId: 'sub_1',
        toAccountId: 'acc_2',
        toSubAccountId: 'sub_2',
      },
    ]);

    const res = await exportTransactionsCsv();
    expect(res.success).toBe(true);
    expect(res.count).toBe(2);
    expect(sharedFiles).toHaveLength(1);
    expect(sharedFiles[0].mimeType).toBe('text/csv');

    const csv = writtenFiles.get(sharedFiles[0].uri) ?? '';
    expect(csv).toContain(
      'ID,Date,Type,Category,Amount,Description,Account ID,Account,Pocket,Currency,To Account,To Pocket,To Amount,To Currency,Exchange Rate'
    );
    expect(csv).toContain('"Lunch, ""Nasi Padang"""');
    expect(csv).toContain('BCA,Main,IDR,Wise,USD Pocket,100,USD,16000');
  });

  it('returns clear message when there are no transactions to export', async () => {
    const res = await exportTransactionsCsv();
    expect(res.success).toBe(false);
    expect(res.message).toBe('No transactions found to export.');
  });

  it('exports full JSON backup envelope with schemaVersion and @finance_tx payload', async () => {
    await writeStored('userName', 'Adi');
    const res = await exportBackup();
    expect(res.success).toBe(true);
    expect(sharedFiles).toHaveLength(1);

    const json = JSON.parse(writtenFiles.get(sharedFiles[0].uri) ?? '{}');
    expect(json.app).toBe('lenvry');
    expect(json.schemaVersion).toBe(1);
    expect(json.data['@wakemove_user_name']).toBe('Adi');
  });
});
