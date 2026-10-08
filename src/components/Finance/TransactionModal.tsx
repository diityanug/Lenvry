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
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import {
  Account,
  ACCOUNT_TYPE_THEME,
  CategoryCustomIcon,
  TX_TYPE_THEME,
  Transaction,
  formatMoney,
  getAccountIcon,
  getCategoryTheme,
  hexToRgba,
} from '../../types/finance';
import { CalculatorModal } from './CalculatorModal';
import { COLORS, RADIUS } from '../../constants/theme';
// Icon glyphs only — every colour below comes from getCategoryTheme in ../../types/finance.
import { getCategoryTheme as getCategoryIconTheme } from './CategoryBreakdownCard';

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
  onDeleteCategory,
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

  // Colour theme for the currently active transaction type
  const typeTheme = TX_TYPE_THEME[type];
  const typeIcon = isExpense ? 'arrow-up-circle' : isTransfer ? 'swap-horizontal' : 'arrow-down-circle';

  // History suggestions specifically for the clicked/selected category
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
      .slice(0, 8)
      .map((e) => e.text);
  }, [transactions, selectedCategory, type, isTransfer]);

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
              <View style={txStyles.headerTextWrap}>
                <Text style={txStyles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                  {isEditing ? 'Edit Transaction' : 'New Transaction'}
                </Text>
                <Text style={txStyles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
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
            {/* 1. Transaction Type Toggle (Expense, Income, Transfer) */}
            {!hideTypeSwitcher ? (
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
                    setSelectedCategory(expenseCategories[0]);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="arrow-up-circle"
                    size={16}
                    color={isExpense ? TX_TYPE_THEME.expense.color : COLORS.textMuted}
                    style={txStyles.typeTabIcon}
                  />
                  <Text
                    style={[
                      txStyles.typeTabText,
                      isExpense && txStyles.typeTabTextActive,
                      isExpense && { color: TX_TYPE_THEME.expense.color },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
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
                    setSelectedCategory(incomeCategories[0]);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="arrow-down-circle"
                    size={16}
                    color={type === 'income' ? TX_TYPE_THEME.income.color : COLORS.textMuted}
                    style={txStyles.typeTabIcon}
                  />
                  <Text
                    style={[
                      txStyles.typeTabText,
                      type === 'income' && txStyles.typeTabTextActive,
                      type === 'income' && { color: TX_TYPE_THEME.income.color },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
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
                  onPress={() => {
                    setType('transfer');
                    setSelectedCategory('Transfer');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={16}
                    color={isTransfer ? TX_TYPE_THEME.transfer.color : COLORS.textMuted}
                    style={txStyles.typeTabIcon}
                  />
                  <Text
                    style={[
                      txStyles.typeTabText,
                      isTransfer && txStyles.typeTabTextActive,
                      isTransfer && { color: TX_TYPE_THEME.transfer.color },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    Transfer
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* 2. Amount Input Hero Card */}
            <TouchableOpacity
              style={[
                txStyles.amountCard,
                {
                  backgroundColor: hexToRgba(typeTheme.color, 0.08),
                  borderColor: typeTheme.border,
                },
              ]}
              onPress={() => setCalcVisible(true)}
              activeOpacity={0.8}
            >
              <View style={txStyles.amountHeaderRow}>
                <Text style={txStyles.amountLabel} numberOfLines={1}>AMOUNT</Text>
                <View
                  style={[
                    txStyles.calcBadge,
                    {
                      backgroundColor: hexToRgba(typeTheme.color, 0.14),
                      borderColor: typeTheme.border,
                    },
                  ]}
                >
                  <Ionicons name="calculator-outline" size={13} color={typeTheme.color} style={txStyles.calcBadgeIcon} />
                  <Text style={[txStyles.calcBadgeText, { color: typeTheme.color }]} numberOfLines={1}>
                    Keypad
                  </Text>
                </View>
              </View>

              <View style={txStyles.amountValueRow}>
                <Text style={[txStyles.currencyBadge, { color: typeTheme.color }]} numberOfLines={1}>
                  {currencySymbol}
                </Text>
                <Text
                  style={[txStyles.amountText, { color: typeTheme.color }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {formattedDisplayAmount}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 3. Account Selection */}
            <View style={txStyles.sectionCard}>
              <Text style={txStyles.sectionLabel} numberOfLines={1} ellipsizeMode="tail">
                {type === 'income' ? 'DEPOSIT TO' : isTransfer ? 'FROM ACCOUNT' : 'PAID FROM'}
              </Text>

              <ScrollView
                horizontal
                nestedScrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={txStyles.hScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {accounts.map((acc) => {
                  const isSelected = selectedAccId === acc.id;
                  const accTheme = ACCOUNT_TYPE_THEME[acc.type];
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[
                        txStyles.accountChip,
                        { backgroundColor: accTheme.bg, borderColor: accTheme.border },
                        isSelected && {
                          backgroundColor: accTheme.color,
                          borderColor: accTheme.color,
                        },
                      ]}
                      onPress={() => handleSelectAccount(acc)}
                      activeOpacity={0.7}
                    >
                      <FontAwesome5
                        name={getAccountIcon(acc.type)}
                        size={14}
                        color={isSelected ? '#08090C' : accTheme.color}
                        style={txStyles.chipIcon}
                      />
                      <Text
                        style={[txStyles.accountChipText, isSelected && txStyles.accountChipTextActive]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {acc.name} ({acc.currency})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Sub Account selection */}
              {selectedAccount && selectedAccount.subAccounts.length > 0 && (
                <View style={txStyles.subBlock}>
                  <Text style={txStyles.subLabel} numberOfLines={1}>POCKET</Text>
                  <ScrollView
                    horizontal
                    nestedScrollEnabled={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={txStyles.hScrollContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    {selectedAccount.subAccounts.map((sub) => {
                      const isSubSelected = selectedSubAccId === sub.id;
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          style={[txStyles.subChip, isSubSelected && txStyles.subChipActive]}
                          onPress={() => handleSelectSubAccount(sub.id)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[txStyles.subChipText, isSubSelected && txStyles.subChipTextActive]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {sub.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* 4. Target Account selection for Transfer */}
            {isTransfer && (
              <View style={txStyles.sectionCard}>
                <View style={txStyles.transferHeaderRow}>
                  <Text style={txStyles.sectionLabelInline} numberOfLines={1} ellipsizeMode="tail">TO ACCOUNT</Text>
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
                        size={12}
                        color={selectedToAccId === selectedAccId ? '#08090C' : COLORS.finance}
                        style={txStyles.chipIcon}
                      />
                      <Text
                        style={[
                          txStyles.sameAccPillText,
                          selectedToAccId === selectedAccId && txStyles.sameAccPillTextActive,
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        Sub-Account Transfer
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Account Selection */}
                <ScrollView
                  horizontal
                  nestedScrollEnabled={true}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={txStyles.hScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {accounts.map((acc) => {
                    const isSelected = selectedToAccId === acc.id;
                    const isSameAccount = acc.id === selectedAccId;
                    const accTheme = ACCOUNT_TYPE_THEME[acc.type];
                    return (
                      <TouchableOpacity
                        key={`to_${acc.id}`}
                        style={[
                          txStyles.accountChip,
                          { backgroundColor: accTheme.bg, borderColor: accTheme.border },
                          isSameAccount && !isSelected && txStyles.accountChipSame,
                          isSelected && {
                            backgroundColor: accTheme.color,
                            borderColor: accTheme.color,
                          },
                        ]}
                        onPress={() => handleSelectToAccount(acc)}
                        activeOpacity={0.7}
                      >
                        <FontAwesome5
                          name={getAccountIcon(acc.type)}
                          size={14}
                          color={isSelected ? '#08090C' : accTheme.color}
                          style={txStyles.chipIcon}
                        />
                        <Text
                          style={[txStyles.accountChipText, isSelected && txStyles.accountChipTextActive]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {acc.name} ({acc.currency})
                          {isSameAccount ? ' • Same Account' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Sub Account Selection for Destination */}
                {selectedToAccount && selectedToAccount.subAccounts.length > 0 && (
                  <View style={txStyles.subBlock}>
                    <Text style={txStyles.subLabel} numberOfLines={1}>DESTINATION</Text>
                    <ScrollView
                      horizontal
                      nestedScrollEnabled={true}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={txStyles.hScrollContent}
                      keyboardShouldPersistTaps="handled"
                    >
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
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {sub.name} {isSameAsSourceSub ? '(Source)' : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Transfer route preview */}
                {selectedAccount && selectedToAccount && (
                  <View style={txStyles.transferRoutePreview}>
                    <Ionicons name="swap-horizontal" size={15} color={COLORS.accentUSD} style={txStyles.chipIcon} />
                    <Text style={txStyles.transferRouteText} numberOfLines={1} ellipsizeMode="tail">
                      {selectedAccount.name} ({selectedAccount.subAccounts.find((s) => s.id === selectedSubAccId)?.name || 'Main'})
                      {'  ➔  '}
                      {selectedToAccount.name} ({selectedToAccount.subAccounts.find((s) => s.id === selectedToSubAccId)?.name || 'Main'})
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 5. Categories (Only for Income / Expense) - 1:1 Aspect Ratio Symmetrical Grid */}
            {!isTransfer && (
              <View style={txStyles.sectionCard}>
                <View style={txStyles.catHeaderRow}>
                  <Text style={txStyles.sectionLabelInline} numberOfLines={1} ellipsizeMode="tail">CATEGORY</Text>
                  <TouchableOpacity onPress={onOpenAddCategory} activeOpacity={0.7} style={txStyles.addCatBtn}>
                    <Ionicons name="add" size={14} color={COLORS.finance} style={txStyles.chipIcon} />
                    <Text style={txStyles.addCatText} numberOfLines={1}>Add Category</Text>
                  </TouchableOpacity>
                </View>

                <View style={txStyles.categoriesWrap}>
                  {activeCategories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const catTheme = getCategoryTheme(cat, customCategoryIcons);
                    const catIcon = getCategoryIconTheme(cat, type === 'income' ? 'income' : 'expense', customCategoryIcons);
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          txStyles.catSquare,
                          { backgroundColor: catTheme.bg, borderColor: catTheme.border },
                          isSelected && {
                            backgroundColor: hexToRgba(catTheme.color, 0.28),
                            borderColor: catTheme.color,
                          },
                        ]}
                        onPress={() => setSelectedCategory(cat)}
                        onLongPress={() => onDeleteCategory?.(cat)}
                        delayLongPress={400}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            txStyles.catIconCircle,
                            { backgroundColor: isSelected ? catTheme.color : hexToRgba(catTheme.color, 0.22) },
                          ]}
                        >
                          <Ionicons
                            name={catIcon.icon}
                            size={18}
                            color={isSelected ? '#08090C' : catTheme.color}
                          />
                        </View>
                        <Text
                          style={[txStyles.catSquareText, isSelected && txStyles.catSquareTextActive]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 6. Description & Date with Frequent Suggestions */}
            <View style={txStyles.sectionCard}>
              <Text style={txStyles.sectionLabel} numberOfLines={1} ellipsizeMode="tail">DESCRIPTION &amp; NOTE</Text>
              <TextInput
                style={txStyles.input}
                placeholder="e.g. Lunch, Grocery, Transfer to Savings..."
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
              />

              {!isTransfer && descriptionSuggestions.length > 0 && (
                <View style={txStyles.suggestBlock}>
                  <Text style={txStyles.suggestLabel} numberOfLines={1} ellipsizeMode="tail">
                    SUGGESTIONS • {selectedCategory.toUpperCase()}
                  </Text>
                  <ScrollView
                    horizontal
                    nestedScrollEnabled={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={txStyles.hScrollContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    {descriptionSuggestions.map((text) => (
                      <TouchableOpacity
                        key={text}
                        style={txStyles.suggestChip}
                        onPress={() => setDescription(text)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="time-outline" size={12} color={COLORS.finance} style={txStyles.chipIcon} />
                        <Text style={txStyles.suggestChipText} numberOfLines={1} ellipsizeMode="tail">
                          {text}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={txStyles.dateBlock}>
                <Text style={txStyles.sectionLabel} numberOfLines={1} ellipsizeMode="tail">TRANSACTION DATE</Text>
                <TouchableOpacity style={txStyles.datePickerBtn} onPress={onOpenDatePicker} activeOpacity={0.7}>
                  <View style={txStyles.datePickerLeft}>
                    <Ionicons name="calendar-outline" size={17} color={COLORS.finance} style={txStyles.chipIcon} />
                    <Text
                      style={txStyles.datePickerText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
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
                  <Ionicons name="chevron-forward" size={15} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[txStyles.saveBtn, { backgroundColor: typeTheme.color }]}
              onPress={onSave}
              activeOpacity={0.85}
            >
              <Ionicons name={typeIcon as any} size={16} color="#08090C" style={txStyles.chipIcon} />
              <Text style={txStyles.saveBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 26,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  handle: {
    width: 44,
    height: 4,
    backgroundColor: COLORS.borderHighlight,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
  },
  scrollContent: {
    gap: 12,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeTab: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    flexShrink: 1,
  },
  typeTabTextActive: {
    fontWeight: '900',
  },
  typeTabIcon: {
    marginRight: 5,
  },
  amountCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amountHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  amountLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    flexShrink: 1,
  },
  calcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
  },
  calcBadgeIcon: {
    marginRight: 5,
  },
  calcBadgeText: {
    color: COLORS.finance,
    fontSize: 10.5,
    fontWeight: '800',
  },
  amountValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  currencyBadge: {
    fontSize: 22,
    fontWeight: '900',
    flexShrink: 0,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
    flexShrink: 1,
    minWidth: 0,
    fontVariant: ['tabular-nums'],
  },
  sectionCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionLabelInline: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    flexShrink: 1,
    minWidth: 0,
  },
  subLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  subBlock: {
    marginTop: 2,
  },
  hScrollContent: {
    gap: 8,
    paddingRight: 4,
    paddingVertical: 1,
  },
  chipIcon: {
    marginRight: 6,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 240,
  },
  accountChipSame: {
    borderStyle: 'dashed',
  },
  accountChipText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  accountChipTextActive: {
    color: '#08090C',
    fontWeight: '900',
  },
  subChip: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 220,
  },
  subChipActive: {
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
  },
  subChipText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  subChipTextActive: {
    color: '#08090C',
    fontWeight: '900',
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
    color: COLORS.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '600',
  },
  dateBlock: {
    marginTop: 2,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    minHeight: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  datePickerText: {
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  catHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  addCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.financeLight,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    flexShrink: 0,
  },
  addCatText: {
    color: COLORS.finance,
    fontSize: 12,
    fontWeight: '800',
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catSquare: {
    width: '31.3%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 12,
    minHeight: 76,
  },
  catIconCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catSquareText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
    alignSelf: 'stretch',
    letterSpacing: -0.2,
  },
  catSquareTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '900',
  },
  suggestBlock: {
    marginTop: 2,
  },
  suggestLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    maxWidth: 240,
  },
  suggestChipText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.finance,
    borderRadius: RADIUS.md,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 4,
    marginBottom: 4,
  },
  saveBtnText: {
    color: '#08090C',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  transferHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  sameAccPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    flexShrink: 0,
  },
  sameAccPillActive: {
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
  },
  sameAccPillText: {
    color: COLORS.finance,
    fontSize: 11,
    fontWeight: '800',
  },
  sameAccPillTextActive: {
    color: '#08090C',
    fontWeight: '900',
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
    backgroundColor: hexToRgba('#818CF8', 0.12),
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    minHeight: 48,
    marginTop: 2,
    borderWidth: 1,
    borderColor: hexToRgba('#818CF8', 0.34),
  },
  transferRouteText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
});
