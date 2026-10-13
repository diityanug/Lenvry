import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RecurringBill,
  Transaction,
  formatMoney,
  getCategoryTheme,
  hexToRgba,
} from '../../types/finance';
import { COLORS } from '../../constants/theme';
import AppAlertModal, { AppAlertConfig } from '../Common/AppAlertModal';
import { AddRecurringBillModal } from './recurring/AddRecurringBillModal';
import {
  cardStyles,
  ACCENT,
  INCOME,
  INK,
  getOrdinal,
  getBillTheme,
  STATUS_THEME,
} from '../../styles/recurringBillsStyles';

interface RecurringBillsCardProps {
  bills: RecurringBill[];
  monthlyTransactions?: Transaction[];
  currency: 'IDR' | 'USD';
  categories?: string[];
  selectedMonth?: Date;
  onAddBill: (bill: Omit<RecurringBill, 'id'>) => void;
  onDeleteBill: (id: string) => void;
  onQuickLogBill: (bill: RecurringBill, targetMonth?: Date) => void;
  onUndoBillPayment?: (txId: string) => void;
}

export const RecurringBillsCard = ({
  bills,
  monthlyTransactions = [],
  currency,
  selectedMonth,
  onAddBill,
  onDeleteBill,
  onQuickLogBill,
  onUndoBillPayment,
}: RecurringBillsCardProps) => {
  const [filterTab, setFilterTab] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [modalVisible, setModalVisible] = useState(false);

  const filteredBills = bills.filter((b) => b.currency === currency);
  const totalBillsAmount = filteredBills.reduce((sum, b) => sum + b.amount, 0);

  const viewingDate = selectedMonth || new Date();
  const viewingYear = viewingDate.getFullYear();
  const viewingMonth = viewingDate.getMonth();
  const monthName = viewingDate.toLocaleDateString('en-US', { month: 'short' });
  const fullMonthYear = viewingDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const today = new Date();
  const isCurrentMonth =
    viewingYear === today.getFullYear() && viewingMonth === today.getMonth();
  const isPastMonth =
    viewingYear < today.getFullYear() ||
    (viewingYear === today.getFullYear() && viewingMonth < today.getMonth());

  const currentDay = today.getDate();
  const daysInViewingMonth = new Date(viewingYear, viewingMonth + 1, 0).getDate();

  const processedBills = filteredBills.map((bill) => {
    const matchingTx = monthlyTransactions.find((t) => {
      if (t.type !== 'expense') return false;
      const desc = t.description.toLowerCase();
      const bName = bill.name.toLowerCase();
      return desc.includes(bName) || bName.includes(desc);
    });

    const isPaid = Boolean(matchingTx);
    let paidDateStr = '';
    if (matchingTx) {
      const d = new Date(matchingTx.date);
      paidDateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    }

    let daysUntil = 0;
    let statusText = '';
    let statusType: 'paid' | 'today' | 'soon' | 'normal' | 'overdue' = 'normal';

    if (isPaid) {
      statusType = 'paid';
      statusText = `Paid (${paidDateStr})`;
      daysUntil = 999;
    } else if (isCurrentMonth) {
      if (bill.dueDateDay === currentDay) {
        statusType = 'today';
        statusText = 'Due Today!';
        daysUntil = 0;
      } else if (bill.dueDateDay > currentDay) {
        daysUntil = bill.dueDateDay - currentDay;
        if (daysUntil === 1) {
          statusType = 'soon';
          statusText = 'Due tomorrow';
        } else if (daysUntil <= 5) {
          statusType = 'soon';
          statusText = `In ${daysUntil} days`;
        } else {
          statusType = 'normal';
          statusText = `In ${daysUntil} days`;
        }
      } else {
        daysUntil = daysInViewingMonth - currentDay + bill.dueDateDay;
        statusType = 'overdue';
        statusText = 'Overdue';
      }
    } else if (isPastMonth) {
      statusType = 'overdue';
      statusText = `Unpaid in ${monthName}`;
      daysUntil = 100 + bill.dueDateDay;
    } else {
      // Future month
      statusType = 'normal';
      statusText = `Due on ${getOrdinal(bill.dueDateDay)}`;
      daysUntil = bill.dueDateDay;
    }

    return {
      ...bill,
      isPaid,
      matchingTx,
      daysUntil,
      statusText,
      statusType,
      paidDateStr,
      dueOrdinal: getOrdinal(bill.dueDateDay),
    };
  });

  // Sort: Unpaid items first (Today -> Soon -> Overdue -> Normal), Paid items at the bottom
  processedBills.sort((a, b) => {
    if (a.isPaid && !b.isPaid) return 1;
    if (!a.isPaid && b.isPaid) return -1;
    return a.daysUntil - b.daysUntil;
  });

  const paidBills = processedBills.filter((b) => b.isPaid);
  const unpaidBills = processedBills.filter((b) => !b.isPaid);

  const displayedBills =
    filterTab === 'all'
      ? processedBills
      : filterTab === 'unpaid'
      ? unpaidBills
      : paidBills;

  const totalPaidAmount = paidBills.reduce((sum, b) => sum + b.amount, 0);
  const totalUnpaidAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
  const progressPercent = totalBillsAmount > 0 ? Math.round((totalPaidAmount / totalBillsAmount) * 100) : 0;

  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const confirmDeleteBill = (bill: RecurringBill) => {
    setAlertConfig({
      visible: true,
      type: 'danger',
      title: 'Delete Recurring Bill?',
      message: `Are you sure you want to remove "${bill.name}" from your recurring bills list?`,
      confirmText: 'DELETE',
      cancelText: 'CANCEL',
      onConfirm: () => onDeleteBill(bill.id),
    });
  };

  const confirmUndoPayment = (bill: RecurringBill, txId: string) => {
    setAlertConfig({
      visible: true,
      type: 'danger',
      title: 'Undo Bill Payment?',
      message: `Remove the recorded payment transaction for "${bill.name}" in ${monthName}?`,
      confirmText: 'UNDO PAYMENT',
      cancelText: 'CANCEL',
      onConfirm: () => onUndoBillPayment?.(txId),
    });
  };

  return (
    <View style={cardStyles.containerCard}>
      {/* Header with Title & Add Action */}
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.titleGroup}>
          <View style={cardStyles.iconWrap}>
            <Ionicons name="repeat-outline" size={20} color={ACCENT} />
          </View>
          <View style={cardStyles.titleTextWrap}>
            <Text style={cardStyles.title} numberOfLines={1}>
              Bill & Subscriptions
            </Text>
            <Text style={cardStyles.subtitle} numberOfLines={1}>
              Recurring payments tracker
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={cardStyles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color={INK} />
          <Text style={cardStyles.addBtnText} numberOfLines={1}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Payment Health Tracker Banner */}
      {filteredBills.length > 0 && (
        <View style={cardStyles.summaryBox}>
          <View style={cardStyles.summaryTopRow}>
            <View style={cardStyles.summaryLeftCol}>
              <Text style={cardStyles.summaryLabel} numberOfLines={1}>
                {`BILL STATUS • ${fullMonthYear.toUpperCase()}`}
              </Text>
              <Text style={cardStyles.summaryValues} numberOfLines={1}>
                {paidBills.length} of {filteredBills.length} Bills Paid
              </Text>
            </View>

            <View style={cardStyles.summaryAmountRight}>
              <Text style={cardStyles.summaryRemainingLabel} numberOfLines={1}>
                Remaining to Pay
              </Text>
              <Text
                style={[
                  cardStyles.summaryRemainingVal,
                  totalUnpaidAmount > 0 ? { color: '#F59E0B' } : { color: INCOME },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {totalUnpaidAmount > 0 ? formatMoney(totalUnpaidAmount, currency) : 'All Paid!'}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={cardStyles.progressTrack}>
            <View
              style={[
                cardStyles.progressFill,
                {
                  width: `${Math.max(2, progressPercent)}%`,
                  backgroundColor: progressPercent === 100 ? INCOME : ACCENT,
                },
              ]}
            />
          </View>

          <View style={cardStyles.summaryLegendRow}>
            <View style={cardStyles.summaryLegendItem}>
              <View style={[cardStyles.summaryDot, { backgroundColor: INCOME }]} />
              <Text style={cardStyles.summaryLegendText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                Paid {formatMoney(totalPaidAmount, currency)}
              </Text>
            </View>
            <View style={cardStyles.summaryLegendItem}>
              <View style={[cardStyles.summaryDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={cardStyles.summaryLegendText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                Unpaid {formatMoney(totalUnpaidAmount, currency)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Segmented Filter Tabs: All / Unpaid / Paid */}
      {filteredBills.length > 0 && (
        <View style={cardStyles.tabFilterRow}>
          <TouchableOpacity
            style={[cardStyles.tabBtn, filterTab === 'all' && cardStyles.tabBtnActive]}
            onPress={() => setFilterTab('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[cardStyles.tabBtnText, filterTab === 'all' && cardStyles.tabBtnTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              All ({filteredBills.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[cardStyles.tabBtn, filterTab === 'unpaid' && cardStyles.tabBtnActive]}
            onPress={() => setFilterTab('unpaid')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                cardStyles.tabBtnText,
                filterTab === 'unpaid' && { color: '#F59E0B', fontWeight: '800' },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Unpaid ({unpaidBills.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[cardStyles.tabBtn, filterTab === 'paid' && cardStyles.tabBtnActive]}
            onPress={() => setFilterTab('paid')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                cardStyles.tabBtnText,
                filterTab === 'paid' && { color: INCOME, fontWeight: '800' },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Paid ({paidBills.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bills Cards List */}
      {displayedBills.length === 0 ? (
        <View style={cardStyles.emptyBox}>
          <View style={cardStyles.emptyIconWrap}>
            <Ionicons
              name={filterTab === 'paid' ? 'checkmark-done-circle-outline' : 'calendar-outline'}
              size={30}
              color={filterTab === 'paid' ? INCOME : ACCENT}
            />
          </View>
          <Text style={cardStyles.emptyTitle} numberOfLines={2}>
            {filterTab === 'paid'
              ? 'No Paid Bills Yet'
              : filterTab === 'unpaid'
              ? 'No Pending Bills!'
              : 'No Bill / Subcrtiptions yet'}
          </Text>
          <Text style={cardStyles.emptySubText}>
            {filterTab === 'paid'
              ? `Tap "Pay for ${monthName}" on any item to record paid bills.`
              : filterTab === 'unpaid'
              ? `All recurring bills for ${fullMonthYear} have been marked as paid.`
              : 'Add recurring expenses, never miss a due date.'}
          </Text>
        </View>
      ) : (
        <View style={cardStyles.billsStack}>
          {displayedBills.map((bill) => {
            const theme = getBillTheme(bill.category, bill.name);
            const categoryTheme = getCategoryTheme(bill.category);
            const statusTheme = STATUS_THEME[bill.statusType] || STATUS_THEME.normal;
            const isPaid = bill.isPaid;
            const isToday = bill.statusType === 'today';

            return (
              <View
                key={bill.id}
                style={[
                  cardStyles.billCard,
                  { borderColor: hexToRgba(theme.color, 0.28) },
                  isPaid && cardStyles.billCardPaid,
                  isToday && cardStyles.billCardToday,
                ]}
              >
                {/* Category accent rail */}
                <View style={[cardStyles.billAccentRail, { backgroundColor: theme.color }]} />

                {/* Brand Icon + Title & Category + Trash Button */}
                <View style={cardStyles.billTopRow}>
                  {/* Visual Brand Icon */}
                  <View style={[cardStyles.brandIconBox, { backgroundColor: theme.bg, borderColor: hexToRgba(theme.color, 0.34) }]}>
                    <Ionicons name={theme.icon} size={20} color={theme.color} />
                  </View>

                  {/* Title & Metadata */}
                  <View style={cardStyles.billInfoCol}>
                    <Text style={cardStyles.billName} numberOfLines={1}>
                      {bill.name}
                    </Text>
                    <Text style={cardStyles.billScheduleText} numberOfLines={1}>
                      Due every {bill.dueOrdinal} • {bill.category}
                    </Text>
                  </View>

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={cardStyles.trashBtn}
                    onPress={() => confirmDeleteBill(bill)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Amount + Status Badge */}
                <View style={cardStyles.billMiddleRow}>
                  <View style={cardStyles.billAmountCol}>
                    <Text style={cardStyles.billAmountLabel} numberOfLines={1}>
                      BILL AMOUNT
                    </Text>
                    <Text
                      style={cardStyles.billAmountText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {formatMoney(bill.amount, bill.currency)}
                    </Text>
                  </View>

                  <View
                    style={[
                      cardStyles.statusBadge,
                      { backgroundColor: statusTheme.bg, borderColor: statusTheme.border },
                    ]}
                  >
                    <View style={[cardStyles.statusDot, { backgroundColor: statusTheme.color }]} />
                    <Text
                      style={[cardStyles.statusBadgeText, { color: statusTheme.color }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {bill.statusText}
                    </Text>
                  </View>
                </View>

                {/* Bottom Action Section */}
                <View style={cardStyles.billActionDivider} />

                {isPaid ? (
                  <View style={cardStyles.paidStateRow}>
                    <View style={cardStyles.paidCheckGroup}>
                      <Ionicons name="checkmark-circle" size={18} color={INCOME} />
                      <Text style={cardStyles.paidLabelText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                        Paid for {monthName}
                      </Text>
                    </View>

                    {onUndoBillPayment && bill.matchingTx && (
                      <TouchableOpacity
                        style={cardStyles.undoActionBtn}
                        onPress={() => confirmUndoPayment(bill, bill.matchingTx!.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="arrow-undo-outline" size={14} color="#FB7185" />
                        <Text style={cardStyles.undoActionText} numberOfLines={1}>
                          Undo
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[cardStyles.payCtaButton, { backgroundColor: theme.color }]}
                    onPress={() => onQuickLogBill(bill, viewingDate)}
                    activeOpacity={0.85}
                  >
                    <View style={cardStyles.payCtaLeft}>
                      <Ionicons name="wallet-outline" size={17} color={INK} style={{ marginRight: 8 }} />
                      <Text style={cardStyles.payCtaText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                        Pay for {monthName}
                      </Text>
                    </View>
                    <View style={cardStyles.payCtaBadge}>
                      <Text
                        style={cardStyles.payCtaBadgeText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {formatMoney(bill.amount, bill.currency)}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={INK} style={{ marginLeft: 4 }} />
                    </View>
                  </TouchableOpacity>
                )}

                <View style={cardStyles.billFooterRow}>
                  <View
                    style={[
                      cardStyles.billCategoryChip,
                      { backgroundColor: categoryTheme.bg, borderColor: categoryTheme.border },
                    ]}
                  >
                    <View style={[cardStyles.statusDot, { backgroundColor: categoryTheme.color }]} />
                    <Text
                      style={[cardStyles.billCategoryChipText, { color: categoryTheme.color }]}
                      numberOfLines={1}
                    >
                      {bill.category}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Add Recurring Bill Modal */}
      <AddRecurringBillModal
        visible={modalVisible}
        currency={currency}
        onClose={() => setModalVisible(false)}
        onSave={onAddBill}
      />

      {/* Custom Alert Modal */}
      <AppAlertModal
        config={alertConfig}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};
