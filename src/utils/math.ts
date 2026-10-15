/**
 * Arithmetic evaluator and expression formatter for nominal inputs.
 * Evaluates +, -, *, /, ×, ÷ with operator precedence (* and / before + and -).
 * Enforces a strict 13-digit limit (0.000.000.000.000) per operand to prevent ambiguity.
 * Formats inputs with thousands separators (dots for IDR, commas for USD).
 */

export const MAX_OPERAND_DIGITS = 13;
export const MAX_NOMINAL_VALUE = 9_999_999_999_999;
export const MAX_NOMINAL_VALUE_BIGINT = 9_999_999_999_999n;

/**
 * Returns true if the string contains any arithmetic operator.
 */
export function hasMathOperators(expr: string): boolean {
  if (!expr || typeof expr !== 'string') return false;
  return /[\+\-\*\/×÷]/.test(expr);
}

/**
 * Cleans an operand by extracting integer digits and optional decimal digits.
 */
export function cleanOperandDigits(
  operandStr: string,
  currency: 'IDR' | 'USD' = 'IDR'
): { intDigits: string; decDigits: string | null } {
  if (!operandStr) return { intDigits: '', decDigits: null };

  const decimalSep = currency === 'USD' ? '.' : ',';
  if (operandStr.includes(decimalSep)) {
    const parts = operandStr.split(decimalSep);
    const intDigits = parts[0].replace(/[,\.]/g, '');
    const decDigits = parts.slice(1).join('').replace(/[,\.]/g, '');
    return { intDigits, decDigits };
  }

  // Check if dot was used as a decimal like 10.5 in IDR
  if (currency === 'IDR' && /^\d+\.\d{1,2}$/.test(operandStr.trim())) {
    const parts = operandStr.trim().split('.');
    return { intDigits: parts[0], decDigits: parts[1] };
  }

  const intDigits = operandStr.replace(/[,\.]/g, '');
  return { intDigits, decDigits: null };
}

/**
 * Formats a single number operand with thousand separators and caps integer digits at 13.
 */
export function formatSingleOperand(
  operandStr: string,
  currency: 'IDR' | 'USD' = 'IDR'
): string {
  if (!operandStr) return '';
  const thousandSep = currency === 'USD' ? ',' : '.';
  const decimalSep = currency === 'USD' ? '.' : ',';
  const hasDec = operandStr.includes(decimalSep);
  const { intDigits, decDigits } = cleanOperandDigits(operandStr, currency);

  const cappedInt = intDigits.slice(0, MAX_OPERAND_DIGITS);
  const formattedInt = cappedInt.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);

  if (hasDec) {
    return formattedInt + decimalSep + (decDigits !== null ? decDigits.slice(0, 2) : '');
  }
  return formattedInt;
}

/**
 * Formats an entire arithmetic expression so all number operands have thousand separators.
 */
export function formatExpression(
  expr: string,
  currency: 'IDR' | 'USD' = 'IDR'
): string {
  if (!expr || typeof expr !== 'string') return '';
  const thousandSep = currency === 'USD' ? ',' : '.';
  const decimalSep = currency === 'USD' ? '.' : ',';

  // Split into tokens: operators and number parts
  const parts = expr.split(/(\s*[\+\-\*\/×÷]\s*)/);
  return parts
    .map((part) => {
      if (/^(\s*[\+\-\*\/×÷]\s*)$/.test(part)) return part;
      if (!part) return '';

      const clean = part.trim();
      if (!clean) return '';

      const hasDec = clean.includes(decimalSep);
      const { intDigits, decDigits } = cleanOperandDigits(clean, currency);
      const cappedInt = intDigits.slice(0, MAX_OPERAND_DIGITS);
      const formattedInt = cappedInt.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);

      if (hasDec) {
        return formattedInt + decimalSep + (decDigits !== null ? decDigits.slice(0, 2) : '');
      }
      return formattedInt;
    })
    .join('');
}

/**
 * Normalizes an expression for mathematical evaluation by stripping thousand separators.
 */
export function cleanExpressionForEval(
  expr: string,
  currency: 'IDR' | 'USD' = 'IDR'
): string {
  if (!expr || typeof expr !== 'string') return '';
  const parts = expr.split(/(\s*[\+\-\*\/×÷]\s*)/);

  return parts
    .map((part) => {
      if (/^(\s*[\+\-\*\/×÷]\s*)$/.test(part)) {
        return part.replace(/×/g, '*').replace(/÷/g, '/');
      }
      if (!part) return '';
      const p = part.trim();
      if (currency === 'IDR') {
        if (p.includes(',')) {
          const [intP, decP] = p.split(',');
          const cleanInt = intP.replace(/\./g, '');
          return decP !== undefined ? `${cleanInt}.${decP}` : cleanInt;
        }
        if (/^\d+\.\d{1,2}$/.test(p)) {
          return p;
        }
        return p.replace(/\./g, '');
      }
      return p.replace(/,/g, '');
    })
    .join('');
}

