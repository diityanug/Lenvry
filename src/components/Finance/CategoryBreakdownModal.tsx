import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CategoryBudget,
  Transaction,
  CategoryCustomIcon,
  formatMoney,
  getCategoryTheme,
  hexToRgba,
} from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';
import { getCategoryIcon } from './CategoryBreakdownCard';

interface CategoryBreakdownModalProps {
  visible: boolean;
  transactions: Transaction[];
  budgets: CategoryBudget[];
  currency: 'IDR' | 'USD';
  customCategoryIcons?: CategoryCustomIcon[];
  onClose: () => void;
  onOpenSetBudget: () => void;
}

export const CategoryBreakdownModal = ({
  visible,
  transactions,
  budgets,
  currency,
  customCategoryIcons,
  onClose,
  onOpenSetBudget,
}: CategoryBreakdownModalProps) => {
  const [mainTab, setMainTab] = useState<'categories' | 'budget'>('categories');
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');

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

  // Group Income Transactions
  const incomeTx = transactions.filter((t) => t.type === 'income');
  const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);
  const incomeCatTotals: Record<string, { amount: number; count: number }> = {};
  incomeTx.forEach((t) => {
    if (!incomeCatTotals[t.category]) {
      incomeCatTotals[t.category] = { amount: 0, count: 0 };
    }
    incomeCatTotals[t.category].amount += t.amount;
    incomeCatTotals[t.category].count += 1;
  });
  const sortedIncomeCats = Object.entries(incomeCatTotals).sort((a, b) => b[1].amount - a[1].amount);

  // Budgets Calculations
  const budgetedCategories = budgets.filter((b) => b.limit > 0);
  const totalBudgetLimit = budgetedCategories.reduce((sum, b) => sum + b.limit, 0);
  const totalBudgetSpent = budgetedCategories.reduce((sum, b) => sum + (expenseCatTotals[b.category]?.amount || 0), 0);
  const overallBudgetPercent = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;
  const isOverallOver = totalBudgetSpent > totalBudgetLimit && totalBudgetLimit > 0;
  const remainingBudget = totalBudgetLimit - totalBudgetSpent;

  // Presentation-only accent for the active sub tab / summary banner
  const isExpenseTab = categoryType === 'expense';
  const summaryAccent = isExpenseTab ? COLORS.danger : COLORS.success;
  const overallStatusColor = isOverallOver
    ? COLORS.danger
    : overallBudgetPercent > 85
    ? COLORS.warning
    : COLORS.finance;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={modalStyles.dismissArea} />
        </TouchableWithoutFeedback>

        <View style={modalStyles.content}>
          <View style={modalStyles.handle} />

          {/* Modal Header */}
          <View style={modalStyles.headerRow}>
            <View style={modalStyles.titleGroup}>
              <View style={modalStyles.headerIconWrap}>
                <Ionicons name="pie-chart-outline" size={20} color={COLORS.finance} />
              </View>
              <View style={modalStyles.titleTextCol}>
                <Text style={modalStyles.title} numberOfLines={1}>
                  Category &amp; Budget
                </Text>
                <Text style={modalStyles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                  Overview of spending &amp; monthly limits
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={modalStyles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Top Segmented Navigation: Categories vs Monthly Budget */}
          <View style={modalStyles.mainTabRow}>
            <TouchableOpacity
              style={[modalStyles.mainTabBtn, mainTab === 'categories' && modalStyles.mainTabBtnActive]}
              onPress={() => setMainTab('categories')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={mainTab === 'categories' ? COLORS.finance : COLORS.textMuted}
              />
              <Text
                style={[modalStyles.mainTabText, mainTab === 'categories' && modalStyles.mainTabTextActive]}
                numberOfLines={1}
              >
                Categories
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[modalStyles.mainTabBtn, mainTab === 'budget' && modalStyles.mainTabBtnActive]}
              onPress={() => setMainTab('budget')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={mainTab === 'budget' ? COLORS.finance : COLORS.textMuted}
              />
              <Text
                style={[modalStyles.mainTabText, mainTab === 'budget' && modalStyles.mainTabTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                Monthly Budget ({budgetedCategories.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={modalStyles.scrollContent}
          >
            {mainTab === 'categories' ? (
              <View>
                {/* Sub Tab: Expenses vs Income */}
                <View style={modalStyles.subTabRow}>
                  <TouchableOpacity
                    style={[
                      modalStyles.subTabBtn,
                      categoryType === 'expense' && {
                        backgroundColor: hexToRgba(COLORS.danger, 0.14),
                        borderColor: hexToRgba(COLORS.danger, 0.34),
                      },
                    ]}
                    onPress={() => setCategoryType('expense')}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="arrow-up-circle"
                      size={15}
                      color={categoryType === 'expense' ? COLORS.danger : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        modalStyles.subTabText,
                        categoryType === 'expense' && { color: COLORS.danger, fontWeight: '800' },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      Expenses ({sortedExpenseCats.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      modalStyles.subTabBtn,
                      categoryType === 'income' && {
                        backgroundColor: hexToRgba(COLORS.success, 0.14),
                        borderColor: hexToRgba(COLORS.success, 0.34),
                      },
                    ]}
                    onPress={() => setCategoryType('income')}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="arrow-down-circle"
                      size={15}
                      color={categoryType === 'income' ? COLORS.success : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        modalStyles.subTabText,
                        categoryType === 'income' && { color: COLORS.success, fontWeight: '800' },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      Income ({sortedIncomeCats.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Summary Banner */}
                <View
                  style={[
                    modalStyles.summaryBanner,
                    {
                      backgroundColor: hexToRgba(summaryAccent, 0.1),
                      borderColor: hexToRgba(summaryAccent, 0.28),
                    },
                  ]}
                >
                  <View style={modalStyles.summaryBannerLeft}>
                    <Text style={modalStyles.summaryBannerLabel} numberOfLines={1}>
                      {isExpenseTab ? 'TOTAL MONTHLY EXPENSES' : 'TOTAL MONTHLY INCOME'}
                    </Text>
                    <Text
                      style={[modalStyles.summaryBannerAmount, { color: summaryAccent }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {isExpenseTab
                        ? `-${formatMoney(totalExpense, currency)}`
                        : `+${formatMoney(totalIncome, currency)}`}
                    </Text>
                  </View>
                  <View
                    style={[
                      modalStyles.summaryBannerBadge,
                      {
                        backgroundColor: hexToRgba(summaryAccent, 0.16),
                        borderColor: hexToRgba(summaryAccent, 0.3),
                      },
                    ]}
                  >
                    <Text style={[modalStyles.summaryBannerBadgeText, { color: summaryAccent }]} numberOfLines={1}>
                      {isExpenseTab ? `${sortedExpenseCats.length} Categories` : `${sortedIncomeCats.length} Sources`}
                    </Text>
                  </View>
                </View>

                {/* Categories List */}
                {categoryType === 'expense' ? (
                  sortedExpenseCats.length === 0 ? (
                    <View style={modalStyles.emptyBox}>
                      <View style={modalStyles.emptyIconWrap}>
                        <Ionicons name="receipt-outline" size={26} color={COLORS.textMuted} />
                      </View>
                      <Text style={modalStyles.emptyTitle}>No Expenses Recorded</Text>
                      <Text style={modalStyles.emptyText}>
                        Add expense transactions to see your spending breakdown by category.
                      </Text>
                    </View>
                  ) : (
                    <View style={modalStyles.list}>
                      {sortedExpenseCats.map(([category, data]) => {
                        const percent = totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0;
                        const theme = getCategoryTheme(category, customCategoryIcons);
                        const icon = getCategoryIcon(category, 'expense', customCategoryIcons);
                        const budget = budgets.find((b) => b.category === category);
                        const isOverBudget = Boolean(budget && budget.limit > 0 && data.amount > budget.limit);

                        return (
                          <View key={category} style={[modalStyles.itemCard, { borderLeftColor: theme.color }]}>
                            <View style={modalStyles.itemMainRow}>
                              <View
                                style={[modalStyles.iconBox, { backgroundColor: theme.bg, borderColor: theme.border }]}
                              >
                                <Ionicons name={icon} size={20} color={theme.color} />
                              </View>

                              <View style={modalStyles.itemCenterCol}>
                                <View style={modalStyles.itemTitleRow}>
                                  <Text style={modalStyles.categoryName} numberOfLines={1}>
                                    {category}
                                  </Text>
                                  {isOverBudget && (
                                    <View style={modalStyles.overBadge}>
                                      <Text style={modalStyles.overBadgeText} numberOfLines={1}>
                                        Over
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={modalStyles.itemMetaText} numberOfLines={1}>
                                  {data.count} {data.count === 1 ? 'transaction' : 'transactions'}
                                  {budget && budget.limit > 0 && (
                                    <Text style={isOverBudget ? { color: COLORS.danger } : { color: COLORS.textMuted }}>
                                      {isOverBudget
                                        ? ` • Over by ${formatMoney(data.amount - budget.limit, currency)}`
                                        : ` • Limit: ${formatMoney(budget.limit, currency)}`}
                                    </Text>
                                  )}
                                </Text>
                              </View>

                              <View style={modalStyles.itemRightCol}>
                                <Text
                                  style={[modalStyles.amountText, { color: COLORS.danger }]}
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.7}
                                >
                                  -{formatMoney(data.amount, currency)}
                                </Text>
                                <View
                                  style={[
                                    modalStyles.percentBadge,
                                    { backgroundColor: hexToRgba(theme.color, 0.16), borderColor: theme.border },
                                  ]}
                                >
                                  <Text style={[modalStyles.percentShareText, { color: theme.color }]} numberOfLines={1}>
                                    {percent}%
                                  </Text>
                                </View>
                              </View>
                            </View>

                            <View style={modalStyles.barTrack}>
                              <View
                                style={[
                                  modalStyles.barFill,
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
                  )
                ) : sortedIncomeCats.length === 0 ? (
                  <View style={modalStyles.emptyBox}>
                    <View style={modalStyles.emptyIconWrap}>
                      <Ionicons name="wallet-outline" size={26} color={COLORS.textMuted} />
                    </View>
                    <Text style={modalStyles.emptyTitle}>No Income Recorded</Text>
                    <Text style={modalStyles.emptyText}>
                      Add income transactions to track which revenue streams contribute the most.
                    </Text>
                  </View>
                ) : (
                  <View style={modalStyles.list}>
                    {sortedIncomeCats.map(([category, data]) => {
                      const percent = totalIncome > 0 ? Math.round((data.amount / totalIncome) * 100) : 0;
                      const theme = getCategoryTheme(category, customCategoryIcons);
                      const icon = getCategoryIcon(category, 'income', customCategoryIcons);

                      return (
                        <View key={category} style={[modalStyles.itemCard, { borderLeftColor: theme.color }]}>
                          <View style={modalStyles.itemMainRow}>
                            <View
                              style={[modalStyles.iconBox, { backgroundColor: theme.bg, borderColor: theme.border }]}
                            >
                              <Ionicons name={icon} size={20} color={theme.color} />
                            </View>

                            <View style={modalStyles.itemCenterCol}>
                              <Text style={modalStyles.categoryName} numberOfLines={1}>
                                {category}
                              </Text>
                              <Text style={modalStyles.itemMetaText} numberOfLines={1}>
                                {data.count} {data.count === 1 ? 'transaction' : 'transactions'}
                              </Text>
                            </View>

                            <View style={modalStyles.itemRightCol}>
                              <Text
                                style={[modalStyles.amountText, { color: COLORS.success }]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.7}
                              >
                                +{formatMoney(data.amount, currency)}
                              </Text>
                              <View
                                style={[
                                  modalStyles.percentBadge,
                                  { backgroundColor: hexToRgba(theme.color, 0.16), borderColor: theme.border },
                                ]}
                              >
                                <Text style={[modalStyles.percentShareText, { color: theme.color }]} numberOfLines={1}>
                                  {percent}%
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={modalStyles.barTrack}>
                            <View
                              style={[
                                modalStyles.barFill,
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
            ) : (
              /* ==================== MONTHLY BUDGET TAB ==================== */
              <View>
                {budgetedCategories.length === 0 ? (
                  <View style={modalStyles.emptyBox}>
                    <View style={[modalStyles.emptyIconWrap, modalStyles.emptyIconWrapAccent]}>
                      <Ionicons name="shield-outline" size={26} color={COLORS.finance} />
                    </View>
                    <Text style={modalStyles.emptyTitle}>No Budgets Set This Month</Text>
                    <Text style={modalStyles.emptyText}>
                      Set monthly spending limits for categories like Food, Utilities, or Shopping to control your
                      expenses.
                    </Text>
                    <TouchableOpacity
                      style={modalStyles.emptyCtaBtn}
                      onPress={() => {
                        onClose();
                        setTimeout(() => onOpenSetBudget(), 200);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={18} color="#08090C" />
                      <Text style={modalStyles.emptyCtaText}>Set Monthly Budget</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    {/* Overall Budget Hero Banner */}
                    <View
                      style={[
                        modalStyles.budgetHeroBanner,
                        {
                          backgroundColor: hexToRgba(overallStatusColor, 0.08),
                          borderColor: hexToRgba(overallStatusColor, 0.26),
                        },
                      ]}
                    >
                      <View style={modalStyles.budgetHeroTop}>
                        <View style={modalStyles.budgetHeroTopLeft}>
                          <Text style={modalStyles.budgetHeroLabel} numberOfLines={1}>
                            TOTAL BUDGET HEALTH
                          </Text>
                          <Text
                            style={modalStyles.budgetHeroAmount}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                          >
                            {formatMoney(totalBudgetSpent, currency)}
                            <Text style={modalStyles.budgetHeroLimit}> / {formatMoney(totalBudgetLimit, currency)}</Text>
                          </Text>
                        </View>

                        <View
                          style={[
                            modalStyles.budgetStatusBadge,
                            {
                              backgroundColor: hexToRgba(overallStatusColor, 0.18),
                              borderColor: hexToRgba(overallStatusColor, 0.4),
                            },
                          ]}
                        >
                          <Text
                            style={[modalStyles.budgetStatusBadgeText, { color: overallStatusColor }]}
                            numberOfLines={1}
                          >
                            {isOverallOver ? 'EXCEEDED' : `${overallBudgetPercent}% USED`}
                          </Text>
                        </View>
                      </View>

                      {/* Overall Progress Bar */}
                      <View style={modalStyles.heroBarTrack}>
                        <View
                          style={[
                            modalStyles.barFill,
                            {
                              width: `${Math.min(100, Math.max(3, overallBudgetPercent))}%`,
                              backgroundColor: overallStatusColor,
                            },
                          ]}
                        />
                      </View>

                      <View style={modalStyles.budgetHeroBottom}>
                        <Text style={modalStyles.budgetHeroSubLeft} numberOfLines={1}>
                          {remainingBudget >= 0
                            ? `${formatMoney(remainingBudget, currency)} remaining`
                            : `Exceeded by ${formatMoney(Math.abs(remainingBudget), currency)}`}
                        </Text>
                        <Text style={modalStyles.budgetHeroSubRight} numberOfLines={1}>
                          {budgetedCategories.length} limits
                        </Text>
                      </View>
                    </View>

                    {/* Individual Budgets */}
                    <View style={modalStyles.list}>
                      {budgetedCategories.map((b) => {
                        const spent = expenseCatTotals[b.category]?.amount || 0;
                        const limit = b.limit;
                        const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                        const isOver = spent > limit;
                        const remaining = limit - spent;
                        const theme = getCategoryTheme(b.category, customCategoryIcons);
                        const icon = getCategoryIcon(b.category, 'expense', customCategoryIcons);

                        // Each budget bar uses its own category colour; red only when over.
                        const barColor = isOver ? COLORS.danger : theme.color;
                        const percentColor = isOver ? COLORS.danger : theme.color;

                        return (
                          <View key={b.category} style={[modalStyles.itemCard, { borderLeftColor: theme.color }]}>
                            <View style={modalStyles.itemMainRow}>
                              <View
                                style={[modalStyles.iconBox, { backgroundColor: theme.bg, borderColor: theme.border }]}
                              >
                                <Ionicons name={icon} size={20} color={theme.color} />
                              </View>

                              <View style={modalStyles.itemCenterCol}>
                                <Text style={modalStyles.categoryName} numberOfLines={1}>
                                  {b.category}
                                </Text>
                                <Text style={modalStyles.itemMetaText} numberOfLines={1}>
                                  Spent {formatMoney(spent, currency)} of {formatMoney(limit, currency)}
                                </Text>
                              </View>

                              <View style={modalStyles.itemRightCol}>
                                <Text style={[modalStyles.budgetPercentText, { color: percentColor }]} numberOfLines={1}>
                                  {percent}%
                                </Text>
                                <Text
                                  style={[
                                    modalStyles.budgetDiffText,
                                    isOver ? { color: COLORS.danger } : { color: COLORS.textMuted },
                                  ]}
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.7}
                                >
                                  {isOver
                                    ? `+${formatMoney(spent - limit, currency)} over`
                                    : `${formatMoney(remaining, currency)} left`}
                                </Text>
                              </View>
                            </View>

                            <View style={modalStyles.barTrack}>
                              <View
                                style={[
                                  modalStyles.barFill,
                                  {
                                    width: `${Math.min(100, Math.max(3, percent))}%`,
                                    backgroundColor: barColor,
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
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 20 : 14,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  scrollContent: {
    paddingBottom: 32,
    flexGrow: 0,
  },
  handle: {
    width: 44,
    height: 5,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  titleTextCol: {
    flex: 1,
    minWidth: 0,
  },
  headerIconWrap: {
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
  title: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
  },

  // Main Tabs
  mainTabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 5,
    gap: 6,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    minHeight: 48,
    borderRadius: RADIUS.md,
  },
  mainTabBtnActive: {
    backgroundColor: COLORS.bgCardHover,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.32)',
  },
  mainTabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  mainTabTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },

  // Sub Tabs
  subTabRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
    minHeight: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subTabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },

  // Summary Banner
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 18,
    borderWidth: 1,
  },
  summaryBannerLeft: {
    flex: 1,
    minWidth: 0,
  },
  summaryBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryBannerAmount: {
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  summaryBannerBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  summaryBannerBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // List Items
  list: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  itemCenterCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  overBadge: {
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    flexShrink: 0,
  },
  overBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.danger,
    letterSpacing: 0.2,
  },
  itemMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    flexShrink: 1,
  },
  itemRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: 84,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    maxWidth: 140,
  },
  percentBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  percentShareText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  budgetPercentText: {
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  budgetDiffText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
    maxWidth: 140,
  },
  barTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },

  // Budget Hero Banner
  budgetHeroBanner: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  budgetHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  budgetHeroTopLeft: {
    flex: 1,
    minWidth: 0,
  },
  budgetHeroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  budgetHeroAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  budgetHeroLimit: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  budgetStatusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  budgetStatusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroBarTrack: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: 16,
  },
  budgetHeroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  budgetHeroSubLeft: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },
  budgetHeroSubRight: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    flexShrink: 0,
  },

  // Empty State
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 10,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
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
  emptyIconWrapAccent: {
    backgroundColor: COLORS.financeLight,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.finance,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    marginTop: 12,
    minHeight: 48,
  },
  emptyCtaText: {
    color: '#08090C',
    fontSize: 13,
    fontWeight: '800',
  },
});
