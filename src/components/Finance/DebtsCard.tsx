import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { AddDebtModal } from './debts/AddDebtModal';
import { SettleDebtModal } from './debts/SettleDebtModal';
import {
  debtsStyles as styles,
  ACCENT,
  RECEIVABLE_COLOR,
  DEBT_COLOR,
  INK,
} from '../../styles/debtsStyles';

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
            <Text style={styles.cardSubtitle}>Track loans & payables</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.btnAdd}
          onPress={() => setIsAddModalVisible(true)}
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
                        onPress={() => setSelectedDebtForSettle(item)}
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
