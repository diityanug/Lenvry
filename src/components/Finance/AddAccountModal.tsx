import React from 'react';
import {
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Account, ACCOUNT_TYPES } from '../../types/finance';

interface AddAccountModalProps {
  visible: boolean;
  accFormType: 'main' | 'sub';
  newAccName: string;
  newAccType: Account['type'];
  newAccCurrency: 'IDR' | 'USD';
  parentAccId: string;
  accounts: Account[];
  onClose: () => void;
  onSave: () => void;
  setAccFormType: (type: 'main' | 'sub') => void;
  setNewAccName: (val: string) => void;
  setNewAccType: (t: Account['type']) => void;
  setNewAccCurrency: (c: 'IDR' | 'USD') => void;
  setParentAccId: (id: string) => void;
}

export const AddAccountModal = ({
  visible,
  accFormType,
  newAccName,
  newAccType,
  newAccCurrency,
  parentAccId,
  accounts,
  onClose,
  onSave,
  setAccFormType,
  setNewAccName,
  setNewAccType,
  setNewAccCurrency,
  setParentAccId,
}: AddAccountModalProps) => {
  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const isMain = accFormType === 'main';

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={modalStyles.overlay}
      >
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
              <Ionicons name="close-circle" size={26} color="#52525B" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
                  color={isMain ? '#09090B' : '#71717A'}
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
                  color={!isMain ? '#09090B' : '#71717A'}
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
                          color={isSelected ? '#09090B' : '#52525B'}
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
                placeholderTextColor="#52525B"
                value={newAccName}
                onChangeText={setNewAccName}
              />
            </View>

            {/* Actions */}
            <TouchableOpacity style={modalStyles.saveBtn} onPress={onSave} activeOpacity={0.85}>
              <Text style={modalStyles.saveBtnText}>
                {isMain ? 'CREATE MAIN ACCOUNT' : 'CREATE SUB-ACCOUNT'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#18181B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#3F3F46',
    borderRadius: 2,
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
    borderBottomColor: '#27272A',
  },
  headerTitle: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#09090B',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  typeTabActive: {
    backgroundColor: '#38BDF8',
  },
  typeTabText: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '700',
  },
  typeTabTextActive: {
    color: '#09090B',
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#09090B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  helperText: {
    color: '#52525B',
    fontSize: 11,
    marginBottom: 10,
  },
  parentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
  },
  parentChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  parentChipText: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '600',
  },
  parentChipTextActive: {
    color: '#09090B',
    fontWeight: '800',
  },
  parentChipCurrency: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717A',
    marginLeft: 6,
  },
  parentChipCurrencyActive: {
    color: '#09090B',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  currencyOptionActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '900',
    color: '#71717A',
    marginRight: 10,
  },
  currencySymbolActive: {
    color: '#38BDF8',
  },
  currencyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FAFAFA',
  },
  currencyTitleActive: {
    color: '#38BDF8',
  },
  currencySubtitle: {
    fontSize: 10,
    color: '#52525B',
  },
  categoryChip: {
    backgroundColor: '#18181B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  categoryChipText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#09090B',
    fontWeight: '800',
  },
  nameInput: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FAFAFA',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  saveBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  saveBtnText: {
    color: '#09090B',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});