/**
 * Appends a digit or decimal point to an expression, respecting the 13-digit limit per operand.
 */
export function appendDigitToExpression(
  currVal: string,
  digit: string,
  currency: 'IDR' | 'USD' = 'IDR'
): { nextVal: string; reachedLimit: boolean } {
  const thousandSep = currency === 'USD' ? ',' : '.';
  const decimalSep = currency === 'USD' ? '.' : ',';

  // Decimal separator key (. or ,)
  if (digit === '.' || digit === ',') {
    const opMatch = currVal.match(/^(.*[\+\-\*\/×÷]\s*)(.*)$/);
    const lastOp = opMatch ? opMatch[2] : currVal;

    if (!lastOp) {
      return { nextVal: currVal + '0' + decimalSep, reachedLimit: false };
    }
    if (lastOp.includes(decimalSep)) {
      return { nextVal: currVal, reachedLimit: false };
    }
    const { intDigits } = cleanOperandDigits(lastOp, currency);
    if (intDigits.length >= MAX_OPERAND_DIGITS) {
      return { nextVal: currVal, reachedLimit: true };
    }
    return { nextVal: currVal + decimalSep, reachedLimit: false };
  }

  // Trailing operator? e.g. '1.000 + '
  if (/[\+\-\*\/×÷]\s*$/.test(currVal)) {
    if (digit === '0' || digit === '00' || digit === '000') {
      return { nextVal: currVal + '0', reachedLimit: false };
    }
    return { nextVal: currVal + digit, reachedLimit: false };
  }

  // Initial empty or '0'
  if (!currVal || currVal === '0') {
    if (digit === '0' || digit === '00' || digit === '000') {
      return { nextVal: '0', reachedLimit: false };
    }
    return { nextVal: digit, reachedLimit: false };
  }

  const opMatch = currVal.match(/^(.*[\+\-\*\/×÷]\s*)(.*)$/);
  const prefix = opMatch ? opMatch[1] : '';
  const lastOp = opMatch ? opMatch[2] : currVal;

  const { intDigits, decDigits } = cleanOperandDigits(lastOp, currency);

  if (decDigits !== null) {
    if (decDigits.length >= 2) {
      return { nextVal: currVal, reachedLimit: true };
    }
    const toAdd = digit.slice(0, 2 - decDigits.length);
    return { nextVal: currVal + toAdd, reachedLimit: false };
  }

  if (intDigits.length >= MAX_OPERAND_DIGITS) {
    return { nextVal: currVal, reachedLimit: true };
  }

  const remaining = MAX_OPERAND_DIGITS - intDigits.length;
  const toAdd = digit.slice(0, remaining);
  const reachedLimit = digit.length > remaining;

  const newInt = intDigits === '0' ? toAdd : intDigits + toAdd;
  const formattedLast = newInt.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);

  return { nextVal: prefix + formattedLast, reachedLimit };
}

/**
 * Handles backspace on an expression with thousand separators.
 */
export function backspaceExpression(
  currVal: string,
  currency: 'IDR' | 'USD' = 'IDR'
): string {
  if (!currVal || currVal.length <= 1) return '';
  const trimmed = currVal.trimEnd();

  if (/[\+\-\*\/×÷]$/.test(trimmed)) {
    return trimmed.slice(0, -1).trimEnd();
  }

  const opMatch = currVal.match(/^(.*[\+\-\*\/×÷]\s*)(.*)$/);
  const prefix = opMatch ? opMatch[1] : '';
  const lastOp = opMatch ? opMatch[2] : currVal;

  const thousandSep = currency === 'USD' ? ',' : '.';
  const decimalSep = currency === 'USD' ? '.' : ',';

  if (lastOp.endsWith(decimalSep)) {
    return prefix + lastOp.slice(0, -1);
  }

  const { intDigits, decDigits } = cleanOperandDigits(lastOp, currency);
  if (decDigits !== null && decDigits.length > 0) {
    const newDec = decDigits.slice(0, -1);
    const formattedInt = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
    return prefix + formattedInt + (newDec ? decimalSep + newDec : '');
  }

  if (intDigits.length <= 1) {
    return prefix ? prefix.trimEnd() : '';
  }

  const newInt = intDigits.slice(0, -1);
  const formattedInt = newInt.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
  return prefix + formattedInt;
}

/**
 * Evaluates an arithmetic expression string and returns the result as a string.
 * Uses BigInt for integer arithmetic and floats for decimals.
 */
