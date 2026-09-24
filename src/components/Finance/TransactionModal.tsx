import React from 'react';
import { Text, View, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Account } from '../../types/finance';
import { financeStyles as styles } from '../../styles/financeStyles';

interface TransactionModalProps {
  visible: boolean;
  type: 'income' | 'expense';
  amount: string;
  description: string;
  txDate: Date;
  selectedCategory: string;
  selectedAccId: string;
  selectedSubAccId: string;
  accounts: Account[];
  expenseCategories: string[];
  incomeCategories: string[];
  onClose: () => void;
  onSave: () => void;
  setType: (t: 'income' | 'expense') => void;
  setAmount: (val: string) => void;
  setDescription: (val: string) => void;
  setSelectedCategory: (cat: string) => void;
  setSelectedAccId: (id: string) => void;
  setSelectedSubAccId: (id: string) => void;
  onOpenDatePicker: () => void;
  onOpenAddCategory: () => void;
}

export const TransactionModal = ({
  visible, type, amount, description, txDate, selectedCategory,
  selectedAccId, selectedSubAccId, accounts, expenseCategories, incomeCategories,
  onClose, onSave, setType, setAmount, setDescription, setSelectedCategory,
  setSelectedAccId, setSelectedSubAccId, onOpenDatePicker, onOpenAddCategory
}: TransactionModalProps) => (
  <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlayDismissArea} />
      </TouchableWithoutFeedback>
      <View style={styles.modalContent}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Log Transaction</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={26} color="#52525B" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.typeRow}>
          <TouchableOpacity 
            style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]} 
            onPress={() => { setType('expense'); setSelectedCategory(expenseCategories[0]); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Expenses</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]} 
            onPress={() => { setType('income'); setSelectedCategory(incomeCategories[0]); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Income</Text>
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>
              {accounts.find(a => a.id === selectedAccId)?.currency === 'USD' ? '$' : 'Rp'}
            </Text>
            <TextInput 
              style={styles.inputAmountLarge} 
              placeholder="0" 
              placeholderTextColor="#3F3F46" 
              keyboardType="decimal-pad" 
              value={amount} 
              onChangeText={setAmount} 
              maxLength={12} 
            />
          </View>

          <View style={styles.datePickerContainer}>
            <Text style={styles.inputLabel}>TRANSACTION DATE</Text>
            <TouchableOpacity style={styles.datePickerBtn} onPress={onOpenDatePicker} activeOpacity={0.7}>
              <Ionicons name="calendar-outline" size={16} color="#38BDF8" style={{ marginRight: 8 }} />
              <Text style={styles.datePickerText}>
                {txDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TextInput 
            style={styles.input} 
            placeholder="Description (e.g. Groceries, Stock dividend...)" 
            placeholderTextColor="#52525B" 
            value={description} 
            onChangeText={setDescription} 
          />

          <Text style={styles.inputLabel}>ACCOUNT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingRight: 48 }} keyboardShouldPersistTaps="handled">
            {accounts.map(acc => (
              <TouchableOpacity 
                key={acc.id} 
                style={[styles.chip, selectedAccId === acc.id && styles.chipActive]} 
                onPress={() => { setSelectedAccId(acc.id); setSelectedSubAccId(''); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedAccId === acc.id && styles.chipTextActive]}>{acc.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedAccId !== '' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipScroll, { marginTop: -8 }]} contentContainerStyle={{ paddingRight: 48 }} keyboardShouldPersistTaps="handled">
              {accounts.find(a => a.id === selectedAccId)?.subAccounts.map(sub => (
                <TouchableOpacity 
                  key={sub.id} 
                  style={[styles.chipSub, selectedSubAccId === sub.id && styles.chipSubActive]} 
                  onPress={() => setSelectedSubAccId(sub.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipSubText, selectedSubAccId === sub.id && styles.chipSubTextActive]}>└ {sub.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={styles.inputLabel}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingRight: 48 }} keyboardShouldPersistTaps="handled">
            {(type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.chip, selectedCategory === cat && styles.chipActive]} 
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.chipAdd} onPress={onOpenAddCategory} activeOpacity={0.7}>
              <Text style={styles.chipAddText}>+ New</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={onSave} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>SAVE TRANSACTION</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);