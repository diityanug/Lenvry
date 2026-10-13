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
  CategoryCustomIcon,
  getCategoryTheme,
  hexToRgba,
} from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';
import { getCategoryIcon } from './CategoryBreakdownCard';

interface ManageCategoriesModalProps {
  visible: boolean;
  expenseCategories: string[];
  incomeCategories: string[];
  customCategoryIcons?: CategoryCustomIcon[];
  onClose: () => void;
  onOpenAddCategory: (type: 'expense' | 'income') => void;
  onDeleteCategory: (cat: string, type: 'expense' | 'income') => void;
}

export const ManageCategoriesModal = ({
  visible,
  expenseCategories,
  incomeCategories,
  customCategoryIcons,
  onClose,
  onOpenAddCategory,
  onDeleteCategory,
}: ManageCategoriesModalProps) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  const currentList = activeTab === 'expense' ? expenseCategories : incomeCategories;
  const isExpense = activeTab === 'expense';
  const themeColor = isExpense ? COLORS.danger : COLORS.success;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.dismissArea} />
        </TouchableWithoutFeedback>

        <View style={styles.content}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.headerIconWrap, { backgroundColor: hexToRgba(COLORS.finance, 0.12) }]}>
                <Ionicons name="grid-outline" size={19} color={COLORS.finance} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Manage Categories
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  Add, view or tap to remove categories
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tabs: Expense vs Income */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, isExpense && styles.tabBtnActiveExpense]}
              onPress={() => setActiveTab('expense')}
              activeOpacity={0.75}
            >
              <Ionicons
                name="arrow-up-circle-outline"
                size={16}
                color={isExpense ? COLORS.danger : COLORS.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, isExpense && { color: COLORS.danger, fontWeight: '800' }]}>
                Expense ({expenseCategories.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, !isExpense && styles.tabBtnActiveIncome]}
              onPress={() => setActiveTab('income')}
              activeOpacity={0.75}
            >
              <Ionicons
                name="arrow-down-circle-outline"
                size={16}
                color={!isExpense ? COLORS.success : COLORS.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, !isExpense && { color: COLORS.success, fontWeight: '800' }]}>
                Income ({incomeCategories.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Row: Add Category Button */}
          <View style={styles.actionHeaderRow}>
            <TouchableOpacity
              style={[styles.addBtn, { borderColor: hexToRgba(themeColor, 0.4), backgroundColor: hexToRgba(themeColor, 0.1) }]}
              onPress={() => onOpenAddCategory(activeTab)}
              activeOpacity={0.75}
            >
              <Ionicons name="add" size={15} color={themeColor} />
              <Text style={[styles.addBtnText, { color: themeColor }]}>Add {isExpense ? 'Expense' : 'Income'}</Text>
            </TouchableOpacity>
          </View>

          {/* Categories Grid List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollList}
          >
            <View style={styles.categoryGrid}>
              {currentList.map((cat) => {
                const isDefaultOthers = cat.toLowerCase() === 'others';
                const catTheme = getCategoryTheme(cat, customCategoryIcons);
                const catIcon = getCategoryIcon(cat, activeTab, customCategoryIcons);

                return (
                  <View key={cat} style={[styles.catCard, { borderColor: hexToRgba(catTheme.color, 0.28) }]}>
                    <View style={styles.catLeft}>
                      <View style={[styles.catIconBox, { backgroundColor: catTheme.bg, borderColor: catTheme.border }]}>
                        <Ionicons name={catIcon} size={16} color={catTheme.color} />
                      </View>
                      <View style={styles.catTextWrap}>
                        <Text style={styles.catName} numberOfLines={1}>
                          {cat}
                        </Text>
                        <Text style={styles.catTypeSub} numberOfLines={1}>
                          {isDefaultOthers ? 'Default Category' : 'Custom / Standard'}
                        </Text>
                      </View>
                    </View>

                    {!isDefaultOthers && (
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => onDeleteCategory(cat, activeTab)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 22,
    height: '85%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  handle: {
    width: 42,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginTop: 14,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  tabBtnActiveExpense: {
    backgroundColor: hexToRgba(COLORS.danger, 0.14),
    borderWidth: 1,
    borderColor: hexToRgba(COLORS.danger, 0.35),
  },
  tabBtnActiveIncome: {
    backgroundColor: hexToRgba(COLORS.success, 0.14),
    borderWidth: 1,
    borderColor: hexToRgba(COLORS.success, 0.35),
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  actionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  hintText: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    fontWeight: '500',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollList: {
    paddingBottom: 24,
  },
  categoryGrid: {
    gap: 10,
  },
  catCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  catTextWrap: {
    flex: 1,
  },
  catName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  catTypeSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
});
