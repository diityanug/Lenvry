import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  const account = accounts.find((a) => a.id === item.accountId);
  const accName = account?.name || 'Unknown';
  const accCurrency = account?.currency || 'IDR';
  const subName = account?.subAccounts.find((s) => s.id === item.subAccountId)?.name || '';
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
      <FontAwesome5 name={getAccountIcon(item.type)} size={14} color="#38BDF8" />
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
  onOpenCalendar?: () => void;
  incIDR: number;
  incUSD: number;
  expIDR: number;
  expUSD: number;
}

export const HeroSummaryCard = ({
  totalIDR,
  totalUSD,
  month,
  onPrevMonth,
  onNextMonth,
  onOpenCalendar,
  incIDR,
  incUSD,
  expIDR,
  expUSD,
}: HeroSummaryProps) => {
  const [selectedCurrency, setSelectedCurrency] = useState<'IDR' | 'USD'>('IDR');

  const isIDR = selectedCurrency === 'IDR';
  const currentTotal = isIDR ? totalIDR : totalUSD;
  const currentIncome = isIDR ? incIDR : incUSD;
  const currentExpense = isIDR ? expIDR : expUSD;
  const currentNet = currentIncome - currentExpense;

  return (
    <View style={styles.heroCard}>
      {/* Top Header: Label & Currency Switcher */}
      <View style={heroStyles.topRow}>
        <Text style={styles.balanceLabel}>TOTAL NET WORTH</Text>

        <View style={heroStyles.currencyToggle}>
          <TouchableOpacity
            style={[heroStyles.toggleBtn, isIDR && heroStyles.toggleBtnActive]}
            onPress={() => setSelectedCurrency('IDR')}
            activeOpacity={0.7}
          >
            <Text style={[heroStyles.toggleBtnText, isIDR && heroStyles.toggleBtnTextActive]}>IDR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[heroStyles.toggleBtn, !isIDR && heroStyles.toggleBtnActive]}
            onPress={() => setSelectedCurrency('USD')}
            activeOpacity={0.7}
          >
            <Text style={[heroStyles.toggleBtnText, !isIDR && heroStyles.toggleBtnTextActive]}>USD</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Balance Display */}
      <Text style={styles.balanceAmount}>{formatMoney(currentTotal, selectedCurrency)}</Text>

      <View style={styles.heroDivider} />

      {/* Month Navigation */}
      <View style={styles.monthSelectorRow}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#FAFAFA" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenCalendar}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8 }}
        >
          <Ionicons name="calendar-outline" size={16} color="#38BDF8" style={{ marginRight: 6 }} />
          <Text style={styles.monthSelectorText}>
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNextMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color="#FAFAFA" />
        </TouchableOpacity>
      </View>

      {/* Summary Metrics */}
      <View style={styles.summaryContainer}>
        {/* Income & Expense */}
        <View style={styles.summaryTwoCol}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="arrow-down-circle" size={14} color="#4ADE80" />
              <Text style={styles.summaryLabel}>Income ({selectedCurrency})</Text>
            </View>
            <Text style={styles.summaryIncome}>+{formatMoney(currentIncome, selectedCurrency)}</Text>
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="arrow-up-circle" size={14} color="#FF453A" />
              <Text style={styles.summaryLabel}>Expenses ({selectedCurrency})</Text>
            </View>
            <Text style={styles.summaryExpense}>-{formatMoney(currentExpense, selectedCurrency)}</Text>
          </View>
        </View>

        {/* Net Cash Flow */}
        <View style={styles.balanceBoxFull}>
          <View style={styles.summaryLabelRow}>
            <Ionicons
              name={currentNet >= 0 ? 'wallet-outline' : 'alert-circle-outline'}
              size={14}
              color={currentNet >= 0 ? '#4ADE80' : '#FF453A'}
            />
            <Text style={styles.summaryLabel}>Net Cash Flow ({selectedCurrency})</Text>
          </View>
          <Text style={currentNet >= 0 ? styles.summaryIncomeLarge : styles.summaryExpenseLarge}>
            {currentNet >= 0 ? '+' : '-'}{formatMoney(Math.abs(currentNet), selectedCurrency)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const heroStyles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  currencyToggle: {
    flexDirection: 'row',
    backgroundColor: '#09090B',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#38BDF8',
  },
  toggleBtnText: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#09090B',
    fontWeight: '800',
  },
});