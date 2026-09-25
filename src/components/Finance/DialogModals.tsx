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
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney } from '../../types/finance';
import { CalculatorModal } from './CalculatorModal';

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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
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
                      <Ionicons name="calculator-outline" size={12} color="#38BDF8" style={{ marginRight: 4 }} />
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
  targetType?: 'main' | 'sub';
  onClose: () => void;
  onSave: () => void;
  onChangeValue: (val: string) => void;
}

export const RenameModal = ({
  visible,
  value,
  targetType = 'main',
  onClose,
  onSave,
  onChangeValue,
}: RenameModalProps) => {
  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const isMain = targetType === 'main';

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={dialogStyles.overlayCenter}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={dialogStyles.cardSmall}>
                <View
                  style={[
                    dialogStyles.typePill,
                    {
                      backgroundColor: isMain ? 'rgba(56, 189, 248, 0.15)' : 'rgba(142, 151, 253, 0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      dialogStyles.typePillText,
                      { color: isMain ? '#38BDF8' : '#8E97FD' },
                    ]}
                  >
                    {isMain ? 'MAIN ACCOUNT' : 'SUB-ACCOUNT'}
                  </Text>
                </View>

                <Text style={dialogStyles.titleCenter}>
                  Rename {isMain ? 'Account' : 'Sub-Account'}
                </Text>

                <TextInput
                  style={dialogStyles.inputField}
                  placeholder={isMain ? 'Enter new account title...' : 'Enter new sub-account title...'}
                  placeholderTextColor="#52525B"
                  value={value}
                  onChangeText={onChangeValue}
                  autoFocus={true}
                />

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

// --- ADD CATEGORY MODAL ---
interface AddCategoryModalProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSave: () => void;
  onChangeValue: (val: string) => void;
}

export const AddCategoryModal = ({
  visible,
  value,
  onClose,
  onSave,
  onChangeValue,
}: AddCategoryModalProps) => {
  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={dialogStyles.overlayCenter}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={dialogStyles.cardSmall}>
                <Text style={dialogStyles.titleCenter}>New Category</Text>
                <Text style={dialogStyles.subtitleCenter}>
                  Enter a label for your custom spending or income category.
                </Text>

                <TextInput
                  style={dialogStyles.inputField}
                  placeholder="e.g. Subscriptions, Freelance, Tech..."
                  placeholderTextColor="#52525B"
                  value={value}
                  onChangeText={onChangeValue}
                  autoFocus={true}
                />

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

const dialogStyles = StyleSheet.create({
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardSmall: {
    backgroundColor: '#18181B',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  titleCenter: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FAFAFA',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleCenter: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  typePill: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  amountHeroBox: {
    backgroundColor: '#09090B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#27272A',
    marginBottom: 18,
  },
  amountHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  amountHeroLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  calcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  calcBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  amountHeroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbolLarge: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '900',
    marginRight: 6,
  },
  amountNumberLarge: {
    color: '#FAFAFA',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  inputField: {
    backgroundColor: '#09090B',
    color: '#FAFAFA',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 18,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#27272A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#FAFAFA',
    fontSize: 12,
    fontWeight: '700',
  },
  btnConfirm: {
    flex: 1,
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnConfirmText: {
    color: '#09090B',
    fontSize: 12,
    fontWeight: '800',
  },
});