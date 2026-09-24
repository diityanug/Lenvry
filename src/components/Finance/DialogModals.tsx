import React from 'react';
import { Text, View, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { financeStyles as styles } from '../../styles/financeStyles';

// --- EDIT BALANCE MODAL ---
interface EditBalanceModalProps {
  visible: boolean;
  value: string;
  currency: 'IDR' | 'USD';
  onClose: () => void;
  onSave: () => void;
  onChangeValue: (val: string) => void;
}
export const EditBalanceModal = ({ visible, value, currency, onClose, onSave, onChangeValue }: EditBalanceModalProps) => (
  <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlayCenter}>
      <View style={styles.modalContentSmall}>
        <Text style={styles.modalTitleCenter}>Adjust Balance</Text>
        <View style={styles.amountContainer}>
          <Text style={[styles.currencySymbol, { fontSize: 22 }]}>{currency === 'USD' ? '$' : 'Rp'}</Text>
          <TextInput 
            style={[styles.inputAmountLarge, { fontSize: 32 }]} 
            placeholder="0" 
            placeholderTextColor="#3F3F46" 
            keyboardType="decimal-pad" 
            value={value} 
            onChangeText={onChangeValue} 
            maxLength={12} 
            autoFocus={true} 
          />
        </View>
        <View style={styles.dialogActionRow}>
          <TouchableOpacity style={styles.dialogBtnCancel} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.dialogBtnCancelText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dialogBtnConfirm} onPress={onSave} activeOpacity={0.8}>
            <Text style={styles.dialogBtnConfirmText}>SAVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

// --- RENAME MODAL ---
interface RenameModalProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSave: () => void;
  onChangeValue: (val: string) => void;
}
export const RenameModal = ({ visible, value, onClose, onSave, onChangeValue }: RenameModalProps) => (
  <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlayCenter}>
      <View style={styles.modalContentSmall}>
        <Text style={styles.modalTitleCenter}>Rename Account</Text>
        <TextInput 
          style={[styles.dialogInputLeft, { marginTop: 12 }]} 
          placeholder="Enter new account title..." 
          placeholderTextColor="#52525B" 
          value={value} 
          onChangeText={onChangeValue} 
          autoFocus={true} 
        />
        <View style={styles.dialogActionRow}>
          <TouchableOpacity style={styles.dialogBtnCancel} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.dialogBtnCancelText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dialogBtnConfirm} onPress={onSave} activeOpacity={0.8}>
            <Text style={styles.dialogBtnConfirmText}>SAVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

// --- ADD CATEGORY MODAL ---
interface AddCategoryModalProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSave: () => void;
  onChangeValue: (val: string) => void;
}
export const AddCategoryModal = ({ visible, value, onClose, onSave, onChangeValue }: AddCategoryModalProps) => (
  <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlayCenter}>
      <View style={styles.modalContentSmall}>
        <Text style={styles.modalTitleCenter}>New Category</Text>
        <TextInput 
          style={styles.dialogInput} 
          placeholder="e.g. Subscriptions, Gadgets..." 
          placeholderTextColor="#52525B" 
          value={value} 
          onChangeText={onChangeValue} 
          autoFocus={true} 
        />
        <View style={styles.dialogActionRow}>
          <TouchableOpacity style={styles.dialogBtnCancel} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.dialogBtnCancelText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dialogBtnConfirm} onPress={onSave} activeOpacity={0.8}>
            <Text style={styles.dialogBtnConfirmText}>SAVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);