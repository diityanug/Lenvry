import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import { SHORT_MONTHS } from '../../constants/date';

const ACCENT = '#38BDF8';
const TODAY_MONTH_TINT = 'rgba(56, 189, 248, 0.10)';

interface CalendarModalProps {
  visible: boolean;
  selectedDate?: Date;
  viewDate?: Date;
  txDate?: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

const CalendarModalContent = ({
  selectedDate,
  viewDate,
  txDate,
  onClose,
  onSelectDate,
}: Omit<CalendarModalProps, 'visible'>) => {
  const activeDate = selectedDate || txDate || new Date();
  const baseDate = viewDate || selectedDate || txDate || new Date();
  const [internalYear, setInternalYear] = useState<number>(() => baseDate.getFullYear());

  const today = new Date();
  const currentActualYear = today.getFullYear();
  const currentActualMonth = today.getMonth();

  const selectedMonthIndex = activeDate.getMonth();
  const selectedYearVal = activeDate.getFullYear();

  const handlePrevYear = () => {
    setInternalYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setInternalYear((prev) => prev + 1);
  };

  const handleSelectMonth = (monthIdx: number) => {
    const newDate = new Date(internalYear, monthIdx, 1);
    onSelectDate(newDate);
    onClose();
  };

  const handleSelectCurrentMonth = () => {
    setInternalYear(currentActualYear);
    onSelectDate(new Date(currentActualYear, currentActualMonth, 1));
    onClose();
  };

  const isCurrentMonthActive = selectedMonthIndex === currentActualMonth && selectedYearVal === currentActualYear;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.container}>
            <View style={styles.sheetHandle} />

            {/* Header Modal */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <View style={styles.headerIconBox}>
                  <Ionicons name="calendar" size={18} color={ACCENT} />
                </View>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    Select Period
                  </Text>
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    Choose a month to review
                  </Text>
                </View>
              </View>

              <View style={styles.headerRightActions}>
                {!isCurrentMonthActive && (
                  <TouchableOpacity
                    style={styles.currentMonthBtn}
                    onPress={handleSelectCurrentMonth}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="today-outline" size={13} color={ACCENT} style={styles.currentMonthIcon} />
                    <Text style={styles.currentMonthBtnText} numberOfLines={1}>
                      This Month
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Year Navigation */}
              <View style={styles.yearNavRow}>
                <TouchableOpacity
                  style={styles.yearNavBtn}
                  onPress={handlePrevYear}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>

                <View style={styles.yearTextWrap}>
                  <Text style={styles.yearText} numberOfLines={1}>
                    {internalYear}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.yearNavBtn}
                  onPress={handleNextYear}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.monthGrid}>
                {[0, 1, 2].map((rowIdx) => (
                  <View key={`month-row-${rowIdx}`} style={styles.monthRow}>
                    {SHORT_MONTHS.slice(rowIdx * 4, rowIdx * 4 + 4).map((mName, colIdx) => {
                      const idx = rowIdx * 4 + colIdx;
                      const isSelected = selectedMonthIndex === idx && selectedYearVal === internalYear;
                      const isTodayMonth = currentActualMonth === idx && currentActualYear === internalYear;
                      const cellTheme = MONTH_COLORS[idx % MONTH_COLORS.length];

                      return (
                        <TouchableOpacity
                          key={mName}
                          style={[
                            styles.monthCell,
                            isTodayMonth && !isSelected && [styles.monthCellToday, { borderColor: cellTheme, backgroundColor: TODAY_MONTH_TINT }],
                            isSelected && { backgroundColor: cellTheme, borderColor: cellTheme },
                          ]}
                          onPress={() => handleSelectMonth(idx)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.monthCellText,
                              isTodayMonth && !isSelected && { color: cellTheme },
                              isSelected && styles.monthCellTextSelected,
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            {mName}
                          </Text>
                          {isTodayMonth && (
                            <View
                              style={[
                                styles.monthDot,
                                { backgroundColor: isSelected ? 'rgba(8, 9, 12, 0.65)' : cellTheme },
                              ]}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>

              <View style={styles.footerHintRow}>
                <Ionicons name="information-circle-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.footerHintText} numberOfLines={2}>
                  Selected months highlight automatically. Current month keeps a coloured ring.
                </Text>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const MONTH_COLORS = [
  '#38BDF8',
  '#818CF8',
  '#A855F7',
  '#EC4899',
  '#F43F5E',
  '#F97316',
  '#F59E0B',
  '#84CC16',
  '#10B981',
  '#2DD4BF',
  '#22D3EE',
  '#6366F1',
];

export const CalendarModal = ({ visible, ...props }: CalendarModalProps) => {
  if (!visible) return null;
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={props.onClose}>
      <CalendarModalContent {...props} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    alignSelf: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xxl,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.borderLight,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
    gap: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  headerIconBox: {
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
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  currentMonthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    minHeight: 36,
    justifyContent: 'center',
  },
  currentMonthIcon: {
    marginRight: 5,
  },
  currentMonthBtnText: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  yearNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 52,
    gap: 8,
  },
  yearNavBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCardHover,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
  },
  yearTextWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  monthGrid: {
    marginBottom: 4,
    gap: 10,
  },
  monthRow: {
    flexDirection: 'row',
    gap: 10,
  },
  monthCell: {
    flex: 1,
    minWidth: 0,
    height: 56,
    minHeight: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthCellSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  monthCellToday: {
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  monthCellText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  monthCellTextSelected: {
    color: '#08090C',
    fontWeight: '900',
  },
  monthCellTextToday: {
    color: ACCENT,
    fontWeight: '800',
  },
  monthDot: {
    width: 5,
    height: 5,
    borderRadius: RADIUS.full,
    marginTop: 5,
  },
  footerHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  footerHintText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
    minWidth: 0,
  },
});
