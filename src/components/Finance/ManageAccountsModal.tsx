import React from 'react';
import {
  Text,
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Account, formatMoney, getAccountIcon } from '../../types/finance';
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
  const renderItem = ({ item, drag, isActive }: RenderItemParams<Account>) => {
    const balance = getAccBalance(item.id);
    const typeIcon = getAccountIcon(item.type);

    return (
      <ScaleDecorator activeScale={1.03}>
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={drag}
          delayLongPress={150}
          disabled={isActive}
          style={[
            modalStyles.rowCard,
            isActive && modalStyles.rowCardActive,
          ]}
        >
          {/* Icon */}
          <View style={modalStyles.iconWrap}>
            <FontAwesome5 name={typeIcon} size={15} color={COLORS.finance} />
          </View>

          {/* Info Akun */}
          <View style={modalStyles.infoGroup}>
            <Text style={modalStyles.accName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={modalStyles.accSub} numberOfLines={1}>
              {item.type} • {formatMoney(balance, item.currency)}
            </Text>
          </View>

          {/* Drag Handle Icon - Bisa disentuh/ditarik langsung */}
          <TouchableOpacity
            onPressIn={drag}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={[modalStyles.dragHandle, isActive && modalStyles.dragHandleActive]}
          >
            <Ionicons
              name="reorder-three"
              size={26}
              color={isActive ? COLORS.finance : COLORS.textMuted}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={modalStyles.backdrop} />
          </TouchableWithoutFeedback>

          <View style={modalStyles.content}>
            <View style={modalStyles.handle} />

            {/* Header */}
            <View style={modalStyles.headerRow}>
              <View>
                <Text style={modalStyles.headerTitle}>Atur Posisi Akun</Text>
                <Text style={modalStyles.headerSubtitle}>
                  Tahan & geser ikon garis tiga untuk mengubah urutan
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close-circle" size={26} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Draggable FlatList dengan konfigurasi spring halus */}
            <View style={modalStyles.listWrapper}>
              <DraggableFlatList
                data={accounts}
                onDragEnd={({ data }) => onReorderAccounts(data)}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={modalStyles.scrollContent}
                animationConfig={{
                  damping: 24,
                  mass: 0.8,
                  stiffness: 160,
                  overshootClamping: false,
                }}
                autoscrollSpeed={100}
                autoscrollThreshold={40}
                dragItemOverflow={true}
                ListEmptyComponent={
                  <View style={modalStyles.emptyState}>
                    <Text style={modalStyles.emptyText}>Tidak ada akun.</Text>
                  </View>
                }
              />
            </View>

            {/* Tombol Selesai */}
            <TouchableOpacity style={modalStyles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={modalStyles.doneBtnText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
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
    marginBottom: 14,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  listWrapper: {
    maxHeight: 420,
  },
  scrollContent: {
    paddingBottom: 16,
    gap: 10,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11141D',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  rowCardActive: {
    backgroundColor: '#161B26',
    borderColor: COLORS.finance,
    shadowColor: COLORS.finance,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoGroup: {
    flex: 1,
    marginRight: 10,
  },
  accName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  accSub: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    marginTop: 2,
  },
  dragHandle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandleActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  doneBtn: {
    backgroundColor: COLORS.finance,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  doneBtnText: {
    color: '#08090C',
    fontSize: 14,
    fontWeight: '800',
  },
});
