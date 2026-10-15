import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Keyboard,
  BackHandler,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Account, DebtItem, formatMoney } from '../../../types/finance';
import { COLORS } from '../../../constants/theme';
import { useKeyboardHeight } from '../../../hooks/useKeyboardHeight';
import { CalculatorKeypad } from '../CalculatorKeypad';
import {
  evaluateArithmetic,
  evaluateArithmeticStr,
  formatCalculatedDisplay,
  formatExpression,
  hasMathOperators,
  MAX_NOMINAL_VALUE,
} from '../../../utils/math';
import { hapticLight } from '../../../utils/haptics';
import {
  debtsStyles as styles,
  RECEIVABLE_COLOR,
  DEBT_COLOR,
} from '../../../styles/debtsStyles';

interface SettleDebtModalProps {
  debt: DebtItem | null;
  accounts: Account[];
  onClose: () => void;
  onConfirm: (params: {
    debtId: string;
    amountPaid: number;
    accountId: string;
    subAccountId: string;
    notes?: string;
  }) => void;
  onShowAlert: (type: 'warning' | 'danger' | 'info' | 'success', title: string, message: string) => void;
}

export const SettleDebtModal = ({
  debt,
  accounts,
  onClose,
  onConfirm,
  onShowAlert,
}: SettleDebtModalProps) => {
  const requestCloseRef = React.useRef<() => void>(() => onClose());

  return (
    <Modal
      visible={Boolean(debt)}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        if (requestCloseRef.current) {
          requestCloseRef.current();
        } else {
          onClose();
        }
      }}
      statusBarTranslucent={true}
    >
      {debt ? (
        <SettleDebtModalContent
          key={debt.id}
          debt={debt}
          accounts={accounts}
          onClose={onClose}
          onConfirm={onConfirm}
          onShowAlert={onShowAlert}
          registerRequestClose={(fn) => {
            requestCloseRef.current = fn;
          }}
        />
      ) : null}
    </Modal>
  );
};

interface SettleDebtModalContentProps {
  debt: DebtItem;
  accounts: Account[];
  onClose: () => void;
  onConfirm: (params: {
    debtId: string;
    amountPaid: number;
    accountId: string;
    subAccountId: string;
    notes?: string;
  }) => void;
  onShowAlert: (type: 'warning' | 'danger' | 'info' | 'success', title: string, message: string) => void;
  registerRequestClose?: (fn: () => void) => void;
}

