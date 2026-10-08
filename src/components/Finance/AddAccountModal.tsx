import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Account, ACCOUNT_TYPES, ACCOUNT_TYPE_THEME, getAccountIcon, hexToRgba } from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';

interface AddAccountModalProps {
  visible: boolean;
  accFormType: 'main' | 'sub';
  newAccName: string;
  newAccDesc?: string;
  newAccType: Account['type'];
  newAccCurrency: 'IDR' | 'USD';
  parentAccId: string;
  accounts: Account[];
  onClose: () => void;
  onSave: () => void;
  setAccFormType: (type: 'main' | 'sub') => void;
  setNewAccName: (val: string) => void;
  setNewAccDesc?: (val: string) => void;
  setNewAccType: (t: Account['type']) => void;
  setNewAccCurrency: (c: 'IDR' | 'USD') => void;
  setParentAccId: (id: string) => void;
}

// Colour per form kind (sky = master ledger, violet = pocket)
const FORM_THEME = {
  main: { color: '#38BDF8', bg: hexToRgba('#38BDF8', 0.14), border: hexToRgba('#38BDF8', 0.34) },
  sub: { color: '#818CF8', bg: hexToRgba('#818CF8', 0.14), border: hexToRgba('#818CF8', 0.34) },
};

// Colour per currency (sky = IDR, emerald = USD)
const CURRENCY_THEME = {
  IDR: { color: '#38BDF8', bg: hexToRgba('#38BDF8', 0.14), border: hexToRgba('#38BDF8', 0.5) },
  USD: { color: '#10B981', bg: hexToRgba('#10B981', 0.14), border: hexToRgba('#10B981', 0.5) },
};

