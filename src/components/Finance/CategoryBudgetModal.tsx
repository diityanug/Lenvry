import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBudget, CategoryCustomIcon, formatMoney } from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';
import { getCategoryTheme } from './CategoryBreakdownCard';

interface CategoryBudgetModalProps {
  visible: boolean;
  categories: string[];
  budgets: CategoryBudget[];
  currency: 'IDR' | 'USD';
  customCategoryIcons?: CategoryCustomIcon[];
  onClose: () => void;
  onSaveBudget: (category: string, limit: number) => void;
}

export const CategoryBudgetModal = ({
  visible,
  categories,
  budgets,
  currency,
  customCategoryIcons,
  onClose,
  onSaveBudget,
}: CategoryBudgetModalProps) => {
  const [selectedCat, setSelectedCat] = useState(categories[0] || 'Food & Beverages');
  const [limitText, setLimitText] = useState(() => {
    const existing = budgets.find((b) => b.category === (categories[0] || 'Food & Beverages'));
    return existing && existing.limit > 0 ? existing.limit.toString() : '';
  });

  const currentBudget = budgets.find((b) => b.category === selectedCat);
  const theme = getCategoryTheme(selectedCat, 'expense', customCategoryIcons);

  const handleSelectCategory = (cat: string) => {
    setSelectedCat(cat);
    const existing = budgets.find((b) => b.category === cat);
    setLimitText(existing && existing.limit > 0 ? existing.limit.toString() : '');
  };

  const handleQuickPreset = (amount: number) => {
    setLimitText(amount.toString());
  };

  const handleClearBudget = () => {
    onSaveBudget(selectedCat, 0);
    setLimitText('');
  };

  const handleSave = () => {
    const val = parseFloat(limitText.replace(/[^0-9.]/g, '')) || 0;
    onSaveBudget(selectedCat, val);
    Keyboard.dismiss();
    onClose();
  };

  const presets = currency === 'USD' ? [100, 250, 500, 1000] : [500000, 1000000, 2000000, 5000000];

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.dismissArea} />
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.headerTitleGroup}>
                <View style={[styles.headerIconWrap, { backgroundColor: theme.bg }]}>
                  <Ionicons name={theme.icon} size={18} color={theme.color} />
                </View>
                <View>
                  <Text style={styles.title}>Set Category Budget</Text>
                  <Text style={styles.subtitle}>Monthly spending target & guardrail</Text>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Category Horizontal Chips */}
              <View style={styles.sectionCard}>
                <Text style={styles.label}>SELECT CATEGORY</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingRight: 10 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {categories.map((cat) => {
                    const isSelected = selectedCat === cat;
                    const catTheme = getCategoryTheme(cat, 'expense', customCategoryIcons);
                    const hasBudget = budgets.some((b) => b.category === cat && b.limit > 0);

                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                        onPress={() => handleSelectCategory(cat)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={catTheme.icon}
                          size={14}
                          color={isSelected ? '#08090C' : catTheme.color}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {cat}
                        </Text>
                        {hasBudget && !isSelected && (
                          <View style={styles.chipDot} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Limit Input Section */}
              <View style={styles.sectionCard}>
                <View style={styles.inputHeaderRow}>
                  <Text style={styles.label}>MONTHLY SPENDING LIMIT ({currency})</Text>
                  {currentBudget && currentBudget.limit > 0 && (
                    <TouchableOpacity onPress={handleClearBudget} activeOpacity={0.7}>
                      <Text style={styles.clearBtnText}>Remove Limit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.currencyPrefix}>{currency === 'USD' ? '$' : 'Rp'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={limitText}
                    onChangeText={setLimitText}
                  />
                </View>

                {/* Quick Presets */}
                <View style={styles.presetsRow}>
                  {presets.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={styles.presetChip}
                      onPress={() => handleQuickPreset(p)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetChipText}>{formatMoney(p, currency)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {currentBudget && currentBudget.limit > 0 ? (
                  <View style={styles.currentLimitBox}>
                    <Ionicons name="information-circle-outline" size={14} color={COLORS.finance} />
                    <Text style={styles.currentLimitText}>
                      Active limit: {formatMoney(currentBudget.limit, currency)} / month
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Action Save Button */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>APPLY BUDGET</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    paddingTop: 12,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 38,
  },
  chipBtnActive: {
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.finance,
    marginLeft: 6,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtnText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 2,
    marginBottom: 10,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.finance,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    paddingVertical: 8,
    fontVariant: ['tabular-nums'],
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  presetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  currentLimitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  currentLimitText: {
    fontSize: 11,
    color: COLORS.finance,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: COLORS.finance,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  saveBtnText: {
    color: '#08090C',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
