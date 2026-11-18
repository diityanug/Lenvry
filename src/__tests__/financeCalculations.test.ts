import { describe, expect, it } from 'bun:test';
import { Account, DebtItem, RecurringBill, Transaction } from '../types/finance';
import {
  buildAccountsById,
  buildBalancesMap,
  computeAccountBalance,
  computeAccountDetailSummary,
  computeMonthlyCashflow,
  computeNetWorthWithDebts,
  computeTodayExpensesIDR,
  computeTotalBalanceByCurrency,
  filterTransactionsByMonth,
  isBalanceAdjustmentTransaction,
  isDebtTransaction,
  isInvestmentTransaction,
  isOperationalTransaction,
  matchRecurringBillsToTransactions,
  reconcileTransactionsOnAccountDelete,
  resolveFormSubAccountIds,
} from '../utils/financeCalculations';

const ACCOUNTS: Account[] = [
  {
    id: 'acc_idr',
    name: 'BCA',
    type: 'Bank',
    currency: 'IDR',
    subAccounts: [
      { id: 'sub_main', name: 'Main' },
      { id: 'sub_save', name: 'Savings' },
    ],
  },
  {
    id: 'acc_usd',
    name: 'Wise',
    type: 'Bank',
    currency: 'USD',
    subAccounts: [{ id: 'sub_usd', name: 'USD Pocket' }],
  },
  {
    id: 'acc_inv',
    name: 'Bibit',
    type: 'Investment',
    currency: 'IDR',
    subAccounts: [{ id: 'sub_inv', name: 'RDN' }],
  },
];

const TRANSACTIONS: Transaction[] = [
  {
    id: 'tx1',
    type: 'income',
    amount: 5_000_000,
    description: 'Salary',
    category: 'Salary',
    date: '2026-10-05T10:00:00.000Z',
    accountId: 'acc_idr',
    subAccountId: 'sub_main',
  },
  {
    id: 'tx2',
    type: 'expense',
    amount: 500_000,
    description: 'Groceries',
    category: 'Food & Beverages',
    date: '2026-10-06T10:00:00.000Z',
    accountId: 'acc_idr',
    subAccountId: 'sub_main',
  },
  {
    id: 'tx3',
    type: 'transfer',
    amount: 1_500_000,
    toAmount: 100,
    description: 'Topup Wise',
    category: 'Transfer',
    date: '2026-10-07T10:00:00.000Z',
    accountId: 'acc_idr',
    subAccountId: 'sub_main',
    toAccountId: 'acc_usd',
    toSubAccountId: 'sub_usd',
  },
  {
    id: 'tx4',
    type: 'transfer',
    amount: 1_000_000,
    description: 'Invest',
    category: 'Transfer',
    date: '2026-10-08T10:00:00.000Z',
    accountId: 'acc_idr',
    subAccountId: 'sub_main',
    toAccountId: 'acc_inv',
    toSubAccountId: 'sub_inv',
  },
  {
    id: 'tx5',
    type: 'income',
    amount: 200,
    description: 'Freelance',
    category: 'Salary',
    date: '2026-10-09T10:00:00.000Z',
    accountId: 'acc_usd',
    subAccountId: 'sub_usd',
  },
  {
    id: 'tx6',
    type: 'expense',
    amount: 250_000,
    description: 'Last month expense',
    category: 'Others',
    date: '2026-09-15T10:00:00.000Z',
    accountId: 'acc_idr',
    subAccountId: 'sub_save',
  },
];

