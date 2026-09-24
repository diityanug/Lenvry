import React from 'react';
import { Text, View, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Account, formatMoney } from '../../types/finance';
import { financeStyles as styles } from '../../styles/financeStyles';

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
  visible, account, totalBalance, getSubBalance, onClose,
  onRenameAccount, onDeleteAccount, onEditBalance, onRenameSubAccount, onDeleteSubAccount
}: AccountDetailModalProps) => {
  if (!account) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlayDismissArea} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.modalTitle}>{account.name}</Text>
              <Text style={styles.modalSubtitle}>
                {account.type} ({account.currency}) • Total: {formatMoney(totalBalance, account.currency)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => onRenameAccount(account)} style={{ marginRight: 14 }} activeOpacity={0.7}>
                <Ionicons name="pencil" size={20} color="#38BDF8" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDeleteAccount(account.id)} style={{ marginRight: 14 }} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={20} color="#FF453A" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={26} color="#52525B" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>SUB-ACCOUNTS (Tap to adjust balance)</Text>
            {account.subAccounts.map(sub => (
              <View key={sub.id} style={styles.subAccDetailRow}>
                <TouchableOpacity 
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} 
                  onPress={() => onEditBalance(account.id, sub.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.subAccDetailName}>{sub.name}</Text>
                  <Text style={[styles.subAccDetailBalance, { marginLeft: 10 }]}>
                    {formatMoney(getSubBalance(account.id, sub.id), account.currency)}
                  </Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    onPress={() => onRenameSubAccount(account.id, sub.id, sub.name)} 
                    style={{ padding: 6, marginRight: 4 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={16} color="#38BDF8" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => onDeleteSubAccount(account.id, sub.id)} 
                    style={{ padding: 6 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF453A" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};