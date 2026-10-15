import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import {
  MAX_NOMINAL_VALUE,
  appendDigitToExpression,
  backspaceExpression,
  evaluateArithmetic,
  evaluateArithmeticStr,
  formatCalculatedDisplay,
  hasMathOperators,
} from '../../utils/math';
import { hapticLight, hapticSelection, hapticSuccess, hapticWarning } from '../../utils/haptics';

interface CalculatorKeypadProps {
  value: string;
  onChangeValue: (val: string) => void;
  onDone?: () => void;
  accentColor?: string;
  currency?: 'IDR' | 'USD';
}

export const CalculatorKeypad: React.FC<CalculatorKeypadProps> = ({
  value,
  onChangeValue,
  onDone,
  accentColor = COLORS.finance,
  currency = 'IDR',
}) => {
  const specialDigit = currency === 'USD' ? '00' : '000';

  const isAtMaxLimit = React.useMemo(() => {
    if (!value) return false;
    const trimmed = value.trimEnd();
    const num = evaluateArithmetic(trimmed, currency);
    return num >= MAX_NOMINAL_VALUE;
  }, [value, currency]);

  const handleDigit = (digit: string) => {
    const { nextVal, reachedLimit } = appendDigitToExpression(value, digit, currency);
    if (reachedLimit) {
      hapticWarning();
    } else {
      hapticSelection();
    }
    onChangeValue(nextVal);
  };

  const handleOperator = (op: '+' | '-' | '×' | '÷') => {
    if (!value || value === '0') return;
    const trimmed = value.trimEnd();

    // Max data input is 9.999.999.999.999: cannot add or multiply if already at limit
    if (op === '+' || op === '×') {
      const currentNumericVal = evaluateArithmetic(trimmed, currency);
      if (currentNumericVal >= MAX_NOMINAL_VALUE) {
        hapticWarning();
        return;
      }
    }

    hapticLight();
    if (/[\+\-\*\/×÷]$/.test(trimmed)) {
      onChangeValue(`${trimmed.slice(0, -1)}${op} `);
      return;
    }
    onChangeValue(`${trimmed} ${op} `);
  };

  const handleBackspace = () => {
    hapticLight();
    onChangeValue(backspaceExpression(value, currency));
  };

  const handleClear = () => {
    hapticWarning();
    onChangeValue('');
  };

  const handleEquals = () => {
    hapticLight();
    if (!value || !hasMathOperators(value)) return;
    const res = evaluateArithmeticStr(value, currency);
    if (res && res !== '0') {
      onChangeValue(formatCalculatedDisplay(res, currency));
    }
  };

  const handleDonePress = () => {
    hapticSuccess();
    if (hasMathOperators(value)) {
      const res = evaluateArithmeticStr(value, currency);
      if (res && res !== '0') {
        onChangeValue(formatCalculatedDisplay(res, currency));
      }
    }
    onDone?.();
  };

  return (
    <View style={styles.container}>
      {/* 5 Rows x 4 Columns Keypad Grid */}
      <View style={styles.grid}>
        {/* Row 1 */}
        <View style={styles.row}>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, styles.clearBtn, pressed && styles.keyPressed]}
            onPress={handleClear}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Clear"
          >
            <Text style={styles.clearBtnText}>C</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, styles.opBtn, pressed && styles.keyPressed]}
            onPress={() => handleOperator('÷')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Divide"
          >
            <Text style={[styles.opBtnText, { color: accentColor }]}>÷</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.keyBtn,
              styles.opBtn,
              isAtMaxLimit && styles.opBtnDisabled,
              pressed && styles.keyPressed,
            ]}
            onPress={() => handleOperator('×')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Multiply"
          >
            <Text style={[styles.opBtnText, { color: isAtMaxLimit ? COLORS.textMuted : accentColor }]}>×</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, styles.backspaceBtn, pressed && styles.keyPressed]}
            onPress={handleBackspace}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Backspace"
          >
            <Ionicons name="backspace-outline" size={21} color="#F59E0B" />
          </Pressable>
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyPressed]}
            onPress={() => handleDigit('7')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="7"
          >
            <Text style={styles.numBtnText}>7</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyPressed]}
            onPress={() => handleDigit('8')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="8"
          >
            <Text style={styles.numBtnText}>8</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyPressed]}
            onPress={() => handleDigit('9')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="9"
          >
            <Text style={styles.numBtnText}>9</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, styles.opBtn, pressed && styles.keyPressed]}
            onPress={() => handleOperator('-')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Subtract"
          >
            <Text style={[styles.opBtnText, { color: accentColor }]}>−</Text>
          </Pressable>
        </View>

        {/* Row 3 */}
        <View style={styles.row}>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyPressed]}
            onPress={() => handleDigit('4')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="4"
          >
            <Text style={styles.numBtnText}>4</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyPressed]}
            onPress={() => handleDigit('5')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="5"
          >
            <Text style={styles.numBtnText}>5</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyPressed]}
            onPress={() => handleDigit('6')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="6"
          >
            <Text style={styles.numBtnText}>6</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.keyBtn,
              styles.opBtn,
              isAtMaxLimit && styles.opBtnDisabled,
              pressed && styles.keyPressed,
            ]}
            onPress={() => handleOperator('+')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Add"
          >
            <Text style={[styles.opBtnText, { color: isAtMaxLimit ? COLORS.textMuted : accentColor }]}>+</Text>
          </Pressable>
        </View>

        {/* Row 4 */}
        <View style={styles.row}>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyPressed]}
            onPress={() => handleDigit('1')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="1"
          >
            <Text style={styles.numBtnText}>1</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyPressed]}
            onPress={() => handleDigit('2')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="2"
          >
            <Text style={styles.numBtnText}>2</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyPressed]}
            onPress={() => handleDigit('3')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="3"
          >
            <Text style={styles.numBtnText}>3</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.keyBtn,
              styles.equalsBtn,
              { borderColor: accentColor },
              pressed && styles.keyPressed,
            ]}
            onPress={handleEquals}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Equals"
          >
            <Text style={[styles.opBtnText, { color: accentColor, fontWeight: '800' }]}>=</Text>
          </Pressable>
        </View>

        {/* Row 5 */}
        <View style={styles.row}>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyPressed]}
            onPress={() => handleDigit('.')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Decimal point"
          >
            <Text style={styles.numBtnText}>.</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyPressed]}
            onPress={() => handleDigit('0')}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="0"
          >
            <Text style={styles.numBtnText}>0</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.keyBtn, pressed && styles.keyPressed]}
            onPress={() => handleDigit(specialDigit)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={currency === 'USD' ? 'Double zero' : 'Thousand'}
          >
            <Text style={styles.specialBtnText}>{specialDigit}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.keyBtn,
              styles.confirmBtn,
              { backgroundColor: accentColor },
              pressed && styles.keyPressed,
            ]}
            onPress={handleDonePress}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Confirm amount"
          >
            <Ionicons name="checkmark" size={18} color="#08090C" />
            <Text style={styles.confirmBtnText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
  },
  grid: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  keyBtn: {
    flex: 1,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.94 }],
  },
  numBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  specialBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  opBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.22)',
  },
  opBtnDisabled: {
    opacity: 0.35,
  },
  opBtnText: {
    fontSize: 21,
    fontWeight: '700',
  },
  clearBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.22)',
  },
  clearBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F43F5E',
  },
  backspaceBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },
  equalsBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  confirmBtn: {
    flexDirection: 'row',
    gap: 4,
    borderColor: 'transparent',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#08090C',
  },
});