const SettleDebtModalContent = ({
  debt,
  accounts,
  onClose,
  onConfirm,
  onShowAlert,
  registerRequestClose,
}: SettleDebtModalContentProps) => {
  const availableAccounts = accounts.filter((a) => a.currency === debt.currency);
  const primaryAcc = availableAccounts.length > 0 ? availableAccounts[0] : accounts[0];

  const [settleAmount, setSettleAmount] = useState(() =>
    formatExpression(debt.remainingAmount.toString(), debt.currency)
  );
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [settleAccId, setSettleAccId] = useState(primaryAcc ? primaryAcc.id : '');
  const [settleSubAccId, setSettleSubAccId] = useState(primaryAcc?.subAccounts[0]?.id || '');
  const [settleNotes, setSettleNotes] = useState('');

  const keyboardHeight = useKeyboardHeight();

  const evaluatedAmountStr = React.useMemo(
    () => evaluateArithmeticStr(settleAmount, debt.currency),
    [settleAmount, debt.currency]
  );
  const isAmountMath = React.useMemo(() => hasMathOperators(settleAmount), [settleAmount]);
  const formattedDisplayAmount = formatCalculatedDisplay(evaluatedAmountStr, debt.currency);

  const livePaymentValue = evaluateArithmetic(settleAmount, debt.currency);
  const liveRemainingAfter = Math.max(0, debt.remainingAmount - livePaymentValue);

  const openAmountKeypad = () => {
    Keyboard.dismiss();
    setIsKeypadOpen(true);
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    if (isKeypadOpen) {
      setIsKeypadOpen(false);
      return;
    }
    onClose();
  };

  const handleRequestClose = React.useCallback(() => {
    Keyboard.dismiss();
    if (isKeypadOpen) {
      setIsKeypadOpen(false);
      return;
    }
    onClose();
  }, [isKeypadOpen, onClose]);

  React.useEffect(() => {
    registerRequestClose?.(handleRequestClose);
  }, [handleRequestClose, registerRequestClose]);

  // Intercept smartphone back button or edge back swipe gesture:
  // Dismiss calculator keypad first before closing the modal
  React.useEffect(() => {
    const onBackPress = () => {
      if (isKeypadOpen) {
        setIsKeypadOpen(false);
        return true; // Event consumed, prevents closing the modal
      }
      return false; // Allow standard modal close
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isKeypadOpen]);

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
            setIsKeypadOpen(false);
          }
        },
      }),
    []
  );

  const handleConfirm = () => {
    setIsKeypadOpen(false);
    if (!settleAccId) {
      onShowAlert('warning', 'Account Required', 'Please select which account this transaction goes to.');
      return;
    }

    const evaluated = evaluateArithmetic(settleAmount, debt.currency);
    const parsedPayAmount = Math.min(MAX_NOMINAL_VALUE, Math.max(0, evaluated));
    if (!parsedPayAmount || parsedPayAmount <= 0) {
      onShowAlert('warning', 'Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    if (parsedPayAmount > debt.remainingAmount) {
      onShowAlert(
        'warning',
        'Amount Exceeds Balance',
        `The payment amount (${formatMoney(parsedPayAmount, debt.currency)}) exceeds the remaining balance (${formatMoney(debt.remainingAmount, debt.currency)}).`
      );
      return;
    }

    onConfirm({
      debtId: debt.id,
      amountPaid: parsedPayAmount,
      accountId: settleAccId,
      subAccountId: settleSubAccId,
      notes: settleNotes.trim() || undefined,
    });
  };

  return (
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.dismissArea} />
      </TouchableWithoutFeedback>
      <View style={styles.settleModalSheet}>
        <View style={styles.modalHandle} />

        <View style={styles.modalHeaderRow}>
          <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
            <Text style={styles.modalSheetTitle}>
              {debt.type === 'receivable' ? 'Record Received Payment' : 'Record Debt Payment'}
            </Text>
            <Text style={styles.modalSheetSubtitle}>
              {debt.personName} • {debt.title}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleDismiss}
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
          onScrollBeginDrag={() => setIsKeypadOpen(false)}
          contentContainerStyle={{ paddingBottom: Math.max(28, keyboardHeight + 28) }}
        >
          {/* CURRENT BALANCE BANNER */}
          <View style={styles.currentBalanceBanner}>
            <Text style={styles.currentBalanceLabel}>Current Remaining Balance</Text>
            <Text
              style={[
                styles.currentBalanceValue,
                { color: debt.type === 'receivable' ? RECEIVABLE_COLOR : DEBT_COLOR },
              ]}
            >
              {formatMoney(debt.remainingAmount, debt.currency)}
            </Text>
          </View>

          {/* 1. ACCOUNT SELECTION */}
          <Text style={styles.inputLabel}>
            {debt.type === 'receivable' ? 'DEPOSIT ACCOUNT' : 'PAYMENT ACCOUNT'}
          </Text>
          <Text style={styles.inputSubLabel}>
            {debt.type === 'receivable'
              ? 'Select the account where received funds will be added'
              : 'Select the account where payment will be deducted from'}
          </Text>

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
                  style={[styles.accPill, isSelected && styles.accPillSelected]}
                  onPress={() => {
                    setIsKeypadOpen(false);
                    setSettleAccId(acc.id);
                    setSettleSubAccId(acc.subAccounts[0]?.id || '');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={15}
                    color={isSelected ? styles.accPillTextSelected.color : COLORS.textMuted}
                  />
                  <Text style={[styles.accPillText, isSelected && styles.accPillTextSelected]}>
                    {acc.name} ({acc.currency})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Pocket picker if available */}
          {(() => {
            const currentAcc = accounts.find((a) => a.id === settleAccId);
            if (currentAcc && currentAcc.subAccounts.length > 1) {
              return (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.inputSubLabel}>Pocket</Text>
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
              {debt.type === 'receivable' ? 'AMOUNT RECEIVED' : 'AMOUNT TO PAY'} ({debt.currency})
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSettleAmount(formatExpression(debt.remainingAmount.toString(), debt.currency));
              }}
              style={styles.btnPayFull}
              activeOpacity={0.7}
            >
              <Text style={styles.btnPayFullText}>Full Amount</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.amountCard,
              isKeypadOpen && styles.amountCardActive,
            ]}
            onPress={openAmountKeypad}
            activeOpacity={0.85}
          >
            <View style={styles.amountCardRow}>
              <Text style={styles.amountCardPrefix}>
                {debt.currency === 'USD' ? '$' : 'Rp'}
              </Text>
              <TextInput
                style={[
                  styles.amountCardInput,
                  { fontSize: settleAmount.length > 20 ? 17 : settleAmount.length > 14 ? 20 : 22 },
                ]}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                showSoftInputOnFocus={false}
                value={settleAmount}
                onFocus={openAmountKeypad}
                onPressIn={openAmountKeypad}
                editable={true}
              />
              {settleAmount !== '' && (
                <TouchableOpacity
                  style={styles.clearInputBtn}
                  onPress={() => {
                    hapticLight();
                    setSettleAmount('');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Sub-amount / Math Calculation Line */}
            <View style={styles.amountPreviewContainer}>
              {isAmountMath ? (
                <Text style={styles.amountPreviewText} numberOfLines={1}>
                  = {debt.currency === 'USD' ? '$' : 'Rp'} {formattedDisplayAmount}
                </Text>
              ) : settleAmount ? (
                <Text style={styles.amountPreviewTextMuted} numberOfLines={1}>
                  {debt.currency === 'USD' ? '$' : 'Rp'} {formattedDisplayAmount}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>

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
                {formatMoney(liveRemainingAfter, debt.currency)}
              </Text>
            </View>

            {liveRemainingAfter === 0 ? (
              <View style={styles.settleStatusBadge}>
                <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
                <Text style={styles.settleStatusText}>This balance will be marked as fully settled</Text>
              </View>
            ) : (
              <Text style={styles.partialNotice}>
                Remaining balance of {formatMoney(liveRemainingAfter, debt.currency)} will stay active.
              </Text>
            )}
          </View>

          {/* 4. OPTIONAL NOTES */}
          <Text style={styles.inputLabel}>NOTES / MEMO (OPTIONAL)</Text>
          <TextInput
            style={styles.textInput}
            value={settleNotes}
            onChangeText={setSettleNotes}
            onFocus={() => setIsKeypadOpen(false)}
            placeholder="e.g. Bank transfer, installment #1"
            placeholderTextColor={COLORS.textMuted}
          />

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[
              styles.btnConfirmSettle,
              {
                backgroundColor: debt.type === 'receivable' ? RECEIVABLE_COLOR : DEBT_COLOR,
              },
            ]}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={18} color="#08090C" />
            <Text style={styles.btnConfirmSettleText}>
              {debt.type === 'receivable'
                ? 'Confirm & Deposit to Account'
                : 'Confirm & Deduct from Account'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Custom In-App Calculator Keypad (Docked at Bottom) */}
        {isKeypadOpen && (
          <Animated.View
            entering={SlideInDown.duration(220)}
            exiting={SlideOutDown.duration(180)}
            style={styles.keypadWrapper}
            {...keypadPanResponder.panHandlers}
          >
            <CalculatorKeypad
              value={settleAmount}
              onChangeValue={setSettleAmount}
              onDone={() => setIsKeypadOpen(false)}
              accentColor={debt.type === 'receivable' ? RECEIVABLE_COLOR : DEBT_COLOR}
              currency={debt.currency}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
};
