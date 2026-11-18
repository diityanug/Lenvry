import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StatusBar, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import {
  Account,
  Transaction,
  CategoryBudget,
  DebtItem,
  RecurringBill,
  DEFAULT_EXPENSE_CATEGORIES,
  MONTHS,
} from '../types/finance';
import {
  TransactionCard,
  AccountCard,
  AddAccountCard,
  HeroSummaryCard,
} from '../components/Finance/FinanceCards';
import { TransactionModal } from '../components/Finance/TransactionModal';
import { TransactionDetailModal } from '../components/Finance/TransactionDetailModal';
import { AccountDetailModal } from '../components/Finance/AccountDetailModal';
import { HistoryModal } from '../components/Finance/HistoryModal';
import { AddAccountModal } from '../components/Finance/AddAccountModal';
import { SharedCalendarModal } from '../components/Shared/CalendarModal';
import { HeaderActionButton } from '../components/Common/AppButtons';
import { EditBalanceModal, RenameModal, AddCategoryModal } from '../components/Finance/DialogModals';
import { CashflowTrendCard } from '../components/Finance/CashflowTrendCard';
import { CategoryBreakdownCard } from '../components/Finance/CategoryBreakdownCard';
import { CategoryBudgetModal } from '../components/Finance/CategoryBudgetModal';
import { RecurringBillsCard } from '../components/Finance/RecurringBillsCard';
import { DebtsCard } from '../components/Finance/DebtsCard';
import { ManageAccountsModal } from '../components/Finance/ManageAccountsModal';
import { ManageCategoriesModal } from '../components/Finance/ManageCategoriesModal';
import AppAlertModal, { AppAlertConfig } from '../components/Common/AppAlertModal';
import { ErrorBoundary } from '../components/Shared/ErrorBoundary';
import { TAB_BAR_HEIGHT } from '../constants/tabBar';
import { financeStyles as styles } from '../styles/financeStyles';
import { COLORS } from '../constants/theme';
import { useFinanceStore } from '../stores';
import { useDayRollover } from '../hooks/useDayRollover';
import { useFinanceMetrics } from '../hooks/useFinanceMetrics';
import {
  reconcileTransactionsOnAccountDelete,
  resolveFormSubAccountIds,
} from '../utils/financeCalculations';
import { AddDebtCashRecord } from '../components/Finance/debts/AddDebtModal';
import { hapticSuccess } from '../utils/haptics';
import { evaluateArithmetic, roundCurrencyAmount } from '../utils/math';
import { generateId } from '../utils/id';

