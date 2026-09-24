import { StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

export const habitStyles = StyleSheet.create({
  // Layout Utama
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    marginBottom: 24,
    marginTop: 24,
  },
  headerTitleBold: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitleLight: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#8E97FD',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#8E97FD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  // Date Navigator
  dateNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateNavDisplayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },

  // Category Filter
  filterContainer: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterChip: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: '#8E97FD',
    borderColor: '#8E97FD',
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // Progress Card
  progressCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  progressBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8E97FD',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8E97FD',
    borderRadius: 4,
  },

  // Masonry Grid
  masonryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  masonryColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  masonryCard: {
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  masonryCardCompleted: {
    opacity: 0.6,
  },
  cardIconWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextWrapper: {
    marginTop: 12,
  },
  textWrapper: {
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
  },

  // Modal Umum
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalOverlayDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalContentSmall: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xxl,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  modalTitleCenter: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSubtitleCenter: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },

  // Form Input Modal
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    marginBottom: 24,
    fontSize: 15,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputCenter: {
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    marginBottom: 28,
    fontSize: 15,
    textAlign: 'center',
    width: '100%',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipScroll: {
    flexDirection: 'row',
    flexGrow: 0,
    marginBottom: 32,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  chipModal: {
    backgroundColor: COLORS.bgPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipModalActive: {
    backgroundColor: '#8E97FD',
    borderColor: '#8E97FD',
  },
  chipModalText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipModalTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  chipAdd: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
  },
  chipAddText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#8E97FD',
    paddingVertical: 18,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Modal Actions
  dialogActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dialogBtnCancel: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.border,
    marginRight: 12,
    alignItems: 'center',
  },
  dialogBtnCancelText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dialogBtnConfirm: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  dialogBtnConfirmText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  btnDestructive: {
    backgroundColor: COLORS.danger,
  },
  textDestructive: {
    color: '#FFFFFF',
  },
  btnNeutral: {
    backgroundColor: '#8E97FD',
  },
  textNeutral: {
    color: '#FFFFFF',
  },
});