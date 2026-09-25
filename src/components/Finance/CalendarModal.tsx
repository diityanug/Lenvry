import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MONTHS } from '../../types/finance';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface CalendarModalProps {
  visible: boolean;
  selectedDate?: Date;
  viewDate?: Date;
  txDate?: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

export const CalendarModal = ({
  visible,
  selectedDate,
  viewDate,
  txDate,
  onClose,
  onSelectDate,
}: CalendarModalProps) => {
  const activeDate = selectedDate || txDate || new Date();
  const [internalYear, setInternalYear] = useState<number>(activeDate.getFullYear());

  useEffect(() => {
    if (visible) {
      const baseDate = viewDate || selectedDate || txDate || new Date();
      setInternalYear(baseDate.getFullYear());
    }
  }, [visible, viewDate, selectedDate, txDate]);

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
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              {/* Header Modal */}
              <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                  <Ionicons name="calendar" size={18} color="#38BDF8" style={{ marginRight: 8 }} />
                  <Text style={styles.headerTitle}>Select Period</Text>
                </View>

                <View style={styles.headerRightActions}>
                  {!isCurrentMonthActive && (
                    <TouchableOpacity
                      style={styles.currentMonthBtn}
                      onPress={handleSelectCurrentMonth}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="today-outline" size={13} color="#38BDF8" style={{ marginRight: 4 }} />
                      <Text style={styles.currentMonthBtnText}>This Month</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={onClose}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={20} color="#FAFAFA" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Navigasi Tahun */}
              <View style={styles.yearNavRow}>
                <TouchableOpacity style={styles.yearNavBtn} onPress={handlePrevYear} activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={18} color="#FAFAFA" />
                </TouchableOpacity>

                <Text style={styles.yearText}>{internalYear}</Text>

                <TouchableOpacity style={styles.yearNavBtn} onPress={handleNextYear} activeOpacity={0.7}>
                  <Ionicons name="chevron-forward" size={18} color="#FAFAFA" />
                </TouchableOpacity>
              </View>

              {/* Grid 12 Bulan */}
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    backgroundColor: '#18181B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
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
    borderBottomColor: '#27272A',
    marginBottom: 16,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '800',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentMonthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  currentMonthBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#09090B',
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  yearNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  yearText: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthCell: {
    width: '31.3%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#09090B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  monthCellSelected: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  monthCellToday: {
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  monthCellText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '700',
  },
  monthCellTextSelected: {
    color: '#09090B',
    fontWeight: '900',
  },
  monthCellTextToday: {
    color: '#38BDF8',
    fontWeight: '800',
  },
});