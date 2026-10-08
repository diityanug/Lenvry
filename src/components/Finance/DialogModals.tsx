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
import { formatMoney } from '../../types/finance';
import { CalculatorModal } from './CalculatorModal';
import { COLORS, RADIUS } from '../../constants/theme';

// --- EDIT BALANCE MODAL ---
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 20 : 0}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={dialogStyles.overlayCenter}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={dialogStyles.cardSmall}>
                <Text style={dialogStyles.titleCenter}>Adjust Balance</Text>
                <Text style={dialogStyles.subtitleCenter}>
                  Set the corrected total balance for this sub-account.
                </Text>

                {/* Amount Box (Tap to open Calculator Keypad) */}
                <TouchableOpacity
                  style={dialogStyles.amountHeroBox}
                  onPress={() => setCalcVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={dialogStyles.amountHeroTop}>
                    <Text style={dialogStyles.amountHeroLabel}>TARGET BALANCE</Text>
                    <View style={dialogStyles.calcBadge}>
                      <Ionicons name="calculator-outline" size={12} color={COLORS.finance} style={{ marginRight: 4 }} />
                      <Text style={dialogStyles.calcBadgeText}>Keypad</Text>
                    </View>
                  </View>
                  <View style={dialogStyles.amountHeroValueRow}>
                    <Text style={dialogStyles.currencySymbolLarge}>{currencySymbol}</Text>
                    <Text style={dialogStyles.amountNumberLarge} numberOfLines={1}>
                      {formattedVal || '0'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={dialogStyles.actionRow}>
                  <TouchableOpacity style={dialogStyles.btnCancel} onPress={onClose} activeOpacity={0.7}>
                    <Text style={dialogStyles.btnCancelText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={dialogStyles.btnConfirm} onPress={onSave} activeOpacity={0.8}>
                    <Text style={dialogStyles.btnConfirmText}>APPLY</Text>
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

// --- RENAME MODAL ---
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

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 20 : 0}
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
                      backgroundColor: isMain ? COLORS.financeLight : COLORS.accentLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      dialogStyles.typePillText,
                      { color: isMain ? COLORS.finance : COLORS.accent },
                    ]}
                  >
                    {isMain ? 'MAIN ACCOUNT' : 'SUB-ACCOUNT'}
                  </Text>
                </View>

                <Text style={dialogStyles.titleCenter}>
                  Edit {isMain ? 'Account' : 'Sub-Account'}
                </Text>

                <Text style={[dialogStyles.subtitleCenter, { alignSelf: 'flex-start', marginBottom: 4 }]}>ACCOUNT NAME</Text>
                <TextInput
                  style={dialogStyles.inputField}
                  placeholder={isMain ? 'Enter account title...' : 'Enter sub-account title...'}
                  placeholderTextColor={COLORS.textMuted}
                  value={value}
                  onChangeText={onChangeValue}
                  autoFocus={true}
                />

                {isMain && onChangeDescValue && (
                  <>
                    <Text style={[dialogStyles.subtitleCenter, { alignSelf: 'flex-start', marginTop: 10, marginBottom: 4 }]}>
                      DESCRIPTION / NOTE (OPTIONAL)
                    </Text>
                    <TextInput
                      style={dialogStyles.inputField}
                      placeholder="e.g. No. Rek: 1234567890 a.n. John Doe"
                      placeholderTextColor={COLORS.textMuted}
                      value={descValue}
                      onChangeText={onChangeDescValue}
                    />
                  </>
                )}

                <View style={dialogStyles.actionRow}>
                  <TouchableOpacity style={dialogStyles.btnCancel} onPress={onClose} activeOpacity={0.7}>
                    <Text style={dialogStyles.btnCancelText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={dialogStyles.btnConfirm} onPress={onSave} activeOpacity={0.8}>
                    <Text style={dialogStyles.btnConfirmText}>SAVE</Text>
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

// --- ADD CATEGORY MODAL ---
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 20 : 0}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={dialogStyles.overlayCenter}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[dialogStyles.cardSmall, { maxHeight: '90%' }]}>
                {/* Header Icon Preview */}
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <View style={[dialogStyles.iconPreviewBox, { backgroundColor: activeIconItem.bg }]}>
                    <Ionicons name={activeIconItem.icon as any} size={28} color={activeIconItem.color} />
                  </View>
                  <Text style={dialogStyles.titleCenter}>New Category</Text>
                  <Text style={dialogStyles.subtitleCenter}>
                    Name your category and pick an icon for instant recognition.
                  </Text>
                </View>

                {/* Name Input */}
                <Text style={dialogStyles.inputLabel}>CATEGORY NAME</Text>
                <TextInput
                  style={[dialogStyles.inputField, { marginBottom: 14 }]}
                  placeholder="e.g. Subscriptions, Freelance, Tech..."
                  placeholderTextColor={COLORS.textMuted}
                  value={value}
                  onChangeText={onChangeValue}
                  autoFocus={true}
                />

                {/* Icon Grid Picker */}
                <Text style={dialogStyles.inputLabel}>CHOOSE ICON</Text>
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
                          isSelected && dialogStyles.iconPickBtnActive,
                        ]}
                        onPress={() => handleSelectIcon(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={isSelected ? '#08090C' : item.color}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Actions */}
                <View style={[dialogStyles.actionRow, { marginTop: 16 }]}>
                  <TouchableOpacity style={dialogStyles.btnCancel} onPress={onClose} activeOpacity={0.7}>
                    <Text style={dialogStyles.btnCancelText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={dialogStyles.btnConfirm} onPress={handleConfirmSave} activeOpacity={0.8}>
                    <Text style={dialogStyles.btnConfirmText}>SAVE CATEGORY</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardSmall: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleCenter: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitleCenter: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  typePill: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: 8,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  amountHeroBox: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  amountHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  amountHeroLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  calcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.financeLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  calcBadgeText: {
    color: COLORS.finance,
    fontSize: 10,
    fontWeight: '800',
  },
  amountHeroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbolLarge: {
    color: COLORS.finance,
    fontSize: 22,
    fontWeight: '900',
    marginRight: 6,
  },
  amountNumberLarge: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  inputField: {
    backgroundColor: COLORS.bgCardSub,
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: COLORS.bgCardSub,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  btnCancelText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  btnConfirm: {
    flex: 1,
    backgroundColor: COLORS.finance,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  btnConfirmText: {
    color: '#08090C',
    fontSize: 12,
    fontWeight: '800',
  },
  iconPreviewBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  iconScrollArea: {
    height: 220,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  iconPickBtn: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPickBtnActive: {
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
    transform: [{ scale: 1.05 }],
  },
});