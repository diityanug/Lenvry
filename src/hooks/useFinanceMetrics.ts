import { useCallback, useMemo } from 'react';
import { Account, CategoryBudget, DebtItem, Transaction } from '../types/finance';
import {
  buildAccountsById,
  buildBalancesMap,
  computeAccountBalance,
  computeMonthlyCashflow,
  computeNetWorthWithDebts,
  computeTotalBalanceByCurrency,
  filterTransactionsByMonth,
  isInvestmentTransaction as checkIsInvestmentTx,
  isOperationalTransaction as checkIsOperationalTx,
} from '../utils/financeCalculations';

interface UseFinanceMetricsParams {
  transactions: Transaction[];
  accounts: Account[];
  debts?: DebtItem[];
  expenseCategories: string[];
  incomeCategories: string[];
  categoryBudgets: CategoryBudget[];
  selectedMonthFilter: Date;
  activeCurrency: 'IDR' | 'USD';
  homeTxFilter: 'all' | 'expense' | 'income' | 'transfer';
  historyTypeFilter: 'all' | 'income' | 'expense' | 'transfer';
  historyCatFilter: string;
  historyIncludeInvestment?: boolean;
}

export function useFinanceMetrics({
  transactions,
  accounts,
  debts = [],
  expenseCategories,
  incomeCategories,
  categoryBudgets,
  selectedMonthFilter,
  activeCurrency,
  homeTxFilter,
  historyTypeFilter,
  historyCatFilter,
  historyIncludeInvestment = false,
}: UseFinanceMetricsParams) {
  const accountsById = useMemo(() => buildAccountsById(accounts), [accounts]);
  const balancesMap = useMemo(() => buildBalancesMap(transactions), [transactions]);

  const getSubBalance = useCallback(
    (accId: string, subId: string) => balancesMap[`${accId}:${subId}`] || 0,
    [balancesMap]
  );

  const getAccBalance = useCallback(
    (accId: string) => computeAccountBalance(accountsById[accId], balancesMap),
    [accountsById, balancesMap]
  );

  const totalBalanceIDR = useMemo(
    () => computeTotalBalanceByCurrency(accounts, balancesMap, 'IDR'),
    [accounts, balancesMap]
  );

  const totalBalanceUSD = useMemo(
    () => computeTotalBalanceByCurrency(accounts, balancesMap, 'USD'),
    [accounts, balancesMap]
  );

  const netWorthSummaryIDR = useMemo(
    () => computeNetWorthWithDebts(accounts, balancesMap, debts, 'IDR'),
    [accounts, balancesMap, debts]
  );

  const netWorthSummaryUSD = useMemo(
    () => computeNetWorthWithDebts(accounts, balancesMap, debts, 'USD'),
    [accounts, balancesMap, debts]
  );

  const isInvestmentTransaction = useCallback(
    (t: Transaction) => checkIsInvestmentTx(t, accountsById),
    [accountsById]
  );

  const isOperationalTransaction = useCallback(
    (t: Transaction) => checkIsOperationalTx(t, accountsById),
    [accountsById]
  );

  const filteredMonthlyTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, selectedMonthFilter),
    [transactions, selectedMonthFilter]
  );

  const operationalMonthlyTransactions = useMemo(
    () => filteredMonthlyTransactions.filter(isOperationalTransaction),
    [filteredMonthlyTransactions, isOperationalTransaction]
  );

  const { monthlyIncomeIDR, monthlyExpenseIDR, monthlyIncomeUSD, monthlyExpenseUSD } = useMemo(
    () => computeMonthlyCashflow(operationalMonthlyTransactions, accountsById),
    [operationalMonthlyTransactions, accountsById]
  );

  const monthlyTransactionsForActiveCurrency = useMemo(
    () =>
      operationalMonthlyTransactions.filter(
        (t) => (accountsById[t.accountId]?.currency || 'IDR') === activeCurrency
      ),
    [operationalMonthlyTransactions, accountsById, activeCurrency]
  );

  const allTransactionsForActiveCurrency = useMemo(
    () =>
      transactions.filter(
        (t) =>
          isOperationalTransaction(t) &&
          (accountsById[t.accountId]?.currency || 'IDR') === activeCurrency
      ),
    [transactions, isOperationalTransaction, accountsById, activeCurrency]
  );

  const activeCategoryBudgets = useMemo(
    () => categoryBudgets.filter((b) => (b.currency || 'IDR') === activeCurrency),
    [categoryBudgets, activeCurrency]
  );

  const sortedTransactions = useMemo(
    () =>
      [...filteredMonthlyTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [filteredMonthlyTransactions]
  );

  const homeNonInvestmentTransactions = useMemo(
    () => sortedTransactions.filter((t) => !isInvestmentTransaction(t)),
    [sortedTransactions, isInvestmentTransaction]
  );

  const displayedHomeTransactions = useMemo(() => {
    if (homeTxFilter === 'all') return homeNonInvestmentTransactions;
    return homeNonInvestmentTransactions.filter((t) => t.type === homeTxFilter);
  }, [homeNonInvestmentTransactions, homeTxFilter]);

  const historyTransactions = useMemo(
    () =>
      transactions
        .filter((t) => {
          if (!historyIncludeInvestment && isInvestmentTransaction(t)) return false;
          if (historyTypeFilter !== 'all' && t.type !== historyTypeFilter) return false;
          if (historyCatFilter !== 'all' && t.category !== historyCatFilter) return false;
          return true;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, historyIncludeInvestment, isInvestmentTransaction, historyTypeFilter, historyCatFilter]
  );

  const historyAvailableCategories = useMemo(() => {
    const specialCats = new Set<string>();
    for (const t of transactions) {
      if (t.category === 'Debt & Loan' || t.category === 'Adjustment') {
        if (historyTypeFilter === 'all' || t.type === historyTypeFilter) {
          specialCats.add(t.category);
        }
      }
    }
    if (historyTypeFilter === 'expense') return Array.from(new Set([...expenseCategories, ...specialCats]));
    if (historyTypeFilter === 'income') return Array.from(new Set([...incomeCategories, ...specialCats]));
    if (historyTypeFilter === 'transfer') return ['Transfer'];
    return Array.from(new Set([...expenseCategories, ...incomeCategories, 'Transfer', ...specialCats]));
  }, [transactions, historyTypeFilter, expenseCategories, incomeCategories]);

  return {
    getSubBalance,
    getAccBalance,
    totalBalanceIDR,
    totalBalanceUSD,
    netWorthSummaryIDR,
    netWorthSummaryUSD,
    monthlyIncomeIDR,
    monthlyExpenseIDR,
    monthlyIncomeUSD,
    monthlyExpenseUSD,
    monthlyTransactionsForActiveCurrency,
    allTransactionsForActiveCurrency,
    activeCategoryBudgets,
    homeNonInvestmentTransactions,
    displayedHomeTransactions,
    historyTransactions,
    historyAvailableCategories,
  };
}
