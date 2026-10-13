import { StyleSheet, Platform } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

export const ACCENT = '#38BDF8';
export const INCOME = '#10B981';
export const EXPENSE = '#F43F5E';
export const INK = '#08090C';

export const BILL_CATEGORIES = [
  'Bills & Utilities',
  'Subscriptions',
  'Housing / Rent',
  'Internet & Phone',
  'Insurance',
  'Fitness & Gym',
  'Cloud & Storage',
  'Other',
];

export const BILL_CATEGORY_THEMES: Record<string, { icon: any; color: string }> = {
  'Bills & Utilities': { icon: 'flash-outline', color: '#F59E0B' },
  'Subscriptions': { icon: 'apps-outline', color: '#A855F7' },
  'Housing / Rent': { icon: 'home-outline', color: '#EAB308' },
  'Internet & Phone': { icon: 'wifi-outline', color: '#38BDF8' },
  'Insurance': { icon: 'shield-checkmark-outline', color: '#10B981' },
  'Fitness & Gym': { icon: 'barbell-outline', color: '#EC4899' },
  'Cloud & Storage': { icon: 'cloud-outline', color: '#6366F1' },
  'Other': { icon: 'receipt-outline', color: ACCENT },
};

export const PRESET_BILLS = [
  { name: 'Netflix', category: 'Subscriptions', defaultAmount: '186000', defaultAmountUSD: '15', icon: 'tv-outline', color: '#EF4444' },
  { name: 'Spotify', category: 'Subscriptions', defaultAmount: '55000', defaultAmountUSD: '11', icon: 'musical-notes-outline', color: '#10B981' },
  { name: 'YouTube Premium', category: 'Subscriptions', defaultAmount: '59000', defaultAmountUSD: '14', icon: 'logo-youtube', color: '#EF4444' },
  { name: 'Wi-Fi / Internet', category: 'Internet & Phone', defaultAmount: '350000', defaultAmountUSD: '50', icon: 'wifi-outline', color: '#38BDF8' },
  { name: 'Electricity / Power', category: 'Bills & Utilities', defaultAmount: '250000', defaultAmountUSD: '60', icon: 'flash-outline', color: '#F59E0B' },
  { name: 'Water & Utilities', category: 'Bills & Utilities', defaultAmount: '80000', defaultAmountUSD: '30', icon: 'water-outline', color: '#06B6D4' },
  { name: 'House / Room Rent', category: 'Housing / Rent', defaultAmount: '1500000', defaultAmountUSD: '500', icon: 'home-outline', color: '#EAB308' },
  { name: 'Gym Membership', category: 'Fitness & Gym', defaultAmount: '350000', defaultAmountUSD: '45', icon: 'barbell-outline', color: '#EC4899' },
  { name: 'iCloud / Google One', category: 'Cloud & Storage', defaultAmount: '45000', defaultAmountUSD: '3', icon: 'cloud-outline', color: '#6366F1' },
  { name: 'Pulsa / Paket Data', category: 'Internet & Phone', defaultAmount: '100000', defaultAmountUSD: '15', icon: 'phone-portrait-outline', color: '#EC4899' },
  { name: 'BPJS / Insurance', category: 'Insurance', defaultAmount: '150000', defaultAmountUSD: '25', icon: 'shield-checkmark-outline', color: '#10B981' },
];

export const getOrdinal = (day: number): string => {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return `${day}st`;
  if (j === 2 && k !== 12) return `${day}nd`;
  if (j === 3 && k !== 13) return `${day}rd`;
  return `${day}th`;
};

