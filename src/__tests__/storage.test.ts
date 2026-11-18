import { beforeEach, describe, expect, it, mock } from 'bun:test';

const memoryStore = new Map<string, string>();

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

const { decodeRow, encodeRow, PARSERS } = await import('../storage/schema');
const {
  exportStoredData,
  readStored,
  restoreStoredData,
  updateStored,
  writeStored,
} = await import('../storage');
const { STORAGE_KEYS } = await import('../storage/keys');

describe('storage schema and persistence layer', () => {
  beforeEach(() => {
    memoryStore.clear();
  });

  it('decodes raw legacy userName strings and JSON-encoded userName safely', () => {
    expect(decodeRow('userName', 'Aditya')).toBe('Aditya');
    expect(decodeRow('userName', '"Aditya"')).toBe('Aditya');
    expect(decodeRow('userName', '   ')).toBe('User');
    expect(encodeRow('userName', 'Aditya')).toBe('Aditya');
  });

  it('heals corrupt rows and enforces DebtItem and StickyNote invariants', () => {
    const debts = PARSERS.financeDebts([
      {
        id: 'd1',
        originalAmount: '100000',
        paidAmount: 100000,
        status: 'active', // stale status should auto-heal to settled
      },
      null,
      'bad-entry',
    ]);
    expect(debts).toHaveLength(1);
    expect(debts[0].remainingAmount).toBe(0);
    expect(debts[0].status).toBe('settled');

    const usdDriftDebts = PARSERS.financeDebts([
      {
        id: 'd_usd_1',
        type: 'receivable',
        personName: 'Alex',
        title: 'Split',
        originalAmount: 10.3,
        paidAmount: 10.1,
        currency: 'USD',
      },
      {
        id: 'd_usd_2',
        type: 'debt',
        personName: 'Sam',
        title: 'Lunch',
        originalAmount: 0.3,
        paidAmount: 0.1 + 0.2,
        currency: 'USD',
      },
    ]);
    expect(usdDriftDebts[0].remainingAmount).toBe(0.2);
    expect(usdDriftDebts[0].status).toBe('active');
    expect(usdDriftDebts[1].remainingAmount).toBe(0);
    expect(usdDriftDebts[1].status).toBe('settled');

    const linkedTxs = PARSERS.financeTransactions([
      {
        id: 'tx_debt',
        type: 'expense',
        amount: 50,
        category: 'Debt & Loan',
        accountId: 'acc_1',
        subAccountId: 'sub_1',
        debtId: 'd_usd_1',
        debtAction: 'settlement',
        billId: 'bill_1',
      },
    ]);
    expect(linkedTxs[0].debtId).toBe('d_usd_1');
    expect(linkedTxs[0].debtAction).toBe('settlement');
    expect(linkedTxs[0].billId).toBe('bill_1');

    const notes = PARSERS.generalNotes([
      {
        title: 'Legacy',
        content: 'Old body field',
        checklist: [{ title: 'Item 1', completed: true }],
      },
    ]);
    expect(notes).toHaveLength(1);
    expect(notes[0].description).toBe('Old body field');
    expect(notes[0].checklist?.[0].text).toBe('Item 1');
    expect(notes[0].checklist?.[0].done).toBe(true);
  });

  it('serializes concurrent updateStored calls without dropping updates', async () => {
    await writeStored('financeExpenseCategories', ['Food']);

    await Promise.all([
      updateStored('financeExpenseCategories', (curr) => [...curr, 'Transport']),
      updateStored('financeExpenseCategories', (curr) => [...curr, 'Utilities']),
      updateStored('financeExpenseCategories', (curr) => [...curr, 'Health']),
    ]);

    const stored = await readStored('financeExpenseCategories');
    expect(stored).toEqual(['Food', 'Transport', 'Utilities', 'Health']);
  });

  it('exports keyed by raw storage keys and round-trips via restoreStoredData', async () => {
    await writeStored('userName', 'Raka');
    await writeStored('financeTransactions', [
      {
        id: 'tx_1',
        type: 'expense',
        amount: 25000,
        description: 'Coffee',
        category: 'Food & Beverages',
        date: '2026-10-10T08:00:00.000Z',
        accountId: 'acc_1',
        subAccountId: 'sub_1',
      },
    ]);

    const exported = await exportStoredData();
    expect(exported[STORAGE_KEYS.userName]).toBe('Raka');
    expect(Array.isArray(exported[STORAGE_KEYS.financeTransactions])).toBe(true);

    memoryStore.clear();
    const restoredCount = await restoreStoredData(exported);
    expect(restoredCount).toBe(2);
    expect(await readStored('userName')).toBe('Raka');
    const txs = await readStored('financeTransactions');
    expect(txs).toHaveLength(1);
    expect(txs?.[0].description).toBe('Coffee');
  });
});
