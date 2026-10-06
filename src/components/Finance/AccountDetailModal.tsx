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
import { Ionicons } from '@expo/vector-icons';
import { Account, Transaction, formatMoney } from '../../types/finance';
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

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={modalStyles.content}>
              <View style={modalStyles.handle} />

              {/* Header Modal */}
              <View style={modalStyles.headerRow}>
                <Text style={modalStyles.headerTitle}>Account Settings</Text>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                {/* SECTION: MAIN ACCOUNT */}
                <Text style={modalStyles.sectionLabel}>MAIN ACCOUNT</Text>
                <View style={modalStyles.mainAccountCard}>
                  <View style={modalStyles.mainCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={modalStyles.mainAccountName}>{account.name}</Text>
                      {Boolean(account.description) && (
                        <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2, marginBottom: 2 }}>
                          {account.description}
                        </Text>
                      )}
                      <Text style={modalStyles.mainAccountBadge}>
                        {account.type} • {account.currency}
                      </Text>
                    </View>
                    <Text style={modalStyles.mainTotalBalance}>
                      {formatMoney(totalBalance, account.currency)}
                    </Text>
                  </View>

                  <View style={modalStyles.mainActionRow}>
                    <TouchableOpacity
                      style={modalStyles.outlineBtn}
                      onPress={() => onRenameAccount(account)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil" size={14} color={COLORS.finance} style={{ marginRight: 6 }} />
                      <Text style={modalStyles.outlineBtnText}>Rename Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={modalStyles.dangerOutlineBtn}
                      onPress={() => onDeleteAccount(account.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={14} color={COLORS.danger} style={{ marginRight: 6 }} />
                      <Text style={modalStyles.dangerOutlineBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* SECTION: SUB-ACCOUNTS */}
                <View style={modalStyles.subSectionHeader}>
                  <Text style={modalStyles.sectionLabel}>SUB-ACCOUNTS ({account.subAccounts.length})</Text>
                  <Text style={modalStyles.subHelperText}>Adjust balance or manage sub-wallets</Text>
                </View>

                {account.subAccounts.map((sub) => {
                  const balance = getSubBalance(account.id, sub.id);
                  return (
                    <View key={sub.id} style={modalStyles.subCard}>
                      <View style={modalStyles.subCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={modalStyles.subAccountName}>{sub.name}</Text>
                          <Text style={modalStyles.subCardTypeLabel}>Sub-Wallet</Text>
                        </View>
                        <Text style={modalStyles.subAccountBalance}>
                          {formatMoney(balance, account.currency)}
                        </Text>
                      </View>

                      <View style={modalStyles.subActionRow}>
                        <TouchableOpacity
                          style={modalStyles.adjustBalanceBtn}
                          onPress={() => onEditBalance(account.id, sub.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="calculator-outline" size={14} color="#08090C" style={{ marginRight: 6 }} />
                          <Text style={modalStyles.adjustBalanceText}>Adjust Balance</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={modalStyles.subIconActionBtn}
                          onPress={() => onRenameSubAccount(account.id, sub.id, sub.name)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="pencil" size={15} color={COLORS.finance} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={modalStyles.subIconActionBtn}
                          onPress={() => onDeleteSubAccount(account.id, sub.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {/* SECTION: ACCOUNT HISTORY */}
                <View style={modalStyles.subSectionHeader}>
                  <Text style={modalStyles.sectionLabel}>HISTORY ({history.length})</Text>
                  <Text style={modalStyles.subHelperText}>Income & expenses for this account</Text>
                </View>

                <View style={modalStyles.historySummaryRow}>
                  <View style={modalStyles.historySummaryBox}>
                    <Text style={modalStyles.historySummaryLabel}>INCOME</Text>
                    <Text style={[modalStyles.historySummaryValue, { color: COLORS.success }]} numberOfLines={1}>
                      {formatMoney(totalIncome, account.currency)}
                    </Text>
                  </View>
                  <View style={modalStyles.historySummaryBox}>
                    <Text style={modalStyles.historySummaryLabel}>EXPENSE</Text>
                    <Text style={[modalStyles.historySummaryValue, { color: COLORS.danger }]} numberOfLines={1}>
                      {formatMoney(totalExpense, account.currency)}
                    </Text>
                  </View>
                </View>

                {account.subAccounts.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={modalStyles.historyChipRow}
                  >
                    {[{ id: 'all', name: 'All' }, ...account.subAccounts].map((s) => {
                      const active = subFilter === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[modalStyles.historyChip, active && modalStyles.historyChipActive]}
                          onPress={() => {
                            setSubFilter(s.id);
                            setVisibleCount(20);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[modalStyles.historyChipText, active && modalStyles.historyChipTextActive]}>
                            {s.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {history.length === 0 ? (
                  <Text style={modalStyles.historyEmpty}>No transactions for this account yet.</Text>
                ) : (
                  history.slice(0, visibleCount).map(({ tx, delta }) => {
                    const isTransfer = tx.type === 'transfer';
                    const color = isTransfer && delta === 0 ? COLORS.accentUSD : delta >= 0 ? COLORS.success : COLORS.danger;
                    const srcSub = account.subAccounts.find((s) => s.id === tx.subAccountId)?.name;
                    const dstAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : undefined;
                    const dstSub = dstAcc?.subAccounts.find((s) => s.id === tx.toSubAccountId)?.name;
                    const meta = isTransfer
                      ? `Transfer • ${srcSub || 'Main'} → ${dstAcc && dstAcc.id !== account.id ? `${dstAcc.name} • ` : ''}${dstSub || 'Main'}`
                      : `${tx.category}${srcSub ? ` • ${srcSub}` : ''}`;
                    return (
                      <TouchableOpacity
                        key={tx.id}
                        style={modalStyles.historyRow}
                        onPress={() => onEditTransaction?.(tx)}
                        activeOpacity={0.7}
                      >
                        <View style={[modalStyles.historyIcon, { backgroundColor: `${color}22` }]}>
                          <Ionicons
                            name={isTransfer ? 'swap-horizontal' : tx.type === 'income' ? 'arrow-down' : 'arrow-up'}
                            size={16}
                            color={color}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={modalStyles.historyDesc} numberOfLines={1}>
                            {tx.description}
                          </Text>
                          <Text style={modalStyles.historyMeta} numberOfLines={1}>
                            {formatTxShortDate(tx.date)} • {meta}
                          </Text>
                        </View>
                        <Text style={[modalStyles.historyAmount, { color }]}>
                          {delta > 0 ? '+' : delta < 0 ? '-' : ''}
                          {formatMoney(tx.amount, account.currency)}
                        </Text>
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
                    <Text style={modalStyles.historyMoreText}>Show more</Text>
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
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  subSectionHeader: {
    marginTop: 20,
    marginBottom: 8,
  },
  subHelperText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  mainAccountCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  mainAccountName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  mainAccountBadge: {
    color: COLORS.finance,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  mainTotalBalance: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  mainActionRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: COLORS.financeLight,
  },
  outlineBtnText: {
    color: COLORS.finance,
    fontSize: 12,
    fontWeight: '700',
  },
  dangerOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    backgroundColor: COLORS.dangerLight,
  },
  dangerOutlineBtnText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  subCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  subCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subAccountName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  subCardTypeLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  subAccountBalance: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  subActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustBalanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.finance,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  adjustBalanceText: {
    color: '#08090C',
    fontSize: 12,
    fontWeight: '800',
  },
  subIconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historySummaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  historySummaryBox: {
    flex: 1,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  historySummaryLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  historySummaryValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  historyChipRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 10,
  },
  historyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCardSub,
  },
  historyChipActive: {
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
  },
  historyChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  historyChipTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDesc: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  historyMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  historyEmpty: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 18,
  },
  historyMoreBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  historyMoreText: {
    color: COLORS.finance,
    fontSize: 12,
    fontWeight: '700',
  },
});