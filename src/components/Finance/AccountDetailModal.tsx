import React from 'react';
import {
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Account, formatMoney } from '../../types/finance';

interface AccountDetailModalProps {
  visible: boolean;
  account: Account | null;
  totalBalance: number;
  getSubBalance: (accId: string, subId: string) => number;
  onClose: () => void;
  onRenameAccount: (acc: Account) => void;
  onDeleteAccount: (id: string) => void;
  onEditBalance: (accId: string, subId: string) => void;
  onRenameSubAccount: (accId: string, subId: string, currentName: string) => void;
  onDeleteSubAccount: (accId: string, subId: string) => void;
}

export const AccountDetailModal = ({
  visible,
  account,
  totalBalance,
  getSubBalance,
  onClose,
  onRenameAccount,
  onDeleteAccount,
  onEditBalance,
  onRenameSubAccount,
  onDeleteSubAccount,
}: AccountDetailModalProps) => {
  if (!account) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={modalStyles.content}>
              <View style={modalStyles.handle} />

              {/* Header Modal */}
              <View style={modalStyles.headerRow}>
                <Text style={modalStyles.headerTitle}>Account Settings</Text>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={26} color="#52525B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                {/* SECTION: MAIN ACCOUNT */}
                <Text style={modalStyles.sectionLabel}>MAIN ACCOUNT</Text>
                <View style={modalStyles.mainAccountCard}>
                  <View style={modalStyles.mainCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={modalStyles.mainAccountName}>{account.name}</Text>
                      <Text style={modalStyles.mainAccountBadge}>
                        {account.type} • {account.currency}
                      </Text>
                    </View>
                    <Text style={modalStyles.mainTotalBalance}>
                      {formatMoney(totalBalance, account.currency)}
                    </Text>
                  </View>

                  <View style={modalStyles.mainActionRow}>
                    <TouchableOpacity
                      style={modalStyles.outlineBtn}
                      onPress={() => onRenameAccount(account)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil" size={14} color="#38BDF8" style={{ marginRight: 6 }} />
                      <Text style={modalStyles.outlineBtnText}>Rename Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={modalStyles.dangerOutlineBtn}
                      onPress={() => onDeleteAccount(account.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={14} color="#FF453A" style={{ marginRight: 6 }} />
                      <Text style={modalStyles.dangerOutlineBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* SECTION: SUB-ACCOUNTS */}
                <View style={modalStyles.subSectionHeader}>
                  <Text style={modalStyles.sectionLabel}>SUB-ACCOUNTS ({account.subAccounts.length})</Text>
                  <Text style={modalStyles.subHelperText}>Adjust balance or manage sub-wallets</Text>
                </View>

                {account.subAccounts.map((sub) => {
                  const balance = getSubBalance(account.id, sub.id);
                  return (
                    <View key={sub.id} style={modalStyles.subCard}>
                      <View style={modalStyles.subCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={modalStyles.subAccountName}>{sub.name}</Text>
                          <Text style={modalStyles.subCardTypeLabel}>Sub-Wallet</Text>
                        </View>
                        <Text style={modalStyles.subAccountBalance}>
                          {formatMoney(balance, account.currency)}
                        </Text>
                      </View>

                      <View style={modalStyles.subActionRow}>
                        <TouchableOpacity
                          style={modalStyles.adjustBalanceBtn}
                          onPress={() => onEditBalance(account.id, sub.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="calculator-outline" size={14} color="#09090B" style={{ marginRight: 6 }} />
                          <Text style={modalStyles.adjustBalanceText}>Adjust Balance</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={modalStyles.subIconActionBtn}
                          onPress={() => onRenameSubAccount(account.id, sub.id, sub.name)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="pencil" size={15} color="#38BDF8" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={modalStyles.subIconActionBtn}
                          onPress={() => onDeleteSubAccount(account.id, sub.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={15} color="#FF453A" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#3F3F46',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  subSectionHeader: {
    marginTop: 20,
    marginBottom: 8,
  },
  subHelperText: {
    color: '#52525B',
    fontSize: 12,
    marginBottom: 8,
  },
  mainAccountCard: {
    backgroundColor: '#09090B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  mainAccountName: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '700',
  },
  mainAccountBadge: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  mainTotalBalance: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '800',
  },
  mainActionRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#18181B',
    paddingTop: 12,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  outlineBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  dangerOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.4)',
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
  },
  dangerOutlineBtnText: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '700',
  },
  subCard: {
    backgroundColor: '#09090B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 10,
  },
  subCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subAccountName: {
    color: '#FAFAFA',
    fontSize: 15,
    fontWeight: '600',
  },
  subCardTypeLabel: {
    color: '#52525B',
    fontSize: 11,
    marginTop: 1,
  },
  subAccountBalance: {
    color: '#FAFAFA',
    fontSize: 15,
    fontWeight: '700',
  },
  subActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustBalanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 8,
    borderRadius: 10,
  },
  adjustBalanceText: {
    color: '#09090B',
    fontSize: 12,
    fontWeight: '800',
  },
  subIconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});