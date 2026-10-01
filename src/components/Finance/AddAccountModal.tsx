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
import { Ionicons } from '@expo/vector-icons';
import { Account, ACCOUNT_TYPES } from '../../types/finance';
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
              <View>
                <Text style={modalStyles.headerTitle}>Add New Account</Text>
                <Text style={modalStyles.headerSubtitle}>
                  {isMain ? 'Create a master balance ledger' : 'Add a sub-pocket to an existing account'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Math.max(16, keyboardHeight + 16) }}
            >
            {/* Account Type Selector Tabs */}
            <View style={modalStyles.typeSwitcher}>
              <TouchableOpacity
                style={[modalStyles.typeTab, isMain && modalStyles.typeTabActive]}
                onPress={() => setAccFormType('main')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="wallet-outline"
                  size={16}
                  color={isMain ? '#08090C' : COLORS.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text style={[modalStyles.typeTabText, isMain && modalStyles.typeTabTextActive]}>
                  Main Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modalStyles.typeTab, !isMain && modalStyles.typeTabActive]}
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
                  color={!isMain ? '#08090C' : COLORS.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text style={[modalStyles.typeTabText, !isMain && modalStyles.typeTabTextActive]}>
                  Sub-Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sub Account Target Parent Selection */}
            {!isMain && (
              <View style={modalStyles.sectionCard}>
                <Text style={modalStyles.sectionLabel}>PARENT ACCOUNT</Text>
                <Text style={modalStyles.helperText}>Select which master account owns this pocket</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {accounts.map((acc) => {
                    const isSelected = parentAccId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[modalStyles.parentChip, isSelected && modalStyles.parentChipActive]}
                        onPress={() => setParentAccId(acc.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={15}
                          color={isSelected ? '#08090C' : COLORS.textMuted}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[modalStyles.parentChipText, isSelected && modalStyles.parentChipTextActive]}>
                          {acc.name}
                        </Text>
                        <Text style={[modalStyles.parentChipCurrency, isSelected && modalStyles.parentChipCurrencyActive]}>
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
                  <Text style={modalStyles.sectionLabel}>CURRENCY</Text>
                  <View style={modalStyles.currencyRow}>
                    <TouchableOpacity
                      style={[
                        modalStyles.currencyOption,
                        newAccCurrency === 'IDR' && modalStyles.currencyOptionActive,
                      ]}
                      onPress={() => setNewAccCurrency('IDR')}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          modalStyles.currencySymbol,
                          newAccCurrency === 'IDR' && modalStyles.currencySymbolActive,
                        ]}
                      >
                        Rp
                      </Text>
                      <View>
                        <Text
                          style={[
                            modalStyles.currencyTitle,
                            newAccCurrency === 'IDR' && modalStyles.currencyTitleActive,
                          ]}
                        >
                          IDR
                        </Text>
                        <Text style={modalStyles.currencySubtitle}>Indonesian Rupiah</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        modalStyles.currencyOption,
                        newAccCurrency === 'USD' && modalStyles.currencyOptionActive,
                      ]}
                      onPress={() => setNewAccCurrency('USD')}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          modalStyles.currencySymbol,
                          newAccCurrency === 'USD' && modalStyles.currencySymbolActive,
                        ]}
                      >
                        $
                      </Text>
                      <View>
                        <Text
                          style={[
                            modalStyles.currencyTitle,
                            newAccCurrency === 'USD' && modalStyles.currencyTitleActive,
                          ]}
                        >
                          USD
                        </Text>
                        <Text style={modalStyles.currencySubtitle}>US Dollar</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={modalStyles.sectionCard}>
                  <Text style={modalStyles.sectionLabel}>ACCOUNT CLASSIFICATION</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {ACCOUNT_TYPES.map((t) => {
                      const isSelected = newAccType === t;
                      return (
                        <TouchableOpacity
                          key={t}
                          style={[modalStyles.categoryChip, isSelected && modalStyles.categoryChipActive]}
                          onPress={() => setNewAccType(t as any)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              modalStyles.categoryChipText,
                              isSelected && modalStyles.categoryChipTextActive,
                            ]}
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
              <Text style={modalStyles.sectionLabel}>
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
                <View style={{ marginTop: 12 }}>
                  <Text style={modalStyles.sectionLabel}>ACCOUNT DESCRIPTION / NOTE (OPTIONAL)</Text>
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
            <TouchableOpacity style={modalStyles.saveBtn} onPress={onSave} activeOpacity={0.85}>
              <Text style={modalStyles.saveBtnText}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 28,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  typeTabActive: {
    backgroundColor: COLORS.finance,
  },
  typeTabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  typeTabTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 10,
  },
  parentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    marginRight: 8,
  },
  parentChipActive: {
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
  },
  parentChipText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  parentChipTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  parentChipCurrency: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginLeft: 6,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencyOptionActive: {
    borderColor: COLORS.finance,
    backgroundColor: COLORS.financeLight,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textMuted,
    marginRight: 10,
  },
  currencySymbolActive: {
    color: COLORS.finance,
  },
  currencyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  currencyTitleActive: {
    color: COLORS.finance,
  },
  currencySubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  categoryChip: {
    backgroundColor: COLORS.bgCard,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
  },
  categoryChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  nameInput: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: COLORS.finance,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  saveBtnText: {
    color: '#08090C',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});