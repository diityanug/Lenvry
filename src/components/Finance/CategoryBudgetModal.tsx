import React, { useState } from 'react';
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
  BackHandler,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import {
  CategoryBudget,
  CategoryCustomIcon,
  formatMoney,
  getCategoryTheme,
  hexToRgba,
} from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';
import { getCategoryIcon } from './CategoryBreakdownCard';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { CalculatorKeypad } from './CalculatorKeypad';
import {
  evaluateArithmetic,
  evaluateArithmeticStr,
  formatCalculatedDisplay,
  formatExpression,
  hasMathOperators,
  MAX_NOMINAL_VALUE,
} from '../../utils/math';
import { hapticLight } from '../../utils/haptics';

interface CategoryBudgetModalProps {
  visible: boolean;
  categories: string[];
  budgets: CategoryBudget[];
  currency: 'IDR' | 'USD';
  customCategoryIcons?: CategoryCustomIcon[];
  onClose: () => void;
  onSaveBudget: (category: string, limit: number) => void;
  onOpenAddCategory?: () => void;
  onDeleteCategory?: (category: string) => void;
}

export const CategoryBudgetModal = ({
  visible,
  categories,
  budgets,
  currency,
  customCategoryIcons,
  onClose,
  onSaveBudget,
  onOpenAddCategory,
  onDeleteCategory,
}: CategoryBudgetModalProps) => {
  const keyboardHeight = useKeyboardHeight();
  const [selectedCat, setSelectedCat] = useState(categories[0] || 'Food & Beverages');
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const currentCurrencyBudgets = budgets.filter((b) => (b.currency || 'IDR') === currency);
  const [limitText, setLimitText] = useState(() => {
    const existing = currentCurrencyBudgets.find((b) => b.category === (categories[0] || 'Food & Beverages'));
    return existing && existing.limit > 0 ? formatExpression(existing.limit.toString(), currency) : '';
  });

  const [prevVisible, setPrevVisible] = useState(visible);
  const [prevCat, setPrevCat] = useState(selectedCat);
  const [prevCurrency, setPrevCurrency] = useState(currency);

  if (visible !== prevVisible || selectedCat !== prevCat || currency !== prevCurrency) {
    setPrevVisible(visible);
    setPrevCat(selectedCat);
    setPrevCurrency(currency);
    if (visible) {
      const existing = currentCurrencyBudgets.find((b) => b.category === selectedCat);
      setLimitText(existing && existing.limit > 0 ? formatExpression(existing.limit.toString(), currency) : '');
      setIsKeypadOpen(false);
    }
  }

  const currentBudget = currentCurrencyBudgets.find((b) => b.category === selectedCat);
  const theme = getCategoryTheme(selectedCat, customCategoryIcons);
  const selectedIcon = getCategoryIcon(selectedCat, 'expense', customCategoryIcons);

  const evaluatedValStr = React.useMemo(() => evaluateArithmeticStr(limitText, currency), [limitText, currency]);
  const isMath = React.useMemo(() => hasMathOperators(limitText), [limitText]);
  const formattedVal = formatCalculatedDisplay(evaluatedValStr, currency);
  const currencySymbol = currency === 'USD' ? '$' : 'Rp';

  const openKeypad = () => {
    Keyboard.dismiss();
    setIsKeypadOpen(true);
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCat(cat);
    const existing = currentCurrencyBudgets.find((b) => b.category === cat);
    setLimitText(existing && existing.limit > 0 ? formatExpression(existing.limit.toString(), currency) : '');
  };

  const handleQuickPreset = (amount: number) => {
    setLimitText(formatExpression(amount.toString(), currency));
  };

  const handleClearBudget = () => {
    onSaveBudget(selectedCat, 0);
    setLimitText('');
  };

  const handleSave = () => {
    setIsKeypadOpen(false);
    const evaluated = evaluateArithmetic(limitText, currency);
    const clamped = Math.min(MAX_NOMINAL_VALUE, Math.max(0, evaluated));
    onSaveBudget(selectedCat, clamped);
    Keyboard.dismiss();
    onClose();
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    if (isKeypadOpen) {
      setIsKeypadOpen(false);
      return;
    }
    onClose();
  };

  const handleRequestClose = () => {
    Keyboard.dismiss();
    if (isKeypadOpen) {
      setIsKeypadOpen(false);
      return;
    }
    onClose();
  };

  // Intercept smartphone back button or edge back swipe gesture:
  // Dismiss calculator keypad first before closing the modal
  React.useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      if (isKeypadOpen) {
        setIsKeypadOpen(false);
        return true; // Event consumed, prevents closing the modal
      }
      return false; // Allow standard modal close
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [visible, isKeypadOpen]);

  // Swipe-down gesture detector on keypad area to smoothly dismiss it
  const keypadPanResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy > 15 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 30 || gestureState.vy > 0.4) {
            setIsKeypadOpen(false);
          }
        },
      }),
    []
  );

  const presets = currency === 'USD' ? [100, 250, 500, 1000] : [500000, 1000000, 2000000, 5000000];

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={handleRequestClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={styles.dismissArea} />
        </TouchableWithoutFeedback>

        <View style={styles.content}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.headerIconWrap, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Ionicons name={selectedIcon} size={22} color={theme.color} />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                  Set Category Budget
                </Text>
                <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                  Monthly spending target &amp; guardrail
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleDismiss}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={true}
            contentContainerStyle={{ paddingBottom: Math.max(28, keyboardHeight + 28) }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sectionCard}>
              <Text style={styles.label} numberOfLines={1}>
                SELECT CATEGORY
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRowContent}
                keyboardShouldPersistTaps="handled"
              >
                {categories.map((cat) => {
                  const isSelected = selectedCat === cat;
                  const catTheme = getCategoryTheme(cat, customCategoryIcons);
                  const catIcon = getCategoryIcon(cat, 'expense', customCategoryIcons);
                  const hasBudget = currentCurrencyBudgets.some((b) => b.category === cat && b.limit > 0);

                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.chipBtn,
                        {
                          backgroundColor: isSelected ? catTheme.color : hexToRgba(catTheme.color, 0.1),
                          borderColor: isSelected ? catTheme.color : catTheme.border,
                        },
                      ]}
                      onPress={() => handleSelectCategory(cat)}
                      onLongPress={() => onDeleteCategory?.(cat)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={catIcon}
                        size={16}
                        color={isSelected ? '#08090C' : catTheme.color}
                      />
                      <Text
                        style={[styles.chipText, isSelected && styles.chipTextActive]}
                        numberOfLines={1}
                      >
                        {cat}
                      </Text>
                      {hasBudget && !isSelected && (
                        <View style={[styles.chipDot, { backgroundColor: catTheme.color }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {onOpenAddCategory && (
                  <TouchableOpacity
                    style={[styles.chipBtn, { borderColor: hexToRgba(COLORS.finance, 0.4), backgroundColor: hexToRgba(COLORS.finance, 0.08) }]}
                    onPress={onOpenAddCategory}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="add" size={16} color={COLORS.finance} />
                    <Text style={[styles.chipText, { color: COLORS.finance }]}>Add Category</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

            {/* Limit Input Section */}
            <View style={styles.sectionCard}>
              <View style={styles.inputHeaderRow}>
                <Text style={[styles.label, styles.inputHeaderLabel]} numberOfLines={1}>
                  MONTHLY SPENDING LIMIT ({currency})
                </Text>
                {currentBudget && currentBudget.limit > 0 && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={handleClearBudget}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.clearBtnText} numberOfLines={1}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  { borderColor: hexToRgba(theme.color, 0.35) },
                  isKeypadOpen && { borderColor: theme.color, backgroundColor: hexToRgba(theme.color, 0.08) },
                ]}
                onPress={openKeypad}
                activeOpacity={0.85}
              >
                <View style={styles.inputInnerRow}>
                  <Text style={[styles.currencyPrefix, { color: theme.color }]}>
                    {currencySymbol}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { fontSize: limitText.length > 20 ? 17 : limitText.length > 14 ? 20 : 24 },
                    ]}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    showSoftInputOnFocus={false}
                    value={limitText}
                    onFocus={openKeypad}
                    onPressIn={openKeypad}
                    editable={true}
                  />
                  {limitText !== '' && (
                    <TouchableOpacity
                      style={styles.clearInputBtn}
                      onPress={() => {
                        hapticLight();
                        setLimitText('');
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Sub-amount / Math Calculation Line */}
                <View style={styles.amountPreviewContainer}>
                  {isMath ? (
                    <Text style={[styles.amountPreviewText, { color: theme.color }]} numberOfLines={1}>
                      = {currencySymbol} {formattedVal}
                    </Text>
                  ) : limitText ? (
                    <Text style={styles.amountPreviewTextMuted} numberOfLines={1}>
                      {currencySymbol} {formattedVal}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>

              {/* Quick Presets */}
              <View style={styles.presetsRow}>
                {presets.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: hexToRgba(theme.color, 0.1),
                        borderColor: hexToRgba(theme.color, 0.26),
                      },
                    ]}
                    onPress={() => handleQuickPreset(p)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetChipText, { color: theme.color }]} numberOfLines={1}>
                      {formatMoney(p, currency)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {currentBudget && currentBudget.limit > 0 ? (
                <View
                  style={[
                    styles.currentLimitBox,
                    {
                      backgroundColor: hexToRgba(theme.color, 0.1),
                      borderColor: hexToRgba(theme.color, 0.24),
                    },
                  ]}
                >
                  <Ionicons name="information-circle-outline" size={16} color={theme.color} />
                  <Text style={[styles.currentLimitText, { color: theme.color }]} numberOfLines={1}>
                    Active limit: {formatMoney(currentBudget.limit, currency)} / month
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Action Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.color }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={18} color="#08090C" />
              <Text style={styles.saveBtnText} numberOfLines={1}>
                APPLY BUDGET
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Custom In-App Calculator Keypad (Docked at Bottom) */}
          {isKeypadOpen && (
            <Animated.View
              entering={SlideInDown.duration(220)}
              exiting={SlideOutDown.duration(180)}
              style={styles.keypadWrapper}
              {...keypadPanResponder.panHandlers}
            >
              <CalculatorKeypad
                value={limitText}
                onChangeValue={setLimitText}
                onDone={() => setIsKeypadOpen(false)}
                accentColor={theme.color}
                currency={currency}
              />
            </Animated.View>
          )}
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
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    height: '85%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  headerIconWrap: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
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
  sectionCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  chipRowContent: {
    gap: 10,
    paddingRight: 12,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 44,
    flexShrink: 0,
  },
  chipText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    marginLeft: 6,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  inputHeaderLabel: {
    flexShrink: 1,
    minWidth: 0,
    marginBottom: 14,
  },
  clearBtn: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: RADIUS.full,
    backgroundColor: hexToRgba(COLORS.danger, 0.12),
    borderWidth: 1,
    borderColor: hexToRgba(COLORS.danger, 0.28),
    marginBottom: 14,
    flexShrink: 0,
  },
  clearBtnText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  inputContainer: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    minHeight: 74,
    justifyContent: 'center',
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '800',
    marginRight: 10,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    paddingVertical: 4,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  clearInputBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  amountPreviewContainer: {
    minHeight: 18,
    justifyContent: 'center',
    marginTop: 4,
  },
  amountPreviewText: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountPreviewTextMuted: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  presetChip: {
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  currentLimitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  currentLimitText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.lg,
    minHeight: 54,
    marginTop: 4,
    marginBottom: 24,
  },
  saveBtnText: {
    color: '#08090C',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  keypadWrapper: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgCardSub,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});
