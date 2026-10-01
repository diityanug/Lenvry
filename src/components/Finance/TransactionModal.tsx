import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Account, CategoryCustomIcon, formatMoney } from '../../types/finance';
import { CalculatorModal } from './CalculatorModal';
import { COLORS, RADIUS } from '../../constants/theme';
import { getCategoryTheme } from './CategoryBreakdownCard';

interface TransactionModalProps {
  visible: boolean;
  type: 'income' | 'expense' | 'transfer';
  amount: string;
  description: string;
  txDate: Date;
  selectedCategory: string;
  selectedAccId: string;
  selectedSubAccId: string;
  selectedToAccId?: string;
  selectedToSubAccId?: string;
  accounts: Account[];
  expenseCategories: string[];
  incomeCategories: string[];
  customCategoryIcons?: CategoryCustomIcon[];
  isEditing?: boolean;
  onClose: () => void;
  onSave: () => void;
  setType: (t: 'income' | 'expense' | 'transfer') => void;
  setAmount: (val: string) => void;
  setDescription: (val: string) => void;
  setSelectedCategory: (cat: string) => void;
  setSelectedAccId: (id: string) => void;
  setSelectedSubAccId: (id: string) => void;
  setSelectedToAccId?: (id: string) => void;
  setSelectedToSubAccId?: (id: string) => void;
  onOpenDatePicker: () => void;
  onOpenAddCategory: () => void;
  hideTypeSwitcher?: boolean;
}

