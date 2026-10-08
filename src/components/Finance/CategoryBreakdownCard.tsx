import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CategoryBudget,
  Transaction,
  CategoryCustomIcon,
  formatMoney,
  getCategoryTheme as getSharedCategoryTheme,
  hexToRgba,
} from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';

interface CategoryBreakdownCardProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  currency: 'IDR' | 'USD';
  customCategoryIcons?: CategoryCustomIcon[];
  onOpenSetBudget: () => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type CategoryVisual = { icon: IoniconName; color: string; bg: string; border: string };

const INCOME_ICON_MAP: Record<string, IoniconName> = {
  Salary: 'cash-outline',
  Allowance: 'wallet-outline',
  Interest: 'trending-up-outline',
  Investments: 'stats-chart-outline',
  Bonus: 'trophy-outline',
  Gift: 'gift-outline',
};

const EXPENSE_ICON_MAP: Record<string, IoniconName> = {
  'Food & Beverages': 'restaurant-outline',
  Snacks: 'cafe-outline',
  Transportation: 'car-outline',
  Fuel: 'speedometer-outline',
  Parking: 'car-sport-outline',
  'Vehicle Services': 'construct-outline',
  Shopping: 'cart-outline',
  'Bills & Utilities': 'flash-outline',
  Subscriptions: 'apps-outline',
  'Housing / Rent': 'home-outline',
  'Internet & Phone': 'wifi-outline',
  Insurance: 'shield-checkmark-outline',
  'Fitness & Gym': 'barbell-outline',
  'Cloud & Storage': 'cloud-outline',
  Entertainment: 'game-controller-outline',
  'Health & Medical': 'medkit-outline',
  Education: 'school-outline',
  Travel: 'airplane-outline',
  Personal: 'person-outline',
  'Home Services': 'home-outline',
  Furnisings: 'home-outline',
  Social: 'people-outline',
  'Public Services': 'business-outline',
  Others: 'ellipsis-horizontal-circle-outline',
};

export const getCategoryIcon = (
  category: string,
  type: 'expense' | 'income' = 'expense',
  customIcons?: CategoryCustomIcon[]
): IoniconName => {
  const custom = customIcons?.find((c) => c.category.toLowerCase() === category.toLowerCase());
  if (custom?.icon) return custom.icon as IoniconName;
  if (type === 'income') return INCOME_ICON_MAP[category] || 'arrow-down-circle-outline';
  return EXPENSE_ICON_MAP[category] || 'pricetag-outline';
};

export const getCategoryTheme = (
  category: string,
  type: 'expense' | 'income' = 'expense',
  customIcons?: CategoryCustomIcon[]
): CategoryVisual => {
  const shared = getSharedCategoryTheme(category, customIcons);
  return {
    icon: getCategoryIcon(category, type, customIcons),
    color: shared.color,
    bg: shared.bg,
    border: shared.border,
  };
};

