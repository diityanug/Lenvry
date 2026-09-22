import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, Modal, TextInput, FlatList, Alert, KeyboardAvoidingView, 
  Platform, Keyboard, ScrollView, TouchableWithoutFeedback
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

// --- TYPES ---
interface SubAccount {
  id: string;
  name: string;
}
interface Account {
  id: string;
  name: string;
  type: 'Dompet' | 'Bank' | 'Investasi' | 'Piutang' | 'Utang' | 'Valas';
  subAccounts: SubAccount[];
}
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  accountId: string;
  subAccountId: string;
}

// --- CONSTANTS ---
const EXPENSE_CATEGORIES = ['Makan', 'Transport', 'Tagihan', 'Belanja', 'Hiburan', 'Kesehatan', 'Lainnya'];
const INCOME_CATEGORIES = ['Gaji', 'Bisnis', 'Bonus', 'Investasi', 'Lainnya'];
const ACCOUNT_TYPES = ['Dompet', 'Bank', 'Investasi', 'Piutang', 'Utang', 'Valas'];

export default function FinanceTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Modals Visibility
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [accModalVisible, setAccModalVisible] = useState(false);
  
  // Transaction Form State
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [selectedAccId, setSelectedAccId] = useState('');
  const [selectedSubAccId, setSelectedSubAccId] = useState('');

  // Account Form State
  const [accFormType, setAccFormType] = useState<'main' | 'sub'>('main');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<Account['type']>('Bank');
  const [parentAccId, setParentAccId] = useState(''); 

  // Format Rupiah
  const formatRupiah = (angka: number) => {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedTx = await AsyncStorage.getItem('@lenvry_tx');
      const storedAcc = await AsyncStorage.getItem('@lenvry_acc');

      if (storedTx) setTransactions(JSON.parse(storedTx));
      if (storedAcc) {
        setAccounts(JSON.parse(storedAcc));
      } else {
        const defaultAcc: Account[] = [{
          id: 'acc_1',
          name: 'Dompet Tunai',
          type: 'Dompet',
          subAccounts: [{ id: 'sub_1', name: 'Utama' }]
        }];
        setAccounts(defaultAcc);
        await AsyncStorage.setItem('@lenvry_acc', JSON.stringify(defaultAcc));
      }
    } catch (e) {
      console.error('Gagal memuat data keuangan', e);
    }
  };

  // --- CALCULATIONS ---
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

  const totalBalance = accounts.reduce((sum, acc) => sum + getAccBalance(acc.id), 0);

  // --- ACTIONS ---
  const openNewTransaction = () => {
    setType('expense');
    setAmount('');
    setDescription('');
    setSelectedCategory(EXPENSE_CATEGORIES[0]);
    
    if (accounts.length > 0) {
      setSelectedAccId(accounts[0].id);
      if (accounts[0].subAccounts.length > 0) {
        setSelectedSubAccId(accounts[0].subAccounts[0].id);
      }
    }
    setTxModalVisible(true);
  };

  const cloneTransaction = (tx: Transaction) => {
    setType(tx.type);
    setAmount(tx.amount.toString());
    setDescription(tx.description);
    setSelectedCategory(tx.category);
    setSelectedAccId(tx.accountId);
    setSelectedSubAccId(tx.subAccountId);
    setTxModalVisible(true);
  };

  const saveTransaction = async () => {
    if (!amount || !description.trim() || !selectedAccId || !selectedSubAccId) {
      Alert.alert('Error', 'Lengkapi nominal, keterangan, dan pilih sumber dana!');
      return;
    }

    const newTx: Transaction = {
      id: Date.now().toString(),
      type,
      amount: parseInt(amount.replace(/[^0-9]/g, '')),
      description: description.trim(),
      category: selectedCategory,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      accountId: selectedAccId,
      subAccountId: selectedSubAccId
    };

    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    await AsyncStorage.setItem('@lenvry_tx', JSON.stringify(updatedTx));

    setAmount(''); setDescription(''); Keyboard.dismiss(); setTxModalVisible(false);
  };

  const saveAccount = async () => {
    if (!newAccName.trim()) {
      Alert.alert('Error', 'Nama akun tidak boleh kosong!');
      return;
    }

    let updatedAccounts = [...accounts];

    if (accFormType === 'main') {
      updatedAccounts.push({
        id: Date.now().toString(),
        name: newAccName.trim(),
        type: newAccType,
        subAccounts: [{ id: Date.now().toString() + '_sub', name: 'Utama' }]
      });
    } else {
      if (!parentAccId) {
        Alert.alert('Error', 'Pilih akun utama terlebih dahulu!');
        return;
      }
      updatedAccounts = updatedAccounts.map(acc => {
        if (acc.id === parentAccId) {
          return { ...acc, subAccounts: [...acc.subAccounts, { id: Date.now().toString(), name: newAccName.trim() }] };
        }
        return acc;
      });
    }

    setAccounts(updatedAccounts);
    await AsyncStorage.setItem('@lenvry_acc', JSON.stringify(updatedAccounts));
    setNewAccName(''); setAccModalVisible(false);
  };

  const deleteTransaction = (id: string) => {
    Alert.alert("Hapus Transaksi?", "Data ini akan dihapus permanen.", [
      { text: "Batal", style: "cancel" },
      { 
        text: "Hapus", style: "destructive", 
        onPress: () => {
          const updated = transactions.filter(t => t.id !== id);
          setTransactions(updated);
          AsyncStorage.setItem('@lenvry_tx', JSON.stringify(updated));
        } 
      }
    ]);
  };

  // --- RENDERS ---
  const renderAccountItem = ({ item }: { item: Account }) => (
    <View style={styles.accCard}>
      <View style={styles.accCardAccent} />
      <View style={styles.accHeaderRow}>
        <Text style={styles.accName}>{item.name}</Text>
        <FontAwesome5 name={item.type === 'Bank' ? 'university' : item.type === 'Dompet' ? 'wallet' : 'chart-line'} size={14} color="#D4FF00" />
      </View>
      <Text style={styles.accTotalBalance}>{formatRupiah(getAccBalance(item.id))}</Text>
      
      <View style={styles.subAccContainer}>
        {item.subAccounts.map(sub => (
          <View key={sub.id} style={styles.subAccRow}>
            <Text style={styles.subAccName}>{sub.name}</Text>
            <Text style={styles.subAccBalance}>{formatRupiah(getSubBalance(item.id, sub.id))}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Lenvry</Text>
          <Text style={styles.title}>Finance</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="person" size={18} color="#121212" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* HERO CARD - TOTAL NET WORTH */}
        <View style={styles.heroCard}>
          <Text style={styles.balanceLabel}>TOTAL KEKAYAAN BERSIH</Text>
          <Text style={styles.balanceAmount}>{formatRupiah(totalBalance)}</Text>
        </View>

        {/* ACCOUNTS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Akun & Dompet</Text>
          <TouchableOpacity style={styles.addAccBtn} onPress={() => setAccModalVisible(true)}>
            <Ionicons name="add" size={14} color="#121212" />
            <Text style={styles.addAccText}>Baru</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 160, marginBottom: 24 }}>
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderAccountItem}
            contentContainerStyle={{ paddingRight: 20 }}
            snapToInterval={232} // 220 width + 12 margin
            decelerationRate="fast"
          />
        </View>

        {/* TRANSACTIONS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
        </View>

        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada transaksi tercatat.</Text>
        ) : (
          transactions.map((item) => {
            const accName = accounts.find(a => a.id === item.accountId)?.name || 'Unknown';
            const subName = accounts.find(a => a.id === item.accountId)?.subAccounts.find(s => s.id === item.subAccountId)?.name || '';
            return (
              <View key={item.id} style={styles.txCard}>
                <View style={[styles.iconContainer, item.type === 'income' ? styles.iconIncome : styles.iconExpense]}>
                  <Ionicons name={item.type === 'income' ? "arrow-down" : "arrow-up"} size={18} color={item.type === 'income' ? "#4ADE80" : "#FF453A"} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
                  <Text style={styles.txSub}>
                    {item.category} • {accName} {subName ? `(${subName})` : ''}
                  </Text>
                </View>
                
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, item.type === 'income' ? styles.textIncome : styles.textExpense]}>
                    {item.type === 'income' ? '+' : '-'}{formatRupiah(item.amount)}
                  </Text>
                  <View style={styles.txActions}>
                    <TouchableOpacity onPress={() => cloneTransaction(item)} style={styles.actionBtn}>
                      <Ionicons name="copy" size={14} color="#888" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTransaction(item.id)} style={styles.actionBtn}>
                      <Ionicons name="trash" size={14} color="#FF453A" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      {/* FAB ADD TRANSACTION */}
      <TouchableOpacity style={styles.floatingButton} onPress={openNewTransaction} activeOpacity={0.9}>
        <FontAwesome5 name="plus" size={16} color="#121212" style={{ marginRight: 8 }} />
        <Text style={styles.floatingButtonText}>CATAT TRANSAKSI</Text>
      </TouchableOpacity>

      {/* ================= MODAL ADD/CLONE TRANSACTION ================= */}
      <Modal animationType="slide" transparent={true} visible={txModalVisible} onRequestClose={() => setTxModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlayDismissArea} />
          </TouchableWithoutFeedback>

          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catat Transaksi</Text>
              <TouchableOpacity onPress={() => setTxModalVisible(false)}>
                <Text style={styles.closeText}>Tutup</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.typeRow}>
              <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]} onPress={() => {setType('expense'); setSelectedCategory(EXPENSE_CATEGORIES[0])}}>
                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Pengeluaran</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]} onPress={() => {setType('income'); setSelectedCategory(INCOME_CATEGORIES[0])}}>
                <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Pemasukan</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>Rp</Text>
              <TextInput 
                style={styles.inputAmountLarge} 
                placeholder="0" 
                placeholderTextColor="#333" 
                keyboardType="numeric" 
                value={amount} 
                onChangeText={setAmount} 
                maxLength={12}
              />
            </View>
            
            <TextInput style={styles.input} placeholder="Keterangan (ex: Makan Siang)" placeholderTextColor="#666" value={description} onChangeText={setDescription} />

            <Text style={styles.inputLabel}>KATEGORI</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} keyboardShouldPersistTaps="handled">
              {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                <TouchableOpacity key={cat} style={[styles.chip, selectedCategory === cat && styles.chipActive]} onPress={() => setSelectedCategory(cat)}>
                  <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>SUMBER DANA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} keyboardShouldPersistTaps="handled">
              {accounts.map(acc => (
                <TouchableOpacity key={acc.id} style={[styles.chip, selectedAccId === acc.id && styles.chipActive]} onPress={() => { setSelectedAccId(acc.id); setSelectedSubAccId(''); }}>
                  <Text style={[styles.chipText, selectedAccId === acc.id && styles.chipTextActive]}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedAccId ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipScroll, {marginTop: 4}]} keyboardShouldPersistTaps="handled">
                {accounts.find(a => a.id === selectedAccId)?.subAccounts.map(sub => (
                  <TouchableOpacity key={sub.id} style={[styles.chipSub, selectedSubAccId === sub.id && styles.chipSubActive]} onPress={() => setSelectedSubAccId(sub.id)}>
                    <Text style={[styles.chipSubText, selectedSubAccId === sub.id && styles.chipSubTextActive]}>└ {sub.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}

            <TouchableOpacity style={styles.saveButton} onPress={saveTransaction}>
              <Text style={styles.saveButtonText}>SIMPAN TRANSAKSI</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL ADD ACCOUNT ================= */}
      <Modal animationType="fade" transparent={true} visible={accModalVisible} onRequestClose={() => setAccModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlayCenter}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={StyleSheet.absoluteFill} /> 
          </TouchableWithoutFeedback>

          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>Tambah Akun Baru</Text>
            
            <View style={styles.typeRow}>
              <TouchableOpacity style={[styles.typeBtn, accFormType === 'main' && styles.typeBtnActiveLight]} onPress={() => setAccFormType('main')}>
                <Text style={[styles.typeBtnText, accFormType === 'main' && styles.typeBtnTextActive]}>Akun Utama</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, accFormType === 'sub' && styles.typeBtnActiveLight]} onPress={() => setAccFormType('sub')}>
                <Text style={[styles.typeBtnText, accFormType === 'sub' && styles.typeBtnTextActive]}>Sub-Akun</Text>
              </TouchableOpacity>
            </View>

            {accFormType === 'sub' && (
              <>
                <Text style={styles.inputLabel}>PILIH AKUN INDUK</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipScroll, {marginBottom: 16}]} keyboardShouldPersistTaps="handled">
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
                <Text style={styles.inputLabel}>TIPE AKUN</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipScroll, {marginBottom: 16}]} keyboardShouldPersistTaps="handled">
                  {ACCOUNT_TYPES.map(t => (
                    <TouchableOpacity key={t} style={[styles.chip, newAccType === t && styles.chipActive]} onPress={() => setNewAccType(t as any)}>
                      <Text style={[styles.chipText, newAccType === t && styles.chipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.inputLabel}>NAMA {accFormType === 'main' ? 'AKUN' : 'SUB-AKUN'}</Text>
            <TextInput style={styles.input} placeholder={accFormType === 'main' ? "ex: Bank BCA, Crypto..." : "ex: Dana Liburan..."} placeholderTextColor="#666" value={newAccName} onChangeText={setNewAccName} />

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
              <TouchableOpacity style={[styles.saveButton, {flex: 1, backgroundColor: '#2A2A2A', marginRight: 10}]} onPress={() => setAccModalVisible(false)}>
                <Text style={[styles.saveButtonText, {color: '#FFF'}]}>BATAL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, {flex: 1}]} onPress={saveAccount}>
                <Text style={styles.saveButtonText}>SIMPAN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', paddingHorizontal: 20, paddingTop: 50 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  greeting: { fontSize: 14, color: '#888', fontWeight: '600', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', marginTop: 2 },
  profileBtn: { backgroundColor: '#D4FF00', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // Hero Card
  heroCard: { backgroundColor: '#1A1A1A', borderRadius: 24, padding: 24, marginBottom: 32, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  balanceLabel: { color: '#888', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 8 },
  balanceAmount: { color: '#D4FF00', fontSize: 36, fontWeight: '900', letterSpacing: -1 },

  // Section Headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  addAccBtn: { backgroundColor: '#D4FF00', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addAccText: { fontSize: 11, fontWeight: 'bold', marginLeft: 4, color: '#121212' },

  // Accounts List (Cards)
  accCard: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#2A2A2A', width: 220, marginRight: 12, overflow: 'hidden' },
  accCardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#D4FF00' },
  accHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  accName: { color: '#888', fontWeight: '600', fontSize: 13 },
  accTotalBalance: { color: '#FFF', fontWeight: '900', fontSize: 22, marginBottom: 16 },
  subAccContainer: { borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingTop: 12 },
  subAccRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subAccName: { color: '#888', fontSize: 12 },
  subAccBalance: { color: '#CCC', fontSize: 12, fontWeight: '700' },

  // Transactions List
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  txCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  iconContainer: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  iconIncome: { backgroundColor: 'rgba(74, 222, 128, 0.1)' },
  iconExpense: { backgroundColor: 'rgba(255, 69, 58, 0.1)' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 15, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  txSub: { fontSize: 12, color: '#888' },
  txRight: { alignItems: 'flex-end', justifyContent: 'center' },
  txAmount: { fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  textIncome: { color: '#4ADE80' },
  textExpense: { color: '#FF453A' },
  txActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { paddingHorizontal: 6 },

  // FAB
  floatingButton: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#D4FF00', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#D4FF00', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  floatingButtonText: { color: '#121212', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalOverlayDismissArea: { flex: 1 },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#121212', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '90%', borderWidth: 1, borderColor: '#2A2A2A' },
  modalContentSmall: { backgroundColor: '#1A1A1A', borderRadius: 24, padding: 24, width: '100%', borderWidth: 1, borderColor: '#2A2A2A' },
  
  modalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  closeText: { color: '#D4FF00', fontWeight: 'bold', fontSize: 14 },
  
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  typeBtnExpense: { backgroundColor: '#FF453A' },
  typeBtnIncome: { backgroundColor: '#4ADE80' },
  typeBtnActiveLight: { backgroundColor: 'rgba(212, 255, 0, 0.2)' },
  typeBtnText: { color: '#888', fontSize: 13, fontWeight: 'bold' },
  typeBtnTextActive: { color: '#121212' },

  amountContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  currencySymbol: { fontSize: 28, color: '#D4FF00', fontWeight: 'bold', marginRight: 8, marginTop: 4 },
  inputAmountLarge: { color: '#D4FF00', fontSize: 48, fontWeight: '900', minWidth: 100 },

  inputLabel: { color: '#888', fontSize: 11, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1, marginTop: 16 },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  
  chipScroll: { flexDirection: 'row', flexGrow: 0, marginBottom: 4 },
  chip: { backgroundColor: '#1A1A1A', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  chipActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  chipText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  chipTextActive: { color: '#121212' },

  chipSub: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#333' },
  chipSubActive: { backgroundColor: '#2A2A2A', borderColor: '#D4FF00' },
  chipSubText: { color: '#666', fontSize: 11, fontWeight: 'bold' },
  chipSubTextActive: { color: '#FFF' },

  saveButton: { backgroundColor: '#D4FF00', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 24, shadowColor: '#D4FF00', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  saveButtonText: { color: '#121212', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
});