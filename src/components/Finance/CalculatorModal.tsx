import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney, hexToRgba } from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';

const ACCENT = '#38BDF8';
const INCOME = '#10B981';
const EXPENSE = '#F43F5E';
const VIOLET = '#818CF8';
const AMBER = '#F59E0B';
const INK = '#08090C';

interface CalculatorModalProps {
  visible: boolean;
  initialValue: string;
  currency: 'IDR' | 'USD';
  title?: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}

const CalculatorModalContent = ({
  initialValue,
  currency,
  title = 'Enter Amount',
  onClose,
  onConfirm,
}: Omit<CalculatorModalProps, 'visible'>) => {
  const [expression, setExpression] = useState(() => {
    const sanitized = initialValue ? initialValue.replace(/[^0-9.]/g, '') : '0';
    return sanitized || '0';
  });

  const evaluateMath = (expr: string): number => {
    try {
      const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
      const tokens = sanitized.match(/(\d+\.?\d*|[\+\-\*\/])/g);
      if (!tokens) return 0;

      let total = parseFloat(tokens[0]) || 0;
      for (let i = 1; i < tokens.length; i += 2) {
        const op = tokens[i];
        const nextVal = parseFloat(tokens[i + 1]);
        if (isNaN(nextVal)) continue;

        if (op === '+') total += nextVal;
        if (op === '-') total -= nextVal;
        if (op === '*') total *= nextVal;
        if (op === '/') total = nextVal !== 0 ? total / nextVal : 0;
      }
      return total;
    } catch {
      return 0;
    }
  };

  const handleInput = (val: string) => {
    if (expression === '0' && val !== '.' && !['+', '-', '×', '÷'].includes(val)) {
      if (val === '000') return;
      setExpression(val);
      return;
    }

    const lastChar = expression.slice(-1);
    const isOp = ['+', '-', '×', '÷'].includes(val);
    const lastIsOp = ['+', '-', '×', '÷'].includes(lastChar);

    if (isOp && lastIsOp) {
      setExpression(expression.slice(0, -1) + val);
      return;
    }

    setExpression((prev) => prev + val);
  };

  const handleDelete = () => {
    if (expression.length <= 1) {
      setExpression('0');
      return;
    }
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setExpression('0');
  };

  const handleConfirm = () => {
    const finalVal = evaluateMath(expression);
    onConfirm(finalVal.toString());
    onClose();
  };

  const currentEvaluation = evaluateMath(expression);
  const currencySymbol = currency === 'USD' ? '$' : 'Rp';

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={calcStyles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={calcStyles.container}>
            <View style={calcStyles.handle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={calcStyles.scrollContent}
            >
              <View style={calcStyles.header}>
                <View style={calcStyles.headerTitleWrap}>
                  <View style={calcStyles.headerIconBox}>
                    <Ionicons name="calculator-outline" size={18} color={ACCENT} />
                  </View>
                  <View style={calcStyles.headerTextWrap}>
                    <Text style={calcStyles.title} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={calcStyles.subtitle} numberOfLines={1}>
                      Fast keypad entry
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={calcStyles.closeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Display Area */}
              <View style={calcStyles.displayCard}>
                <Text style={calcStyles.displayLabel} numberOfLines={1}>
                  AMOUNT
                </Text>
                <Text
                  style={calcStyles.expressionText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {expression}
                </Text>
                <View style={calcStyles.displayDivider} />
                <View style={calcStyles.resultRow}>
                  <Text style={calcStyles.currencyBadge} numberOfLines={1}>
                    {currencySymbol}
                  </Text>
                  <Text
                    style={calcStyles.resultText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {formatMoney(currentEvaluation, currency).replace(/[^0-9.,]/g, '').trim()}
                  </Text>
                </View>
              </View>

              {/* Calculator Keypad */}
              <View style={calcStyles.grid}>
                <View style={calcStyles.row}>
                  <TouchableOpacity
                    style={[calcStyles.btn, { backgroundColor: hexToRgba(EXPENSE, 0.14), borderColor: hexToRgba(EXPENSE, 0.34) }]}
                    onPress={handleClear}
                    activeOpacity={0.7}
                  >
                    <Text style={[calcStyles.btnText, { color: EXPENSE, fontWeight: '900' }]}>C</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[calcStyles.btn, { backgroundColor: hexToRgba(ACCENT, 0.14), borderColor: hexToRgba(ACCENT, 0.34) }]}
                    onPress={() => handleInput('÷')}
                    activeOpacity={0.7}
                  >
                    <Text style={[calcStyles.btnText, calcStyles.textOp]}>÷</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[calcStyles.btn, { backgroundColor: hexToRgba(ACCENT, 0.14), borderColor: hexToRgba(ACCENT, 0.34) }]}
                    onPress={() => handleInput('×')}
                    activeOpacity={0.7}
                  >
                    <Text style={[calcStyles.btnText, calcStyles.textOp]}>×</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[calcStyles.btn, { backgroundColor: hexToRgba(AMBER, 0.14), borderColor: hexToRgba(AMBER, 0.34) }]}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="backspace-outline" size={22} color={AMBER} />
                  </TouchableOpacity>
                </View>

                <View style={calcStyles.row}>
                  <TouchableOpacity style={calcStyles.btn} onPress={() => handleInput('7')} activeOpacity={0.7}>
                    <Text style={calcStyles.btnText}>7</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={calcStyles.btn} onPress={() => handleInput('8')} activeOpacity={0.7}>
                    <Text style={calcStyles.btnText}>8</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={calcStyles.btn} onPress={() => handleInput('9')} activeOpacity={0.7}>
                    <Text style={calcStyles.btnText}>9</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[calcStyles.btn, { backgroundColor: hexToRgba(ACCENT, 0.14), borderColor: hexToRgba(ACCENT, 0.34) }]}
                    onPress={() => handleInput('-')}
                    activeOpacity={0.7}
                  >
                    <Text style={[calcStyles.btnText, calcStyles.textOp]}>-</Text>
                  </TouchableOpacity>
                </View>

                <View style={calcStyles.row}>
                  <TouchableOpacity style={calcStyles.btn} onPress={() => handleInput('4')} activeOpacity={0.7}>
                    <Text style={calcStyles.btnText}>4</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={calcStyles.btn} onPress={() => handleInput('5')} activeOpacity={0.7}>
                    <Text style={calcStyles.btnText}>5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={calcStyles.btn} onPress={() => handleInput('6')} activeOpacity={0.7}>
                    <Text style={calcStyles.btnText}>6</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[calcStyles.btn, { backgroundColor: hexToRgba(ACCENT, 0.14), borderColor: hexToRgba(ACCENT, 0.34) }]}
                    onPress={() => handleInput('+')}
                    activeOpacity={0.7}
                  >
                    <Text style={[calcStyles.btnText, calcStyles.textOp]}>+</Text>
                  </TouchableOpacity>
                </View>

                <View style={calcStyles.row}>
                  <TouchableOpacity style={calcStyles.btn} onPress={() => handleInput('1')} activeOpacity={0.7}>
                    <Text style={calcStyles.btnText}>1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={calcStyles.btn} onPress={() => handleInput('2')} activeOpacity={0.7}>
                    <Text style={calcStyles.btnText}>2</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={calcStyles.btn} onPress={() => handleInput('3')} activeOpacity={0.7}>
                    <Text style={calcStyles.btnText}>3</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[calcStyles.btn, { backgroundColor: hexToRgba(VIOLET, 0.14), borderColor: hexToRgba(VIOLET, 0.34) }]}
                    onPress={() => handleInput('.')}
                    activeOpacity={0.7}
                  >
                    <Text style={[calcStyles.btnText, { color: VIOLET, fontWeight: '900' }]}>.</Text>
                  </TouchableOpacity>
                </View>

                <View style={calcStyles.row}>
                  <TouchableOpacity style={calcStyles.btn} onPress={() => handleInput('0')} activeOpacity={0.7}>
                    <Text style={calcStyles.btnText}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[calcStyles.btn, { backgroundColor: hexToRgba(VIOLET, 0.14), borderColor: hexToRgba(VIOLET, 0.34) }]}
                    onPress={() => handleInput('000')}
                    activeOpacity={0.7}
                  >
                    <Text style={[calcStyles.btnText, calcStyles.textSpecial]}>000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[calcStyles.btn, calcStyles.btnConfirm]}
                    onPress={handleConfirm}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark" size={20} color={INK} style={{ marginRight: 6 }} />
                    <Text style={calcStyles.btnConfirmText} numberOfLines={1}>
                      OK
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

export const CalculatorModal = ({ visible, ...props }: CalculatorModalProps) => {
  if (!visible) return null;
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={props.onClose}>
      <CalculatorModalContent key={props.initialValue} {...props} />
    </Modal>
  );
};

const calcStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  displayCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  displayLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  expressionText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    maxWidth: '100%',
  },
  displayDivider: {
    height: 1,
    alignSelf: 'stretch',
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    maxWidth: '100%',
  },
  currencyBadge: {
    color: ACCENT,
    fontSize: 20,
    fontWeight: '900',
    marginRight: 8,
    flexShrink: 0,
  },
  resultText: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'right',
  },
  grid: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnText: {
    color: COLORS.textPrimary,
    fontSize: 21,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  textOp: {
    color: ACCENT,
    fontSize: 23,
    fontWeight: '800',
  },
  textSpecial: {
    color: VIOLET,
    fontSize: 17,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  btnConfirm: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: INCOME,
    borderColor: INCOME,
    minHeight: 56,
  },
  btnConfirmText: {
    color: INK,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  footerHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 6,
  },
  footerHintText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
    minWidth: 0,
  },
});
