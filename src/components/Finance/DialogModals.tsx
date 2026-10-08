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
import { formatMoney, hexToRgba } from '../../types/finance';
import { CalculatorModal } from './CalculatorModal';
import { COLORS, RADIUS } from '../../constants/theme';

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
  const [calcVisible, setCalcVisible] = useState(false);

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const currencySymbol = currency === 'USD' ? '$' : 'Rp';
  const numericVal = parseFloat(value) || 0;
  const formattedVal = formatMoney(numericVal, currency).replace(/[^0-9.,]/g, '').trim();

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={dialogStyles.overlayCenter}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={dialogStyles.cardSmall}>
                <View style={dialogStyles.headerBadge}>
                  <View style={dialogStyles.headerBadgeIcon}>
                    <Ionicons name="calculator-outline" size={18} color={SKY} />
                  </View>
                  <Text style={dialogStyles.headerBadgeText} numberOfLines={1}>BALANCE CORRECTION</Text>
                </View>

                <Text style={dialogStyles.titleCenter} numberOfLines={1} ellipsizeMode="tail">
                  Adjust Balance
                </Text>
                <Text style={dialogStyles.subtitleCenter} numberOfLines={2}>
                  Set the corrected total balance for this sub-account.
                </Text>

                {/* Amount Box */}
                <TouchableOpacity
                  style={dialogStyles.amountHeroBox}
                  onPress={() => setCalcVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={dialogStyles.amountHeroTop}>
                    <Text style={dialogStyles.amountHeroLabel} numberOfLines={1}>TARGET BALANCE</Text>
                    <View style={dialogStyles.calcBadge}>
                      <Ionicons name="calculator-outline" size={12} color={SKY} style={dialogStyles.calcBadgeIcon} />
                      <Text style={dialogStyles.calcBadgeText} numberOfLines={1}>Keypad</Text>
                    </View>
                  </View>
                  <View style={dialogStyles.amountHeroValueRow}>
                    <Text style={dialogStyles.currencySymbolLarge} numberOfLines={1}>{currencySymbol}</Text>
                    <Text
                      style={dialogStyles.amountNumberLarge}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {formattedVal || '0'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={dialogStyles.actionRow}>
                  <TouchableOpacity style={dialogStyles.btnCancel} onPress={onClose} activeOpacity={0.7}>
                    <Text style={dialogStyles.btnCancelText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      CANCEL
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={dialogStyles.btnConfirm} onPress={onSave} activeOpacity={0.8}>
                    <Text style={dialogStyles.btnConfirmText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      APPLY
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <CalculatorModal
        visible={calcVisible}
        initialValue={value}
        currency={currency}
        title="Adjust Sub-Account Balance"
        onClose={() => setCalcVisible(false)}
        onConfirm={(val) => onChangeValue(val)}
      />
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
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={dialogStyles.overlayCenter}>
            <TouchableWithoutFeedback onPress={() => {}}>
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
                    {isMain ? 'MAIN ACCOUNT' : 'SUB-ACCOUNT'}
                  </Text>
                </View>

                <Text style={dialogStyles.titleCenter} numberOfLines={1} ellipsizeMode="tail">
                  Edit {isMain ? 'Account' : 'Sub-Account'}
                </Text>

                <View style={dialogStyles.fieldBlock}>
                  <Text style={dialogStyles.fieldLabel} numberOfLines={1}>ACCOUNT NAME</Text>
                  <TextInput
                    style={dialogStyles.inputField}
                    placeholder={isMain ? 'Enter account title...' : 'Enter sub-account title...'}
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={dialogStyles.overlayCenter}>
            <TouchableWithoutFeedback onPress={() => {}}>
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
                  <Text style={dialogStyles.subtitleCenter} numberOfLines={2}>
                    Name your category and pick an icon for instant recognition.
                  </Text>
                </View>

                {/* Name Input */}
                <View style={dialogStyles.fieldBlock}>
                  <Text style={dialogStyles.fieldLabel} numberOfLines={1}>CATEGORY NAME</Text>
                  <TextInput
                    style={dialogStyles.inputField}
                    placeholder="e.g. Subscriptions, Freelance, Tech..."
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
                    <View
                      style={[
                        dialogStyles.iconChipPreview,
                        { backgroundColor: hexToRgba(activeIconItem.color, 0.14), borderColor: hexToRgba(activeIconItem.color, 0.34) },
                      ]}
                    >
                      <Text
                        style={[dialogStyles.iconChipPreviewText, { color: activeIconItem.color }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {activeIconItem.label}
                      </Text>
                    </View>
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
});
