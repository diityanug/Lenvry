export interface SubAccount {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'Wallet' | 'Bank' | 'Investment' | 'Receivable' | 'Payable' | 'Valas' | 'Emoney';
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

export const DEFAULT_EXPENSE_CATEGORIES = ['Foods and Beverages', 'Snacks', 'Transport', 'Parking', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Personal', 'Adjustments', 'Others'];
export const DEFAULT_INCOME_CATEGORIES = ['Salary', 'Allowance', 'Business', 'Bonus', 'Investment', 'Adjustments', 'Others'];
export const ACCOUNT_TYPES = ['Wallet', 'Bank', 'Investment', 'Receivable', 'Payable', 'Valas', 'Emoney'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const formatMoney = (angka: number, currency: 'IDR' | 'USD' = 'IDR') => {
  if (currency === 'USD') {
    return '$ ' + angka.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const getAccountIcon = (type: string) => {
  return type === 'Bank' ? 'university' : type === 'Wallet' ? 'wallet' : type === 'Payable' ? 'credit-card' : 'chart-line';
};