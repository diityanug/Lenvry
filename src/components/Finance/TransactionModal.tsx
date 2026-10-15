import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  BackHandler,
  Keyboard,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { COLORS, RADIUS } from '../../constants/theme';
import {
  Account,
  CategoryCustomIcon,
  TX_TYPE_THEME,
  Transaction,
} from '../../types/finance';
import {
  evaluateArithmetic,
  evaluateArithmeticStr,
  formatCalculatedDisplay,
  formatExpression,
  hasMathOperators,
} from '../../utils/math';
import { hapticLight } from '../../utils/haptics';
import { getCategoryTheme as getCategoryVisualTheme } from './CategoryBreakdownCard';
import { FormAccountSelector } from './form/FormAccountSelector';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { FormCategorySelector } from './form/FormCategorySelector';
import { CalculatorKeypad } from './CalculatorKeypad';

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
  toAmount?: string;
  setToAmount?: (val: string) => void;
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
  toAmount = '',
  setToAmount,
}: TransactionModalProps) => {
  const [activeKeypad, setActiveKeypad] = React.useState<'amount' | 'toAmount' | null>(null);
  const [prevVisible, setPrevVisible] = React.useState(visible);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();

  if (prevVisible !== visible) {
    setPrevVisible(visible);
    setActiveKeypad(null);
  }

  const handleDismiss = () => {
    Keyboard.dismiss();
    if (activeKeypad !== null) {
      setActiveKeypad(null);
      return;
    }
    onClose();
  };

  const handleRequestClose = () => {
    Keyboard.dismiss();
    if (activeKeypad !== null) {
      setActiveKeypad(null);
      return;
    }
    onClose();
  };

  // Intercept smartphone back button or edge back swipe gesture:
  // Dismiss calculator keypad first before closing the modal
  React.useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      if (activeKeypad !== null) {
        setActiveKeypad(null);
        return true; // Event consumed, prevents closing the modal
      }
      return false; // Allow standard modal close
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [visible, activeKeypad]);

  // Swipe-down gesture detector on keypad area to smoothly dismiss it
  const keypadPanResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy > 15 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 30 || gestureState.vy > 0.4) {
            setActiveKeypad(null);
          }
        },
      }),
    []
  );

  const selectedAccount = accounts.find((a) => a.id === selectedAccId);
  const selectedToAccount = type === 'transfer' ? accounts.find((a) => a.id === selectedToAccId) : undefined;
  const currency = selectedAccount?.currency || 'IDR';
  const toCurrency = selectedToAccount?.currency || currency;
  const currencySymbol = currency === 'USD' ? '$' : 'Rp';
  const toCurrencySymbol = toCurrency === 'USD' ? '$' : 'Rp';
  const isCrossCurrency = type === 'transfer' && Boolean(selectedAccount && selectedToAccount && currency !== toCurrency);

  const isExpense = type === 'expense';
  const isTransfer = type === 'transfer';
  const activeCategories = isExpense ? expenseCategories : incomeCategories;

  const typeTheme = TX_TYPE_THEME[type];
  const typeIcon = isExpense ? 'arrow-up-circle' : isTransfer ? 'swap-horizontal' : 'arrow-down-circle';

  const effectiveExchangeRate = React.useMemo(() => {
    if (!isCrossCurrency) return 0;
    const sendVal = evaluateArithmetic(amount);
    const recvVal = evaluateArithmetic(toAmount);
    if (sendVal <= 0 || recvVal <= 0) return 0;
    if (currency === 'IDR' && toCurrency === 'USD') {
      return sendVal / recvVal;
    }
    if (currency === 'USD' && toCurrency === 'IDR') {
      return recvVal / sendVal;
    }
    return 0;
  }, [isCrossCurrency, amount, toAmount, currency, toCurrency]);

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

  React.useEffect(() => {
    if (visible) {
      if (amount && !hasMathOperators(amount)) {
        const formatted = formatExpression(amount, currency);
        if (formatted !== amount) setAmount(formatted);
      }
      if (toAmount && !hasMathOperators(toAmount) && setToAmount) {
        const formattedTo = formatExpression(toAmount, toCurrency);
        if (formattedTo !== toAmount) setToAmount(formattedTo);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, currency, toCurrency]);

  const evaluatedAmountStr = React.useMemo(() => evaluateArithmeticStr(amount, currency), [amount, currency]);
  const isAmountMath = React.useMemo(() => hasMathOperators(amount), [amount]);
  const formattedDisplayAmount = formatCalculatedDisplay(evaluatedAmountStr, currency);

  const evaluatedToAmountStr = React.useMemo(() => evaluateArithmeticStr(toAmount, toCurrency), [toAmount, toCurrency]);
  const isToAmountMath = React.useMemo(() => hasMathOperators(toAmount), [toAmount]);
  const formattedDisplayToAmount = formatCalculatedDisplay(evaluatedToAmountStr, toCurrency);

  const amountFontSize = amount.length > 24 ? 16 : amount.length > 16 ? 20 : 26;
  const toAmountFontSize = toAmount.length > 24 ? 16 : toAmount.length > 16 ? 20 : 26;
  const previewFontSize = formattedDisplayAmount.length > 30 ? 10 : 12;
  const toPreviewFontSize = formattedDisplayToAmount.length > 30 ? 10 : 12;

  const openAmountKeypad = () => {
    Keyboard.dismiss();
    setActiveKeypad('amount');
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const openToAmountKeypad = () => {
    Keyboard.dismiss();
    setActiveKeypad('toAmount');
    scrollViewRef.current?.scrollTo({ y: 70, animated: true });
  };

  const handleSave = () => {
    setActiveKeypad(null);
    if (isAmountMath) {
      const res = evaluateArithmeticStr(amount, currency);
      if (res && res !== '0') setAmount(formatCalculatedDisplay(res, currency));
    }
    if (isCrossCurrency && isToAmountMath && setToAmount) {
      const resTo = evaluateArithmeticStr(toAmount, toCurrency);
      if (resTo && resTo !== '0') setToAmount(formatCalculatedDisplay(resTo, toCurrency));
    }
    onSave();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={handleRequestClose}>
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
              onPress={handleDismiss}
              activeOpacity={0.7}
              style={txStyles.closeBtn}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            onScrollBeginDrag={() => {
              Keyboard.dismiss();
              setActiveKeypad(null);
            }}
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

            {/* Amount Input Area */}
            <TouchableOpacity
              style={[
                txStyles.amountCard,
                activeKeypad === 'amount' && {
                  borderColor: typeTheme.color,
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                },
              ]}
              onPress={openAmountKeypad}
              activeOpacity={0.9}
            >
              <Text style={txStyles.amountLabel}>
                {isCrossCurrency ? `SENT AMOUNT (${currency})` : 'AMOUNT'}
              </Text>

              <View style={txStyles.amountInputRow}>
                <Text style={[txStyles.currencyPrefix, { color: typeTheme.color }]}>
                  {currencySymbol}
                </Text>
                <TextInput
                  style={[txStyles.amountInput, { color: typeTheme.color, fontSize: amountFontSize }]}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  showSoftInputOnFocus={false}
                  value={amount}
                  onFocus={openAmountKeypad}
                  onPressIn={openAmountKeypad}
                  editable={true}
                />
                <View style={txStyles.clearInputPlaceholder}>
                  {amount !== '' && (
                    <TouchableOpacity
                      style={txStyles.clearInputBtn}
                      onPress={() => {
                        hapticLight();
                        setAmount('');
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel="Clear amount"
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Fixed-Height Calculation & Sub-Amount Line */}
              <View style={txStyles.amountPreviewContainer}>
                {isAmountMath ? (
                  <Text
                    style={[
                      txStyles.formattedSubAmount,
                      { color: typeTheme.color, fontWeight: '700', fontSize: previewFontSize },
                    ]}
                    numberOfLines={1}
                  >
                    = {currencySymbol} {formattedDisplayAmount}
                  </Text>
                ) : (
                  <Text style={[txStyles.formattedSubAmount, { fontSize: previewFontSize }]} numberOfLines={1}>
                    {currencySymbol} {formattedDisplayAmount}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Received Amount Input for Cross-Currency Transfer */}
            {isCrossCurrency && (
              <TouchableOpacity
                style={[
                  txStyles.amountCard,
                  txStyles.receivedCard,
                  activeKeypad === 'toAmount' && {
                    borderColor: COLORS.finance,
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  },
                ]}
                onPress={openToAmountKeypad}
                activeOpacity={0.9}
              >
                <View style={txStyles.receivedLabelRow}>
                  <Text style={[txStyles.amountLabel, { color: COLORS.finance, marginBottom: 0 }]}>
                    RECEIVED AMOUNT ({toCurrency})
                  </Text>
                  <View style={txStyles.receivedPill}>
                    <Text style={txStyles.receivedPillText}>{toCurrency}</Text>
                  </View>
                </View>

                <View style={txStyles.amountInputRow}>
                  <Text style={[txStyles.currencyPrefix, { color: COLORS.finance }]}>
                    {toCurrencySymbol}
                  </Text>
                  <TextInput
                    style={[txStyles.amountInput, { color: COLORS.finance, fontSize: toAmountFontSize }]}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    showSoftInputOnFocus={false}
                    value={toAmount}
                    onFocus={openToAmountKeypad}
                    onPressIn={openToAmountKeypad}
                    editable={true}
                  />
                  <View style={txStyles.clearInputPlaceholder}>
                    {toAmount !== '' && (
                      <TouchableOpacity
                        style={txStyles.clearInputBtn}
                        onPress={() => {
                          hapticLight();
                          if (setToAmount) setToAmount('');
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel="Clear received amount"
                      >
                        <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Fixed-Height Calculation & Sub-Amount Line */}
                <View style={txStyles.amountPreviewContainer}>
                  {isToAmountMath ? (
                    <Text
                      style={[
                        txStyles.formattedSubAmount,
                        { color: COLORS.finance, fontWeight: '700', fontSize: toPreviewFontSize },
                      ]}
                      numberOfLines={1}
                    >
                      = {toCurrencySymbol} {formattedDisplayToAmount}
                    </Text>
                  ) : (
                    <Text style={[txStyles.formattedSubAmount, { fontSize: toPreviewFontSize }]} numberOfLines={1}>
                      {toCurrencySymbol} {formattedDisplayToAmount}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {/* Live Exchange Rate Badge */}
            {isCrossCurrency && (
              <View style={txStyles.rateBadgeCard}>
                <View style={txStyles.rateBadgeRow}>
                  <Ionicons name="swap-horizontal" size={14} color={COLORS.finance} />
                  <Text style={txStyles.rateBadgeTitle}>
                    {effectiveExchangeRate > 0
                      ? `Rate: 1 USD ≈ Rp ${Math.round(effectiveExchangeRate).toLocaleString('id-ID')}`
                      : 'Enter received amount to calculate rate'}
                  </Text>
                </View>
                <Text style={txStyles.rateBadgeSub}>
                  {effectiveExchangeRate > 0
                    ? `Send ${currencySymbol} ${formattedDisplayAmount} ➔ Receive ${toCurrencySymbol} ${formattedDisplayToAmount}`
                    : 'Exchange rate calculated automatically in real time'}
                </Text>
              </View>
            )}

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
                onDeleteCategory={onDeleteCategory}
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
                onFocus={() => setActiveKeypad(null)}
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
                onPress={() => {
                  setActiveKeypad(null);
                  onOpenDatePicker();
                }}
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
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Ionicons name={typeIcon as any} size={16} color="#08090C" />
              <Text style={txStyles.saveBtnText}>
                {isEditing ? 'UPDATE TRANSACTION' : 'SAVE TRANSACTION'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Custom In-App Calculator Keypad (Docked at Bottom) */}
          {activeKeypad && (
            <Animated.View
              entering={SlideInDown.duration(220)}
              exiting={SlideOutDown.duration(180)}
              style={txStyles.keypadWrapper}
              {...keypadPanResponder.panHandlers}
            >
              <CalculatorKeypad
                value={activeKeypad === 'amount' ? amount : toAmount}
                onChangeValue={(val) => {
                  if (activeKeypad === 'amount') {
                    setAmount(val);
                    if (isCrossCurrency && setToAmount && (!toAmount || toAmount === '0')) {
                      const num = evaluateArithmetic(val);
                      if (currency === 'IDR' && toCurrency === 'USD' && num > 0) {
                        setToAmount((num / 16000).toFixed(2));
                      } else if (currency === 'USD' && toCurrency === 'IDR' && num > 0) {
                        setToAmount(Math.round(num * 16000).toString());
                      }
                    }
                  } else if (setToAmount) {
                    setToAmount(val);
                  }
                }}
                onDone={() => setActiveKeypad(null)}
                accentColor={activeKeypad === 'amount' ? typeTheme.color : COLORS.finance}
                currency={activeKeypad === 'amount' ? currency : toCurrency}
              />
            </Animated.View>
          )}
        </View>
      </View>
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
    overflow: 'hidden',
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
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
    minHeight: 112,
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
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
    height: 38,
  },
  clearInputPlaceholder: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearInputBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountPreviewContainer: {
    height: 20,
    justifyContent: 'center',
    marginTop: 4,
  },
  formattedSubAmount: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  receivedCard: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    minHeight: 112,
    justifyContent: 'space-between',
  },
  receivedLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  receivedPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  receivedPillText: {
    color: COLORS.finance,
    fontSize: 10.5,
    fontWeight: '800',
  },
  rateBadgeCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    gap: 4,
  },
  rateBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rateBadgeTitle: {
    color: COLORS.finance,
    fontSize: 12.5,
    fontWeight: '800',
  },
  rateBadgeSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
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
  keypadWrapper: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgCardSub,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});
