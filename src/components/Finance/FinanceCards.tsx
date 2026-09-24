import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Account, Transaction, formatMoney, getAccountIcon, MONTHS } from '../../types/finance';
import { financeStyles as styles } from '../../styles/financeStyles';

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
  const dateStr = new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={styles.txCard}>
      <View style={[styles.iconContainer, item.type === 'income' ? styles.iconIncome : styles.iconExpense]}>
        <Ionicons name={item.type === 'income' ? 'arrow-down' : 'arrow-up'} size={18} color={item.type === 'income' ? '#4ADE80' : '#FF453A'} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.txSub}>{dateStr} • {item.category} • {accName}{subName ? ` (${subName})` : ''}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, item.type === 'income' ? styles.textIncome : styles.textExpense]}>
          {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount, accCurrency)}
        </Text>
        <View style={styles.txActions}>
          <TouchableOpacity onPress={() => onClone(item)} style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="copy-outline" size={15} color="#A1A1AA" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={15} color="#FF453A" />
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
    <View style={[styles.accCardAccent, { backgroundColor: item.currency === 'USD' ? '#38BDF8' : '#0284C7' }]} />
    <View style={styles.accHeaderRow}>
      <Text style={styles.accName}>{item.name}</Text>
      <FontAwesome5 name={getAccountIcon(item.type)} size={14} color={item.currency === 'USD' ? '#38BDF8' : '#38BDF8'} />
    </View>
    <Text style={styles.accTotalBalance}>{formatMoney(balance, item.currency)}</Text>
    <View style={styles.subAccPreview}>
      <Text style={styles.subAccPreviewText}>
        {item.subAccounts.length} {item.subAccounts.length === 1 ? 'Sub-Account' : 'Sub-Accounts'}
      </Text>
      <Ionicons name="chevron-forward" size={14} color="#71717A" />
    </View>
  </TouchableOpacity>
);

// --- HERO SUMMARY CARD ---
interface HeroSummaryProps {
  totalIDR: number;
  totalUSD: number;
  month: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  incIDR: number;
  incUSD: number;
  expIDR: number;
  expUSD: number;
}

export const HeroSummaryCard = ({ totalIDR, totalUSD, month, onPrevMonth, onNextMonth, incIDR, incUSD, expIDR, expUSD }: HeroSummaryProps) => {
  const netIDR = incIDR - expIDR;
  const netUSD = incUSD - expUSD;

  return (
    <View style={styles.heroCard}>
      <Text style={styles.balanceLabel}>TOTAL NET WORTH</Text>
      <Text style={styles.balanceAmount}>{formatMoney(totalIDR, 'IDR')}</Text>
      {totalUSD !== 0 && <Text style={styles.balanceAmountUSD}>{formatMoney(totalUSD, 'USD')}</Text>}
      
      <View style={styles.heroDivider} />

      <View style={styles.monthSelectorRow}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={styles.monthSelectorText}>{MONTHS[month.getMonth()]} {month.getFullYear()}</Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color="#FAFAFA" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        {/* Row 1: Income & Expenses */}
        <View style={styles.summaryTwoCol}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="arrow-down-circle" size={14} color="#4ADE80" />
              <Text style={styles.summaryLabel}>Income</Text>
            </View>
            <Text style={styles.summaryIncome}>+{formatMoney(incIDR, 'IDR')}</Text>
            {incUSD > 0 && <Text style={styles.summaryIncomeSub}>+{formatMoney(incUSD, 'USD')}</Text>}
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="arrow-up-circle" size={14} color="#FF453A" />
              <Text style={styles.summaryLabel}>Expenses</Text>
            </View>
            <Text style={styles.summaryExpense}>-{formatMoney(expIDR, 'IDR')}</Text>
            {expUSD > 0 && <Text style={styles.summaryExpenseSub}>-{formatMoney(expUSD, 'USD')}</Text>}
          </View>
        </View>

        {/* Row 2: Net Month Cash Flow */}
        <View style={styles.balanceBoxFull}>
          <View style={styles.summaryLabelRow}>
            <Ionicons 
              name={netIDR >= 0 ? "wallet-outline" : "alert-circle-outline"} 
              size={14} 
              color={netIDR >= 0 ? "#4ADE80" : "#FF453A"} 
            />
            <Text style={styles.summaryLabel}>Net Cash Flow</Text>
          </View>
          <View style={styles.balanceValueRow}>
            <Text style={netIDR >= 0 ? styles.summaryIncomeLarge : styles.summaryExpenseLarge}>
              {netIDR >= 0 ? '+' : '-'}{formatMoney(Math.abs(netIDR), 'IDR')}
            </Text>
            {(incUSD > 0 || expUSD > 0) && (
              <Text style={[styles.summaryIncomeSub, { marginLeft: 8, color: netUSD >= 0 ? '#38BDF8' : '#FF453A' }]}>
                ({netUSD >= 0 ? '+' : '-'}{formatMoney(Math.abs(netUSD), 'USD')})
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};