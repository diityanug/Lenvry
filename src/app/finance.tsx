import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, Modal, TextInput, FlatList, Alert, KeyboardAvoidingView, Platform, Keyboard, ScrollView, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Account, Transaction, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, ACCOUNT_TYPES, MONTHS, DAYS, formatMoney } from '../types/finance';
import { TransactionCard, AccountCard, HeroSummaryCard } from '../components/Finance/FinanceCards';

export default function FinanceTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);

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

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [selectedAccId, setSelectedAccId] = useState('');
  const [selectedSubAccId, setSelectedSubAccId] = useState('');
  
  const [txDate, setTxDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  const [accFormType, setAccFormType] = useState<'main' | 'sub'>('main');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<Account['type']>('Bank');
  const [newAccCurrency, setNewAccCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [parentAccId, setParentAccId] = useState(''); 

  const [newCategoryName, setNewCategoryName] = useState('');
  const [editAccId, setEditAccId] = useState('');
  const [editSubAccId, setEditSubAccId] = useState('');
  const [editBalanceValue, setEditBalanceValue] = useState('');

  const [renameTarget, setRenameTarget] = useState<{ type: 'main' | 'sub', accId: string, subId?: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');

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
        const parsedAccounts = JSON.parse(storedAcc).map((a: any) => ({ ...a, currency: a.currency || 'IDR' }));
        setAccounts(parsedAccounts);
      } else {
        const defaultAcc: Account[] = [{ id: 'acc_1', name: 'Cash', type: 'Wallet', currency: 'IDR', subAccounts: [{ id: 'sub_1', name: 'Utama' }] }];
        setAccounts(defaultAcc);
        await AsyncStorage.setItem('@finance_acc', JSON.stringify(defaultAcc));
      }
    } catch (e) { console.error('Gagal memuat data', e); }
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
  const handlePrevMonthFilter = () => setSelectedMonthFilter(new Date(selectedMonthFilter.getFullYear(), selectedMonthFilter.getMonth() - 1, 1));
  const handleNextMonthFilter = () => setSelectedMonthFilter(new Date(selectedMonthFilter.getFullYear(), selectedMonthFilter.getMonth() + 1, 1));

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
    if (!amount || !description.trim() || !selectedAccId || !selectedSubAccId) { Alert.alert('Data Belum Lengkap', 'Lengkapi nominal, keterangan, dan pilih sumber dana.'); return; }
    const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
    const newTx: Transaction = { id: Date.now().toString(), type, amount: parsedAmount, description: description.trim(), category: selectedCategory, date: txDate.toISOString(), accountId: selectedAccId, subAccountId: selectedSubAccId };
    const updatedTx = [newTx, ...transactions]; setTransactions(updatedTx); await AsyncStorage.setItem('@finance_tx', JSON.stringify(updatedTx)); setAmount(''); setDescription(''); Keyboard.dismiss(); setTxModalVisible(false);
  };

  const saveAccount = async () => {
    if (!newAccName.trim()) return;
    let updatedAccounts = [...accounts];
    if (accFormType === 'main') {
      updatedAccounts.push({ id: Date.now().toString(), name: newAccName.trim(), type: newAccType, currency: newAccCurrency, subAccounts: [{ id: Date.now().toString() + '_sub', name: 'Utama' }] });
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
    Alert.alert("Hapus Akun Utama?", "Semua sub-akun dan transaksi di dalamnya akan terhapus permanen.", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
          const updatedTx = transactions.filter(t => t.accountId !== accId); setTransactions(updatedTx); await AsyncStorage.setItem('@finance_tx', JSON.stringify(updatedTx));
          const updatedAcc = accounts.filter(acc => acc.id !== accId); setAccounts(updatedAcc); await AsyncStorage.setItem('@finance_acc', JSON.stringify(updatedAcc)); setAccDetailModalVisible(false);
      }}
    ]);
  };

  const deleteSubAccount = (accId: string, subId: string) => {
    Alert.alert("Hapus Sub-Akun?", "Menghapus sub-akun ini juga akan menghapus semua transaksinya.", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
          const updatedTx = transactions.filter(t => !(t.accountId === accId && t.subAccountId === subId)); setTransactions(updatedTx); await AsyncStorage.setItem('@finance_tx', JSON.stringify(updatedTx));
          const updatedAcc = accounts.map(acc => { if (acc.id === accId) return { ...acc, subAccounts: acc.subAccounts.filter(s => s.id !== subId) }; return acc; });
          setAccounts(updatedAcc); await AsyncStorage.setItem('@finance_acc', JSON.stringify(updatedAcc));
          if (selectedAccountForDetail?.id === accId) { const updatedSelected = updatedAcc.find(a => a.id === accId); if (updatedSelected) setSelectedAccountForDetail(updatedSelected); }
      }}
    ]);
  };

  const deleteTransaction = (id: string) => {
    Alert.alert("Hapus Transaksi?", "Data ini akan dihapus permanen.", [{ text: "Batal", style: "cancel" }, { text: "Hapus", style: "destructive", onPress: () => {
        const updated = transactions.filter(t => t.id !== id); setTransactions(updated); AsyncStorage.setItem('@finance_tx', JSON.stringify(updated));
    }}]);
  };

  const openRename = (type: 'main' | 'sub', accId: string, subId?: string, currentName: string = '') => { setRenameTarget({ type, accId, subId }); setRenameValue(currentName); setRenameModalVisible(true); };
  const saveRename = async () => {
    if (!renameValue.trim() || !renameTarget) return;
    const updated = accounts.map(acc => {
      if (acc.id === renameTarget.accId) {
        if (renameTarget.type === 'main') return { ...acc, name: renameValue.trim() };
        else if (renameTarget.type === 'sub') return { ...acc, subAccounts: acc.subAccounts.map(sub => sub.id === renameTarget.subId ? { ...sub, name: renameValue.trim() } : sub) };
      }
      return acc;
    });
    setAccounts(updated); await AsyncStorage.setItem('@finance_acc', JSON.stringify(updated));
    if (selectedAccountForDetail?.id === renameTarget.accId) { const updatedAcc = updated.find(a => a.id === renameTarget.accId); if (updatedAcc) setSelectedAccountForDetail(updatedAcc); }
    setRenameModalVisible(false);
  };

  const saveCategory = async () => {
    if (!newCategoryName.trim()) return;
    if (type === 'expense') { const updated = [...expenseCategories, newCategoryName.trim()]; setExpenseCategories(updated); setSelectedCategory(newCategoryName.trim()); await AsyncStorage.setItem('@finance_exp_cat', JSON.stringify(updated));
    } else { const updated = [...incomeCategories, newCategoryName.trim()]; setIncomeCategories(updated); setSelectedCategory(newCategoryName.trim()); await AsyncStorage.setItem('@finance_inc_cat', JSON.stringify(updated)); }
    setNewCategoryName(''); setCatModalVisible(false);
  };

  const openEditBalance = (accId: string, subId: string) => { const currentBal = getSubBalance(accId, subId); setEditBalanceValue(currentBal.toString()); setEditAccId(accId); setEditSubAccId(subId); setBalanceModalVisible(true); };
  const saveBalanceCorrection = async () => {
    const targetBal = parseFloat(editBalanceValue.replace(/[^0-9.-]/g, '')) || 0; const currentBal = getSubBalance(editAccId, editSubAccId); const diff = targetBal - currentBal;
    if (diff === 0) { setBalanceModalVisible(false); return; }
    const newTx: Transaction = { id: Date.now().toString(), type: diff > 0 ? 'income' : 'expense', amount: Math.abs(diff), description: 'Penyesuaian Saldo', category: 'Penyesuaian', date: new Date().toISOString(), accountId: editAccId, subAccountId: editSubAccId };
    const updatedTx = [newTx, ...transactions]; setTransactions(updatedTx); await AsyncStorage.setItem('@finance_tx', JSON.stringify(updatedTx)); setBalanceModalVisible(false);
    if (accDetailModalVisible && selectedAccountForDetail) { const updatedAcc = accounts.find(a => a.id === selectedAccountForDetail.id); if(updatedAcc) setSelectedAccountForDetail(updatedAcc); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" translucent={true} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Finance</Text>
          <Text style={styles.slogan}>Kelola keuanganmu dengan bijak.</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* --- HERO SECTION KINI DIEKSTRAK --- */}
        <HeroSummaryCard 
          totalIDR={totalBalanceIDR} totalUSD={totalBalanceUSD} month={selectedMonthFilter}
          onPrevMonth={handlePrevMonthFilter} onNextMonth={handleNextMonthFilter}
          incIDR={monthlyIncomeIDR} incUSD={monthlyIncomeUSD} expIDR={monthlyExpenseIDR} expUSD={monthlyExpenseUSD}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Akun & Dompet</Text>
          <TouchableOpacity style={styles.addAccBtn} onPress={() => setAccModalVisible(true)}>
            <Ionicons name="add" size={14} color="#09090B" />
            <Text style={styles.addAccText}>BARU</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 28 }}>
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({item}) => <AccountCard item={item} balance={getAccBalance(item.id)} onPress={(acc) => { setSelectedAccountForDetail(acc); setAccDetailModalVisible(true); }} />}
            contentContainerStyle={{ paddingRight: 20 }}
            snapToInterval={232}
            decelerationRate="fast"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Riwayat {MONTHS[selectedMonthFilter.getMonth()]}</Text>
          <TouchableOpacity style={styles.addAccBtn} onPress={() => setHistoryModalVisible(true)}>
            <Ionicons name="list" size={14} color="#09090B" />
            <Text style={styles.addAccText}>SEMUA</Text>
          </TouchableOpacity>
        </View>

        {sortedTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#27272A" />
            <Text style={styles.emptyText}>Belum ada transaksi di bulan ini.</Text>
          </View>
        ) : (
          sortedTransactions.map(item => <TransactionCard key={item.id} item={item} accounts={accounts} onClone={cloneTransaction} onDelete={deleteTransaction} />)
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openNewTransaction} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color="#09090B" />
      </TouchableOpacity>

      {/* =====================================================================================================
          SEMUA KODE MODAL TETAP ADA DI BAWAH SINI (Tidak diubah, hanya styles CSS-nya yang dibersihkan)
          ===================================================================================================== */}
      
      {/* MODAL RIWAYAT LENGKAP */}
      <Modal animationType="slide" transparent={true} visible={historyModalVisible} onRequestClose={() => setHistoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '95%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Semua Transaksi</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}><Ionicons name="close-circle" size={28} color="#3F3F46" /></TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>TIPE TRANSAKSI</Text>
            <View style={styles.typeRowSmall}>
              {['all', 'expense', 'income'].map(flt => (
                <TouchableOpacity key={flt} style={[styles.typeBtnSmall, historyTypeFilter === flt && styles.typeBtnSmallActive]} onPress={() => { setHistoryTypeFilter(flt as any); setHistoryCatFilter('all'); }}>
                  <Text style={[styles.typeBtnTextSmall, historyTypeFilter === flt && styles.typeBtnTextSmallActive]}>{flt === 'all' ? 'Semua' : flt === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>KATEGORI</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollSmall} contentContainerStyle={{ paddingRight: 24 }}>
              <TouchableOpacity style={[styles.chip, historyCatFilter === 'all' && styles.chipActive]} onPress={() => setHistoryCatFilter('all')}>
                <Text style={[styles.chipText, historyCatFilter === 'all' && styles.chipTextActive]}>Semua</Text>
              </TouchableOpacity>
              {historyAvailableCategories.map(cat => (
                <TouchableOpacity key={cat} style={[styles.chip, historyCatFilter === cat && styles.chipActive]} onPress={() => setHistoryCatFilter(cat)}>
                  <Text style={[styles.chipText, historyCatFilter === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FlatList
              data={historyTransactions}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="receipt-outline" size={48} color="#27272A" /><Text style={styles.emptyText}>Tidak ada transaksi.</Text></View>}
              renderItem={({item}) => <TransactionCard item={item} accounts={accounts} onClone={cloneTransaction} onDelete={deleteTransaction} />}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL DETAIL AKUN */}
      <Modal animationType="slide" transparent={true} visible={accDetailModalVisible} onRequestClose={() => setAccDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setAccDetailModalVisible(false)}><View style={styles.modalOverlayDismissArea} /></TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={{flex: 1}}>
                <Text style={styles.modalTitle}>{selectedAccountForDetail?.name}</Text>
                <Text style={styles.modalSubtitle}>{selectedAccountForDetail?.type} ({selectedAccountForDetail?.currency}) • Total: {selectedAccountForDetail ? formatMoney(getAccBalance(selectedAccountForDetail.id), selectedAccountForDetail.currency) : 'Rp 0'}</Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <TouchableOpacity onPress={() => openRename('main', selectedAccountForDetail!.id, undefined, selectedAccountForDetail!.name)} style={{marginRight: 16}}><Ionicons name="pencil" size={24} color="#D4FF00" /></TouchableOpacity>
                <TouchableOpacity onPress={() => deleteAccount(selectedAccountForDetail!.id)} style={{marginRight: 16}}><Ionicons name="trash-outline" size={24} color="#FF453A" /></TouchableOpacity>
                <TouchableOpacity onPress={() => setAccDetailModalVisible(false)}><Ionicons name="close-circle" size={28} color="#3F3F46" /></TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>DAFTAR SUB-AKUN (Ketuk untuk ubah saldo)</Text>
              {selectedAccountForDetail?.subAccounts.map(sub => (
                <View key={sub.id} style={styles.subAccDetailRow}>
                  <TouchableOpacity style={{flex: 1, flexDirection: 'row', alignItems: 'center'}} onPress={() => openEditBalance(selectedAccountForDetail.id, sub.id)}>
                    <Text style={styles.subAccDetailName}>{sub.name}</Text>
                    <Text style={[styles.subAccDetailBalance, {marginLeft: 12}]}>{formatMoney(getSubBalance(selectedAccountForDetail.id, sub.id), selectedAccountForDetail.currency)}</Text>
                  </TouchableOpacity>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <TouchableOpacity onPress={() => openRename('sub', selectedAccountForDetail.id, sub.id, sub.name)} style={{padding: 8, marginRight: 4}}><Ionicons name="pencil" size={16} color="#D4FF00" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteSubAccount(selectedAccountForDetail.id, sub.id)} style={{padding: 8}}><Ionicons name="trash-outline" size={16} color="#FF453A" /></TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL CATAT TRANSAKSI */}
      <Modal animationType="slide" transparent={true} visible={txModalVisible} onRequestClose={() => setTxModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View style={styles.modalOverlayDismissArea} /></TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catat Transaksi</Text>
              <TouchableOpacity onPress={() => setTxModalVisible(false)}><Ionicons name="close-circle" size={28} color="#3F3F46" /></TouchableOpacity>
            </View>
            
            <View style={styles.typeRow}>
              <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]} onPress={() => {setType('expense'); setSelectedCategory(expenseCategories[0])}}>
                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Pengeluaran</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]} onPress={() => {setType('income'); setSelectedCategory(incomeCategories[0])}}>
                <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Pemasukan</Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>{accounts.find(a => a.id === selectedAccId)?.currency === 'USD' ? '$' : 'Rp'}</Text>
                <TextInput style={styles.inputAmountLarge} placeholder="0" placeholderTextColor="#3F3F46" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} maxLength={12} />
              </View>

              <View style={styles.datePickerContainer}>
                <Text style={styles.inputLabel}>TANGGAL TRANSAKSI</Text>
                <TouchableOpacity style={styles.datePickerBtn} onPress={() => setDatePickerVisible(true)}>
                  <Ionicons name="calendar-outline" size={16} color="#D4FF00" style={{marginRight: 8}} />
                  <Text style={styles.datePickerText}>{txDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput style={styles.input} placeholder="Keterangan (ex: Beli Saham)" placeholderTextColor="#52525B" value={description} onChangeText={setDescription} />

              <Text style={styles.inputLabel}>SUMBER DANA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingRight: 48 }} keyboardShouldPersistTaps="handled">
                {accounts.map(acc => (
                  <TouchableOpacity key={acc.id} style={[styles.chip, selectedAccId === acc.id && styles.chipActive]} onPress={() => { setSelectedAccId(acc.id); setSelectedSubAccId(''); }}>
                    <Text style={[styles.chipText, selectedAccId === acc.id && styles.chipTextActive]}>{acc.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedAccId && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipScroll, {marginTop: -12}]} contentContainerStyle={{ paddingRight: 48 }} keyboardShouldPersistTaps="handled">
                  {accounts.find(a => a.id === selectedAccId)?.subAccounts.map(sub => (
                    <TouchableOpacity key={sub.id} style={[styles.chipSub, selectedSubAccId === sub.id && styles.chipSubActive]} onPress={() => setSelectedSubAccId(sub.id)}>
                      <Text style={[styles.chipSubText, selectedSubAccId === sub.id && styles.chipSubTextActive]}>└ {sub.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.inputLabel}>KATEGORI</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingRight: 48 }} keyboardShouldPersistTaps="handled">
                {(type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                  <TouchableOpacity key={cat} style={[styles.chip, selectedCategory === cat && styles.chipActive]} onPress={() => setSelectedCategory(cat)}>
                    <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.chipAdd} onPress={() => setCatModalVisible(true)}><Text style={styles.chipAddText}>+ Baru</Text></TouchableOpacity>
              </ScrollView>

              <TouchableOpacity style={styles.saveButton} onPress={saveTransaction}><Text style={styles.saveButtonText}>SIMPAN TRANSAKSI</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL CALENDAR PICKER */}
      <Modal animationType="fade" transparent={true} visible={datePickerVisible} onRequestClose={() => setDatePickerVisible(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalContentSmall}>
            <View style={styles.calendarHeaderRow}>
              <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} style={styles.calendarNavBtn}><Ionicons name="chevron-back" size={24} color="#FAFAFA" /></TouchableOpacity>
              <Text style={styles.calendarMonthText}>{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</Text>
              <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} style={styles.calendarNavBtn}><Ionicons name="chevron-forward" size={24} color="#FAFAFA" /></TouchableOpacity>
            </View>
            <View style={styles.calendarDaysHeader}>{DAYS.map(d => <Text key={d} style={styles.calendarDayName}>{d}</Text>)}</View>
            <View style={styles.calendarGrid}>
              {Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()}).map((_, i) => <View key={`blank-${i}`} style={styles.calendarCell} />)}
              {Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()}).map((_, i) => {
                const day = i + 1;
                const isSelected = txDate.getDate() === day && txDate.getMonth() === viewDate.getMonth() && txDate.getFullYear() === viewDate.getFullYear();
                const isToday = new Date().getDate() === day && new Date().getMonth() === viewDate.getMonth() && new Date().getFullYear() === viewDate.getFullYear();
                return (
                  <TouchableOpacity key={`day-${day}`} style={[styles.calendarCell, isSelected && styles.calendarCellSelected, isToday && !isSelected && styles.calendarCellToday]} onPress={() => { setTxDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)); setDatePickerVisible(false); }}>
                    <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected, isToday && !isSelected && styles.calendarDayTextToday]}>{day}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <TouchableOpacity style={styles.dialogBtnCancel} onPress={() => setDatePickerVisible(false)}><Text style={styles.dialogBtnCancelText}>TUTUP</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL KATEGORI BARU */}
      <Modal animationType="fade" transparent={true} visible={catModalVisible} onRequestClose={() => setCatModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlayCenter}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitleCenter}>Kategori Baru</Text>
            <TextInput style={styles.dialogInput} placeholder="Contoh: Belanja Online..." placeholderTextColor="#52525B" value={newCategoryName} onChangeText={setNewCategoryName} autoFocus={true} />
            <View style={styles.dialogActionRow}>
              <TouchableOpacity style={styles.dialogBtnCancel} onPress={() => setCatModalVisible(false)}><Text style={styles.dialogBtnCancelText}>BATAL</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dialogBtnConfirm} onPress={saveCategory}><Text style={styles.dialogBtnConfirmText}>SIMPAN</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL EDIT SALDO */}
      <Modal animationType="fade" transparent={true} visible={balanceModalVisible} onRequestClose={() => setBalanceModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlayCenter}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitleCenter}>Atur Nominal Saldo</Text>
            <View style={[styles.amountContainer, {marginBottom: 24}]}>
              <Text style={[styles.currencySymbol, {fontSize: 20}]}>{accounts.find(a => a.id === editAccId)?.currency === 'USD' ? '$' : 'Rp'}</Text>
              <TextInput style={[styles.inputAmountLarge, {fontSize: 32}]} placeholder="0" placeholderTextColor="#3F3F46" keyboardType="decimal-pad" value={editBalanceValue} onChangeText={setEditBalanceValue} maxLength={12} autoFocus={true} />
            </View>
            <View style={styles.dialogActionRow}>
              <TouchableOpacity style={styles.dialogBtnCancel} onPress={() => setBalanceModalVisible(false)}><Text style={styles.dialogBtnCancelText}>BATAL</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dialogBtnConfirm} onPress={saveBalanceCorrection}><Text style={styles.dialogBtnConfirmText}>SIMPAN</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL UBAH NAMA */}
      <Modal animationType="fade" transparent={true} visible={renameModalVisible} onRequestClose={() => setRenameModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlayCenter}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitleCenter}>Ubah Nama</Text>
            <TextInput style={[styles.dialogInputLeft, {marginTop: 16}]} placeholder="Masukkan nama baru..." placeholderTextColor="#52525B" value={renameValue} onChangeText={setRenameValue} autoFocus={true} />
            <View style={styles.dialogActionRow}>
              <TouchableOpacity style={styles.dialogBtnCancel} onPress={() => setRenameModalVisible(false)}><Text style={styles.dialogBtnCancelText}>BATAL</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dialogBtnConfirm} onPress={saveRename}><Text style={styles.dialogBtnConfirmText}>SIMPAN</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL TAMBAH AKUN */}
      <Modal animationType="fade" transparent={true} visible={accModalVisible} onRequestClose={() => setAccModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlayCenter}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View style={StyleSheet.absoluteFill} /></TouchableWithoutFeedback>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitleCenter}>Tambah Akun Baru</Text>
            <View style={styles.typeRowSmall}>
              <TouchableOpacity style={[styles.typeBtnSmall, accFormType === 'main' && styles.typeBtnSmallActive]} onPress={() => setAccFormType('main')}><Text style={[styles.typeBtnTextSmall, accFormType === 'main' && styles.typeBtnTextSmallActive]}>Akun Utama</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtnSmall, accFormType === 'sub' && styles.typeBtnSmallActive]} onPress={() => setAccFormType('sub')}><Text style={[styles.typeBtnTextSmall, accFormType === 'sub' && styles.typeBtnTextSmallActive]}>Sub-Akun</Text></TouchableOpacity>
            </View>

            {accFormType === 'sub' && (
              <>
                <Text style={styles.inputLabel}>PILIH AKUN INDUK</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollSmall} contentContainerStyle={{ paddingRight: 24 }} keyboardShouldPersistTaps="handled">
                  {accounts.map(acc => (
                    <TouchableOpacity key={acc.id} style={[styles.chip, parentAccId === acc.id && styles.chipActive]} onPress={() => setParentAccId(acc.id)}>
                      <Text style={[styles.chipText, parentAccId === acc.id && styles.chipTextActive]}>{acc.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {accFormType === 'main' && (
              <>
                <Text style={styles.inputLabel}>MATA UANG</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollSmall} contentContainerStyle={{ paddingRight: 24 }} keyboardShouldPersistTaps="handled">
                  {['IDR', 'USD'].map(c => (
                    <TouchableOpacity key={c} style={[styles.chip, newAccCurrency === c && styles.chipActive]} onPress={() => setNewAccCurrency(c as 'IDR' | 'USD')}>
                      <Text style={[styles.chipText, newAccCurrency === c && styles.chipTextActive]}>{c} {c==='IDR' ? '(Rupiah)' : '(Dolar)'}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.inputLabel}>TIPE AKUN</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollSmall} contentContainerStyle={{ paddingRight: 24 }} keyboardShouldPersistTaps="handled">
                  {ACCOUNT_TYPES.map(t => (
                    <TouchableOpacity key={t} style={[styles.chip, newAccType === t && styles.chipActive]} onPress={() => setNewAccType(t as any)}>
                      <Text style={[styles.chipText, newAccType === t && styles.chipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            <Text style={styles.inputLabel}>NAMA</Text>
            <TextInput style={styles.dialogInputLeft} placeholder="Contoh: Bank BCA..." placeholderTextColor="#52525B" value={newAccName} onChangeText={setNewAccName} />
            <View style={styles.dialogActionRow}>
              <TouchableOpacity style={styles.dialogBtnCancel} onPress={() => setAccModalVisible(false)}><Text style={styles.dialogBtnCancelText}>BATAL</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dialogBtnConfirm} onPress={saveAccount}><Text style={styles.dialogBtnConfirmText}>SIMPAN</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

// ==========================================
// STYLES YANG TERSISA (Hanya Modal & Layout Utama)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FAFAFA', letterSpacing: -0.5 },
  slogan: { fontSize: 13, color: '#A1A1AA', marginTop: 4, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FAFAFA' },
  addAccBtn: { backgroundColor: '#D4FF00', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addAccText: { fontSize: 11, fontWeight: 'bold', marginLeft: 4, color: '#09090B' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: '#71717A', fontSize: 14, fontWeight: '500', marginTop: 12 },
  fab: { position: 'absolute', bottom: 32, right: 24, backgroundColor: '#D4FF00', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#D4FF00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalOverlayDismissArea: { flex: 1 },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#18181B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%', borderWidth: 1, borderColor: '#27272A' },
  modalContentSmall: { backgroundColor: '#18181B', borderRadius: 24, padding: 24, width: '100%', borderWidth: 1, borderColor: '#27272A' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#3F3F46', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FAFAFA' },
  modalSubtitle: { fontSize: 13, color: '#A1A1AA', marginTop: 4, fontWeight: '600' },
  modalTitleCenter: { fontSize: 20, fontWeight: 'bold', color: '#FAFAFA', marginBottom: 8, textAlign: 'center' },
  
  subAccDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#27272A' },
  subAccDetailName: { color: '#FAFAFA', fontSize: 15, fontWeight: '600' },
  subAccDetailBalance: { color: '#FAFAFA', fontSize: 15, fontWeight: 'bold' },
  
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, backgroundColor: '#09090B', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: '#27272A' },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  typeBtnExpense: { backgroundColor: '#FF453A' },
  typeBtnIncome: { backgroundColor: '#D4FF00' },
  typeBtnText: { color: '#71717A', fontSize: 13, fontWeight: 'bold' },
  typeBtnTextActive: { color: '#09090B' },
  typeRowSmall: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, backgroundColor: '#09090B', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#27272A' },
  typeBtnSmall: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  typeBtnSmallActive: { backgroundColor: '#27272A' },
  typeBtnTextSmall: { color: '#71717A', fontSize: 13, fontWeight: 'bold' },
  typeBtnTextSmallActive: { color: '#FAFAFA' },

  amountContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  currencySymbol: { fontSize: 28, color: '#D4FF00', fontWeight: 'bold', marginRight: 8, marginTop: 4 },
  inputAmountLarge: { color: '#D4FF00', fontSize: 48, fontWeight: '900', minWidth: 100 },
  datePickerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#09090B', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#27272A' },
  datePickerText: { color: '#FAFAFA', fontSize: 13, fontWeight: 'bold' },

  inputLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#09090B', color: '#FAFAFA', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, marginBottom: 24, fontSize: 15, borderWidth: 1, borderColor: '#27272A' },
  
  chipScroll: { flexDirection: 'row', flexGrow: 0, marginBottom: 24, marginHorizontal: -24, paddingHorizontal: 24 },
  chipScrollSmall: { flexDirection: 'row', flexGrow: 0, marginBottom: 24, marginHorizontal: -24, paddingHorizontal: 24 },
  chip: { backgroundColor: '#09090B', borderWidth: 1, borderColor: '#27272A', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginRight: 10 },
  chipActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  chipText: { color: '#A1A1AA', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#09090B', fontWeight: 'bold' },
  chipSub: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, marginRight: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3F3F46' },
  chipSubActive: { backgroundColor: '#27272A', borderColor: '#D4FF00' },
  chipSubText: { color: '#A1A1AA', fontSize: 12, fontWeight: '600' },
  chipSubTextActive: { color: '#FAFAFA' },
  chipAdd: { backgroundColor: '#27272A', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  chipAddText: { color: '#FAFAFA', fontSize: 13, fontWeight: '500' },

  saveButton: { backgroundColor: '#D4FF00', paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 16 },
  saveButtonText: { color: '#09090B', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
  
  dialogInput: { backgroundColor: '#09090B', color: '#FAFAFA', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, marginBottom: 28, fontSize: 15, borderWidth: 1, borderColor: '#27272A', textAlign: 'center', width: '100%' },
  dialogInputLeft: { backgroundColor: '#09090B', color: '#FAFAFA', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, marginBottom: 28, fontSize: 15, borderWidth: 1, borderColor: '#27272A', width: '100%' },
  dialogActionRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  dialogBtnCancel: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#27272A', marginRight: 12, alignItems: 'center' },
  dialogBtnCancelText: { color: '#FAFAFA', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
  dialogBtnConfirm: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#D4FF00', alignItems: 'center' },
  dialogBtnConfirmText: { color: '#09090B', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },

  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calendarNavBtn: { padding: 8 },
  calendarMonthText: { color: '#FAFAFA', fontSize: 16, fontWeight: 'bold' },
  calendarDaysHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  calendarDayName: { color: '#A1A1AA', fontSize: 12, fontWeight: 'bold', width: 32, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 24 },
  calendarCell: { width: '14.28%', height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  calendarCellSelected: { backgroundColor: '#D4FF00' },
  calendarCellToday: { borderWidth: 1, borderColor: '#27272A' },
  calendarDayText: { color: '#FAFAFA', fontSize: 14, fontWeight: '500' },
  calendarDayTextSelected: { color: '#09090B', fontWeight: 'bold' },
  calendarDayTextToday: { color: '#D4FF00' }
});