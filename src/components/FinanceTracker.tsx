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
      <View style={styles.accHeaderRow}>
        <View style={styles.accIconName}>
          <FontAwesome5 name={item.type === 'Bank' ? 'university' : item.type === 'Dompet' ? 'wallet' : 'chart-line'} size={14} color="#D4FF00" />
          <Text style={styles.accName}>{item.name}</Text>
        </View>
        <Text style={styles.accTotalBalance}>{formatRupiah(getAccBalance(item.id))}</Text>
      </View>
      
      {item.subAccounts.map(sub => (
        <View key={sub.id} style={styles.subAccRow}>
          <Text style={styles.subAccName}>└ {sub.name}</Text>
          <Text style={styles.subAccBalance}>{formatRupiah(getSubBalance(item.id, sub.id))}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Finance</Text>
        <TouchableOpacity style={styles.addAccBtn} onPress={() => setAccModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={16} color="#121212" />
          <Text style={styles.addAccText}>AKUN / DOMPET</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceWrapper}>
        <Text style={styles.balanceLabel}>TOTAL KEKAYAAN BERSIH</Text>
        <Text style={styles.balanceAmount}>{formatRupiah(totalBalance)}</Text>
      </View>

      <View style={{ height: 130, marginBottom: 16 }}>
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderAccountItem}
          contentContainerStyle={{ paddingRight: 20 }}
        />
      </View>

      <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
      
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Belum ada transaksi tercatat.</Text>}
        renderItem={({ item }) => {
          const accName = accounts.find(a => a.id === item.accountId)?.name || 'Unknown';
          const subName = accounts.find(a => a.id === item.accountId)?.subAccounts.find(s => s.id === item.subAccountId)?.name || '';
          return (
            <View style={styles.txCard}>
              <View style={[styles.iconContainer, item.type === 'income' ? styles.iconIncome : styles.iconExpense]}>
                <Ionicons name={item.type === 'income' ? "arrow-down" : "arrow-up"} size={20} color={item.type === 'income' ? "#4ADE80" : "#FF453A"} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{item.description}</Text>
                <Text style={styles.txSub}>
                  {item.category} • {item.date}
                </Text>
                <Text style={styles.txAccLabel}>{accName} ({subName})</Text>
              </View>
              
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, item.type === 'income' ? styles.textIncome : styles.textExpense]}>
                  {item.type === 'income' ? '+' : '-'} {formatRupiah(item.amount)}
                </Text>
                
                <View style={styles.txActions}>
                  <TouchableOpacity onPress={() => cloneTransaction(item)} style={styles.actionBtn}>
                    <Ionicons name="copy-outline" size={16} color="#60A5FA" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteTransaction(item.id)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={16} color="#FF453A" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )
        }}
      />

      <TouchableOpacity style={styles.floatingButton} onPress={openNewTransaction} activeOpacity={0.9}>
        <FontAwesome5 name="plus" size={16} color="#121212" style={{ marginRight: 8 }} />
        <Text style={styles.floatingButtonText}>CATAT TRANSAKSI</Text>
      </TouchableOpacity>

      {/* ================= MODAL ADD/CLONE TRANSACTION ================= */}
      <Modal animationType="slide" transparent={true} visible={txModalVisible} onRequestClose={() => setTxModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlayDismissArea} />
          </TouchableWithoutFeedback>

          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catat Transaksi</Text>
              <TouchableOpacity onPress={() => setTxModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#666" />
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

            <TextInput style={styles.inputAmount} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <TextInput style={styles.input} placeholder="Keterangan (ex: Makan Siang)" placeholderTextColor="#666" value={description} onChangeText={setDescription} />

            <Text style={styles.inputLabel}>KATEGORI</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} keyboardShouldPersistTaps="handled">
              {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                <TouchableOpacity key={cat} style={[styles.chip, selectedCategory === cat && styles.chipActive]} onPress={() => setSelectedCategory(cat)}>
                  <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>SUMBER DANA (AKUN)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} keyboardShouldPersistTaps="handled">
              {accounts.map(acc => (
                <TouchableOpacity key={acc.id} style={[styles.chip, selectedAccId === acc.id && styles.chipActive]} onPress={() => { setSelectedAccId(acc.id); setSelectedSubAccId(''); }}>
                  <Text style={[styles.chipText, selectedAccId === acc.id && styles.chipTextActive]}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedAccId ? (
              <>
                <Text style={styles.inputLabel}>SUB-AKUN</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} keyboardShouldPersistTaps="handled">
                  {accounts.find(a => a.id === selectedAccId)?.subAccounts.map(sub => (
                    <TouchableOpacity key={sub.id} style={[styles.chip, selectedSubAccId === sub.id && styles.chipActive]} onPress={() => setSelectedSubAccId(sub.id)}>
                      <Text style={[styles.chipText, selectedSubAccId === sub.id && styles.chipTextActive]}>{sub.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <TouchableOpacity style={styles.saveButton} onPress={saveTransaction}>
              <Text style={styles.saveButtonText}>SIMPAN TRANSAKSI</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL ADD ACCOUNT ================= */}
      <Modal animationType="fade" transparent={true} visible={accModalVisible} onRequestClose={() => setAccModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlayCenter}
        >
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
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#D4FF00' },
  addAccBtn: { backgroundColor: '#D4FF00', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addAccText: { fontSize: 10, fontWeight: 'bold', marginLeft: 4, color: '#121212' },
  
  balanceWrapper: { alignItems: 'center', marginBottom: 20 },
  balanceLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  balanceAmount: { color: '#FFF', fontSize: 34, fontWeight: '900' },

  accCard: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#2A2A2A', width: 220, marginRight: 12 },
  accHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2A2A2A', paddingBottom: 10, marginBottom: 10 },
  accIconName: { flexDirection: 'row', alignItems: 'center' },
  accName: { color: '#FFF', fontWeight: 'bold', marginLeft: 8, fontSize: 15 },
  accTotalBalance: { color: '#D4FF00', fontWeight: 'bold', fontSize: 13 },
  subAccRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  subAccName: { color: '#888', fontSize: 12 },
  subAccBalance: { color: '#CCC', fontSize: 12, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  
  txCard: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  iconIncome: { backgroundColor: 'rgba(74, 222, 128, 0.1)' },
  iconExpense: { backgroundColor: 'rgba(255, 69, 58, 0.1)' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 2 },
  txSub: { fontSize: 11, color: '#A1A1AA', marginBottom: 2 },
  txAccLabel: { fontSize: 10, color: '#D4FF00', fontWeight: '600' },
  
  txRight: { alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' },
  txAmount: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  textIncome: { color: '#4ADE80' },
  textExpense: { color: '#FF453A' },
  txActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 4, marginLeft: 10 },

  floatingButton: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#D4FF00', paddingVertical: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  floatingButtonText: { color: '#121212', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalOverlayDismissArea: { flex: 1 },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  modalContentSmall: { backgroundColor: '#1E1E1E', borderRadius: 24, padding: 24, width: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, backgroundColor: '#121212', borderRadius: 12, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  typeBtnExpense: { backgroundColor: 'rgba(255, 69, 58, 0.2)' },
  typeBtnIncome: { backgroundColor: 'rgba(74, 222, 128, 0.2)' },
  typeBtnActiveLight: { backgroundColor: 'rgba(212, 255, 0, 0.2)' },
  typeBtnText: { color: '#666', fontSize: 13, fontWeight: 'bold' },
  typeBtnTextActive: { color: '#FFF' },

  inputLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: 'bold', marginBottom: 6, letterSpacing: 1, marginTop: 10 },
  input: { backgroundColor: '#121212', color: '#FFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  inputAmount: { backgroundColor: '#121212', color: '#D4FF00', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, marginBottom: 12, fontSize: 24, fontWeight: 'bold', textAlign: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  
  chipScroll: { flexDirection: 'row', flexGrow: 0, marginBottom: 4 },
  chip: { backgroundColor: '#121212', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  chipActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  chipText: { color: '#A1A1AA', fontSize: 12, fontWeight: 'bold' },
  chipTextActive: { color: '#121212' },

  saveButton: { backgroundColor: '#D4FF00', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 16 },
  saveButtonText: { color: '#121212', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
});