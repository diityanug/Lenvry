import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.dismissArea} />
        </TouchableWithoutFeedback>

        <View style={styles.content}>
          <View style={styles.handle} />

            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.headerTitleGroup}>
                <View style={[styles.headerIconWrap, { backgroundColor: theme.bg }]}>
                  <Ionicons name={theme.icon} size={20} color={theme.color} />
                </View>
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">Set Category Budget</Text>
                  <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">Monthly spending target & guardrail</Text>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close-circle" size={26} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              automaticallyAdjustKeyboardInsets={true}
              contentContainerStyle={{ paddingBottom: Math.max(20, keyboardHeight + 20) }}
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
                          size={16}
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
                    <Ionicons name="information-circle-outline" size={16} color={COLORS.finance} />
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
      </View>
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
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    maxHeight: '88%',
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
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44,
  },
  chipBtnActive: {
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
    fontSize: 12,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 4,
    marginBottom: 12,
    minHeight: 54,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.finance,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    paddingVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  currentLimitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  currentLimitText: {
    fontSize: 12,
    color: COLORS.finance,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: COLORS.finance,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#08090C',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
