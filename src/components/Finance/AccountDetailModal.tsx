import React, { useMemo, useState } from 'react';
import {
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import {
  Account,
  Transaction,
  formatMoney,
  getAccountIcon,
  ACCOUNT_TYPE_THEME,
  TX_TYPE_THEME,
  getCategoryTheme,
  hexToRgba,
} from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';

const formatTxShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

interface AccountDetailModalProps {
  visible: boolean;
  account: Account | null;
  totalBalance: number;
  getSubBalance: (accId: string, subId: string) => number;
  onClose: () => void;
  onRenameAccount: (acc: Account) => void;
  onDeleteAccount: (id: string) => void;
  onEditBalance: (accId: string, subId: string) => void;
  onRenameSubAccount: (accId: string, subId: string, currentName: string) => void;
  onDeleteSubAccount: (accId: string, subId: string) => void;
  onAddSubAccount?: () => void;
  transactions?: Transaction[];
  accounts?: Account[];
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onCloneTransaction?: (tx: Transaction) => void;
}

export const AccountDetailModal = ({
  visible,
  account,
  totalBalance,
  getSubBalance,
  onClose,
  onRenameAccount,
  onDeleteAccount,
  onEditBalance,
  onRenameSubAccount,
  onDeleteSubAccount,
  onAddSubAccount,
  transactions = [],
  accounts = [],
  onEditTransaction,
  onDeleteTransaction,
  onCloneTransaction,
}: AccountDetailModalProps) => {
  const [subFilter, setSubFilter] = useState<string>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const [prevKey, setPrevKey] = useState<string>('');

  const currentKey = `${account?.id}_${visible}`;
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    setSubFilter('all');
    setHistoryTypeFilter('all');
    setVisibleCount(20);
  }

  const isInvestment = account?.type === 'Investment';

  // Total income & expense across all transactions for this account
  const { totalIncome, totalExpense } = useMemo(() => {
    if (!account) return { totalIncome: 0, totalExpense: 0 };
    let inc = 0;
    let exp = 0;
    for (const tx of transactions) {
      const isSource = tx.accountId === account.id;
      const isDest = tx.type === 'transfer' && tx.toAccountId === account.id;
      if (!isSource && !isDest) continue;

      const srcMatches = isSource && (subFilter === 'all' || tx.subAccountId === subFilter);
      const dstMatches = isDest && (subFilter === 'all' || tx.toSubAccountId === subFilter);
      if (!srcMatches && !dstMatches) continue;

      if (tx.type === 'income') {
        inc += tx.amount;
      } else if (tx.type === 'expense') {
        exp += tx.amount;
      } else if (tx.type === 'transfer') {
        const received = typeof tx.toAmount === 'number' && tx.toAmount > 0 ? tx.toAmount : tx.amount;
        if (dstMatches && !srcMatches) {
          inc += received;
        } else if (srcMatches && !dstMatches) {
          exp += tx.amount;
        }
      }
    }
    return { totalIncome: inc, totalExpense: exp };
  }, [account, transactions, subFilter]);

  const history = useMemo(() => {
    if (!account) return [];
    const rows: { tx: Transaction; delta: number }[] = [];
    for (const tx of transactions) {
      const isSource = tx.accountId === account.id;
      const isDest = tx.type === 'transfer' && tx.toAccountId === account.id;
      if (!isSource && !isDest) continue;

      const srcMatches = isSource && (subFilter === 'all' || tx.subAccountId === subFilter);
      const dstMatches = isDest && (subFilter === 'all' || tx.toSubAccountId === subFilter);
      if (!srcMatches && !dstMatches) continue;

      let delta = 0;
      if (tx.type === 'income') delta = tx.amount;
      else if (tx.type === 'expense') delta = -tx.amount;
      else {
        // Transfer: money out of the source, into the destination
        const received = typeof tx.toAmount === 'number' && tx.toAmount > 0 ? tx.toAmount : tx.amount;
        delta = (dstMatches ? received : 0) - (srcMatches ? tx.amount : 0);
      }

      if (historyTypeFilter === 'income' && delta <= 0) {
        continue;
      }
      if (historyTypeFilter === 'expense' && delta >= 0) {
        continue;
      }

      rows.push({ tx, delta });
    }
    return rows.sort((a, b) => new Date(b.tx.date).getTime() - new Date(a.tx.date).getTime());
  }, [account, transactions, subFilter, historyTypeFilter]);

  if (!account) return null;

  const accountTheme = ACCOUNT_TYPE_THEME[account.type];
  const theme = accountTheme;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <Pressable style={modalStyles.dismissArea} onPress={onClose} />

        <View style={modalStyles.content}>
          <View style={modalStyles.handle} />

          {/* Header Modal */}
          <View style={modalStyles.headerRow}>
            <View style={modalStyles.headerTextWrap}>
              <Text style={modalStyles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                Account Settings
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={modalStyles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            nestedScrollEnabled={true}
            contentContainerStyle={modalStyles.scrollContent}
          >
                {/* REDESIGNED ACCOUNT HERO CARD */}
                <View style={[modalStyles.accountHeroCard, { borderColor: theme.border }]}>
                  {/* Top Bar: Icon, Name & Action Buttons */}
                  <View style={modalStyles.accountHeroHeaderRow}>
                    <View style={modalStyles.accountHeroHeaderLeft}>
                      <View style={[modalStyles.accountHeroIcon, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <FontAwesome5 name={getAccountIcon(account.type)} size={16} color={theme.color} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={modalStyles.accountHeroName} numberOfLines={1}>
                          {account.name}
                        </Text>
                        <Text style={modalStyles.accountHeroSubTitle}>
                          Account Details
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons: Rename & Delete */}
                    <View style={modalStyles.accountHeroActions}>
                      <TouchableOpacity
                        style={modalStyles.heroActionBtn}
                        onPress={() => onRenameAccount(account)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil-outline" size={14} color={COLORS.textPrimary} />
                        <Text style={modalStyles.heroActionBtnText}>Rename</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[modalStyles.heroActionBtn, modalStyles.heroActionBtnDanger]}
                        onPress={() => onDeleteAccount(account.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Primary Balance Display (Clean, cohesive text) */}
                  <View style={modalStyles.accountHeroBalanceSection}>
                    <Text style={modalStyles.accountHeroBalanceLabel}>TOTAL BALANCE</Text>
                    <Text style={modalStyles.accountHeroBalanceVal} numberOfLines={1}>
                      {formatMoney(totalBalance, account.currency)}
                    </Text>
                  </View>

                  {/* Meta Specs Grid: Category & Currency Tags */}
                  <View style={modalStyles.accountHeroSpecsRow}>
                    {/* Category Spec */}
                    <View style={modalStyles.specItem}>
                      <Text style={modalStyles.specLabel}>CATEGORY</Text>
                      <View style={[modalStyles.specBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <Text style={[modalStyles.specBadgeText, { color: theme.color }]}>
                          {account.type}
                        </Text>
                      </View>
                    </View>

                    {/* Currency Spec */}
                    <View style={modalStyles.specItem}>
                      <Text style={modalStyles.specLabel}>CURRENCY</Text>
                      <View style={modalStyles.specCurrencyBadge}>
                        <Ionicons name="cash-outline" size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={modalStyles.specCurrencyText}>
                          {account.currency}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Account Description (Clear & readable box if present) */}
                  {Boolean(account.description && account.description.trim()) && (
                    <View style={modalStyles.accountDescBox}>
                      <View style={modalStyles.descHeaderRow}>
                        <Ionicons name="information-circle-outline" size={13} color={COLORS.textMuted} />
                        <Text style={modalStyles.descLabel}>NOTE / DESCRIPTION</Text>
                      </View>
                      <Text style={modalStyles.accountDescContent}>
                        {account.description}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Pocket */}
                <View style={modalStyles.subSectionHeader}>
                  <View style={modalStyles.subSectionTitleWrap}>
                    <Text style={modalStyles.sectionLabel}>POCKETS ({account.subAccounts.length})</Text>
                  </View>
                  {onAddSubAccount && (
                    <TouchableOpacity
                      style={modalStyles.addPocketHeaderBtn}
                      onPress={onAddSubAccount}
                      activeOpacity={0.8}
                      delayPressIn={60}
                    >
                      <Ionicons name="add" size={15} color="#08090C" />
                      <Text style={modalStyles.addPocketHeaderBtnText} numberOfLines={1} ellipsizeMode="tail">
                        Add Pocket
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {account.subAccounts.map((sub) => {
                  const balance = getSubBalance(account.id, sub.id);
                  return (
                    <View
                      key={sub.id}
                      style={modalStyles.subCard}
                    >
                      <View style={modalStyles.subCardLeft}>
                        <View style={[modalStyles.subIconWrap, { backgroundColor: accountTheme.bg, borderColor: accountTheme.border }]}>
                          <Ionicons name="folder-outline" size={15} color={accountTheme.color} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={modalStyles.subAccountName} numberOfLines={1}>
                            {sub.name}
                          </Text>
                          <Text style={modalStyles.subAccountBalance}>
                            {formatMoney(balance, account.currency)}
                          </Text>
                        </View>
                      </View>

                      {/* Clean Action Icons */}
                      <View style={modalStyles.subActionButtonsRow}>
                        <TouchableOpacity
                          style={modalStyles.subActionBtn}
                          onPress={() => onEditBalance(account.id, sub.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="calculator-outline" size={15} color={COLORS.finance} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={modalStyles.subActionBtn}
                          onPress={() => onRenameSubAccount(account.id, sub.id, sub.name)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="pencil-outline" size={14} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[modalStyles.subActionBtn, modalStyles.subActionBtnDelete]}
                          onPress={() => onDeleteSubAccount(account.id, sub.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {/* ACCOUNT HISTORY */}
                <View style={modalStyles.subSectionHeader}>
                  <View style={modalStyles.subSectionTitleWrap}>
                    <Text style={modalStyles.sectionLabel}>
                      {isInvestment ? 'INVESTMENT HISTORY' : 'HISTORY'} ({history.length})
                    </Text>
                  </View>
                </View>

                <View style={modalStyles.historySummaryRow}>
                  <TouchableOpacity
                    style={[
                      modalStyles.historySummaryBox,
                      { borderColor: TX_TYPE_THEME.income.border, backgroundColor: TX_TYPE_THEME.income.bg },
                      historyTypeFilter === 'income' && { borderWidth: 2, borderColor: TX_TYPE_THEME.income.color },
                    ]}
                    onPress={() => setHistoryTypeFilter((prev) => (prev === 'income' ? 'all' : 'income'))}
                    activeOpacity={0.7}
                  >
                    <View style={modalStyles.summaryLabelRow}>
                      <Ionicons name="arrow-down" size={12} color={TX_TYPE_THEME.income.color} />
                      <Text
                        style={[modalStyles.historySummaryLabel, { color: TX_TYPE_THEME.income.color }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {isInvestment ? 'GAIN' : 'INCOME'}
                      </Text>
                    </View>
                    <Text
                      style={[modalStyles.historySummaryValue, { color: TX_TYPE_THEME.income.color }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                      ellipsizeMode="tail"
                    >
                      {formatMoney(totalIncome, account.currency)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      modalStyles.historySummaryBox,
                      { borderColor: TX_TYPE_THEME.expense.border, backgroundColor: TX_TYPE_THEME.expense.bg },
                      historyTypeFilter === 'expense' && { borderWidth: 2, borderColor: TX_TYPE_THEME.expense.color },
                    ]}
                    onPress={() => setHistoryTypeFilter((prev) => (prev === 'expense' ? 'all' : 'expense'))}
                    activeOpacity={0.7}
                  >
                    <View style={modalStyles.summaryLabelRow}>
                      <Ionicons name="arrow-up" size={12} color={TX_TYPE_THEME.expense.color} />
                      <Text
                        style={[modalStyles.historySummaryLabel, { color: TX_TYPE_THEME.expense.color }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {isInvestment ? 'OUTFLOW' : 'EXPENSE'}
                      </Text>
                    </View>
                    <Text
                      style={[modalStyles.historySummaryValue, { color: TX_TYPE_THEME.expense.color }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                      ellipsizeMode="tail"
                    >
                      {formatMoney(totalExpense, account.currency)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {account.subAccounts.length > 1 && (
                  <ScrollView
                    horizontal
                    nestedScrollEnabled={true}
                    directionalLockEnabled={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={modalStyles.historyChipRow}
                  >
                    {[{ id: 'all', name: 'All' }, ...account.subAccounts].map((s) => {
                      const active = subFilter === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            modalStyles.historyChip,
                            active && {
                              backgroundColor: accountTheme.bg,
                              borderColor: accountTheme.border,
                            },
                          ]}
                          onPress={() => {
                            setSubFilter(s.id);
                            setVisibleCount(20);
                          }}
                          activeOpacity={0.7}
                          delayPressIn={60}
                        >
                          <Text
                            style={[
                              modalStyles.historyChipText,
                              active && { color: accountTheme.color, fontWeight: '800' },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {s.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {history.length === 0 ? (
                  <View style={modalStyles.historyEmptyWrap}>
                    <Ionicons name="receipt-outline" size={26} color={COLORS.textMuted} />
                    <Text style={modalStyles.historyEmpty} numberOfLines={2}>
                      No transactions for this account yet.
                    </Text>
                  </View>
                ) : (
                  history.slice(0, visibleCount).map(({ tx, delta }) => {
                    const isTransfer = tx.type === 'transfer';
                    const theme = isTransfer
                      ? TX_TYPE_THEME.transfer
                      : delta >= 0
                        ? TX_TYPE_THEME.income
                        : TX_TYPE_THEME.expense;
                    const color = isTransfer && delta === 0 ? TX_TYPE_THEME.transfer.color : theme.color;
                    const catTheme = getCategoryTheme(tx.category);
                    const srcSub = account.subAccounts.find((s) => s.id === tx.subAccountId)?.name;
                    const dstAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : undefined;
                    const dstSub = dstAcc?.subAccounts.find((s) => s.id === tx.toSubAccountId)?.name;
                    const meta = isTransfer
                      ? `Transfer • ${srcSub || 'Main'} → ${dstAcc && dstAcc.id !== account.id ? `${dstAcc.name} • ` : ''}${dstSub || 'Main'}`
                      : `${tx.category}${srcSub ? ` • ${srcSub}` : ''}`;
                    return (
                      <TouchableOpacity
                        key={tx.id}
                        style={[modalStyles.historyRow, { borderLeftColor: theme.color }]}
                        onPress={() => onEditTransaction?.(tx)}
                        activeOpacity={0.7}
                        delayPressIn={60}
                      >
                        <View
                          style={[
                            modalStyles.historyIcon,
                            { backgroundColor: theme.bg, borderColor: theme.border },
                          ]}
                        >
                          <Ionicons
                            name={isTransfer ? 'swap-horizontal' : tx.type === 'income' ? 'arrow-down' : 'arrow-up'}
                            size={16}
                            color={theme.color}
                          />
                        </View>
                        <View style={modalStyles.historyTextWrap}>
                          <Text style={modalStyles.historyDesc} numberOfLines={2}>
                            {(tx.description || '').trim() || tx.category || 'Transaction'}
                          </Text>
                          <View style={modalStyles.historyMetaRow}>
                            {!isTransfer && (
                              <View
                                style={[
                                  modalStyles.categoryDot,
                                  { backgroundColor: catTheme.color, borderColor: catTheme.border },
                                ]}
                              >
                                <View
                                  style={[modalStyles.categoryDotInner, { backgroundColor: catTheme.color }]}
                                />
                              </View>
                            )}
                            <Text style={modalStyles.historyMeta} numberOfLines={2}>
                              {formatTxShortDate(tx.date)} • {meta}
                            </Text>
                          </View>
                        </View>
                        <View style={modalStyles.historyAmountWrap}>
                          <Text
                            style={[modalStyles.historyAmount, { color }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                            ellipsizeMode="tail"
                          >
                            {delta > 0 ? '+' : delta < 0 ? '-' : ''}
                            {formatMoney(Math.abs(delta), account.currency)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}

                {history.length > visibleCount && (
                  <TouchableOpacity
                    style={modalStyles.historyMoreBtn}
                    onPress={() => setVisibleCount((c) => c + 20)}
                    activeOpacity={0.7}
                    delayPressIn={60}
                  >
                    <Text style={modalStyles.historyMoreText} numberOfLines={1} ellipsizeMode="tail">
                      Show more
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={COLORS.finance} />
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
        </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 28,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 28,
    paddingTop: 8,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  subSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  subSectionTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  addPocketHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.finance,
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  addPocketHeaderBtnText: {
    color: '#08090C',
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 0,
  },
  subHelperText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 0,
  },
  // Redesigned Account Hero Card
  accountHeroCard: {
    backgroundColor: '#11141D',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 20,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  accountHeroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  accountHeroHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  accountHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountHeroName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  accountHeroSubTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  accountHeroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroActionBtnDanger: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
    paddingHorizontal: 9,
  },
  heroActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Balance Section
  accountHeroBalanceSection: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  accountHeroBalanceLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  accountHeroBalanceVal: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },

  // Specs Row: Category & Currency
  accountHeroSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  specItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 6,
  },
  specLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  specBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  specBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  specCurrencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
  },
  specCurrencyText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },

  // Description / Note Box
  accountDescBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 6,
  },
  descHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  descLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  accountDescContent: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Pocket
  subCard: {
    backgroundColor: '#121520',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  subCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  subIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subAccountName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  subAccountBalance: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  subActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  subActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subActionBtnDelete: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  historySummaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  historySummaryBox: {
    flex: 1,
    minWidth: 0,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  historySummaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  historySummaryValue: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  historyChipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
    paddingRight: 8,
  },
  historyChip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCardSub,
    maxWidth: 200,
  },
  historyChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: COLORS.border,
    borderLeftColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: hexToRgba('#FFFFFF', 0.02),
    gap: 12,
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  historyDesc: {
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDotInner: {
    width: 4,
    height: 4,
    borderRadius: RADIUS.full,
  },
  historyMeta: {
    flex: 1,
    minWidth: 0,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  historyAmountWrap: {
    maxWidth: 140,
    minWidth: 0,
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  historyEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  historyEmpty: {
    color: COLORS.textMuted,
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  historyMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    gap: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCardSub,
    marginTop: 4,
  },
  historyMoreText: {
    color: COLORS.finance,
    fontSize: 12.5,
    fontWeight: '800',
  },
});
