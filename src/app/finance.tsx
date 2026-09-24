import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, FlatList, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Account, Transaction, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, MONTHS } from '../types/finance';
import { TransactionCard, AccountCard, HeroSummaryCard } from '../components/Finance/FinanceCards';
import { TransactionModal } from '../components/Finance/TransactionModal';
import { AccountDetailModal } from '../components/Finance/AccountDetailModal';
import { HistoryModal } from '../components/Finance/HistoryModal';
import { AddAccountModal } from '../components/Finance/AddAccountModal';
import { CalendarModal } from '../components/Finance/CalendarModal';
import { EditBalanceModal, RenameModal, AddCategoryModal } from '../components/Finance/DialogModals';
import { financeStyles as styles } from '../styles/financeStyles';

export default function FinanceTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);

  // Modals Visibility
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [accModalVisible, setAccModalVisible] = useState(false);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [accDetailModalVisible, setAccDetailModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(new Date());
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<Account | null>(null);

  // Transaction Form State
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [selectedAccId, setSelectedAccId] = useState('');
  const [selectedSubAccId, setSelectedSubAccId] = useState('');
  const [txDate, setTxDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  // Account Form State
  const [accFormType, setAccFormType] = useState<'main' | 'sub'>('main');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<Account['type']>('Bank');
  const [newAccCurrency, setNewAccCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [parentAccId, setParentAccId] = useState(''); 

  // Helpers State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editAccId, setEditAccId] = useState('');
  const [editSubAccId, setEditSubAccId] = useState('');
  const [editBalanceValue, setEditBalanceValue] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ type: 'main' | 'sub', accId: string, subId?: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // History Filter
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [historyCatFilter, setHistoryCatFilter] = useState<string>('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const storedTx = await AsyncStorage.getItem('@finance_tx');
      const storedAcc = await AsyncStorage.getItem('@finance_acc');
      const storedExpCat = await AsyncStorage.getItem('@finance_exp_cat');
      const storedIncCat = await AsyncStorage.getItem('@finance_inc_cat');

      if (storedTx) setTransactions(JSON.parse(storedTx));
      if (storedExpCat) setExpenseCategories(JSON.parse(storedExpCat));
      if (storedIncCat) setIncomeCategories(JSON.parse(storedIncCat));

      if (storedAcc) {
        setAccounts(JSON.parse(storedAcc).map((a: any) => ({ ...a, currency: a.currency || 'IDR' })));
      } else {
        const defaultAcc: Account[] = [{ id: 'acc_1', name: 'Cash', type: 'Cash', currency: 'IDR', subAccounts: [{ id: 'sub_1', name: 'Main' }] }];
        setAccounts(defaultAcc);
        await AsyncStorage.setItem('@finance_acc', JSON.stringify(defaultAcc));
      }
    } catch (e) { console.error('Failed to load finance data', e); }
  };

  const getSubBalance = (accId: string, subId: string) => {
    return transactions
      .filter(t => t.accountId === accId && t.subAccountId === subId)
      .reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);
  };

  const getAccBalance = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    if (!acc) return 0;
    return acc.subAccounts.reduce((sum, sub) => sum + getSubBalance(accId, sub.id), 0);
  };

  const totalBalanceIDR = accounts.filter(a => a.currency === 'IDR').reduce((sum, acc) => sum + getAccBalance(acc.id), 0);
  const totalBalanceUSD = accounts.filter(a => a.currency === 'USD').reduce((sum, acc) => sum + getAccBalance(acc.id), 0);

  const filteredMonthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === selectedMonthFilter.getMonth() && d.getFullYear() === selectedMonthFilter.getFullYear();
  });

  const monthlyIncomeIDR = filteredMonthlyTransactions.filter(t => t.type === 'income' && accounts.find(a => a.id === t.accountId)?.currency !== 'USD').reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenseIDR = filteredMonthlyTransactions.filter(t => t.type === 'expense' && accounts.find(a => a.id === t.accountId)?.currency !== 'USD').reduce((sum, t) => sum + t.amount, 0);
  const monthlyIncomeUSD = filteredMonthlyTransactions.filter(t => t.type === 'income' && accounts.find(a => a.id === t.accountId)?.currency === 'USD').reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenseUSD = filteredMonthlyTransactions.filter(t => t.type === 'expense' && accounts.find(a => a.id === t.accountId)?.currency === 'USD').reduce((sum, t) => sum + t.amount, 0);

  const sortedTransactions = [...filteredMonthlyTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const historyTransactions = transactions.filter(t => {
    if (historyTypeFilter !== 'all' && t.type !== historyTypeFilter) return false;
    if (historyCatFilter !== 'all' && t.category !== historyCatFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const historyAvailableCategories = historyTypeFilter === 'expense' ? expenseCategories : historyTypeFilter === 'income' ? incomeCategories : Array.from(new Set([...expenseCategories, ...incomeCategories]));

  const openNewTransaction = () => {
    setType('expense'); setAmount(''); setDescription(''); setTxDate(new Date()); setViewDate(new Date()); setSelectedCategory(expenseCategories[0]);
    if (accounts.length > 0) { setSelectedAccId(accounts[0].id); if (accounts[0].subAccounts.length > 0) setSelectedSubAccId(accounts[0].subAccounts[0].id); }
    setTxModalVisible(true);
  };

  const cloneTransaction = (tx: Transaction) => {
    setType(tx.type); setAmount(tx.amount.toString()); setDescription(tx.description); setSelectedCategory(tx.category); setSelectedAccId(tx.accountId); setSelectedSubAccId(tx.subAccountId);
    const dateObj = new Date(tx.date); setTxDate(dateObj); setViewDate(dateObj); setTxModalVisible(true); setHistoryModalVisible(false);
  };

  const saveTransaction = async () => {
    if (!amount || !description.trim() || !selectedAccId || !selectedSubAccId) { 
      Alert.alert('Incomplete Data', 'Please fill in the amount, description, and select the funding source.'); 
      return; 
    }
    const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
    const newTx: Transaction = { id: Date.now().toString(), type, amount: parsedAmount, description: description.trim(), category: selectedCategory, date: txDate.toISOString(), accountId: selectedAccId, subAccountId: selectedSubAccId };
    const updatedTx = [newTx, ...transactions]; setTransactions(updatedTx); await AsyncStorage.setItem('@finance_tx', JSON.stringify(updatedTx)); setAmount(''); setDescription(''); setTxModalVisible(false);
  };

  const saveAccount = async () => {
    if (!newAccName.trim()) return;
    let updatedAccounts = [...accounts];
    if (accFormType === 'main') {
      updatedAccounts.push({ id: Date.now().toString(), name: newAccName.trim(), type: newAccType, currency: newAccCurrency, subAccounts: [{ id: Date.now().toString() + '_sub', name: 'Main' }] });
    } else {
      if (!parentAccId) return;
      updatedAccounts = updatedAccounts.map(acc => {
        if (acc.id === parentAccId) return { ...acc, subAccounts: [...acc.subAccounts, { id: Date.now().toString(), name: newAccName.trim() }] };
        return acc;
      });
    }
    setAccounts(updatedAccounts); await AsyncStorage.setItem('@finance_acc', JSON.stringify(updatedAccounts)); setNewAccName(''); setAccModalVisible(false);
  };

  const deleteAccount = (accId: string) => {
    Alert.alert("Delete Main Account?", "All sub-accounts and associated transactions will be deleted permanently.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const updatedTx = transactions.filter(t => t.accountId !== accId); setTransactions(updatedTx); await AsyncStorage.setItem('@finance_tx', JSON.stringify(updatedTx));
        const updatedAcc = accounts.filter(acc => acc.id !== accId); setAccounts(updatedAcc); await AsyncStorage.setItem('@finance_acc', JSON.stringify(updatedAcc)); setAccDetailModalVisible(false);
      }}
    ]);
  };

  const deleteSubAccount = (accId: string, subId: string) => {
    Alert.alert("Delete Sub-Account?", "Transactions recorded under this sub-account will also be deleted.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const updatedTx = transactions.filter(t => !(t.accountId === accId && t.subAccountId === subId)); setTransactions(updatedTx); await AsyncStorage.setItem('@finance_tx', JSON.stringify(updatedTx));
        const updatedAcc = accounts.map(acc => acc.id === accId ? { ...acc, subAccounts: acc.subAccounts.filter(s => s.id !== subId) } : acc); setAccounts(updatedAcc); await AsyncStorage.setItem('@finance_acc', JSON.stringify(updatedAcc));
        if (selectedAccountForDetail?.id === accId) { const updatedSelected = updatedAcc.find(a => a.id === accId); if (updatedSelected) setSelectedAccountForDetail(updatedSelected); }
      }}
    ]);
  };

  const deleteTransaction = (id: string) => {
    Alert.alert("Delete Transaction?", "This record will be permanently deleted.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        const updated = transactions.filter(t => t.id !== id); setTransactions(updated); AsyncStorage.setItem('@finance_tx', JSON.stringify(updated));
      }}
    ]);
  };

  const saveRename = async () => {
    if (!renameValue.trim() || !renameTarget) return;
    const updated = accounts.map(acc => {
      if (acc.id === renameTarget.accId) {
        if (renameTarget.type === 'main') return { ...acc, name: renameValue.trim() };
        return { ...acc, subAccounts: acc.subAccounts.map(s => s.id === renameTarget.subId ? { ...s, name: renameValue.trim() } : s) };
      }
      return acc;
    });
    setAccounts(updated); await AsyncStorage.setItem('@finance_acc', JSON.stringify(updated));
    if (selectedAccountForDetail?.id === renameTarget.accId) { const updatedAcc = updated.find(a => a.id === renameTarget.accId); if (updatedAcc) setSelectedAccountForDetail(updatedAcc); }
    setRenameModalVisible(false);
  };

  const saveCategory = async () => {
    if (!newCategoryName.trim()) return;
    if (type === 'expense') {
      const updated = [...expenseCategories, newCategoryName.trim()]; setExpenseCategories(updated); setSelectedCategory(newCategoryName.trim()); await AsyncStorage.setItem('@finance_exp_cat', JSON.stringify(updated));
    } else {
      const updated = [...incomeCategories, newCategoryName.trim()]; setIncomeCategories(updated); setSelectedCategory(newCategoryName.trim()); await AsyncStorage.setItem('@finance_inc_cat', JSON.stringify(updated));
    }
    setNewCategoryName(''); setCatModalVisible(false);
  };

  const saveBalanceCorrection = async () => {
    const targetBal = parseFloat(editBalanceValue.replace(/[^0-9.-]/g, '')) || 0;
    const currentBal = getSubBalance(editAccId, editSubAccId);
    const diff = targetBal - currentBal;
    if (diff === 0) { setBalanceModalVisible(false); return; }
    const newTx: Transaction = { id: Date.now().toString(), type: diff > 0 ? 'income' : 'expense', amount: Math.abs(diff), description: 'Balance Adjustment', category: 'Adjustment', date: new Date().toISOString(), accountId: editAccId, subAccountId: editSubAccId };
    const updatedTx = [newTx, ...transactions]; setTransactions(updatedTx); await AsyncStorage.setItem('@finance_tx', JSON.stringify(updatedTx)); setBalanceModalVisible(false);
    if (accDetailModalVisible && selectedAccountForDetail) { const updatedAcc = accounts.find(a => a.id === selectedAccountForDetail.id); if (updatedAcc) setSelectedAccountForDetail(updatedAcc); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" translucent={true} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Finance</Text>
        <Text style={styles.slogan}>Manage Your Money Wisely, Live Freely</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <HeroSummaryCard 
          totalIDR={totalBalanceIDR} totalUSD={totalBalanceUSD} month={selectedMonthFilter}
          onPrevMonth={() => setSelectedMonthFilter(new Date(selectedMonthFilter.getFullYear(), selectedMonthFilter.getMonth() - 1, 1))}
          onNextMonth={() => setSelectedMonthFilter(new Date(selectedMonthFilter.getFullYear(), selectedMonthFilter.getMonth() + 1, 1))}
          incIDR={monthlyIncomeIDR} incUSD={monthlyIncomeUSD} expIDR={monthlyExpenseIDR} expUSD={monthlyExpenseUSD}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Accounts</Text>
          <TouchableOpacity style={styles.addAccBtn} onPress={() => setAccModalVisible(true)} activeOpacity={0.8}>
            <Ionicons name="add" size={14} color="#09090B" />
            <Text style={styles.addAccText}>Add Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 28 }}>
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <AccountCard item={item} balance={getAccBalance(item.id)} onPress={(acc) => { setSelectedAccountForDetail(acc); setAccDetailModalVisible(true); }} />}
            contentContainerStyle={{ paddingRight: 20 }}
            snapToInterval={232}
            decelerationRate="fast"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>History {MONTHS[selectedMonthFilter.getMonth()]}</Text>
          <TouchableOpacity style={styles.addAccBtn} onPress={() => setHistoryModalVisible(true)} activeOpacity={0.8}>
            <Ionicons name="list" size={14} color="#09090B" />
            <Text style={styles.addAccText}>ALL</Text>
          </TouchableOpacity>
        </View>

        {sortedTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#27272A" />
            <Text style={styles.emptyText}>There are no transactions recorded this month.</Text>
          </View>
        ) : (
          sortedTransactions.map(item => <TransactionCard key={item.id} item={item} accounts={accounts} onClone={cloneTransaction} onDelete={deleteTransaction} />)
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openNewTransaction} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color="#09090B" />
      </TouchableOpacity>

      <TransactionModal 
        visible={txModalVisible} type={type} amount={amount} description={description} txDate={txDate}
        selectedCategory={selectedCategory} selectedAccId={selectedAccId} selectedSubAccId={selectedSubAccId}
        accounts={accounts} expenseCategories={expenseCategories} incomeCategories={incomeCategories}
        onClose={() => setTxModalVisible(false)} onSave={saveTransaction} setType={setType} setAmount={setAmount}
        setDescription={setDescription} setSelectedCategory={setSelectedCategory} setSelectedAccId={setSelectedAccId}
        setSelectedSubAccId={setSelectedSubAccId} onOpenDatePicker={() => setDatePickerVisible(true)} onOpenAddCategory={() => setCatModalVisible(true)}
      />

      <AccountDetailModal 
        visible={accDetailModalVisible} account={selectedAccountForDetail} totalBalance={selectedAccountForDetail ? getAccBalance(selectedAccountForDetail.id) : 0}
        getSubBalance={getSubBalance} onClose={() => setAccDetailModalVisible(false)}
        onRenameAccount={(acc) => { setRenameTarget({ type: 'main', accId: acc.id }); setRenameValue(acc.name); setRenameModalVisible(true); }}
        onDeleteAccount={deleteAccount} onEditBalance={(accId, subId) => { setEditAccId(accId); setEditSubAccId(subId); setEditBalanceValue(getSubBalance(accId, subId).toString()); setBalanceModalVisible(true); }}
        onRenameSubAccount={(accId, subId, name) => { setRenameTarget({ type: 'sub', accId, subId }); setRenameValue(name); setRenameModalVisible(true); }}
        onDeleteSubAccount={deleteSubAccount}
      />

      <HistoryModal 
        visible={historyModalVisible} historyTransactions={historyTransactions} accounts={accounts} historyTypeFilter={historyTypeFilter}
        historyCatFilter={historyCatFilter} historyAvailableCategories={historyAvailableCategories}
        onClose={() => setHistoryModalVisible(false)} setTypeFilter={setHistoryTypeFilter} setCatFilter={setHistoryCatFilter}
        onClone={cloneTransaction} onDelete={deleteTransaction}
      />

      <AddAccountModal 
        visible={accModalVisible} accFormType={accFormType} newAccName={newAccName} newAccType={newAccType}
        newAccCurrency={newAccCurrency} parentAccId={parentAccId} accounts={accounts}
        onClose={() => setAccModalVisible(false)} onSave={saveAccount} setAccFormType={setAccFormType}
        setNewAccName={setNewAccName} setNewAccType={setNewAccType} setNewAccCurrency={setNewAccCurrency} setParentAccId={setParentAccId}
      />

      <CalendarModal 
        visible={datePickerVisible} txDate={txDate} viewDate={viewDate}
        onClose={() => setDatePickerVisible(false)}
        onSelectDate={(d) => { setTxDate(d); setDatePickerVisible(false); }}
        onPrevMonth={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
        onNextMonth={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
      />

      <EditBalanceModal 
        visible={balanceModalVisible} value={editBalanceValue} currency={accounts.find(a => a.id === editAccId)?.currency || 'IDR'}
        onClose={() => setBalanceModalVisible(false)} onSave={saveBalanceCorrection} onChangeValue={setEditBalanceValue}
      />

      <RenameModal 
        visible={renameModalVisible} value={renameValue} onClose={() => setRenameModalVisible(false)}
        onSave={saveRename} onChangeValue={setRenameValue}
      />

      <AddCategoryModal 
        visible={catModalVisible} value={newCategoryName} onClose={() => setCatModalVisible(false)}
        onSave={saveCategory} onChangeValue={setNewCategoryName}
      />
    </SafeAreaView>
  );
}