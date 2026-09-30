import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StatusBar, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { Account, Transaction, CategoryBudget, CategoryCustomIcon, RecurringBill, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, MONTHS } from '../types/finance';
import { TransactionCard, AccountCard, AddAccountCard, HeroSummaryCard } from '../components/Finance/FinanceCards';
import { TransactionModal } from '../components/Finance/TransactionModal';
import { AccountDetailModal } from '../components/Finance/AccountDetailModal';
import { HistoryModal } from '../components/Finance/HistoryModal';
import { AddAccountModal } from '../components/Finance/AddAccountModal';
import { CalendarModal } from '../components/Finance/CalendarModal';
import { DatePickerModal } from '../components/Finance/DatePickerModal';
import { EditBalanceModal, RenameModal, AddCategoryModal } from '../components/Finance/DialogModals';
import { CategoryBreakdownCard } from '../components/Finance/CategoryBreakdownCard';
import { CategoryBreakdownModal } from '../components/Finance/CategoryBreakdownModal';
import { CategoryBudgetModal } from '../components/Finance/CategoryBudgetModal';
import { RecurringBillsCard } from '../components/Finance/RecurringBillsCard';
import AppAlertModal, { AppAlertConfig } from '../components/Common/AppAlertModal';
import { TAB_BAR_HEIGHT } from '../constants/tabBar';
import { financeStyles as styles } from '../styles/financeStyles';
import { COLORS } from '../constants/theme';

import { useFocusEffect } from 'expo-router';

