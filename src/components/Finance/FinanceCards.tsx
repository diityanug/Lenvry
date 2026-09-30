import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Account, Transaction, formatMoney, getAccountIcon, MONTHS } from '../../types/finance';
import { financeStyles as styles } from '../../styles/financeStyles';
import { COLORS } from '../../constants/theme';

// Helper: Rich category icon mapping for visually pleasant transactions
const getCategoryIconInfo = (
  category: string,
  type: 'income' | 'expense' | 'transfer'
): { name: any; color: string; bg: string } => {
  if (type === 'transfer') {
    return { name: 'swap-horizontal', color: COLORS.accentUSD, bg: 'rgba(56, 189, 248, 0.12)' };
  }

  if (type === 'income') {
    switch (category) {
      case 'Salary':
        return { name: 'briefcase-outline', color: COLORS.success, bg: COLORS.successLight };
      case 'Investment':
        return { name: 'trending-up-outline', color: COLORS.success, bg: COLORS.successLight };
      case 'Bonus':
      case 'Gift':
        return { name: 'gift-outline', color: COLORS.success, bg: COLORS.successLight };
      default:
        return { name: 'arrow-down', color: COLORS.success, bg: COLORS.successLight };
    }
  }

  switch (category) {
    case 'Food & Beverages':
      return { name: 'restaurant-outline', color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' };
    case 'Snacks':
      return { name: 'cafe-outline', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
    case 'Transportation':
      return { name: 'car-outline', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)' };
    case 'Shopping':
      return { name: 'cart-outline', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' };
    case 'Bills & Utilities':
      return { name: 'receipt-outline', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
    case 'Entertainment':
      return { name: 'game-controller-outline', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)' };
    case 'Health & Medical':
      return { name: 'medkit-outline', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
    case 'Education':
      return { name: 'school-outline', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' };
    default:
      return { name: 'arrow-up', color: COLORS.danger, bg: COLORS.dangerLight };
  }
};

// Helper: Human-friendly date formatting
const formatTxDate = (dateIso: string): string => {
  const d = new Date(dateIso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

// --- TRANSACTION CARD ---
interface TransactionCardProps {
  item: Transaction;
  accounts: Account[];
  onClone: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onEdit?: (tx: Transaction) => void;
}

export const TransactionCard = ({ item, accounts, onClone, onDelete, onEdit }: TransactionCardProps) => {
  const account = accounts.find((a) => a.id === item.accountId);
  const toAccount = item.toAccountId ? accounts.find((a) => a.id === item.toAccountId) : null;
  const accName = account?.name || 'Unknown';
  const toAccName = toAccount?.name || 'Account';
  const accCurrency = account?.currency || 'IDR';
  const subName = account?.subAccounts.find((s) => s.id === item.subAccountId)?.name || '';
  const toSubName = toAccount?.subAccounts.find((s) => s.id === item.toSubAccountId)?.name || '';
  const dateFormatted = formatTxDate(item.date);
  const iconInfo = getCategoryIconInfo(item.category, item.type);
  const isTransfer = item.type === 'transfer';

  return (
    <TouchableOpacity
      style={styles.txCard}
      activeOpacity={0.7}
      onPress={() => onEdit?.(item)}
      disabled={!onEdit}
    >
      {/* PRIMARY ROW: CATEGORY ICON + DETAILS + AMOUNT */}
      <View style={styles.txTopRow}>
        <View style={[styles.iconContainer, { backgroundColor: iconInfo.bg }]}>
          <Ionicons name={iconInfo.name} size={20} color={iconInfo.color} />
        </View>

        <View style={styles.txMainInfo}>
          <Text style={styles.txDesc} numberOfLines={1}>
            {item.description}
          </Text>
          <View style={styles.txCategoryRow}>
            <View style={styles.txCategoryBadge}>
              <Text style={styles.txCategoryBadgeText}>{item.category}</Text>
            </View>
            <Text style={styles.txDateText}>{dateFormatted}</Text>
          </View>
        </View>

        <View style={styles.txAmountWrap}>
          <Text
            style={[
              styles.txAmount,
              item.type === 'income'
                ? styles.textIncome
                : isTransfer
                ? { color: COLORS.accentUSD }
                : styles.textExpense,
            ]}
          >
            {item.type === 'income' ? '+' : isTransfer ? '' : '-'} {formatMoney(item.amount, accCurrency)}
          </Text>
        </View>
      </View>

      {/* FOOTER ROW: ACCOUNT SOURCE PILL + ACTION BUTTONS */}
      <View style={styles.txBottomRow}>
        <View style={styles.txAccountPill}>
          <Ionicons
            name={item.type === 'income' ? 'arrow-down-circle-outline' : isTransfer ? 'swap-horizontal' : 'wallet-outline'}
            size={13}
            color={COLORS.textSecondary}
          />
          <Text style={styles.txAccountPillText} numberOfLines={1}>
            {isTransfer
              ? item.accountId === item.toAccountId
                ? `${accName} (${subName || 'Main'} → ${toSubName || 'Main'})`
                : `${accName}${subName ? ` • ${subName}` : ''} → ${toAccName}${toSubName ? ` • ${toSubName}` : ''}`
              : `${accName}${subName ? ` • ${subName}` : ''}`}
          </Text>
        </View>

        <View style={styles.txActions}>

          <TouchableOpacity
            onPress={() => onClone(item)}
            style={styles.txActionBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="copy-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.txActionBtnText}>Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            style={[styles.txActionBtn, styles.txActionBtnDelete]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={13} color={COLORS.danger} />
            <Text style={[styles.txActionBtnText, { color: COLORS.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- ACCOUNT CARD ---
interface AccountCardProps {
  item: Account;
  balance: number;
  onPress: (acc: Account) => void;
}

export const AccountCard = ({ item, balance, onPress }: AccountCardProps) => {
  const isUSD = item.currency === 'USD';
  const typeIcon = getAccountIcon(item.type);

  return (
    <TouchableOpacity style={styles.accCard} activeOpacity={0.8} onPress={() => onPress(item)}>
      <View
        style={[
          styles.accCardAccent,
          { backgroundColor: isUSD ? COLORS.finance : COLORS.accent },
        ]}
      />

      <View style={styles.accHeaderRow}>
        <View style={styles.accTypeWrap}>
          <View
            style={[
              styles.accIconBox,
              { backgroundColor: isUSD ? 'rgba(56, 189, 248, 0.14)' : 'rgba(245, 158, 11, 0.14)' },
            ]}
          >
            <FontAwesome5
              name={typeIcon}
              size={12}
              color={isUSD ? COLORS.finance : COLORS.accent}
            />
          </View>
          <Text style={styles.accTypeText}>{item.type}</Text>
        </View>

        <View style={styles.currencyBadge}>
          <Text style={styles.currencyBadgeText}>{item.currency}</Text>
        </View>
      </View>

      <Text style={styles.accName} numberOfLines={1}>
        {item.name}
      </Text>
      {Boolean(item.description) && (
        <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: -2, marginBottom: 4 }} numberOfLines={1}>
          {item.description}
        </Text>
      )}
      <Text style={styles.accTotalBalance}>{formatMoney(balance, item.currency)}</Text>

      <View style={styles.subAccPreview}>
        <Text style={styles.subAccPreviewText}>
          {item.subAccounts.length} {item.subAccounts.length === 1 ? 'Sub-Account' : 'Sub-Accounts'}
        </Text>
        <Ionicons name="chevron-forward" size={13} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

// --- ADD ACCOUNT GHOST CARD ---
export const AddAccountCard = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.addAccCard} activeOpacity={0.75} onPress={onPress}>
    <View style={styles.addAccCardIconWrap}>
      <Ionicons name="add" size={24} color={COLORS.finance} />
    </View>
    <Text style={styles.addAccCardTitle}>Add Account</Text>
  </TouchableOpacity>
);

// --- HERO SUMMARY & CASHFLOW CARD ---
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
  accountsCount?: number;
  activeCurrency?: 'IDR' | 'USD';
  onCurrencyChange?: (c: 'IDR' | 'USD') => void;
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
  accountsCount = 0,
  activeCurrency,
  onCurrencyChange,
}: HeroSummaryProps) => {
  const [internalCurrency, setInternalCurrency] = useState<'IDR' | 'USD'>('IDR');

  const selectedCurrency = activeCurrency !== undefined ? activeCurrency : internalCurrency;
  const setCurrency = (c: 'IDR' | 'USD') => {
    if (onCurrencyChange) {
      onCurrencyChange(c);
    } else {
      setInternalCurrency(c);
    }
  };

  const isIDR = selectedCurrency === 'IDR';
  const currentTotal = isIDR ? totalIDR : totalUSD;
  const currentIncome = isIDR ? incIDR : incUSD;
  const currentExpense = isIDR ? expIDR : expUSD;
  const currentNet = currentIncome - currentExpense;

  const today = new Date();
  const isCurrentMonth =
    month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();

  return (
    <View>
      {/* 1. Executive Total Net Worth Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.balanceLabel}>TOTAL NET WORTH</Text>

          <View style={styles.currencyToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, isIDR && styles.toggleBtnActive]}
              onPress={() => setCurrency('IDR')}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleBtnText, isIDR && styles.toggleBtnTextActive]}>IDR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isIDR && styles.toggleBtnActive]}
              onPress={() => setCurrency('USD')}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleBtnText, !isIDR && styles.toggleBtnTextActive]}>USD</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text
          style={styles.balanceAmount}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >
          {formatMoney(currentTotal, selectedCurrency)}
        </Text>

        <View style={styles.heroSubRow}>
          <View style={styles.heroSubBadge}>
            <Text style={styles.heroSubBadgeText}>
              {accountsCount} {accountsCount === 1 ? 'Account' : 'Accounts'} Active
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Month Navigator Bar */}
      <View style={styles.monthNavRow}>
        <TouchableOpacity
          onPress={onPrevMonth}
          style={styles.monthNavBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={17} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenCalendar}
          activeOpacity={0.7}
          style={styles.monthCenterTouch}
        >
          <Ionicons name="calendar-outline" size={15} color={COLORS.finance} />
          <Text style={styles.monthNavText} numberOfLines={1}>
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </Text>
          {isCurrentMonth && (
            <View style={styles.currentMonthBadge}>
              <Text style={styles.currentMonthBadgeText}>THIS MONTH</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNextMonth}
          style={styles.monthNavBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-forward" size={17} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* 3. Monthly Cash Flow Bento Grid */}
      <View style={styles.cashflowSection}>
        <View style={styles.cashflowRow}>
          {/* Income Card */}
          <View style={styles.cashflowCard}>
            <View style={styles.cashflowCardHeader}>
              <View style={[styles.cashflowIconWrap, { backgroundColor: COLORS.successLight }]}>
                <Ionicons name="arrow-down" size={13} color={COLORS.success} />
              </View>
              <Text style={styles.cashflowLabel} numberOfLines={1}>Income ({selectedCurrency})</Text>
            </View>
            <Text
              style={[styles.cashflowValue, { color: COLORS.success }]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.75}
            >
              +{formatMoney(currentIncome, selectedCurrency)}
            </Text>
          </View>

          {/* Expense Card */}
          <View style={styles.cashflowCard}>
            <View style={styles.cashflowCardHeader}>
              <View style={[styles.cashflowIconWrap, { backgroundColor: COLORS.dangerLight }]}>
                <Ionicons name="arrow-up" size={13} color={COLORS.danger} />
              </View>
              <Text style={styles.cashflowLabel} numberOfLines={1}>Expense ({selectedCurrency})</Text>
            </View>
            <Text
              style={[styles.cashflowValue, { color: COLORS.danger }]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.75}
            >
              -{formatMoney(currentExpense, selectedCurrency)}
            </Text>
          </View>
        </View>

        {/* Net Flow Card */}
        <View style={styles.netFlowCard}>
          <View style={styles.netFlowLeft}>
            <Text style={styles.netFlowLabel} numberOfLines={1}>Net Cash Flow ({selectedCurrency})</Text>
            <Text
              style={[
                styles.netFlowValue,
                { color: currentNet >= 0 ? COLORS.success : COLORS.danger },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.75}
            >
              {currentNet >= 0 ? '+' : '-'}
              {formatMoney(Math.abs(currentNet), selectedCurrency)}
            </Text>
          </View>

          <View
            style={[
              styles.netFlowBadge,
              {
                backgroundColor: currentNet >= 0 ? COLORS.successLight : COLORS.dangerLight,
                borderColor: currentNet >= 0 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)',
              },
            ]}
          >
            <Text
              style={[
                styles.netFlowBadgeText,
                { color: currentNet >= 0 ? COLORS.success : COLORS.danger },
              ]}
            >
              {currentNet >= 0 ? 'SURPLUS' : 'DEFICIT'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};