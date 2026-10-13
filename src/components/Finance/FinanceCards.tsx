import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Account, Transaction, formatMoney, getAccountIcon, MONTHS, ACCOUNT_TYPE_THEME, TX_TYPE_THEME, getCategoryTheme } from '../../types/finance';
import { financeStyles as styles } from '../../styles/financeStyles';
import { COLORS } from '../../constants/theme';

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

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;

  if (d.getFullYear() === now.getFullYear()) {
    return `${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}, ${timeStr}`;
  }

  return `${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}, ${timeStr}`;
};

interface CalmTxTheme {
  accent: string;
  cardBg: string;
  borderColor: string;
  pillBg: string;
  pillBorder: string;
}

const CATEGORY_CALM_THEMES: Record<string, CalmTxTheme> = {
  // Food & Beverages - Calm Warm Amber
  'Food & Beverages': {
    accent: '#FBBF24',
    cardBg: '#141622',
    borderColor: 'rgba(251, 191, 36, 0.20)',
    pillBg: 'rgba(251, 191, 36, 0.12)',
    pillBorder: 'rgba(251, 191, 36, 0.28)',
  },
  Snacks: {
    accent: '#FB923C',
    cardBg: '#141622',
    borderColor: 'rgba(251, 146, 60, 0.20)',
    pillBg: 'rgba(251, 146, 60, 0.12)',
    pillBorder: 'rgba(251, 146, 60, 0.28)',
  },
  // Transportation - Calm Mustard Gold
  Transportation: {
    accent: '#FACC15',
    cardBg: '#141622',
    borderColor: 'rgba(250, 204, 21, 0.18)',
    pillBg: 'rgba(250, 204, 21, 0.12)',
    pillBorder: 'rgba(250, 204, 21, 0.25)',
  },
  Fuel: {
    accent: '#FB923C',
    cardBg: '#141622',
    borderColor: 'rgba(251, 146, 60, 0.18)',
    pillBg: 'rgba(251, 146, 60, 0.12)',
    pillBorder: 'rgba(251, 146, 60, 0.25)',
  },
  'Vehicle Services': {
    accent: '#F97316',
    cardBg: '#141622',
    borderColor: 'rgba(249, 115, 22, 0.18)',
    pillBg: 'rgba(249, 115, 22, 0.12)',
    pillBorder: 'rgba(249, 115, 22, 0.25)',
  },
  Parking: {
    accent: '#94A3B8',
    cardBg: '#13151F',
    borderColor: 'rgba(148, 163, 184, 0.18)',
    pillBg: 'rgba(148, 163, 184, 0.10)',
    pillBorder: 'rgba(148, 163, 184, 0.22)',
  },
  // Shopping & Lifestyle - Calm Dusty Rose
  Shopping: {
    accent: '#FB7185',
    cardBg: '#141522',
    borderColor: 'rgba(251, 113, 133, 0.20)',
    pillBg: 'rgba(251, 113, 133, 0.12)',
    pillBorder: 'rgba(251, 113, 133, 0.28)',
  },
  Personal: {
    accent: '#F472B6',
    cardBg: '#141522',
    borderColor: 'rgba(244, 114, 182, 0.20)',
    pillBg: 'rgba(244, 114, 182, 0.12)',
    pillBorder: 'rgba(244, 114, 182, 0.26)',
  },
  Social: {
    accent: '#FDA4AF',
    cardBg: '#141522',
    borderColor: 'rgba(253, 164, 175, 0.18)',
    pillBg: 'rgba(253, 164, 175, 0.12)',
    pillBorder: 'rgba(253, 164, 175, 0.26)',
  },
  // Bills & Utilities - Soft Lavender
  'Bills & Utilities': {
    accent: '#A78BFA',
    cardBg: '#141424',
    borderColor: 'rgba(167, 139, 250, 0.20)',
    pillBg: 'rgba(167, 139, 250, 0.12)',
    pillBorder: 'rgba(167, 139, 250, 0.28)',
  },
  'Housing / Rent': {
    accent: '#C084FC',
    cardBg: '#141424',
    borderColor: 'rgba(192, 132, 252, 0.20)',
    pillBg: 'rgba(192, 132, 252, 0.12)',
    pillBorder: 'rgba(192, 132, 252, 0.28)',
  },
  'Internet & Phone': {
    accent: '#38BDF8',
    cardBg: '#121624',
    borderColor: 'rgba(56, 189, 248, 0.20)',
    pillBg: 'rgba(56, 189, 248, 0.12)',
    pillBorder: 'rgba(56, 189, 248, 0.28)',
  },
  'Cloud & Storage': {
    accent: '#818CF8',
    cardBg: '#131524',
    borderColor: 'rgba(129, 140, 248, 0.20)',
    pillBg: 'rgba(129, 140, 248, 0.12)',
    pillBorder: 'rgba(129, 140, 248, 0.28)',
  },
  Subscriptions: {
    accent: '#A855F7',
    cardBg: '#141424',
    borderColor: 'rgba(168, 85, 247, 0.20)',
    pillBg: 'rgba(168, 85, 247, 0.12)',
    pillBorder: 'rgba(168, 85, 247, 0.28)',
  },
  // Entertainment - Calm Cyan
  Entertainment: {
    accent: '#22D3EE',
    cardBg: '#121623',
    borderColor: 'rgba(34, 211, 238, 0.20)',
    pillBg: 'rgba(34, 211, 238, 0.12)',
    pillBorder: 'rgba(34, 211, 238, 0.28)',
  },
  // Health & Gym - Mint & Coral
  'Fitness & Gym': {
    accent: '#34D399',
    cardBg: '#121720',
    borderColor: 'rgba(52, 211, 153, 0.20)',
    pillBg: 'rgba(52, 211, 153, 0.12)',
    pillBorder: 'rgba(52, 211, 153, 0.28)',
  },
  'Health & Medical': {
    accent: '#FB7185',
    cardBg: '#141522',
    borderColor: 'rgba(251, 113, 133, 0.20)',
    pillBg: 'rgba(251, 113, 133, 0.12)',
    pillBorder: 'rgba(251, 113, 133, 0.28)',
  },
  Insurance: {
    accent: '#2DD4BF',
    cardBg: '#121722',
    borderColor: 'rgba(45, 212, 191, 0.20)',
    pillBg: 'rgba(45, 212, 191, 0.12)',
    pillBorder: 'rgba(45, 212, 191, 0.28)',
  },
  // Education & Travel - Blue & Cyan
  Education: {
    accent: '#60A5FA',
    cardBg: '#121624',
    borderColor: 'rgba(96, 165, 250, 0.20)',
    pillBg: 'rgba(96, 165, 250, 0.12)',
    pillBorder: 'rgba(96, 165, 250, 0.28)',
  },
  Travel: {
    accent: '#38BDF8',
    cardBg: '#121624',
    borderColor: 'rgba(56, 189, 248, 0.20)',
    pillBg: 'rgba(56, 189, 248, 0.12)',
    pillBorder: 'rgba(56, 189, 248, 0.28)',
  },
  // Income categories - Soothing Sage Mint
  Salary: {
    accent: '#34D399',
    cardBg: '#121720',
    borderColor: 'rgba(52, 211, 153, 0.22)',
    pillBg: 'rgba(52, 211, 153, 0.12)',
    pillBorder: 'rgba(52, 211, 153, 0.28)',
  },
  Allowance: {
    accent: '#10B981',
    cardBg: '#121720',
    borderColor: 'rgba(16, 185, 129, 0.22)',
    pillBg: 'rgba(16, 185, 129, 0.12)',
    pillBorder: 'rgba(16, 185, 129, 0.28)',
  },
  Bonus: {
    accent: '#FACC15',
    cardBg: '#141620',
    borderColor: 'rgba(250, 204, 21, 0.22)',
    pillBg: 'rgba(250, 204, 21, 0.12)',
    pillBorder: 'rgba(250, 204, 21, 0.28)',
  },
  Investments: {
    accent: '#34D399',
    cardBg: '#121720',
    borderColor: 'rgba(52, 211, 153, 0.22)',
    pillBg: 'rgba(52, 211, 153, 0.12)',
    pillBorder: 'rgba(52, 211, 153, 0.28)',
  },
  Investment: {
    accent: '#34D399',
    cardBg: '#121720',
    borderColor: 'rgba(52, 211, 153, 0.22)',
    pillBg: 'rgba(52, 211, 153, 0.12)',
    pillBorder: 'rgba(52, 211, 153, 0.28)',
  },
  Gift: {
    accent: '#F472B6',
    cardBg: '#141522',
    borderColor: 'rgba(244, 114, 182, 0.20)',
    pillBg: 'rgba(244, 114, 182, 0.12)',
    pillBorder: 'rgba(244, 114, 182, 0.28)',
  },
  Interest: {
    accent: '#2DD4BF',
    cardBg: '#121722',
    borderColor: 'rgba(45, 212, 191, 0.20)',
    pillBg: 'rgba(45, 212, 191, 0.12)',
    pillBorder: 'rgba(45, 212, 191, 0.28)',
  },
  // Transfers - Calm Periwinkle
  Transfer: {
    accent: '#818CF8',
    cardBg: '#131524',
    borderColor: 'rgba(129, 140, 248, 0.22)',
    pillBg: 'rgba(129, 140, 248, 0.12)',
    pillBorder: 'rgba(129, 140, 248, 0.28)',
  },
};

