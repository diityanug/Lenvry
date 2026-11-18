import { Account, DebtItem, RecurringBill, Transaction } from '../types/finance';
import { roundCurrencyAmount } from './math';

export interface MonthlyCashflow {
  monthlyIncomeIDR: number;
  monthlyExpenseIDR: number;
  monthlyIncomeUSD: number;
  monthlyExpenseUSD: number;
}

export interface AccountDetailSummary {
  isInvestment: boolean;
  totalIncome: number;
  totalExpense: number;
  netInvested: number;
  totalTransfersIn: number;
  totalTransfersOut: number;
  returnPnL: number;
  returnPct: number | null;
}

export interface NetWorthWithDebtsSummary {
  accountsBalance: number;
  receivablesRemaining: number;
  debtsRemaining: number;
  netWorthInclDebts: number;
}

export function buildAccountsById(accounts: Account[]): Record<string, Account> {
  const map: Record<string, Account> = {};
  for (let i = 0; i < accounts.length; i++) {
    map[accounts[i].id] = accounts[i];
  }
  return map;
}

export function buildBalancesMap(transactions: Transaction[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    if (t.type === 'income') {
      const key = `${t.accountId}:${t.subAccountId}`;
      map[key] = roundCurrencyAmount((map[key] || 0) + t.amount);
    } else if (t.type === 'expense') {
      const key = `${t.accountId}:${t.subAccountId}`;
      map[key] = roundCurrencyAmount((map[key] || 0) - t.amount);
    } else if (t.type === 'transfer') {
      const fromKey = `${t.accountId}:${t.subAccountId}`;
      map[fromKey] = roundCurrencyAmount((map[fromKey] || 0) - t.amount);

      if (t.toAccountId && t.toSubAccountId) {
        const toKey = `${t.toAccountId}:${t.toSubAccountId}`;
        const received =
          typeof t.toAmount === 'number' && Number.isFinite(t.toAmount) && t.toAmount > 0
            ? t.toAmount
            : t.amount;
        map[toKey] = roundCurrencyAmount((map[toKey] || 0) + received);
      }
    }
  }
  return map;
}

export function computeAccountBalance(
  account: Account | undefined,
  balancesMap: Record<string, number>
): number {
  if (!account) return 0;
  // Sum across all pockets belonging to this account (including historical deleted-pocket keys)
  // so Account Total and Net Worth stay strictly invariant with the transaction ledger.
  const prefix = `${account.id}:`;
  let total = 0;
  for (const key in balancesMap) {
    if (key.startsWith(prefix)) {
      total += balancesMap[key] || 0;
    }
  }
  return roundCurrencyAmount(total, account.currency);
}

export function computeTotalBalanceByCurrency(
  accounts: Account[],
  balancesMap: Record<string, number>,
  currency: 'IDR' | 'USD'
): number {
  const total = accounts
    .filter((a) => a.currency === currency)
    .reduce((sum, acc) => sum + computeAccountBalance(acc, balancesMap), 0);
  return roundCurrencyAmount(total, currency);
}

export function isInvestmentTransaction(
  tx: Transaction,
  accountsById: Record<string, Account>
): boolean {
  if (accountsById[tx.accountId]?.type === 'Investment') return true;
  if (tx.toAccountId && accountsById[tx.toAccountId]?.type === 'Investment') return true;
  return false;
}

/** Balance reconciliations reconcile ledger drift without distorting cashflow analytics. */
export function isBalanceAdjustmentTransaction(tx: Transaction): boolean {
  return tx.category === 'Adjustment';
}

/** Debt & receivable principal flows are balance-sheet financing events, not earned income or living expense. */
export function isDebtTransaction(tx: Transaction): boolean {
  return Boolean(tx.debtId) || tx.category === 'Debt & Loan';
}

/** Excludes investment flows, balance reconciliations, and debt principal movements from operational metrics. */
export function isOperationalTransaction(
  tx: Transaction,
  accountsById: Record<string, Account>
): boolean {
  return (
    !isInvestmentTransaction(tx, accountsById) &&
    !isBalanceAdjustmentTransaction(tx) &&
    !isDebtTransaction(tx)
  );
}

/** Sums operational IDR expenses occurring on the same local calendar day as referenceDate. */
export function computeTodayExpensesIDR(
  transactions: Transaction[],
  accountsById: Record<string, Account>,
  referenceDate: Date = new Date()
): number {
  const targetYear = referenceDate.getFullYear();
  const targetMonth = referenceDate.getMonth();
  const targetDay = referenceDate.getDate();

  const total = transactions
    .filter((t) => {
      if (t.type !== 'expense') return false;
      if (!isOperationalTransaction(t, accountsById)) return false;

      const d = new Date(t.date);
      const isToday =
        d.getFullYear() === targetYear &&
        d.getMonth() === targetMonth &&
        d.getDate() === targetDay;
      if (!isToday) return false;

      // Isolate IDR transactions so USD accounts ($ amounts) aren't mixed with Rupiah
      return accountsById[t.accountId]?.currency !== 'USD';
    })
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  return roundCurrencyAmount(total, 'IDR');
}

