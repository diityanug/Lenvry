import React, { useState } from 'react';
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
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Account,
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_THEME,
  formatMoney,
  getAccountIcon,
  hexToRgba,
} from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';

interface UnifiedAccountModalProps {
  visible: boolean;
  accounts: Account[];
  mode?: 'manage' | 'add';
  accFormType: 'main' | 'sub';
  newAccName: string;
  newAccDesc?: string;
  newAccType: Account['type'];
  newAccCurrency: 'IDR' | 'USD';
  parentAccId: string;
  getAccBalance?: (accId: string) => number;
  onClose: () => void;
  onSaveAccount: () => void;
  onReorderAccounts?: (newAccounts: Account[]) => void;
  setAccFormType: (type: 'main' | 'sub') => void;
  setNewAccName: (val: string) => void;
  setNewAccDesc?: (val: string) => void;
  setNewAccType: (t: Account['type']) => void;
  setNewAccCurrency: (c: 'IDR' | 'USD') => void;
  setParentAccId: (id: string) => void;
}

export const UnifiedAccountModal = ({
  visible,
  accounts,
  mode = 'add',
  accFormType,
  newAccName,
  newAccDesc = '',
  newAccType,
  newAccCurrency,
  parentAccId,
  getAccBalance,
  onClose,
  onSaveAccount,
  onReorderAccounts,
  setAccFormType,
  setNewAccName,
  setNewAccDesc,
  setNewAccType,
  setNewAccCurrency,
  setParentAccId,
}: UnifiedAccountModalProps) => {
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>(mode);

  const renderDraggableItem = ({ item, drag, isActive }: RenderItemParams<Account>) => {
    const balance = getAccBalance ? getAccBalance(item.id) : 0;
    const typeIcon = getAccountIcon(item.type);
    const theme = ACCOUNT_TYPE_THEME[item.type] ?? ACCOUNT_TYPE_THEME.Bank;

    return (
      <ScaleDecorator activeScale={1.03}>
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={drag}
          delayLongPress={150}
          disabled={isActive}
          style={[
            styles.rowCard,
            { borderColor: isActive ? theme.border : hexToRgba(theme.color, 0.22) },
            isActive && [
              styles.rowCardActive,
              { shadowColor: theme.color, backgroundColor: theme.bg },
            ],
          ]}
        >
          <View style={styles.leftGroup}>
            <View style={styles.dragHandle}>
              <Ionicons name="reorder-two" size={20} color={COLORS.textMuted} />
            </View>
            <View style={[styles.iconWrap, { backgroundColor: hexToRgba(theme.color, 0.16) }]}>
              <FontAwesome5 name={typeIcon} size={13} color={theme.color} />
            </View>
            <View style={styles.accountTextCol}>
              <Text style={styles.accountName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.accountType}>{item.type} • {item.currency || 'IDR'}</Text>
            </View>
          </View>
          <Text style={[styles.balanceText, { color: theme.color }]}>
            {formatMoney(balance, item.currency || 'IDR')}
          </Text>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

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
              <Text style={styles.headerTitle}>
                {activeTab === 'add' ? 'New Account / Pocket' : 'Manage Accounts'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {activeTab === 'add' ? 'Create a master ledger or sub-pocket' : 'Reorder or organize your accounts'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'add' && styles.tabBtnActive]}
              onPress={() => setActiveTab('add')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-circle-outline"
                size={16}
                color={activeTab === 'add' ? COLORS.finance : COLORS.textMuted}
              />
              <Text style={[styles.tabBtnText, activeTab === 'add' && styles.tabBtnTextActive]}>
                Add Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'manage' && styles.tabBtnActive]}
              onPress={() => setActiveTab('manage')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="reorder-two-outline"
                size={16}
                color={activeTab === 'manage' ? COLORS.finance : COLORS.textMuted}
              />
              <Text style={[styles.tabBtnText, activeTab === 'manage' && styles.tabBtnTextActive]}>
                Reorder / List
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'add' ? (
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
                  <Text style={styles.fieldLabel}>DESCRIPTION / NOTE</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Short description..."
                    placeholderTextColor={COLORS.textMuted}
                    value={newAccDesc}
                    onChangeText={setNewAccDesc}
                  />
                </View>
              )}

              <TouchableOpacity style={styles.saveBtn} onPress={onSaveAccount} activeOpacity={0.85}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#08090C" />
                <Text style={styles.saveBtnText}>CREATE ACCOUNT</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <GestureHandlerRootView style={styles.manageContainer}>
              {onReorderAccounts ? (
                <DraggableFlatList
                  data={accounts}
                  keyExtractor={(item) => item.id}
                  renderItem={renderDraggableItem}
                  onDragEnd={({ data }) => onReorderAccounts(data)}
                  contentContainerStyle={styles.listContainer}
                />
              ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                  {accounts.map((acc) => renderDraggableItem({ item: acc, drag: () => {}, isActive: false, getIndex: () => 0 }))}
                </ScrollView>
              )}
            </GestureHandlerRootView>
          )}
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
    paddingVertical: 12,
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
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 4,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  tabBtnActive: {
    backgroundColor: COLORS.bgCardHover,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  tabBtnText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  tabBtnTextActive: {
    color: COLORS.finance,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
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
    backgroundColor: hexToRgba(COLORS.finance, 0.16),
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
    backgroundColor: hexToRgba(COLORS.finance, 0.16),
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
  manageContainer: {
    height: 400,
  },
  listContainer: {
    padding: 20,
    gap: 8,
  },
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowCardActive: {
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dragHandle: {
    padding: 4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountTextCol: {
    maxWidth: 160,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  accountType: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
