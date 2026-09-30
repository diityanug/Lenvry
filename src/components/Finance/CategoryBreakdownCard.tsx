import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBudget, Transaction, CategoryCustomIcon, formatMoney } from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';

interface CategoryBreakdownCardProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  currency: 'IDR' | 'USD';
  customCategoryIcons?: CategoryCustomIcon[];
  onOpenSetBudget: () => void;
}

// Category visual mapping for distinctive colors and icons
export const getCategoryTheme = (
  category: string,
  type: 'expense' | 'income' = 'expense',
  customIcons?: CategoryCustomIcon[]
): { icon: any; color: string; bg: string } => {
  if (customIcons && customIcons.length > 0) {
    const match = customIcons.find((c) => c.category.toLowerCase() === category.toLowerCase());
    if (match) {
      return {
        icon: match.icon,
        color: match.color || COLORS.finance,
        bg: match.bg || 'rgba(56, 189, 248, 0.16)',
      };
    }
  }

  if (type === 'income') {
    switch (category) {
      case 'Salary':
        return { icon: 'cash-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' };
      case 'Allowance':
        return { icon: 'wallet-outline', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.16)' };
      case 'Interest':
        return { icon: 'trending-up-outline', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.16)' };
      case 'Investments':
        return { icon: 'stats-chart-outline', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.16)' };
      case 'Bonus':
        return { icon: 'trophy-outline', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' };
      case 'Gift':
        return { icon: 'gift-outline', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.16)' };
      default:
        return { icon: 'arrow-down-circle-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' };
    }
  }

  switch (category) {
    case 'Food & Beverages':
      return { icon: 'restaurant-outline', color: '#F97316', bg: 'rgba(249, 115, 22, 0.16)' };
    case 'Snacks':
      return { icon: 'cafe-outline', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' };
    case 'Transportation':
      return { icon: 'car-outline', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' };
    case 'Fuel':
      return { icon: 'speedometer-outline', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.16)' };
    case 'Parking':
      return { icon: 'car-sport-outline', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.16)' };
    case 'Vehicle Services':
      return { icon: 'construct-outline', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.16)' };
    case 'Shopping':
      return { icon: 'cart-outline', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.16)' };
    case 'Bills & Utilities':
      return { icon: 'receipt-outline', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.16)' };
    case 'Entertainment':
      return { icon: 'game-controller-outline', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.16)' };
    case 'Health & Medical':
      return { icon: 'medkit-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' };
    case 'Education':
      return { icon: 'school-outline', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.16)' };
    case 'Travel':
      return { icon: 'airplane-outline', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.16)' };
    case 'Personal':
      return { icon: 'person-outline', color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.16)' };
    case 'Home Services':
    case 'Furnisings':
      return { icon: 'home-outline', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.16)' };
    case 'Social':
      return { icon: 'people-outline', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.16)' };
    case 'Public Services':
      return { icon: 'business-outline', color: '#64748B', bg: 'rgba(100, 116, 139, 0.16)' };
    case 'Others':
      return { icon: 'ellipsis-horizontal-circle-outline', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.16)' };
    default:
      return { icon: 'pricetag-outline', color: COLORS.finance, bg: COLORS.financeLight };
  }
};

export const CategoryBreakdownCard = ({
  transactions,
  budgets,
  currency,
  customCategoryIcons,
  onOpenSetBudget,
}: CategoryBreakdownCardProps) => {
  // Group Expense Transactions
  const expenseTx = transactions.filter((t) => t.type === 'expense');
  const totalExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
  const expenseCatTotals: Record<string, { amount: number; count: number }> = {};
  expenseTx.forEach((t) => {
    if (!expenseCatTotals[t.category]) {
      expenseCatTotals[t.category] = { amount: 0, count: 0 };
    }
    expenseCatTotals[t.category].amount += t.amount;
    expenseCatTotals[t.category].count += 1;
  });
  const sortedExpenseCats = Object.entries(expenseCatTotals).sort((a, b) => b[1].amount - a[1].amount);
  const topExpenseCats = sortedExpenseCats.slice(0, 3);

  // Budgets Calculations
  const budgetedCategories = budgets.filter((b) => b.limit > 0);
  const totalBudgetLimit = budgetedCategories.reduce((sum, b) => sum + b.limit, 0);
  const totalBudgetSpent = budgetedCategories.reduce((sum, b) => sum + (expenseCatTotals[b.category]?.amount || 0), 0);
  const overallBudgetPercent = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;
  const isOverallOver = totalBudgetSpent > totalBudgetLimit && totalBudgetLimit > 0;
  const remainingBudget = totalBudgetLimit - totalBudgetSpent;

  return (
    <View style={cardStyles.card}>
      {/* 1. Header with Compact Title and Action Buttons */}
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.titleGroup}>
          <View style={cardStyles.iconWrap}>
            <Ionicons name="pie-chart-outline" size={17} color={COLORS.finance} />
          </View>
          <View>
            <Text style={cardStyles.title}>Spending & Budget</Text>
            <Text style={cardStyles.subtitle}>
              {budgetedCategories.length > 0
                ? `${overallBudgetPercent}% of budget used`
                : `${sortedExpenseCats.length} active categories`}
            </Text>
          </View>
        </View>

        <View style={cardStyles.headerActions}>
          <TouchableOpacity
            style={cardStyles.headerActionBtn}
            onPress={onOpenSetBudget}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={13} color={COLORS.finance} />
            <Text style={[cardStyles.headerActionBtnText, { color: COLORS.textPrimary }]}>Set Budget</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Budget Health Mini Progress (if budgets are configured) */}
      {budgetedCategories.length > 0 && (
        <View style={cardStyles.budgetHealthMiniBox}>
          <View style={cardStyles.budgetHealthRow}>
            <Text style={cardStyles.budgetHealthLabel}>MONTHLY BUDGET LIMIT</Text>
            <Text style={cardStyles.budgetHealthValues}>
              <Text style={{ color: isOverallOver ? COLORS.danger : COLORS.textPrimary, fontWeight: '800' }}>
                {formatMoney(totalBudgetSpent, currency)}
              </Text>
              {' / '}
              {formatMoney(totalBudgetLimit, currency)}
            </Text>
          </View>

          <View style={cardStyles.miniBarTrack}>
            <View
              style={[
                cardStyles.miniBarFill,
                {
                  width: `${Math.min(100, Math.max(3, overallBudgetPercent))}%`,
                  backgroundColor: isOverallOver
                    ? COLORS.danger
                    : overallBudgetPercent > 85
                    ? '#F59E0B'
                    : COLORS.finance,
                },
              ]}
            />
          </View>

          <View style={cardStyles.budgetHealthSubRow}>
            <Text style={[cardStyles.budgetHealthSubText, isOverallOver && { color: COLORS.danger }]}>
              {remainingBudget >= 0
                ? `${formatMoney(remainingBudget, currency)} left`
                : `Over by ${formatMoney(Math.abs(remainingBudget), currency)}`}
            </Text>
            <Text style={cardStyles.budgetHealthPercentText}>
              {overallBudgetPercent}%
            </Text>
          </View>
        </View>
      )}

      {/* 3. Top 3 Categories Mini Breakdown */}
      {topExpenseCats.length === 0 ? (
        <View style={cardStyles.emptyMiniBox}>
          <Text style={cardStyles.emptyMiniText}>No expense transactions this month</Text>
        </View>
      ) : (
        <View style={cardStyles.miniList}>
          {topExpenseCats.map(([category, data]) => {
            const percent = totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0;
            const theme = getCategoryTheme(category, 'expense', customCategoryIcons);

            return (
              <View key={category} style={cardStyles.miniItem}>
                <View style={cardStyles.miniItemTop}>
                  <View style={cardStyles.miniItemLeft}>
                    <View style={[cardStyles.miniIconBox, { backgroundColor: theme.bg }]}>
                      <Ionicons name={theme.icon} size={14} color={theme.color} />
                    </View>
                    <Text style={cardStyles.miniCategoryName} numberOfLines={1}>
                      {category}
                    </Text>
                  </View>

                  <View style={cardStyles.miniItemRight}>
                    <Text style={cardStyles.miniAmountText} numberOfLines={1}>
                      -{formatMoney(data.amount, currency)}
                    </Text>
                    <Text style={cardStyles.miniPercentText}>{percent}%</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={cardStyles.miniItemBarTrack}>
                  <View
                    style={[
                      cardStyles.miniItemBarFill,
                      {
                        width: `${Math.max(3, Math.min(100, percent))}%`,
                        backgroundColor: theme.color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  headerActionBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  // Budget Health Mini Box
  budgetHealthMiniBox: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 11,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  budgetHealthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  budgetHealthLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.7,
  },
  budgetHealthValues: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  miniBarTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  budgetHealthSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  budgetHealthSubText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  budgetHealthPercentText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },

  // Mini List
  miniList: {
    gap: 8,
  },
  miniItem: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  miniItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  miniItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  miniIconBox: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCategoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  miniItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniAmountText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.danger,
    fontVariant: ['tabular-nums'],
  },
  miniPercentText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    minWidth: 26,
    textAlign: 'right',
  },
  miniItemBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  miniItemBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },

  emptyMiniBox: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMiniText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
