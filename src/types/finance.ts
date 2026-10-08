export interface SubAccount {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  description?: string;
  type: 'Bank' | 'E-Wallet' | 'Cash' | 'Investment' | 'Credit Card' | 'E-Money';
  currency: 'IDR' | 'USD';
  subAccounts: SubAccount[];
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  category: string;
  date: string;
  accountId: string;
  subAccountId: string;
  toAccountId?: string;
  toSubAccountId?: string;
}

export interface CategoryBudget {
  category: string;
  limit: number;
}

export interface CategoryCustomIcon {
  category: string;
  icon: string;
  color?: string;
  bg?: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDateDay: number;
  currency: 'IDR' | 'USD';
}


export const ACCOUNT_TYPES = ['Bank', 'E-Wallet', 'Cash', 'Investment', 'Credit Card', 'E-Money'] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Bills & Utilities',
  'Subscriptions',
  'Housing / Rent',
  'Internet & Phone',
  'Insurance',
  'Fitness & Gym',
  'Cloud & Storage',
  'Food & Beverages',
  'Snacks',
  'Shopping',
  'Fuel',
  'Parking',
  'Vehicle Services',
  'Public Services',
  'Personal',
  'Home Services',
  'Furnisings',
  'Social',
  'Health & Medical',
  'Education',
  'Travel',
  'Others',
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Allowance',
  'Interest',
  'Investments',
  'Bonus',
  'Gift',
  'Others',
];

export { MONTHS } from '../constants/date';

export const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const formatMoney = (amount: number, currency: 'IDR' | 'USD' = 'IDR'): string => {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

export const getAccountIcon = (type: Account['type']): string => {
  switch (type) {
    case 'Bank': return 'university';
    case 'E-Wallet': return 'mobile-alt';
    case 'Cash': return 'money-bill-wave';
    case 'Investment': return 'chart-line';
    case 'Credit Card': return 'credit-card';
    case 'E-Money': return 'mobile-alt';
    default: return 'wallet';
  }
};

// ---------------------------------------------------------------------------
// Shared colour system for the whole finance section
// ---------------------------------------------------------------------------

export const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export interface FinanceTheme {
  color: string;
  bg: string;
  border: string;
}

export const ACCOUNT_TYPE_THEME: Record<Account['type'], FinanceTheme> = {
  Bank: { color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.34)' },
  'E-Wallet': {
    color: '#C084FC',
    bg: 'rgba(192, 132, 252, 0.14)',
    border: 'rgba(192, 132, 252, 0.34)',
  },
  Cash: { color: '#34D399', bg: 'rgba(52, 211, 153, 0.14)', border: 'rgba(52, 211, 153, 0.34)' },
  Investment: {
    color: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.14)',
    border: 'rgba(251, 191, 36, 0.34)',
  },
  'Credit Card': {
    color: '#FB7185',
    bg: 'rgba(251, 113, 133, 0.14)',
    border: 'rgba(251, 113, 133, 0.34)',
  },
  'E-Money': { color: '#2DD4BF', bg: 'rgba(45, 212, 191, 0.14)', border: 'rgba(45, 212, 191, 0.34)' },
};

export const TX_TYPE_THEME: Record<'income' | 'expense' | 'transfer', FinanceTheme & { label: string }> = {
  income: {
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.34)',
    label: 'Income',
  },
  expense: {
    color: '#F43F5E',
    bg: 'rgba(244, 63, 94, 0.14)',
    border: 'rgba(244, 63, 94, 0.34)',
    label: 'Expense',
  },
  transfer: {
    color: '#818CF8',
    bg: 'rgba(129, 140, 248, 0.14)',
    border: 'rgba(129, 140, 248, 0.34)',
    label: 'Transfer',
  },
};

const CATEGORY_PALETTE = [
  '#F97316',
  '#F59E0B',
  '#84CC16',
  '#10B981',
  '#2DD4BF',
  '#38BDF8',
  '#818CF8',
  '#A855F7',
  '#EC4899',
  '#F43F5E',
];

const CATEGORY_COLOR_OVERRIDES: Record<string, string> = {
  'Food & Beverages': '#F97316',
  Snacks: '#F59E0B',
  Shopping: '#EC4899',
  'Bills & Utilities': '#8B5CF6',
  'Housing / Rent': '#A855F7',
  'Internet & Phone': '#38BDF8',
  Insurance: '#2DD4BF',
  'Fitness & Gym': '#84CC16',
  'Cloud & Storage': '#818CF8',
  Fuel: '#F59E0B',
  Parking: '#94A3B8',
  'Vehicle Services': '#FB923C',
  'Public Services': '#22D3EE',
  Personal: '#C084FC',
  'Home Services': '#34D399',
  Furnisings: '#F472B6',
  Social: '#FB7185',
  'Health & Medical': '#F43F5E',
  Education: '#06B6D4',
  Travel: '#22D3EE',
  Salary: '#10B981',
  Allowance: '#34D399',
  Interest: '#2DD4BF',
  Investments: '#84CC16',
  Bonus: '#FBBF24',
  Gift: '#F472B6',
  Transfer: '#818CF8',
  Adjustment: '#94A3B8',
  Others: '#94A3B8',
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return hash;
};

export const getCategoryColor = (category: string): string => {
  const override = CATEGORY_COLOR_OVERRIDES[category];
  if (override) return override;
  return CATEGORY_PALETTE[hashString(category) % CATEGORY_PALETTE.length];
};

export const getCategoryTheme = (
  category: string,
  customIcons?: CategoryCustomIcon[]
): FinanceTheme => {
  const custom = customIcons?.find((c) => c.category === category);
  if (custom?.color) {
    return {
      color: custom.color,
      bg: custom.bg || hexToRgba(custom.color, 0.14),
      border: hexToRgba(custom.color, 0.34),
    };
  }
  const color = getCategoryColor(category);
  return { color, bg: hexToRgba(color, 0.14), border: hexToRgba(color, 0.34) };
};