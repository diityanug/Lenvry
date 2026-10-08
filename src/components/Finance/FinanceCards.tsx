import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Account, Transaction, formatMoney, getAccountIcon, MONTHS, ACCOUNT_TYPE_THEME, TX_TYPE_THEME, getCategoryTheme } from '../../types/finance';
import { financeStyles as styles } from '../../styles/financeStyles';
import { COLORS } from '../../constants/theme';

// Helper: Rich category icon mapping for visually pleasant transactions
const getCategoryIconInfo = (
  category: string,
  type: 'income' | 'expense' | 'transfer'
): { name: any; color: string; bg: string; border: string } => {
  if (type === 'transfer') {
    return { name: 'swap-horizontal', ...TX_TYPE_THEME.transfer };
  }

  if (type === 'income') {
    const icon =
      category === 'Salary'
        ? 'briefcase-outline'
        : category === 'Investments' || category === 'Investment'
        ? 'trending-up-outline'
        : category === 'Bonus' || category === 'Gift'
        ? 'gift-outline'
        : 'arrow-down';
    return { name: icon, ...TX_TYPE_THEME.income };
  }

  const iconMap: Record<string, string> = {
    'Food & Beverages': 'restaurant-outline',
    Snacks: 'cafe-outline',
    Transportation: 'car-outline',
    Fuel: 'car-outline',
    Parking: 'car-outline',
    'Vehicle Services': 'construct-outline',
    Shopping: 'cart-outline',
    'Bills & Utilities': 'receipt-outline',
    'Housing / Rent': 'home-outline',
    'Internet & Phone': 'wifi-outline',
    Insurance: 'shield-checkmark-outline',
    'Fitness & Gym': 'barbell-outline',
    'Cloud & Storage': 'cloud-outline',
    Subscriptions: 'repeat-outline',
    Entertainment: 'game-controller-outline',
    'Health & Medical': 'medkit-outline',
    Education: 'school-outline',
    Travel: 'airplane-outline',
    'Public Services': 'business-outline',
    Personal: 'person-outline',
    'Home Services': 'hammer-outline',
    Furnisings: 'bed-outline',
    Social: 'people-outline',
    Others: 'ellipsis-horizontal',
  };

  return { name: iconMap[category] || 'pricetag-outline', ...getCategoryTheme(category) };
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

  // Fallback title if description is empty or whitespace
  const displayTitle = (item.description || '').trim() || item.category || (isTransfer ? 'Transfer' : 'Transaction');

  const accountPillText = isTransfer
    ? item.accountId === item.toAccountId
      ? `${accName} (${subName || 'Main'} → ${toSubName || 'Main'})`
      : `${accName}${subName ? ` • ${subName}` : ''} → ${toAccName}${toSubName ? ` • ${toSubName}` : ''}`
    : `${accName}${subName ? ` • ${subName}` : ''}`;

  return (
    <TouchableOpacity
      style={styles.txCard}
      activeOpacity={0.75}
      onPress={() => onEdit?.(item)}
      disabled={!onEdit}
    >
      {/* MAIN CONTENT BLOCK: ICON (LEFT) + BALANCED 2-ROW GRID (RIGHT) */}
      <View style={styles.txMainBlock}>
        <View style={[styles.iconContainer, { backgroundColor: iconInfo.bg, borderColor: iconInfo.border }]}>
          <Ionicons name={iconInfo.name} size={18} color={iconInfo.color} />
        </View>

        <View style={styles.txBody}>
          {/* Row 1: Title (Left) + Amount (Right) */}
          <View style={styles.txMainRow}>
            <Text style={styles.txDesc} numberOfLines={1} ellipsizeMode="tail">
              {displayTitle}
            </Text>
            <Text
              style={[
                styles.txAmount,
                item.type === 'income'
                  ? styles.textIncome
                  : isTransfer
                  ? { color: '#818CF8' }
                  : styles.textExpense,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {item.type === 'income' ? '+' : isTransfer ? '' : '-'} {formatMoney(item.amount, accCurrency)}
            </Text>
          </View>

          {/* Row 2: Category Badge (Left) + Date (Right) */}
          <View style={styles.txMetaRow}>
            <View style={styles.txCategoryBadgeWrap}>
              <View
                style={[
                  styles.txCategoryBadge,
                  { backgroundColor: iconInfo.bg, borderColor: iconInfo.border },
                ]}
              >
                <Text
                  style={[styles.txCategoryBadgeText, { color: iconInfo.color }]}
                  numberOfLines={1}
                >
                  {item.category}
                </Text>
              </View>
            </View>

            <Text style={styles.txDateText} numberOfLines={1}>
              {dateFormatted}
            </Text>
          </View>
        </View>
      </View>

      {/* FOOTER ROW: ACCOUNT SOURCE PILL + ACTION BUTTONS */}
      <View style={styles.txBottomRow}>
        <View style={styles.txAccountPill}>
          <Ionicons
            name={item.type === 'income' ? 'arrow-down-circle-outline' : isTransfer ? 'swap-horizontal' : 'wallet-outline'}
            size={12}
            color={isTransfer ? '#818CF8' : item.type === 'income' ? '#10B981' : COLORS.textSecondary}
            style={{ flexShrink: 0 }}
          />
          <Text style={styles.txAccountPillText} numberOfLines={1} ellipsizeMode="tail">
            {accountPillText}
          </Text>
        </View>

        <View style={styles.txActions}>
          <TouchableOpacity
            onPress={() => onClone(item)}
            style={styles.txActionBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="copy-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.txActionBtnText} numberOfLines={1}>Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            style={[styles.txActionBtn, styles.txActionBtnDelete]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={12} color={COLORS.danger} />
            <Text style={[styles.txActionBtnText, { color: COLORS.danger }]} numberOfLines={1}>Delete</Text>
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
  const pockets = item.subAccounts || [];
  const pocketsCount = pockets.length;

  const theme = ACCOUNT_TYPE_THEME[item.type];

  return (
    <TouchableOpacity
      style={[styles.accCard, { borderColor: theme.border }]}
      activeOpacity={0.8}
      onPress={() => onPress(item)}
    >
      {/* Top Accent Strip */}
      <View style={[styles.accTopBar, { backgroundColor: theme.color }]} />

      <View style={styles.accCardBody}>
        {/* TOP ROW: Icon + Name & Type on left, Currency Pill & Chevron on right */}
        <View style={styles.accHeaderRow}>
          <View style={styles.accHeaderLeft}>
            <View style={[styles.accIconBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <FontAwesome5 name={typeIcon} size={15} color={theme.color} />
            </View>
            <View style={styles.accTitleGroup}>
              <Text style={styles.accName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.accMetaRow}>
                <View style={[styles.accTypeBadge, { backgroundColor: theme.bg }]}>
                  <Text style={[styles.accTypeBadgeText, { color: theme.color }]}>
                    {item.type}
                  </Text>
                </View>
                {Boolean(item.description) && (
                  <Text style={styles.accDescText} numberOfLines={1}>
                    • {item.description}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.accHeaderRight}>
            <View style={[styles.accCurrencyPill, isUSD && styles.accCurrencyPillUSD]}>
              <Text style={[styles.accCurrencyPillText, isUSD && { color: '#C084FC' }]}>
                {item.currency}
              </Text>
            </View>
            <View style={styles.accChevronBox}>
              <Ionicons name="chevron-forward" size={13} color={COLORS.textMuted} />
            </View>
          </View>
        </View>

        {/* MIDDLE: Balance Block */}
        <View style={styles.accBalanceRow}>
          <Text style={styles.accBalanceLabel}>TOTAL BALANCE</Text>
          <Text style={styles.accBalanceAmount} numberOfLines={1}>
            {formatMoney(balance, item.currency)}
          </Text>
        </View>

        {/* BOTTOM: Pockets Row */}
        {pocketsCount > 0 ? (
          <View style={styles.accBottomRow}>
            <View style={styles.accPocketBadge}>
              <Ionicons name="folder-outline" size={12} color={theme.color} />
              <Text style={styles.accPocketBadgeText}>
                {pocketsCount} {pocketsCount === 1 ? 'pocket' : 'pockets'}
              </Text>
            </View>

            <ScrollView
              horizontal
              nestedScrollEnabled={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.accPocketsScroll}
            >
              {pockets.slice(0, 3).map((p) => (
                <View key={p.id} style={styles.accPocketMiniTag}>
                  <Text style={styles.accPocketMiniTagText} numberOfLines={1}>
                    {p.name}
                  </Text>
                </View>
              ))}
              {pocketsCount > 3 && (
                <View style={styles.accPocketMiniTagMore}>
                  <Text style={styles.accPocketMiniTagMoreText}>+{pocketsCount - 3}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

// --- ADD ACCOUNT COMPACT BUTTON ---
export const AddAccountCard = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.addAccountDashedCard} activeOpacity={0.75} onPress={onPress}>
    <View style={styles.addAccIconWrap}>
      <Ionicons name="add" size={18} color={COLORS.finance} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.addAccTitle}>Add New Account</Text>
      <Text style={styles.addAccSubtitle}>Bank, e-wallet, cash, or credit</Text>
    </View>
    <Ionicons name="chevron-forward" size={14} color={COLORS.finance} style={{ opacity: 0.6 }} />
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
      {/* 1. Executive Total Net Worth Card (Colorful & Integrated) */}
      <View style={[styles.heroCard, isIDR ? styles.heroCardIDR : styles.heroCardUSD]}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroLabelGroup}>
            <View style={[styles.heroIndicatorDot, { backgroundColor: isIDR ? COLORS.finance : COLORS.success }]} />
            <Text style={styles.balanceLabel}>TOTAL NET WORTH</Text>
          </View>

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
          style={[styles.balanceAmount, isIDR ? styles.balanceAmountIDR : styles.balanceAmountUSD]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >
          {formatMoney(currentTotal, selectedCurrency)}
        </Text>

        {/* Integrated Bottom Stats Row */}
        <View style={styles.heroSubRow}>
          <View style={[styles.heroSubBadge, { backgroundColor: isIDR ? 'rgba(56, 189, 248, 0.16)' : 'rgba(16, 185, 129, 0.16)', borderColor: isIDR ? 'rgba(56, 189, 248, 0.35)' : 'rgba(16, 185, 129, 0.35)' }]}>
            <Ionicons
              name="wallet"
              size={13}
              color={isIDR ? COLORS.finance : COLORS.success}
            />
            <Text style={[styles.heroSubBadgeText, { color: isIDR ? COLORS.finance : COLORS.success }]}>
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