import React from 'react';
import {
  Text,
  View,
  Modal,
  TouchableOpacity,
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
  ACCOUNT_TYPE_THEME,
  formatMoney,
  getAccountIcon,
  hexToRgba,
} from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';

interface ManageAccountsModalProps {
  visible: boolean;
  accounts: Account[];
  getAccBalance: (accId: string) => number;
  onClose: () => void;
  onReorderAccounts: (newAccounts: Account[]) => void;
}

export const ManageAccountsModal = ({
  visible,
  accounts,
  getAccBalance,
  onClose,
  onReorderAccounts,
}: ManageAccountsModalProps) => {
  const renderDraggableItem = ({ item, drag, isActive }: RenderItemParams<Account>) => {
    const balance = getAccBalance(item.id);
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
              <Text style={styles.headerTitle}>Manage Accounts Order</Text>
              <Text style={styles.headerSubtitle}>Hold and drag rows to reorder your account list</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <GestureHandlerRootView style={styles.manageContainer}>
            <DraggableFlatList
              data={accounts}
              keyExtractor={(item) => item.id}
              renderItem={renderDraggableItem}
              onDragEnd={({ data }) => onReorderAccounts(data)}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          </GestureHandlerRootView>
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
    maxHeight: '80%',
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
    paddingVertical: 14,
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
  manageContainer: {
    height: 400,
    paddingBottom: 24,
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
