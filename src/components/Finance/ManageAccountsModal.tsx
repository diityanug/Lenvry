import React from 'react';
import {
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Account, formatMoney } from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';

interface ManageAccountsModalProps {
  visible: boolean;
  accounts: Account[];
  getAccBalance: (accId: string) => number;
  onClose: () => void;
  onReorderAccounts: (newAccounts: Account[]) => void;
  onOpenAddAccount: () => void;
  onSelectAccountDetail: (acc: Account) => void;
}

export const ManageAccountsModal = ({
  visible,
  accounts,
  getAccBalance,
  onClose,
  onReorderAccounts,
  onOpenAddAccount,
  onSelectAccountDetail,
}: ManageAccountsModalProps) => {
  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...accounts];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    onReorderAccounts(updated);
  };

  const moveDown = (index: number) => {
    if (index === accounts.length - 1) return;
    const updated = [...accounts];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    onReorderAccounts(updated);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View style={modalStyles.content}>
              <View style={modalStyles.handle} />

              {/* Header */}
              <View style={modalStyles.headerRow}>
                <View>
                  <Text style={modalStyles.headerTitle}>Manage Accounts</Text>
                </View>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400, marginVertical: 12 }} contentContainerStyle={{ paddingBottom: 8 }}>
                {accounts.length === 0 ? (
                  <View style={modalStyles.emptyState}>
                    <Text style={modalStyles.emptyText}>No accounts found.</Text>
                  </View>
                ) : (
                  accounts.map((acc, index) => {
                    const balance = getAccBalance(acc.id);
                    const formattedBal = formatMoney(balance, acc.currency);
                    return (
                      <View key={acc.id} style={modalStyles.accRow}>
                        {/* Order Action Buttons */}
                        <View style={modalStyles.reorderBtns}>
                          <TouchableOpacity
                            style={[modalStyles.orderBtn, index === 0 && modalStyles.orderBtnDisabled]}
                            onPress={() => moveUp(index)}
                            disabled={index === 0}
                            activeOpacity={0.6}
                          >
                            <Ionicons
                              name="chevron-up"
                              size={18}
                              color={index === 0 ? COLORS.textMuted : COLORS.textPrimary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              modalStyles.orderBtn,
                              index === accounts.length - 1 && modalStyles.orderBtnDisabled,
                            ]}
                            onPress={() => moveDown(index)}
                            disabled={index === accounts.length - 1}
                            activeOpacity={0.6}
                          >
                            <Ionicons
                              name="chevron-down"
                              size={18}
                              color={index === accounts.length - 1 ? COLORS.textMuted : COLORS.textPrimary}
                            />
                          </TouchableOpacity>
                        </View>

                        {/* Account Info */}
                        <TouchableOpacity
                          style={modalStyles.accInfo}
                          onPress={() => {
                            onClose();
                            onSelectAccountDetail(acc);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={modalStyles.badge}>
                            <Text style={modalStyles.badgeText}>{index + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={modalStyles.accName} numberOfLines={1}>
                              {acc.name}
                            </Text>
                            <Text style={modalStyles.accType}>
                              {acc.type} • {acc.subAccounts?.length || 0} pockets
                            </Text>
                          </View>
                          <Text style={modalStyles.accBal}>{formattedBal}</Text>
                          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              {/* Add Account Shortcut */}
              <TouchableOpacity
                style={modalStyles.addBtn}
                onPress={() => {
                  onClose();
                  onOpenAddAccount();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={20} color="#08090C" />
                <Text style={modalStyles.addBtnText}>Add New Account</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  accRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCanvas,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  reorderBtns: {
    flexDirection: 'column',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderBtn: {
    padding: 4,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.sm,
    marginVertical: 1,
  },
  orderBtnDisabled: {
    opacity: 0.3,
  },
  accInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  badgeText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  accName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  accType: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  accBal: {
    color: COLORS.finance,
    fontSize: 13,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.finance,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    marginTop: 8,
    marginBottom: 4,
    gap: 6,
  },
  addBtnText: {
    color: '#08090C',
    fontSize: 14,
    fontWeight: '700',
  },
});
