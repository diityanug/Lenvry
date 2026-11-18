import { create } from 'zustand';
import { readManyStored, updateStored, writeStored } from '../storage';
import {
  Account,
  Transaction,
  CategoryBudget,
  CategoryCustomIcon,
  RecurringBill,
  DebtItem,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../types/finance';

interface FinanceState {
  transactions: Transaction[];
  accounts: Account[];
  expenseCategories: string[];
  incomeCategories: string[];
  categoryBudgets: CategoryBudget[];
  recurringBills: RecurringBill[];
  customCategoryIcons: CategoryCustomIcon[];
  debts: DebtItem[];
  isLoaded: boolean;
  loadFinance: (force?: boolean) => Promise<void>;
  addTransaction: (tx: Transaction) => Promise<boolean>;
  updateTransaction: (tx: Transaction) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  setTransactions: (transactions: Transaction[]) => Promise<boolean>;
  setAccounts: (accounts: Account[]) => Promise<boolean>;
  setCategoryBudgets: (budgets: CategoryBudget[]) => Promise<boolean>;
  setRecurringBills: (bills: RecurringBill[]) => Promise<boolean>;
  setExpenseCategories: (cats: string[]) => Promise<boolean>;
  setIncomeCategories: (cats: string[]) => Promise<boolean>;
  setCustomCategoryIcons: (icons: CategoryCustomIcon[]) => Promise<boolean>;
  setDebts: (debts: DebtItem[]) => Promise<boolean>;
}

const DEFAULT_CASH_ACCOUNT: Account = {
  id: 'acc_1',
  name: 'Cash',
  type: 'Cash',
  currency: 'IDR',
  subAccounts: [{ id: 'sub_1', name: 'Main' }],
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  accounts: [],
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
  incomeCategories: DEFAULT_INCOME_CATEGORIES,
  categoryBudgets: [],
  recurringBills: [],
  customCategoryIcons: [],
  debts: [],
  isLoaded: false,
  loadFinance: async (force = false) => {
    if (get().isLoaded && !force) return;
    try {
      const stored = await readManyStored([
        'financeTransactions',
        'financeAccounts',
        'financeExpenseCategories',
        'financeIncomeCategories',
        'financeCategoryBudgets',
        'financeRecurringBills',
        'financeCustomCategoryIcons',
        'financeDebts',
      ]);

      let validAccounts = stored.financeAccounts ?? [];
      if (validAccounts.length === 0) {
        validAccounts = [DEFAULT_CASH_ACCOUNT];
        await writeStored('financeAccounts', validAccounts);
      }

      set({
        transactions: stored.financeTransactions ?? [],
        accounts: validAccounts,
        expenseCategories: stored.financeExpenseCategories ?? DEFAULT_EXPENSE_CATEGORIES,
        incomeCategories: stored.financeIncomeCategories ?? DEFAULT_INCOME_CATEGORIES,
        categoryBudgets: stored.financeCategoryBudgets ?? [],
        recurringBills: stored.financeRecurringBills ?? [],
        customCategoryIcons: stored.financeCustomCategoryIcons ?? [],
        debts: stored.financeDebts ?? [],
        isLoaded: true,
      });
    } catch (e) {
      console.warn('Failed to load finance data', e);
    }
  },
  addTransaction: async (tx: Transaction) => {
    const previous = get().transactions;
    set({ transactions: [tx, ...previous] });
    try {
      const persisted = await updateStored('financeTransactions', (current) => [tx, ...current]);
      set({ transactions: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to add transaction', e);
      set({ transactions: previous });
      return false;
    }
  },
  updateTransaction: async (tx: Transaction) => {
    const previous = get().transactions;
    set({ transactions: previous.map((t) => (t.id === tx.id ? tx : t)) });
    try {
      const persisted = await updateStored('financeTransactions', (current) =>
        current.map((t) => (t.id === tx.id ? tx : t))
      );
      set({ transactions: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to update transaction', e);
      set({ transactions: previous });
      return false;
    }
  },
  deleteTransaction: async (id: string) => {
    const previous = get().transactions;
    set({ transactions: previous.filter((t) => t.id !== id) });
    try {
      const persisted = await updateStored('financeTransactions', (current) =>
        current.filter((t) => t.id !== id)
      );
      set({ transactions: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to delete transaction', e);
      set({ transactions: previous });
      return false;
    }
  },
  setTransactions: async (transactions: Transaction[]) => {
    const previous = get().transactions;
    set({ transactions });
    try {
      const persisted = await writeStored('financeTransactions', transactions);
      set({ transactions: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist transactions', e);
      set({ transactions: previous });
      return false;
    }
  },
  setAccounts: async (accounts: Account[]) => {
    const previous = get().accounts;
    set({ accounts });
    try {
      const persisted = await writeStored('financeAccounts', accounts);
      set({ accounts: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist accounts', e);
      set({ accounts: previous });
      return false;
    }
  },
  setCategoryBudgets: async (categoryBudgets: CategoryBudget[]) => {
    const previous = get().categoryBudgets;
    set({ categoryBudgets });
    try {
      const persisted = await writeStored('financeCategoryBudgets', categoryBudgets);
      set({ categoryBudgets: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist category budgets', e);
      set({ categoryBudgets: previous });
      return false;
    }
  },
  setRecurringBills: async (recurringBills: RecurringBill[]) => {
    const previous = get().recurringBills;
    set({ recurringBills });
    try {
      const persisted = await writeStored('financeRecurringBills', recurringBills);
      set({ recurringBills: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist recurring bills', e);
      set({ recurringBills: previous });
      return false;
    }
  },
  setExpenseCategories: async (expenseCategories: string[]) => {
    const previous = get().expenseCategories;
    set({ expenseCategories });
    try {
      const persisted = await writeStored('financeExpenseCategories', expenseCategories);
      set({ expenseCategories: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist expense categories', e);
      set({ expenseCategories: previous });
      return false;
    }
  },
  setIncomeCategories: async (incomeCategories: string[]) => {
    const previous = get().incomeCategories;
    set({ incomeCategories });
    try {
      const persisted = await writeStored('financeIncomeCategories', incomeCategories);
      set({ incomeCategories: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist income categories', e);
      set({ incomeCategories: previous });
      return false;
    }
  },
  setCustomCategoryIcons: async (customCategoryIcons: CategoryCustomIcon[]) => {
    const previous = get().customCategoryIcons;
    set({ customCategoryIcons });
    try {
      const persisted = await writeStored('financeCustomCategoryIcons', customCategoryIcons);
      set({ customCategoryIcons: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist custom category icons', e);
      set({ customCategoryIcons: previous });
      return false;
    }
  },
  setDebts: async (debts: DebtItem[]) => {
    const previous = get().debts;
    set({ debts });
    try {
      const persisted = await writeStored('financeDebts', debts);
      set({ debts: persisted });
      return true;
    } catch (e) {
      console.warn('Failed to persist debts', e);
      set({ debts: previous });
      return false;
    }
  },
}));
