import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
            {/* Header Modal */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <Ionicons name="calendar" size={18} color={COLORS.finance} style={{ marginRight: 8 }} />
                <Text style={styles.headerTitle}>Select Period</Text>
              </View>

              <View style={styles.headerRightActions}>
                {!isCurrentMonthActive && (
                  <TouchableOpacity
                    style={styles.currentMonthBtn}
                    onPress={handleSelectCurrentMonth}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="today-outline" size={13} color={COLORS.finance} style={{ marginRight: 4 }} />
                    <Text style={styles.currentMonthBtnText}>This Month</Text>
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

            {/* Year Navigation */}
            <View style={styles.yearNavRow}>
              <TouchableOpacity style={styles.yearNavBtn} onPress={handlePrevYear} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>

              <Text style={styles.yearText}>{internalYear}</Text>

              <TouchableOpacity style={styles.yearNavBtn} onPress={handleNextYear} activeOpacity={0.7}>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* 12 Months Grid */}
            <View style={styles.monthGrid}>
              {SHORT_MONTHS.map((mName, idx) => {
                const isSelected = selectedMonthIndex === idx && selectedYearVal === internalYear;
                const isTodayMonth = currentActualMonth === idx && currentActualYear === internalYear;

                return (
                  <TouchableOpacity
                    key={mName}
                    style={[
                      styles.monthCell,
                      isSelected && styles.monthCellSelected,
                      isTodayMonth && !isSelected && styles.monthCellToday,
                    ]}
                    onPress={() => handleSelectMonth(idx)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.monthCellText,
                        isSelected && styles.monthCellTextSelected,
                        isTodayMonth && !isSelected && styles.monthCellTextToday,
                      ]}
                    >
                      {mName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
    height: 48,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentMonthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.financeLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  currentMonthBtnText: {
    color: COLORS.finance,
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  yearNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
  },
  yearNavBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  yearText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    height: 216,
  },
  monthCell: {
    width: '31%',
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthCellSelected: {
    backgroundColor: COLORS.finance,
    borderColor: COLORS.finance,
  },
  monthCellToday: {
    borderWidth: 1.5,
    borderColor: COLORS.finance,
  },
  monthCellText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  monthCellTextSelected: {
    color: '#08090C',
    fontWeight: '900',
  },
  monthCellTextToday: {
    color: COLORS.finance,
    fontWeight: '800',
  },
});