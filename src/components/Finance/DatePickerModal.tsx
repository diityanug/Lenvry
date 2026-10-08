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
import { MONTHS as MONTH_NAMES, DAYS_SHORT as DAYS_OF_WEEK } from '../../constants/date';

const ACCENT = '#38BDF8';

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

const DatePickerModalContent = ({
  selectedDate,
  onClose,
  onSelectDate,
}: Omit<DatePickerModalProps, 'visible'>) => {
  const [viewDate, setViewDate] = useState<Date>(() => new Date(selectedDate || new Date()));

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const today = new Date();

  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  // Number of days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }
  while (daysArray.length < 42) {
    daysArray.push(null);
  }

  const isDaySelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    );
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const original = selectedDate ? new Date(selectedDate) : new Date();
    const newDate = new Date(
      currentYear,
      currentMonth,
      day,
      original.getHours(),
      original.getMinutes(),
      original.getSeconds()
    );
    onSelectDate(newDate);
    onClose();
  };

  const handleQuickSelectToday = () => {
    const now = new Date();
    onSelectDate(now);
    onClose();
  };

  const handleQuickSelectYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    onSelectDate(yesterday);
    onClose();
  };

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.container}>
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <View style={styles.iconBox}>
                  <Ionicons name="calendar" size={18} color={ACCENT} />
                </View>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    Select Date
                  </Text>
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    Choose transaction date
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Quick Preset Buttons */}
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={styles.presetBtnToday}
                  onPress={handleQuickSelectToday}
                  activeOpacity={0.7}
                >
                  <Ionicons name="today-outline" size={14} color={ACCENT} style={styles.presetIcon} />
                  <Text style={styles.presetBtnTextToday} numberOfLines={1}>
                    Today
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={handleQuickSelectYesterday}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} style={styles.presetIcon} />
                  <Text style={styles.presetBtnText} numberOfLines={1}>
                    Yesterday
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Month & Year Navigator */}
              <View style={styles.navRow}>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={handlePrevMonth}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>

                <View style={styles.monthYearCenter}>
                  <Text style={styles.monthYearText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={handleNextMonth}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Day of Week Headers — even 7-column rail */}
              <View style={styles.weekDaysRow}>
                {DAYS_OF_WEEK.map((d, index) => (
                  <View key={`wd-${index}`} style={styles.weekDayCell}>
                    <Text
                      style={[styles.weekDayText, index === 0 && styles.weekDayTextSunday]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Days Grid — six fixed 7-column rows so cells never cramp or collide */}
              <View style={styles.daysGrid}>
                {[0, 1, 2, 3, 4, 5].map((rowIdx) => (
                  <View key={`day-row-${rowIdx}`} style={styles.dayRow}>
                    {daysArray.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                      const idx = rowIdx * 7 + colIdx;

                      if (day === null) {
                        return <View key={`empty-${idx}`} style={styles.cellWrapper} />;
                      }

                      const selected = isDaySelected(day);
                      const todayMatch = isToday(day);

                      return (
                        <View key={`day-${day}`} style={styles.cellWrapper}>
                          <TouchableOpacity
                            style={[
                              styles.dayBox,
                              todayMatch && !selected && styles.dayBoxToday,
                              selected && styles.dayBoxSelected,
                            ]}
                            onPress={() => handleSelectDay(day)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.dayText,
                                todayMatch && !selected && styles.dayTextToday,
                                selected && styles.dayTextSelected,
                              ]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.8}
                            >
                              {day}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>

              {/* Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={styles.legendSelectedDot} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    Selected
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={styles.legendTodayRing} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    Today
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

export const DatePickerModal = ({ visible, ...props }: DatePickerModalProps) => {
  if (!visible) return null;
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={props.onClose}>
      <DatePickerModalContent {...props} />
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
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
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
    marginBottom: 18,
    gap: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    flexShrink: 0,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
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
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  presetBtnToday: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  presetIcon: {
    marginRight: 5,
    flexShrink: 0,
  },
  presetBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  presetBtnTextToday: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
    minWidth: 0,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    minHeight: 52,
    gap: 8,
  },
  navBtn: {
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
  monthYearCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    minWidth: 0,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  weekDayTextSunday: {
    color: '#FB7185',
  },
  daysGrid: {
    width: '100%',
    marginBottom: 8,
    gap: 4,
  },
  dayRow: {
    flexDirection: 'row',
  },
  cellWrapper: {
    flex: 1,
    minWidth: 0,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBox: {
    width: 40,
    height: 40,
    minWidth: 40,
    minHeight: 40,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBoxToday: {
    borderWidth: 1.5,
    borderColor: ACCENT,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  dayBoxSelected: {
    backgroundColor: ACCENT,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  dayText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  dayTextToday: {
    color: ACCENT,
    fontWeight: '800',
  },
  dayTextSelected: {
    color: '#08090C',
    fontWeight: '900',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSelectedDot: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.full,
    backgroundColor: ACCENT,
  },
  legendTodayRing: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