const DEFAULT_CALM_FALLBACKS: Record<'expense' | 'income' | 'transfer', CalmTxTheme> = {
  expense: {
    accent: '#FB7185',
    cardBg: '#141522',
    borderColor: 'rgba(251, 113, 133, 0.20)',
    pillBg: 'rgba(251, 113, 133, 0.12)',
    pillBorder: 'rgba(251, 113, 133, 0.28)',
  },
  income: {
    accent: '#34D399',
    cardBg: '#121720',
    borderColor: 'rgba(52, 211, 153, 0.22)',
    pillBg: 'rgba(52, 211, 153, 0.12)',
    pillBorder: 'rgba(52, 211, 153, 0.28)',
  },
  transfer: {
    accent: '#818CF8',
    cardBg: '#131524',
    borderColor: 'rgba(129, 140, 248, 0.22)',
    pillBg: 'rgba(129, 140, 248, 0.12)',
    pillBorder: 'rgba(129, 140, 248, 0.28)',
  },
};

function getCalmTxTheme(category: string, type: 'income' | 'expense' | 'transfer'): CalmTxTheme {
  if (type === 'transfer') return CATEGORY_CALM_THEMES.Transfer;
  if (CATEGORY_CALM_THEMES[category]) return CATEGORY_CALM_THEMES[category];
  return DEFAULT_CALM_FALLBACKS[type];
}

