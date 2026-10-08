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
import {
  Transaction,
  Account,
  MONTHS,
  TX_TYPE_THEME,
  getCategoryTheme,
} from '../../types/finance';
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

const FILTER_ORDER = ['all', 'expense', 'income'] as const;

const FILTER_THEME: Record<'all' | 'income' | 'expense', { color: string; bg: string; border: string }> = {
  all: {
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.16)',
    border: 'rgba(56, 189, 248, 0.42)',
  },
  expense: TX_TYPE_THEME.expense,
  income: TX_TYPE_THEME.income,
};

const ALL_CATEGORIES_THEME = {
  color: '#38BDF8',
  bg: 'rgba(56, 189, 248, 0.16)',
  border: 'rgba(56, 189, 248, 0.42)',
};

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
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Modal Container */}
        <View style={modalStyles.content}>
          <View style={modalStyles.handle} />

          {/* HEADER SECTION */}
          <View style={modalStyles.fixedHeaderSection}>
            <View style={modalStyles.headerRow}>
              <View style={modalStyles.headerTitleWrap}>
                <Text style={modalStyles.title} numberOfLines={1} ellipsizeMode="tail">
                  Transactions
                </Text>
                <View style={modalStyles.badge}>
                  <Text style={modalStyles.badgeText} numberOfLines={1} ellipsizeMode="tail">
                    {filteredList.length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={modalStyles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={modalStyles.searchContainer}>
              <Ionicons name="search" size={17} color={COLORS.textMuted} style={modalStyles.searchIcon} />
              <TextInput
                style={modalStyles.searchInput}
                placeholder="Search name, category, date, year..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Type Selector */}
            <View style={modalStyles.typeRow}>
              {FILTER_ORDER.map((flt) => {
                const active = historyTypeFilter === flt;
                const theme = FILTER_THEME[flt];
                return (
                  <TouchableOpacity
                    key={flt}
                    style={[
                      modalStyles.typeBtn,
                      active && {
                        backgroundColor: theme.bg,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      setTypeFilter(flt);
                      setCatFilter('all');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[modalStyles.typeBtnText, active && { color: theme.color, fontWeight: '800' }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {flt === 'all' ? 'All' : flt === 'expense' ? 'Expenses' : 'Income'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Categories */}
            <View style={modalStyles.chipSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={modalStyles.chipRow}
              >
                <TouchableOpacity
                  style={[
                    modalStyles.chip,
                    historyCatFilter === 'all' && {
                      backgroundColor: ALL_CATEGORIES_THEME.bg,
                      borderColor: ALL_CATEGORIES_THEME.border,
                    },
                  ]}
                  onPress={() => setCatFilter('all')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="apps-outline"
                    size={13}
                    color={historyCatFilter === 'all' ? ALL_CATEGORIES_THEME.color : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      modalStyles.chipText,
                      historyCatFilter === 'all' && { color: ALL_CATEGORIES_THEME.color, fontWeight: '800' },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    All Categories
                  </Text>
                </TouchableOpacity>
                {historyAvailableCategories.map((cat) => {
                  const active = historyCatFilter === cat;
                  const theme = getCategoryTheme(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        modalStyles.chip,
                        active && { backgroundColor: theme.bg, borderColor: theme.border },
                      ]}
                      onPress={() => setCatFilter(cat)}
                      activeOpacity={0.7}
                    >
                      <View style={[modalStyles.chipDot, { backgroundColor: theme.color }]} />
                      <Text
                        style={[modalStyles.chipText, active && { color: theme.color, fontWeight: '800' }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* TRANSACTION LIST */}
          <FlatList
            data={filteredList}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={true}
            style={modalStyles.flatList}
            contentContainerStyle={modalStyles.listContent}
            ListEmptyComponent={
              <View style={modalStyles.emptyState}>
                <View style={modalStyles.emptyIconWrap}>
                  <Ionicons name="search-outline" size={34} color={COLORS.finance} />
                </View>
                <Text style={modalStyles.emptyPrimaryText} numberOfLines={2}>
                  No Transactions Found
                </Text>
                <Text style={modalStyles.emptySubText} numberOfLines={3}>
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
    height: '90%',
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 14,
  },
  fixedHeaderSection: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flexShrink: 1,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: COLORS.financeLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    maxWidth: 90,
  },
  badgeText: {
    color: COLORS.finance,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 9,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: '600',
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  typeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 4,
    gap: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBtn: {
    flex: 1,
    minWidth: 0,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  chipSection: {
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 38,
    borderRadius: RADIUS.full,
    maxWidth: 210,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: RADIUS.full,
  },
  chipText: {
    flexShrink: 1,
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.financeLight,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyPrimaryText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 0,
    textAlign: 'center',
  },
  emptySubText: {
    color: COLORS.textMuted,
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});