export const getBillTheme = (category: string, name: string): { icon: any; color: string; bg: string } => {
  const lower = name.toLowerCase();
  if (lower.includes('netflix') || lower.includes('disney') || lower.includes('tv') || lower.includes('prime') || lower.includes('vidio')) {
    return { icon: 'tv-outline', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.16)' };
  }
  if (lower.includes('spotify') || lower.includes('music') || lower.includes('apple music')) {
    return { icon: 'musical-notes-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' };
  }
  if (lower.includes('youtube')) {
    return { icon: 'logo-youtube', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.16)' };
  }
  if (lower.includes('wifi') || lower.includes('internet') || lower.includes('indihome') || lower.includes('biznet') || lower.includes('myrepublic')) {
    return { icon: 'wifi-outline', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' };
  }
  if (lower.includes('pln') || lower.includes('listrik') || lower.includes('electric') || lower.includes('token')) {
    return { icon: 'flash-outline', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' };
  }
  if (lower.includes('air') || lower.includes('pdam') || lower.includes('water')) {
    return { icon: 'water-outline', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.16)' };
  }
  if (lower.includes('kost') || lower.includes('rent') || lower.includes('rumah') || lower.includes('sewa') || lower.includes('apartment')) {
    return { icon: 'home-outline', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.16)' };
  }
  if (lower.includes('gym') || lower.includes('fitness') || lower.includes('workout')) {
    return { icon: 'barbell-outline', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.16)' };
  }
  if (lower.includes('cloud') || lower.includes('icloud') || lower.includes('google') || lower.includes('drive')) {
    return { icon: 'cloud-outline', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.16)' };
  }
  if (lower.includes('pulsa') || lower.includes('kuota') || lower.includes('telkomsel') || lower.includes('indosat') || lower.includes('xl')) {
    return { icon: 'phone-portrait-outline', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.16)' };
  }

  switch (category) {
    case 'Subscriptions':
      return { icon: 'apps-outline', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.16)' };
    case 'Internet & Phone':
      return { icon: 'phone-portrait-outline', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' };
    case 'Housing / Rent':
      return { icon: 'home-outline', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.16)' };
    case 'Insurance':
      return { icon: 'shield-checkmark-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' };
    case 'Fitness & Gym':
      return { icon: 'barbell-outline', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.16)' };
    case 'Cloud & Storage':
      return { icon: 'cloud-outline', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.16)' };
    default:
      return { icon: 'receipt-outline', color: ACCENT, bg: 'rgba(56, 189, 248, 0.16)' };
  }
};

export const STATUS_THEME: Record<string, { color: string; bg: string; border: string }> = {
  paid: { color: INCOME, bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.34)' },
  today: { color: EXPENSE, bg: 'rgba(244, 63, 94, 0.16)', border: 'rgba(244, 63, 94, 0.4)' },
  soon: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.34)' },
  overdue: { color: EXPENSE, bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)' },
  normal: { color: COLORS.textSecondary, bg: 'rgba(255, 255, 255, 0.05)', border: COLORS.border },
};

export const cardStyles = StyleSheet.create({
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
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  titleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    flexShrink: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: ACCENT,
    marginTop: 2,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    gap: 5,
    minHeight: 44,
    flexShrink: 0,
  },
  addBtnText: {
    color: INK,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  summaryBox: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  summaryLeftCol: {
    flex: 1,
    minWidth: 0,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.9,
  },
  summaryValues: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  summaryAmountRight: {
    alignItems: 'flex-end',
    flexShrink: 1,
    maxWidth: '52%',
  },
  summaryRemainingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  summaryRemainingVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  summaryLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 12,
    gap: 14,
  },
  summaryLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  summaryDot: {
    width: 7,
    height: 7,
    borderRadius: RADIUS.full,
    flexShrink: 0,
  },
  summaryLegendText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    flexShrink: 1,
    minWidth: 0,
  },
  tabFilterRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  tabBtnActive: {
    backgroundColor: COLORS.bgCardHover,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  tabBtnTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  emptyBox: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    marginTop: 14,
  },
  emptyAddBtnText: {
    color: INK,
    fontSize: 11,
    fontWeight: '800',
  },
  billsStack: {
    gap: 14,
  },
  billCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  billCardPaid: {
    opacity: 0.92,
  },
  billCardToday: {
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.45)',
  },
  billAccentRail: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
  },
  billTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  brandIconBox: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
  },
  billInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  billName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  billScheduleText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    lineHeight: 16,
  },
  trashBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  billMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
    gap: 12,
  },
  billAmountCol: {
    flex: 1,
    minWidth: 0,
  },
  billAmountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.7,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  billAmountText: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
    maxWidth: '55%',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    marginRight: 6,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
    minWidth: 0,
  },
  billActionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 14,
  },
  payCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ACCENT,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
    gap: 10,
  },
  payCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  payCtaText: {
    color: INK,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
    flexShrink: 1,
    minWidth: 0,
  },
  payCtaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 9, 12, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    flexShrink: 0,
    maxWidth: '52%',
  },
  payCtaBadgeText: {
    color: INK,
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
    minWidth: 0,
  },
  paidStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    gap: 12,
  },
  paidCheckGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  paidLabelText: {
    color: INCOME,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  undoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    minHeight: 36,
    justifyContent: 'center',
    gap: 6,
    flexShrink: 0,
  },
  undoActionText: {
    color: '#FB7185',
    fontSize: 12,
    fontWeight: '700',
  },
  relogActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minHeight: 40,
    justifyContent: 'center',
    flexShrink: 0,
  },
  relogActionText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  billFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  billCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  billCategoryChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    flexShrink: 1,
    minWidth: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    height: '85%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  modalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  modalTitleIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalTitleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalScrollContent: {
    paddingBottom: 28,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  formSectionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    flexShrink: 1,
    minWidth: 0,
  },
  presetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  presetHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    flexShrink: 0,
  },
  presetScroll: {
    marginBottom: 22,
  },
  presetScrollContent: {
    gap: 10,
    paddingVertical: 4,
    paddingRight: 12,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  presetChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  presetIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  presetIconWrapActive: {
    backgroundColor: 'rgba(8, 9, 12, 0.18)',
  },
  presetTextWrap: {
    flexShrink: 1,
    minWidth: 0,
  },
  presetChipText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  presetChipTextActive: {
    color: INK,
    fontWeight: '800',
  },
  presetSubText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  presetSubTextActive: {
    color: 'rgba(8, 9, 12, 0.75)',
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 22,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  inputLabelInline: {
    flexShrink: 1,
    minWidth: 0,
    marginBottom: 0,
  },
  dueDayPreview: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: '800',
    flexShrink: 0,
  },
  inputField: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 54,
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '600',
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 46,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    maxWidth: '100%',
  },
  catChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  catChipIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  catChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },
  catChipTextActive: {
    color: INK,
    fontWeight: '800',
  },
  quickDayRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickDayPill: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.bgCardSub,
    paddingVertical: 12,
    minHeight: 46,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDayPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: ACCENT,
    borderWidth: 1.5,
  },
  quickDayPillText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  quickDayPillTextActive: {
    color: ACCENT,
    fontWeight: '900',
  },
  saveCtaBtn: {
    flexDirection: 'row',
    backgroundColor: ACCENT,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  saveCtaBtnText: {
    color: INK,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  saveNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 6,
  },
  saveNoteText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
    minWidth: 0,
  },
});
