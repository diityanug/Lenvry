import React from 'react';
import { Text, View, Modal, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Account } from '../../types/finance';
import { TransactionCard } from './FinanceCards';
import { financeStyles as styles } from '../../styles/financeStyles';

interface HistoryModalProps {
  visible: boolean;
  historyTransactions: Transaction[];
  accounts: Account[];
  historyTypeFilter: 'all' | 'income' | 'expense';
  historyCatFilter: string;
  historyAvailableCategories: string[];
  onClose: () => void;
  setTypeFilter: (filter: 'all' | 'income' | 'expense') => void;
  setCatFilter: (cat: string) => void;
  onClone: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const HistoryModal = ({
  visible, historyTransactions, accounts, historyTypeFilter, historyCatFilter,
  historyAvailableCategories, onClose, setTypeFilter, setCatFilter, onClone, onDelete
}: HistoryModalProps) => (
  <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { height: '95%' }]}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>All Transactions</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={26} color="#52525B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>TRANSACTION TYPE</Text>
        <View style={styles.typeRowSmall}>
          {(['all', 'expense', 'income'] as const).map(flt => (
            <TouchableOpacity 
              key={flt} 
              style={[styles.typeBtnSmall, historyTypeFilter === flt && styles.typeBtnSmallActive]} 
              onPress={() => { setTypeFilter(flt); setCatFilter('all'); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.typeBtnTextSmall, historyTypeFilter === flt && styles.typeBtnTextSmallActive]}>
                {flt === 'all' ? 'All' : flt === 'expense' ? 'Expenses' : 'Income'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>CATEGORIES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollSmall} contentContainerStyle={{ paddingRight: 24 }}>
          <TouchableOpacity 
            style={[styles.chip, historyCatFilter === 'all' && styles.chipActive]} 
            onPress={() => setCatFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, historyCatFilter === 'all' && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {historyAvailableCategories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.chip, historyCatFilter === cat && styles.chipActive]} 
              onPress={() => setCatFilter(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, historyCatFilter === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={historyTransactions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={44} color="#27272A" />
              <Text style={styles.emptyText}>No transactions found.</Text>
            </View>
          }
          renderItem={({ item }) => <TransactionCard item={item} accounts={accounts} onClone={onClone} onDelete={onDelete} />}
        />
      </View>
    </View>
  </Modal>
);