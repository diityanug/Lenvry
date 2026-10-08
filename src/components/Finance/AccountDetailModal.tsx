import React, { useMemo, useState } from 'react';
import {
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
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
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const [prevKey, setPrevKey] = useState<string>('');

  const currentKey = `${account?.id}_${visible}`;
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    setSubFilter('all');
    setVisibleCount(20);
  }

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
        // Transfer: money out of the source, into the destination (nets to 0 when both are in view)
        delta = (dstMatches ? tx.amount : 0) - (srcMatches ? tx.amount : 0);
      }
      rows.push({ tx, delta });
    }
    return rows.sort((a, b) => new Date(b.tx.date).getTime() - new Date(a.tx.date).getTime());
  }, [account, transactions, subFilter]);

  const totalIncome = history.reduce((s, r) => (r.tx.type === 'income' ? s + r.tx.amount : s), 0);
  const totalExpense = history.reduce((s, r) => (r.tx.type === 'expense' ? s + r.tx.amount : s), 0);

  if (!account) return null;

  const accountTheme = ACCOUNT_TYPE_THEME[account.type];

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={modalStyles.content}>
              <View style={modalStyles.handle} />

              {/* Header Modal */}
              <View style={modalStyles.headerRow}>
                <View style={modalStyles.headerTextWrap}>
                  <Text style={modalStyles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                    Account Settings
                  </Text>
                  <Text style={modalStyles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
                    Overview, pockets & history
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
                nestedScrollEnabled={true}
                contentContainerStyle={modalStyles.scrollContent}
              >
                {/* SECTION: MAIN ACCOUNT */}
                <Text style={modalStyles.sectionLabel}>MAIN ACCOUNT</Text>
                <View style={[modalStyles.mainAccountCard, { borderColor: accountTheme.border }]}>
                  <View style={modalStyles.mainCardHeader}>
                    <View style={[modalStyles.mainIconWrap, { backgroundColor: accountTheme.bg, borderColor: accountTheme.border }]}>
                      <FontAwesome5 name={getAccountIcon(account.type)} size={16} color={accountTheme.color} />
                    </View>
                    <View style={modalStyles.mainHeaderTextWrap}>
                      <Text style={modalStyles.mainAccountName} numberOfLines={1} ellipsizeMode="tail">
                        {account.name}
                      </Text>
                      {Boolean(account.description) && (
                        <Text style={modalStyles.mainAccountDesc} numberOfLines={2} ellipsizeMode="tail">
                          {account.description}
                        </Text>
                      )}
                      <View style={modalStyles.mainBadgeRow}>
                        <View
                          style={[
                            modalStyles.mainAccountBadge,
                            { backgroundColor: accountTheme.bg, borderColor: accountTheme.border },
                          ]}
                        >
                          <Text
                            style={[modalStyles.mainAccountBadgeText, { color: accountTheme.color }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {account.type}
                          </Text>
                        </View>
                        <View style={modalStyles.currencyBadge}>
                          <Text style={modalStyles.currencyBadgeText} numberOfLines={1} ellipsizeMode="tail">
                            {account.currency}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={modalStyles.mainBalanceBlock}>
                    <Text style={modalStyles.mainBalanceLabel}>TOTAL BALANCE</Text>
                    <Text
                      style={[modalStyles.mainTotalBalance, { color: accountTheme.color }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                      ellipsizeMode="tail"
                    >
                      {formatMoney(totalBalance, account.currency)}
                    </Text>
                  </View>

                  <View style={modalStyles.mainActionRow}>
                    <TouchableOpacity
                      style={modalStyles.outlineBtn}
                      onPress={() => onRenameAccount(account)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil" size={14} color={COLORS.finance} style={modalStyles.btnIcon} />
                      <Text style={modalStyles.outlineBtnText} numberOfLines={1} ellipsizeMode="tail">
                        Rename Account
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={modalStyles.dangerOutlineBtn}
                      onPress={() => onDeleteAccount(account.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={14} color={COLORS.danger} style={modalStyles.btnIcon} />
                      <Text style={modalStyles.dangerOutlineBtnText} numberOfLines={1} ellipsizeMode="tail">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* SECTION: SUB-ACCOUNTS */}
                <View style={modalStyles.subSectionHeader}>
                  <View style={modalStyles.subSectionTitleWrap}>
                    <Text style={modalStyles.sectionLabel}>SUB-ACCOUNTS ({account.subAccounts.length})</Text>
                    <Text style={modalStyles.subHelperText} numberOfLines={2} ellipsizeMode="tail">
                      Adjust balance or manage sub-wallets
                    </Text>
                  </View>
                  {onAddSubAccount && (
                    <TouchableOpacity
                      style={modalStyles.addPocketHeaderBtn}
                      onPress={onAddSubAccount}
                      activeOpacity={0.8}
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
                      style={[modalStyles.subCard, { borderColor: hexToRgba(accountTheme.color, 0.22) }]}
                    >
                      <View style={modalStyles.subCardTop}>
                        <View style={[modalStyles.subIconWrap, { backgroundColor: accountTheme.bg, borderColor: accountTheme.border }]}>
                          <Ionicons name="wallet-outline" size={15} color={accountTheme.color} />
                        </View>
                        <View style={modalStyles.subCardTextWrap}>
                          <Text style={modalStyles.subAccountName} numberOfLines={1} ellipsizeMode="tail">
                            {sub.name}
                          </Text>
                          <Text style={modalStyles.subCardTypeLabel} numberOfLines={1} ellipsizeMode="tail">
                            Sub-Wallet
                          </Text>
                        </View>
                        <View style={[modalStyles.subBalanceChip, { backgroundColor: accountTheme.bg, borderColor: accountTheme.border }]}>
                          <Text
                            style={[modalStyles.subAccountBalance, { color: accountTheme.color }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                            ellipsizeMode="tail"
                          >
                            {formatMoney(balance, account.currency)}
                          </Text>
                        </View>
                      </View>

                      <View style={modalStyles.subActionRow}>
                        <TouchableOpacity
                          style={modalStyles.adjustBalanceBtn}
                          onPress={() => onEditBalance(account.id, sub.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="calculator-outline"
                            size={15}
                            color="#08090C"
                            style={modalStyles.btnIcon}
                          />
                          <Text style={modalStyles.adjustBalanceText} numberOfLines={1} ellipsizeMode="tail">
                            Adjust Balance
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={modalStyles.subIconActionBtn}
                          onPress={() => onRenameSubAccount(account.id, sub.id, sub.name)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="pencil" size={16} color={COLORS.finance} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={modalStyles.subIconActionBtn}
                          onPress={() => onDeleteSubAccount(account.id, sub.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {/* SECTION: ACCOUNT HISTORY */}
                <View style={modalStyles.subSectionHeader}>
                  <View style={modalStyles.subSectionTitleWrap}>
                    <Text style={modalStyles.sectionLabel}>HISTORY ({history.length})</Text>
                    <Text style={modalStyles.subHelperText} numberOfLines={2} ellipsizeMode="tail">
                      Income & expenses for this account
                    </Text>
                  </View>
                </View>

                <View style={modalStyles.historySummaryRow}>
                  <View
                    style={[
                      modalStyles.historySummaryBox,
                      { borderColor: TX_TYPE_THEME.income.border, backgroundColor: TX_TYPE_THEME.income.bg },
                    ]}
                  >
                    <View style={modalStyles.summaryLabelRow}>
                      <Ionicons name="arrow-down" size={12} color={TX_TYPE_THEME.income.color} />
                      <Text
                        style={[modalStyles.historySummaryLabel, { color: TX_TYPE_THEME.income.color }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        INCOME
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
                  </View>
                  <View
                    style={[
                      modalStyles.historySummaryBox,
                      { borderColor: TX_TYPE_THEME.expense.border, backgroundColor: TX_TYPE_THEME.expense.bg },
                    ]}
                  >
                    <View style={modalStyles.summaryLabelRow}>
                      <Ionicons name="arrow-up" size={12} color={TX_TYPE_THEME.expense.color} />
                      <Text
                        style={[modalStyles.historySummaryLabel, { color: TX_TYPE_THEME.expense.color }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        EXPENSE
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
                  </View>
                </View>

                {account.subAccounts.length > 1 && (
                  <ScrollView
                    horizontal
                    nestedScrollEnabled={true}
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
                          <Text style={modalStyles.historyDesc} numberOfLines={1} ellipsizeMode="tail">
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
                            <Text style={modalStyles.historyMeta} numberOfLines={1} ellipsizeMode="tail">
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
                            {formatMoney(tx.amount, account.currency)}
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
                  >
                    <Text style={modalStyles.historyMoreText} numberOfLines={1} ellipsizeMode="tail">
                      Show more
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={COLORS.finance} />
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 28,
    maxHeight: '90%',
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
  mainAccountCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    gap: 14,
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  mainIconWrap: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainHeaderTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  mainAccountName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  mainAccountDesc: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  mainBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  mainAccountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    maxWidth: 180,
  },
  mainAccountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  currencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: hexToRgba('#FFFFFF', 0.05),
  },
  currencyBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  mainBalanceBlock: {
    backgroundColor: hexToRgba('#FFFFFF', 0.03),
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  mainBalanceLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  mainTotalBalance: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  mainActionRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
  btnIcon: {
    marginRight: 7,
  },
  outlineBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: COLORS.financeLight,
  },
  outlineBtnText: {
    color: COLORS.finance,
    fontSize: 12.5,
    fontWeight: '800',
    flexShrink: 1,
  },
  dangerOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    backgroundColor: COLORS.dangerLight,
  },
  dangerOutlineBtnText: {
    color: COLORS.danger,
    fontSize: 12.5,
    fontWeight: '800',
    flexShrink: 0,
  },
  subCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    gap: 14,
  },
  subCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCardTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  subAccountName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  subCardTypeLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  subBalanceChip: {
    maxWidth: 176,
    flexShrink: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  subAccountBalance: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  subActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adjustBalanceBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.finance,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
  },
  adjustBalanceText: {
    color: '#08090C',
    fontSize: 12.5,
    fontWeight: '800',
    flexShrink: 1,
  },
  subIconActionBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
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
