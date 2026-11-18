import React, { useState, useMemo } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '../Common/BottomSheetModal';
import {
  Transaction,
  Account,
  CategoryCustomIcon,
  MONTHS,
  TX_TYPE_THEME,
  getCategoryTheme,
  resolveSubAccountDisplay,
} from '../../types/finance';
import { TransactionCard } from './FinanceCards';
import { TransactionDetailModal } from './TransactionDetailModal';
import { COLORS, RADIUS } from '../../constants/theme';
import { KEEP_KEYBOARD_SCROLL_PROPS, useKeyboardAwareSheet } from '../../hooks/useKeyboardHeight';

interface HistoryModalProps {
  visible: boolean;
  historyTransactions: Transaction[];
  accounts: Account[];
  customCategoryIcons?: CategoryCustomIcon[];
  historyTypeFilter: 'all' | 'income' | 'expense' | 'transfer';
  historyCatFilter: string;
  historyAvailableCategories: string[];
  includeInvestment?: boolean;
  onToggleIncludeInvestment?: () => void;
  onClose: () => void;
  setTypeFilter: (filter: 'all' | 'income' | 'expense' | 'transfer') => void;
  setCatFilter: (cat: string) => void;
  onClone: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onEdit?: (tx: Transaction) => void;
}

const FILTER_ORDER = ['all', 'expense', 'income', 'transfer'] as const;

const FILTER_THEME: Record<'all' | 'income' | 'expense' | 'transfer', { color: string; bg: string; border: string }> = {
  all: {
    color: COLORS.finance,
    bg: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.34)',
  },
  expense: TX_TYPE_THEME.expense,
  income: TX_TYPE_THEME.income,
  transfer: TX_TYPE_THEME.transfer,
};

const ALL_CATEGORIES_THEME = {
  color: COLORS.finance,
  bg: 'rgba(37, 99, 235, 0.12)',
  border: 'rgba(37, 99, 235, 0.34)',
};

export const HistoryModal = ({
  visible,
  historyTransactions,
  accounts,
  customCategoryIcons,
  historyTypeFilter,
  historyCatFilter,
  historyAvailableCategories,
  includeInvestment = false,
  onToggleIncludeInvestment,
  onClose,
  setTypeFilter,
  setCatFilter,
  onClone,
  onDelete,
  onEdit,
}: HistoryModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { keyboardOverlap, scrollBottomPadding, onOverlayLayout } = useKeyboardAwareSheet(32);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const selectedTxForDetail = useMemo(
    () => historyTransactions.find((t) => t.id === selectedTxId) ?? null,
    [historyTransactions, selectedTxId]
  );

  const handleClose = () => {
    Keyboard.dismiss();
    setSelectedTxId(null);
    onClose();
  };

  const filteredList = useMemo(() => {
    let result = includeInvestment
      ? historyTransactions
      : historyTransactions.filter((tx) => {
          const acc = accounts.find((a) => a.id === tx.accountId);
          if (acc?.type === 'Investment') return false;
          const toAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : undefined;
          if (toAcc?.type === 'Investment') return false;
          return true;
        });

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
        const subAccName = resolveSubAccountDisplay(
          acc,
          tx.subAccountId,
          tx.deletedSubAccountName
        ).label.toLowerCase();

        const toAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : undefined;
        const toAccName = toAcc?.name?.toLowerCase() || '';
        const toSubAccName = resolveSubAccountDisplay(
          toAcc,
          tx.toSubAccountId,
          tx.deletedToSubAccountName
        ).label.toLowerCase();

        const searchableTokensString = [
          tx.description?.toLowerCase() || '',
          tx.category?.toLowerCase() || '',
          accName,
          subAccName,
          toAccName,
          toSubAccName,
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
  }, [historyTransactions, includeInvestment, searchQuery, accounts]);

  const hasInvestmentAccounts = useMemo(
    () => accounts.some((a) => a.type === 'Investment'),
    [accounts]
  );

  return (
    <BottomSheetModal
      visible={visible}
      onRequestClose={handleClose}
      onBackdropPress={handleClose}
      overlayStyle={modalStyles.overlay}
      sheetStyle={modalStyles.content}
      keyboardOverlap={keyboardOverlap}
      onOverlayLayout={onOverlayLayout}
    >
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {hasInvestmentAccounts && onToggleIncludeInvestment && (
                  <TouchableOpacity
                    onPress={onToggleIncludeInvestment}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: RADIUS.full,
                      backgroundColor: includeInvestment
                        ? 'rgba(201, 109, 18, 0.12)'
                        : COLORS.bgCardSub,
                      borderWidth: 1,
                      borderColor: includeInvestment
                        ? 'rgba(201, 109, 18, 0.34)'
                        : COLORS.borderSubtle,
                    }}
                  >
                    <Ionicons
                      name="trending-up-outline"
                      size={13}
                      color={includeInvestment ? COLORS.warning : COLORS.textMuted}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: includeInvestment ? COLORS.warning : COLORS.textMuted,
                      }}
                    >
                      Investments
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleClose}
                  activeOpacity={0.7}
                  style={modalStyles.closeBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
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
                      {flt === 'all' ? 'All' : flt === 'expense' ? 'Expenses' : flt === 'income' ? 'Income' : 'Transfers'}
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
                  const theme = getCategoryTheme(cat, customCategoryIcons);
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
            extraData={filteredList}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={true}
            {...KEEP_KEYBOARD_SCROLL_PROPS}
            style={modalStyles.flatList}
            contentContainerStyle={[
              modalStyles.listContent,
              { paddingBottom: scrollBottomPadding },
            ]}
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
                customCategoryIcons={customCategoryIcons}
                onClone={onClone}
                onDelete={onDelete}
                onEdit={onEdit}
                onPress={(tx) => setSelectedTxId(tx.id)}
              />
            )}
          />

          <TransactionDetailModal
            visible={Boolean(selectedTxForDetail)}
            transaction={selectedTxForDetail}
            accounts={accounts}
            customCategoryIcons={customCategoryIcons}
            onClose={() => setSelectedTxId(null)}
            onEdit={(tx) => {
              onEdit?.(tx);
            }}
            onClone={(tx) => {
              onClone(tx);
            }}
            onDelete={(id) => {
              onDelete(id);
            }}
          />
    </BottomSheetModal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 28,
    height: '85%',
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
    borderColor: 'rgba(37, 99, 235, 0.4)',
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
    borderColor: 'rgba(37, 99, 235, 0.32)',
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