export const TransactionModal = ({
  visible,
  type,
  amount,
  description,
  txDate,
  selectedCategory,
  selectedAccId,
  selectedSubAccId,
  selectedToAccId = '',
  selectedToSubAccId = '',
  accounts,
  expenseCategories,
  incomeCategories,
  customCategoryIcons,
  isEditing = false,
  hideTypeSwitcher = false,
  onClose,
  onSave,
  setType,
  setAmount,
  setDescription,
  setSelectedCategory,
  setSelectedAccId,
  setSelectedSubAccId,
  setSelectedToAccId,
  setSelectedToSubAccId,
  onOpenDatePicker,
  onOpenAddCategory,
}: TransactionModalProps) => {
  const [calcVisible, setCalcVisible] = useState(false);
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

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccId);
  const selectedToAccount = accounts.find((a) => a.id === selectedToAccId);
  const currency = selectedAccount?.currency || 'IDR';
  const currencySymbol = currency === 'USD' ? '$' : 'Rp';
  const isExpense = type === 'expense';
  const isTransfer = type === 'transfer';
  const activeCategories = isExpense ? expenseCategories : incomeCategories;

  const handleSelectAccount = (acc: Account) => {
    setSelectedAccId(acc.id);
    const newSubId = acc.subAccounts.length > 0 ? acc.subAccounts[0].id : '';
    setSelectedSubAccId(newSubId);
    // If destination was same account and same sub-account, pick another sub-account if possible
    if (selectedToAccId === acc.id && selectedToSubAccId === newSubId && setSelectedToSubAccId) {
      const otherSub = acc.subAccounts.find((s) => s.id !== newSubId);
      if (otherSub) setSelectedToSubAccId(otherSub.id);
    }
  };

  const handleSelectSubAccount = (subId: string) => {
    setSelectedSubAccId(subId);
    if (selectedToAccId === selectedAccId && selectedToSubAccId === subId && setSelectedToSubAccId && selectedAccount) {
      const otherSub = selectedAccount.subAccounts.find((s) => s.id !== subId);
      if (otherSub) {
        setSelectedToSubAccId(otherSub.id);
      }
    }
  };

  const handleSelectToAccount = (acc: Account) => {
    if (setSelectedToAccId) setSelectedToAccId(acc.id);
    if (setSelectedToSubAccId) {
      if (acc.id === selectedAccId) {
        // If selecting same account, automatically pick a different sub-account
        const otherSub = acc.subAccounts.find((s) => s.id !== selectedSubAccId);
        setSelectedToSubAccId(otherSub ? otherSub.id : (acc.subAccounts[0]?.id || ''));
      } else if (acc.subAccounts.length > 0) {
        setSelectedToSubAccId(acc.subAccounts[0].id);
      } else {
        setSelectedToSubAccId('');
      }
    }
  };

  const formattedDisplayAmount = amount
    ? formatMoney(parseFloat(amount) || 0, currency).replace(/[^0-9.,]/g, '').trim()
    : '0';

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={txStyles.overlay}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={txStyles.dismissArea} />
        </TouchableWithoutFeedback>

        <View style={txStyles.content}>
          <View style={txStyles.handle} />

            {/* Header */}
            <View style={txStyles.headerRow}>
              <Text style={txStyles.headerTitle}>{isEditing ? 'Edit Transaction' : 'New Transaction'}</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Math.max(16, keyboardHeight + 16) }}
            >
            {/* 1. Transaction Type Toggle (Expense, Income, Transfer) */}
            {!hideTypeSwitcher ? (
              <View style={txStyles.typeSwitcher}>
                <TouchableOpacity
                  style={[txStyles.typeTab, isExpense && txStyles.typeTabExpenseActive]}
                  onPress={() => {
                    setType('expense');
                    setSelectedCategory(expenseCategories[0]);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="arrow-up-circle"
                    size={15}
                    color={isExpense ? COLORS.danger : COLORS.textMuted}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[txStyles.typeTabText, isExpense && txStyles.typeTabTextExpense]}>
                    Expense
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[txStyles.typeTab, type === 'income' && txStyles.typeTabIncomeActive]}
                  onPress={() => {
                    setType('income');
                    setSelectedCategory(incomeCategories[0]);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="arrow-down-circle"
                    size={15}
                    color={type === 'income' ? COLORS.success : COLORS.textMuted}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[txStyles.typeTabText, type === 'income' && txStyles.typeTabTextIncome]}>
                    Income
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[txStyles.typeTab, isTransfer && txStyles.typeTabTransferActive]}
                  onPress={() => {
                    setType('transfer');
                    setSelectedCategory('Transfer');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={15}
                    color={isTransfer ? COLORS.accentUSD : COLORS.textMuted}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[txStyles.typeTabText, isTransfer && txStyles.typeTabTextTransfer]}>
                    Transfer
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* 2. Amount Input Hero Card */}
            <TouchableOpacity
              style={txStyles.amountCard}
              onPress={() => setCalcVisible(true)}
              activeOpacity={0.8}
            >
              <View style={txStyles.amountHeaderRow}>
                <Text style={txStyles.amountLabel}>AMOUNT</Text>
                <View style={txStyles.calcBadge}>
                  <Ionicons name="calculator-outline" size={13} color={COLORS.finance} style={{ marginRight: 4 }} />
                  <Text style={txStyles.calcBadgeText}>Keypad</Text>
                </View>
              </View>

              <View style={txStyles.amountValueRow}>
                <Text style={[txStyles.currencyBadge, isExpense ? txStyles.textExpense : isTransfer ? txStyles.textTransfer : txStyles.textIncome]}>
                  {currencySymbol}
                </Text>
                <Text
                  style={[txStyles.amountText, isExpense ? txStyles.textExpense : isTransfer ? txStyles.textTransfer : txStyles.textIncome]}
                  numberOfLines={1}
                >
                  {formattedDisplayAmount}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 3. Account Selection */}
            <View style={txStyles.sectionCard}>
              <Text style={txStyles.sectionLabel}>
                {type === 'income' ? 'DEPOSIT TO' : isTransfer ? 'FROM ACCOUNT' : 'PAID FROM'}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                {accounts.map((acc) => {
                  const isSelected = selectedAccId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[txStyles.accountChip, isSelected && txStyles.accountChipActive]}
                      onPress={() => handleSelectAccount(acc)}
                      activeOpacity={0.7}
                    >
                      <Text style={[txStyles.accountChipText, isSelected && txStyles.accountChipTextActive]}>
                        {acc.name} ({acc.currency})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Sub Account selection */}
              {selectedAccount && selectedAccount.subAccounts.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={txStyles.subLabel}>POCKET</Text>
                  <View style={txStyles.subAccountRow}>
                    {selectedAccount.subAccounts.map((sub) => {
                      const isSubSelected = selectedSubAccId === sub.id;
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          style={[txStyles.subChip, isSubSelected && txStyles.subChipActive]}
                          onPress={() => handleSelectSubAccount(sub.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[txStyles.subChipText, isSubSelected && txStyles.subChipTextActive]}>
                            {sub.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* 4. Target Account selection for Transfer */}
            {isTransfer && (
              <View style={txStyles.sectionCard}>
                <View style={txStyles.transferHeaderRow}>
                  <Text style={txStyles.sectionLabel}>TO ACCOUNT</Text>
                  {selectedAccount && selectedAccount.subAccounts.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleSelectToAccount(selectedAccount)}
                      activeOpacity={0.7}
                      style={[
                        txStyles.sameAccPill,
                        selectedToAccId === selectedAccId && txStyles.sameAccPillActive,
                      ]}
                    >
                      <Ionicons
                        name="repeat"
                        size={11}
                        color={selectedToAccId === selectedAccId ? '#08090C' : COLORS.finance}
                        style={{ marginRight: 3 }}
                      />
                      <Text
                        style={[
                          txStyles.sameAccPillText,
                          selectedToAccId === selectedAccId && txStyles.sameAccPillTextActive,
                        ]}
                      >
                        Sub-Account Transfer
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Account Selection */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {accounts.map((acc) => {
                    const isSelected = selectedToAccId === acc.id;
                    const isSameAccount = acc.id === selectedAccId;
                    return (
                      <TouchableOpacity
                        key={`to_${acc.id}`}
                        style={[
                          txStyles.accountChip,
                          isSelected && txStyles.accountChipActive,
                          isSameAccount && !isSelected && txStyles.accountChipSame,
                        ]}
                        onPress={() => handleSelectToAccount(acc)}
                        activeOpacity={0.7}
                      >
                        <Text style={[txStyles.accountChipText, isSelected && txStyles.accountChipTextActive]}>
                          {acc.name} ({acc.currency})
                          {isSameAccount ? ' • Same Account' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Sub Account Selection for Destination */}
                {selectedToAccount && selectedToAccount.subAccounts.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={txStyles.subLabel}>DESTINATION</Text>
                    <View style={txStyles.subAccountRow}>
                      {selectedToAccount.subAccounts.map((sub) => {
                        const isSubSelected = selectedToSubAccId === sub.id;
                        const isSameAsSourceSub = selectedToAccId === selectedAccId && sub.id === selectedSubAccId;

                        return (
                          <TouchableOpacity
                            key={`to_sub_${sub.id}`}
                            style={[
                              txStyles.subChip,
                              isSubSelected && txStyles.subChipActive,
                              isSameAsSourceSub && txStyles.subChipDisabled,
                            ]}
                            onPress={() => {
                              if (!isSameAsSourceSub && setSelectedToSubAccId) {
                                setSelectedToSubAccId(sub.id);
                              }
                            }}
                            disabled={isSameAsSourceSub}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                txStyles.subChipText,
                                isSubSelected && txStyles.subChipTextActive,
                                isSameAsSourceSub && txStyles.subChipTextDisabled,
                              ]}
                            >
                              {sub.name} {isSameAsSourceSub ? '(Source)' : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Transfer route preview */}
                {selectedAccount && selectedToAccount && (
                  <View style={txStyles.transferRoutePreview}>
                    <Ionicons name="swap-horizontal" size={14} color={COLORS.accentUSD} style={{ marginRight: 6 }} />
                    <Text style={txStyles.transferRouteText} numberOfLines={1}>
                      {selectedAccount.name} ({selectedAccount.subAccounts.find((s) => s.id === selectedSubAccId)?.name || 'Main'})
                      {'  ➔  '}
                      {selectedToAccount.name} ({selectedToAccount.subAccounts.find((s) => s.id === selectedToSubAccId)?.name || 'Main'})
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 5. Description & Date */}
            <View style={txStyles.sectionCard}>
              <Text style={txStyles.sectionLabel}>DESCRIPTION & NOTE</Text>
              <TextInput
                style={txStyles.input}
                placeholder="e.g. Lunch, Grocery, Transfer to Savings..."
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
              />

              <View style={{ marginTop: 12 }}>
                <Text style={txStyles.sectionLabel}>TRANSACTION DATE</Text>
                <TouchableOpacity style={txStyles.datePickerBtn} onPress={onOpenDatePicker} activeOpacity={0.7}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.finance} style={{ marginRight: 8 }} />
                    <Text style={txStyles.datePickerText} numberOfLines={1}>
                      {(() => {
                        const today = new Date();
                        const isToday =
                          txDate.getDate() === today.getDate() &&
                          txDate.getMonth() === today.getMonth() &&
                          txDate.getFullYear() === today.getFullYear();

                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        const isYesterday =
                          txDate.getDate() === yesterday.getDate() &&
                          txDate.getMonth() === yesterday.getMonth() &&
                          txDate.getFullYear() === yesterday.getFullYear();

                        const formattedStr = txDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        });

                        if (isToday) return `Today • ${formattedStr}`;
                        if (isYesterday) return `Yesterday • ${formattedStr}`;
                        return formattedStr;
                      })()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 6. Categories (Only for Income / Expense) */}
            {!isTransfer && (
              <View style={txStyles.sectionCard}>
                <View style={txStyles.catHeaderRow}>
                  <Text style={txStyles.sectionLabel}>CATEGORY</Text>
                  <TouchableOpacity onPress={onOpenAddCategory} activeOpacity={0.7}>
                    <Text style={txStyles.addCatText}>+ Add Category</Text>
                  </TouchableOpacity>
                </View>

                <View style={txStyles.categoriesWrap}>
                  {activeCategories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const catTheme = getCategoryTheme(cat, type === 'income' ? 'income' : 'expense', customCategoryIcons);
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[txStyles.catChip, isSelected && txStyles.catChipActive]}
                        onPress={() => setSelectedCategory(cat)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={catTheme.icon}
                          size={15}
                          color={isSelected ? '#08090C' : catTheme.color}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[txStyles.catChipText, isSelected && txStyles.catChipTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity style={txStyles.saveBtn} onPress={onSave} activeOpacity={0.85}>
              <Text style={txStyles.saveBtnText}>
                {isEditing ? 'UPDATE TRANSACTION' : 'SAVE TRANSACTION'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <CalculatorModal
        visible={calcVisible}
        initialValue={amount}
        currency={currency}
        onClose={() => setCalcVisible(false)}
        onConfirm={(val) => {
          setAmount(val);
          setCalcVisible(false);
        }}
      />
    </Modal>
  );
};

const txStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
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
    borderColor: COLORS.borderLight,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  typeTabExpenseActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  typeTabIncomeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  typeTabTransferActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  typeTabTextExpense: {
    color: COLORS.danger,
    fontWeight: '800',
  },
  typeTabTextIncome: {
    color: COLORS.success,
    fontWeight: '800',
  },
  typeTabTextTransfer: {
    color: COLORS.accentUSD,
    fontWeight: '800',
  },
  amountCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  amountHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  amountLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  calcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calcBadgeText: {
    color: COLORS.finance,
    fontSize: 10,
    fontWeight: '700',
  },
  amountValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencyBadge: {
    fontSize: 20,
    fontWeight: '800',
    marginRight: 6,
  },
  amountText: {
    fontSize: 28,
    fontWeight: '900',
  },
  textExpense: {
    color: COLORS.danger,
  },
  textIncome: {
    color: COLORS.success,
  },
  textTransfer: {
    color: COLORS.accentUSD,
  },
  sectionCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  subLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 6,
  },
  accountChip: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  accountChipActive: {
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
  },
  accountChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  accountChipTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  subAccountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subChip: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subChipActive: {
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
  },
  subChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  subChipTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '600',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePickerText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  catHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addCatText: {
    color: COLORS.finance,
    fontSize: 12,
    fontWeight: '700',
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catChipActive: {
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
  },
  catChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: COLORS.finance,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  saveBtnText: {
    color: '#08090C',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  transferHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sameAccPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  sameAccPillActive: {
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
  },
  sameAccPillText: {
    color: COLORS.finance,
    fontSize: 10,
    fontWeight: '700',
  },
  sameAccPillTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  accountChipSame: {
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  subChipDisabled: {
    opacity: 0.35,
    borderStyle: 'dashed',
  },
  subChipTextDisabled: {
    color: COLORS.textMuted,
  },
  transferRoutePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transferRouteText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
});