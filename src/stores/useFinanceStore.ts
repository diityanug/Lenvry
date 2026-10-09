import { create } from 'zustand';
import { readStored, writeStored } from '../storage';
import {
  Account,
  Transaction,
  CategoryBudget,
  CategoryCustomIcon,
  RecurringBill,
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
  isLoaded: boolean;
  loadFinance: () => Promise<void>;
  addTransaction: (tx: Transaction) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setTransactions: (transactions: Transaction[]) => Promise<void>;
  setAccounts: (accounts: Account[]) => Promise<void>;
  setCategoryBudgets: (budgets: CategoryBudget[]) => Promise<void>;
  setRecurringBills: (bills: RecurringBill[]) => Promise<void>;
  setExpenseCategories: (cats: string[]) => Promise<void>;
  setIncomeCategories: (cats: string[]) => Promise<void>;
  setCustomCategoryIcons: (icons: CategoryCustomIcon[]) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  accounts: [],
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
  incomeCategories: DEFAULT_INCOME_CATEGORIES,
  categoryBudgets: [],
  recurringBills: [],
  customCategoryIcons: [],
  isLoaded: false,
  loadFinance: async () => {
    try {
      const [
        transactions,
        accounts,
        expenseCategories,
        incomeCategories,
        categoryBudgets,
        recurringBills,
        customCategoryIcons,
      ] = await Promise.all([
        readStored('financeTransactions'),
        readStored('financeAccounts'),
        readStored('financeExpenseCategories'),
        readStored('financeIncomeCategories'),
        readStored('financeCategoryBudgets'),
        readStored('financeRecurringBills'),
        readStored('financeCustomCategoryIcons'),
      ]);

      let validAccounts = accounts ?? [];
      if (validAccounts.length === 0) {
        validAccounts = [
          {
            id: 'acc_1',
            name: 'Cash',
            type: 'Cash',
            currency: 'IDR',
            subAccounts: [{ id: 'sub_1', name: 'Main' }],
          },
        ];
        await writeStored('financeAccounts', validAccounts);
      }

      set({
        transactions: transactions ?? [],
        accounts: validAccounts,
        expenseCategories: expenseCategories ?? DEFAULT_EXPENSE_CATEGORIES,
        incomeCategories: incomeCategories ?? DEFAULT_INCOME_CATEGORIES,
        categoryBudgets: categoryBudgets ?? [],
        recurringBills: recurringBills ?? [],
        customCategoryIcons: customCategoryIcons ?? [],
        isLoaded: true,
      });
    } catch (e) {
      console.warn('Failed to load finance data', e);
    }
  },
  addTransaction: async (tx: Transaction) => {
    const updated = [tx, ...get().transactions];
    set({ transactions: updated });
    try {
      await writeStored('financeTransactions', updated);
    } catch (e) {
      console.warn('Failed to add transaction', e);
    }
  },
  updateTransaction: async (tx: Transaction) => {
    const updated = get().transactions.map((t) => (t.id === tx.id ? tx : t));
    set({ transactions: updated });
    try {
      await writeStored('financeTransactions', updated);
    } catch (e) {
      console.warn('Failed to update transaction', e);
    }
  },
  deleteTransaction: async (id: string) => {
    const updated = get().transactions.filter((t) => t.id !== id);
    set({ transactions: updated });
    try {
      await writeStored('financeTransactions', updated);
    } catch (e) {
      console.warn('Failed to delete transaction', e);
    }
  },
  setTransactions: async (transactions: Transaction[]) => {
    set({ transactions });
    try {
      await writeStored('financeTransactions', transactions);
    } catch (e) {
      console.warn('Failed to persist transactions', e);
    }
  },
  setAccounts: async (accounts: Account[]) => {
    set({ accounts });
    try {
      await writeStored('financeAccounts', accounts);
    } catch (e) {
      console.warn('Failed to persist accounts', e);
    }
  },
  setCategoryBudgets: async (categoryBudgets: CategoryBudget[]) => {
    set({ categoryBudgets });
    try {
      await writeStored('financeCategoryBudgets', categoryBudgets);
    } catch (e) {
      console.warn('Failed to persist category budgets', e);
    }
  },
  setRecurringBills: async (recurringBills: RecurringBill[]) => {
    set({ recurringBills });
    try {
      await writeStored('financeRecurringBills', recurringBills);
    } catch (e) {
      console.warn('Failed to persist recurring bills', e);
    }
  },
  setExpenseCategories: async (expenseCategories: string[]) => {
    set({ expenseCategories });
    try {
      await writeStored('financeExpenseCategories', expenseCategories);
    } catch (e) {
      console.warn('Failed to persist expense categories', e);
    }
  },
  setIncomeCategories: async (incomeCategories: string[]) => {
    set({ incomeCategories });
    try {
      await writeStored('financeIncomeCategories', incomeCategories);
    } catch (e) {
      console.warn('Failed to persist income categories', e);
    }
  },
  setCustomCategoryIcons: async (customCategoryIcons: CategoryCustomIcon[]) => {
    set({ customCategoryIcons });
    try {
      await writeStored('financeCustomCategoryIcons', customCategoryIcons);
    } catch (e) {
      console.warn('Failed to persist custom category icons', e);
    }
  },
}));
