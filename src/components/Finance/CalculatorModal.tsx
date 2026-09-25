import React, { useState, useEffect } from 'react';
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

interface CalculatorModalProps {
  visible: boolean;
  initialValue: string;
  currency: 'IDR' | 'USD';
  title?: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}

export const CalculatorModal = ({
  visible,
  initialValue,
  currency,
  title = 'Enter Amount',
  onClose,
  onConfirm,
}: CalculatorModalProps) => {
  const [expression, setExpression] = useState('0');

  useEffect(() => {
    if (visible) {
      const sanitized = initialValue ? initialValue.replace(/[^0-9.]/g, '') : '0';
      setExpression(sanitized || '0');
    }
  }, [visible, initialValue]);

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
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={calcStyles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={calcStyles.container}>
              <View style={calcStyles.handle} />

              <View style={calcStyles.header}>
                <Text style={calcStyles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={26} color="#52525B" />
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
                    <Ionicons name="backspace-outline" size={22} color="#FAFAFA" />
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
    </Modal>
  );
};

const calcStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#3F3F46',
    borderRadius: 2,
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
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  displayCard: {
    backgroundColor: '#09090B',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  expressionText: {
    color: '#71717A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencyBadge: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '900',
    marginRight: 6,
  },
  resultText: {
    color: '#FAFAFA',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
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
    height: 56,
    backgroundColor: '#09090B',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  btnText: {
    color: '#FAFAFA',
    fontSize: 22,
    fontWeight: '800',
  },
  btnAlt: {
    backgroundColor: '#27272A',
  },
  textAlt: {
    color: '#FF453A',
  },
  btnOp: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  textOp: {
    color: '#38BDF8',
    fontSize: 24,
    fontWeight: '900',
  },
  btnSpecial: {
    backgroundColor: '#1E1E24',
    borderColor: '#3F3F46',
  },
  textSpecial: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '900',
  },
  btnConfirm: {
    flex: 2,
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  btnConfirmText: {
    color: '#09090B',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
});