import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import { DAYS_SHORT, MONTHS } from '../../constants/date';

export interface SharedCalendarModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  themeColor?: string;
  title?: string;
  accentBg?: string;
}

function CalendarModalContent({
  selectedDate,
  onClose,
  onSelectDate,
  themeColor = COLORS.accent,
  title = 'Select Date',
  accentBg,
}: Omit<SharedCalendarModalProps, 'visible'>) {
  const [viewDate, setViewDate] = useState<Date>(() => new Date(selectedDate));

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
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year;

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
                <Ionicons name="calendar" size={17} color={themeColor} style={{ marginRight: 8 }} />
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

              <Text style={styles.monthText}>{MONTHS[month]} {year}</Text>

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
                <Text key={idx} style={styles.weekDayText}>{day.slice(0, 2)}</Text>
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
                      selected && [styles.selectedCell, { backgroundColor: themeColor, borderColor: themeColor }],
                      !selected && currentDay && [styles.todayCell, { borderColor: themeColor, backgroundColor: activeBg }],
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
                <Ionicons name="today-outline" size={15} color={themeColor} style={{ marginRight: 6 }} />
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
  themeColor,
  title,
  accentBg,
}: SharedCalendarModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <CalendarModalContent
        selectedDate={selectedDate}
        onClose={onClose}
        onSelectDate={onSelectDate}
        themeColor={themeColor}
        title={title}
        accentBg={accentBg}
      />
    </Modal>
  );
}

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
    maxWidth: 340,
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
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
});
