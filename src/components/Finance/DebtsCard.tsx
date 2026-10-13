import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import {
  Account,
  DebtItem,
  formatMoney,
} from '../../types/finance';
import AppAlertModal, { AppAlertConfig } from '../Common/AppAlertModal';

interface DebtsCardProps {
  debts: DebtItem[];
  accounts: Account[];
  currency: 'IDR' | 'USD';
  onAddDebt: (debt: Omit<DebtItem, 'id' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status'>) => void;
  onDeleteDebt: (id: string) => void;
  onSettlePayment: (params: {
    debtId: string;
    amountPaid: number;
    accountId: string;
    subAccountId: string;
    notes?: string;
  }) => void;
}

const ACCENT = '#38BDF8';
const RECEIVABLE_COLOR = '#10B981'; // Emerald for money owed to you
const DEBT_COLOR = '#F43F5E'; // Rose for money you owe
const INK = '#08090C';

export function DebtsCard({
  debts,
  accounts,
  currency,
  onAddDebt,
  onDeleteDebt,
  onSettlePayment,
}: DebtsCardProps) {
  // Tabs: 'receivable' (Owed to You) vs 'debt' (You Owe)
  const [activeTab, setActiveTab] = useState<'receivable' | 'debt'>('receivable');
  const [statusFilter, setStatusFilter] = useState<'active' | 'settled'>('active');

  // Modals
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedDebtForSettle, setSelectedDebtForSettle] = useState<DebtItem | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleCloseSettleModal = () => {
    Keyboard.dismiss();
    setSelectedDebtForSettle(null);
  };

  const handleCloseAddModal = () => {
    Keyboard.dismiss();
    setIsAddModalVisible(false);
  };

