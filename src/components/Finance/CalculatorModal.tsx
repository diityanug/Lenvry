import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney } from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';

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

  // Evaluasi perhitungan matematika sederhana secara aman
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

            <View style={calcStyles.header}>
              <Text style={calcStyles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Display Area */}
            <View style={calcStyles.displayCard}>
              <Text style={calcStyles.expressionText} numberOfLines={1}>
                {expression}
              </Text>
              <View style={calcStyles.resultRow}>
                <Text style={calcStyles.currencyBadge}>{currencySymbol}</Text>
                <Text style={calcStyles.resultText} numberOfLines={1}>
                  {formatMoney(currentEvaluation, currency).replace(/[^0-9.,]/g, '').trim()}
                </Text>
              </View>
            </View>

            {/* Calculator Keypad */}
            <View style={calcStyles.grid}>
              {/* Row 1 */}
              <View style={calcStyles.row}>
                <TouchableOpacity style={[calcStyles.btn, calcStyles.btnAlt]} onPress={handleClear} activeOpacity={0.7}>
                  <Text style={[calcStyles.btnText, calcStyles.textAlt]}>C</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[calcStyles.btn, calcStyles.btnOp]} onPress={() => handleInput('÷')} activeOpacity={0.7}>
                  <Text style={[calcStyles.btnText, calcStyles.textOp]}>÷</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[calcStyles.btn, calcStyles.btnOp]} onPress={() => handleInput('×')} activeOpacity={0.7}>
                  <Text style={[calcStyles.btnText, calcStyles.textOp]}>×</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[calcStyles.btn, calcStyles.btnAlt]} onPress={handleDelete} activeOpacity={0.7}>
                  <Ionicons name="backspace-outline" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Row 2 */}
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
                <TouchableOpacity style={[calcStyles.btn, calcStyles.btnOp]} onPress={() => handleInput('-')} activeOpacity={0.7}>
                  <Text style={[calcStyles.btnText, calcStyles.textOp]}>-</Text>
                </TouchableOpacity>
              </View>

              {/* Row 3 */}
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
                <TouchableOpacity style={[calcStyles.btn, calcStyles.btnOp]} onPress={() => handleInput('+')} activeOpacity={0.7}>
                  <Text style={[calcStyles.btnText, calcStyles.textOp]}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Row 4 */}
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
                <TouchableOpacity style={calcStyles.btn} onPress={() => handleInput('.')} activeOpacity={0.7}>
                  <Text style={calcStyles.btnText}>.</Text>
                </TouchableOpacity>
              </View>

              {/* Row 5 */}
              <View style={calcStyles.row}>
                <TouchableOpacity style={calcStyles.btn} onPress={() => handleInput('0')} activeOpacity={0.7}>
                  <Text style={calcStyles.btnText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[calcStyles.btn, calcStyles.btnSpecial]} onPress={() => handleInput('000')} activeOpacity={0.7}>
                  <Text style={[calcStyles.btnText, calcStyles.textSpecial]}>000</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[calcStyles.btn, calcStyles.btnConfirm]} onPress={handleConfirm} activeOpacity={0.85}>
                  <Text style={calcStyles.btnConfirmText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  displayCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  expressionText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencyBadge: {
    color: COLORS.finance,
    fontSize: 22,
    fontWeight: '900',
    marginRight: 6,
  },
  resultText: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
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
    height: 52,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnText: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  btnAlt: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.borderLight,
  },
  textAlt: {
    color: COLORS.danger,
  },
  btnOp: {
    backgroundColor: COLORS.financeLight,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  textOp: {
    color: COLORS.finance,
    fontSize: 22,
    fontWeight: '800',
  },
  btnSpecial: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.border,
  },
  textSpecial: {
    color: COLORS.finance,
    fontSize: 17,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  btnConfirm: {
    flex: 2,
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
  },
  btnConfirmText: {
    color: '#08090C',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});