export default function FinanceTracker() {
  const transactions = useFinanceStore((s) => s.transactions);
  const setTransactions = useFinanceStore((s) => s.setTransactions);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);
  const deleteTransactionFromStore = useFinanceStore((s) => s.deleteTransaction);
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
  const debts = useFinanceStore((s) => s.debts);
  const setDebts = useFinanceStore((s) => s.setDebts);
  const loadFinance = useFinanceStore((s) => s.loadFinance);

  // In-Screen Quick Filter
  const [financeViewMode, setFinanceViewMode] = useState<'overview' | 'insights'>('overview');
  const [homeTxFilter, setHomeTxFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [activeCurrency, setActiveCurrency] = useState<'IDR' | 'USD'>('IDR');

  // Modals Visibility
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [accModalVisible, setAccModalVisible] = useState(false);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [filterCalendarVisible, setFilterCalendarVisible] = useState(false);
  const [accDetailModalVisible, setAccDetailModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [manageAccModalVisible, setManageAccModalVisible] = useState(false);
  const [manageCatModalVisible, setManageCatModalVisible] = useState(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [isPayingBill, setIsPayingBill] = useState(false);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);

  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const [selectedMonthFilter, setSelectedMonthFilter] = useState(new Date());
  const [selectedAccountDetailId, setSelectedAccountDetailId] = useState<string | null>(null);
  const [selectedTxDetailId, setSelectedTxDetailId] = useState<string | null>(null);
  const selectedAccountForDetail = accounts.find((a) => a.id === selectedAccountDetailId) ?? null;
  const selectedTxForDetail = transactions.find((t) => t.id === selectedTxDetailId) ?? null;

  // Transaction Form State
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [selectedAccId, setSelectedAccId] = useState('');
  const [selectedSubAccId, setSelectedSubAccId] = useState('');
  const [selectedToAccId, setSelectedToAccId] = useState('');
  const [selectedToSubAccId, setSelectedToSubAccId] = useState('');
  const [txDate, setTxDate] = useState(new Date());

  // Account Form State
  const [accFormType, setAccFormType] = useState<'main' | 'sub'>('main');
  const [newAccName, setNewAccName] = useState('');
  const [newAccDesc, setNewAccDesc] = useState('');
  const [newAccType, setNewAccType] = useState<Account['type']>('Bank');
  const [newAccCurrency, setNewAccCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [parentAccId, setParentAccId] = useState('');

  // Helpers State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('pricetag-outline');
  const [categoryModalType, setCategoryModalType] = useState<'expense' | 'income'>('expense');
  const [editAccId, setEditAccId] = useState('');
  const [editSubAccId, setEditSubAccId] = useState('');
  const [editBalanceValue, setEditBalanceValue] = useState('');
  const [renameTarget, setRenameTarget] = useState<{
    type: 'main' | 'sub';
    accId: string;
    subId?: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameDescValue, setRenameDescValue] = useState('');

  // History Filter
  const [historyTypeFilter, setHistoryTypeFilter] = useState<
    'all' | 'income' | 'expense' | 'transfer'
  >('all');
  const [historyCatFilter, setHistoryCatFilter] = useState<string>('all');
  const [historyIncludeInvestment, setHistoryIncludeInvestment] = useState(false);

  const loadData = useCallback(() => {
    loadFinance();
  }, [loadFinance]);

  useDayRollover(loadData);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const showAlert = (
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
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const {
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
  } = useFinanceMetrics({
    transactions,
    accounts,
    debts,
    expenseCategories,
    incomeCategories,
    categoryBudgets,
    selectedMonthFilter,
    activeCurrency,
    homeTxFilter,
    historyTypeFilter,
    historyCatFilter,
    historyIncludeInvestment,
  });

  const openNewTransaction = (txType: 'income' | 'expense' | 'transfer' = 'expense') => {
    setEditingTxId(null);
    setIsPayingBill(false);
    setPayingBillId(null);
    setType(txType);
    setAmount('');
    setToAmount('');
    setDescription('');
    setTxDate(new Date());
    setSelectedCategory(
      txType === 'expense'
        ? expenseCategories[0]
        : txType === 'income'
          ? incomeCategories[0]
          : 'Transfer'
    );
    if (accounts.length > 0) {
      setSelectedAccId(accounts[0].id);
      if (accounts[0].subAccounts.length > 0) {
        setSelectedSubAccId(accounts[0].subAccounts[0].id);
      }
      const targetAcc = accounts.length > 1 ? accounts[1] : accounts[0];
      setSelectedToAccId(targetAcc.id);
      if (targetAcc.subAccounts.length > 0) {
        if (targetAcc.id === accounts[0].id && targetAcc.subAccounts.length > 1) {
          setSelectedToSubAccId(targetAcc.subAccounts[1].id);
        } else {
          setSelectedToSubAccId(targetAcc.subAccounts[0].id);
        }
      }
    }
    setTxModalVisible(true);
  };

  const openTransactionFromExisting = (tx: Transaction, mode: 'edit' | 'clone') => {
    const { validSrcSubId, validDstSubId } = resolveFormSubAccountIds(tx, accounts);
    setEditingTxId(mode === 'edit' ? tx.id : null);
    setIsPayingBill(false);
    setPayingBillId(null);
    setType(tx.type);
    setAmount(tx.amount.toString());
    setToAmount(tx.toAmount !== undefined && tx.toAmount !== null ? tx.toAmount.toString() : '');
    setDescription(tx.description);
    setSelectedCategory(tx.category);
    setSelectedAccId(tx.accountId);
    setSelectedSubAccId(validSrcSubId);
    setSelectedToAccId(tx.toAccountId || '');
    setSelectedToSubAccId(validDstSubId);
    setTxDate(mode === 'edit' ? new Date(tx.date) : new Date());
    setTxModalVisible(true);
  };

  const editTransaction = (tx: Transaction) => openTransactionFromExisting(tx, 'edit');
  const cloneTransaction = (tx: Transaction) => openTransactionFromExisting(tx, 'clone');

  const saveTransaction = async () => {
    const fromAcc = accounts.find((a) => a.id === selectedAccId);
    const toAcc = type === 'transfer' ? accounts.find((a) => a.id === selectedToAccId) : undefined;

    const effectiveSubAccId = selectedSubAccId || fromAcc?.subAccounts?.[0]?.id || 'main';
    const effectiveToSubAccId = selectedToSubAccId || toAcc?.subAccounts?.[0]?.id || 'main';

    if (!amount || !description.trim() || !selectedAccId) {
      showAlert(
        'warning',
        'Incomplete Data',
        'Please fill in the amount, description, and select the account.'
      );
      return;
    }

    if (type === 'transfer') {
      if (!selectedToAccId) {
        showAlert('warning', 'Incomplete Transfer Data', 'Please select the destination account.');
        return;
      }
      if (selectedAccId === selectedToAccId && effectiveSubAccId === effectiveToSubAccId) {
        showAlert(
          'warning',
          'Invalid Transfer',
          'Source and destination accounts/pockets cannot be the same.'
        );
        return;
      }
    }

    const isCrossCurrency =
      type === 'transfer' && Boolean(fromAcc && toAcc && fromAcc.currency !== toAcc.currency);

    const parsedAmount = roundCurrencyAmount(
      evaluateArithmetic(amount, fromAcc?.currency || 'IDR'),
      fromAcc?.currency || 'IDR'
    );
    if (parsedAmount <= 0) {
      showAlert('warning', 'Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    let parsedToAmount: number | undefined;
    let exchangeRate: number | undefined;

    if (isCrossCurrency) {
      parsedToAmount = roundCurrencyAmount(
        evaluateArithmetic(toAmount, toAcc?.currency || 'USD'),
        toAcc?.currency || 'USD'
      );
      if (!parsedToAmount || parsedToAmount <= 0) {
        showAlert(
          'warning',
          'Incomplete Transfer Data',
          'Please fill in the received amount for the destination account.'
        );
        return;
      }
      if (fromAcc?.currency === 'IDR' && toAcc?.currency === 'USD') {
        exchangeRate = parsedAmount / parsedToAmount;
      } else if (fromAcc?.currency === 'USD' && toAcc?.currency === 'IDR') {
        exchangeRate = parsedToAmount / parsedAmount;
      }
    }

    const isSrcSubActive = Boolean(fromAcc?.subAccounts.some((s) => s.id === effectiveSubAccId));
    const isDstSubActive = Boolean(toAcc?.subAccounts.some((s) => s.id === effectiveToSubAccId));

    if (editingTxId) {
      const existing = transactions.find((t) => t.id === editingTxId);
      if (existing) {
        const wasDebtSettlement = Boolean(existing.debtId && existing.debtAction === 'settlement');
        const keepsDebtSemantics = wasDebtSettlement && type === existing.type;

        if (wasDebtSettlement && existing.debtId) {
          const delta = keepsDebtSemantics ? parsedAmount - existing.amount : -existing.amount;
          const updatedDebts = debts.map((d) => {
            if (d.id !== existing.debtId) return d;
            const newPaid = Math.min(
              d.originalAmount,
              Math.max(0, roundCurrencyAmount(d.paidAmount + delta, d.currency))
            );
            const rawRem = roundCurrencyAmount(d.originalAmount - newPaid, d.currency);
            const newRemaining = rawRem <= 0 ? 0 : rawRem;
            return {
              ...d,
              paidAmount: newPaid,
              remainingAmount: newRemaining,
              status: newRemaining === 0 ? ('settled' as const) : ('active' as const),
            };
          });
          await setDebts(updatedDebts);
        }

        await updateTransaction({
          ...existing,
          type,
          amount: parsedAmount,
          description: description.trim(),
          category: type === 'transfer' ? 'Transfer' : selectedCategory,
          date: txDate.toISOString(),
          accountId: selectedAccId,
          subAccountId: effectiveSubAccId,
          deletedSubAccountName: isSrcSubActive ? undefined : existing.deletedSubAccountName,
          toAccountId: type === 'transfer' ? selectedToAccId : undefined,
          toSubAccountId: type === 'transfer' ? effectiveToSubAccId : undefined,
          deletedToSubAccountName:
            type === 'transfer' && !isDstSubActive ? existing.deletedToSubAccountName : undefined,
          toAmount: isCrossCurrency ? parsedToAmount : undefined,
          exchangeRate: isCrossCurrency ? exchangeRate : undefined,
          debtId: wasDebtSettlement && !keepsDebtSemantics ? undefined : existing.debtId,
          debtAction: wasDebtSettlement && !keepsDebtSemantics ? undefined : existing.debtAction,
          billId: type === 'expense' ? existing.billId : undefined,
        });
      }
    } else {
      await addTransaction({
        id: generateId('tx'),
        type,
        amount: parsedAmount,
        description: description.trim(),
        category: type === 'transfer' ? 'Transfer' : selectedCategory,
        date: txDate.toISOString(),
        accountId: selectedAccId,
        subAccountId: effectiveSubAccId,
        toAccountId: type === 'transfer' ? selectedToAccId : undefined,
        toSubAccountId: type === 'transfer' ? effectiveToSubAccId : undefined,
        toAmount: isCrossCurrency ? parsedToAmount : undefined,
        exchangeRate: isCrossCurrency ? exchangeRate : undefined,
        billId: payingBillId || undefined,
      });
    }

    hapticSuccess();
    setAmount('');
    setToAmount('');
    setDescription('');
    setEditingTxId(null);
    setIsPayingBill(false);
    setPayingBillId(null);
    setTxModalVisible(false);
  };

  const handleQuickLogBill = (bill: RecurringBill, targetMonth?: Date) => {
    setEditingTxId(null);
    setIsPayingBill(true);
    setPayingBillId(bill.id);
    setType('expense');
    setAmount(bill.amount.toString());
    setDescription(`Paid ${bill.name}`);
    const defaultCat = expenseCategories.includes(bill.category)
      ? bill.category
      : expenseCategories.includes('Bills & Utilities')
        ? 'Bills & Utilities'
        : expenseCategories[0] || 'Bills & Utilities';
    setSelectedCategory(defaultCat);

    const baseMonth = targetMonth || selectedMonthFilter || new Date();
    const targetYear = baseMonth.getFullYear();
    const targetMonthIdx = baseMonth.getMonth();
    const daysInTargetMonth = new Date(targetYear, targetMonthIdx + 1, 0).getDate();
    const clampedDay = Math.min(Math.max(1, bill.dueDateDay), daysInTargetMonth);
    setTxDate(new Date(targetYear, targetMonthIdx, clampedDay, 12, 0, 0));

    if (accounts.length > 0) {
      const nonInvestmentAccounts = accounts.filter((a) => a.type !== 'Investment');
      const pool = nonInvestmentAccounts.length > 0 ? nonInvestmentAccounts : accounts;
      const matchedAcc = pool.find((a) => a.currency === bill.currency) || pool[0];
      setSelectedAccId(matchedAcc.id);
      if (matchedAcc.subAccounts.length > 0) {
        setSelectedSubAccId(matchedAcc.subAccounts[0].id);
      }
    }
    setTxModalVisible(true);
  };

  const handleUndoBillPayment = async (txId: string) => {
    await deleteTransactionFromStore(txId);
  };

  const handleAddDebt = async (
    newDebtData: Omit<DebtItem, 'id' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status'>,
    cashRecord?: AddDebtCashRecord
  ) => {
    const newId = generateId('debt');
    const roundedOrig = roundCurrencyAmount(newDebtData.originalAmount, newDebtData.currency);
    const newItem: DebtItem = {
      ...newDebtData,
      id: newId,
      originalAmount: roundedOrig,
      paidAmount: 0,
      remainingAmount: roundedOrig,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    await setDebts([newItem, ...debts]);

    if (cashRecord) {
      const isReceivable = newDebtData.type === 'receivable';
      await addTransaction({
        id: generateId('tx'),
        type: isReceivable ? 'expense' : 'income',
        amount: roundedOrig,
        description: isReceivable
          ? `Lent to ${newDebtData.personName}: ${newDebtData.title}`
          : `Borrowed from ${newDebtData.personName}: ${newDebtData.title}`,
        category: 'Debt & Loan',
        date: new Date().toISOString(),
        accountId: cashRecord.accountId,
        subAccountId: cashRecord.subAccountId,
        debtId: newId,
        debtAction: 'initial',
      });
    }
  };

  const handleDeleteDebt = async (id: string) => {
    await setDebts(debts.filter((d) => d.id !== id));
  };

  const handleSettleDebtPayment = async ({
    debtId,
    amountPaid,
    accountId,
    subAccountId,
    notes,
  }: {
    debtId: string;
    amountPaid: number;
    accountId: string;
    subAccountId: string;
    notes?: string;
  }) => {
    const target = debts.find((d) => d.id === debtId);
    if (!target) return;

    const cleanPaidNow = roundCurrencyAmount(amountPaid, target.currency);
    const newPaid = Math.min(
      target.originalAmount,
      roundCurrencyAmount(target.paidAmount + cleanPaidNow, target.currency)
    );
    const rawRemaining = roundCurrencyAmount(target.originalAmount - newPaid, target.currency);
    const newRemaining = rawRemaining <= 0 ? 0 : rawRemaining;
    const newStatus: 'active' | 'settled' = newRemaining === 0 ? 'settled' : 'active';

    const updatedDebts = debts.map((d) =>
      d.id === debtId
        ? { ...d, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus }
        : d
    );
    await setDebts(updatedDebts);

    const isReceivable = target.type === 'receivable';
    const txDescription = isReceivable
      ? `Received from ${target.personName}: ${target.title}${notes ? ` (${notes})` : ''}`
      : `Paid debt to ${target.personName}: ${target.title}${notes ? ` (${notes})` : ''}`;

    await addTransaction({
      id: generateId('tx'),
      type: isReceivable ? 'income' : 'expense',
      amount: cleanPaidNow,
      description: txDescription,
      category: 'Debt & Loan',
      date: new Date().toISOString(),
      accountId,
      subAccountId,
      debtId: target.id,
      debtAction: 'settlement',
    });
  };

  const saveAccount = async () => {
    if (!newAccName.trim()) {
      showAlert(
        'warning',
        'Name Required',
        accFormType === 'main' ? 'Please enter an account name.' : 'Please enter a pocket name.'
      );
      return;
    }
    let updatedAccounts = [...accounts];
    if (accFormType === 'main') {
      updatedAccounts.push({
        id: generateId('acc'),
        name: newAccName.trim(),
        description: newAccDesc.trim() || undefined,
        type: newAccType,
        currency: newAccCurrency,
        subAccounts: [{ id: generateId('sub'), name: 'Main' }],
      });
    } else {
      const targetParentId = parentAccId || accounts[0]?.id;
      if (!targetParentId) {
        showAlert('warning', 'Account Required', 'Please select a parent account.');
        return;
      }
      updatedAccounts = updatedAccounts.map((acc) =>
        acc.id === targetParentId
          ? {
              ...acc,
              subAccounts: [...acc.subAccounts, { id: generateId('sub'), name: newAccName.trim() }],
            }
          : acc
      );
    }
    await setAccounts(updatedAccounts);
    setNewAccName('');
    setNewAccDesc('');
    setAccModalVisible(false);
  };

  const openAddSubAccount = (parentAccountId: string) => {
    setAccFormType('sub');
    setParentAccId(parentAccountId);
    setNewAccName('');
    setNewAccDesc('');
    setAccModalVisible(true);
  };

  const deleteAccount = (accId: string) => {
    if (accounts.length <= 1) {
      showAlert(
        'warning',
        'Cannot Delete Account',
        'At least one account must remain. Create another account before deleting this one.'
      );
      return;
    }
    const targetAcc = accounts.find((acc) => acc.id === accId);
    showAlert(
      'danger',
      'Delete Main Account?',
      'Account transactions will be removed while preserving transfer balances on remaining accounts.',
      'DELETE',
      'CANCEL',
      async () => {
        const reconciledTx = reconcileTransactionsOnAccountDelete(
          transactions,
          accId,
          targetAcc?.name || 'Account'
        );
        await setTransactions(reconciledTx);
        await setAccounts(accounts.filter((acc) => acc.id !== accId));
        setAccDetailModalVisible(false);
        setSelectedAccountDetailId(null);
      }
    );
  };

  const deleteSubAccount = (accId: string, subId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    if (!acc) return;

    if (acc.subAccounts.length <= 1) {
      showAlert('warning', 'Cannot Delete Pocket', 'At least one pocket must remain in this account.');
      return;
    }

    const subToDelete = acc.subAccounts.find((s) => s.id === subId);
    const fallbackSub = acc.subAccounts.find((s) => s.id !== subId);
    if (!subToDelete || !fallbackSub) return;

    const currentBalance = getSubBalance(accId, subId);
    const hasBalance = currentBalance !== 0;

    const message = hasBalance
      ? `Past transactions in "${subToDelete.name}" will remain in history marked as deleted, and its remaining balance will be moved to "${fallbackSub.name}".`
      : `Past transactions in "${subToDelete.name}" will remain in history marked as deleted.`;

    showAlert(
      'danger',
      `Delete "${subToDelete.name}"?`,
      message,
      'DELETE',
      'CANCEL',
      async () => {
        const nowIso = new Date().toISOString();
        const tagged = transactions.map((t) => {
          let next = t;
          if (t.accountId === accId && t.subAccountId === subId && !t.deletedSubAccountName) {
            next = { ...next, deletedSubAccountName: subToDelete.name };
          }
          if (t.toAccountId === accId && t.toSubAccountId === subId && !t.deletedToSubAccountName) {
            next = { ...next, deletedToSubAccountName: subToDelete.name };
          }
          return next;
        });

        let nextTx = tagged;
        if (currentBalance > 0) {
          nextTx = [
            {
              id: generateId('tx_close'),
              type: 'transfer',
              amount: currentBalance,
              description: `Balance moved from deleted pocket (${subToDelete.name})`,
              category: 'Transfer',
              date: nowIso,
              accountId: accId,
              subAccountId: subId,
              deletedSubAccountName: subToDelete.name,
              toAccountId: accId,
              toSubAccountId: fallbackSub.id,
            },
            ...tagged,
          ];
        } else if (currentBalance < 0) {
          nextTx = [
            {
              id: generateId('tx_close'),
              type: 'transfer',
              amount: Math.abs(currentBalance),
              description: `Negative balance moved from deleted pocket (${subToDelete.name})`,
              category: 'Transfer',
              date: nowIso,
              accountId: accId,
              subAccountId: fallbackSub.id,
              toAccountId: accId,
              toSubAccountId: subId,
              deletedToSubAccountName: subToDelete.name,
            },
            ...tagged,
          ];
        }

        await setTransactions(nextTx);

        const updatedAcc = accounts.map((a) =>
          a.id === accId
            ? { ...a, subAccounts: a.subAccounts.filter((s) => s.id !== subId) }
            : a
        );
        await setAccounts(updatedAcc);
      }
    );
  };

  const deleteTransaction = (id: string) => {
    const targetTx = transactions.find((t) => t.id === id);
    const hasLinkedSettlement = Boolean(targetTx?.debtId && targetTx.debtAction === 'settlement');
    showAlert(
      'danger',
      'Delete Transaction?',
      hasLinkedSettlement
        ? 'This record will be permanently deleted and its linked debt/receivable payment will be rolled back.'
        : 'This record will be permanently deleted.',
      'DELETE',
      'CANCEL',
      async () => {
        if (hasLinkedSettlement && targetTx?.debtId) {
          const updatedDebts = debts.map((d) => {
            if (d.id !== targetTx.debtId) return d;
            const newPaid = Math.max(0, roundCurrencyAmount(d.paidAmount - targetTx.amount, d.currency));
            const rawRem = roundCurrencyAmount(d.originalAmount - newPaid, d.currency);
            const newRemaining = rawRem <= 0 ? 0 : rawRem;
            return {
              ...d,
              paidAmount: newPaid,
              remainingAmount: newRemaining,
              status: newRemaining === 0 ? ('settled' as const) : ('active' as const),
            };
          });
          await setDebts(updatedDebts);
        }
        await deleteTransactionFromStore(id);
      }
    );
  };

  const saveRename = async () => {
    if (!renameValue.trim() || !renameTarget) return;
    const updated = accounts.map((acc) => {
      if (acc.id !== renameTarget.accId) return acc;
      if (renameTarget.type === 'main') {
        return {
          ...acc,
          name: renameValue.trim(),
          description: renameDescValue.trim() || undefined,
        };
      }
      return {
        ...acc,
        subAccounts: acc.subAccounts.map((s) =>
          s.id === renameTarget.subId ? { ...s, name: renameValue.trim() } : s
        ),
      };
    });
    await setAccounts(updated);
    setRenameModalVisible(false);
  };

  const closeCategoryModalAndRestore = () => {
    setCatModalVisible(false);
  };

  const saveCategory = async (
    name?: string,
    iconConfig?: { icon: string; color: string; bg: string }
  ) => {
    const catName = (name || newCategoryName).trim();
    if (!catName) {
      showAlert('warning', 'Name Required', 'Please enter a category name.');
      return;
    }

    const reserved = new Set(['adjustment', 'transfer', 'debt & loan']);
    if (reserved.has(catName.toLowerCase())) {
      showAlert(
        'warning',
        'Reserved Category Name',
        `"${catName}" is a reserved system category. Please choose a different name.`
      );
      return;
    }

    const isExpenseCat = categoryModalType === 'expense';
    const targetList = isExpenseCat ? expenseCategories : incomeCategories;
    const existingDuplicate = targetList.find(
      (c) => c.toLowerCase() === catName.toLowerCase()
    );
    const resolvedName = existingDuplicate || catName;

    if (iconConfig) {
      const existingIdx = customCategoryIcons.findIndex(
        (c) => c.category.toLowerCase() === resolvedName.toLowerCase()
      );
      const updatedIcons = [...customCategoryIcons];
      if (existingIdx >= 0) {
        updatedIcons[existingIdx] = { category: resolvedName, ...iconConfig };
      } else {
        updatedIcons.push({ category: resolvedName, ...iconConfig });
      }
      await setCustomCategoryIcons(updatedIcons);
    }

    if (isExpenseCat) {
      if (!existingDuplicate) {
        await setExpenseCategories([...expenseCategories, resolvedName]);
      }
      if (type === 'expense') setSelectedCategory(resolvedName);
    } else {
      if (!existingDuplicate) {
        await setIncomeCategories([...incomeCategories, resolvedName]);
      }
      if (type === 'income') setSelectedCategory(resolvedName);
    }
    setNewCategoryName('');
    closeCategoryModalAndRestore();
  };

  const deleteCategory = (catToDelete: string, explicitType?: 'expense' | 'income') => {
    const targetType = explicitType ?? (type === 'income' ? 'income' : 'expense');
    const isExpense = targetType === 'expense';
    const list = isExpense ? expenseCategories : incomeCategories;
    if (list.length <= 1) {
      showAlert('warning', 'Cannot Delete', 'At least one category must remain.');
      return;
    }

    const fallbackCategory = 'Others';
    if (catToDelete === fallbackCategory) {
      showAlert('warning', 'Cannot Delete', `The default category "${fallbackCategory}" cannot be removed.`);
      return;
    }

    const affectedTxCount = transactions.filter(
      (t) => t.category === catToDelete && t.type === targetType
    ).length;
    const warningDetail =
      affectedTxCount > 0
        ? `Remove category "${catToDelete}"?\n\n${affectedTxCount} transaction${affectedTxCount > 1 ? 's' : ''} using this category will be automatically moved to "${fallbackCategory}".`
        : `Remove category "${catToDelete}"?`;

    showAlert(
      'danger',
      'Delete Category?',
      warningDetail,
      'DELETE',
      'CANCEL',
      async () => {
        const updated = list.filter((c) => c !== catToDelete);
        if (!updated.includes(fallbackCategory)) {
          updated.push(fallbackCategory);
        }

        if (isExpense) {
          await setExpenseCategories(updated);
        } else {
          await setIncomeCategories(updated);
        }

        if (affectedTxCount > 0) {
          const updatedTxList = transactions.map((t) =>
            t.category === catToDelete && t.type === targetType
              ? { ...t, category: fallbackCategory }
              : t
          );
          await setTransactions(updatedTxList);
        }

        if (isExpense && categoryBudgets.some((b) => b.category === catToDelete)) {
          await setCategoryBudgets(categoryBudgets.filter((b) => b.category !== catToDelete));
        }

        if (selectedCategory === catToDelete) {
          setSelectedCategory(fallbackCategory);
        }

        const otherList = isExpense ? incomeCategories : expenseCategories;
        const stillUsed = otherList.includes(catToDelete);
        if (!stillUsed && customCategoryIcons.some((c) => c.category === catToDelete)) {
          await setCustomCategoryIcons(
            customCategoryIcons.filter((c) => c.category !== catToDelete)
          );
        }
      }
    );
  };

  const saveBalanceCorrection = async () => {
    const accCurrency = accounts.find((a) => a.id === editAccId)?.currency || 'IDR';
    const targetBal = roundCurrencyAmount(evaluateArithmetic(editBalanceValue, accCurrency), accCurrency);
    const currentBal = roundCurrencyAmount(getSubBalance(editAccId, editSubAccId), accCurrency);
    const diff = roundCurrencyAmount(targetBal - currentBal, accCurrency);
    if (diff === 0) {
      setBalanceModalVisible(false);
      return;
    }
    await addTransaction({
      id: generateId('tx'),
      type: diff > 0 ? 'income' : 'expense',
      amount: Math.abs(diff),
      description: 'Balance Adjustment',
      category: 'Adjustment',
      date: new Date().toISOString(),
      accountId: editAccId,
      subAccountId: editSubAccId,
    });
    setBalanceModalVisible(false);
  };

  return (
    <ErrorBoundary fallbackTitle="Finance Encountered an Issue">
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgCanvas }]} edges={['top']}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.title} numberOfLines={1}>
              Finance
            </Text>
            <Text style={styles.slogan} numberOfLines={1}>
              Track net worth & cashflow
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <HeaderActionButton
              label="Add"
              color={COLORS.finance}
              onPress={() => openNewTransaction('expense')}
              accessibilityLabel="Add Transaction"
            />
          </View>
        </View>

        <FlatList
          data={financeViewMode === 'overview' ? displayedHomeTransactions : []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 36 }}
          ListHeaderComponent={
            <>
              <HeroSummaryCard
                totalIDR={totalBalanceIDR}
                totalUSD={totalBalanceUSD}
                netWorthInclDebtsIDR={netWorthSummaryIDR.netWorthInclDebts}
                netWorthInclDebtsUSD={netWorthSummaryUSD.netWorthInclDebts}
                hasActiveDebtsIDR={
                  netWorthSummaryIDR.receivablesRemaining > 0 || netWorthSummaryIDR.debtsRemaining > 0
                }
                hasActiveDebtsUSD={
                  netWorthSummaryUSD.receivablesRemaining > 0 || netWorthSummaryUSD.debtsRemaining > 0
                }
                month={selectedMonthFilter}
                onPrevMonth={() =>
                  setSelectedMonthFilter(
                    new Date(
                      selectedMonthFilter.getFullYear(),
                      selectedMonthFilter.getMonth() - 1,
                      1
                    )
                  )
                }
                onNextMonth={() =>
                  setSelectedMonthFilter(
                    new Date(
                      selectedMonthFilter.getFullYear(),
                      selectedMonthFilter.getMonth() + 1,
                      1
                    )
                  )
                }
                onOpenCalendar={() => setFilterCalendarVisible(true)}
                incIDR={monthlyIncomeIDR}
                incUSD={monthlyIncomeUSD}
                expIDR={monthlyExpenseIDR}
                expUSD={monthlyExpenseUSD}
                accountsCount={accounts.length}
                activeCurrency={activeCurrency}
                onCurrencyChange={setActiveCurrency}
              />

              <View style={styles.viewSwitchRow}>
                <TouchableOpacity
                  style={[
                    styles.viewSwitchItem,
                    financeViewMode === 'overview' && styles.viewSwitchItemActive,
                  ]}
                  onPress={() => setFinanceViewMode('overview')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={18}
                    color={financeViewMode === 'overview' ? COLORS.textInverse : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.viewSwitchText,
                      financeViewMode === 'overview' && styles.viewSwitchTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    Accounts
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.viewSwitchItem,
                    financeViewMode === 'insights' && styles.viewSwitchItemActive,
                  ]}
                  onPress={() => setFinanceViewMode('insights')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="analytics-outline"
                    size={18}
                    color={financeViewMode === 'insights' ? COLORS.textInverse : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.viewSwitchText,
                      financeViewMode === 'insights' && styles.viewSwitchTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    Insights &amp; Bills
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ display: financeViewMode === 'overview' ? 'flex' : 'none' }}>
                <View style={styles.sectionHeaderBlock}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle} numberOfLines={1}>
                      MY ACCOUNTS
                    </Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{accounts.length}</Text>
                    </View>
                  </View>
                </View>

                <View style={{ gap: 14, marginBottom: 24 }}>
                  {accounts.map((item) => (
                    <AccountCard
                      key={item.id}
                      item={item}
                      balance={getAccBalance(item.id)}
                      onPress={(acc) => {
                        setSelectedAccountDetailId(acc.id);
                        setAccDetailModalVisible(true);
                      }}
                    />
                  ))}
                  <AddAccountCard
                    onPress={() => {
                      setAccFormType('main');
                      setParentAccId(accounts[0]?.id || '');
                      setNewAccName('');
                      setNewAccDesc('');
                      setAccModalVisible(true);
                    }}
                  />
                  {accounts.length > 0 && (
                    <TouchableOpacity
                      style={styles.manageAccountsBar}
                      onPress={() => setManageAccModalVisible(true)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="swap-vertical" size={15} color={COLORS.finance} />
                      <Text style={styles.manageAccountsBarText}>Manage Accounts & Order</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.sectionHeaderBlock}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle} numberOfLines={1}>
                      TRANSACTIONS • {MONTHS[selectedMonthFilter.getMonth()].toUpperCase()}
                    </Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{displayedHomeTransactions.length}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.historySearchBar}
                  onPress={() => setHistoryModalVisible(true)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="search-outline" size={15} color={COLORS.finance} />
                  <Text style={styles.historySearchBarText}>Search Transaction History</Text>
                </TouchableOpacity>

                <View style={styles.filterTabRow}>
                  <TouchableOpacity
                    style={[styles.filterTabItem, homeTxFilter === 'all' && styles.filterTabItemActive]}
                    onPress={() => setHomeTxFilter('all')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterTabItemText,
                        homeTxFilter === 'all' && styles.filterTabItemTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      All ({homeNonInvestmentTransactions.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterTabItem,
                      homeTxFilter === 'expense' && styles.filterTabItemActive,
                    ]}
                    onPress={() => setHomeTxFilter('expense')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterTabItemText,
                        homeTxFilter === 'expense' && { color: COLORS.danger, fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      Expense
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterTabItem,
                      homeTxFilter === 'income' && styles.filterTabItemActive,
                    ]}
                    onPress={() => setHomeTxFilter('income')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterTabItemText,
                        homeTxFilter === 'income' && { color: COLORS.success, fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      Income
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterTabItem,
                      homeTxFilter === 'transfer' && styles.filterTabItemActive,
                    ]}
                    onPress={() => setHomeTxFilter('transfer')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterTabItemText,
                        homeTxFilter === 'transfer' && { color: COLORS.finance, fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      Transfer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <TransactionCard
              item={item}
              accounts={accounts}
              customCategoryIcons={customCategoryIcons}
              onClone={cloneTransaction}
              onDelete={deleteTransaction}
              onEdit={editTransaction}
              onPress={(tx) => setSelectedTxDetailId(tx.id)}
            />
          )}
          ListEmptyComponent={
            financeViewMode === 'overview' ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBox}>
                  <Ionicons name="receipt-outline" size={26} color={COLORS.finance} />
                </View>
                <Text style={styles.emptyText}>No Transactions Recorded</Text>
                <Text style={styles.emptySubText}>
                  {homeTxFilter === 'all'
                    ? `No transactions recorded for ${MONTHS[selectedMonthFilter.getMonth()]}. Tap below to record.`
                    : `No ${homeTxFilter} transactions for this period.`}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.emptyActionBtn,
                    { backgroundColor: COLORS.finance, borderColor: COLORS.finance, marginTop: 16 },
                  ]}
                  onPress={() => openNewTransaction('expense')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color={COLORS.textInverse} />
                  <Text style={[styles.emptyActionBtnText, { color: COLORS.textInverse }]}>
                    Add Transaction
                  </Text>
                </TouchableOpacity>
              </View>
            ) : undefined
          }
          ListFooterComponent={
            <>
              {financeViewMode === 'overview' && displayedHomeTransactions.length > 0 && (
                <View style={{ height: 14 }} />
              )}
              <View style={{ display: financeViewMode === 'insights' ? 'flex' : 'none' }}>
                <CashflowTrendCard
                  allTransactions={allTransactionsForActiveCurrency}
                  monthlyTransactions={monthlyTransactionsForActiveCurrency}
                  currency={activeCurrency}
                  selectedMonth={selectedMonthFilter}
                  onSelectMonth={setSelectedMonthFilter}
                  onPrevMonth={() =>
                    setSelectedMonthFilter(
                      new Date(
                        selectedMonthFilter.getFullYear(),
                        selectedMonthFilter.getMonth() - 1,
                        1
                      )
                    )
                  }
                  onNextMonth={() =>
                    setSelectedMonthFilter(
                      new Date(
                        selectedMonthFilter.getFullYear(),
                        selectedMonthFilter.getMonth() + 1,
                        1
                      )
                    )
                  }
                />

                <CategoryBreakdownCard
                  transactions={monthlyTransactionsForActiveCurrency}
                  accounts={accounts}
                  budgets={activeCategoryBudgets}
                  currency={activeCurrency}
                  customCategoryIcons={customCategoryIcons}
                  onOpenSetBudget={() => setBudgetModalVisible(true)}
                  onOpenManageCategories={() => setManageCatModalVisible(true)}
                />

                <RecurringBillsCard
                  bills={recurringBills}
                  monthlyTransactions={monthlyTransactionsForActiveCurrency}
                  categories={expenseCategories}
                  currency={activeCurrency}
                  selectedMonth={selectedMonthFilter}
                  onAddBill={(bill) => {
                    const newBill = { ...bill, id: generateId('bill') };
                    setRecurringBills([...recurringBills, newBill]);
                  }}
                  onDeleteBill={(id) => {
                    setRecurringBills(recurringBills.filter((b) => b.id !== id));
                  }}
                  onUpdateBill={(bill) => {
                    setRecurringBills(recurringBills.map((b) => (b.id === bill.id ? bill : b)));
                  }}
                  onQuickLogBill={handleQuickLogBill}
                  onUndoBillPayment={handleUndoBillPayment}
                />

                <DebtsCard
                  debts={debts}
                  accounts={accounts}
                  currency={activeCurrency}
                  onAddDebt={handleAddDebt}
                  onDeleteDebt={handleDeleteDebt}
                  onSettlePayment={handleSettleDebtPayment}
                />
              </View>
            </>
          }
        />

        <SharedCalendarModal
          visible={filterCalendarVisible}
          selectedDate={selectedMonthFilter}
          mode="month"
          themeColor={COLORS.finance}
          title="Select Period"
          onClose={() => setFilterCalendarVisible(false)}
          onSelectDate={(d) => {
            setSelectedMonthFilter(d);
            setFilterCalendarVisible(false);
          }}
        />

        <TransactionModal
          visible={txModalVisible}
          type={type}
          amount={amount}
          description={description}
          txDate={txDate}
          selectedCategory={selectedCategory}
          selectedAccId={selectedAccId}
          selectedSubAccId={selectedSubAccId}
          selectedToAccId={selectedToAccId}
          selectedToSubAccId={selectedToSubAccId}
          accounts={accounts}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          customCategoryIcons={customCategoryIcons}
          transactions={transactions}
          isEditing={Boolean(editingTxId)}
          hideTypeSwitcher={isPayingBill}
          onClose={() => {
            setEditingTxId(null);
            setIsPayingBill(false);
            setPayingBillId(null);
            setTxModalVisible(false);
          }}
          onSave={saveTransaction}
          setType={setType}
          setAmount={setAmount}
          toAmount={toAmount}
          setToAmount={setToAmount}
          setDescription={setDescription}
          setSelectedCategory={setSelectedCategory}
          setSelectedAccId={setSelectedAccId}
          setSelectedSubAccId={setSelectedSubAccId}
          setSelectedToAccId={setSelectedToAccId}
          setSelectedToSubAccId={setSelectedToSubAccId}
          onOpenDatePicker={() => setDatePickerVisible(true)}
          onOpenAddCategory={() => {
            setCategoryModalType(type === 'income' ? 'income' : 'expense');
            setCatModalVisible(true);
          }}
          onDeleteCategory={(cat) => deleteCategory(cat, type === 'income' ? 'income' : 'expense')}
        />

        <SharedCalendarModal
          visible={datePickerVisible}
          selectedDate={txDate}
          mode="day"
          themeColor={COLORS.finance}
          title="Select Transaction Date"
          onClose={() => setDatePickerVisible(false)}
          onSelectDate={(d) => {
            const now = new Date();
            const targetHours = txDate ? txDate.getHours() : now.getHours();
            const targetMinutes = txDate ? txDate.getMinutes() : now.getMinutes();
            const targetSeconds = txDate ? txDate.getSeconds() : now.getSeconds();
            const withTime = new Date(
              d.getFullYear(),
              d.getMonth(),
              d.getDate(),
              targetHours === 0 && targetMinutes === 0 ? now.getHours() : targetHours,
              targetHours === 0 && targetMinutes === 0 ? now.getMinutes() : targetMinutes,
              targetSeconds === 0 ? now.getSeconds() : targetSeconds
            );
            setTxDate(withTime);
            setDatePickerVisible(false);
          }}
        />

        <AccountDetailModal
          visible={accDetailModalVisible}
          account={selectedAccountForDetail}
          totalBalance={
            selectedAccountForDetail ? getAccBalance(selectedAccountForDetail.id) : 0
          }
          getSubBalance={getSubBalance}
          transactions={transactions}
          accounts={accounts}
          onEditTransaction={editTransaction}
          onDeleteTransaction={deleteTransaction}
          onCloneTransaction={cloneTransaction}
          onClose={() => {
            setAccDetailModalVisible(false);
            setSelectedAccountDetailId(null);
          }}
          onRenameAccount={(acc) => {
            setRenameTarget({ type: 'main', accId: acc.id });
            setRenameValue(acc.name);
            setRenameDescValue(acc.description || '');
            setRenameModalVisible(true);
          }}
          onDeleteAccount={deleteAccount}
          onEditBalance={(accId, subId) => {
            setEditAccId(accId);
            setEditSubAccId(subId);
            setEditBalanceValue(getSubBalance(accId, subId).toString());
            setBalanceModalVisible(true);
          }}
          onRenameSubAccount={(accId, subId, name) => {
            setRenameTarget({ type: 'sub', accId, subId });
            setRenameValue(name);
            setRenameDescValue('');
            setRenameModalVisible(true);
          }}
          onDeleteSubAccount={deleteSubAccount}
          onAddSubAccount={() => {
            if (selectedAccountForDetail) {
              openAddSubAccount(selectedAccountForDetail.id);
            }
          }}
        />

        <TransactionDetailModal
          visible={Boolean(selectedTxForDetail)}
          transaction={selectedTxForDetail}
          accounts={accounts}
          customCategoryIcons={customCategoryIcons}
          onClose={() => setSelectedTxDetailId(null)}
          onEdit={(tx) => {
            editTransaction(tx);
          }}
          onClone={(tx) => {
            cloneTransaction(tx);
          }}
          onDelete={(id) => {
            deleteTransaction(id);
          }}
        />

        <HistoryModal
          visible={historyModalVisible}
          historyTransactions={historyTransactions}
          accounts={accounts}
          customCategoryIcons={customCategoryIcons}
          historyTypeFilter={historyTypeFilter}
          historyCatFilter={historyCatFilter}
          historyAvailableCategories={historyAvailableCategories}
          includeInvestment={historyIncludeInvestment}
          onToggleIncludeInvestment={() => setHistoryIncludeInvestment((v) => !v)}
          onClose={() => setHistoryModalVisible(false)}
          setTypeFilter={setHistoryTypeFilter}
          setCatFilter={setHistoryCatFilter}
          onClone={cloneTransaction}
          onDelete={deleteTransaction}
          onEdit={editTransaction}
        />

        <AddAccountModal
          visible={accModalVisible}
          accFormType={accFormType}
          newAccName={newAccName}
          newAccDesc={newAccDesc}
          newAccType={newAccType}
          newAccCurrency={newAccCurrency}
          parentAccId={parentAccId}
          accounts={accounts}
          onClose={() => setAccModalVisible(false)}
          onSave={saveAccount}
          setAccFormType={setAccFormType}
          setNewAccName={setNewAccName}
          setNewAccDesc={setNewAccDesc}
          setNewAccType={setNewAccType}
          setNewAccCurrency={setNewAccCurrency}
          setParentAccId={setParentAccId}
        />

        <EditBalanceModal
          visible={balanceModalVisible}
          value={editBalanceValue}
          currency={accounts.find((a) => a.id === editAccId)?.currency || 'IDR'}
          accountType={accounts.find((a) => a.id === editAccId)?.type}
          onClose={() => setBalanceModalVisible(false)}
          onSave={saveBalanceCorrection}
          onChangeValue={setEditBalanceValue}
        />

        <RenameModal
          visible={renameModalVisible}
          value={renameValue}
          descValue={renameDescValue}
          targetType={renameTarget?.type}
          onClose={() => setRenameModalVisible(false)}
          onSave={saveRename}
          onChangeValue={setRenameValue}
          onChangeDescValue={setRenameDescValue}
        />

        <CategoryBudgetModal
          visible={budgetModalVisible}
          categories={expenseCategories}
          budgets={categoryBudgets}
          currency={activeCurrency}
          customCategoryIcons={customCategoryIcons}
          onClose={() => setBudgetModalVisible(false)}
          onSaveBudget={(cat, limit) => {
            const existingIndex = categoryBudgets.findIndex(
              (b) => b.category === cat && (b.currency || 'IDR') === activeCurrency
            );
            const updated: CategoryBudget[] =
              existingIndex >= 0
                ? categoryBudgets.map((b, idx) =>
                    idx === existingIndex ? { ...b, limit, currency: activeCurrency } : b
                  )
                : [...categoryBudgets, { category: cat, limit, currency: activeCurrency }];
            setCategoryBudgets(updated);
          }}
          onOpenAddCategory={() => {
            setCategoryModalType('expense');
            setCatModalVisible(true);
          }}
          onDeleteCategory={(cat) => deleteCategory(cat, 'expense')}
        />

        <ManageCategoriesModal
          visible={manageCatModalVisible}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          customCategoryIcons={customCategoryIcons}
          onClose={() => setManageCatModalVisible(false)}
          onOpenAddCategory={(catType) => {
            setCategoryModalType(catType);
            setCatModalVisible(true);
          }}
          onDeleteCategory={(cat, catType) => {
            deleteCategory(cat, catType);
          }}
        />

        <AddCategoryModal
          visible={catModalVisible}
          value={newCategoryName}
          selectedIcon={newCategoryIcon}
          onClose={closeCategoryModalAndRestore}
          onSave={saveCategory}
          onChangeValue={setNewCategoryName}
          onChangeIcon={setNewCategoryIcon}
        />

        <ManageAccountsModal
          visible={manageAccModalVisible}
          accounts={accounts}
          getAccBalance={getAccBalance}
          onClose={() => setManageAccModalVisible(false)}
          onReorderAccounts={async (newAccounts) => {
            await setAccounts(newAccounts);
          }}
        />

        <AppAlertModal config={alertConfig} onClose={closeAlert} />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
