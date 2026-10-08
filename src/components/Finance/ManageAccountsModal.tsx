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
import {
  Account,
  formatMoney,
  getAccountIcon,
  ACCOUNT_TYPE_THEME,
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
  const renderItem = ({ item, drag, isActive }: RenderItemParams<Account>) => {
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
            modalStyles.rowCard,
            { borderColor: isActive ? theme.border : hexToRgba(theme.color, 0.22) },
            isActive && [
              modalStyles.rowCardActive,
              { shadowColor: theme.color, backgroundColor: theme.bg },
            ],
          ]}
        >
          {/* Icon */}
          <View style={[modalStyles.iconWrap, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <FontAwesome5 name={typeIcon} size={16} color={theme.color} />
          </View>

          {/* Info Akun */}
          <View style={modalStyles.infoGroup}>
            <Text style={modalStyles.accName} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
            <View style={modalStyles.metaRow}>
              <View
                style={[modalStyles.typeChip, { backgroundColor: theme.bg, borderColor: theme.border }]}
              >
                <Text
                  style={[modalStyles.typeChipText, { color: theme.color }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.type}
                </Text>
              </View>
              <Text
                style={[modalStyles.accBalance, { color: theme.color }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                ellipsizeMode="tail"
              >
                {formatMoney(balance, item.currency)}
              </Text>
            </View>
          </View>

          {/* Drag Handle Icon - Bisa disentuh/ditarik langsung */}
          <TouchableOpacity
            onPressIn={drag}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={[
              modalStyles.dragHandle,
              isActive && { backgroundColor: theme.bg, borderColor: theme.border },
            ]}
          >
            <Ionicons name="reorder-three" size={24} color={isActive ? theme.color : COLORS.textMuted} />
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
              <View style={modalStyles.headerTextWrap}>
                <Text style={modalStyles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                  Atur Posisi Akun
                </Text>
                <Text style={modalStyles.headerSubtitle} numberOfLines={2} ellipsizeMode="tail">
                  Tahan & geser ikon garis tiga untuk mengubah urutan
                </Text>
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
                    <View style={modalStyles.emptyIconWrap}>
                      <Ionicons name="wallet-outline" size={30} color={COLORS.finance} />
                    </View>
                    <Text style={modalStyles.emptyText} numberOfLines={2}>
                      Tidak ada akun.
                    </Text>
                  </View>
                }
              />
            </View>

            {/* Tombol Selesai */}
            <TouchableOpacity style={modalStyles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="checkmark" size={17} color="#08090C" style={modalStyles.btnIcon} />
              <Text style={modalStyles.doneBtnText} numberOfLines={1} ellipsizeMode="tail">
                Selesai
              </Text>
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
    paddingBottom: 28,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
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
  listWrapper: {
    maxHeight: 440,
  },
  scrollContent: {
    paddingBottom: 20,
    gap: 12,
  },
  emptyState: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.financeLight,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowCardActive: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGroup: {
    flex: 1,
    minWidth: 0,
  },
  accName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  typeChip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    maxWidth: 130,
    flexShrink: 0,
  },
  typeChipText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  accBalance: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  dragHandle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: hexToRgba('#FFFFFF', 0.05),
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 8,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.finance,
    borderRadius: RADIUS.md,
    minHeight: 50,
    paddingHorizontal: 20,
    marginTop: 16,
    shadowColor: COLORS.finance,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  doneBtnText: {
    color: '#08090C',
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});