  // Add Form State
  const [newType, setNewType] = useState<'receivable' | 'debt'>('receivable');
  const [newPersonName, setNewPersonName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState<'IDR' | 'USD'>(currency);
  const [newNotes, setNewNotes] = useState('');

  // Settle Form State
  const [settleAmount, setSettleAmount] = useState('');
  const [settleAccId, setSettleAccId] = useState('');
  const [settleSubAccId, setSettleSubAccId] = useState('');
  const [settleNotes, setSettleNotes] = useState('');

  // Alert State
  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (
    type: AppAlertConfig['type'],
    title: string,
    message: string,
    confirmText = 'OK',
    cancelText?: string,
    onConfirm?: () => void
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  // Filtered lists
  const currentCurrencyDebts = debts.filter((d) => d.currency === currency);
  const receivables = currentCurrencyDebts.filter((d) => d.type === 'receivable');
  const payables = currentCurrencyDebts.filter((d) => d.type === 'debt');

  const totalReceivablesRemaining = receivables
    .filter((d) => d.status === 'active')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const totalDebtsRemaining = payables
    .filter((d) => d.status === 'active')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const currentTabItems = currentCurrencyDebts
    .filter((d) => d.type === activeTab && d.status === statusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Handlers for Add Form
  const handleOpenAddModal = (presetType?: 'receivable' | 'debt') => {
    setNewType(presetType || activeTab);
    setNewPersonName('');
    setNewTitle('');
    setNewAmount('');
    setNewCurrency(currency);
    setNewNotes('');
    setIsAddModalVisible(true);
  };

  const handleSaveNewDebt = () => {
    const person = newPersonName.trim();
    const title = newTitle.trim() || (newType === 'receivable' ? 'Loan / Receivable' : 'Debt / Borrowed');
    const parsedAmount = parseFloat(newAmount.replace(/[^0-9.]/g, ''));

    if (!person) {
      showAlert('warning', 'Missing Name', 'Please provide the person or entity name.');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      showAlert('warning', 'Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    onAddDebt({
      type: newType,
      personName: person,
      title,
      originalAmount: parsedAmount,
      currency: newCurrency,
      notes: newNotes.trim() || undefined,
    });

    setIsAddModalVisible(false);
  };

  // Handlers for Settle Form
  const handleOpenSettleModal = (debt: DebtItem) => {
    setSelectedDebtForSettle(debt);
    setSettleAmount(debt.remainingAmount.toString());
    setSettleNotes('');

    // Preselect matched account with same currency
    const availableAccounts = accounts.filter((a) => a.currency === debt.currency);
    const primaryAcc = availableAccounts.length > 0 ? availableAccounts[0] : accounts[0];

    if (primaryAcc) {
      setSettleAccId(primaryAcc.id);
      setSettleSubAccId(primaryAcc.subAccounts[0]?.id || '');
    } else {
      setSettleAccId('');
      setSettleSubAccId('');
    }
  };

  const handleConfirmSettle = () => {
    if (!selectedDebtForSettle) return;

    if (!settleAccId) {
      showAlert('warning', 'Account Required', 'Please select which account this transaction goes to.');
      return;
    }

    const parsedPayAmount = parseFloat(settleAmount.replace(/[^0-9.]/g, ''));
    if (!parsedPayAmount || parsedPayAmount <= 0) {
      showAlert('warning', 'Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    if (parsedPayAmount > selectedDebtForSettle.remainingAmount) {
      showAlert(
        'warning',
        'Amount Exceeds Balance',
        `The payment amount (${formatMoney(parsedPayAmount, selectedDebtForSettle.currency)}) exceeds the remaining balance (${formatMoney(selectedDebtForSettle.remainingAmount, selectedDebtForSettle.currency)}).`
      );
      return;
    }

    onSettlePayment({
      debtId: selectedDebtForSettle.id,
      amountPaid: parsedPayAmount,
      accountId: settleAccId,
      subAccountId: settleSubAccId,
      notes: settleNotes.trim() || undefined,
    });

    setSelectedDebtForSettle(null);
  };

  // Calculate live preview remaining for settle modal
  const livePaymentValue = parseFloat(settleAmount.replace(/[^0-9.]/g, '')) || 0;
  const liveRemainingAfter = selectedDebtForSettle
    ? Math.max(0, selectedDebtForSettle.remainingAmount - livePaymentValue)
    : 0;

  return (
    <View style={styles.cardContainer}>
      {/* CARD HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="swap-vertical" size={18} color={ACCENT} />
          </View>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.cardTitle}>RECEIVABLES DEBTS</Text>
            <Text style={styles.cardSubtitle}>Track loans & payables</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.btnAdd}
          onPress={() => handleOpenAddModal()}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={16} color={INK} />
          <Text style={styles.btnAddText}>Add Entry</Text>
        </TouchableOpacity>
      </View>

      {/* SUMMARY BANNER */}
      <View style={styles.summaryBanner}>
        {/* Receivables Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryLabelRow}>
            <View style={[styles.dot, { backgroundColor: RECEIVABLE_COLOR }]} />
            <Text style={styles.summaryLabel}>OWED TO YOU</Text>
          </View>
          <Text style={[styles.summaryAmount, { color: RECEIVABLE_COLOR }]}>
            {formatMoney(totalReceivablesRemaining, currency)}
          </Text>
          <Text style={styles.summarySub}>{receivables.filter((d) => d.status === 'active').length} active balances</Text>
        </View>

        <View style={styles.summaryDivider} />

        {/* Debts Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryLabelRow}>
            <View style={[styles.dot, { backgroundColor: DEBT_COLOR }]} />
            <Text style={styles.summaryLabel}>YOU OWE</Text>
          </View>
          <Text style={[styles.summaryAmount, { color: DEBT_COLOR }]}>
            {formatMoney(totalDebtsRemaining, currency)}
          </Text>
          <Text style={styles.summarySub}>{payables.filter((d) => d.status === 'active').length} active balances</Text>
        </View>
      </View>

      {/* SEGMENTED TAB SWITCHER (RECEIVABLES VS DEBTS) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'receivable' && styles.tabBtnActiveReceivable]}
          onPress={() => setActiveTab('receivable')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-down-circle"
            size={16}
            color={activeTab === 'receivable' ? RECEIVABLE_COLOR : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'receivable' && { color: '#FFFFFF', fontWeight: '800' },
            ]}
          >
            Receivables ({receivables.filter((d) => d.status === 'active').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'debt' && styles.tabBtnActiveDebt]}
          onPress={() => setActiveTab('debt')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-up-circle"
            size={16}
            color={activeTab === 'debt' ? DEBT_COLOR : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'debt' && { color: '#FFFFFF', fontWeight: '800' },
            ]}
          >
            Debts ({payables.filter((d) => d.status === 'active').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* STATUS SUB-FILTER (Active vs Settled) */}
      <View style={styles.statusFilterRow}>
        <TouchableOpacity
          style={[styles.statusPill, statusFilter === 'active' && styles.statusPillActive]}
          onPress={() => setStatusFilter('active')}
          activeOpacity={0.7}
        >
          <Text style={[styles.statusPillText, statusFilter === 'active' && styles.statusPillTextActive]}>
            Active Balance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusPill, statusFilter === 'settled' && styles.statusPillActive]}
          onPress={() => setStatusFilter('settled')}
          activeOpacity={0.7}
        >
          <Text style={[styles.statusPillText, statusFilter === 'settled' && styles.statusPillTextActive]}>
            Settled History
          </Text>
        </TouchableOpacity>
      </View>

      {/* ITEMS LIST */}
      {currentTabItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={activeTab === 'receivable' ? 'happy-outline' : 'shield-checkmark-outline'}
            size={36}
            color={COLORS.textMuted}
          />
          <Text style={styles.emptyTitle}>
            No {statusFilter} {activeTab === 'receivable' ? 'receivables' : 'debts'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'receivable'
              ? statusFilter === 'active'
                ? 'Nobody owes you money right now.'
                : 'No settled receivables recorded yet.'
              : statusFilter === 'active'
              ? 'You do not owe any money right now.'
              : 'No settled debts recorded yet.'}
          </Text>
        </View>
      ) : (
        <View style={styles.itemsList}>
          {currentTabItems.map((item) => {
            const isReceivable = item.type === 'receivable';
            const progress = item.originalAmount > 0
              ? Math.min(100, Math.round((item.paidAmount / item.originalAmount) * 100))
              : 0;

            return (
              <View key={item.id} style={styles.itemCard}>
                {/* Top Row: Person, Title & Action Checkmark */}
                <View style={styles.itemHeaderRow}>
                  <View style={styles.personGroup}>
                    <View
                      style={[
                        styles.avatarCircle,
                        {
                          backgroundColor: isReceivable
                            ? 'rgba(16, 185, 129, 0.16)'
                            : 'rgba(244, 63, 94, 0.16)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isReceivable ? 'arrow-down' : 'arrow-up'}
                        size={16}
                        color={isReceivable ? RECEIVABLE_COLOR : DEBT_COLOR}
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.personName}>
                        {item.personName}
                      </Text>
                      <Text style={styles.itemTitle}>
                        {item.title}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemActions}>
                    {item.status === 'active' ? (
                      <TouchableOpacity
                        style={[
                          styles.btnCheckmark,
                          {
                            backgroundColor: isReceivable
                              ? 'rgba(16, 185, 129, 0.18)'
                              : 'rgba(244, 63, 94, 0.18)',
                            borderColor: isReceivable ? RECEIVABLE_COLOR : DEBT_COLOR,
                          },
                        ]}
                        onPress={() => handleOpenSettleModal(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={isReceivable ? RECEIVABLE_COLOR : DEBT_COLOR}
                        />
                        <Text
                          style={[
                            styles.btnCheckmarkText,
                            { color: isReceivable ? RECEIVABLE_COLOR : DEBT_COLOR },
                          ]}
                        >
                          {isReceivable ? 'Receive' : 'Pay'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.badgeSettled}>
                        <Ionicons name="checkmark-done" size={14} color={COLORS.success} />
                        <Text style={styles.badgeSettledText}>Settled</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => {
                        showAlert(
                          'danger',
                          'Delete Record',
                          `Are you sure you want to delete this record for "${item.personName}"?`,
                          'Delete',
                          'Cancel',
                          () => onDeleteDebt(item.id)
                        );
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.btnDelete}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Amount Row */}
                <View style={styles.itemAmountRow}>
                  <View>
                    <Text style={styles.amountLabel}>Remaining Balance</Text>
                    <Text
                      style={[
                        styles.remainingAmountText,
                        { color: isReceivable ? RECEIVABLE_COLOR : DEBT_COLOR },
                      ]}
                    >
                      {formatMoney(item.remainingAmount, item.currency)}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.amountLabel}>Original: {formatMoney(item.originalAmount, item.currency)}</Text>
                    <Text style={styles.paidAmountText}>
                      Paid: {formatMoney(item.paidAmount, item.currency)} ({progress}%)
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress}%`,
                        backgroundColor: isReceivable ? RECEIVABLE_COLOR : DEBT_COLOR,
                      },
                    ]}
                  />
                </View>

                {/* Optional Note Preview */}
                {Boolean(item.notes) && (
                  <Text style={styles.notesPreview}>
                    Note: {item.notes}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* ======================================================== */}
      {/* SETTLE / RECORD PAYMENT MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={Boolean(selectedDebtForSettle)}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseSettleModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleCloseSettleModal}>
            <View style={styles.dismissArea} />
          </TouchableWithoutFeedback>
          <View style={styles.settleModalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                <Text style={styles.modalSheetTitle}>
                  {selectedDebtForSettle?.type === 'receivable'
                    ? 'Record Received Payment'
                    : 'Record Debt Payment'}
                </Text>
                <Text style={styles.modalSheetSubtitle}>
                  {selectedDebtForSettle?.personName} • {selectedDebtForSettle?.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCloseSettleModal}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              contentContainerStyle={{ paddingBottom: Math.max(28, keyboardHeight + 28) }}
            >
              {/* CURRENT BALANCE BANNER */}
              <View style={styles.currentBalanceBanner}>
                <Text style={styles.currentBalanceLabel}>Current Remaining Balance</Text>
                <Text
                  style={[
                    styles.currentBalanceValue,
                    {
                      color:
                        selectedDebtForSettle?.type === 'receivable'
                          ? RECEIVABLE_COLOR
                          : DEBT_COLOR,
                    },
                  ]}
                >
                  {selectedDebtForSettle
                    ? formatMoney(selectedDebtForSettle.remainingAmount, selectedDebtForSettle.currency)
                    : 0}
                </Text>
              </View>

              {/* 1. ACCOUNT SELECTION (WHERE DOES MONEY GO/COME FROM?) */}
              <Text style={styles.inputLabel}>
                {selectedDebtForSettle?.type === 'receivable'
                  ? 'DEPOSIT ACCOUNT'
                  : 'PAYMENT ACCOUNT'}
              </Text>
              <Text style={styles.inputSubLabel}>
                {selectedDebtForSettle?.type === 'receivable'
                  ? 'Select the account where received funds will be added'
                  : 'Select the account where payment will be deducted from'}
              </Text>

              {/* Seamless edge-to-edge horizontal account picker */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.accPickerContent}
                style={styles.accPickerScroll}
              >
                {accounts.map((acc) => {
                  const isSelected = acc.id === settleAccId;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[
                        styles.accPill,
                        isSelected && styles.accPillSelected,
                      ]}
                      onPress={() => {
                        setSettleAccId(acc.id);
                        setSettleSubAccId(acc.subAccounts[0]?.id || '');
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="wallet-outline"
                        size={15}
                        color={isSelected ? ACCENT : COLORS.textMuted}
                      />
                      <Text style={[styles.accPillText, isSelected && styles.accPillTextSelected]}>
                        {acc.name} ({acc.currency})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Sub-account picker if available */}
              {(() => {
                const currentAcc = accounts.find((a) => a.id === settleAccId);
                if (currentAcc && currentAcc.subAccounts.length > 1) {
                  return (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={styles.inputSubLabel}>Pocket / Sub-Account</Text>
                      <View style={styles.subAccWrap}>
                        {currentAcc.subAccounts.map((sub) => {
                          const isSubSelected = sub.id === settleSubAccId;
                          return (
                            <TouchableOpacity
                              key={sub.id}
                              style={[
                                styles.subAccPill,
                                isSubSelected && styles.subAccPillSelected,
                              ]}
                              onPress={() => setSettleSubAccId(sub.id)}
                            >
                              <Text
                                style={[
                                  styles.subAccPillText,
                                  isSubSelected && styles.subAccPillTextSelected,
                                ]}
                              >
                                {sub.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                }
                return null;
              })()}

              {/* 2. PAYMENT AMOUNT INPUT */}
              <View style={styles.amountInputHeaderRow}>
                <Text style={styles.inputLabelNoMargin}>
                  {selectedDebtForSettle?.type === 'receivable'
                    ? 'AMOUNT RECEIVED'
                    : 'AMOUNT TO PAY'}
                </Text>
                {selectedDebtForSettle && (
                  <TouchableOpacity
                    onPress={() => setSettleAmount(selectedDebtForSettle.remainingAmount.toString())}
                    style={styles.btnPayFull}
                  >
                    <Text style={styles.btnPayFullText}>Full Amount</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={settleAmount}
                onChangeText={setSettleAmount}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
              />

              {/* 3. REAL-TIME REMAINING CALCULATION */}
              <View style={styles.calcBox}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Remaining After This Payment:</Text>
                  <Text
                    style={[
                      styles.calcValue,
                      liveRemainingAfter === 0 && { color: COLORS.success, fontWeight: '800' },
                    ]}
                  >
                    {selectedDebtForSettle
                      ? formatMoney(liveRemainingAfter, selectedDebtForSettle.currency)
                      : 0}
                  </Text>
                </View>

                {liveRemainingAfter === 0 ? (
                  <View style={styles.settleStatusBadge}>
                    <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
                    <Text style={styles.settleStatusText}>This balance will be marked as fully settled</Text>
                  </View>
                ) : (
                  <Text style={styles.partialNotice}>
                    Remaining balance of {selectedDebtForSettle ? formatMoney(liveRemainingAfter, selectedDebtForSettle.currency) : 0} will stay active.
                  </Text>
                )}
              </View>

              {/* 4. OPTIONAL NOTES */}
              <Text style={styles.inputLabel}>NOTES / MEMO (OPTIONAL)</Text>
              <TextInput
                style={styles.textInput}
                value={settleNotes}
                onChangeText={setSettleNotes}
                placeholder="e.g. Bank transfer, installment #1"
                placeholderTextColor={COLORS.textMuted}
              />

              {/* SUBMIT BUTTON */}
              <TouchableOpacity
                style={[
                  styles.btnConfirmSettle,
                  {
                    backgroundColor:
                      selectedDebtForSettle?.type === 'receivable'
                        ? RECEIVABLE_COLOR
                        : DEBT_COLOR,
                  },
                ]}
                onPress={handleConfirmSettle}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={18} color="#08090C" />
                <Text style={styles.btnConfirmSettleText}>
                  {selectedDebtForSettle?.type === 'receivable'
                    ? 'Confirm & Deposit to Account'
                    : 'Confirm & Deduct from Account'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* ADD NEW DEBT / RECEIVABLE MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={isAddModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseAddModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleCloseAddModal}>
            <View style={styles.dismissArea} />
          </TouchableWithoutFeedback>
          <View style={styles.settleModalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                <Text style={styles.modalSheetTitle}>Record New Entry</Text>
                <Text style={styles.modalSheetSubtitle}>Keep track of money lent or borrowed</Text>
              </View>
              <TouchableOpacity
                onPress={handleCloseAddModal}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              contentContainerStyle={{ paddingBottom: Math.max(28, keyboardHeight + 28) }}
            >
              {/* TYPE SWITCHER: RECEIVABLE VS DEBT */}
              <Text style={styles.inputLabel}>TYPE</Text>
              <View style={styles.typeSwitcherRow}>
                <TouchableOpacity
                  style={[
                    styles.typeSwitchCard,
                    newType === 'receivable' && styles.typeSwitchCardActiveReceivable,
                  ]}
                  onPress={() => setNewType('receivable')}
                  activeOpacity={0.7}
                >
                  <View style={styles.typeSwitchHeader}>
                    <Ionicons
                      name="arrow-down-circle"
                      size={18}
                      color={newType === 'receivable' ? RECEIVABLE_COLOR : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.typeSwitchTitle,
                        newType === 'receivable' && { color: RECEIVABLE_COLOR },
                      ]}
                    >
                      Receivable
                    </Text>
                  </View>
                  <Text style={styles.typeSwitchSubtitle}>
                    Money owed to you
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeSwitchCard,
                    newType === 'debt' && styles.typeSwitchCardActiveDebt,
                  ]}
                  onPress={() => setNewType('debt')}
                  activeOpacity={0.7}
                >
                  <View style={styles.typeSwitchHeader}>
                    <Ionicons
                      name="arrow-up-circle"
                      size={18}
                      color={newType === 'debt' ? DEBT_COLOR : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.typeSwitchTitle,
                        newType === 'debt' && { color: DEBT_COLOR },
                      ]}
                    >
                      Debt
                    </Text>
                  </View>
                  <Text style={styles.typeSwitchSubtitle}>
                    Money you owe
                  </Text>
                </TouchableOpacity>
              </View>

              {/* PERSON / ENTITY NAME */}
              <Text style={styles.inputLabel}>PERSON / ENTITY NAME</Text>
              <TextInput
                style={styles.textInput}
                value={newPersonName}
                onChangeText={setNewPersonName}
                placeholder="e.g. John Doe etc."
                placeholderTextColor={COLORS.textMuted}
              />

              {/* PURPOSE / TITLE */}
              <Text style={styles.inputLabel}>PURPOSE / DESCRIPTION</Text>
              <TextInput
                style={styles.textInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Ticket etc."
                placeholderTextColor={COLORS.textMuted}
              />

              {/* AMOUNT & CURRENCY ROW (SYMMETRICAL & UNIFIED HEIGHT) */}
              <View style={styles.amountCurrencyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>TOTAL AMOUNT</Text>
                  <TextInput
                    style={styles.textInputInRow}
                    keyboardType="numeric"
                    value={newAmount}
                    onChangeText={setNewAmount}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>

                <View style={{ width: 110 }}>
                  <Text style={styles.inputLabel}>CURRENCY</Text>
                  <View style={styles.currencyToggleRow}>
                    <TouchableOpacity
                      style={[styles.currencyBtn, newCurrency === 'IDR' && styles.currencyBtnActive]}
                      onPress={() => setNewCurrency('IDR')}
                    >
                      <Text style={[styles.currencyBtnText, newCurrency === 'IDR' && styles.currencyBtnTextActive]}>
                        IDR
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.currencyBtn, newCurrency === 'USD' && styles.currencyBtnActive]}
                      onPress={() => setNewCurrency('USD')}
                    >
                      <Text style={[styles.currencyBtnText, newCurrency === 'USD' && styles.currencyBtnTextActive]}>
                        USD
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* OPTIONAL NOTES */}
              <Text style={styles.inputLabel}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={styles.textInput}
                value={newNotes}
                onChangeText={setNewNotes}
                placeholder="Extra details or agreement notes..."
                placeholderTextColor={COLORS.textMuted}
              />

              {/* SUBMIT BUTTON */}
              <TouchableOpacity
                style={[styles.btnConfirmSettle, { backgroundColor: ACCENT, marginTop: 4 }]}
                onPress={handleSaveNewDebt}
                activeOpacity={0.8}
              >
                <Ionicons name="save-outline" size={18} color="#08090C" />
                <Text style={styles.btnConfirmSettleText}>Save Record</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ALERT MODAL */}
      <AppAlertModal
        config={alertConfig}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    lineHeight: 19,
  },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  btnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    flexShrink: 0,
  },
  btnAddText: {
    color: INK,
    fontSize: 12,
    fontWeight: '800',
  },

  // Summary Banner
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 16,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  summaryAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  summarySub: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.borderSubtle,
    marginHorizontal: 14,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgCardSub,
  },
  tabBtnActiveReceivable: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: RECEIVABLE_COLOR,
  },
  tabBtnActiveDebt: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: DEBT_COLOR,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  // Status Filter
  statusFilterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    backgroundColor: 'transparent',
  },
  statusPillActive: {
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusPillText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  statusPillTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },

  // Items
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 16,
    gap: 12,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  itemTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnCheckmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  btnCheckmarkText: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgeSettled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  badgeSettledText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.success,
  },
  btnDelete: {
    padding: 7,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  itemAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  amountLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  remainingAmountText: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  paidAmountText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  notesPreview: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingTop: 2,
  },

  // Modal Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  settleModalSheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSheetSubtitle: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  modalCloseBtn: {
    padding: 7,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
  },
  currentBalanceBanner: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  currentBalanceLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  currentBalanceValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  inputLabelNoMargin: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.7,
  },
  inputSubLabel: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginBottom: 8,
  },

  // Account Picker Seamless Edge-to-Edge
  accPickerScroll: {
    marginHorizontal: -22,
    marginBottom: 16,
  },
  accPickerContent: {
    paddingHorizontal: 22,
    gap: 10,
  },
  accPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  accPillSelected: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  accPillText: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  accPillTextSelected: {
    color: ACCENT,
    fontWeight: '700',
  },

  // Sub Accounts
  subAccWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subAccPill: {
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  subAccPillSelected: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  subAccPillText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
  },
  subAccPillTextSelected: {
    color: ACCENT,
    fontWeight: '700',
  },

  amountInputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  btnPayFull: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  btnPayFullText: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
    minHeight: 48,
  },
  calcBox: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 12.5,
    color: COLORS.textMuted,
  },
  calcValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  settleStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 10,
    borderRadius: RADIUS.md,
    marginTop: 4,
  },
  settleStatusText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '700',
  },
  partialNotice: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  btnConfirmSettle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: RADIUS.xl,
    marginTop: 6,
  },
  btnConfirmSettleText: {
    color: INK,
    fontSize: 14,
    fontWeight: '800',
  },

  // Add Modal Type Switcher (Symmetrical Two Cards)
  typeSwitcherRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeSwitchCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgCardSub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSwitchCardActiveReceivable: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: RECEIVABLE_COLOR,
  },
  typeSwitchCardActiveDebt: {
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderColor: DEBT_COLOR,
  },
  typeSwitchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  typeSwitchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  typeSwitchSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Amount & Currency Row (Symmetrical & Equal Height)
  amountCurrencyRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  textInputInRow: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    height: 48,
  },
  currencyToggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 3,
    height: 48,
  },
  currencyBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  currencyBtnActive: {
    backgroundColor: ACCENT,
  },
  currencyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  currencyBtnTextActive: {
    color: INK,
    fontWeight: '800',
  },
});
