import { StyleSheet, Platform } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

export const ACCENT = '#38BDF8';
export const RECEIVABLE_COLOR = '#10B981'; // Emerald for money owed to you
export const DEBT_COLOR = '#F43F5E'; // Rose for money you owe
export const INK = '#08090C';

export const debtsStyles = StyleSheet.create({
  containerCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    lineHeight: 19,
  },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  btnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    flexShrink: 0,
  },
  btnAddText: {
    color: INK,
    fontSize: 12,
    fontWeight: '800',
  },

  // Summary Banner
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 16,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  summaryAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  summarySub: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.borderSubtle,
    marginHorizontal: 14,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgCardSub,
  },
  tabBtnActiveReceivable: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: RECEIVABLE_COLOR,
  },
  tabBtnActiveDebt: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: DEBT_COLOR,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  // Status Filter
  statusFilterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    backgroundColor: 'transparent',
  },
  statusPillActive: {
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusPillText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  statusPillTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },

  // Items
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 16,
    gap: 12,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  itemTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnCheckmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  btnCheckmarkText: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgeSettled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  badgeSettledText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.success,
  },
  btnDelete: {
    padding: 7,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  itemAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  amountLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  remainingAmountText: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  paidAmountText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  notesPreview: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingTop: 2,
  },

  // Modal Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  settleModalSheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    height: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSheetSubtitle: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  modalCloseBtn: {
    padding: 7,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
  },
  currentBalanceBanner: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  currentBalanceLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  currentBalanceValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  inputLabelNoMargin: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.7,
  },
  inputSubLabel: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginBottom: 8,
  },

  // Account Picker Seamless Edge-to-Edge
  accPickerScroll: {
    marginHorizontal: -22,
    marginBottom: 16,
  },
  accPickerContent: {
    paddingHorizontal: 22,
    gap: 10,
  },
  accPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  accPillSelected: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  accPillText: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  accPillTextSelected: {
    color: ACCENT,
    fontWeight: '700',
  },

  // Sub Accounts
  subAccWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subAccPill: {
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  subAccPillSelected: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  subAccPillText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
  },
  subAccPillTextSelected: {
    color: ACCENT,
    fontWeight: '700',
  },

  amountInputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  btnPayFull: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  btnPayFullText: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
    minHeight: 48,
  },
  calcBox: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 12.5,
    color: COLORS.textMuted,
  },
  calcValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  settleStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 10,
    borderRadius: RADIUS.md,
    marginTop: 4,
  },
  settleStatusText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '700',
  },
  partialNotice: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  btnConfirmSettle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: RADIUS.xl,
    marginTop: 6,
  },
  btnConfirmSettleText: {
    color: INK,
    fontSize: 14,
    fontWeight: '800',
  },

  // Add Modal Type Switcher (Symmetrical Two Cards)
  typeSwitcherRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeSwitchCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgCardSub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSwitchCardActiveReceivable: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: RECEIVABLE_COLOR,
  },
  typeSwitchCardActiveDebt: {
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderColor: DEBT_COLOR,
  },
  typeSwitchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  typeSwitchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  typeSwitchSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Amount & Currency Row (Symmetrical & Equal Height)
  amountCurrencyRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  currencyToggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 3,
    height: 48,
  },
  currencyBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  currencyBtnActive: {
    backgroundColor: ACCENT,
  },
  currencyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  currencyBtnTextActive: {
    color: INK,
    fontWeight: '800',
  },
  amountCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 74,
    justifyContent: 'center',
    marginBottom: 16,
  },
  amountCardActive: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  amountCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountCardPrefix: {
    fontSize: 20,
    fontWeight: '800',
    color: ACCENT,
    marginRight: 10,
    flexShrink: 0,
  },
  amountCardInput: {
    flex: 1,
    minWidth: 0,
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    paddingVertical: 4,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  clearInputBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  amountPreviewContainer: {
    minHeight: 18,
    justifyContent: 'center',
    marginTop: 4,
  },
  amountPreviewText: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
  },
  amountPreviewTextMuted: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  keypadWrapper: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgCardSub,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});
