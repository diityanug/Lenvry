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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBudget, Transaction, CategoryCustomIcon, formatMoney } from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';
import { getCategoryTheme } from './CategoryBreakdownCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const FIXED_MODAL_HEIGHT = Math.round(SCREEN_HEIGHT * 0.85);

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
                <Ionicons name="pie-chart-outline" size={18} color={COLORS.finance} />
              </View>
              <View style={{ flex: 1, flexShrink: 1 }}>
                <Text style={modalStyles.title} numberOfLines={1}>Category & Budget</Text>
                <Text style={modalStyles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                  Overview of spending & monthly limits
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>

              <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close-circle" size={26} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
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
                style={{ marginRight: 8 }}
              />
              <Text style={[modalStyles.mainTabText, mainTab === 'categories' && modalStyles.mainTabTextActive]}>
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
                style={{ marginRight: 8 }}
              />
              <Text style={[modalStyles.mainTabText, mainTab === 'budget' && modalStyles.mainTabTextActive]}>
                Monthly Budget ({budgetedCategories.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          >
            {mainTab === 'categories' ? (
              <View>
                {/* Sub Tab: Expenses vs Income */}
                <View style={modalStyles.subTabRow}>
                  <TouchableOpacity
                    style={[
                      modalStyles.subTabBtn,
                      categoryType === 'expense' && modalStyles.subTabBtnExpenseActive,
                    ]}
                    onPress={() => setCategoryType('expense')}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="arrow-up-circle"
                      size={14}
                      color={categoryType === 'expense' ? COLORS.danger : COLORS.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        modalStyles.subTabText,
                        categoryType === 'expense' && { color: COLORS.danger, fontWeight: '800' },
                      ]}
                    >
                      Expenses ({sortedExpenseCats.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      modalStyles.subTabBtn,
                      categoryType === 'income' && modalStyles.subTabBtnIncomeActive,
                    ]}
                    onPress={() => setCategoryType('income')}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="arrow-down-circle"
                      size={14}
                      color={categoryType === 'income' ? COLORS.success : COLORS.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        modalStyles.subTabText,
                        categoryType === 'income' && { color: COLORS.success, fontWeight: '800' },
                      ]}
                    >
                      Income ({sortedIncomeCats.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Summary Banner */}
                <View style={modalStyles.summaryBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={modalStyles.summaryBannerLabel}>
                      {categoryType === 'expense' ? 'TOTAL MONTHLY EXPENSES' : 'TOTAL MONTHLY INCOME'}
                    </Text>
                    <Text
                      style={[
                        modalStyles.summaryBannerAmount,
                        categoryType === 'expense' ? { color: COLORS.danger } : { color: COLORS.success },
                      ]}
                    >
                      {categoryType === 'expense'
                        ? `-${formatMoney(totalExpense, currency)}`
                        : `+${formatMoney(totalIncome, currency)}`}
                    </Text>
                  </View>
                  <View style={modalStyles.summaryBannerBadge}>
                    <Text style={modalStyles.summaryBannerBadgeText}>
                      {categoryType === 'expense'
                        ? `${sortedExpenseCats.length} Categories`
                        : `${sortedIncomeCats.length} Sources`}
                    </Text>
                  </View>
                </View>

                {/* Categories List */}
                {categoryType === 'expense' ? (
                  sortedExpenseCats.length === 0 ? (
                    <View style={modalStyles.emptyBox}>
                      <Ionicons name="receipt-outline" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
                      <Text style={modalStyles.emptyTitle}>No Expenses Recorded</Text>
                      <Text style={modalStyles.emptyText}>Add expense transactions to see your spending breakdown by category.</Text>
                    </View>
                  ) : (
                    <View style={modalStyles.list}>
                      {sortedExpenseCats.map(([category, data]) => {
                        const percent = totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0;
                        const theme = getCategoryTheme(category, 'expense', customCategoryIcons);
                        const budget = budgets.find((b) => b.category === category);
                        const isOverBudget = Boolean(budget && budget.limit > 0 && data.amount > budget.limit);

                        return (
                          <View key={category} style={modalStyles.itemCard}>
                            <View style={modalStyles.itemMainRow}>
                              <View style={[modalStyles.iconBox, { backgroundColor: theme.bg }]}>
                                <Ionicons name={theme.icon} size={18} color={theme.color} />
                              </View>

                              <View style={modalStyles.itemCenterCol}>
                                <View style={modalStyles.itemTitleRow}>
                                  <Text style={modalStyles.categoryName} numberOfLines={1}>
                                    {category}
                                  </Text>
                                  {isOverBudget && (
                                    <View style={modalStyles.overBadge}>
                                      <Text style={modalStyles.overBadgeText}>Over Budget</Text>
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
                                <Text style={[modalStyles.amountText, { color: COLORS.danger }]} numberOfLines={1}>
                                  -{formatMoney(data.amount, currency)}
                                </Text>
                                <Text style={modalStyles.percentShareText}>{percent}% share</Text>
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
                ) : (
                  /* Income List */
                  sortedIncomeCats.length === 0 ? (
                    <View style={modalStyles.emptyBox}>
                      <Ionicons name="wallet-outline" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
                      <Text style={modalStyles.emptyTitle}>No Income Recorded</Text>
                      <Text style={modalStyles.emptyText}>Add income transactions to track which revenue streams contribute the most.</Text>
                    </View>
                  ) : (
                    <View style={modalStyles.list}>
                      {sortedIncomeCats.map(([category, data]) => {
                        const percent = totalIncome > 0 ? Math.round((data.amount / totalIncome) * 100) : 0;
                        const theme = getCategoryTheme(category, 'income', customCategoryIcons);

                        return (
                          <View key={category} style={modalStyles.itemCard}>
                            <View style={modalStyles.itemMainRow}>
                              <View style={[modalStyles.iconBox, { backgroundColor: theme.bg }]}>
                                <Ionicons name={theme.icon} size={18} color={theme.color} />
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
                                <Text style={[modalStyles.amountText, { color: COLORS.success }]} numberOfLines={1}>
                                  +{formatMoney(data.amount, currency)}
                                </Text>
                                <Text style={modalStyles.percentShareText}>{percent}% share</Text>
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
                )}
              </View>
            ) : (
              /* ==================== MONTHLY BUDGET TAB ==================== */
              <View>
                {budgetedCategories.length === 0 ? (
                  <View style={modalStyles.emptyBox}>
                    <Ionicons name="shield-outline" size={34} color={COLORS.finance} style={{ marginBottom: 8 }} />
                    <Text style={modalStyles.emptyTitle}>No Budgets Set This Month</Text>
                    <Text style={modalStyles.emptyText}>
                      Set monthly spending limits for categories like Food, Utilities, or Shopping to control your expenses.
                    </Text>
                    <TouchableOpacity
                      style={modalStyles.emptyCtaBtn}
                      onPress={() => {
                        onClose();
                        setTimeout(() => onOpenSetBudget(), 200);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={16} color="#08090C" style={{ marginRight: 4 }} />
                      <Text style={modalStyles.emptyCtaText}>Set Monthly Budget</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    {/* Overall Budget Hero Banner */}
                    <View style={modalStyles.budgetHeroBanner}>
                      <View style={modalStyles.budgetHeroTop}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={modalStyles.budgetHeroLabel}>TOTAL BUDGET HEALTH</Text>
                          <Text style={modalStyles.budgetHeroAmount} numberOfLines={1}>
                            {formatMoney(totalBudgetSpent, currency)}
                            <Text style={modalStyles.budgetHeroLimit}> / {formatMoney(totalBudgetLimit, currency)}</Text>
                          </Text>
                        </View>

                        <View
                          style={[
                            modalStyles.budgetStatusBadge,
                            {
                              backgroundColor: isOverallOver
                                ? COLORS.dangerLight
                                : overallBudgetPercent > 85
                                ? 'rgba(245, 158, 11, 0.16)'
                                : COLORS.successLight,
                              borderColor: isOverallOver
                                ? 'rgba(244, 63, 94, 0.3)'
                                : overallBudgetPercent > 85
                                ? 'rgba(245, 158, 11, 0.3)'
                                : 'rgba(16, 185, 129, 0.3)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              modalStyles.budgetStatusBadgeText,
                              {
                                color: isOverallOver
                                  ? COLORS.danger
                                  : overallBudgetPercent > 85
                                  ? '#F59E0B'
                                  : COLORS.success,
                              },
                            ]}
                          >
                            {isOverallOver ? 'EXCEEDED' : `${overallBudgetPercent}% USED`}
                          </Text>
                        </View>
                      </View>

                      {/* Overall Progress Bar */}
                      <View style={[modalStyles.barTrack, { marginTop: 12, height: 7 }]}>
                        <View
                          style={[
                            modalStyles.barFill,
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

                      <View style={modalStyles.budgetHeroBottom}>
                        <Text style={modalStyles.budgetHeroSubLeft}>
                          {remainingBudget >= 0
                            ? `${formatMoney(remainingBudget, currency)} remaining to spend`
                            : `Exceeded by ${formatMoney(Math.abs(remainingBudget), currency)}!`}
                        </Text>
                        <Text style={modalStyles.budgetHeroSubRight}>
                          {budgetedCategories.length} active limits
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
                        const theme = getCategoryTheme(b.category, 'expense', customCategoryIcons);

                        const barColor = isOver
                          ? COLORS.danger
                          : percent > 85
                          ? '#F59E0B'
                          : COLORS.success;

                        return (
                          <View key={b.category} style={modalStyles.itemCard}>
                            <View style={modalStyles.itemMainRow}>
                              <View style={[modalStyles.iconBox, { backgroundColor: theme.bg }]}>
                                <Ionicons name={theme.icon} size={18} color={theme.color} />
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
                                <Text
                                  style={[
                                    modalStyles.budgetPercentText,
                                    { color: isOver ? COLORS.danger : percent > 85 ? '#F59E0B' : COLORS.textPrimary },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {percent}%
                                </Text>
                                <Text
                                  style={[
                                    modalStyles.budgetDiffText,
                                    isOver ? { color: COLORS.danger, fontWeight: '700' } : { color: COLORS.success },
                                  ]}
                                  numberOfLines={1}
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
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    height: FIXED_MODAL_HEIGHT,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  setBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 38,
    gap: 6,
  },
  setBudgetBtnText: {
    color: COLORS.finance,
    fontSize: 12,
    fontWeight: '700',
  },

  // Main Tabs
  mainTabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: RADIUS.md,
  },
  mainTabBtnActive: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  mainTabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  mainTabTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },

  // Sub Tabs
  subTabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subTabBtnExpenseActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  subTabBtnIncomeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  subTabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },

  // Summary Banner
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryBannerAmount: {
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  summaryBannerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryBannerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  // List Items
  list: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  itemCenterCol: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  overBadge: {
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
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
  },
  itemRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: 80,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  percentShareText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  budgetPercentText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  budgetDiffText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 6,
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
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  budgetHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetHeroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  budgetHeroAmount: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  budgetHeroLimit: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  budgetStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    flexShrink: 0,
  },
  budgetStatusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  budgetHeroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  budgetHeroSubLeft: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  budgetHeroSubRight: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Empty State
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 18,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
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
    backgroundColor: COLORS.finance,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginTop: 16,
    minHeight: 44,
  },
  emptyCtaText: {
    color: '#08090C',
    fontSize: 13,
    fontWeight: '800',
  },
});
