export interface SubAccount {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'Bank' | 'E-Wallet' | 'Cash' | 'Investment' | 'Credit Card';
  currency: 'IDR' | 'USD';
  subAccounts: SubAccount[];
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  accountId: string;
  subAccountId: string;
}

export const ACCOUNT_TYPES = ['Bank', 'E-Wallet', 'Cash', 'Investment', 'Credit Card'] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Beverages',
  'Snacks',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health & Medical',
  'Education',
  'Others',
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Allowance',
  'Investment',
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
    default: return 'wallet';
  }
};