export function filterTransactionsByMonth(
  transactions: Transaction[],
  monthDate: Date
): Transaction[] {
  const targetMonth = monthDate.getMonth();
  const targetYear = monthDate.getFullYear();
  return transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
  });
}

export function computeMonthlyCashflow(
  operationalMonthlyTransactions: Transaction[],
  accountsById: Record<string, Account>
): MonthlyCashflow {
  let monthlyIncomeIDR = 0;
  let monthlyExpenseIDR = 0;
  let monthlyIncomeUSD = 0;
  let monthlyExpenseUSD = 0;

  for (let i = 0; i < operationalMonthlyTransactions.length; i++) {
    const t = operationalMonthlyTransactions[i];
    const isUSD = accountsById[t.accountId]?.currency === 'USD';
    if (t.type === 'income') {
      if (isUSD) monthlyIncomeUSD += t.amount;
      else monthlyIncomeIDR += t.amount;
    } else if (t.type === 'expense') {
      if (isUSD) monthlyExpenseUSD += t.amount;
      else monthlyExpenseIDR += t.amount;
    }
  }

  return {
    monthlyIncomeIDR: roundCurrencyAmount(monthlyIncomeIDR, 'IDR'),
    monthlyExpenseIDR: roundCurrencyAmount(monthlyExpenseIDR, 'IDR'),
    monthlyIncomeUSD: roundCurrencyAmount(monthlyIncomeUSD, 'USD'),
    monthlyExpenseUSD: roundCurrencyAmount(monthlyExpenseUSD, 'USD'),
  };
}

/**
 * Computes account-level summary metrics without conflating investment transfers with gains,
 * and without counting balance reconciliations as ordinary account income/expense.
 */
export function computeAccountDetailSummary(
  account: Account | undefined,
  transactions: Transaction[],
  subFilter: string = 'all'
): AccountDetailSummary {
  if (!account) {
    return {
      isInvestment: false,
      totalIncome: 0,
      totalExpense: 0,
      netInvested: 0,
      totalTransfersIn: 0,
      totalTransfersOut: 0,
      returnPnL: 0,
      returnPct: null,
    };
  }

  const isInvestment = account.type === 'Investment';
  let inc = 0;
  let exp = 0;
  let transfersIn = 0;
  let transfersOut = 0;
  let netNonTransfer = 0;

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const isSource = tx.accountId === account.id;
    const isDest = tx.type === 'transfer' && tx.toAccountId === account.id;
    if (!isSource && !isDest) continue;

    const srcMatches = isSource && (subFilter === 'all' || tx.subAccountId === subFilter);
    const dstMatches = isDest && (subFilter === 'all' || tx.toSubAccountId === subFilter);
    if (!srcMatches && !dstMatches) continue;

    if (tx.type === 'income') {
      netNonTransfer += tx.amount;
      if (!isBalanceAdjustmentTransaction(tx)) {
        inc += tx.amount;
      }
    } else if (tx.type === 'expense') {
      netNonTransfer -= tx.amount;
      if (!isBalanceAdjustmentTransaction(tx)) {
        exp += tx.amount;
      }
    } else if (tx.type === 'transfer') {
      const received =
        typeof tx.toAmount === 'number' && Number.isFinite(tx.toAmount) && tx.toAmount > 0
          ? tx.toAmount
          : tx.amount;
      if (dstMatches && !srcMatches) {
        transfersIn += received;
        if (!isInvestment) inc += received;
      } else if (srcMatches && !dstMatches) {
        transfersOut += tx.amount;
        if (!isInvestment) exp += tx.amount;
      }
    }
  }

  const netInvested = roundCurrencyAmount(transfersIn - transfersOut, account.currency);
  const returnPnL = roundCurrencyAmount(netNonTransfer, account.currency);
  const returnPct =
    isInvestment && netInvested > 0
      ? Math.round((returnPnL / netInvested) * 1000) / 10
      : null;

  return {
    isInvestment,
    totalIncome: roundCurrencyAmount(inc, account.currency),
    totalExpense: roundCurrencyAmount(exp, account.currency),
    netInvested,
    totalTransfersIn: roundCurrencyAmount(transfersIn, account.currency),
    totalTransfersOut: roundCurrencyAmount(transfersOut, account.currency),
    returnPnL,
    returnPct,
  };
}

/**
 * Reconciles transfers involving a deleted account by converting them into Adjustment
 * entries on the surviving counterpart account so surviving balances remain intact
 * without distorting operational cashflow.
 */