// TRANSACTION CARD
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
  const theme = getCalmTxTheme(item.category, item.type);

  // Fallback title if description is empty or whitespace
  const displayTitle = (item.description || '').trim() || item.category || (isTransfer ? 'Transfer' : 'Transaction');

  const isCrossCurrencyTransfer =
    isTransfer &&
    Boolean(
      account &&
      toAccount &&
      accCurrency !== toAccount.currency &&
      typeof item.toAmount === 'number' &&
      item.toAmount > 0
    );

  const accountPillText = isTransfer
    ? item.accountId === item.toAccountId
      ? `${accName} (${subName || 'Main'} → ${toSubName || 'Main'})`
      : `${accName}${subName ? ` • ${subName}` : ''} → ${toAccName}${toSubName ? ` • ${toSubName}` : ''}`
    : `${accName}${subName ? ` • ${subName}` : ''}`;

  const amountColor =
    item.type === 'income'
      ? '#34D399'
      : isTransfer
      ? '#818CF8'
      : '#FB7185';

  return (
    <TouchableOpacity
      style={[styles.txCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
      activeOpacity={0.85}
      onPress={() => onEdit?.(item)}
      disabled={!onEdit}
    >
      {/* Background Signature Watermark Icon */}
      <View style={styles.watermarkTile} pointerEvents="none">
        <Ionicons
          name={iconInfo.name}
          size={56}
          color={theme.accent}
          style={styles.watermarkIcon}
        />
      </View>

      {/* 1. TOP HEADER ROW: Category Eyebrow Badge & Date Badge */}
      <View style={styles.txTopRow}>
        <View style={[styles.txCategoryPill, { backgroundColor: theme.pillBg, borderColor: theme.pillBorder }]}>
          <Ionicons name={iconInfo.name} size={12} color={theme.accent} />
          <Text style={[styles.txCategoryPillText, { color: theme.accent }]}>
            {item.category}
          </Text>
        </View>

        <View style={styles.txDateBadge}>
          <Text style={styles.txDateText}>
            {dateFormatted}
          </Text>
        </View>
      </View>

      {/* 2. MIDDLE BLOCK: Title & Amount */}
      <View style={styles.txMiddleBlock}>
        <View style={styles.txMainRow}>
          <Text style={styles.txDesc} numberOfLines={2}>
            {displayTitle}
          </Text>

          <View style={styles.txAmountCol}>
            {isCrossCurrencyTransfer && toAccount ? (
              <View style={styles.txCrossAmountWrap}>
                <Text style={[styles.txAmount, { color: '#FB7185' }]}>
                  - {formatMoney(item.amount, accCurrency)}
                </Text>
                <View style={styles.txReceivedBadge}>
                  <Ionicons name="arrow-down" size={10} color="#38BDF8" />
                  <Text style={styles.txReceivedAmountText}>
                    + {formatMoney(item.toAmount!, toAccount.currency)}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.txAmount, { color: amountColor }]}>
                {item.type === 'income' ? '+' : isTransfer ? '' : '-'} {formatMoney(item.amount, accCurrency)}
              </Text>
            )}
          </View>
        </View>

        {/* Optional Kurs Banner (Cross-Currency Transfers) */}
        {isCrossCurrencyTransfer && item.exchangeRate ? (
          <View style={styles.txExchangeRateBanner}>
            <Ionicons name="swap-horizontal" size={12} color="#38BDF8" />
            <Text style={styles.txExchangeRateText}>
              Kurs: 1 USD ≈ Rp {Math.round(item.exchangeRate).toLocaleString('id-ID')}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 3. BOTTOM ROW: ROUTE / ACCOUNT SOURCE & ACTIONS */}
      <View style={styles.txBottomRow}>
        {isTransfer ? (
          <View style={styles.txRouteBox}>
            <View style={styles.txRouteItem}>
              <View style={[styles.txRouteIconWrap, { backgroundColor: 'rgba(251, 113, 133, 0.12)' }]}>
                <Ionicons name="arrow-up" size={10} color="#FB7185" />
              </View>
              <Text style={styles.txRouteText}>
                {accName}{subName ? ` (${subName})` : ''}
              </Text>
            </View>

            <Ionicons name="arrow-forward" size={11} color={COLORS.textMuted} style={styles.txRouteArrow} />

            <View style={styles.txRouteItem}>
              <View style={[styles.txRouteIconWrap, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
                <Ionicons name="arrow-down" size={10} color="#34D399" />
              </View>
              <Text style={styles.txRouteText}>
                {toAccName}{toSubName ? ` (${toSubName})` : ''}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.txAccountPill}>
            <Ionicons
              name={item.type === 'income' ? 'arrow-down-circle-outline' : 'wallet-outline'}
              size={12}
              color={theme.accent}
            />
            <Text style={styles.txAccountPillText} numberOfLines={1}>
              {accountPillText}
            </Text>
          </View>
        )}

        <View style={styles.txActions}>
          <TouchableOpacity
            onPress={() => onClone(item)}
            style={styles.txActionIconBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Ionicons name="copy-outline" size={14} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            style={[styles.txActionIconBtn, styles.txActionIconBtnDelete]}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={14} color="#FB7185" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ACCOUNT CARD
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

        {/* Balance Block */}
        <View style={styles.accBalanceRow}>
          <Text style={styles.accBalanceLabel}>TOTAL BALANCE</Text>
          <Text style={styles.accBalanceAmount} numberOfLines={1}>
            {formatMoney(balance, item.currency)}
          </Text>
        </View>

        {/* Pockets Row */}
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

// ADD ACCOUNT
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

// HERO SUMMARY & CASHFLOW CARD
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
  const [isNetWorthHidden, setIsNetWorthHidden] = useState<boolean>(false);

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
      {/* Executive Total Net Worth Card */}
      <View style={[styles.heroCard, isIDR ? styles.heroCardIDR : styles.heroCardUSD]}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroLabelGroup}>
            <View style={[styles.heroIndicatorDot, { backgroundColor: isIDR ? COLORS.finance : COLORS.success }]} />
            <Text style={styles.balanceLabel}>TOTAL NET WORTH</Text>
            <TouchableOpacity
              onPress={() => setIsNetWorthHidden((prev) => !prev)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: 6, padding: 2 }}
            >
              <Ionicons
                name={isNetWorthHidden ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
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
          {isNetWorthHidden
            ? isIDR
              ? 'Rp ••••••••'
              : '$ ••••••••'
            : formatMoney(currentTotal, selectedCurrency)}
        </Text>

        {/* Bottom Stats Row */}
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

      {/* Month Navigator Bar */}
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

      {/* Monthly Cash Flow Bento Grid */}
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