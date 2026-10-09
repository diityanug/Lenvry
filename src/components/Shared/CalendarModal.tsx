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
import { DAYS_SHORT, MONTHS, SHORT_MONTHS } from '../../constants/date';

export interface SharedCalendarModalProps {
  visible: boolean;
  selectedDate?: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  mode?: 'day' | 'month';
  themeColor?: string;
  title?: string;
  subtitle?: string;
  accentBg?: string;
}

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

function MonthPickerContent({
  selectedDate,
  onClose,
  onSelectDate,
  themeColor = COLORS.finance || '#38BDF8',
  title = 'Select Period',
  subtitle = 'Choose a month to review',
}: Omit<SharedCalendarModalProps, 'visible' | 'mode'>) {
  const activeDate = selectedDate || new Date();
  const [internalYear, setInternalYear] = useState<number>(() => activeDate.getFullYear());

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

  const isCurrentMonthActive =
    selectedMonthIndex === currentActualMonth && selectedYearVal === currentActualYear;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.container}>
            {/* Header Modal */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <View style={[styles.headerIconBox, { backgroundColor: `${themeColor}20` }]}>
                  <Ionicons name="calendar" size={17} color={themeColor} />
                </View>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.headerRightActions}>
                {!isCurrentMonthActive && (
                  <TouchableOpacity
                    style={[styles.currentMonthBtn, { borderColor: `${themeColor}40` }]}
                    onPress={handleSelectCurrentMonth}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="today-outline" size={13} color={themeColor} style={{ marginRight: 4 }} />
                    <Text style={[styles.currentMonthBtnText, { color: themeColor }]} numberOfLines={1}>
                      This Month
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Close Period Picker"
                >
                  <Ionicons name="close" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Year Navigation */}
              <View style={styles.monthNav}>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={handlePrevYear}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Previous Year"
                >
                  <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>

                <Text style={styles.monthText}>{internalYear}</Text>

                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={handleNextYear}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Next Year"
                >
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Month Grid */}
              <View style={styles.monthGrid}>
                {[0, 1, 2].map((rowIdx) => (
                  <View key={`month-row-${rowIdx}`} style={styles.monthRow}>
                    {SHORT_MONTHS.slice(rowIdx * 4, rowIdx * 4 + 4).map((mName, colIdx) => {
                      const idx = rowIdx * 4 + colIdx;
                      const isSelected =
                        selectedMonthIndex === idx && selectedYearVal === internalYear;
                      const isTodayMonth =
                        currentActualMonth === idx && currentActualYear === internalYear;
                      const cellTheme = MONTH_COLORS[idx % MONTH_COLORS.length];

                      return (
                        <TouchableOpacity
                          key={mName}
                          style={[
                            styles.monthCell,
                            isTodayMonth &&
                              !isSelected && [
                                styles.monthCellToday,
                                { borderColor: cellTheme, backgroundColor: `${cellTheme}15` },
                              ],
                            isSelected && { backgroundColor: themeColor || cellTheme, borderColor: themeColor || cellTheme },
                          ]}
                          onPress={() => handleSelectMonth(idx)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.monthCellText,
                              isTodayMonth && !isSelected && { color: cellTheme, fontWeight: '700' },
                              isSelected && styles.selectedDayText,
                            ]}
                            numberOfLines={1}
                          >
                            {mName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

function DayPickerContent({
  selectedDate = new Date(),
  onClose,
  onSelectDate,
  themeColor = COLORS.accent,
  title = 'Select Date',
  accentBg,
}: Omit<SharedCalendarModalProps, 'visible' | 'mode'>) {
  const activeDate = selectedDate || new Date();
  const [viewDate, setViewDate] = useState<Date>(() => new Date(activeDate));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
  for (let i = 1; i <= daysInMonth; i++) daysArray.push(i);
  while (daysArray.length < 42) daysArray.push(null);

  const isSelected = (day: number) =>
    activeDate.getDate() === day &&
    activeDate.getMonth() === month &&
    activeDate.getFullYear() === year;

  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  const handleSelectToday = () => {
    const now = new Date();
    setViewDate(now);
    onSelectDate(now);
    onClose();
  };

  const activeBg = accentBg || `${themeColor}25`;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.container}>
            {/* Header Modal */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <View style={[styles.headerIconBox, { backgroundColor: `${themeColor}20` }]}>
                  <Ionicons name="calendar" size={17} color={themeColor} />
                </View>
                <Text style={styles.headerTitle}>{title}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close Calendar"
              >
                <Ionicons name="close" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Navigation Bulan */}
            <View style={styles.monthNav}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setViewDate(new Date(year, month - 1, 1))}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Previous Month"
              >
                <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>

              <Text style={styles.monthText}>
                {MONTHS[month]} {year}
              </Text>

              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setViewDate(new Date(year, month + 1, 1))}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Next Month"
              >
                <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Header Hari */}
            <View style={styles.weekHeader}>
              {DAYS_SHORT.map((day: string, idx: number) => (
                <Text key={idx} style={styles.weekDayText}>
                  {day.slice(0, 2)}
                </Text>
              ))}
            </View>

            {/* Grid Tanggal */}
            <View style={styles.daysGrid}>
              {daysArray.map((day, idx) => {
                if (day === null) {
                  return <View key={idx} style={styles.dayCell} />;
                }

                const selected = isSelected(day);
                const currentDay = isToday(day);

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dayCell,
                      selected && [
                        styles.selectedCell,
                        { backgroundColor: themeColor, borderColor: themeColor },
                      ],
                      !selected &&
                        currentDay && [
                          styles.todayCell,
                          { borderColor: themeColor, backgroundColor: activeBg },
                        ],
                    ]}
                    onPress={() => {
                      onSelectDate(new Date(year, month, day));
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected && styles.selectedDayText,
                        !selected && currentDay && [styles.todayText, { color: themeColor }],
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer Aksi */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.todayBtn}
                onPress={handleSelectToday}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="today-outline"
                  size={15}
                  color={themeColor}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.todayBtnText, { color: themeColor }]}>Today</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

export function SharedCalendarModal({
  visible,
  selectedDate,
  onClose,
  onSelectDate,
  mode = 'day',
  themeColor,
  title,
  subtitle,
  accentBg,
}: SharedCalendarModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {mode === 'month' ? (
        <MonthPickerContent
          selectedDate={selectedDate}
          onClose={onClose}
          onSelectDate={onSelectDate}
          themeColor={themeColor}
          title={title}
          subtitle={subtitle}
          accentBg={accentBg}
        />
      ) : (
        <DayPickerContent
          selectedDate={selectedDate}
          onClose={onClose}
          onSelectDate={onSelectDate}
          themeColor={themeColor}
          title={title}
          accentBg={accentBg}
        />
      )}
    </Modal>
  );
}

export const CalendarModal = SharedCalendarModal;
export default SharedCalendarModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 9, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconBox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentMonthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
  },
  currentMonthBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekDayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 4,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCell: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  todayCell: {
    borderWidth: 1,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  selectedDayText: {
    color: '#08090C',
    fontWeight: '800',
  },
  todayText: {
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 4,
  },
  monthGrid: {
    gap: 8,
    paddingVertical: 4,
  },
  monthRow: {
    flexDirection: 'row',
    gap: 8,
  },
  monthCell: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  monthCellToday: {
    borderWidth: 1.5,
  },
  monthCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  monthCellTextSelected: {
    color: '#08090C',
    fontWeight: '800',
  },
  monthDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
});
