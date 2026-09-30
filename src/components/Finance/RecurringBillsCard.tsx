import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecurringBill, Transaction, formatMoney } from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';
import AppAlertModal, { AppAlertConfig } from '../Common/AppAlertModal';

interface RecurringBillsCardProps {
  bills: RecurringBill[];
  monthlyTransactions?: Transaction[];
  currency: 'IDR' | 'USD';
  onAddBill: (bill: Omit<RecurringBill, 'id'>) => void;
  onDeleteBill: (id: string) => void;
  onQuickLogBill: (bill: RecurringBill) => void;
}

const BILL_CATEGORIES = [
  'Bills & Utilities',
  'Subscriptions',
  'Housing / Rent',
  'Internet & Phone',
  'Insurance',
  'Fitness & Gym',
  'Cloud & Storage',
  'Other',
];

const PRESET_BILLS = [
  { name: 'Netflix', category: 'Subscriptions', defaultAmount: '186000' },
  { name: 'Spotify', category: 'Subscriptions', defaultAmount: '55000' },
  { name: 'YouTube Premium', category: 'Subscriptions', defaultAmount: '59000' },
  { name: 'Wi-Fi / Internet', category: 'Internet & Phone', defaultAmount: '350000' },
  { name: 'Electricity / Power', category: 'Bills & Utilities', defaultAmount: '250000' },
  { name: 'Water & Utilities', category: 'Bills & Utilities', defaultAmount: '80000' },
  { name: 'House / Room Rent', category: 'Housing / Rent', defaultAmount: '1500000' },
  { name: 'Gym Membership', category: 'Fitness & Gym', defaultAmount: '350000' },
  { name: 'iCloud / Google One', category: 'Cloud & Storage', defaultAmount: '45000' },
];

const getOrdinal = (day: number): string => {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return `${day}st`;
  if (j === 2 && k !== 12) return `${day}nd`;
  if (j === 3 && k !== 13) return `${day}rd`;
  return `${day}th`;
};

