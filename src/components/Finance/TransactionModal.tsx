import React, { useState } from 'react';
import {
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Account, formatMoney } from '../../types/finance';
import { CalculatorModal } from './CalculatorModal';

interface TransactionModalProps {
  visible: boolean;
  type: 'income' | 'expense';
  amount: string;
  description: string;
  txDate: Date;
  selectedCategory: string;
  selectedAccId: string;
  selectedSubAccId: string;
  accounts: Account[];
  expenseCategories: string[];
  incomeCategories: string[];
  onClose: () => void;
  onSave: () => void;
  setType: (t: 'income' | 'expense') => void;
  setAmount: (val: string) => void;
  setDescription: (val: string) => void;
  setSelectedCategory: (cat: string) => void;
  setSelectedAccId: (id: string) => void;
  setSelectedSubAccId: (id: string) => void;
  onOpenDatePicker: () => void;
  onOpenAddCategory: () => void;
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
  accounts,
  expenseCategories,
  incomeCategories,
  onClose,
  onSave,
  setType,
  setAmount,
  setDescription,
  setSelectedCategory,
  setSelectedAccId,
  setSelectedSubAccId,
  onOpenDatePicker,
  onOpenAddCategory,
}: TransactionModalProps) => {
  const [calcVisible, setCalcVisible] = useState(false);

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccId);
  const currency = selectedAccount?.currency || 'IDR';
  const currencySymbol = currency === 'USD' ? '$' : 'Rp';
  const isExpense = type === 'expense';
  const activeCategories = isExpense ? expenseCategories : incomeCategories;

  const handleSelectAccount = (acc: Account) => {
    setSelectedAccId(acc.id);
    if (acc.subAccounts.length > 0) {
      setSelectedSubAccId(acc.subAccounts[0].id);
    } else {
      setSelectedSubAccId('');
    }
  };

  const formattedDisplayAmount = amount
    ? formatMoney(parseFloat(amount) || 0, currency).replace(/[^0-9.,]/g, '').trim()
    : '0';

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={txStyles.overlay}
      >
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={txStyles.dismissArea} />
        </TouchableWithoutFeedback>

        <View style={txStyles.content}>
          <View style={txStyles.handle} />

          {/* Header */}
          <View style={txStyles.headerRow}>
            <Text style={txStyles.headerTitle}>New Transaction</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={26} color="#52525B" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* 1. Transaction Type Toggle */}
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
                  size={18}
                  color={isExpense ? '#FF453A' : '#71717A'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[txStyles.typeTabText, isExpense && txStyles.typeTabTextExpense]}>
                  Expense
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[txStyles.typeTab, !isExpense && txStyles.typeTabIncomeActive]}
                onPress={() => {
                  setType('income');
                  setSelectedCategory(incomeCategories[0]);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={18}
                  color={!isExpense ? '#4ADE80' : '#71717A'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[txStyles.typeTabText, !isExpense && txStyles.typeTabTextIncome]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Amount Input Hero Card (Tap to open Calculator Keypad) */}
            <TouchableOpacity
              style={txStyles.amountCard}
              onPress={() => setCalcVisible(true)}
              activeOpacity={0.8}
            >
              <View style={txStyles.amountHeaderRow}>
                <Text style={txStyles.amountLabel}>AMOUNT (TAP TO CALCULATE)</Text>
                <View style={txStyles.calcBadge}>
                  <Ionicons name="calculator-outline" size={13} color="#38BDF8" style={{ marginRight: 4 }} />
                  <Text style={txStyles.calcBadgeText}>Keypad</Text>
                </View>
              </View>

              <View style={txStyles.amountValueRow}>
                <Text style={[txStyles.currencyBadge, isExpense ? txStyles.textExpense : txStyles.textIncome]}>
                  {currencySymbol}
                </Text>
                <Text
                  style={[txStyles.amountText, isExpense ? txStyles.textExpense : txStyles.textIncome]}
                  numberOfLines={1}
                >
                  {formattedDisplayAmount}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 3. Payment Account & Pocket */}
            <View style={txStyles.sectionCard}>
              <Text style={txStyles.sectionLabel}>PAYMENT ACCOUNT</Text>

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
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={14}
                        color={isSelected ? '#38BDF8' : '#71717A'}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[txStyles.accountChipText, isSelected && txStyles.accountChipTextActive]}>
                        {acc.name}
                      </Text>
                      <Text style={txStyles.currencyTag}>{acc.currency}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {selectedAccount && selectedAccount.subAccounts.length > 0 && (
                <View style={txStyles.subAccountArea}>
                  <Text style={txStyles.subSectionLabel}>Select Pocket / Sub-Account:</Text>
                  <View style={txStyles.subChipsWrap}>
                    {selectedAccount.subAccounts.map((sub) => {
                      const isSubSelected = selectedSubAccId === sub.id;
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          style={[txStyles.subChip, isSubSelected && txStyles.subChipActive]}
                          onPress={() => setSelectedSubAccId(sub.id)}
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

            {/* 4. Details (Date & Description) */}
            <View style={txStyles.sectionCard}>
              <Text style={txStyles.sectionLabel}>TRANSACTION DETAILS</Text>

              <TouchableOpacity
                style={txStyles.dateSelectorRow}
                onPress={onOpenDatePicker}
                activeOpacity={0.7}
              >
                <View style={txStyles.dateLeftWrap}>
                  <Ionicons name="calendar-outline" size={16} color="#38BDF8" style={{ marginRight: 8 }} />
                  <Text style={txStyles.dateLabelText}>Date</Text>
                </View>
                <Text style={txStyles.dateValueText}>
                  {txDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={txStyles.descriptionInput}
                placeholder="Description (e.g. Groceries, Coffee, Salary)"
                placeholderTextColor="#52525B"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* 5. Categories */}
            <View style={txStyles.sectionCard}>
              <Text style={txStyles.sectionLabel}>CATEGORY</Text>
              <View style={txStyles.categoriesWrap}>
                {activeCategories.map((cat) => {
                  const isCatSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[txStyles.categoryChip, isCatSelected && txStyles.categoryChipActive]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          txStyles.categoryChipText,
                          isCatSelected && txStyles.categoryChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={txStyles.addCategoryChip}
                  onPress={onOpenAddCategory}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={15} color="#38BDF8" />
                  <Text style={txStyles.addCategoryText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 6. Save Button */}
            <TouchableOpacity style={txStyles.saveButton} onPress={onSave} activeOpacity={0.85}>
              <Text style={txStyles.saveButtonText}>SAVE TRANSACTION</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Embedded Keypad Calculator Modal */}
      <CalculatorModal
        visible={calcVisible}
        initialValue={amount}
        currency={currency}
        title="Transaction Amount"
        onClose={() => setCalcVisible(false)}
        onConfirm={(val) => setAmount(val)}
      />
    </Modal>
  );
};

const txStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#3F3F46',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerTitle: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '800',
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#09090B',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  typeTabExpenseActive: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderWidth: 1,
    borderColor: '#FF453A',
  },
  typeTabIncomeActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  typeTabText: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '700',
  },
  typeTabTextExpense: {
    color: '#FF453A',
  },
  typeTabTextIncome: {
    color: '#4ADE80',
  },
  amountCard: {
    backgroundColor: '#09090B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#27272A',
    marginBottom: 14,
  },
  amountHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  calcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  calcBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  amountValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencyBadge: {
    fontSize: 26,
    fontWeight: '900',
    marginRight: 8,
  },
  amountText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  textExpense: {
    color: '#FF453A',
  },
  textIncome: {
    color: '#4ADE80',
  },
  sectionCard: {
    backgroundColor: '#09090B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 14,
  },
  sectionLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    marginRight: 10,
  },
  accountChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38BDF8',
  },
  accountChipText: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '600',
  },
  accountChipTextActive: {
    color: '#FAFAFA',
    fontWeight: '700',
  },
  currencyTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#52525B',
    marginLeft: 6,
  },
  subAccountArea: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#18181B',
  },
  subSectionLabel: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  subChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subChip: {
    backgroundColor: '#18181B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  subChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  subChipText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
  },
  subChipTextActive: {
    color: '#09090B',
    fontWeight: '800',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181B',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 10,
  },
  dateLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabelText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
  },
  dateValueText: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '700',
  },
  descriptionInput: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FAFAFA',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#18181B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  categoryChipActive: {
    backgroundColor: '#FAFAFA',
    borderColor: '#FAFAFA',
  },
  categoryChipText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#09090B',
    fontWeight: '800',
  },
  addCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderStyle: 'dashed',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addCategoryText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#38BDF8',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#09090B',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});