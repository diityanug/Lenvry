import React from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Account, ACCOUNT_TYPES } from '../../types/finance';
import { financeStyles as styles } from '../../styles/financeStyles';

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
  visible, accFormType, newAccName, newAccType, newAccCurrency, parentAccId, accounts,
  onClose, onSave, setAccFormType, setNewAccName, setNewAccType, setNewAccCurrency, setParentAccId
}: AddAccountModalProps) => (
  <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlayCenter}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>
      <View style={styles.modalContentSmall}>
        <Text style={styles.modalTitleCenter}>Add New Account</Text>
        
        <View style={styles.typeRowSmall}>
          <TouchableOpacity 
            style={[styles.typeBtnSmall, accFormType === 'main' && styles.typeBtnSmallActive]} 
            onPress={() => setAccFormType('main')}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeBtnTextSmall, accFormType === 'main' && styles.typeBtnTextSmallActive]}>Main Account</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBtnSmall, accFormType === 'sub' && styles.typeBtnSmallActive]} 
            onPress={() => setAccFormType('sub')}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeBtnTextSmall, accFormType === 'sub' && styles.typeBtnTextSmallActive]}>Sub-Account</Text>
          </TouchableOpacity>
        </View>

        {accFormType === 'sub' && (
          <>
            <Text style={styles.inputLabel}>SELECT PARENT ACCOUNT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollSmall} contentContainerStyle={{ paddingRight: 24 }} keyboardShouldPersistTaps="handled">
              {accounts.map(acc => (
                <TouchableOpacity 
                  key={acc.id} 
                  style={[styles.chip, parentAccId === acc.id && styles.chipActive]} 
                  onPress={() => setParentAccId(acc.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, parentAccId === acc.id && styles.chipTextActive]}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {accFormType === 'main' && (
          <>
            <Text style={styles.inputLabel}>CURRENCY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollSmall} contentContainerStyle={{ paddingRight: 24 }} keyboardShouldPersistTaps="handled">
              {(['IDR', 'USD'] as const).map(c => (
                <TouchableOpacity 
                  key={c} 
                  style={[styles.chip, newAccCurrency === c && styles.chipActive]} 
                  onPress={() => setNewAccCurrency(c)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, newAccCurrency === c && styles.chipTextActive]}>{c} {c === 'IDR' ? '(Rupiah)' : '(Dollar)'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.inputLabel}>ACCOUNT TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollSmall} contentContainerStyle={{ paddingRight: 24 }} keyboardShouldPersistTaps="handled">
              {ACCOUNT_TYPES.map(t => (
                <TouchableOpacity 
                  key={t} 
                  style={[styles.chip, newAccType === t && styles.chipActive]} 
                  onPress={() => setNewAccType(t as any)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, newAccType === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <Text style={styles.inputLabel}>ACCOUNT NAME</Text>
        <TextInput 
          style={styles.dialogInputLeft} 
          placeholder="e.g. Bank Central, Wallet, Savings..." 
          placeholderTextColor="#52525B" 
          value={newAccName} 
          onChangeText={setNewAccName} 
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