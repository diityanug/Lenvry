import React, { useState, useMemo } from 'react';
import {
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Account, MONTHS } from '../../types/finance';
import { TransactionCard } from './FinanceCards';
import { COLORS, RADIUS } from '../../constants/theme';

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
  onEdit?: (tx: Transaction) => void;
}

export const HistoryModal = ({
  visible,
  historyTransactions,
  accounts,
  historyTypeFilter,
  historyCatFilter,
  historyAvailableCategories,
  onClose,
  setTypeFilter,
  setCatFilter,
  onClone,
  onDelete,
  onEdit,
}: HistoryModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredList = useMemo(() => {
    let result = historyTransactions;

    if (searchQuery.trim()) {
      const tokens = searchQuery.toLowerCase().trim().split(/\s+/);

      result = result.filter((tx) => {
        const d = new Date(tx.date);
        const yearStr = d.getFullYear().toString();
        const monthNum = (d.getMonth() + 1).toString();
        const monthNumPadded = (d.getMonth() + 1).toString().padStart(2, '0');
        const dayNum = d.getDate().toString();
        const dayNumPadded = d.getDate().toString().padStart(2, '0');
        const monthNameEn = MONTHS[d.getMonth()]?.toLowerCase() || '';
        const monthShortEn = monthNameEn.slice(0, 3);

        const acc = accounts.find((a) => a.id === tx.accountId);
        const accName = acc?.name?.toLowerCase() || '';
        const subAccName = acc?.subAccounts?.find((s) => s.id === tx.subAccountId)?.name?.toLowerCase() || '';

        const searchableTokensString = [
          tx.description?.toLowerCase() || '',
          tx.category?.toLowerCase() || '',
          accName,
          subAccName,
          yearStr,
          monthNum,
          monthNumPadded,
          dayNum,
          dayNumPadded,
          monthNameEn,
          monthShortEn,
          `${dayNum} ${monthShortEn} ${yearStr}`.toLowerCase(),
          `${dayNum} ${monthNameEn} ${yearStr}`.toLowerCase(),
        ].join(' ');

        return tokens.every((token) => searchableTokensString.includes(token));
      });
    }

    return result;
  }, [historyTransactions, searchQuery, accounts]);

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        {/* Dismiss Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Modal Container */}
        <View style={modalStyles.content}>
          <View style={modalStyles.handle} />

          {/* FIXED HEADER SECTION */}
          <View style={modalStyles.fixedHeaderSection}>
            <View style={modalStyles.headerRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={modalStyles.title}>Transactions</Text>
                <View style={modalStyles.badge}>
                  <Text style={modalStyles.badgeText}>{filteredList.length}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={modalStyles.searchContainer}>
              <Ionicons name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={modalStyles.searchInput}
                placeholder="Search name, category, date, year..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Type Selector */}
            <View style={modalStyles.typeRow}>
              {(['all', 'expense', 'income'] as const).map((flt) => (
                <TouchableOpacity
                  key={flt}
                  style={[modalStyles.typeBtn, historyTypeFilter === flt && modalStyles.typeBtnActive]}
                  onPress={() => {
                    setTypeFilter(flt);
                    setCatFilter('all');
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      modalStyles.typeBtnText,
                      historyTypeFilter === flt && modalStyles.typeBtnTextActive,
                    ]}
                  >
                    {flt === 'all' ? 'All' : flt === 'expense' ? 'Expenses' : 'Income'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Categories */}
            <View style={{ marginBottom: 12 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20 }}
              >
                <TouchableOpacity
                  style={[modalStyles.chip, historyCatFilter === 'all' && modalStyles.chipActive]}
                  onPress={() => setCatFilter('all')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      modalStyles.chipText,
                      historyCatFilter === 'all' && modalStyles.chipTextActive,
                    ]}
                  >
                    All Categories
                  </Text>
                </TouchableOpacity>
                {historyAvailableCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[modalStyles.chip, historyCatFilter === cat && modalStyles.chipActive]}
                    onPress={() => setCatFilter(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        modalStyles.chipText,
                        historyCatFilter === cat && modalStyles.chipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* SCROLLABLE TRANSACTION LIST */}
          <FlatList
            data={filteredList}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={true}
            style={modalStyles.flatList}
            contentContainerStyle={modalStyles.listContent}
            ListEmptyComponent={
              <View style={modalStyles.emptyState}>
                <Ionicons name="search-outline" size={38} color={COLORS.textMuted} />
                <Text style={modalStyles.emptyPrimaryText}>No Transactions Found</Text>
                <Text style={modalStyles.emptySubText}>
                  No records match your keyword or active filters.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TransactionCard
                item={item}
                accounts={accounts}
                onClone={onClone}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            )}
          />
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
  content: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 28,
    height: '85%',
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
    marginBottom: 12,
  },
  fixedHeaderSection: {
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: {
    color: COLORS.finance,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  typeBtnActive: {
    backgroundColor: COLORS.finance,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  typeBtnTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  chip: {
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.finance,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.finance,
    fontWeight: '800',
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyPrimaryText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});