import React from 'react';
import {
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Account, ACCOUNT_TYPES, ACCOUNT_TYPE_THEME } from '../../types/finance';
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
            <View>
              <Text style={styles.headerTitle}>New Account / Pocket</Text>
              <Text style={styles.headerSubtitle}>Create a master ledger or sub-pocket</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Account Form Type Switcher */}
            <View style={styles.typeSwitcher}>
              <TouchableOpacity
                style={[styles.typeOption, accFormType === 'main' && styles.typeOptionActive]}
                onPress={() => setAccFormType('main')}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeOptionText, accFormType === 'main' && styles.typeOptionTextActive]}>
                  Master Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeOption, accFormType === 'sub' && styles.typeOptionActive]}
                onPress={() => setAccFormType('sub')}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeOptionText, accFormType === 'sub' && styles.typeOptionTextActive]}>
                  Sub-Pocket
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Inputs */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>ACCOUNT NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. BCA Main, Emergency Fund..."
                placeholderTextColor={COLORS.textMuted}
                value={newAccName}
                onChangeText={setNewAccName}
              />
            </View>

            {accFormType === 'main' && (
              <>
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>ACCOUNT TYPE</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {ACCOUNT_TYPES.map((t) => {
                      const isSelected = newAccType === t;
                      const theme = ACCOUNT_TYPE_THEME[t];
                      return (
                        <TouchableOpacity
                          key={t}
                          style={[styles.chip, isSelected && { backgroundColor: theme.bg, borderColor: theme.color }]}
                          onPress={() => setNewAccType(t)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, isSelected && { color: theme.color, fontWeight: '700' }]}>
                            {t}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>CURRENCY</Text>
                  <View style={styles.currencyRow}>
                    {(['IDR', 'USD'] as const).map((curr) => (
                      <TouchableOpacity
                        key={curr}
                        style={[styles.currBtn, newAccCurrency === curr && styles.currBtnActive]}
                        onPress={() => setNewAccCurrency(curr)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.currBtnText, newAccCurrency === curr && styles.currBtnTextActive]}>
                          {curr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {accFormType === 'sub' && (
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>PARENT MASTER ACCOUNT</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {accounts.map((acc) => {
                    const isSelected = parentAccId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setParentAccId(acc.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {acc.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {setNewAccDesc && (
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>DESCRIPTION / NOTE (OPTIONAL)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Short description..."
                  placeholderTextColor={COLORS.textMuted}
                  value={newAccDesc}
                  onChangeText={setNewAccDesc}
                />
              </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={onSave} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#08090C" />
              <Text style={styles.saveBtnText}>CREATE ACCOUNT</Text>
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
    backgroundColor: 'rgba(5, 6, 9, 0.75)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderSubtle,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 4,
    gap: 4,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  typeOptionActive: {
    backgroundColor: COLORS.bgCardHover,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  typeOptionText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  typeOptionTextActive: {
    color: COLORS.finance,
    fontWeight: '700',
  },
  fieldWrap: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  chipRow: {
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  chipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: COLORS.finance,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.finance,
    fontWeight: '700',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  currBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCardSub,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  currBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: COLORS.finance,
  },
  currBtnText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  currBtnTextActive: {
    color: COLORS.finance,
    fontWeight: '800',
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.finance,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    marginTop: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#08090C',
  },
});