export function evaluateArithmeticStr(
  expr: string,
  currency: 'IDR' | 'USD' = 'IDR'
): string {
  if (!expr || typeof expr !== 'string') return '0';

  // Normalize operators and remove thousands separators
  const clean = cleanExpressionForEval(expr, currency);
  if (!clean) return '0';

  // Match numbers (including scientific notation) or single operators
  const rawTokens = clean.match(/(\d+\.?\d*(?:[eE][+-]?\d+)?|[\+\-\*\/])/g);
  if (!rawTokens || rawTokens.length === 0) return '0';

  // Filter out trailing incomplete operators (e.g. "50000 + " -> "50000")
  const tokens = [...rawTokens];
  while (tokens.length > 0 && ['+', '-', '*', '/'].includes(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  if (tokens.length === 0) return '0';

  // Normalize tokens and handle unary minus
  const normalizedTokens: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (['+', '-', '*', '/'].includes(token)) {
      if (
        normalizedTokens.length === 0 ||
        ['+', '-', '*', '/'].includes(normalizedTokens[normalizedTokens.length - 1])
      ) {
        if (token === '-' && i + 1 < tokens.length && !['+', '-', '*', '/'].includes(tokens[i + 1])) {
          normalizedTokens.push(`-${tokens[i + 1]}`);
          i++;
          continue;
        }
        continue;
      }
      normalizedTokens.push(token);
    } else {
      normalizedTokens.push(token);
    }
  }

  if (normalizedTokens.length === 0) return '0';
  if (['+', '-', '*', '/'].includes(normalizedTokens[normalizedTokens.length - 1])) {
    normalizedTokens.pop();
  }

  // Pure integer arithmetic via BigInt
  const isPureBigInt =
    !normalizedTokens.some((t) => t.includes('.') || (t !== '/' && t.includes('e-'))) &&
    !normalizedTokens.includes('/');

  if (isPureBigInt) {
    try {
      // Pass 1: Multiplication
      const pass1: string[] = [];
      let i = 0;
      while (i < normalizedTokens.length) {
        const curr = normalizedTokens[i];
        if (curr === '*') {
          const prev = BigInt(pass1.pop() || '0');
          const next = BigInt(normalizedTokens[i + 1] || '0');
          pass1.push((prev * next).toString());
          i += 2;
        } else {
          pass1.push(curr);
          i++;
        }
      }

      // Pass 2: Addition and Subtraction
      let total = BigInt(pass1[0] || '0');
      let j = 1;
      while (j < pass1.length) {
        const op = pass1[j];
        const nextVal = BigInt(pass1[j + 1] || '0');
        if (op === '+') total += nextVal;
        else if (op === '-') total -= nextVal;
        j += 2;
      }
      if (total > MAX_NOMINAL_VALUE_BIGINT) {
        total = MAX_NOMINAL_VALUE_BIGINT;
      }
      return total.toString();
    } catch {
      // Fallback to floating point
    }
  }

  // Pass 1 for Decimals: Multiplication and Division
  const pass1: string[] = [];
  let i = 0;
  while (i < normalizedTokens.length) {
    const curr = normalizedTokens[i];
    if (curr === '*' || curr === '/') {
      const prev = parseFloat(pass1.pop() || '0');
      const next = parseFloat(normalizedTokens[i + 1] || '0');
      if (curr === '*') {
        pass1.push((prev * next).toString());
      } else {
        pass1.push(next !== 0 ? (prev / next).toString() : '0');
      }
      i += 2;
    } else {
      pass1.push(curr);
      i++;
    }
  }

  // Pass 2 for Decimals: Addition and Subtraction
  let total = parseFloat(pass1[0] || '0') || 0;
  let j = 1;
  while (j < pass1.length) {
    const op = pass1[j];
    const nextVal = parseFloat(pass1[j + 1] || '0');
    if (!isNaN(nextVal)) {
      if (op === '+') total += nextVal;
      else if (op === '-') total -= nextVal;
    }
    j += 2;
  }

  if (isNaN(total) || !isFinite(total)) return '0';
  if (total > MAX_NOMINAL_VALUE) {
    total = MAX_NOMINAL_VALUE;
  }
  return (Math.round(total * 10000) / 10000).toString();
}

/**
 * Returns numeric value of expression.
 */
export function evaluateArithmetic(
  expr: string,
  currency: 'IDR' | 'USD' = 'IDR'
): number {
  const str = evaluateArithmeticStr(expr, currency);
  const num = parseFloat(str);
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.min(num, MAX_NOMINAL_VALUE);
}

/**
 * Formats a raw number or calculated result string with proper currency separators.
 */
export function formatCalculatedDisplay(
  valStr: string,
  currency: 'IDR' | 'USD' = 'IDR'
): string {
  if (!valStr || valStr === '0') return currency === 'USD' ? '0.00' : '0';

  const isNegative = valStr.startsWith('-');
  const unsigned = isNegative ? valStr.slice(1) : valStr;
  const parts = unsigned.split('.');
  const intPart = parts[0];
  const decPart = parts[1];

  const separator = currency === 'USD' ? ',' : '.';
  const decimalPoint = currency === 'USD' ? '.' : ',';

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  let result = formattedInt;
  if (currency === 'USD') {
    result += decPart !== undefined ? '.' + decPart.slice(0, 2).padEnd(2, '0') : '.00';
  } else if (decPart !== undefined && decPart.length > 0) {
    result += decimalPoint + decPart.slice(0, 2);
  }

  return isNegative ? `-${result}` : result;
}
