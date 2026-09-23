import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Account, Transaction, formatMoney, getAccountIcon, MONTHS } from '../../types/finance';

// --- TRANSACTION CARD ---
interface TransactionCardProps {
  item: Transaction;
  accounts: Account[];
  onClone: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}
export const TransactionCard = ({ item, accounts, onClone, onDelete }: TransactionCardProps) => {
  const account = accounts.find(a => a.id === item.accountId);
  const accName = account?.name || 'Unknown';
  const accCurrency = account?.currency || 'IDR';
  const subName = account?.subAccounts.find(s => s.id === item.subAccountId)?.name || '';
  const dateStr = new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={styles.txCard}>
      <View style={[styles.iconContainer, item.type === 'income' ? styles.iconIncome : styles.iconExpense]}>
        <Ionicons name={item.type === 'income' ? "arrow-down" : "arrow-up"} size={18} color={item.type === 'income' ? "#D4FF00" : "#FF453A"} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.txSub}>{dateStr} • {item.category} • {accName} {subName ? `(${subName})` : ''}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, item.type === 'income' ? styles.textIncome : styles.textExpense]}>
          {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount, accCurrency)}
        </Text>
        <View style={styles.txActions}>
          <TouchableOpacity onPress={() => onClone(item)} style={styles.actionBtn}>
            <Ionicons name="copy" size={16} color="#A1A1AA" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={16} color="#FF453A" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// --- ACCOUNT CARD ---
interface AccountCardProps {
  item: Account;
  balance: number;
  onPress: (acc: Account) => void;
}
export const AccountCard = ({ item, balance, onPress }: AccountCardProps) => (
  <TouchableOpacity style={styles.accCard} activeOpacity={0.8} onPress={() => onPress(item)}>
    <View style={[styles.accCardAccent, { backgroundColor: item.currency === 'USD' ? '#60A5FA' : '#D4FF00' }]} />
    <View style={styles.accHeaderRow}>
      <Text style={styles.accName}>{item.name}</Text>
      <FontAwesome5 name={getAccountIcon(item.type)} size={14} color={item.currency === 'USD' ? "#60A5FA" : "#D4FF00"} />
    </View>
    <Text style={styles.accTotalBalance}>{formatMoney(balance, item.currency)}</Text>
    <View style={styles.subAccPreview}>
      <Text style={styles.subAccPreviewText}>{item.subAccounts.length} Sub-Akun</Text>
      <Ionicons name="chevron-forward" size={14} color="#A1A1AA" />
    </View>
  </TouchableOpacity>
);

// --- HERO SUMMARY CARD ---
interface HeroSummaryProps {
  totalIDR: number; totalUSD: number;
  month: Date; onPrevMonth: () => void; onNextMonth: () => void;
  incIDR: number; incUSD: number; expIDR: number; expUSD: number;
}
export const HeroSummaryCard = ({ totalIDR, totalUSD, month, onPrevMonth, onNextMonth, incIDR, incUSD, expIDR, expUSD }: HeroSummaryProps) => (
  <View style={styles.heroCard}>
    <Text style={styles.balanceLabel}>TOTAL KEKAYAAN BERSIH</Text>
    <Text style={styles.balanceAmount}>{formatMoney(totalIDR, 'IDR')}</Text>
    {totalUSD !== 0 && <Text style={styles.balanceAmountUSD}>{formatMoney(totalUSD, 'USD')}</Text>}
    
    <View style={styles.heroDivider} />

    <View style={styles.monthSelectorRow}>
      <TouchableOpacity onPress={onPrevMonth} style={styles.monthNavBtn}><Ionicons name="chevron-back" size={20} color="#FAFAFA" /></TouchableOpacity>
      <Text style={styles.monthSelectorText}>{MONTHS[month.getMonth()]} {month.getFullYear()}</Text>
      <TouchableOpacity onPress={onNextMonth} style={styles.monthNavBtn}><Ionicons name="chevron-forward" size={20} color="#FAFAFA" /></TouchableOpacity>
    </View>

    <View style={styles.summaryRow}>
      <View style={styles.summaryBox}>
        <View style={styles.summaryLabelRow}>
          <Ionicons name="arrow-down-circle" size={16} color="#D4FF00" />
          <Text style={styles.summaryLabel}>Pemasukan</Text>
        </View>
        <Text style={styles.summaryIncome}>+{formatMoney(incIDR, 'IDR')}</Text>
        {incUSD > 0 && <Text style={styles.summaryIncomeSub}>+{formatMoney(incUSD, 'USD')}</Text>}
      </View>
      <View style={styles.summaryBox}>
        <View style={styles.summaryLabelRow}>
          <Ionicons name="arrow-up-circle" size={16} color="#FF453A" />
          <Text style={styles.summaryLabel}>Pengeluaran</Text>
        </View>
        <Text style={styles.summaryExpense}>-{formatMoney(expIDR, 'IDR')}</Text>
        {expUSD > 0 && <Text style={styles.summaryExpenseSub}>-{formatMoney(expUSD, 'USD')}</Text>}
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  // Transaction Card
  txCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#18181B' },
  iconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  iconIncome: { backgroundColor: 'rgba(212, 255, 0, 0.1)' },
  iconExpense: { backgroundColor: 'rgba(255, 69, 58, 0.1)' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 15, fontWeight: 'bold', color: '#FAFAFA', marginBottom: 4 },
  txSub: { fontSize: 12, color: '#A1A1AA' },
  txRight: { alignItems: 'flex-end', justifyContent: 'center' },
  txAmount: { fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  textIncome: { color: '#D4FF00' },
  textExpense: { color: '#FF453A' },
  txActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { paddingHorizontal: 6 },
  
  // Account Card
  accCard: { backgroundColor: '#18181B', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#27272A', width: 220, marginRight: 12, overflow: 'hidden' },
  accCardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  accHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  accName: { color: '#A1A1AA', fontWeight: '600', fontSize: 13 },
  accTotalBalance: { color: '#FAFAFA', fontWeight: '900', fontSize: 20, marginBottom: 16 },
  subAccPreview: { borderTopWidth: 1, borderTopColor: '#27272A', paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subAccPreviewText: { color: '#A1A1AA', fontSize: 12, fontWeight: '600' },

  // Hero Card
  heroCard: { backgroundColor: '#18181B', borderRadius: 20, padding: 24, marginBottom: 28, alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  balanceLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 8 },
  balanceAmount: { color: '#D4FF00', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  balanceAmountUSD: { color: '#60A5FA', fontSize: 18, fontWeight: '700', marginTop: 4 },
  heroDivider: { height: 1, backgroundColor: '#27272A', width: '100%', marginVertical: 20 },
  monthSelectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, width: '100%' },
  monthNavBtn: { paddingHorizontal: 12, paddingVertical: 4 },
  monthSelectorText: { color: '#FAFAFA', fontSize: 16, fontWeight: 'bold', width: 140, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  summaryBox: { flex: 1, backgroundColor: '#09090B', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#27272A', marginHorizontal: 4, alignItems: 'center' },
  summaryLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { color: '#A1A1AA', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  summaryIncome: { color: '#D4FF00', fontSize: 15, fontWeight: 'bold' },
  summaryIncomeSub: { color: '#60A5FA', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  summaryExpense: { color: '#FF453A', fontSize: 15, fontWeight: 'bold' },
  summaryExpenseSub: { color: '#60A5FA', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
});