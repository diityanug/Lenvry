import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import {
  Account,
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
  accounts?: Account[];
  budgets: CategoryBudget[];
  currency: 'IDR' | 'USD';
  customCategoryIcons?: CategoryCustomIcon[];
  onOpenSetBudget: () => void;
  onOpenManageCategories?: () => void;
  onEditTransaction?: (tx: Transaction) => void;
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

// Donut geometry constants
const DONUT_SIZE = 192;
const DONUT_STROKE = 18;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2; // 87
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS; // ~546.637

interface DonutSliceItem {
  category: string;
  amount: number;
  count: number;
  share: number;
  percent: number;
  theme: CategoryVisual;
  strokeLength: number;
  strokeOffset: number;
}

const computeDonutSlices = (
  sortedCats: [string, { amount: number; count: number }][],
  totalExpense: number,
  customIcons?: CategoryCustomIcon[]
): DonutSliceItem[] => {
  let accumulatedOffset = 0;
  return sortedCats.map(([category, data]) => {
    const share = totalExpense > 0 ? data.amount / totalExpense : 0;
    const rawStrokeLength = share * DONUT_CIRCUMFERENCE;
    const currentOffset = accumulatedOffset;
    accumulatedOffset += rawStrokeLength;

    const theme = getCategoryTheme(category, 'expense', customIcons);
    const gap = sortedCats.length > 1 ? 2.5 : 0;
    const strokeLength = Math.max(1, rawStrokeLength - gap);

    return {
      category,
      amount: data.amount,
      count: data.count,
      share,
      percent: totalExpense > 0 ? Math.round(share * 100) : 0,
      theme,
      strokeLength,
      strokeOffset: -currentOffset,
    };
  });
};

export const CategoryBreakdownCard = ({
  transactions,
  accounts,
  budgets,
  currency,
  customCategoryIcons,
  onOpenSetBudget,
  onOpenManageCategories,
  onEditTransaction,
}: CategoryBreakdownCardProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { expenseCatTotals, totalExpense, sortedExpenseCats, expenseTx } = useMemo(() => {
    const expenses = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      if (accounts) {
        const acc = accounts.find((a) => a.id === t.accountId);
        if (acc?.type === 'Investment') return false;
      }
      return true;
    });
    const total = expenses.reduce((sum, t) => sum + t.amount, 0);

    const totals: Record<string, { amount: number; count: number }> = {};
    expenses.forEach((t) => {
      if (!totals[t.category]) {
        totals[t.category] = { amount: 0, count: 0 };
      }
      totals[t.category].amount += t.amount;
      totals[t.category].count += 1;
    });

    const sorted = Object.entries(totals).sort((a, b) => b[1].amount - a[1].amount);
    return { expenseCatTotals: totals, totalExpense: total, sortedExpenseCats: sorted, expenseTx: expenses };
  }, [transactions, accounts]);

  // Compute Donut SVG slices for ALL recorded categories
  const donutSlices = useMemo(() => {
    return computeDonutSlices(sortedExpenseCats, totalExpense, customCategoryIcons);
  }, [sortedExpenseCats, totalExpense, customCategoryIcons]);

  const activeSlice = selectedCategory
    ? donutSlices.find((s) => s.category === selectedCategory) || null
    : null;

  // Budgets Calculations (Filtered by active currency)
  const currentCurrencyBudgets = budgets.filter((b) => (b.currency || 'IDR') === currency);
  const budgetedCategories = currentCurrencyBudgets.filter((b) => b.limit > 0);
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
      {/* 1. Header with Title */}
      <View style={cardStyles.headerTop}>
        <View style={cardStyles.titleGroup}>
          <View style={cardStyles.iconWrap}>
            <Ionicons name="pie-chart-outline" size={20} color={COLORS.finance} />
          </View>
          <View style={cardStyles.titleTextCol}>
            <Text style={cardStyles.title} numberOfLines={1}>
              Spending Breakdown
            </Text>
            <Text style={cardStyles.subtitle} numberOfLines={1}>
              {sortedExpenseCats.length > 0
                ? `${sortedExpenseCats.length} categories • ${currency}`
                : `No expenses • ${currency}`}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons Below Title */}
      <View style={cardStyles.actionsRowBelow}>
        {onOpenManageCategories && (
          <TouchableOpacity
            style={cardStyles.actionPillBtn}
            onPress={onOpenManageCategories}
            activeOpacity={0.7}
          >
            <Ionicons name="grid-outline" size={14} color={COLORS.finance} />
            <Text style={cardStyles.actionPillBtnText}>Categories</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={cardStyles.actionPillBtn}
          onPress={onOpenSetBudget}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={14} color={COLORS.finance} />
          <Text style={cardStyles.actionPillBtnText}>Set Budget</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Donut Chart Section */}
      {sortedExpenseCats.length === 0 ? (
        <View style={cardStyles.emptyBox}>
          <View style={cardStyles.emptyIconWrap}>
            <Ionicons name="receipt-outline" size={24} color={COLORS.textMuted} />
          </View>
          <Text style={cardStyles.emptyTitle}>No expense transactions this month</Text>
          <Text style={cardStyles.emptySub}>Add an expense to view your category breakdown</Text>
        </View>
      ) : (
        <View style={cardStyles.donutSection}>
          <View style={cardStyles.donutWrapper}>
            <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
              {/* Background circular track */}
              <Circle
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={DONUT_RADIUS}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={DONUT_STROKE}
                fill="none"
              />

              {/* Slices for all categories */}
              {donutSlices.map((slice) => {
                const isSelected = selectedCategory === slice.category;
                const isDimmed = selectedCategory !== null && !isSelected;
                return (
                  <Circle
                    key={slice.category}
                    cx={DONUT_SIZE / 2}
                    cy={DONUT_SIZE / 2}
                    r={DONUT_RADIUS}
                    stroke={slice.theme.color}
                    strokeWidth={isSelected ? DONUT_STROKE + 4 : DONUT_STROKE}
                    strokeDasharray={`${slice.strokeLength} ${DONUT_CIRCUMFERENCE}`}
                    strokeDashoffset={slice.strokeOffset}
                    fill="none"
                    rotation={-90}
                    originX={DONUT_SIZE / 2}
                    originY={DONUT_SIZE / 2}
                    opacity={isDimmed ? 0.28 : 1}
                  />
                );
              })}
            </Svg>

            {/* Donut Center Display */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedCategory(null)}
              style={cardStyles.donutCenter}
            >
              <Text style={cardStyles.donutCenterLabel} numberOfLines={1}>
                {activeSlice ? activeSlice.category : 'TOTAL EXPENSE'}
              </Text>
              <Text
                style={cardStyles.donutCenterAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {formatMoney(activeSlice ? activeSlice.amount : totalExpense, currency)}
              </Text>
              <Text
                style={[
                  cardStyles.donutCenterMeta,
                  activeSlice ? { color: activeSlice.theme.color } : null,
                ]}
                numberOfLines={1}
              >
                {activeSlice
                  ? `${activeSlice.percent}% (${activeSlice.count} transaction)`
                  : `${sortedExpenseCats.length} Categories`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Interactive hint */}
          <Text style={cardStyles.donutHint}>
            {selectedCategory ? 'Tap center to view all categories' : 'Tap any category below to highlight'}
          </Text>
        </View>
      )}

      {/* 3. Budget Health Mini Progress (if budgets are configured) */}
      {budgetedCategories.length > 0 && (
        <View style={[cardStyles.budgetHealthBox, { borderColor: hexToRgba(budgetStatusColor, 0.28) }]}>
          <View style={cardStyles.budgetHealthRow}>
            <Text style={cardStyles.budgetHealthLabel} numberOfLines={1}>
              MONTHLY BUDGET
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
                ? `${formatMoney(remainingBudget, currency)} available`
                : `Exceeded by ${formatMoney(Math.abs(remainingBudget), currency)}`}
            </Text>
            <View style={[cardStyles.budgetHealthPercentBadge, { backgroundColor: hexToRgba(budgetStatusColor, 0.16) }]}>
              <Text style={[cardStyles.budgetHealthPercentText, { color: budgetStatusColor }]} numberOfLines={1}>
                {overallBudgetPercent}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 4. Complete Category Breakdown List (ALL recorded categories) */}
      {sortedExpenseCats.length > 0 && (
        <View style={cardStyles.listSection}>
          <View style={cardStyles.listHeaderRow}>
            <Text style={cardStyles.listHeaderText} numberOfLines={1}>
              ALL RECORDED CATEGORIES
            </Text>
            <Text style={cardStyles.listHeaderMeta} numberOfLines={1}>
              {sortedExpenseCats.length} Item
            </Text>
          </View>

          <View style={cardStyles.categoryList}>
            {sortedExpenseCats.map(([category, data]) => {
              const percent = totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0;
              const theme = getCategoryTheme(category, 'expense', customCategoryIcons);
              const isSelected = selectedCategory === category;

              // Check if a specific budget limit is set for this category
              const catBudget = currentCurrencyBudgets.find(
                (b) => b.category.toLowerCase() === category.toLowerCase() && b.limit > 0
              );
              const isOverCatBudget = catBudget && data.amount > catBudget.limit;

              const categoryTxItems: Transaction[] = isSelected
                ? expenseTx
                    .filter((t) => t.category.toLowerCase() === category.toLowerCase())
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                : [];

              return (
                <TouchableOpacity
                  key={category}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategory(isSelected ? null : category)}
                  style={[
                    cardStyles.categoryCard,
                    { borderLeftColor: theme.color },
                    isSelected && {
                      borderColor: theme.color,
                      backgroundColor: hexToRgba(theme.color, 0.08),
                    },
                  ]}
                >
                  <View style={cardStyles.categoryCardTop}>
                    {/* Left: Category Icon & Info */}
                    <View style={cardStyles.categoryCardLeft}>
                      <View
                        style={[
                          cardStyles.categoryIconBox,
                          { backgroundColor: theme.bg, borderColor: theme.border },
                        ]}
                      >
                        <Ionicons name={theme.icon} size={18} color={theme.color} />
                      </View>
                      <View style={cardStyles.categoryInfoCol}>
                        <Text style={cardStyles.categoryName} numberOfLines={1}>
                          {category}
                        </Text>
                        <Text style={cardStyles.categoryTxCount} numberOfLines={1}>
                          {data.count} {data.count === 1 ? 'transaction' : 'transactions'}
                        </Text>
                      </View>
                    </View>

                    {/* Right: Amount & Share % Badge */}
                    <View style={cardStyles.categoryCardRight}>
                      <Text
                        style={cardStyles.categoryAmountText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        -{formatMoney(data.amount, currency)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View
                          style={[
                            cardStyles.categoryPercentBadge,
                            {
                              backgroundColor: hexToRgba(theme.color, 0.16),
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text style={[cardStyles.categoryPercentText, { color: theme.color }]} numberOfLines={1}>
                            {percent}%
                          </Text>
                        </View>
                        <Ionicons
                          name={isSelected ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color={isSelected ? theme.color : COLORS.textMuted}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Share Progress Bar */}
                  <View style={cardStyles.categoryBarTrack}>
                    <View
                      style={[
                        cardStyles.categoryBarFill,
                        {
                          width: `${Math.max(3, Math.min(100, percent))}%`,
                          backgroundColor: theme.color,
                        },
                      ]}
                    />
                  </View>

                  {/* Category-specific budget note (if configured) */}
                  {catBudget && (
                    <View style={cardStyles.catBudgetRow}>
                      <Ionicons
                        name={isOverCatBudget ? 'alert-circle-outline' : 'shield-checkmark-outline'}
                        size={13}
                        color={isOverCatBudget ? COLORS.danger : COLORS.finance}
                      />
                      <Text
                        style={[
                          cardStyles.catBudgetText,
                          isOverCatBudget && { color: COLORS.danger },
                        ]}
                        numberOfLines={1}
                      >
                        Budget: {formatMoney(catBudget.limit, currency)} (
                        {Math.round((data.amount / catBudget.limit) * 100)}% used)
                      </Text>
                    </View>
                  )}

                  {/* Expanded Transaction List */}
                  {isSelected && (
                    <View style={cardStyles.expandedTxSection}>
                      <View style={cardStyles.expandedTxHeader}>
                        <Text style={cardStyles.expandedTxHeaderTitle}>
                          TRANSACTIONS IN {category.toUpperCase()} ({categoryTxItems.length})
                        </Text>
                        {onEditTransaction && (
                          <Text style={cardStyles.expandedTxHeaderHint}>Tap to edit</Text>
                        )}
                      </View>

                      {categoryTxItems.length === 0 ? (
                        <Text style={cardStyles.expandedEmptyText}>No transactions recorded</Text>
                      ) : (
                        <View style={cardStyles.expandedTxList}>
                          {categoryTxItems.map((tx) => {
                            const d = new Date(tx.date);
                            const now = new Date();
                            const isToday =
                              d.getDate() === now.getDate() &&
                              d.getMonth() === now.getMonth() &&
                              d.getFullYear() === now.getFullYear();
                            const dateStr = isToday
                              ? 'Today'
                              : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                            const timeStr = d.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            });
                            const acc = accounts?.find((a) => a.id === tx.accountId);
                            const sub = acc?.subAccounts?.find((s) => s.id === tx.subAccountId);
                            const accLabel = acc ? (sub ? `${acc.name} (${sub.name})` : acc.name) : '';

                            return (
                              <TouchableOpacity
                                key={tx.id}
                                style={cardStyles.expandedTxItem}
                                activeOpacity={onEditTransaction ? 0.7 : 1}
                                onPress={() => onEditTransaction && onEditTransaction(tx)}
                              >
                                <View style={cardStyles.expandedTxItemLeft}>
                                  <Text style={cardStyles.expandedTxDesc} numberOfLines={1}>
                                    {tx.description || 'No description'}
                                  </Text>
                                  <View style={cardStyles.expandedTxMetaRow}>
                                    <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
                                    <Text style={cardStyles.expandedTxMetaText}>
                                      {dateStr}, {timeStr}
                                    </Text>
                                    {accLabel ? (
                                      <>
                                        <Text style={cardStyles.expandedTxBullet}>•</Text>
                                        <Ionicons name="wallet-outline" size={11} color={COLORS.textMuted} />
                                        <Text style={cardStyles.expandedTxMetaText} numberOfLines={1}>
                                          {accLabel}
                                        </Text>
                                      </>
                                    ) : null}
                                  </View>
                                </View>
                                <View style={cardStyles.expandedTxItemRight}>
                                  <Text style={cardStyles.expandedTxAmount}>
                                    -{formatMoney(tx.amount, currency)}
                                  </Text>
                                  {onEditTransaction && (
                                    <Ionicons
                                      name="chevron-forward"
                                      size={12}
                                      color={COLORS.textMuted}
                                      style={{ marginLeft: 3 }}
                                    />
                                  )}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
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
  headerTop: {
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 16,
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
  actionsRowBelow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.finance,
  },

  // Donut Section
  donutSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 16,
  },
  donutWrapper: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    width: DONUT_SIZE - DONUT_STROKE * 2 - 16,
    height: DONUT_SIZE - DONUT_STROKE * 2 - 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  donutCenterLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 3,
  },
  donutCenterAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    maxWidth: '100%',
  },
  donutCenterMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.finance,
    textAlign: 'center',
    marginTop: 3,
  },
  donutHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
  },

  // Budget Health Mini Box
  budgetHealthBox: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 20,
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

  // Category List Section
  listSection: {
    marginTop: 4,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  listHeaderText: {
    fontSize: 11,
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
  categoryList: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  categoryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  categoryCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  categoryIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  categoryInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  categoryTxCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  categoryCardRight: {
    alignItems: 'flex-end',
    gap: 5,
    flexShrink: 0,
  },
  categoryAmountText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.danger,
    fontVariant: ['tabular-nums'],
    maxWidth: 130,
  },
  categoryPercentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  categoryPercentText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  categoryBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  catBudgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  catBudgetText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },

  // Expanded Transactions in Category Card
  expandedTxSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  expandedTxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expandedTxHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  expandedTxHeaderHint: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  expandedEmptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  expandedTxList: {
    gap: 6,
  },
  expandedTxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  expandedTxItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  expandedTxDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  expandedTxMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  expandedTxMetaText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  expandedTxBullet: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginHorizontal: 1,
  },
  expandedTxItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandedTxAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FB7185',
  },

  // Empty state
  emptyBox: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