describe('financeCalculations', () => {
  it('computes sub-account, account, and currency totals including cross-currency transfers', () => {
    const accountsById = buildAccountsById(ACCOUNTS);
    const balances = buildBalancesMap(TRANSACTIONS);

    // acc_idr sub_main: +5M - 500k - 1.5M - 1M = 2M; sub_save: -250k => total 1.75M
    expect(computeAccountBalance(accountsById.acc_idr, balances)).toBe(1_750_000);
    // acc_usd: +100 (cross-currency toAmount) + 200 = 300
    expect(computeAccountBalance(accountsById.acc_usd, balances)).toBe(300);
    // acc_inv: +1M
    expect(computeAccountBalance(accountsById.acc_inv, balances)).toBe(1_000_000);

    expect(computeTotalBalanceByCurrency(ACCOUNTS, balances, 'IDR')).toBe(2_750_000);
    expect(computeTotalBalanceByCurrency(ACCOUNTS, balances, 'USD')).toBe(300);
  });

  it('identifies investment transactions and excludes them from operational cashflow', () => {
    const accountsById = buildAccountsById(ACCOUNTS);
    expect(isInvestmentTransaction(TRANSACTIONS[3], accountsById)).toBe(true);
    expect(isInvestmentTransaction(TRANSACTIONS[0], accountsById)).toBe(false);

    const oct = filterTransactionsByMonth(TRANSACTIONS, new Date(2026, 9, 1));
    const operational = oct.filter((t) => !isInvestmentTransaction(t, accountsById));
    const cashflow = computeMonthlyCashflow(operational, accountsById);

    expect(cashflow).toEqual({
      monthlyIncomeIDR: 5_000_000,
      monthlyExpenseIDR: 500_000,
      monthlyIncomeUSD: 200,
      monthlyExpenseUSD: 0,
    });
  });

  it('resolves deleted or active sub-accounts cleanly for transaction forms', () => {
    const resolvedActive = resolveFormSubAccountIds(TRANSACTIONS[2], ACCOUNTS);
    expect(resolvedActive).toEqual({ validSrcSubId: 'sub_main', validDstSubId: 'sub_usd' });

    const deletedPocketTx: Transaction = {
      ...TRANSACTIONS[0],
      subAccountId: 'deleted_sub_id',
    };
    const resolvedFallback = resolveFormSubAccountIds(deletedPocketTx, ACCOUNTS);
    expect(resolvedFallback.validSrcSubId).toBe('sub_main');
  });

  it('keeps balance adjustments in ledger balances while excluding them from operational cashflow', () => {
    const accountsById = buildAccountsById(ACCOUNTS);
    const positiveAdj: Transaction = {
      id: 'adj_pos',
      type: 'income',
      amount: 300_000,
      description: 'Balance Adjustment',
      category: 'Adjustment',
      date: '2026-10-10T10:00:00.000Z',
      accountId: 'acc_idr',
      subAccountId: 'sub_main',
    };
    const negativeAdj: Transaction = {
      id: 'adj_neg',
      type: 'expense',
      amount: 50_000,
      description: 'Balance Adjustment',
      category: 'Adjustment',
      date: '2026-10-11T10:00:00.000Z',
      accountId: 'acc_idr',
      subAccountId: 'sub_save',
    };
    const invExpense: Transaction = {
      id: 'inv_exp',
      type: 'expense',
      amount: 100_000,
      description: 'Platform fee',
      category: 'Other',
      date: '2026-10-12T10:00:00.000Z',
      accountId: 'acc_inv',
      subAccountId: 'sub_inv',
    };

    const allTxs = [...TRANSACTIONS, positiveAdj, negativeAdj, invExpense];
    const balances = buildBalancesMap(allTxs);

    expect(computeAccountBalance(ACCOUNTS[0], balances)).toBe(1_750_000 + 250_000);
    expect(computeAccountBalance(ACCOUNTS[2], balances)).toBe(900_000);
    expect(computeTotalBalanceByCurrency(ACCOUNTS, balances, 'IDR')).toBe(2_900_000);

    expect(isBalanceAdjustmentTransaction(positiveAdj)).toBe(true);
    expect(isBalanceAdjustmentTransaction(TRANSACTIONS[0])).toBe(false);
    expect(isOperationalTransaction(positiveAdj, accountsById)).toBe(false);
    expect(isOperationalTransaction(negativeAdj, accountsById)).toBe(false);
    expect(isOperationalTransaction(invExpense, accountsById)).toBe(false);
    expect(isOperationalTransaction(TRANSACTIONS[3], accountsById)).toBe(false);
    expect(isOperationalTransaction(TRANSACTIONS[0], accountsById)).toBe(true);

    const oct = filterTransactionsByMonth(allTxs, new Date(2026, 9, 1));
    const operational = oct.filter((t) => isOperationalTransaction(t, accountsById));
    expect(computeMonthlyCashflow(operational, accountsById)).toEqual({
      monthlyIncomeIDR: 5_000_000,
      monthlyExpenseIDR: 500_000,
      monthlyIncomeUSD: 200,
      monthlyExpenseUSD: 0,
    });
  });

  it('computes today operational IDR expenses while excluding adjustments, investments, USD, transfers, and other days', () => {
    const accountsById = buildAccountsById(ACCOUNTS);
    const referenceDate = new Date(2026, 9, 15, 14, 30, 0);
    const sameDayIso = (hour: number) => new Date(2026, 9, 15, hour, 0, 0).toISOString();
    const yesterdayIso = new Date(2026, 9, 14, 12, 0, 0).toISOString();

    const dayTransactions: Transaction[] = [
      {
        id: 't_lunch',
        type: 'expense',
        amount: 45_000,
        description: 'Lunch',
        category: 'Food & Beverages',
        date: sameDayIso(12),
        accountId: 'acc_idr',
        subAccountId: 'sub_main',
      },
      {
        id: 't_coffee',
        type: 'expense',
        amount: 30_000,
        description: 'Coffee',
        category: 'Food & Beverages',
        date: sameDayIso(15),
        accountId: 'acc_idr',
        subAccountId: 'sub_save',
      },
      {
        id: 't_adj',
        type: 'expense',
        amount: 200_000,
        description: 'Balance Adjustment',
        category: 'Adjustment',
        date: sameDayIso(16),
        accountId: 'acc_idr',
        subAccountId: 'sub_main',
      },
      {
        id: 't_inv',
        type: 'expense',
        amount: 100_000,
        description: 'Brokerage fee',
        category: 'Other',
        date: sameDayIso(17),
        accountId: 'acc_inv',
        subAccountId: 'sub_inv',
      },
      {
        id: 't_usd',
        type: 'expense',
        amount: 15,
        description: 'Cloud subscription',
        category: 'Bills',
        date: sameDayIso(18),
        accountId: 'acc_usd',
        subAccountId: 'sub_usd',
      },
      {
        id: 't_transfer',
        type: 'transfer',
        amount: 500_000,
        description: 'Savings transfer',
        category: 'Transfer',
        date: sameDayIso(19),
        accountId: 'acc_idr',
        subAccountId: 'sub_main',
        toAccountId: 'acc_idr',
        toSubAccountId: 'sub_save',
      },
      {
        id: 't_yesterday',
        type: 'expense',
        amount: 99_000,
        description: 'Dinner yesterday',
        category: 'Food & Beverages',
        date: yesterdayIso,
        accountId: 'acc_idr',
        subAccountId: 'sub_main',
      },
    ];

    expect(computeTodayExpensesIDR(dayTransactions, accountsById, referenceDate)).toBe(75_000);
  });

  it('keeps deleted-pocket balances invariant in account totals and preserves balances on account deletion', () => {
    const accountsById = buildAccountsById(ACCOUNTS);
    const txWithDeletedPocket: Transaction[] = [
      ...TRANSACTIONS,
      {
        id: 'tx_del_pocket',
        type: 'income',
        amount: 400_000,
        description: 'Legacy pocket bonus',
        category: 'Bonus',
        date: '2026-10-12T10:00:00.000Z',
        accountId: 'acc_idr',
        subAccountId: 'deleted_sub_legacy',
      },
    ];
    const balances = buildBalancesMap(txWithDeletedPocket);
    // Deleted pocket still contributes to parent account balance (invariant with ledger)
    expect(computeAccountBalance(accountsById.acc_idr, balances)).toBe(2_150_000);

    // Deleting acc_idr converts external transfer (tx4 -> acc_inv) into non-cashflow Adjustment on acc_inv
    const reconciled = reconcileTransactionsOnAccountDelete(TRANSACTIONS, 'acc_idr', 'BCA');
    const reconciledBalances = buildBalancesMap(reconciled);
    expect(computeAccountBalance(accountsById.acc_inv, reconciledBalances)).toBe(1_000_000);
    expect(computeAccountBalance(accountsById.acc_usd, reconciledBalances)).toBe(300);

    const octReconciled = filterTransactionsByMonth(reconciled, new Date(2026, 9, 1));
    const operational = octReconciled.filter((t) => isOperationalTransaction(t, accountsById));
    expect(computeMonthlyCashflow(operational, accountsById)).toEqual({
      monthlyIncomeIDR: 0,
      monthlyExpenseIDR: 0,
      monthlyIncomeUSD: 200,
      monthlyExpenseUSD: 0,
    });
  });

  it('excludes debt transactions from operational cashflow while computing true net worth with debts', () => {
    const accountsById = buildAccountsById(ACCOUNTS);
    const debtTx: Transaction = {
      id: 'tx_debt_repay',
      type: 'expense',
      amount: 500_000,
      description: 'Paid debt to Budi',
      category: 'Debt & Loan',
      date: '2026-10-15T10:00:00.000Z',
      accountId: 'acc_idr',
      subAccountId: 'sub_main',
      debtId: 'debt_1',
      debtAction: 'settlement',
    };
    const allTxs = [...TRANSACTIONS, debtTx];
    expect(isDebtTransaction(debtTx)).toBe(true);
    expect(isOperationalTransaction(debtTx, accountsById)).toBe(false);

    const balances = buildBalancesMap(allTxs);
    // BCA drops by 500k
    expect(computeAccountBalance(accountsById.acc_idr, balances)).toBe(1_250_000);
    // Today expense excludes debt repayment
    expect(computeTodayExpensesIDR([debtTx], accountsById, new Date(2026, 9, 15, 12, 0))).toBe(0);

    const debts: DebtItem[] = [
      {
        id: 'debt_1',
        type: 'debt',
        personName: 'Budi',
        title: 'Loan',
        originalAmount: 1_500_000,
        paidAmount: 500_000,
        remainingAmount: 1_000_000,
        currency: 'IDR',
        createdAt: '2026-10-01T00:00:00.000Z',
        status: 'active',
      },
      {
        id: 'rec_1',
        type: 'receivable',
        personName: 'Siti',
        title: 'Ticket',
        originalAmount: 300_000,
        paidAmount: 0,
        remainingAmount: 300_000,
        currency: 'IDR',
        createdAt: '2026-10-02T00:00:00.000Z',
        status: 'active',
      },
    ];

    const summary = computeNetWorthWithDebts(ACCOUNTS, balances, debts, 'IDR');
    expect(summary).toEqual({
      accountsBalance: 2_250_000, // 1.25M BCA + 1M Bibit
      receivablesRemaining: 300_000,
      debtsRemaining: 1_000_000,
      netWorthInclDebts: 1_550_000,
    });
  });

  it('separates investment capital transfers from P&L return and excludes adjustments in account summaries', () => {
    const accountsById = buildAccountsById(ACCOUNTS);
    const invTxs: Transaction[] = [
      ...TRANSACTIONS, // tx4 transfers 1,000,000 into acc_inv
      {
        id: 'tx_inv_div',
        type: 'income',
        amount: 120_000,
        description: 'Dividend / Gain',
        category: 'Investments',
        date: '2026-10-20T10:00:00.000Z',
        accountId: 'acc_inv',
        subAccountId: 'sub_inv',
      },
      {
        id: 'tx_bca_adj',
        type: 'income',
        amount: 999_999,
        description: 'Balance Adjustment',
        category: 'Adjustment',
        date: '2026-10-21T10:00:00.000Z',
        accountId: 'acc_idr',
        subAccountId: 'sub_main',
      },
    ];

    const invSummary = computeAccountDetailSummary(accountsById.acc_inv, invTxs);
    expect(invSummary.isInvestment).toBe(true);
    expect(invSummary.netInvested).toBe(1_000_000);
    expect(invSummary.returnPnL).toBe(120_000);
    expect(invSummary.returnPct).toBe(12);

    const bankSummary = computeAccountDetailSummary(accountsById.acc_idr, invTxs);
    expect(bankSummary.isInvestment).toBe(false);
    // Excludes Adjustment (+999,999), includes Salary (+5M)
    expect(bankSummary.totalIncome).toBe(5_000_000);
  });

  it('matches recurring bills cleanly via billId without substring false positives or double-claiming', () => {
    const bills: RecurringBill[] = [
      { id: 'b1', name: 'Bayar Listrik', amount: 500_000, category: 'Bills & Utilities', dueDateDay: 5, currency: 'IDR' },
      { id: 'b2', name: 'Internet', amount: 300_000, category: 'Internet & Phone', dueDateDay: 10, currency: 'IDR' },
      { id: 'b3', name: 'Internet Extra', amount: 100_000, category: 'Internet & Phone', dueDateDay: 12, currency: 'IDR' },
    ];

    const monthlyTxs: Transaction[] = [
      {
        id: 'tx_coffee',
        type: 'expense',
        amount: 20_000,
        description: 'Bayar',
        category: 'Food & Beverages',
        date: '2026-10-03T10:00:00.000Z',
        accountId: 'acc_idr',
        subAccountId: 'sub_main',
      },
      {
        id: 'tx_net_explicit',
        type: 'expense',
        amount: 310_000,
        description: 'Wifi rumah bulan ini',
        category: 'Internet & Phone',
        date: '2026-10-10T10:00:00.000Z',
        accountId: 'acc_idr',
        subAccountId: 'sub_main',
        billId: 'b2',
      },
      {
        id: 'tx_listrik',
        type: 'expense',
        amount: 480_000,
        description: 'Paid Bayar Listrik',
        category: 'Bills & Utilities',
        date: '2026-10-05T10:00:00.000Z',
        accountId: 'acc_idr',
        subAccountId: 'sub_main',
      },
    ];

    const matches = matchRecurringBillsToTransactions(bills, monthlyTxs);
    expect(matches.get('b1')?.id).toBe('tx_listrik');
    expect(matches.get('b2')?.id).toBe('tx_net_explicit');
    expect(matches.get('b3')).toBeUndefined();
  });

  it('QA full accounting cycle: credit card liability, investment yield+withdrawal, and cross-currency delete preservation', () => {
    const accountsWithCredit: Account[] = [
      ...ACCOUNTS,
      {
        id: 'acc_cc',
        name: 'BCA Card',
        type: 'Credit Card',
        currency: 'IDR',
        subAccounts: [{ id: 'sub_cc', name: 'Main' }],
      },
    ];
    const map = buildAccountsById(accountsWithCredit);

    const ledger: Transaction[] = [
      // Starting cash: +10M in BCA
      {
        id: 'qa_sal',
        type: 'income',
        amount: 10_000_000,
        description: 'Salary',
        category: 'Salary',
        date: '2026-11-01T10:00:00.000Z',
        accountId: 'acc_idr',
        subAccountId: 'sub_main',
      },
      // Invest 4M BCA -> Bibit (transfer: neutral to net worth & operational cashflow)
      {
        id: 'qa_inv_in',
        type: 'transfer',
        amount: 4_000_000,
        description: 'Topup Bibit',
        category: 'Transfer',
        date: '2026-11-02T10:00:00.000Z',
        accountId: 'acc_idr',
        subAccountId: 'sub_main',
        toAccountId: 'acc_inv',
        toSubAccountId: 'sub_inv',
      },
      // Investment market profit via Balance Adjustment +600k (+15%)
      {
        id: 'qa_inv_gain',
        type: 'income',
        amount: 600_000,
        description: 'Balance Adjustment',
        category: 'Adjustment',
        date: '2026-11-05T10:00:00.000Z',
        accountId: 'acc_inv',
        subAccountId: 'sub_inv',
      },
      // Withdraw 1M back to BCA
      {
        id: 'qa_inv_out',
        type: 'transfer',
        amount: 1_000_000,
        description: 'Withdraw Bibit',
        category: 'Transfer',
        date: '2026-11-06T10:00:00.000Z',
        accountId: 'acc_inv',
        subAccountId: 'sub_inv',
        toAccountId: 'acc_idr',
        toSubAccountId: 'sub_main',
      },
      // Spend 1.5M on Credit Card
      {
        id: 'qa_cc_spend',
        type: 'expense',
        amount: 1_500_000,
        description: 'Flight ticket',
        category: 'Travel',
        date: '2026-11-07T10:00:00.000Z',
        accountId: 'acc_cc',
        subAccountId: 'sub_cc',
      },
      // Pay 500k from BCA -> Credit Card (transfer: reduces CC debt to -1M, operational expense stays 1.5M)
      {
        id: 'qa_cc_pay',
        type: 'transfer',
        amount: 500_000,
        description: 'CC Payment',
        category: 'Transfer',
        date: '2026-11-08T10:00:00.000Z',
        accountId: 'acc_idr',
        subAccountId: 'sub_main',
        toAccountId: 'acc_cc',
        toSubAccountId: 'sub_cc',
      },
      // Lend 500k from BCA (initial debt cash record, excluded from expense & covered by receivable asset)
      {
        id: 'qa_lend',
        type: 'expense',
        amount: 500_000,
        description: 'Lent to Raka: Dinner',
        category: 'Debt & Loan',
        date: '2026-11-09T10:00:00.000Z',
        accountId: 'acc_idr',
        subAccountId: 'sub_main',
        debtId: 'd_raka',
        debtAction: 'initial',
      },
      // Cross-currency FX transfer: BCA 1,600,000 -> Wise $100
      {
        id: 'qa_fx',
        type: 'transfer',
        amount: 1_600_000,
        toAmount: 100,
        exchangeRate: 16_000,
        description: 'FX Wise',
        category: 'Transfer',
        date: '2026-11-10T10:00:00.000Z',
        accountId: 'acc_idr',
        subAccountId: 'sub_main',
        toAccountId: 'acc_usd',
        toSubAccountId: 'sub_usd',
      },
    ];

    const balances = buildBalancesMap(ledger);
    // BCA: +10M - 4M + 1M - 500k - 500k - 1.6M = 4,400,000
    expect(computeAccountBalance(map.acc_idr, balances)).toBe(4_400_000);
    // Bibit: +4M + 600k - 1M = 3,600,000
    expect(computeAccountBalance(map.acc_inv, balances)).toBe(3_600_000);
    // Credit card: -1.5M + 500k = -1,000,000
    expect(computeAccountBalance(map.acc_cc, balances)).toBe(-1_000_000);
    // Wise: $100
    expect(computeAccountBalance(map.acc_usd, balances)).toBe(100);

    // IDR Accounts Net Worth: 4.4M + 3.6M - 1.0M = 7,000,000
    expect(computeTotalBalanceByCurrency(accountsWithCredit, balances, 'IDR')).toBe(7_000_000);

    // Investment Detail P&L: Net Invested = 4M - 1M = 3M; Return P&L = +600k (+20%)
    const invSummary = computeAccountDetailSummary(map.acc_inv, ledger);
    expect(invSummary.netInvested).toBe(3_000_000);
    expect(invSummary.returnPnL).toBe(600_000);
    expect(invSummary.returnPct).toBe(20);

    // Operational Monthly Cashflow (Nov 2026): Income 10M, Expense 1.5M (CC purchase ONLY; CC pay, investment, FX & debt excluded)
    const nov = filterTransactionsByMonth(ledger, new Date(2026, 10, 1));
    const ops = nov.filter((t) => isOperationalTransaction(t, map));
    expect(computeMonthlyCashflow(ops, map)).toEqual({
      monthlyIncomeIDR: 10_000_000,
      monthlyExpenseIDR: 1_500_000,
      monthlyIncomeUSD: 0,
      monthlyExpenseUSD: 0,
    });

    // Net worth including Raka's 500k receivable: 7,000,000 + 500,000 = 7,500,000
    const nwDebts = computeNetWorthWithDebts(
      accountsWithCredit,
      balances,
      [
        {
          id: 'd_raka',
          type: 'receivable',
          personName: 'Raka',
          title: 'Dinner',
          originalAmount: 500_000,
          paidAmount: 0,
          remainingAmount: 500_000,
          currency: 'IDR',
          createdAt: '2026-11-09T10:00:00.000Z',
          status: 'active',
        },
      ],
      'IDR'
    );
    expect(nwDebts.netWorthInclDebts).toBe(7_500_000);

    // Deleting BCA preserves Wise's $100 FX transfer balance cleanly!
    const afterDeleteBca = reconcileTransactionsOnAccountDelete(ledger, 'acc_idr', 'BCA');
    const postDeleteBalances = buildBalancesMap(afterDeleteBca);
    expect(computeAccountBalance(map.acc_usd, postDeleteBalances)).toBe(100);
    expect(computeAccountBalance(map.acc_inv, postDeleteBalances)).toBe(3_600_000);
    expect(computeAccountBalance(map.acc_cc, postDeleteBalances)).toBe(-1_000_000);
  });
});