const getBillTheme = (category: string, name: string): { icon: any; color: string; bg: string } => {
  const lower = name.toLowerCase();
  if (lower.includes('netflix') || lower.includes('disney') || lower.includes('tv') || lower.includes('prime') || lower.includes('vidio')) {
    return { icon: 'tv-outline', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.16)' };
  }
  if (lower.includes('spotify') || lower.includes('music') || lower.includes('apple music')) {
    return { icon: 'musical-notes-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' };
  }
  if (lower.includes('youtube')) {
    return { icon: 'logo-youtube', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.16)' };
  }
  if (lower.includes('wifi') || lower.includes('internet') || lower.includes('indihome') || lower.includes('biznet') || lower.includes('myrepublic')) {
    return { icon: 'wifi-outline', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' };
  }
  if (lower.includes('pln') || lower.includes('listrik') || lower.includes('electric') || lower.includes('token')) {
    return { icon: 'flash-outline', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' };
  }
  if (lower.includes('air') || lower.includes('pdam') || lower.includes('water')) {
    return { icon: 'water-outline', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.16)' };
  }
  if (lower.includes('kost') || lower.includes('rent') || lower.includes('rumah') || lower.includes('sewa') || lower.includes('apartment')) {
    return { icon: 'home-outline', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.16)' };
  }
  if (lower.includes('gym') || lower.includes('fitness') || lower.includes('workout')) {
    return { icon: 'barbell-outline', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.16)' };
  }
  if (lower.includes('cloud') || lower.includes('icloud') || lower.includes('google') || lower.includes('drive')) {
    return { icon: 'cloud-outline', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.16)' };
  }
  if (lower.includes('pulsa') || lower.includes('kuota') || lower.includes('telkomsel') || lower.includes('indosat') || lower.includes('xl')) {
    return { icon: 'phone-portrait-outline', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.16)' };
  }

  switch (category) {
    case 'Subscriptions':
      return { icon: 'apps-outline', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.16)' };
    case 'Internet & Phone':
      return { icon: 'phone-portrait-outline', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' };
    case 'Housing / Rent':
      return { icon: 'home-outline', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.16)' };
    case 'Insurance':
      return { icon: 'shield-checkmark-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' };
    case 'Fitness & Gym':
      return { icon: 'barbell-outline', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.16)' };
    case 'Cloud & Storage':
      return { icon: 'cloud-outline', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.16)' };
    default:
      return { icon: 'receipt-outline', color: COLORS.finance, bg: COLORS.financeLight };
  }
};

export const RecurringBillsCard = ({
  bills,
  monthlyTransactions = [],
  currency,
  onAddBill,
  onDeleteBill,
  onQuickLogBill,
}: RecurringBillsCardProps) => {
  const [filterTab, setFilterTab] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(BILL_CATEGORIES[0]);
  const [dueDateDay, setDueDateDay] = useState('1');
  const { height: windowHeight } = useWindowDimensions();

  const handleCloseModal = () => {
    Keyboard.dismiss();
    setModalVisible(false);
  };

  const filteredBills = bills.filter((b) => b.currency === currency);
  const totalBillsAmount = filteredBills.reduce((sum, b) => sum + b.amount, 0);

  const today = new Date();
  const currentDay = today.getDate();
  const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // Determine status for each bill based on payment record and due date
  const processedBills = filteredBills.map((bill) => {
    // Check if this bill has been paid in current month transactions
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
    } else if (bill.dueDateDay === currentDay) {
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
      // Overdue / passed this month without payment recorded
      daysUntil = daysInCurrentMonth - currentDay + bill.dueDateDay;
      statusType = 'overdue';
      statusText = 'Unpaid this month';
    }

    return {
      ...bill,
      isPaid,
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

  const handleSave = () => {
    const trimmedName = name.trim();
    const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
    const parsedDay = Math.max(1, Math.min(31, parseInt(dueDateDay, 10) || 1));

    if (!trimmedName || parsedAmount <= 0) return;

    onAddBill({
      name: trimmedName,
      amount: parsedAmount,
      category: selectedCategory,
      dueDateDay: parsedDay,
      currency,
    });

    setName('');
    setAmount('');
    setSelectedCategory(BILL_CATEGORIES[0]);
    setDueDateDay('1');
    setModalVisible(false);
  };

  const handleSelectPreset = (preset: { name: string; category: string; defaultAmount?: string }) => {
    setName(preset.name);
    setSelectedCategory(preset.category);
    if (preset.defaultAmount && currency === 'IDR') {
      setAmount(preset.defaultAmount);
    }
  };

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

  return (
    <View style={cardStyles.containerCard}>
      {/* 1. Header with Title & Add Action */}
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.titleGroup}>
          <View style={cardStyles.iconWrap}>
            <Ionicons name="repeat-outline" size={20} color={COLORS.finance} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={cardStyles.title} numberOfLines={1}>
              Bill & Subscriptions
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={cardStyles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={15} color="#08090C" />
          <Text style={cardStyles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Monthly Payment Health Tracker Banner */}
      {filteredBills.length > 0 && (
        <View style={cardStyles.summaryBox}>
          <View style={cardStyles.summaryTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={cardStyles.summaryLabel}>{"THIS MONTH'S BILL STATUS"}</Text>
              <Text style={cardStyles.summaryValues}>
                {paidBills.length} of {filteredBills.length} Bills Paid
              </Text>
            </View>

            <View style={cardStyles.summaryAmountRight}>
              <Text style={cardStyles.summaryRemainingLabel}>Remaining to Pay</Text>
              <Text
                style={[
                  cardStyles.summaryRemainingVal,
                  totalUnpaidAmount > 0 ? { color: '#F59E0B' } : { color: COLORS.success },
                ]}
                numberOfLines={1}
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
                  backgroundColor: progressPercent === 100 ? COLORS.success : COLORS.finance,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* 3. Segmented Filter Tabs: All / Unpaid / Paid */}
      {filteredBills.length > 0 && (
        <View style={cardStyles.tabFilterRow}>
          <TouchableOpacity
            style={[cardStyles.tabBtn, filterTab === 'all' && cardStyles.tabBtnActive]}
            onPress={() => setFilterTab('all')}
            activeOpacity={0.7}
          >
            <Text style={[cardStyles.tabBtnText, filterTab === 'all' && cardStyles.tabBtnTextActive]}>
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
                filterTab === 'paid' && { color: COLORS.success, fontWeight: '800' },
              ]}
            >
              Paid ({paidBills.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. Bills Cards List */}
      {displayedBills.length === 0 ? (
        <View style={cardStyles.emptyBox}>
          <Ionicons
            name={filterTab === 'paid' ? 'checkmark-done-circle-outline' : 'calendar-outline'}
            size={32}
            color={COLORS.textMuted}
            style={{ marginBottom: 6 }}
          />
          <Text style={cardStyles.emptyTitle}>
            {filterTab === 'paid'
              ? 'No Paid Bills Yet'
              : filterTab === 'unpaid'
              ? 'No Pending Bills!'
              : 'No Bill / Subcrtiptions yet'}
          </Text>
          <Text style={cardStyles.emptySubText}>
            {filterTab === 'paid'
              ? 'Tap "Pay This Bill" on any item to record paid bills.'
              : filterTab === 'unpaid'
              ? 'All recurring bills for this month have been marked as paid.'
              : 'Add recurring expenses, never miss a due date.'}
          </Text>
        </View>
      ) : (
        <View style={cardStyles.billsStack}>
          {displayedBills.map((bill) => {
            const theme = getBillTheme(bill.category, bill.name);
            const isPaid = bill.isPaid;
            const isToday = bill.statusType === 'today';
            const isSoon = bill.statusType === 'soon';
            const isOverdue = bill.statusType === 'overdue';

            return (
              <View
                key={bill.id}
                style={[
                  cardStyles.billCard,
                  isPaid && cardStyles.billCardPaid,
                  isToday && cardStyles.billCardToday,
                ]}
              >
                {/* Upper Section: Brand Icon + Details + Amount + Delete */}
                <View style={cardStyles.billTopRow}>
                  {/* Visual Brand Icon */}
                  <View style={[cardStyles.brandIconBox, { backgroundColor: theme.bg }]}>
                    <Ionicons name={theme.icon} size={18} color={theme.color} />
                  </View>

                  {/* Title & Metadata */}
                  <View style={cardStyles.billInfoCol}>
                    <View style={cardStyles.billTitleLine}>
                      <Text style={cardStyles.billName} numberOfLines={1}>
                        {bill.name}
                      </Text>

                      {/* Status Badge */}
                      <View
                        style={[
                          cardStyles.statusBadge,
                          isPaid && cardStyles.statusBadgePaid,
                          isToday && cardStyles.statusBadgeToday,
                          isSoon && cardStyles.statusBadgeSoon,
                          isOverdue && cardStyles.statusBadgeOverdue,
                        ]}
                      >
                        <Text
                          style={[
                            cardStyles.statusBadgeText,
                            isPaid && { color: COLORS.success },
                            isToday && { color: '#F43F5E', fontWeight: '800' },
                            isSoon && { color: '#F59E0B' },
                            isOverdue && { color: '#F43F5E' },
                          ]}
                          numberOfLines={1}
                        >
                          {bill.statusText}
                        </Text>
                      </View>
                    </View>

                    <Text style={cardStyles.billScheduleText}>
                      Due every {bill.dueOrdinal} • {bill.category}
                    </Text>
                  </View>

                  {/* Right: Amount & Delete Button */}
                  <View style={cardStyles.billRightCol}>
                    <Text style={cardStyles.billAmountText} numberOfLines={1}>
                      {formatMoney(bill.amount, bill.currency)}
                    </Text>

                    <TouchableOpacity
                      style={cardStyles.trashBtn}
                      onPress={() => confirmDeleteBill(bill)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={13} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bottom Action Section: Replaces confusing "Log Expense" */}
                <View style={cardStyles.billActionDivider} />

                {isPaid ? (
                  <View style={cardStyles.paidStateRow}>
                    <View style={cardStyles.paidCheckGroup}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                      <Text style={cardStyles.paidLabelText}>
                        Paid for this month
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={cardStyles.relogActionBtn}
                      onPress={() => onQuickLogBill(bill)}
                      activeOpacity={0.7}
                    >
                      <Text style={cardStyles.relogActionText}>Pay Again</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={cardStyles.payCtaButton}
                    onPress={() => onQuickLogBill(bill)}
                    activeOpacity={0.85}
                  >
                    <View style={cardStyles.payCtaLeft}>
                      <Ionicons name="wallet-outline" size={15} color="#08090C" style={{ marginRight: 6 }} />
                      <Text style={cardStyles.payCtaText}>Pay This Bill</Text>
                    </View>
                    <View style={cardStyles.payCtaBadge}>
                      <Text style={cardStyles.payCtaBadgeText}>{formatMoney(bill.amount, bill.currency)}</Text>
                      <Ionicons name="chevron-forward" size={12} color="#08090C" style={{ marginLeft: 3 }} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* 5. Add Recurring Bill Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
        statusBarTranslucent={true}
      >
        <View style={cardStyles.modalOverlay}>
          <Pressable style={cardStyles.modalDismissArea} onPress={handleCloseModal} />

          <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          >
            <View style={[cardStyles.modalContent, { maxHeight: windowHeight * 0.88 }]}>
              <View style={cardStyles.modalHandle} />

              <View style={cardStyles.modalHeaderRow}>
                <View>
                  <Text style={cardStyles.modalTitle}>Add Recurring Bill</Text>
                  <Text style={cardStyles.modalSubTitle}>Auto-track monthly bills and subscriptions</Text>
                </View>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ paddingBottom: 28 }}
              >
                {/* Popular Quick Templates */}
                <Text style={cardStyles.formSectionLabel}>POPULAR TEMPLATES</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={cardStyles.presetScrollContent}
                  style={{ marginBottom: 18 }}
                >
                  {PRESET_BILLS.map((preset) => {
                    const isSelected = name === preset.name;
                    return (
                      <TouchableOpacity
                        key={preset.name}
                        style={[
                          cardStyles.presetChip,
                          isSelected && cardStyles.presetChipActive,
                        ]}
                        onPress={() => handleSelectPreset(preset)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            cardStyles.presetChipText,
                            isSelected && cardStyles.presetChipTextActive,
                          ]}
                        >
                          {preset.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Form Group: Name */}
                <View style={cardStyles.formGroup}>
                  <Text style={cardStyles.inputLabel}>BILL NAME</Text>
                  <TextInput
                    style={cardStyles.inputField}
                    placeholder="e.g. Netflix, Wi-Fi, Rent"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                {/* Form Group: Amount */}
                <View style={cardStyles.formGroup}>
                  <Text style={cardStyles.inputLabel}>AMOUNT ({currency})</Text>
                  <TextInput
                    style={cardStyles.inputField}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>

                {/* Form Group: Category */}
                <View style={cardStyles.formGroup}>
                  <Text style={cardStyles.inputLabel}>CATEGORY</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingVertical: 2, paddingRight: 10 }}
                  >
                    {BILL_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[cardStyles.catBtn, isSelected && cardStyles.catBtnActive]}
                          onPress={() => setSelectedCategory(cat)}
                          activeOpacity={0.7}
                        >
                          <Text style={[cardStyles.catBtnText, isSelected && cardStyles.catBtnTextActive]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Form Group: Due Day */}
                <View style={cardStyles.formGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={cardStyles.inputLabel}>DUE DAY OF MONTH</Text>
                    <Text style={{ fontSize: 11, color: COLORS.finance, fontWeight: '700' }}>
                      Every {getOrdinal(Math.max(1, Math.min(31, parseInt(dueDateDay, 10) || 1)))}
                    </Text>
                  </View>

                  {/* Quick Select Day Chips */}
                  <View style={cardStyles.quickDayRow}>
                    {[1, 5, 10, 15, 20, 25, 28].map((d) => {
                      const isDaySelected = parseInt(dueDateDay, 10) === d;
                      return (
                        <TouchableOpacity
                          key={`day-${d}`}
                          style={[
                            cardStyles.quickDayPill,
                            isDaySelected && cardStyles.quickDayPillActive,
                          ]}
                          onPress={() => setDueDateDay(d.toString())}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              cardStyles.quickDayPillText,
                              isDaySelected && cardStyles.quickDayPillTextActive,
                            ]}
                          >
                            {d}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Save CTA */}
                <TouchableOpacity
                  style={[
                    cardStyles.saveCtaBtn,
                    (!name.trim() || !amount) && { opacity: 0.6 },
                  ]}
                  onPress={handleSave}
                  activeOpacity={0.85}
                  disabled={!name.trim() || !amount}
                >
                  <Text style={cardStyles.saveCtaBtnText}>SAVE BILL</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Custom Alert Modal matching app theme */}
      <AppAlertModal
        config={alertConfig}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const cardStyles = StyleSheet.create({
  containerCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    flexShrink: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.finance,
    marginTop: 1,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.finance,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    gap: 4,
    flexShrink: 0,
  },
  addBtnText: {
    color: '#08090C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  summaryBox: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  summaryValues: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  summaryAmountRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  summaryRemainingLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  summaryRemainingVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 5,
    backgroundColor: COLORS.bgCard,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tabFilterRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  tabBtnActive: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabBtnTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptySubText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.finance,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    marginTop: 14,
  },
  emptyAddBtnText: {
    color: '#08090C',
    fontSize: 11,
    fontWeight: '800',
  },
  billsStack: {
    gap: 12,
  },
  billCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  billCardPaid: {
    opacity: 0.9,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  billCardToday: {
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  billTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  billInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  billTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  billName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusBadgePaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusBadgeToday: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  statusBadgeSoon: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusBadgeOverdue: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  billScheduleText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: '500',
    lineHeight: 15,
  },
  billRightCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 4,
  },
  billAmountText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  trashBtn: {
    padding: 3,
  },
  billActionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 10,
  },
  payCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.finance,
    borderRadius: RADIUS.md,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  payCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payCtaText: {
    color: '#08090C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  payCtaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 9, 12, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  payCtaBadgeText: {
    color: '#08090C',
    fontSize: 10,
    fontWeight: '800',
  },
  paidStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  paidCheckGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paidLabelText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
  },
  relogActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  relogActionText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  formSectionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  presetScrollContent: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 10,
  },
  presetChip: {
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipActive: {
    backgroundColor: COLORS.financeLight,
    borderColor: COLORS.finance,
  },
  presetChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: COLORS.finance,
    fontWeight: '800',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  inputField: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '600',
  },
  catBtn: {
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catBtnActive: {
    backgroundColor: COLORS.financeLight,
    borderColor: COLORS.finance,
  },
  catBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  catBtnTextActive: {
    color: COLORS.finance,
    fontWeight: '800',
  },
  quickDayRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickDayPill: {
    flex: 1,
    backgroundColor: COLORS.bgCardSub,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDayPillActive: {
    backgroundColor: COLORS.financeLight,
    borderColor: COLORS.finance,
  },
  quickDayPillText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  quickDayPillTextActive: {
    color: COLORS.finance,
    fontWeight: '800',
  },
  saveCtaBtn: {
    backgroundColor: COLORS.finance,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveCtaBtnText: {
    color: '#08090C',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