export const CategoryBreakdownCard = ({
  transactions,
  budgets,
  currency,
  customCategoryIcons,
  onOpenSetBudget,
}: CategoryBreakdownCardProps) => {
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
  const topShare = topExpenseCats.reduce(
    (sum, [, data]) => sum + (totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0),
    0
  );

  // Budgets Calculations
  const budgetedCategories = budgets.filter((b) => b.limit > 0);
  const totalBudgetLimit = budgetedCategories.reduce((sum, b) => sum + b.limit, 0);
  const totalBudgetSpent = budgetedCategories.reduce((sum, b) => sum + (expenseCatTotals[b.category]?.amount || 0), 0);
  const overallBudgetPercent = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;
  const isOverallOver = totalBudgetSpent > totalBudgetLimit && totalBudgetLimit > 0;
  const remainingBudget = totalBudgetLimit - totalBudgetSpent;

  const budgetStatusColor = isOverallOver
    ? COLORS.danger
    : overallBudgetPercent > 85
    ? COLORS.warning
    : COLORS.finance;

  return (
    <View style={cardStyles.card}>
      {/* Header with title and action button */}
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.titleGroup}>
          <View style={cardStyles.iconWrap}>
            <Ionicons name="pie-chart-outline" size={19} color={COLORS.finance} />
          </View>
          <View style={cardStyles.titleTextCol}>
            <Text style={cardStyles.title} numberOfLines={1}>
              Spending &amp; Budget
            </Text>
            <Text style={cardStyles.subtitle} numberOfLines={1}>
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
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="options-outline" size={18} color={COLORS.finance} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Spending split bar */}
      {topExpenseCats.length > 0 && (
        <View style={cardStyles.splitBarRow}>
          {topExpenseCats.map(([category, data]) => {
            const share = totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0;
            const theme = getCategoryTheme(category, 'expense', customCategoryIcons);
            return (
              <View
                key={category}
                style={[cardStyles.splitSeg, { flex: Math.max(share, 3), backgroundColor: theme.color }]}
              />
            );
          })}
          {topShare < 99.5 && (
            <View style={[cardStyles.splitSeg, cardStyles.splitSegRest, { flex: Math.max(100 - topShare, 3) }]} />
          )}
        </View>
      )}

      {/* Budget Health Mini Progress (if budgets are configured) */}
      {budgetedCategories.length > 0 && (
        <View style={[cardStyles.budgetHealthMiniBox, { borderColor: hexToRgba(budgetStatusColor, 0.28) }]}>
          <View style={cardStyles.budgetHealthRow}>
            <Text style={cardStyles.budgetHealthLabel} numberOfLines={1}>
              BUDGET LIMIT
            </Text>
            <Text style={cardStyles.budgetHealthValues} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
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
                  backgroundColor: budgetStatusColor,
                },
              ]}
            />
          </View>

          <View style={cardStyles.budgetHealthSubRow}>
            <Text
              style={[cardStyles.budgetHealthSubText, isOverallOver && { color: COLORS.danger }]}
              numberOfLines={1}
            >
              {remainingBudget >= 0
                ? `${formatMoney(remainingBudget, currency)} left`
                : `Over by ${formatMoney(Math.abs(remainingBudget), currency)}`}
            </Text>
            <View style={[cardStyles.budgetHealthPercentBadge, { backgroundColor: hexToRgba(budgetStatusColor, 0.16) }]}>
              <Text style={[cardStyles.budgetHealthPercentText, { color: budgetStatusColor }]} numberOfLines={1}>
                {overallBudgetPercent}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Top 3 Categories Mini Breakdown */}
      {topExpenseCats.length === 0 ? (
        <View style={cardStyles.emptyMiniBox}>
          <View style={cardStyles.emptyMiniIconWrap}>
            <Ionicons name="receipt-outline" size={20} color={COLORS.textMuted} />
          </View>
          <Text style={cardStyles.emptyMiniText} numberOfLines={1}>
            No expense transactions this month
          </Text>
        </View>
      ) : (
        <View>
          <View style={cardStyles.listHeaderRow}>
            <Text style={cardStyles.listHeaderText} numberOfLines={1}>
              TOP CATEGORIES
            </Text>
            <Text style={cardStyles.listHeaderMeta} numberOfLines={1}>
              {sortedExpenseCats.length} total
            </Text>
          </View>

          <View style={cardStyles.miniList}>
            {topExpenseCats.map(([category, data]) => {
              const percent = totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0;
              const theme = getCategoryTheme(category, 'expense', customCategoryIcons);

              return (
                <View key={category} style={[cardStyles.miniItem, { borderLeftColor: theme.color }]}>
                  <View style={cardStyles.miniItemTop}>
                    <View style={cardStyles.miniItemLeft}>
                      <View
                        style={[cardStyles.miniIconBox, { backgroundColor: theme.bg, borderColor: theme.border }]}
                      >
                        <Ionicons name={theme.icon} size={16} color={theme.color} />
                      </View>
                      <Text style={cardStyles.miniCategoryName} numberOfLines={1}>
                        {category}
                      </Text>
                    </View>

                    <View style={cardStyles.miniItemRight}>
                      <Text
                        style={cardStyles.miniAmountText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        -{formatMoney(data.amount, currency)}
                      </Text>
                      <View
                        style={[
                          cardStyles.miniPercentBadge,
                          { backgroundColor: hexToRgba(theme.color, 0.16), borderColor: theme.border },
                        ]}
                      >
                        <Text style={[cardStyles.miniPercentText, { color: theme.color }]} numberOfLines={1}>
                          {percent}%
                        </Text>
                      </View>
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
        </View>
      )}
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xxl,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.financeLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
    flexShrink: 0,
  },
  titleTextCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Spending split bar
  splitBarRow: {
    flexDirection: 'row',
    height: 10,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    gap: 3,
    marginBottom: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  splitSeg: {
    height: '100%',
    borderRadius: RADIUS.full,
    minWidth: 6,
  },
  splitSegRest: {
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
  },

  // Budget Health Mini Box
  budgetHealthMiniBox: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  budgetHealthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  budgetHealthLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  budgetHealthValues: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  miniBarTrack: {
    height: 8,
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
    gap: 10,
    marginTop: 10,
  },
  budgetHealthSubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  budgetHealthPercentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    flexShrink: 0,
  },
  budgetHealthPercentText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },

  // Mini List
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  listHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  listHeaderMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    flexShrink: 0,
  },
  miniList: {
    gap: 12,
  },
  miniItem: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  miniItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  miniItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  miniIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  miniCategoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  miniItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  miniAmountText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.danger,
    fontVariant: ['tabular-nums'],
    maxWidth: 130,
  },
  miniPercentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  miniPercentText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  miniItemBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  miniItemBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },

  emptyMiniBox: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyMiniIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyMiniText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
