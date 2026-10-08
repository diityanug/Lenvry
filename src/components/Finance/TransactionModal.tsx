import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import {
  Account,
  CategoryCustomIcon,
  TX_TYPE_THEME,
  Transaction,
  formatMoney,
} from '../../types/finance';
import { CalculatorModal } from './CalculatorModal';
import { getCategoryTheme as getCategoryVisualTheme } from './CategoryBreakdownCard';
import { FormAccountSelector } from './form/FormAccountSelector';
import { FormCategorySelector } from './form/FormCategorySelector';

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
  transactions?: Transaction[];
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
  onDeleteCategory?: (cat: string) => void;
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
  transactions = [],
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
  const currency = selectedAccount?.currency || 'IDR';
  const currencySymbol = currency === 'USD' ? '$' : 'Rp';
  const isExpense = type === 'expense';
  const isTransfer = type === 'transfer';
  const activeCategories = isExpense ? expenseCategories : incomeCategories;

  const typeTheme = TX_TYPE_THEME[type];
  const typeIcon = isExpense ? 'arrow-up-circle' : isTransfer ? 'swap-horizontal' : 'arrow-down-circle';

  // Suggestions from previous transactions
  const descriptionSuggestions = React.useMemo(() => {
    if (isTransfer || !selectedCategory) return [];
    const counts = new Map<string, { text: string; count: number; last: number }>();

    for (const t of transactions) {
      if (t.type !== type || t.category !== selectedCategory) continue;
      const text = (t.description || '').trim();
      if (!text) continue;
      const key = text.toLowerCase();
      const time = new Date(t.date).getTime();
      const prev = counts.get(key);

      if (prev) {
        prev.count += 1;
        prev.last = Math.max(prev.last, time);
      } else {
        counts.set(key, { text, count: 1, last: time });
      }
    }

    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count || b.last - a.last)
      .slice(0, 6)
      .map((e) => e.text);
  }, [transactions, selectedCategory, type, isTransfer]);

  const handleSelectAccount = (acc: Account) => {
    setSelectedAccId(acc.id);
    const newSubId = acc.subAccounts && acc.subAccounts.length > 0 ? acc.subAccounts[0].id : '';
    setSelectedSubAccId(newSubId);
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
        const otherSub = acc.subAccounts.find((s) => s.id !== selectedSubAccId);
        setSelectedToSubAccId(otherSub ? otherSub.id : (acc.subAccounts[0]?.id || ''));
      } else if (acc.subAccounts && acc.subAccounts.length > 0) {
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
            <View style={txStyles.headerTextWrap}>
              <Text style={txStyles.headerTitle} numberOfLines={1}>
                {isEditing ? 'Edit Transaction' : 'New Transaction'}
              </Text>
              <Text style={txStyles.headerSubtitle} numberOfLines={1}>
                {typeTheme.label} • {currency}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={txStyles.closeBtn}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={[
              txStyles.scrollContent,
              { paddingBottom: Math.max(28, keyboardHeight + 28) },
            ]}
          >
            {/* Transaction Type Toggle */}
            {!hideTypeSwitcher && (
              <View style={txStyles.typeSwitcher}>
                <TouchableOpacity
                  style={[
                    txStyles.typeTab,
                    isExpense && {
                      backgroundColor: TX_TYPE_THEME.expense.bg,
                      borderColor: TX_TYPE_THEME.expense.border,
                    },
                  ]}
                  onPress={() => {
                    setType('expense');
                    setSelectedCategory(expenseCategories[0] || 'Food');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="arrow-up-circle"
                    size={16}
                    color={isExpense ? TX_TYPE_THEME.expense.color : COLORS.textMuted}
                  />
                  <Text style={[txStyles.typeTabText, isExpense && { color: TX_TYPE_THEME.expense.color, fontWeight: '700' }]}>
                    Expense
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    txStyles.typeTab,
                    type === 'income' && {
                      backgroundColor: TX_TYPE_THEME.income.bg,
                      borderColor: TX_TYPE_THEME.income.border,
                    },
                  ]}
                  onPress={() => {
                    setType('income');
                    setSelectedCategory(incomeCategories[0] || 'Salary');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="arrow-down-circle"
                    size={16}
                    color={type === 'income' ? TX_TYPE_THEME.income.color : COLORS.textMuted}
                  />
                  <Text style={[txStyles.typeTabText, type === 'income' && { color: TX_TYPE_THEME.income.color, fontWeight: '700' }]}>
                    Income
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    txStyles.typeTab,
                    isTransfer && {
                      backgroundColor: TX_TYPE_THEME.transfer.bg,
                      borderColor: TX_TYPE_THEME.transfer.border,
                    },
                  ]}
                  onPress={() => setType('transfer')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={16}
                    color={isTransfer ? TX_TYPE_THEME.transfer.color : COLORS.textMuted}
                  />
                  <Text style={[txStyles.typeTabText, isTransfer && { color: TX_TYPE_THEME.transfer.color, fontWeight: '700' }]}>
                    Transfer
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Amount Input & Calculator */}
            <View style={txStyles.amountCard}>
              <Text style={txStyles.amountLabel}>AMOUNT</Text>
              <View style={txStyles.amountInputRow}>
                <Text style={[txStyles.currencyPrefix, { color: typeTheme.color }]}>
                  {currencySymbol}
                </Text>
                <TextInput
                  style={[txStyles.amountInput, { color: typeTheme.color }]}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={(val) => setAmount(val.replace(/[^0-9]/g, ''))}
                  maxLength={15}
                />
                <TouchableOpacity
                  style={txStyles.calcBtn}
                  onPress={() => setCalcVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calculator-outline" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              {amount !== '' && (
                <Text style={txStyles.formattedSubAmount}>
                  {currencySymbol} {formattedDisplayAmount}
                </Text>
              )}
            </View>

            {/* Account Selectors */}
            <FormAccountSelector
              label={isTransfer ? 'From Account' : 'Account'}
              accounts={accounts}
              selectedAccId={selectedAccId}
              selectedSubAccId={selectedSubAccId}
              onSelectAccount={handleSelectAccount}
              onSelectSubAccount={handleSelectSubAccount}
            />

            {isTransfer && (
              <FormAccountSelector
                label="To Destination Account"
                accounts={accounts}
                selectedAccId={selectedToAccId}
                selectedSubAccId={selectedToSubAccId}
                onSelectAccount={handleSelectToAccount}
                onSelectSubAccount={(subId) => setSelectedToSubAccId && setSelectedToSubAccId(subId)}
              />
            )}

            {/* Category Selector */}
            {!isTransfer && (
              <FormCategorySelector
                categories={activeCategories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onOpenAddCategory={onOpenAddCategory}
                getCategoryTheme={(cat) => getCategoryVisualTheme(cat, isExpense ? 'expense' : 'income', customCategoryIcons)}
                type={isExpense ? 'expense' : 'income'}
              />
            )}

            {/* Description Input & Suggestions */}
            <View style={txStyles.fieldSection}>
              <Text style={txStyles.sectionTitle}>DESCRIPTION</Text>
              <TextInput
                style={txStyles.textInput}
                placeholder="e.g. Starbucks, Groceries..."
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
                maxLength={100}
              />
              {descriptionSuggestions.length > 0 && (
                <View style={txStyles.suggestionsRow}>
                  {descriptionSuggestions.map((sug, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={txStyles.sugChip}
                      onPress={() => setDescription(sug)}
                      activeOpacity={0.7}
                    >
                      <Text style={txStyles.sugText}>{sug}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Date Picker Trigger */}
            <View style={txStyles.fieldSection}>
              <Text style={txStyles.sectionTitle}>DATE</Text>
              <TouchableOpacity
                style={txStyles.datePickerTrigger}
                onPress={onOpenDatePicker}
                activeOpacity={0.7}
              >
                <View style={txStyles.datePickerLeft}>
                  <Ionicons name="calendar-outline" size={17} color={COLORS.finance} />
                  <Text style={txStyles.datePickerText}>
                    {txDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[txStyles.saveBtn, { backgroundColor: typeTheme.color }]}
              onPress={onSave}
              activeOpacity={0.85}
            >
              <Ionicons name={typeIcon as any} size={16} color="#08090C" />
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
    backgroundColor: 'rgba(5, 6, 9, 0.75)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderSubtle,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 4,
    gap: 4,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeTabText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  amountCard: {
    marginTop: 16,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    padding: 0,
  },
  calcBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCardHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formattedSubAmount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  fieldSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  sugChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  sugText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  datePickerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  datePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    marginTop: 24,
    marginBottom: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#08090C',
    letterSpacing: 0.5,
  },
});
