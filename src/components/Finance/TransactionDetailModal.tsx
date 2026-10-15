import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import {
  Transaction,
  Account,
  formatMoney,
  TX_TYPE_THEME,
  getCategoryTheme,
  getAccountIcon,
  ACCOUNT_TYPE_THEME,
  hexToRgba,
} from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';
import { getCategoryIconInfo } from './FinanceCards';

interface TransactionDetailModalProps {
  visible: boolean;
  transaction: Transaction | null;
  accounts: Account[];
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onClone: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

const formatDetailFullDate = (iso: string): string => {
  const d = new Date(iso);
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })} • ${timeStr}`;
};

const getDynamicAmountFontSize = (text: string): number => {
  const len = text.length;
  if (len > 22) return 19;
  if (len > 19) return 21;
  if (len > 16) return 24;
  if (len > 13) return 27;
  return 30;
};

export const TransactionDetailModal = ({
  visible,
  transaction,
  accounts,
  onClose,
  onEdit,
  onClone,
  onDelete,
}: TransactionDetailModalProps) => {
  if (!transaction) return null;

  const isTransfer = transaction.type === 'transfer';
  const isIncome = transaction.type === 'income';

  const account = accounts.find((a) => a.id === transaction.accountId);
  const toAccount = transaction.toAccountId ? accounts.find((a) => a.id === transaction.toAccountId) : null;

  const accName = account?.name || 'Account';
  const toAccName = toAccount?.name || 'Destination Account';
  const accCurrency = account?.currency || 'IDR';

  const subName = account?.subAccounts.find((s) => s.id === transaction.subAccountId)?.name || '';
  const toSubName = toAccount?.subAccounts.find((s) => s.id === transaction.toSubAccountId)?.name || '';

  const fromTheme = account
    ? ACCOUNT_TYPE_THEME[account.type]
    : { color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.34)' };
  const fromIcon = account ? getAccountIcon(account.type) : 'wallet';

  const toTheme = toAccount
    ? ACCOUNT_TYPE_THEME[toAccount.type]
    : { color: '#C084FC', bg: 'rgba(192, 132, 252, 0.14)', border: 'rgba(192, 132, 252, 0.34)' };
  const toIcon = toAccount ? getAccountIcon(toAccount.type) : 'university';

  const iconInfo = getCategoryIconInfo(transaction.category, transaction.type);
  const typeTheme = TX_TYPE_THEME[transaction.type];
  const catTheme = getCategoryTheme(transaction.category);

  const amountColor = isIncome ? '#34D399' : isTransfer ? '#818CF8' : '#FB7185';
  const formattedAmount = `${isIncome ? '+ ' : isTransfer ? '' : '- '}${formatMoney(transaction.amount, accCurrency)}`;
  const amountFontSize = getDynamicAmountFontSize(formattedAmount);

  const isCrossCurrency =
    isTransfer &&
    Boolean(
      account &&
      toAccount &&
      accCurrency !== toAccount.currency &&
      typeof transaction.toAmount === 'number' &&
      transaction.toAmount > 0
    );

  const handleEdit = () => {
    onClose();
    onEdit(transaction);
  };

  const handleClone = () => {
    onClose();
    onClone(transaction);
  };

  const handleDelete = () => {
    onClose();
    onDelete(transaction.id);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View style={styles.content}>
          <View style={styles.handle} />

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Transaction Detail
              </Text>
              <Text style={styles.headerSub}>
                Receipt & overview
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* HERO RECEIPT CARD */}
            <View style={[styles.receiptCard, { borderColor: hexToRgba(typeTheme.color, 0.28) }]}>
              {/* Category Icon Badge */}
              <View style={[styles.categoryIconCircle, { backgroundColor: typeTheme.bg, borderColor: typeTheme.border }]}>
                <Ionicons name={iconInfo.name} size={28} color={typeTheme.color} />
              </View>

              {/* Status / Transaction Type Pill */}
              <View style={[styles.typePill, { backgroundColor: typeTheme.bg, borderColor: typeTheme.border }]}>
                <View style={[styles.typePillDot, { backgroundColor: typeTheme.color }]} />
                <Text style={[styles.typePillText, { color: typeTheme.color }]}>
                  {isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
                </Text>
              </View>

              {/* Primary Amount */}
              <Text
                style={[
                  styles.receiptAmount,
                  { color: amountColor, fontSize: amountFontSize },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.65}
              >
                {formattedAmount}
              </Text>
            </View>

            {/* TRANSFER ROUTE SECTION (BEST PRACTICE HIGHLIGHT FOR TRANSFERS) */}
            {isTransfer ? (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="swap-horizontal" size={14} color="#818CF8" />
                  <Text style={[styles.sectionHeading, { color: '#818CF8', marginBottom: 0 }]}>
                    TRANSFER ROUTE
                  </Text>
                </View>

                <View style={styles.transferPathwayCard}>
                  {/* 1. Source Account Node */}
                  <View style={styles.transferNode}>
                    <View style={[styles.nodeIconBox, { backgroundColor: fromTheme.bg, borderColor: fromTheme.border }]}>
                      <FontAwesome5 name={fromIcon} size={15} color={fromTheme.color} />
                    </View>
                    <View style={styles.nodeInfo}>
                      <Text style={styles.nodeRoleLabel}>SOURCE ACCOUNT (FROM)</Text>
                      <Text style={styles.nodeAccountName}>{accName}</Text>
                      <Text style={styles.nodeSubName}>{subName || 'Main'} • {account?.type || 'Bank'}</Text>
                    </View>
                    <View style={styles.nodeAmountBox}>
                      <Text style={[styles.nodeAmountText, { color: '#FB7185' }]}>
                        - {formatMoney(transaction.amount, accCurrency)}
                      </Text>
                      <View style={styles.outflowTag}>
                        <Ionicons name="arrow-up" size={10} color="#FB7185" />
                        <Text style={styles.outflowTagText}>Sent</Text>
                      </View>
                    </View>
                  </View>

                  {/* 2. Visual Connector Line with Flow Indicator */}
                  <View style={styles.connectorRow}>
                    <View style={styles.connectorLine} />
                    <View style={styles.connectorBadge}>
                      <Ionicons name="arrow-down" size={12} color="#818CF8" />
                      <Text style={styles.connectorBadgeText}>Transferred</Text>
                    </View>
                    <View style={styles.connectorLine} />
                  </View>

                  {/* 3. Destination Account Node */}
                  <View style={styles.transferNode}>
                    <View style={[styles.nodeIconBox, { backgroundColor: toTheme.bg, borderColor: toTheme.border }]}>
                      <FontAwesome5 name={toIcon} size={15} color={toTheme.color} />
                    </View>
                    <View style={styles.nodeInfo}>
                      <Text style={styles.nodeRoleLabel}>DESTINATION ACCOUNT (TO)</Text>
                      <Text style={styles.nodeAccountName}>{toAccName}</Text>
                      <Text style={styles.nodeSubName}>{toSubName || 'Main'} • {toAccount?.type || 'Bank'}</Text>
                    </View>
                    <View style={styles.nodeAmountBox}>
                      <Text style={[styles.nodeAmountText, { color: '#34D399' }]}>
                        + {formatMoney(transaction.toAmount ?? transaction.amount, toAccount?.currency || accCurrency)}
                      </Text>
                      <View style={styles.inflowTag}>
                        <Ionicons name="arrow-down" size={10} color="#34D399" />
                        <Text style={styles.inflowTagText}>Received</Text>
                      </View>
                    </View>
                  </View>

                  {/* 4. Cross-Currency Kurs Banner (If applicable) */}
                  {isCrossCurrency && transaction.exchangeRate && (
                    <View style={styles.exchangeRateCard}>
                      <View style={styles.rateIconCircle}>
                        <Ionicons name="repeat" size={16} color="#38BDF8" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rateLabel}>APPLIED EXCHANGE RATE</Text>
                        <Text style={styles.rateValue}>
                          1 USD ≈ Rp {Math.round(transaction.exchangeRate).toLocaleString('id-ID')}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              /* PAYMENT METHOD CARD FOR INCOME/EXPENSE */
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="wallet-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={[styles.sectionHeading, { marginBottom: 0 }]}>
                    {isIncome ? 'DEPOSITED ACCOUNT' : 'PAYMENT SOURCE'}
                  </Text>
                </View>

                <View style={styles.accountSourceCard}>
                  <View style={[styles.nodeIconBox, { backgroundColor: fromTheme.bg, borderColor: fromTheme.border }]}>
                    <FontAwesome5 name={fromIcon} size={15} color={fromTheme.color} />
                  </View>
                  <View style={styles.nodeInfo}>
                    <Text style={styles.nodeAccountName}>{accName}</Text>
                    <Text style={styles.nodeSubName}>{subName || 'Main Pocket'} • {account?.type || 'Bank'}</Text>
                  </View>
                  <View style={styles.currencyPill}>
                    <Text style={styles.currencyPillText}>{accCurrency}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* DETAILS TABLE BREAKDOWN */}
            <View style={styles.detailsSection}>
              <View style={styles.sectionHeadingRow}>
                <Ionicons name="receipt-outline" size={14} color={COLORS.textSecondary} />
                <Text style={[styles.sectionHeading, { marginBottom: 0 }]}>TRANSACTION DETAILS</Text>
              </View>

              <View style={styles.detailsCard}>
                {/* 1. Date & Time */}
                <View style={styles.detailItem}>
                  <View style={styles.detailLabelRow}>
                    <Ionicons name="calendar-outline" size={15} color={COLORS.textMuted} />
                    <Text style={styles.detailLabel}>Date & Time</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {formatDetailFullDate(transaction.date)}
                  </Text>
                </View>

                {/* 2. Category */}
                <View style={[styles.detailItem, styles.detailItemBorder]}>
                  <View style={styles.detailLabelRow}>
                    <Ionicons name="pricetag-outline" size={15} color={COLORS.textMuted} />
                    <Text style={styles.detailLabel}>Category</Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: catTheme.bg, borderColor: catTheme.border }]}>
                    <Ionicons name={iconInfo.name} size={12} color={catTheme.color} style={{ marginRight: 5 }} />
                    <Text style={[styles.categoryBadgeText, { color: catTheme.color }]}>
                      {transaction.category}
                    </Text>
                  </View>
                </View>

                {/* 3. Notes / Description */}
                {Boolean(transaction.description && transaction.description.trim()) && (
                  <View style={[styles.detailItem, styles.detailItemBorder, { alignItems: 'flex-start' }]}>
                    <View style={styles.detailLabelRow}>
                      <Ionicons name="document-text-outline" size={15} color={COLORS.textMuted} />
                      <Text style={styles.detailLabel}>Note</Text>
                    </View>
                    <View style={styles.noteValueContainer}>
                      <Text style={styles.noteText}>
                        {transaction.description.trim()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* ACTION BUTTONS (Edit, Clone, Delete) */}
            <View style={styles.actionsRow}>
              {/* Edit Button */}
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={handleEdit}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil" size={15} color="#08090C" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnPrimaryText}>Edit</Text>
              </TouchableOpacity>

              {/* Clone Button */}
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={handleClone}
                activeOpacity={0.7}
              >
                <Ionicons name="copy-outline" size={15} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnSecondaryText}>Duplicate</Text>
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                style={styles.actionBtnDanger}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  receiptCard: {
    backgroundColor: '#11141D',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  categoryIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  receiptAmount: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  typePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // ------------------------------------------------------------------
  // Section Headers
  // ------------------------------------------------------------------
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },

  // ------------------------------------------------------------------
  // Transfer Pathway Card (Best Practice)
  // ------------------------------------------------------------------
  transferPathwayCard: {
    backgroundColor: '#11141D',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.22)',
  },
  transferNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nodeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  nodeInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nodeRoleLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  nodeAccountName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  nodeSubName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  nodeAmountBox: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  nodeAmountText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  outflowTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 113, 133, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.25)',
  },
  outflowTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FB7185',
  },
  inflowTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  inflowTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 8,
  },
  connectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(129, 140, 248, 0.25)',
  },
  connectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
  },
  connectorBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#818CF8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  exchangeRateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
  },
  rateIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.6,
  },
  rateValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },

  // ------------------------------------------------------------------
  // Account Source Card (Income / Expense)
  // ------------------------------------------------------------------
  accountSourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11141D',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  currencyPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  currencyPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },

  // ------------------------------------------------------------------
  // Details Section
  // ------------------------------------------------------------------
  detailsSection: {
    marginBottom: 22,
  },
  detailsCard: {
    backgroundColor: '#11141D',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  detailItemBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 19,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  noteValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 16,
  },
  noteText: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'right',
  },

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtnPrimary: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: COLORS.finance,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    color: '#08090C',
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondaryText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnDanger: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
