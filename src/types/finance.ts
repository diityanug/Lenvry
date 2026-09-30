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
  'Fuel',
  'Parking',
  'Vehicle Services',
  'Public Services',
  'Personal',
  'Home Services',
  'Furnisings',
  'Food & Beverages',
  'Snacks',
  'Shopping',
  'Bills & Utilities',
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

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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