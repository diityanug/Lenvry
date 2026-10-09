import { useState, useCallback, useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { useFinanceStore } from '../stores';
import { AppAlertConfig } from '../components/Common/AppAlertModal';

export function useFinanceData() {
  const transactions = useFinanceStore((s) => s.transactions);
  const setTransactions = useFinanceStore((s) => s.setTransactions);

  const accounts = useFinanceStore((s) => s.accounts);
  const setAccounts = useFinanceStore((s) => s.setAccounts);

  const expenseCategories = useFinanceStore((s) => s.expenseCategories);
  const setExpenseCategories = useFinanceStore((s) => s.setExpenseCategories);

  const incomeCategories = useFinanceStore((s) => s.incomeCategories);
  const setIncomeCategories = useFinanceStore((s) => s.setIncomeCategories);

  const categoryBudgets = useFinanceStore((s) => s.categoryBudgets);
  const setCategoryBudgets = useFinanceStore((s) => s.setCategoryBudgets);

  const recurringBills = useFinanceStore((s) => s.recurringBills);
  const setRecurringBills = useFinanceStore((s) => s.setRecurringBills);

  const customCategoryIcons = useFinanceStore((s) => s.customCategoryIcons);
  const setCustomCategoryIcons = useFinanceStore((s) => s.setCustomCategoryIcons);

  const loadData = useFinanceStore((s) => s.loadFinance);

  const [selectedMonthFilter, setSelectedMonthFilter] = useState(new Date());
  const [homeTxFilter, setHomeTxFilter] = useState<'all' | 'expense' | 'income'>('all');

  // Alert State
  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = useCallback(
    (
      alertType: AppAlertConfig['type'],
      title: string,
      message: string,
      confirmText = 'OK',
      cancelText?: string,
      onConfirm?: () => void
    ) => {
      setAlertConfig({
        visible: true,
        type: alertType,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm,
      });
    },
    []
  );

  const closeAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    loadData();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadData();
      }
    });

    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
    const msToMidnight = Math.max(1000, midnight.getTime() - now.getTime());

    const timer = setTimeout(() => {
      loadData();
    }, msToMidnight);

    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [loadData]);

  const getSubBalance = useCallback(
    (accId: string, subId: string) => {
      return transactions.reduce((sum, t) => {
        if (t.type === 'income' && t.accountId === accId && t.subAccountId === subId) {
          return sum + t.amount;
        }
        if (t.type === 'expense' && t.accountId === accId && t.subAccountId === subId) {
          return sum - t.amount;
        }
        if (t.type === 'transfer') {
          if (t.accountId === accId && t.subAccountId === subId) {
            return sum - t.amount;
          }
          if (t.toAccountId === accId && t.toSubAccountId === subId) {
            return sum + t.amount;
          }
        }
        return sum;
      }, 0);
    },
    [transactions]
  );

  const getAccBalance = useCallback(
    (accId: string) => {
      const acc = accounts.find((a) => a.id === accId);
      if (!acc) return 0;
      return acc.subAccounts.reduce((sum, sub) => sum + getSubBalance(accId, sub.id), 0);
    },
    [accounts, getSubBalance]
  );

  const totalBalanceIDR = useMemo(() => {
    return accounts
      .filter((a) => a.currency === 'IDR')
      .reduce((sum, acc) => sum + getAccBalance(acc.id), 0);
  }, [accounts, getAccBalance]);

  const totalBalanceUSD = useMemo(() => {
    return accounts
      .filter((a) => a.currency === 'USD')
      .reduce((sum, acc) => sum + getAccBalance(acc.id), 0);
  }, [accounts, getAccBalance]);

  const filteredMonthlyTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === selectedMonthFilter.getMonth() &&
        d.getFullYear() === selectedMonthFilter.getFullYear()
      );
    });
  }, [transactions, selectedMonthFilter]);

  const monthlyIncomeIDR = useMemo(() => {
    return filteredMonthlyTransactions
      .filter((t) => t.type === 'income' && accounts.find((a) => a.id === t.accountId)?.currency !== 'USD')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredMonthlyTransactions, accounts]);

  const monthlyExpenseIDR = useMemo(() => {
    return filteredMonthlyTransactions
      .filter((t) => t.type === 'expense' && accounts.find((a) => a.id === t.accountId)?.currency !== 'USD')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredMonthlyTransactions, accounts]);

  const monthlyIncomeUSD = useMemo(() => {
    return filteredMonthlyTransactions
      .filter((t) => t.type === 'income' && accounts.find((a) => a.id === t.accountId)?.currency === 'USD')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredMonthlyTransactions, accounts]);

  const monthlyExpenseUSD = useMemo(() => {
    return filteredMonthlyTransactions
      .filter((t) => t.type === 'expense' && accounts.find((a) => a.id === t.accountId)?.currency === 'USD')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredMonthlyTransactions, accounts]);

  const sortedTransactions = useMemo(() => {
    return [...filteredMonthlyTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredMonthlyTransactions]);

  const displayedHomeTransactions = useMemo(() => {
    return sortedTransactions.filter((t) => {
      if (homeTxFilter === 'all') return true;
      return t.type === homeTxFilter;
    });
  }, [sortedTransactions, homeTxFilter]);

  return {
    transactions,
    setTransactions,
    accounts,
    setAccounts,
    expenseCategories,
    setExpenseCategories,
    incomeCategories,
    setIncomeCategories,
    categoryBudgets,
    setCategoryBudgets,
    recurringBills,
    setRecurringBills,
    customCategoryIcons,
    setCustomCategoryIcons,
    selectedMonthFilter,
    setSelectedMonthFilter,
    homeTxFilter,
    setHomeTxFilter,
    loadData,
    alertConfig,
    showAlert,
    closeAlert,
    getSubBalance,
    getAccBalance,
    totalBalanceIDR,
    totalBalanceUSD,
    monthlyIncomeIDR,
    monthlyExpenseIDR,
    monthlyIncomeUSD,
    monthlyExpenseUSD,
    displayedHomeTransactions,
    filteredMonthlyTransactions,
  };
}
