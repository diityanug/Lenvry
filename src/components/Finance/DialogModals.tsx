import React, { useState } from 'react';
import {
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hexToRgba } from '../../types/finance';
import { CalculatorKeypad } from './CalculatorKeypad';
import {
  evaluateArithmeticStr,
  formatCalculatedDisplay,
  formatExpression,
  hasMathOperators,
} from '../../utils/math';
import { COLORS, RADIUS } from '../../constants/theme';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';

const SKY = '#38BDF8';
const VIOLET = '#818CF8';

// EDIT BALANCE MODAL
interface EditBalanceModalProps {
  visible: boolean;
  value: string;
  currency: 'IDR' | 'USD';
  onClose: () => void;
  onSave: () => void;
  onChangeValue: (val: string) => void;
}

export const EditBalanceModal = ({
  visible,
  value,
  currency,
  onClose,
  onSave,
  onChangeValue,
}: EditBalanceModalProps) => {
  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  React.useEffect(() => {
    if (visible && value && !hasMathOperators(value)) {
      const formatted = formatExpression(value, currency);
      if (formatted !== value) {
        onChangeValue(formatted);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, currency]);

  const evaluatedValStr = React.useMemo(() => evaluateArithmeticStr(value, currency), [value, currency]);
  const isMath = React.useMemo(() => hasMathOperators(value), [value]);
  const formattedVal = formatCalculatedDisplay(evaluatedValStr, currency);
  const currencySymbol = currency === 'USD' ? '$' : 'Rp';

  const handleApply = () => {
    if (isMath) {
      const res = evaluateArithmeticStr(value, currency);
      if (res && res !== '0') onChangeValue(formatCalculatedDisplay(res, currency));
    }
    onSave();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={dialogStyles.overlayBottom}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={dialogStyles.dismissArea} />
        </TouchableWithoutFeedback>

        <View style={dialogStyles.bottomSheetContent}>
          <View style={dialogStyles.sheetHandle} />

          {/* Header */}
          <View style={dialogStyles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={dialogStyles.sheetTitle} numberOfLines={1}>Adjust Pocket Balance</Text>
              <Text style={dialogStyles.sheetSubtitle} numberOfLines={1}>Set the corrected balance for this pocket</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={dialogStyles.sheetCloseBtn} activeOpacity={0.7} accessibilityRole="button">
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Target Balance Display Card */}
          <View style={dialogStyles.balanceDisplayCard}>
            <Text style={dialogStyles.balanceDisplayLabel} numberOfLines={1}>TARGET BALANCE ({currency})</Text>
            <View style={dialogStyles.balanceValueRow}>
              <Text style={dialogStyles.balanceCurrencySymbol}>{currencySymbol}</Text>
              <Text style={dialogStyles.balanceValueText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                {value || '0'}
              </Text>
            </View>
            <View style={dialogStyles.balancePreviewContainer}>
              {isMath ? (
                <Text style={dialogStyles.balancePreviewText} numberOfLines={1}>
                  = {currencySymbol} {formattedVal}
                </Text>
              ) : (
                <Text style={dialogStyles.balancePreviewTextMuted} numberOfLines={1}>
                  {currencySymbol} {formattedVal}
                </Text>
              )}
            </View>
          </View>

          {/* Embedded CalculatorKeypad */}
          <View style={dialogStyles.keypadContainer}>
            <CalculatorKeypad
              value={value}
              onChangeValue={onChangeValue}
              onDone={handleApply}
              currency={currency}
              accentColor={COLORS.finance}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// RENAME MODAL
interface RenameModalProps {
  visible: boolean;
  value: string;
  descValue?: string;
  targetType?: 'main' | 'sub';
  onClose: () => void;
  onSave: () => void;
  onChangeValue: (val: string) => void;
  onChangeDescValue?: (val: string) => void;
}

export const RenameModal = ({
  visible,
  value,
  descValue = '',
  targetType = 'main',
  onClose,
  onSave,
  onChangeValue,
  onChangeDescValue,
}: RenameModalProps) => {
  const keyboardHeight = useKeyboardHeight();

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const isMain = targetType === 'main';
  const pillColor = isMain ? SKY : VIOLET;

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            dialogStyles.scrollOverlayCenter,
            { paddingBottom: Math.max(20, keyboardHeight + 20) },
          ]}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={handleDismiss}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View style={dialogStyles.cardSmall}>
            <View
              style={[
                dialogStyles.typePill,
                {
                  backgroundColor: hexToRgba(pillColor, 0.14),
                  borderColor: hexToRgba(pillColor, 0.34),
                },
              ]}
            >
              <Text
                style={[dialogStyles.typePillText, { color: pillColor }]}
                numberOfLines={1}
              >
                {isMain ? 'MAIN ACCOUNT' : 'POCKET'}
              </Text>
            </View>

            <Text style={dialogStyles.titleCenter} numberOfLines={1} ellipsizeMode="tail">
              Edit {isMain ? 'Account' : 'Pocket'}
            </Text>

            <View style={dialogStyles.fieldBlock}>
              <Text style={dialogStyles.fieldLabel} numberOfLines={1}>ACCOUNT NAME</Text>
              <TextInput
                style={dialogStyles.inputField}
                placeholder={isMain ? 'Enter account title...' : 'Enter pocket title...'}
                placeholderTextColor={COLORS.textMuted}
                value={value}
                onChangeText={onChangeValue}
                autoFocus={true}
              />
            </View>

            {isMain && onChangeDescValue && (
              <View style={dialogStyles.fieldBlock}>
                <Text style={dialogStyles.fieldLabel} numberOfLines={1} ellipsizeMode="tail">
                  DESCRIPTION / NOTE
                </Text>
                <TextInput
                  style={dialogStyles.inputField}
                  placeholder="e.g. No. Rek: 1234567890 a.n. John Doe"
                  placeholderTextColor={COLORS.textMuted}
                  value={descValue}
                  onChangeText={onChangeDescValue}
                />
              </View>
            )}

            <View style={dialogStyles.actionRow}>
              <TouchableOpacity style={dialogStyles.btnCancel} onPress={onClose} activeOpacity={0.7}>
                <Text style={dialogStyles.btnCancelText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  CANCEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={dialogStyles.btnConfirm} onPress={onSave} activeOpacity={0.8}>
                <Text style={dialogStyles.btnConfirmText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  SAVE
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Available icons for custom categories
const AVAILABLE_CATEGORY_ICONS = [
  { icon: 'pricetag-outline', label: 'Tag', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' },
  { icon: 'cart-outline', label: 'Shopping', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.16)' },
  { icon: 'restaurant-outline', label: 'Food', color: '#F97316', bg: 'rgba(249, 115, 22, 0.16)' },
  { icon: 'cafe-outline', label: 'Coffee', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' },
  { icon: 'car-outline', label: 'Transport', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' },
  { icon: 'receipt-outline', label: 'Bills', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.16)' },
  { icon: 'game-controller-outline', label: 'Gaming', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.16)' },
  { icon: 'film-outline', label: 'Movie', color: '#E11D48', bg: 'rgba(225, 29, 72, 0.16)' },
  { icon: 'barbell-outline', label: 'Fitness', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' },
  { icon: 'medkit-outline', label: 'Health', color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.16)' },
  { icon: 'school-outline', label: 'Education', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.16)' },
  { icon: 'airplane-outline', label: 'Travel', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.16)' },
  { icon: 'home-outline', label: 'Home', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.16)' },
  { icon: 'gift-outline', label: 'Gift', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.16)' },
  { icon: 'cash-outline', label: 'Salary', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' },
  { icon: 'wallet-outline', label: 'Wallet', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.16)' },
  { icon: 'trending-up-outline', label: 'Invest', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.16)' },
  { icon: 'business-outline', label: 'Business', color: '#64748B', bg: 'rgba(100, 116, 139, 0.16)' },
  { icon: 'laptop-outline', label: 'Tech', color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.16)' },
  { icon: 'shirt-outline', label: 'Fashion', color: '#D946EF', bg: 'rgba(217, 70, 239, 0.16)' },
  { icon: 'paw-outline', label: 'Pets', color: '#F97316', bg: 'rgba(249, 115, 22, 0.16)' },
  { icon: 'musical-notes-outline', label: 'Music', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.16)' },
  { icon: 'book-outline', label: 'Books', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' },
  { icon: 'sparkles-outline', label: 'Special', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.16)' },
];

// ADD CATEGORY MODAL
interface AddCategoryModalProps {
  visible: boolean;
  value: string;
  selectedIcon?: string;
  onClose: () => void;
  onSave: (name: string, iconConfig: { icon: string; color: string; bg: string }) => void;
  onChangeValue: (val: string) => void;
  onChangeIcon?: (icon: string) => void;
}

export const AddCategoryModal = ({
  visible,
  value,
  selectedIcon,
  onClose,
  onSave,
  onChangeValue,
  onChangeIcon,
}: AddCategoryModalProps) => {
  const keyboardHeight = useKeyboardHeight();
  const [activeIconItem, setActiveIconItem] = useState(
    AVAILABLE_CATEGORY_ICONS.find((i) => i.icon === selectedIcon) || AVAILABLE_CATEGORY_ICONS[0]
  );

  const handleSelectIcon = (item: (typeof AVAILABLE_CATEGORY_ICONS)[0]) => {
    setActiveIconItem(item);
    if (onChangeIcon) onChangeIcon(item.icon);
  };

  const handleConfirmSave = () => {
    onSave(value, activeIconItem);
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            dialogStyles.scrollOverlayCenter,
            { paddingBottom: Math.max(20, keyboardHeight + 20) },
          ]}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={handleDismiss}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View style={dialogStyles.cardSmall}>
            {/* Header Icon Preview */}
            <View style={dialogStyles.previewBlock}>
              <View
                style={[
                  dialogStyles.iconPreviewBox,
                  {
                    backgroundColor: activeIconItem.bg,
                    borderColor: hexToRgba(activeIconItem.color, 0.45),
                  },
                ]}
              >
                <Ionicons name={activeIconItem.icon as any} size={30} color={activeIconItem.color} />
              </View>
              <Text style={dialogStyles.titleCenter} numberOfLines={1}>New Category</Text>
            </View>

            {/* Name Input */}
            <View style={dialogStyles.fieldBlock}>
              <Text style={dialogStyles.fieldLabel} numberOfLines={1}>CATEGORY NAME</Text>
              <TextInput
                style={dialogStyles.inputField}
                placeholder="e.g. Subscriptions, etc..."
                placeholderTextColor={COLORS.textMuted}
                value={value}
                onChangeText={onChangeValue}
                autoFocus={true}
              />
            </View>

            {/* Icon Grid Picker */}
            <View style={dialogStyles.fieldBlock}>
              <View style={dialogStyles.iconLabelRow}>
                <Text style={dialogStyles.fieldLabelInline} numberOfLines={1}>CHOOSE ICON</Text>
              </View>
              <ScrollView
                nestedScrollEnabled={true}
                style={dialogStyles.iconScrollArea}
                contentContainerStyle={dialogStyles.iconGrid}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {AVAILABLE_CATEGORY_ICONS.map((item) => {
                  const isSelected = activeIconItem.icon === item.icon;
                  return (
                    <TouchableOpacity
                      key={item.icon}
                      style={[
                        dialogStyles.iconPickBtn,
                        {
                          backgroundColor: isSelected ? item.color : hexToRgba(item.color, 0.12),
                          borderColor: isSelected ? item.color : hexToRgba(item.color, 0.34),
                        },
                      ]}
                      onPress={() => handleSelectIcon(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={isSelected ? '#08090C' : item.color}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Actions */}
            <View style={[dialogStyles.actionRow, dialogStyles.actionRowSpaced]}>
              <TouchableOpacity style={dialogStyles.btnCancel} onPress={onClose} activeOpacity={0.7}>
                <Text style={dialogStyles.btnCancelText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                  CANCEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={dialogStyles.btnConfirm} onPress={handleConfirmSave} activeOpacity={0.8}>
                <Text style={dialogStyles.btnConfirmText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  SAVE CATEGORY
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const dialogStyles = StyleSheet.create({
  overlayCenter: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollOverlayCenter: {
    flexGrow: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardSmall: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xxl,
    padding: 20,
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  headerBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: hexToRgba(SKY, 0.12),
    borderWidth: 1,
    borderColor: hexToRgba(SKY, 0.34),
    paddingHorizontal: 12,
    minHeight: 34,
    borderRadius: RADIUS.full,
    marginBottom: 14,
    maxWidth: '100%',
  },
  headerBadgeIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    color: SKY,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    flexShrink: 1,
  },
  titleCenter: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitleCenter: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  typePill: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginBottom: 14,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  amountHeroBox: {
    backgroundColor: hexToRgba(SKY, 0.08),
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: hexToRgba(SKY, 0.34),
    marginBottom: 20,
  },
  amountHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  amountHeroLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  calcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: hexToRgba(SKY, 0.14),
    paddingHorizontal: 10,
    minHeight: 26,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: hexToRgba(SKY, 0.34),
    flexShrink: 0,
  },
  calcBadgeIcon: {
    marginRight: 5,
  },
  calcBadgeText: {
    color: SKY,
    fontSize: 10.5,
    fontWeight: '800',
  },
  amountHeroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  currencySymbolLarge: {
    color: SKY,
    fontSize: 22,
    fontWeight: '900',
    flexShrink: 0,
  },
  amountNumberLarge: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
    minWidth: 0,
  },
  fieldBlock: {
    gap: 8,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  fieldLabelInline: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    flexShrink: 1,
    minWidth: 0,
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconChipPreview: {
    paddingHorizontal: 12,
    minHeight: 26,
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    flexShrink: 0,
    maxWidth: 140,
  },
  iconChipPreviewText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  inputField: {
    backgroundColor: COLORS.bgCardSub,
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
    borderRadius: RADIUS.md,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionRowSpaced: {
    marginTop: 12,
  },
  btnCancel: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.bgCardSub,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  btnCancelText: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnConfirm: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.finance,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  btnConfirmText: {
    color: '#08090C',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  previewBlock: {
    alignItems: 'center',
    marginBottom: 4,
  },
  iconPreviewBox: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
  },
  iconScrollArea: {
    maxHeight: 220,
    minHeight: 130,
    flexShrink: 1,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
    paddingBottom: 24,
  },
  iconPickBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 9, 0.75)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  bottomSheetContent: {
    backgroundColor: COLORS.bgCardSub,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderSubtle,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceDisplayCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  balanceDisplayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceCurrencySymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.finance,
  },
  balanceValueText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.finance,
    flex: 1,
  },
  balancePreviewContainer: {
    height: 18,
    justifyContent: 'center',
    marginTop: 2,
  },
  balancePreviewText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.finance,
  },
  balancePreviewTextMuted: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  keypadContainer: {
    backgroundColor: COLORS.bgCardSub,
  },
});