export function reconcileTransactionsOnAccountDelete(
  transactions: Transaction[],
  deletedAccountId: string,
  deletedAccountName: string
): Transaction[] {
  const result: Transaction[] = [];
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    if (t.type !== 'transfer') {
      if (t.accountId !== deletedAccountId) result.push(t);
      continue;
    }

    const fromDeleted = t.accountId === deletedAccountId;
    const toDeleted = t.toAccountId === deletedAccountId;

    if (fromDeleted && (!t.toAccountId || toDeleted)) {
      continue;
    }

    if (fromDeleted && t.toAccountId) {
      const received =
        typeof t.toAmount === 'number' && Number.isFinite(t.toAmount) && t.toAmount > 0
          ? t.toAmount
          : t.amount;
      result.push({
        ...t,
        type: 'income',
        amount: received,
        category: 'Adjustment',
        accountId: t.toAccountId,
        subAccountId: t.toSubAccountId || 'main',
        deletedSubAccountName: t.deletedToSubAccountName,
        toAccountId: undefined,
        toSubAccountId: undefined,
        deletedToSubAccountName: undefined,
        toAmount: undefined,
        exchangeRate: undefined,
        description: t.description
          ? `${t.description} (From deleted ${deletedAccountName})`
          : `Transfer from deleted ${deletedAccountName}`,
      });
      continue;
    }

    if (toDeleted) {
      result.push({
        ...t,
        type: 'expense',
        category: 'Adjustment',
        toAccountId: undefined,
        toSubAccountId: undefined,
        deletedToSubAccountName: undefined,
        toAmount: undefined,
        exchangeRate: undefined,
        description: t.description
          ? `${t.description} (To deleted ${deletedAccountName})`
          : `Transfer to deleted ${deletedAccountName}`,
      });
      continue;
    }

    result.push(t);
  }
  return result;
}

export function computeNetWorthWithDebts(
  accounts: Account[],
  balancesMap: Record<string, number>,
  debts: DebtItem[],
  currency: 'IDR' | 'USD'
): NetWorthWithDebtsSummary {
  const accountsBalance = computeTotalBalanceByCurrency(accounts, balancesMap, currency);
  let receivablesRemaining = 0;
  let debtsRemaining = 0;

  for (let i = 0; i < debts.length; i++) {
    const d = debts[i];
    if (d.currency !== currency || d.status !== 'active') continue;
    if (d.type === 'receivable') receivablesRemaining += d.remainingAmount;
    else debtsRemaining += d.remainingAmount;
  }

  receivablesRemaining = roundCurrencyAmount(receivablesRemaining, currency);
  debtsRemaining = roundCurrencyAmount(debtsRemaining, currency);
  const netWorthInclDebts = roundCurrencyAmount(
    accountsBalance + receivablesRemaining - debtsRemaining,
    currency
  );

  return {
    accountsBalance,
    receivablesRemaining,
    debtsRemaining,
    netWorthInclDebts,
  };
}

export function resolveFormSubAccountIds(tx: Transaction, accounts: Account[]) {
  const srcAcc = accounts.find((a) => a.id === tx.accountId);
  const validSrcSubId = srcAcc?.subAccounts.some((s) => s.id === tx.subAccountId)
    ? tx.subAccountId
    : srcAcc?.subAccounts[0]?.id || tx.subAccountId;

  const dstAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : undefined;
  const validDstSubId = dstAcc
    ? dstAcc.subAccounts.some((s) => s.id === tx.toSubAccountId)
      ? tx.toSubAccountId || ''
      : dstAcc.subAccounts[0]?.id || ''
    : tx.toSubAccountId || '';

  return { validSrcSubId, validDstSubId };
}

/**
 * Matches active recurring bills for a period to monthly expense transactions using:
 * 1) Explicit `billId` references first (1:1 claimed, never double-matched), then
 * 2) Strict legacy description matching ("<bill>" or "paid <bill>" / category-verified containment).
 */
export function matchRecurringBillsToTransactions(
  bills: RecurringBill[],
  monthlyTransactions: Transaction[]
): Map<string, Transaction> {
  const matches = new Map<string, Transaction>();
  const claimedTxIds = new Set<string>();
  const expenses = monthlyTransactions.filter((t) => t.type === 'expense');

  // Pass 1: Explicit billId link
  for (let i = 0; i < bills.length; i++) {
    const bill = bills[i];
    const linked = expenses.find((t) => !claimedTxIds.has(t.id) && t.billId === bill.id);
    if (linked) {
      matches.set(bill.id, linked);
      claimedTxIds.add(linked.id);
    }
  }

  // Pass 2: Strict fallback for legacy transactions without billId
  for (let i = 0; i < bills.length; i++) {
    const bill = bills[i];
    if (matches.has(bill.id)) continue;
    const bName = bill.name.trim().toLowerCase();
    if (!bName) continue;

    const legacyMatch = expenses.find((t) => {
      if (claimedTxIds.has(t.id) || t.billId) return false;
      const desc = t.description.trim().toLowerCase();
      if (!desc) return false;
      if (desc === bName || desc === `paid ${bName}`) return true;
      const categoryMatches =
        t.category === bill.category || t.category === 'Bills & Utilities';
      return bName.length >= 4 && categoryMatches && desc.includes(bName);
    });

    if (legacyMatch) {
      matches.set(bill.id, legacyMatch);
      claimedTxIds.add(legacyMatch.id);
    }
  }

  return matches;
}
