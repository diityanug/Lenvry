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
import { DebtItem } from '../../../types/finance';
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
  ACCENT,
  RECEIVABLE_COLOR,
  DEBT_COLOR,
} from '../../../styles/debtsStyles';

interface AddDebtModalProps {
  visible: boolean;
  currency: 'IDR' | 'USD';
  defaultType?: 'receivable' | 'debt';
  onClose: () => void;
  onSave: (debt: Omit<DebtItem, 'id' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status'>) => void;
  onShowAlert: (type: 'warning' | 'danger' | 'info' | 'success', title: string, message: string) => void;
}

export const AddDebtModal = ({
  visible,
  currency,
  defaultType = 'receivable',
  onClose,
  onSave,
  onShowAlert,
}: AddDebtModalProps) => {
  const requestCloseRef = React.useRef<() => void>(() => onClose());

  return (
    <Modal
      visible={visible}
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
      {visible ? (
        <AddDebtModalContent
          key={`${currency}-${defaultType}`}
          currency={currency}
          defaultType={defaultType}
          onClose={onClose}
          onSave={onSave}
          onShowAlert={onShowAlert}
          registerRequestClose={(fn) => {
            requestCloseRef.current = fn;
          }}
        />
      ) : null}
    </Modal>
  );
};

interface AddDebtModalContentProps {
  currency: 'IDR' | 'USD';
  defaultType: 'receivable' | 'debt';
  onClose: () => void;
  onSave: (debt: Omit<DebtItem, 'id' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status'>) => void;
  onShowAlert: (type: 'warning' | 'danger' | 'info' | 'success', title: string, message: string) => void;
  registerRequestClose?: (fn: () => void) => void;
}

const AddDebtModalContent = ({
  currency,
  defaultType,
  onClose,
  onSave,
  onShowAlert,
  registerRequestClose,
}: AddDebtModalContentProps) => {
  const [newType, setNewType] = useState<'receivable' | 'debt'>(defaultType);
  const [newPersonName, setNewPersonName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [newCurrency, setNewCurrency] = useState<'IDR' | 'USD'>(currency);
  const [newNotes, setNewNotes] = useState('');

  const keyboardHeight = useKeyboardHeight();

  const evaluatedAmountStr = React.useMemo(() => evaluateArithmeticStr(newAmount, newCurrency), [newAmount, newCurrency]);
  const isAmountMath = React.useMemo(() => hasMathOperators(newAmount), [newAmount]);
  const formattedDisplayAmount = formatCalculatedDisplay(evaluatedAmountStr, newCurrency);

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

  const handleSave = () => {
    setIsKeypadOpen(false);
    const person = newPersonName.trim();
    const title = newTitle.trim() || (newType === 'receivable' ? 'Loan / Receivable' : 'Debt / Borrowed');
    const evaluated = evaluateArithmetic(newAmount, newCurrency);
    const parsedAmount = Math.min(MAX_NOMINAL_VALUE, Math.max(0, evaluated));

    if (!person) {
      onShowAlert('warning', 'Missing Name', 'Please provide the person or entity name.');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      onShowAlert('warning', 'Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    onSave({
      type: newType,
      personName: person,
      title,
      originalAmount: parsedAmount,
      currency: newCurrency,
      notes: newNotes.trim() || undefined,
    });

    onClose();
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
            <Text style={styles.modalSheetTitle}>Record New Entry</Text>
            <Text style={styles.modalSheetSubtitle}>Keep track of money lent or borrowed</Text>
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
          {/* TYPE SWITCHER: RECEIVABLE VS DEBT */}
          <Text style={styles.inputLabel}>TYPE</Text>
          <View style={styles.typeSwitcherRow}>
            <TouchableOpacity
              style={[
                styles.typeSwitchCard,
                newType === 'receivable' && styles.typeSwitchCardActiveReceivable,
              ]}
              onPress={() => {
                setIsKeypadOpen(false);
                setNewType('receivable');
              }}
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
              onPress={() => {
                setIsKeypadOpen(false);
                setNewType('debt');
              }}
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
            onFocus={() => setIsKeypadOpen(false)}
            placeholder="e.g. John Doe etc."
            placeholderTextColor={COLORS.textMuted}
          />

          {/* PURPOSE / TITLE */}
          <Text style={styles.inputLabel}>PURPOSE / DESCRIPTION</Text>
          <TextInput
            style={styles.textInput}
            value={newTitle}
            onChangeText={setNewTitle}
            onFocus={() => setIsKeypadOpen(false)}
            placeholder="e.g. Ticket etc."
            placeholderTextColor={COLORS.textMuted}
          />

          {/* AMOUNT & CURRENCY ROW */}
          <View style={styles.amountCurrencyRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>TOTAL AMOUNT ({newCurrency})</Text>
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
                    {newCurrency === 'USD' ? '$' : 'Rp'}
                  </Text>
                  <TextInput
                    style={[
                      styles.amountCardInput,
                      { fontSize: newAmount.length > 20 ? 17 : newAmount.length > 14 ? 20 : 22 },
                    ]}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    showSoftInputOnFocus={false}
                    value={newAmount}
                    onFocus={openAmountKeypad}
                    onPressIn={openAmountKeypad}
                    editable={true}
                  />
                  {newAmount !== '' && (
                    <TouchableOpacity
                      style={styles.clearInputBtn}
                      onPress={() => {
                        hapticLight();
                        setNewAmount('');
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
                      = {newCurrency === 'USD' ? '$' : 'Rp'} {formattedDisplayAmount}
                    </Text>
                  ) : newAmount ? (
                    <Text style={styles.amountPreviewTextMuted} numberOfLines={1}>
                      {newCurrency === 'USD' ? '$' : 'Rp'} {formattedDisplayAmount}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ width: 110 }}>
              <Text style={styles.inputLabel}>CURRENCY</Text>
              <View style={styles.currencyToggleRow}>
                <TouchableOpacity
                  style={[styles.currencyBtn, newCurrency === 'IDR' && styles.currencyBtnActive]}
                  onPress={() => {
                    setNewCurrency('IDR');
                    if (newAmount) setNewAmount(formatExpression(newAmount, 'IDR'));
                  }}
                >
                  <Text style={[styles.currencyBtnText, newCurrency === 'IDR' && styles.currencyBtnTextActive]}>
                    IDR
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.currencyBtn, newCurrency === 'USD' && styles.currencyBtnActive]}
                  onPress={() => {
                    setNewCurrency('USD');
                    if (newAmount) setNewAmount(formatExpression(newAmount, 'USD'));
                  }}
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
            onFocus={() => setIsKeypadOpen(false)}
            placeholder="Extra details or agreement notes..."
            placeholderTextColor={COLORS.textMuted}
          />

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.btnConfirmSettle, { backgroundColor: ACCENT, marginTop: 4 }]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Ionicons name="save-outline" size={18} color="#08090C" />
            <Text style={styles.btnConfirmSettleText}>Save Record</Text>
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
              value={newAmount}
              onChangeValue={setNewAmount}
              onDone={() => setIsKeypadOpen(false)}
              accentColor={newType === 'receivable' ? RECEIVABLE_COLOR : DEBT_COLOR}
              currency={newCurrency}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
};