export const AddAccountModal = ({
  visible,
  accFormType,
  newAccName,
  newAccDesc = '',
  newAccType,
  newAccCurrency,
  parentAccId,
  accounts,
  onClose,
  onSave,
  setAccFormType,
  setNewAccName,
  setNewAccDesc,
  setNewAccType,
  setNewAccCurrency,
  setParentAccId,
}: AddAccountModalProps) => {
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

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const isMain = accFormType === 'main';
  const formTheme = isMain ? FORM_THEME.main : FORM_THEME.sub;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={modalStyles.dismissArea} />
        </TouchableWithoutFeedback>

        <View style={modalStyles.content}>
          <View style={modalStyles.handle} />

            {/* Header */}
            <View style={modalStyles.headerRow}>
              <View style={modalStyles.headerTextWrap}>
                <View style={modalStyles.headerTitleRow}>
                  <View style={[modalStyles.headerIconBadge, { backgroundColor: formTheme.bg, borderColor: formTheme.border }]}>
                    <Ionicons
                      name={isMain ? 'wallet-outline' : 'layers-outline'}
                      size={16}
                      color={formTheme.color}
                    />
                  </View>
                  <Text style={modalStyles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                    Add New Account
                  </Text>
                </View>
                <Text
                  style={modalStyles.headerSubtitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {isMain ? 'Create a master balance ledger' : 'Add a sub-pocket to an existing account'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={modalStyles.closeBtn}
                accessibilityRole="button"
              >
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                modalStyles.scrollContent,
                { paddingBottom: Math.max(28, keyboardHeight + 28) },
              ]}
            >
            {/* Account Type Selector Tabs */}
            <View style={modalStyles.typeSwitcher}>
              <TouchableOpacity
                style={[
                  modalStyles.typeTab,
                  isMain && {
                    backgroundColor: FORM_THEME.main.bg,
                    borderColor: FORM_THEME.main.border,
                  },
                ]}
                onPress={() => setAccFormType('main')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="wallet-outline"
                  size={16}
                  color={isMain ? FORM_THEME.main.color : COLORS.textMuted}
                  style={modalStyles.tabIcon}
                />
                <Text
                  style={[modalStyles.typeTabText, isMain && { color: FORM_THEME.main.color, fontWeight: '900' }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  Main Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  modalStyles.typeTab,
                  !isMain && {
                    backgroundColor: FORM_THEME.sub.bg,
                    borderColor: FORM_THEME.sub.border,
                  },
                ]}
                onPress={() => {
                  setAccFormType('sub');
                  if (!parentAccId && accounts.length > 0) {
                    setParentAccId(accounts[0].id);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="layers-outline"
                  size={16}
                  color={!isMain ? FORM_THEME.sub.color : COLORS.textMuted}
                  style={modalStyles.tabIcon}
                />
                <Text
                  style={[modalStyles.typeTabText, !isMain && { color: FORM_THEME.sub.color, fontWeight: '900' }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  Sub-Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sub Account Target Parent Selection */}
            {!isMain && (
              <View style={modalStyles.sectionCard}>
                <Text style={modalStyles.sectionLabel} numberOfLines={1}>PARENT ACCOUNT</Text>
                <Text
                  style={modalStyles.helperText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Select which master account owns this pocket
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={modalStyles.hScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {accounts.map((acc) => {
                    const isSelected = parentAccId === acc.id;
                    const accTheme = ACCOUNT_TYPE_THEME[acc.type];
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[
                          modalStyles.parentChip,
                          { backgroundColor: accTheme.bg, borderColor: accTheme.border },
                          isSelected && { backgroundColor: accTheme.color, borderColor: accTheme.color },
                        ]}
                        onPress={() => setParentAccId(acc.id)}
                        activeOpacity={0.7}
                      >
                        {isSelected ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={15}
                            color="#08090C"
                            style={modalStyles.chipIcon}
                          />
                        ) : (
                          <FontAwesome5
                            name={getAccountIcon(acc.type)}
                            size={13}
                            color={accTheme.color}
                            style={modalStyles.chipIcon}
                          />
                        )}
                        <Text
                          style={[modalStyles.parentChipText, isSelected && modalStyles.parentChipTextActive]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {acc.name}
                        </Text>
                        <Text
                          style={[modalStyles.parentChipCurrency, isSelected && modalStyles.parentChipCurrencyActive]}
                          numberOfLines={1}
                        >
                          {acc.currency}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Main Account Settings: Currency & Category */}
            {isMain && (
              <>
                <View style={modalStyles.sectionCard}>
                  <Text style={modalStyles.sectionLabel} numberOfLines={1}>CURRENCY</Text>
                  <View style={modalStyles.currencyRow}>
                    <TouchableOpacity
                      style={[
                        modalStyles.currencyOption,
                        newAccCurrency === 'IDR'
                          ? {
                              borderColor: CURRENCY_THEME.IDR.border,
                              backgroundColor: CURRENCY_THEME.IDR.bg,
                            }
                          : { borderColor: COLORS.border },
                      ]}
                      onPress={() => setNewAccCurrency('IDR')}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          modalStyles.currencySymbolCircle,
                          newAccCurrency === 'IDR'
                            ? {
                                backgroundColor: hexToRgba('#38BDF8', 0.28),
                                borderColor: CURRENCY_THEME.IDR.border,
                              }
                            : { borderColor: COLORS.border },
                        ]}
                      >
                        <Text
                          style={[modalStyles.currencySymbol, newAccCurrency === 'IDR' && { color: CURRENCY_THEME.IDR.color }]}
                          numberOfLines={1}
                        >
                          Rp
                        </Text>
                      </View>
                      <View style={modalStyles.currencyTextWrap}>
                        <Text
                          style={[modalStyles.currencyTitle, newAccCurrency === 'IDR' && { color: CURRENCY_THEME.IDR.color }]}
                          numberOfLines={1}
                        >
                          IDR
                        </Text>
                        <Text
                          style={modalStyles.currencySubtitle}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          Indonesian Rupiah
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        modalStyles.currencyOption,
                        newAccCurrency === 'USD'
                          ? {
                              borderColor: CURRENCY_THEME.USD.border,
                              backgroundColor: CURRENCY_THEME.USD.bg,
                            }
                          : { borderColor: COLORS.border },
                      ]}
                      onPress={() => setNewAccCurrency('USD')}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          modalStyles.currencySymbolCircle,
                          newAccCurrency === 'USD'
                            ? {
                                backgroundColor: hexToRgba('#10B981', 0.28),
                                borderColor: CURRENCY_THEME.USD.border,
                              }
                            : { borderColor: COLORS.border },
                        ]}
                      >
                        <Text
                          style={[modalStyles.currencySymbol, newAccCurrency === 'USD' && { color: CURRENCY_THEME.USD.color }]}
                          numberOfLines={1}
                        >
                          $
                        </Text>
                      </View>
                      <View style={modalStyles.currencyTextWrap}>
                        <Text
                          style={[modalStyles.currencyTitle, newAccCurrency === 'USD' && { color: CURRENCY_THEME.USD.color }]}
                          numberOfLines={1}
                        >
                          USD
                        </Text>
                        <Text
                          style={modalStyles.currencySubtitle}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          US Dollar
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={modalStyles.sectionCard}>
                  <Text style={modalStyles.sectionLabel} numberOfLines={1}>ACCOUNT CLASSIFICATION</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={modalStyles.hScrollContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    {ACCOUNT_TYPES.map((t) => {
                      const isSelected = newAccType === t;
                      const accTheme = ACCOUNT_TYPE_THEME[t];
                      return (
                        <TouchableOpacity
                          key={t}
                          style={[
                            modalStyles.categoryChip,
                            { backgroundColor: accTheme.bg, borderColor: accTheme.border },
                            isSelected && { backgroundColor: accTheme.color, borderColor: accTheme.color },
                          ]}
                          onPress={() => setNewAccType(t as any)}
                          activeOpacity={0.7}
                        >
                          <FontAwesome5
                            name={getAccountIcon(t)}
                            size={14}
                            color={isSelected ? '#08090C' : accTheme.color}
                            style={modalStyles.chipIcon}
                          />
                          <Text
                            style={[modalStyles.categoryChipText, isSelected && modalStyles.categoryChipTextActive]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </>
            )}

            {/* Account Title Input */}
            <View style={modalStyles.sectionCard}>
              <Text style={modalStyles.sectionLabel} numberOfLines={1} ellipsizeMode="tail">
                {isMain ? 'MAIN ACCOUNT NAME' : 'SUB-ACCOUNT NAME'}
              </Text>
              <TextInput
                style={modalStyles.nameInput}
                placeholder={isMain ? 'e.g. Bank BCA, Main Wallet, Investment' : 'e.g. Daily Needs, Emergency Fund'}
                placeholderTextColor={COLORS.textMuted}
                value={newAccName}
                onChangeText={setNewAccName}
              />

              {isMain && setNewAccDesc && (
                <View style={modalStyles.descBlock}>
                  <Text style={modalStyles.sectionLabel} numberOfLines={1} ellipsizeMode="tail">
                    ACCOUNT DESCRIPTION / NOTE (OPTIONAL)
                  </Text>
                  <TextInput
                    style={modalStyles.nameInput}
                    placeholder="e.g. No. Rek: 1234567890 a.n. John Doe"
                    placeholderTextColor={COLORS.textMuted}
                    value={newAccDesc}
                    onChangeText={setNewAccDesc}
                  />
                </View>
              )}
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={[modalStyles.saveBtn, { backgroundColor: formTheme.color }]}
              onPress={onSave}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isMain ? 'add-circle-outline' : 'layers-outline'}
                size={17}
                color="#08090C"
                style={modalStyles.chipIcon}
              />
              <Text style={modalStyles.saveBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                {isMain ? 'CREATE MAIN ACCOUNT' : 'CREATE SUB-ACCOUNT'}
              </Text>
            </TouchableOpacity>
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
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 26,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  handle: {
    width: 44,
    height: 4,
    backgroundColor: COLORS.borderHighlight,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBadge: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
    flexShrink: 1,
    minWidth: 0,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    marginLeft: 38,
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
  scrollContent: {
    gap: 14,
  },  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeTab: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeTabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  tabIcon: {
    marginRight: 6,
  },
  sectionCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    fontWeight: '600',
  },
  hScrollContent: {
    gap: 8,
    paddingRight: 4,
    paddingVertical: 1,
  },
  chipIcon: {
    marginRight: 6,
  },
  parentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    maxWidth: 240,
  },
  parentChipText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  parentChipTextActive: {
    color: '#08090C',
    fontWeight: '900',
  },
  parentChipCurrency: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginLeft: 8,
    flexShrink: 0,
  },
  parentChipCurrencyActive: {
    color: '#08090C',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyOption: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 66,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  currencySymbolCircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    flexShrink: 0,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textMuted,
  },
  currencyTextWrap: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  currencyTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  currencySubtitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 220,
  },
  categoryChipText: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  categoryChipTextActive: {
    color: '#08090C',
    fontWeight: '900',
  },
  nameInput: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
    color: COLORS.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '600',
  },
  descBlock: {
    marginTop: 2,
    gap: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.finance,
    borderRadius: RADIUS.md,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 2,
    marginBottom: 4,
  },
  saveBtnText: {
    color: '#08090C',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
