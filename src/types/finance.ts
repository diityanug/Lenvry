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
  deletedSubAccountName?: string;
  toAccountId?: string;
  toSubAccountId?: string;
  deletedToSubAccountName?: string;
  toAmount?: number;
  exchangeRate?: number;
  billId?: string;
  debtId?: string;
  debtAction?: 'initial' | 'settlement';
}

// Resolve pocket display name and deleted state
export const resolveSubAccountDisplay = (
  account: Account | null | undefined,
  subAccountId: string | undefined,
  deletedName?: string,
  fallback = 'Main'
): { name: string; label: string; isDeleted: boolean } => {
  const activeSub = account?.subAccounts?.find((s) => s.id === subAccountId);
  if (activeSub) {
    return { name: activeSub.name, label: activeSub.name, isDeleted: false };
  }
  if (deletedName) {
    return { name: deletedName, label: `${deletedName} (Deleted)`, isDeleted: true };
  }
  const hasMissingPocket = Boolean(account && subAccountId && account.subAccounts.length > 0);
  if (hasMissingPocket) {
    return { name: 'Deleted Pocket', label: 'Deleted Pocket', isDeleted: true };
  }
  return { name: fallback, label: fallback, isDeleted: false };
};

export interface CategoryBudget {
  category: string;
  limit: number;
  currency?: 'IDR' | 'USD';
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
  startMonth?: number; // 0-11 (Jan=0, Dec=11)
  startYear?: number;  // e.g. 2026
  durationMonths?: number; // e.g. 1, 2, 3, 6, 12, or undefined/0 for ongoing
}

export interface DebtItem {
  id: string;
  type: 'debt' | 'receivable'; // 'debt' (You Owe) vs 'receivable' (Owed to You)
  personName: string;
  title: string;
  originalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: 'IDR' | 'USD';
  dueDate?: string;
  createdAt: string;
  status: 'active' | 'settled';
  notes?: string;
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
    return `rgba(184, 179, 170, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export interface FinanceTheme {
  color: string;
  bg: string;
  border: string;
}

export const ACCOUNT_TYPE_THEME: Record<Account['type'], FinanceTheme> = {
  Bank: { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)', border: 'rgba(37, 99, 235, 0.28)' },
  'E-Wallet': {
    color: '#B85D43',
    bg: 'rgba(184, 93, 67, 0.12)',
    border: 'rgba(184, 93, 67, 0.28)',
  },
  Cash: { color: '#16794B', bg: 'rgba(22, 121, 75, 0.12)', border: 'rgba(22, 121, 75, 0.28)' },
  Investment: {
    color: '#C96D12',
    bg: 'rgba(201, 109, 18, 0.12)',
    border: 'rgba(201, 109, 18, 0.28)',
  },
  'Credit Card': {
    color: '#C93B3B',
    bg: 'rgba(201, 59, 59, 0.12)',
    border: 'rgba(201, 59, 59, 0.28)',
  },
  'E-Money': { color: '#0D8A7E', bg: 'rgba(13, 138, 126, 0.12)', border: 'rgba(13, 138, 126, 0.28)' },
};

export const TX_TYPE_THEME: Record<'income' | 'expense' | 'transfer', FinanceTheme & { label: string }> = {
  income: {
    color: '#16794B',
    bg: 'rgba(22, 121, 75, 0.12)',
    border: 'rgba(22, 121, 75, 0.28)',
    label: 'Income',
  },
  expense: {
    color: '#C93B3B',
    bg: 'rgba(201, 59, 59, 0.12)',
    border: 'rgba(201, 59, 59, 0.28)',
    label: 'Expense',
  },
  transfer: {
    color: '#4F46E5',
    bg: 'rgba(79, 70, 229, 0.12)',
    border: 'rgba(79, 70, 229, 0.28)',
    label: 'Transfer',
  },
};

const CATEGORY_PALETTE = [
  '#B85D43',
  '#C96D12',
  '#3D7A5A',
  '#16794B',
  '#0D8A7E',
  '#2563EB',
  '#4F46E5',
  '#7E22CE',
  '#C93B3B',
  '#9E4A32',
];

const CATEGORY_COLOR_OVERRIDES: Record<string, string> = {
  'Food & Beverages': '#B85D43',
  Snacks: '#C96D12',
  Shopping: '#BE185D',
  'Bills & Utilities': '#4F46E5',
  'Housing / Rent': '#7E22CE',
  'Internet & Phone': '#2563EB',
  Insurance: '#0D8A7E',
  'Fitness & Gym': '#3D7A5A',
  'Cloud & Storage': '#4338CA',
  Fuel: '#B45309',
  Parking: '#64748B',
  'Vehicle Services': '#9E4A32',
  'Public Services': '#0F766E',
  Personal: '#7E22CE',
  'Home Services': '#3D7A5A',
  Furnisings: '#BE185D',
  Social: '#C93B3B',
  'Health & Medical': '#B91C1C',
  Education: '#0D8A7E',
  Travel: '#2563EB',
  Salary: '#16794B',
  Allowance: '#3D7A5A',
  Interest: '#0D8A7E',
  Investments: '#65A30D',
  Bonus: '#C96D12',
  Gift: '#BE185D',
  Transfer: '#4F46E5',
  Adjustment: '#64748B',
  'Debt & Loan': '#C96D12',
  Others: '#64748B',
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
      border: hexToRgba(custom.color, 0.30),
    };
  }
  const color = getCategoryColor(category);
  return { color, bg: hexToRgba(color, 0.14), border: hexToRgba(color, 0.30) };
};
