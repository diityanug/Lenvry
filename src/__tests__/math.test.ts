import { describe, expect, it } from 'bun:test';
import {
  appendDigitToExpression,
  backspaceExpression,
  evaluateArithmetic,
  evaluateArithmeticStr,
  formatCalculatedDisplay,
  formatExpression,
  hasMathOperators,
  MAX_NOMINAL_VALUE,
  roundCurrencyAmount,
} from '../utils/math';

describe('math utilities', () => {
  it('evaluates arithmetic with operator precedence for IDR', () => {
    expect(evaluateArithmetic('10.000 + 5.000 × 2', 'IDR')).toBe(20000);
    expect(evaluateArithmetic('100.000 ÷ 4 - 5.000', 'IDR')).toBe(20000);
  });

  it('evaluates USD decimal expressions accurately', () => {
    expect(evaluateArithmetic('1,250.50 + 49.50', 'USD')).toBe(1300);
    expect(evaluateArithmeticStr('10.25 * 2', 'USD')).toBe('20.5');
  });

  it('handles trailing operators, division by zero, and empty inputs safely', () => {
    expect(evaluateArithmetic('', 'IDR')).toBe(0);
    expect(evaluateArithmetic('50.000 + ', 'IDR')).toBe(50000);
    expect(evaluateArithmetic('100 / 0', 'IDR')).toBe(0);
  });

  it('caps arithmetic evaluation at MAX_NOMINAL_VALUE', () => {
    expect(evaluateArithmetic('9999999999999 * 9', 'IDR')).toBe(MAX_NOMINAL_VALUE);
  });

  it('detects operators and formats expressions per currency', () => {
    expect(hasMathOperators('10000 + 5000')).toBe(true);
    expect(hasMathOperators('10000')).toBe(false);
    expect(formatExpression('1500000 + 25000', 'IDR')).toBe('1.500.000 + 25.000');
    expect(formatExpression('1500.75 * 2', 'USD')).toBe('1,500.75 * 2');
  });

  it('appends digits, decimal points, and handles backspace cleanly', () => {
    const first = appendDigitToExpression('', '5', 'IDR');
    expect(first.nextVal).toBe('5');
    const zeros = appendDigitToExpression(first.nextVal, '000', 'IDR');
    expect(zeros.nextVal).toBe('5.000');
    expect(backspaceExpression('5.000', 'IDR')).toBe('500');

    const dec = appendDigitToExpression('12', '.', 'USD');
    expect(dec.nextVal).toBe('12.');
    const decDigit = appendDigitToExpression(dec.nextVal, '5', 'USD');
    expect(decDigit.nextVal).toBe('12.5');
  });

  it('formats calculated display values for IDR and USD', () => {
    expect(formatCalculatedDisplay('1250000', 'IDR')).toBe('1.250.000');
    expect(formatCalculatedDisplay('1250.5', 'USD')).toBe('1,250.50');
    expect(formatCalculatedDisplay('0', 'USD')).toBe('0.00');
  });

  it('preserves JS dot-decimals in IDR expression formatting without 1000x inflation', () => {
    expect(formatExpression('1000.5', 'IDR')).toBe('1.000,5');
    expect(formatExpression('3333.3333', 'IDR')).toBe('3.333,33');
    expect(formatExpression('0.50', 'IDR')).toBe('0,50');
    expect(evaluateArithmetic('1.000,5', 'IDR')).toBe(1000.5);
    expect(evaluateArithmetic('1,000.50', 'USD')).toBe(1000.5);
  });

  it('handles currency rounding and leading negative balances cleanly', () => {
    expect(roundCurrencyAmount(0.1 + 0.2, 'USD')).toBe(0.3);
    expect(roundCurrencyAmount(10.3 - 10.1, 'USD')).toBe(0.2);
    expect(roundCurrencyAmount(0.0000000001, 'USD')).toBe(0);

    expect(hasMathOperators('-500.000')).toBe(false);
    expect(hasMathOperators('-500.000 + 100.000')).toBe(true);
    expect(evaluateArithmetic('-500.000 + 100.000', 'IDR')).toBe(-400000);
    expect(formatCalculatedDisplay('-500000', 'IDR')).toBe('-500.000');
  });

  it('QA end-to-end keypad typing simulation for negative credit card & cross-currency USD/IDR', () => {
    // Credit card negative entry sequence: '-' -> '1' -> '5' -> '000' -> '+ 250000'
    let expr = '-';
    expr = appendDigitToExpression(expr, '1', 'IDR').nextVal;
    expr = appendDigitToExpression(expr, '5', 'IDR').nextVal;
    expr = appendDigitToExpression(expr, '000', 'IDR').nextVal;
    expect(expr).toBe('-15.000');
    expr = appendDigitToExpression(expr, '00', 'IDR').nextVal;
    expect(expr).toBe('-1.500.000');
    expect(evaluateArithmetic(`${expr} + 250.000`, 'IDR')).toBe(-1_250_000);

    // USD typing > $1,000 with cents & backspace
    let usd = '';
    for (const d of ['1', '0', '0', '0', '.', '5']) {
      usd = appendDigitToExpression(usd, d, 'USD').nextVal;
    }
    expect(usd).toBe('1,000.5');
    expect(evaluateArithmetic(usd, 'USD')).toBe(1000.5);
    expect(formatCalculatedDisplay(evaluateArithmeticStr(`${usd} * 2`, 'USD'), 'USD')).toBe('2,001.00');
    expect(backspaceExpression(usd, 'USD')).toBe('1,000');
  });
});