export default function FinanceTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);

  // In-Screen Quick Filter
  const [homeTxFilter, setHomeTxFilter] = useState<'all' | 'expense' | 'income'>('all');
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
  const [categoryBreakdownModalVisible, setCategoryBreakdownModalVisible] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [isPayingBill, setIsPayingBill] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const [selectedMonthFilter, setSelectedMonthFilter] = useState(new Date());
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<Account | null>(null);

  // Transaction Form State
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [selectedAccId, setSelectedAccId] = useState('');
  const [selectedSubAccId, setSelectedSubAccId] = useState('');
  const [selectedToAccId, setSelectedToAccId] = useState('');
  const [selectedToSubAccId, setSelectedToSubAccId] = useState('');
  const [txDate, setTxDate] = useState(new Date());
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);

  // Account Form State
  const [accFormType, setAccFormType] = useState<'main' | 'sub'>('main');
  const [newAccName, setNewAccName] = useState('');
  const [newAccDesc, setNewAccDesc] = useState('');
  const [newAccType, setNewAccType] = useState<Account['type']>('Bank');
  const [newAccCurrency, setNewAccCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [parentAccId, setParentAccId] = useState('');

  const [customCategoryIcons, setCustomCategoryIcons] = useState<CategoryCustomIcon[]>([]);

  // Helpers State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('pricetag-outline');
  const [editAccId, setEditAccId] = useState('');
  const [editSubAccId, setEditSubAccId] = useState('');
  const [editBalanceValue, setEditBalanceValue] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ type: 'main' | 'sub'; accId: string; subId?: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameDescValue, setRenameDescValue] = useState('');

  // History Filter
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [historyCatFilter, setHistoryCatFilter] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      const keys = [
        '@finance_tx',
        '@finance_acc',
        '@finance_exp_cat',
        '@finance_inc_cat',
        '@finance_category_budgets',
        '@finance_recurring',
        '@finance_custom_cat_icons',
      ];
      const results = await AsyncStorage.multiGet(keys);
      const dataMap = Object.fromEntries(results);

      const storedTx = dataMap['@finance_tx'];
      const storedAcc = dataMap['@finance_acc'];
      const storedExpCat = dataMap['@finance_exp_cat'];
      const storedIncCat = dataMap['@finance_inc_cat'];
      const storedBudgets = dataMap['@finance_category_budgets'];
      const storedBills = dataMap['@finance_recurring'];
      const storedIcons = dataMap['@finance_custom_cat_icons'];

      if (storedTx) setTransactions(JSON.parse(storedTx));
      if (storedExpCat) setExpenseCategories(JSON.parse(storedExpCat));
      if (storedIncCat) setIncomeCategories(JSON.parse(storedIncCat));
      if (storedBudgets) setCategoryBudgets(JSON.parse(storedBudgets));
      if (storedBills) setRecurringBills(JSON.parse(storedBills));
      if (storedIcons) setCustomCategoryIcons(JSON.parse(storedIcons));

      if (storedAcc) {
        setAccounts(JSON.parse(storedAcc).map((a: any) => ({ ...a, currency: a.currency || 'IDR' })));
      } else {
        const defaultAcc: Account[] = [
          { id: 'acc_1', name: 'Cash', type: 'Cash', currency: 'IDR', subAccounts: [{ id: 'sub_1', name: 'Main' }] },
        ];
        setAccounts(defaultAcc);
        await AsyncStorage.setItem('@finance_acc', JSON.stringify(defaultAcc));
      }
    } catch (e) {
      console.error('Failed to load finance data', e);
    }
  }, []);

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

  const getSubBalance = (accId: string, subId: string) => {
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
  };

  const getAccBalance = (accId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    if (!acc) return 0;
    return acc.subAccounts.reduce((sum, sub) => sum + getSubBalance(accId, sub.id), 0);
  };

  const totalBalanceIDR = accounts.filter((a) => a.currency === 'IDR').reduce((sum, acc) => sum + getAccBalance(acc.id), 0);
  const totalBalanceUSD = accounts.filter((a) => a.currency === 'USD').reduce((sum, acc) => sum + getAccBalance(acc.id), 0);

  const filteredMonthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === selectedMonthFilter.getMonth() && d.getFullYear() === selectedMonthFilter.getFullYear();
  });

  const monthlyIncomeIDR = filteredMonthlyTransactions
    .filter((t) => t.type === 'income' && accounts.find((a) => a.id === t.accountId)?.currency !== 'USD')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenseIDR = filteredMonthlyTransactions
    .filter((t) => t.type === 'expense' && accounts.find((a) => a.id === t.accountId)?.currency !== 'USD')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyIncomeUSD = filteredMonthlyTransactions
    .filter((t) => t.type === 'income' && accounts.find((a) => a.id === t.accountId)?.currency === 'USD')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenseUSD = filteredMonthlyTransactions
    .filter((t) => t.type === 'expense' && accounts.find((a) => a.id === t.accountId)?.currency === 'USD')
    .reduce((sum, t) => sum + t.amount, 0);

  const sortedTransactions = [...filteredMonthlyTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const displayedHomeTransactions = sortedTransactions.filter((t) => {
    if (homeTxFilter === 'all') return true;
    return t.type === homeTxFilter;
  });

  const historyTransactions = transactions
    .filter((t) => {
      if (historyTypeFilter !== 'all' && t.type !== historyTypeFilter) return false;
      if (historyCatFilter !== 'all' && t.category !== historyCatFilter) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const historyAvailableCategories =
    historyTypeFilter === 'expense'
      ? expenseCategories
      : historyTypeFilter === 'income'
      ? incomeCategories
      : Array.from(new Set([...expenseCategories, ...incomeCategories]));

  const openNewTransaction = (txType: 'income' | 'expense' | 'transfer' = 'expense') => {
    setEditingTxId(null);
    setIsPayingBill(false);
    setType(txType);
    setAmount('');
    setDescription('');
    setTxDate(new Date());
    setSelectedCategory(txType === 'expense' ? expenseCategories[0] : txType === 'income' ? incomeCategories[0] : 'Transfer');
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

  const editTransaction = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setIsPayingBill(false);
    setType(tx.type);
    setAmount(tx.amount.toString());
    setDescription(tx.description);
    setSelectedCategory(tx.category);
    setSelectedAccId(tx.accountId);
    setSelectedSubAccId(tx.subAccountId);
    setSelectedToAccId(tx.toAccountId || '');
    setSelectedToSubAccId(tx.toSubAccountId || '');
    const dateObj = new Date(tx.date);
    setTxDate(dateObj);
    setTxModalVisible(true);
    setHistoryModalVisible(false);
  };

  const cloneTransaction = (tx: Transaction) => {
    setEditingTxId(null);
    setIsPayingBill(false);
    setType(tx.type);
    setAmount(tx.amount.toString());
    setDescription(tx.description);
    setSelectedCategory(tx.category);
    setSelectedAccId(tx.accountId);
    setSelectedSubAccId(tx.subAccountId);
    setSelectedToAccId(tx.toAccountId || '');
    setSelectedToSubAccId(tx.toSubAccountId || '');
    const dateObj = new Date(tx.date);
    setTxDate(dateObj);
    setTxModalVisible(true);
    setHistoryModalVisible(false);
  };

  const saveTransaction = async () => {
    if (!amount || !description.trim() || !selectedAccId || !selectedSubAccId) {
      showAlert('warning', 'Incomplete Data', 'Please fill in the amount, description, and select the funding source.');
      return;
    }

    if (type === 'transfer') {
      if (!selectedToAccId || !selectedToSubAccId) {
        showAlert('warning', 'Incomplete Transfer Data', 'Please select the destination account and sub-account.');
        return;
      }
      if (selectedAccId === selectedToAccId && selectedSubAccId === selectedToSubAccId) {
        showAlert('warning', 'Invalid Transfer', 'Source and destination sub-accounts cannot be the same.');
        return;
      }
    }

    const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;

    let updatedTx: Transaction[];
    if (editingTxId) {
      updatedTx = transactions.map((t) =>
        t.id === editingTxId
          ? {
              ...t,
              type,
              amount: parsedAmount,
              description: description.trim(),
              category: type === 'transfer' ? 'Transfer' : selectedCategory,
              date: txDate.toISOString(),
              accountId: selectedAccId,
              subAccountId: selectedSubAccId,
              toAccountId: type === 'transfer' ? selectedToAccId : undefined,
              toSubAccountId: type === 'transfer' ? selectedToSubAccId : undefined,
            }
          : t
      );
    } else {
      const newTx: Transaction = {
        id: Date.now().toString(),
        type,
        amount: parsedAmount,
        description: description.trim(),
        category: type === 'transfer' ? 'Transfer' : selectedCategory,
        date: txDate.toISOString(),
        accountId: selectedAccId,
        subAccountId: selectedSubAccId,
        toAccountId: type === 'transfer' ? selectedToAccId : undefined,
        toSubAccountId: type === 'transfer' ? selectedToSubAccId : undefined,
      };
      updatedTx = [newTx, ...transactions];
    }

    setTransactions(updatedTx);
    await AsyncStorage.setItem('@finance_tx', JSON.stringify(updatedTx));
    setAmount('');
    setDescription('');
    setEditingTxId(null);
    setIsPayingBill(false);
    setTxModalVisible(false);
  };

  const saveCategoryBudgets = async (budgets: CategoryBudget[]) => {
    setCategoryBudgets(budgets);
    await AsyncStorage.setItem('@finance_category_budgets', JSON.stringify(budgets));
  };

  const saveRecurringBills = async (bills: RecurringBill[]) => {
    setRecurringBills(bills);
    await AsyncStorage.setItem('@finance_recurring', JSON.stringify(bills));
  };

  const handleQuickLogBill = (bill: RecurringBill) => {
    setEditingTxId(null);
    setIsPayingBill(true);
    setType('expense');
    setAmount(bill.amount.toString());
    setDescription(`Paid ${bill.name}`);
    // Sync with transaction category: default to 'Bills & Utilities' if available, otherwise match or first category
    const defaultCat = expenseCategories.includes('Bills & Utilities')
      ? 'Bills & Utilities'
      : expenseCategories.includes(bill.category)
      ? bill.category
      : expenseCategories[0] || 'Bills & Utilities';
    setSelectedCategory(defaultCat);
    setTxDate(new Date());
    if (accounts.length > 0) {
      const matchedAcc = accounts.find((a) => a.currency === bill.currency) || accounts[0];
      setSelectedAccId(matchedAcc.id);
      if (matchedAcc.subAccounts.length > 0) {
        setSelectedSubAccId(matchedAcc.subAccounts[0].id);
      }
    }
    setTxModalVisible(true);
  };

  const saveAccount = async () => {
    if (!newAccName.trim()) return;
    let updatedAccounts = [...accounts];
    if (accFormType === 'main') {
      updatedAccounts.push({
        id: Date.now().toString(),
        name: newAccName.trim(),
        description: newAccDesc.trim() || undefined,
        type: newAccType,
        currency: newAccCurrency,
        subAccounts: [{ id: Date.now().toString() + '_sub', name: 'Main' }],
      });
    } else {
      if (!parentAccId) return;
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.id === parentAccId) {
          return {
            ...acc,
            subAccounts: [...acc.subAccounts, { id: Date.now().toString(), name: newAccName.trim() }],
          };
        }
        return acc;
      });
    }
    setAccounts(updatedAccounts);
    await AsyncStorage.setItem('@finance_acc', JSON.stringify(updatedAccounts));
    setNewAccName('');
    setNewAccDesc('');
    setAccModalVisible(false);
  };

  const deleteAccount = (accId: string) => {
    showAlert(
      'danger',
      'Delete Main Account?',
      'All sub-accounts and associated transactions will be deleted permanently.',
      'DELETE',
      'CANCEL',
      async () => {
        const updatedTx = transactions.filter((t) => t.accountId !== accId);
        setTransactions(updatedTx);
        await AsyncStorage.setItem('@finance_tx', JSON.stringify(updatedTx));
        const updatedAcc = accounts.filter((acc) => acc.id !== accId);
        setAccounts(updatedAcc);
        await AsyncStorage.setItem('@finance_acc', JSON.stringify(updatedAcc));
        setAccDetailModalVisible(false);
      }
    );
  };

  const deleteSubAccount = (accId: string, subId: string) => {
    showAlert(
      'danger',
      'Delete Sub-Account?',
      'Transactions recorded under this sub-account will also be deleted.',
      'DELETE',
      'CANCEL',
      async () => {
        const updatedTx = transactions.filter((t) => !(t.accountId === accId && t.subAccountId === subId));
        setTransactions(updatedTx);
        await AsyncStorage.setItem('@finance_tx', JSON.stringify(updatedTx));
        const updatedAcc = accounts.map((acc) =>
          acc.id === accId
            ? { ...acc, subAccounts: acc.subAccounts.filter((s) => s.id !== subId) }
            : acc
        );
        setAccounts(updatedAcc);
        await AsyncStorage.setItem('@finance_acc', JSON.stringify(updatedAcc));
        if (selectedAccountForDetail?.id === accId) {
          const updatedSelected = updatedAcc.find((a) => a.id === accId);
          if (updatedSelected) setSelectedAccountForDetail(updatedSelected);
        }
      }
    );
  };

  const deleteTransaction = (id: string) => {
    showAlert(
      'danger',
      'Delete Transaction?',
      'This record will be permanently deleted.',
      'DELETE',
      'CANCEL',
      async () => {
        const updated = transactions.filter((t) => t.id !== id);
        setTransactions(updated);
        await AsyncStorage.setItem('@finance_tx', JSON.stringify(updated));
      }
    );
  };

  const saveRename = async () => {
    if (!renameValue.trim() || !renameTarget) return;
    const updated = accounts.map((acc) => {
      if (acc.id === renameTarget.accId) {
        if (renameTarget.type === 'main') {
          return {
            ...acc,
            name: renameValue.trim(),
            description: renameDescValue.trim() || undefined,
          };
        }
        return {
          ...acc,
          subAccounts: acc.subAccounts.map((s) => (s.id === renameTarget.subId ? { ...s, name: renameValue.trim() } : s)),
        };
      }
      return acc;
    });
    setAccounts(updated);
    await AsyncStorage.setItem('@finance_acc', JSON.stringify(updated));
    if (selectedAccountForDetail?.id === renameTarget.accId) {
      const updatedAcc = updated.find((a) => a.id === renameTarget.accId);
      if (updatedAcc) setSelectedAccountForDetail(updatedAcc);
    }
    setRenameModalVisible(false);
  };

  const saveCategory = async (name?: string, iconConfig?: { icon: string; color: string; bg: string }) => {
    const catName = (name || newCategoryName).trim();
    if (!catName) return;

    if (iconConfig) {
      const existingIdx = customCategoryIcons.findIndex((c) => c.category.toLowerCase() === catName.toLowerCase());
      let updatedIcons: CategoryCustomIcon[];
      if (existingIdx >= 0) {
        updatedIcons = [...customCategoryIcons];
        updatedIcons[existingIdx] = { category: catName, ...iconConfig };
      } else {
        updatedIcons = [...customCategoryIcons, { category: catName, ...iconConfig }];
      }
      setCustomCategoryIcons(updatedIcons);
      await AsyncStorage.setItem('@finance_custom_cat_icons', JSON.stringify(updatedIcons));
    }

    if (type === 'expense') {
      if (!expenseCategories.includes(catName)) {
        const updated = [...expenseCategories, catName];
        setExpenseCategories(updated);
        await AsyncStorage.setItem('@finance_exp_cat', JSON.stringify(updated));
      }
      setSelectedCategory(catName);
    } else {
      if (!incomeCategories.includes(catName)) {
        const updated = [...incomeCategories, catName];
        setIncomeCategories(updated);
        await AsyncStorage.setItem('@finance_inc_cat', JSON.stringify(updated));
      }
      setSelectedCategory(catName);
    }
    setNewCategoryName('');
    setCatModalVisible(false);
  };

  const saveBalanceCorrection = async () => {
    const targetBal = parseFloat(editBalanceValue.replace(/[^0-9.-]/g, '')) || 0;
    const currentBal = getSubBalance(editAccId, editSubAccId);
    const diff = targetBal - currentBal;
    if (diff === 0) {
      setBalanceModalVisible(false);
      return;
    }
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: diff > 0 ? 'income' : 'expense',
      amount: Math.abs(diff),
      description: 'Balance Adjustment',
      category: 'Adjustment',
      date: new Date().toISOString(),
      accountId: editAccId,
      subAccountId: editSubAccId,
    };
    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    await AsyncStorage.setItem('@finance_tx', JSON.stringify(updatedTx));
    setBalanceModalVisible(false);
    if (accDetailModalVisible && selectedAccountForDetail) {
      const updatedAcc = accounts.find((a) => a.id === selectedAccountForDetail.id);
      if (updatedAcc) setSelectedAccountForDetail(updatedAcc);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgCanvas }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgCanvas} translucent={true} />

      {/* HEADER WITH CLEAN ACTIONS */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.title} numberOfLines={1}>Finance</Text>
          <Text style={styles.slogan} numberOfLines={1}>Track net worth & cashflow</Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerHistoryBtn}
            onPress={() => setCategoryBreakdownModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="pie-chart-outline" size={15} color={COLORS.finance} />
            <Text style={[styles.headerHistoryBtnText, { color: COLORS.textPrimary }]}>Breakdown</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => openNewTransaction('expense')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#08090C" />
            <Text style={styles.headerAddBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 36 }}
      >
        {/* EXECUTIVE NET WORTH & MONTHLY CASHFLOW CARDS */}
        <HeroSummaryCard
          totalIDR={totalBalanceIDR}
          totalUSD={totalBalanceUSD}
          month={selectedMonthFilter}
          onPrevMonth={() =>
            setSelectedMonthFilter(new Date(selectedMonthFilter.getFullYear(), selectedMonthFilter.getMonth() - 1, 1))
          }
          onNextMonth={() =>
            setSelectedMonthFilter(new Date(selectedMonthFilter.getFullYear(), selectedMonthFilter.getMonth() + 1, 1))
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

        {/* ACCOUNTS SECTION */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>MY ACCOUNTS</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{accounts.length}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <AccountCard
                item={item}
                balance={getAccBalance(item.id)}
                onPress={(acc) => {
                  setSelectedAccountForDetail(acc);
                  setAccDetailModalVisible(true);
                }}
              />
            )}
            ListFooterComponent={<AddAccountCard onPress={() => setAccModalVisible(true)} />}
            contentContainerStyle={{ paddingRight: 20 }}
            snapToInterval={232}
            decelerationRate="fast"
          />
        </View>

        {/* RECURRING BILLS CARD */}
        <RecurringBillsCard
          bills={recurringBills}
          monthlyTransactions={filteredMonthlyTransactions}
          currency={activeCurrency}
          onAddBill={(bill) => {
            const newBill = { ...bill, id: Date.now().toString() };
            saveRecurringBills([...recurringBills, newBill]);
          }}
          onDeleteBill={(id) => {
            saveRecurringBills(recurringBills.filter((b) => b.id !== id));
          }}
          onQuickLogBill={handleQuickLogBill}
        />

        {/* CATEGORY EXPENSE BREAKDOWN & BUDGETS */}
        <CategoryBreakdownCard
          transactions={filteredMonthlyTransactions}
          budgets={categoryBudgets}
          currency={activeCurrency}
          customCategoryIcons={customCategoryIcons}
          onOpenSetBudget={() => setBudgetModalVisible(true)}
        />

        {/* TRANSACTIONS SECTION */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              TRANSACTIONS • {MONTHS[selectedMonthFilter.getMonth()].toUpperCase()}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{displayedHomeTransactions.length}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerHistoryBtn}
            onPress={() => setHistoryModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.headerHistoryBtnText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* QUICK FILTER SEGMENTED TABS */}
        <View style={styles.filterTabRow}>
          <TouchableOpacity
            style={[styles.filterTabItem, homeTxFilter === 'all' && styles.filterTabItemActive]}
            onPress={() => setHomeTxFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabItemText, homeTxFilter === 'all' && styles.filterTabItemTextActive]}>
              All ({sortedTransactions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTabItem, homeTxFilter === 'expense' && styles.filterTabItemActive]}
            onPress={() => setHomeTxFilter('expense')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabItemText,
                homeTxFilter === 'expense' && { color: COLORS.danger, fontWeight: '700' },
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTabItem, homeTxFilter === 'income' && styles.filterTabItemActive]}
            onPress={() => setHomeTxFilter('income')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabItemText,
                homeTxFilter === 'income' && { color: COLORS.success, fontWeight: '700' },
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* NATURAL SCROLLABLE TRANSACTIONS LIST */}
        {displayedHomeTransactions.length === 0 ? (
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
              style={[styles.emptyActionBtn, { backgroundColor: COLORS.finance, borderColor: COLORS.finance, marginTop: 16 }]}
              onPress={() => openNewTransaction('expense')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#08090C" />
              <Text style={[styles.emptyActionBtnText, { color: '#08090C' }]}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginBottom: 14 }}>
            {displayedHomeTransactions.map((item) => (
              <TransactionCard
                key={item.id}
                item={item}
                accounts={accounts}
                onClone={cloneTransaction}
                onDelete={deleteTransaction}
                onEdit={editTransaction}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODALS */}
      <CalendarModal
        visible={filterCalendarVisible}
        selectedDate={selectedMonthFilter}
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
        isEditing={Boolean(editingTxId)}
        hideTypeSwitcher={isPayingBill}
        onClose={() => {
          setEditingTxId(null);
          setIsPayingBill(false);
          setTxModalVisible(false);
        }}
        onSave={saveTransaction}
        setType={setType}
        setAmount={setAmount}
        setDescription={setDescription}
        setSelectedCategory={setSelectedCategory}
        setSelectedAccId={setSelectedAccId}
        setSelectedSubAccId={setSelectedSubAccId}
        setSelectedToAccId={setSelectedToAccId}
        setSelectedToSubAccId={setSelectedToSubAccId}
        onOpenDatePicker={() => setDatePickerVisible(true)}
        onOpenAddCategory={() => setCatModalVisible(true)}
      />

      <DatePickerModal
        visible={datePickerVisible}
        selectedDate={txDate}
        onClose={() => setDatePickerVisible(false)}
        onSelectDate={(d) => {
          setTxDate(d);
          setDatePickerVisible(false);
        }}
      />

      <AccountDetailModal
        visible={accDetailModalVisible}
        account={selectedAccountForDetail}
        totalBalance={selectedAccountForDetail ? getAccBalance(selectedAccountForDetail.id) : 0}
        getSubBalance={getSubBalance}
        onClose={() => setAccDetailModalVisible(false)}
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
      />

      <HistoryModal
        visible={historyModalVisible}
        historyTransactions={historyTransactions}
        accounts={accounts}
        historyTypeFilter={historyTypeFilter}
        historyCatFilter={historyCatFilter}
        historyAvailableCategories={historyAvailableCategories}
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

      <AddCategoryModal
        visible={catModalVisible}
        value={newCategoryName}
        selectedIcon={newCategoryIcon}
        onClose={() => setCatModalVisible(false)}
        onSave={saveCategory}
        onChangeValue={setNewCategoryName}
        onChangeIcon={setNewCategoryIcon}
      />

      <CategoryBudgetModal
        visible={budgetModalVisible}
        categories={expenseCategories}
        budgets={categoryBudgets}
        currency={activeCurrency}
        customCategoryIcons={customCategoryIcons}
        onClose={() => setBudgetModalVisible(false)}
        onSaveBudget={(cat, limit) => {
          const existing = categoryBudgets.find((b) => b.category === cat);
          let updated: CategoryBudget[];
          if (existing) {
            updated = categoryBudgets.map((b) => (b.category === cat ? { ...b, limit } : b));
          } else {
            updated = [...categoryBudgets, { category: cat, limit }];
          }
          saveCategoryBudgets(updated);
        }}
      />

      <CategoryBreakdownModal
        visible={categoryBreakdownModalVisible}
        transactions={filteredMonthlyTransactions}
        budgets={categoryBudgets}
        currency={activeCurrency}
        customCategoryIcons={customCategoryIcons}
        onClose={() => setCategoryBreakdownModalVisible(false)}
        onOpenSetBudget={() => setBudgetModalVisible(true)}
      />

      <AppAlertModal config={alertConfig} onClose={closeAlert} />
    </SafeAreaView>
  );
}