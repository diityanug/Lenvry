import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/theme';
import {
  Account,
  DebtItem,
  formatMoney,
} from '../../types/finance';
import AppAlertModal, { AppAlertConfig } from '../Common/AppAlertModal';
import { CardIconButton, SectionAddButton } from '../Common/AppButtons';
import { AddDebtCashRecord, AddDebtModal } from './debts/AddDebtModal';
import { SettleDebtModal } from './debts/SettleDebtModal';
import {
  debtsStyles as styles,
  ACCENT,
  RECEIVABLE_COLOR,
  DEBT_COLOR,
} from '../../styles/debtsStyles';

interface DebtsCardProps {
  debts: DebtItem[];
  accounts: Account[];
  currency: 'IDR' | 'USD';
  onAddDebt: (
    debt: Omit<DebtItem, 'id' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status'>,
    cashRecord?: AddDebtCashRecord
  ) => void;
  onDeleteDebt: (id: string) => void;
  onSettlePayment: (params: {
    debtId: string;
    amountPaid: number;
    accountId: string;
    subAccountId: string;
    notes?: string;
  }) => void;
}

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
  const currentCurrencyDebts = useMemo(
    () => debts.filter((d) => d.currency === currency),
    [debts, currency]
  );
  const receivables = useMemo(
    () => currentCurrencyDebts.filter((d) => d.type === 'receivable'),
    [currentCurrencyDebts]
  );
  const payables = useMemo(
    () => currentCurrencyDebts.filter((d) => d.type === 'debt'),
    [currentCurrencyDebts]
  );

  const activeReceivables = useMemo(
    () => receivables.filter((d) => d.status === 'active'),
    [receivables]
  );
  const activePayables = useMemo(
    () => payables.filter((d) => d.status === 'active'),
    [payables]
  );

  const totalReceivablesRemaining = useMemo(
    () => activeReceivables.reduce((sum, d) => sum + d.remainingAmount, 0),
    [activeReceivables]
  );

  const totalDebtsRemaining = useMemo(
    () => activePayables.reduce((sum, d) => sum + d.remainingAmount, 0),
    [activePayables]
  );

  const currentTabItems = useMemo(
    () =>
      currentCurrencyDebts
        .filter((d) => d.type === activeTab && d.status === statusFilter)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [currentCurrencyDebts, activeTab, statusFilter]
  );

  return (
    <View style={styles.containerCard}>
      {/* CARD HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="swap-vertical" size={18} color={ACCENT} />
          </View>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.cardTitle}>RECEIVABLES & DEBTS</Text>
            <Text style={styles.cardSubtitle}>Track money owed to you and debts you owe</Text>
          </View>
        </View>
      </View>

      {/* DUAL SUMMARY METRIC CARDS */}
      <View style={styles.summaryRow}>
        {/* Receivables Summary Card */}
        <View style={[styles.summaryCard, styles.summaryCardReceivable]}>
          <View style={styles.summaryCardTop}>
            <View style={[styles.summaryCardDot, { backgroundColor: RECEIVABLE_COLOR }]} />
            <Text style={styles.summaryCardLabel}>OWED TO YOU</Text>
          </View>
          <Text
            style={[styles.summaryCardAmount, { color: RECEIVABLE_COLOR }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {formatMoney(totalReceivablesRemaining, currency)}
          </Text>
          <Text style={styles.summaryCardSub}>
            {activeReceivables.length} active balances
          </Text>
        </View>

        {/* Debts Summary Card */}
        <View style={[styles.summaryCard, styles.summaryCardDebt]}>
          <View style={styles.summaryCardTop}>
            <View style={[styles.summaryCardDot, { backgroundColor: DEBT_COLOR }]} />
            <Text style={styles.summaryCardLabel}>YOU OWE</Text>
          </View>
          <Text
            style={[styles.summaryCardAmount, { color: DEBT_COLOR }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {formatMoney(totalDebtsRemaining, currency)}
          </Text>
          <Text style={styles.summaryCardSub}>
            {activePayables.length} active balances
          </Text>
        </View>
      </View>

      {/* DEDICATED ADD ENTRY ACTION BAR */}
      <SectionAddButton
        label={activeTab === 'receivable' ? 'Record New Receivable' : 'Record New Debt'}
        onPress={() => setIsAddModalVisible(true)}
        color={ACCENT}
        borderColor="rgba(37, 99, 235, 0.35)"
        surface="sub"
        style={{ marginBottom: 16 }}
      />

      {/* SEGMENTED TAB SWITCHER */}
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
              activeTab === 'receivable' && { color: RECEIVABLE_COLOR, fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            Receivables ({activeReceivables.length})
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
              activeTab === 'debt' && { color: DEBT_COLOR, fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            Debts ({activePayables.length})
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
          <Text
            style={[styles.statusPillText, statusFilter === 'active' && styles.statusPillTextActive]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            Active Balances
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusPill, statusFilter === 'settled' && styles.statusPillActive]}
          onPress={() => setStatusFilter('settled')}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.statusPillText, statusFilter === 'settled' && styles.statusPillTextActive]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            Settled History
          </Text>
        </TouchableOpacity>
      </View>

      {/* ITEMS LIST */}
      <View style={styles.listViewport}>
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
                {/* Layer 1: Identity & Delete Action */}
                <View style={styles.itemTopRow}>
                  <View style={styles.itemIdentity}>
                    <View
                      style={[
                        styles.itemAvatar,
                        {
                          backgroundColor: isReceivable
                            ? 'rgba(16, 185, 129, 0.16)'
                            : 'rgba(244, 63, 94, 0.16)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isReceivable ? 'arrow-down' : 'arrow-up'}
                        size={17}
                        color={isReceivable ? RECEIVABLE_COLOR : DEBT_COLOR}
                      />
                    </View>
                    <View style={styles.itemMeta}>
                      <Text style={styles.personName} numberOfLines={1}>
                        {item.personName}
                      </Text>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  </View>

                  <CardIconButton
                    icon="trash-outline"
                    iconSize={16}
                    tone="surfaceCard"
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
                    accessibilityLabel="Delete debt record"
                  />
                </View>

                {/* Layer 2: Financial Balance Box */}
                <View style={styles.balanceBox}>
                  <View style={styles.balanceMainRow}>
                    <Text style={styles.balanceLabel}>REMAINING BALANCE</Text>
                    <Text
                      style={[
                        styles.remainingAmountText,
                        { color: isReceivable ? RECEIVABLE_COLOR : DEBT_COLOR },
                      ]}
                    >
                      {formatMoney(item.remainingAmount, item.currency)}
                    </Text>
                  </View>

                  <View style={styles.balanceDivider} />

                  <View style={styles.balanceSubRow}>
                    <View style={styles.balanceSubItem}>
                      <Text style={styles.balanceSubLabel}>Original:</Text>
                      <Text style={styles.balanceSubValue}>
                        {formatMoney(item.originalAmount, item.currency)}
                      </Text>
                    </View>

                    <View style={styles.balanceSubItem}>
                      <Text style={styles.balanceSubLabel}>Paid:</Text>
                      <Text style={styles.balanceSubValue}>
                        {formatMoney(item.paidAmount, item.currency)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Layer 3: Progress Track */}
                <View style={styles.progressSection}>
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
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Repayment Progress</Text>
                    <Text style={styles.progressPercent}>{progress}%</Text>
                  </View>
                </View>

                {/* Layer 3.5: Due Date (if set) */}
                {Boolean(item.dueDate) && (() => {
                  const due = new Date(item.dueDate!);
                  const nowDate = new Date();
                  const isOverdue = item.status === 'active' && due.getTime() < nowDate.setHours(0, 0, 0, 0);
                  const dueLabel = due.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                  return (
                    <View style={styles.notesBox}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={isOverdue ? DEBT_COLOR : COLORS.textMuted}
                      />
                      <Text style={[styles.notesText, isOverdue && { color: DEBT_COLOR, fontWeight: '700' }]}>
                        {isOverdue ? `Overdue • Due ${dueLabel}` : `Due ${dueLabel}`}
                      </Text>
                    </View>
                  );
                })()}

                {/* Layer 4: Notes (if any) */}
                {Boolean(item.notes) && (
                  <View style={styles.notesBox}>
                    <Ionicons name="document-text-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.notesText} numberOfLines={2}>
                      {item.notes}
                    </Text>
                  </View>
                )}

                {/* Layer 5: Full-width Primary Action Button or Settled Indicator */}
                {item.status === 'active' ? (
                  <TouchableOpacity
                    style={[
                      styles.btnPrimaryAction,
                      isReceivable
                        ? styles.btnPrimaryActionReceivable
                        : styles.btnPrimaryActionDebt,
                    ]}
                    onPress={() => setSelectedDebtForSettle(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isReceivable ? 'checkmark-circle-outline' : 'arrow-up-circle-outline'}
                      size={18}
                      color={isReceivable ? RECEIVABLE_COLOR : DEBT_COLOR}
                    />
                    <Text
                      style={[
                        styles.btnPrimaryActionText,
                        { color: isReceivable ? RECEIVABLE_COLOR : DEBT_COLOR },
                      ]}
                    >
                      {isReceivable ? 'Receive Payment' : 'Record Payment'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.settledBadgeRow}>
                    <Ionicons name="checkmark-done-circle" size={16} color={COLORS.success} />
                    <Text style={styles.settledBadgeText}>Fully Settled</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
      </View>

      {/* SETTLE / RECORD PAYMENT MODAL */}
      <SettleDebtModal
        debt={selectedDebtForSettle}
        accounts={accounts}
        onClose={() => setSelectedDebtForSettle(null)}
        onConfirm={(params) => {
          onSettlePayment(params);
          setSelectedDebtForSettle(null);
        }}
        onShowAlert={(type, title, message) => showAlert(type, title, message)}
      />

      {/* ADD NEW DEBT / RECEIVABLE MODAL */}
      <AddDebtModal
        visible={isAddModalVisible}
        accounts={accounts}
        currency={currency}
        defaultType={activeTab}
        onClose={() => setIsAddModalVisible(false)}
        onSave={onAddDebt}
        onShowAlert={(type, title, message) => showAlert(type, title, message)}
      />

      {/* ALERT MODAL */}
      <AppAlertModal
        config={alertConfig}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
