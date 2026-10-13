import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, formatMoney, MONTHS } from '../../types/finance';
import { COLORS, RADIUS } from '../../constants/theme';
import { SharedCalendarModal } from '../Shared/CalendarModal';

interface CashflowTrendCardProps {
  allTransactions?: Transaction[];
  monthlyTransactions: Transaction[];
  currency: 'IDR' | 'USD';
  selectedMonth: Date;
  onSelectMonth?: (date: Date) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

type TrendPeriod = '7d' | 'weeks';

interface BarData {
  id: string;
  label: string;
  subLabel: string;
  expense: number;
  income: number;
  count: number;
  dateKey?: string;
  fullDateStr: string;
  isToday?: boolean;
}

const CHART_BAR_HEIGHT = 160;

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const CashflowTrendCard = ({
  allTransactions,
  monthlyTransactions,
  currency,
  selectedMonth,
  onSelectMonth,
  onPrevMonth,
  onNextMonth,
}: CashflowTrendCardProps) => {
  const [period, setPeriod] = useState<TrendPeriod>('7d');
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState<number>(0); // 0 = latest 7 days
  const [calendarVisible, setCalendarVisible] = useState<boolean>(false);

  // Full transaction source for accurate historical dates
  const txSource = useMemo(() => {
    return allTransactions && allTransactions.length > 0 ? allTransactions : monthlyTransactions;
  }, [allTransactions, monthlyTransactions]);

  const now = useMemo(() => new Date(), []);
  const isCurrentMonth = useMemo(() => {
    return (
      selectedMonth.getFullYear() === now.getFullYear() &&
      selectedMonth.getMonth() === now.getMonth()
    );
  }, [selectedMonth, now]);

  // Base end date: Today for current month, or end of month for past months
  const baseEndDate = useMemo(() => {
    if (isCurrentMonth) {
      return new Date(now);
    }
    return new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
  }, [isCurrentMonth, selectedMonth, now]);

  const targetEndDate = useMemo(() => {
    const d = new Date(baseEndDate);
    d.setDate(baseEndDate.getDate() - dayOffset);
    return d;
  }, [baseEndDate, dayOffset]);

  const isAtToday = useMemo(() => {
    const todayStr = now.toISOString().slice(0, 10);
    const targetStr = targetEndDate.toISOString().slice(0, 10);
    return targetStr >= todayStr;
  }, [now, targetEndDate]);

  // Calendar modal selection handler
  const handleCalendarDateSelect = (date: Date) => {
    setCalendarVisible(false);
    setSelectedBarId(null);

    if (period === '7d') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const picked = new Date(date);
      picked.setHours(0, 0, 0, 0);
      const capped = picked > today ? today : picked;
      const diffMs = today.getTime() - capped.getTime();
      const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      setDayOffset(diffDays);

      if (onSelectMonth) {
        onSelectMonth(new Date(capped.getFullYear(), capped.getMonth(), 1));
      }
    } else {
      if (onSelectMonth) {
        onSelectMonth(date);
      }
    }
  };

  // 1. Process 7 Days Data
  const dailyData = useMemo<BarData[]>(() => {
    const bars: BarData[] = [];
    const todayStr = now.toISOString().slice(0, 10);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(targetEndDate);
      d.setDate(targetEndDate.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = DAY_NAMES_SHORT[d.getDay()];
      const dayNum = d.getDate().toString().padStart(2, '0');
      const fullYear = d.getFullYear();

      const dayExpenses = txSource
        .filter((t) => t.type === 'expense' && t.date.startsWith(dateStr))
        .reduce((sum, t) => sum + t.amount, 0);

      const dayIncomes = txSource
        .filter((t) => t.type === 'income' && t.date.startsWith(dateStr))
        .reduce((sum, t) => sum + t.amount, 0);

      const dayTxCount = txSource.filter((t) => t.date.startsWith(dateStr)).length;
      const isTodayItem = dateStr === todayStr;

      bars.push({
        id: `day_${dateStr}`,
        label: dayLabel,
        subLabel: dayNum,
        expense: dayExpenses,
        income: dayIncomes,
        count: dayTxCount,
        dateKey: dateStr,
        fullDateStr: `${DAY_NAMES_FULL[d.getDay()]}, ${dayNum} ${MONTHS_FULL[d.getMonth()]} ${fullYear}`,
        isToday: isTodayItem,
      });
    }

    return bars;
  }, [targetEndDate, txSource, now]);

  // 2. Process Monthly 4-5 Weeks Data
  const weeklyData = useMemo<BarData[]>(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weekBuckets = [
      { id: 'w1', label: 'Week 1', subLabel: '1–7', start: 1, end: 7 },
      { id: 'w2', label: 'Week 2', subLabel: '8–14', start: 8, end: 14 },
      { id: 'w3', label: 'Week 3', subLabel: '15–21', start: 15, end: 21 },
      { id: 'w4', label: 'Week 4', subLabel: '22–28', start: 22, end: 28 },
    ];

    if (daysInMonth > 28) {
      weekBuckets.push({
        id: 'w5',
        label: 'Week 5',
        subLabel: `29–${daysInMonth}`,
        start: 29,
        end: daysInMonth,
      });
    }

    const monthTxs = txSource.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const bars = weekBuckets.map((bucket) => {
      let expense = 0;
      let income = 0;
      let count = 0;

      monthTxs.forEach((t) => {
        const d = new Date(t.date);
        const day = d.getDate();
        if (day >= bucket.start && day <= bucket.end) {
          if (t.type === 'expense') expense += t.amount;
          if (t.type === 'income') income += t.amount;
          count += 1;
        }
      });

      return {
        id: bucket.id,
        label: bucket.label,
        subLabel: bucket.subLabel,
        expense,
        income,
        count,
        fullDateStr: `${bucket.label} (${bucket.start}–${bucket.end} ${MONTHS_FULL[month]} ${year})`,
      };
    });

    return bars;
  }, [txSource, selectedMonth]);

  const activeBars = period === '7d' ? dailyData : weeklyData;

  const activeDetail = useMemo(() => {
    if (selectedBarId) {
      const found = activeBars.find((b) => b.id === selectedBarId);
      if (found) return found;
    }
    const withTx = [...activeBars].reverse().find((b) => b.income > 0 || b.expense > 0);
    return withTx || activeBars[activeBars.length - 1] || null;
  }, [selectedBarId, activeBars]);

  const totalExpense = useMemo(() => {
    return activeBars.reduce((sum, b) => sum + b.expense, 0);
  }, [activeBars]);

  const totalIncome = useMemo(() => {
    return activeBars.reduce((sum, b) => sum + b.income, 0);
  }, [activeBars]);

  const netCashflow = totalIncome - totalExpense;
  const isNetPositive = netCashflow >= 0;

  const maxScaleValue = useMemo(() => {
    const highestVal = Math.max(
      ...activeBars.map((b) => Math.max(b.income, b.expense)),
      0
    );
    return highestVal > 0 ? highestVal : 1;
  }, [activeBars]);

  // Date range formatted label for 7 days
  const dateRangeLabel = useMemo(() => {
    if (dailyData.length < 7) return '';
    const start = new Date(targetEndDate);
    start.setDate(targetEndDate.getDate() - 6);
    const end = new Date(targetEndDate);

    const startDay = start.getDate().toString().padStart(2, '0');
    const startMonth = MONTHS[start.getMonth()];
    const startYear = start.getFullYear();

    const endDay = end.getDate().toString().padStart(2, '0');
    const endMonth = MONTHS[end.getMonth()];
    const endYear = end.getFullYear();

    if (startYear === endYear) {
      if (start.getMonth() === end.getMonth()) {
        return `${startDay} – ${endDay} ${startMonth} ${startYear}`;
      }
      return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`;
    }
    return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`;
  }, [targetEndDate, dailyData]);

  return (
    <View style={styles.card}>
      {/* 1. Header: Spacious Icon, Title, and Description (NO buttons squeezing it!) */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.iconWrap}>
            <Ionicons name="stats-chart-outline" size={20} color={COLORS.finance} />
          </View>
          <View style={styles.headerTitleCol}>
            <Text style={styles.title}>Cashflow Comparison</Text>
            <Text style={styles.subtitle}>
              Compare your income and spending cashflows • {currency}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Dedicated Period Switcher Bar (Separated from Header, Full-Width) */}
      <View style={styles.periodSwitchBar}>
        <TouchableOpacity
          style={[styles.periodTab, period === '7d' && styles.periodTabActive]}
          onPress={() => {
            setPeriod('7d');
            setSelectedBarId(null);
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={period === '7d' ? COLORS.finance : '#64748B'}
          />
          <Text style={[styles.periodTabText, period === '7d' && styles.periodTabTextActive]}>
            7 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodTab, period === 'weeks' && styles.periodTabActive]}
          onPress={() => {
            setPeriod('weeks');
            setSelectedBarId(null);
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="stats-chart-outline"
            size={14}
            color={period === 'weeks' ? COLORS.finance : '#64748B'}
          />
          <Text style={[styles.periodTabText, period === 'weeks' && styles.periodTabTextActive]}>
            Weekly
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Dedicated Full-Width Calendar Trigger Card */}
      <TouchableOpacity
        style={styles.calendarFullCard}
        onPress={() => setCalendarVisible(true)}
        activeOpacity={0.75}
      >
        <View style={styles.calendarCardLeft}>
          <View style={styles.calendarCardIconBox}>
            <Ionicons name="calendar" size={17} color={COLORS.finance} />
          </View>
          <View style={styles.calendarCardTextCol}>
            <Text style={styles.calendarCardLabel}>
              {period === '7d' ? 'ACTIVE DATE WINDOW' : 'ACTIVE MONTH'}
            </Text>
            <Text style={styles.calendarCardValue} numberOfLines={1}>
              {period === '7d'
                ? dateRangeLabel
                : `${MONTHS_FULL[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#64748B" />
      </TouchableOpacity>

      {/* 4. Earlier / Later Navigation (BELOW the calendar, spacious 50/50 split) */}
      <View style={styles.stepperNavRow}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => {
            if (period === '7d') {
              setDayOffset((prev) => prev + 7);
            } else {
              onPrevMonth?.();
            }
            setSelectedBarId(null);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={16} color={COLORS.finance} />
          <Text style={styles.navBtnText}>
            {period === '7d' ? 'Earlier' : 'Prev Month'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navBtn,
            (period === '7d' ? isAtToday : isCurrentMonth) && styles.navBtnDisabled,
          ]}
          onPress={() => {
            if (period === '7d') {
              setDayOffset((prev) => Math.max(0, prev - 7));
            } else {
              onNextMonth?.();
            }
            setSelectedBarId(null);
          }}
          disabled={period === '7d' ? isAtToday : isCurrentMonth}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.navBtnText,
              (period === '7d' ? isAtToday : isCurrentMonth) && { color: '#64748B' },
            ]}
          >
            {period === '7d' ? 'Later' : 'Next Month'}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={(period === '7d' ? isAtToday : isCurrentMonth) ? '#64748B' : COLORS.finance}
          />
        </TouchableOpacity>
      </View>

      {/* 4. Legend: Income (Green) vs Expense (Red) */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#34D399' }]} />
          <Text style={styles.legendText}>Income (Inflow)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FB7185' }]} />
          <Text style={styles.legendText}>Expense (Outflow)</Text>
        </View>
      </View>

      {/* 5. Inspector Card: Vertical clean rows (Zero truncation, 100% full width per line) */}
      {activeDetail && (
        <View style={styles.inspectorCard}>
          <View style={styles.inspectorHeader}>
            <View style={styles.inspectorDateWrap}>
              <Ionicons name="calendar-outline" size={15} color={COLORS.finance} />
              <Text style={styles.inspectorDateText}>{activeDetail.fullDateStr}</Text>
            </View>
          </View>

          <View style={styles.inspectorList}>
            {/* Inflow Row */}
            <View style={styles.inspectorRow}>
              <View style={styles.inspectorRowLeft}>
                <Ionicons name="arrow-down-circle" size={15} color="#34D399" />
                <Text style={styles.inspectorRowLabel}>Income (Inflow)</Text>
              </View>
              <Text style={[styles.inspectorRowValue, { color: '#34D399' }]}>
                +{formatMoney(activeDetail.income, currency)}
              </Text>
            </View>

            {/* Outflow Row */}
            <View style={styles.inspectorRow}>
              <View style={styles.inspectorRowLeft}>
                <Ionicons name="arrow-up-circle" size={15} color="#FB7185" />
                <Text style={styles.inspectorRowLabel}>Expense (Outflow)</Text>
              </View>
              <Text style={[styles.inspectorRowValue, { color: '#FB7185' }]}>
                -{formatMoney(activeDetail.expense, currency)}
              </Text>
            </View>

            <View style={styles.inspectorDivider} />

            {/* Net Surplus / Deficit Row */}
            <View style={styles.inspectorRow}>
              <View style={styles.inspectorRowLeft}>
                <Ionicons
                  name={
                    activeDetail.income >= activeDetail.expense
                      ? 'trending-up'
                      : 'trending-down'
                  }
                  size={15}
                  color={activeDetail.income >= activeDetail.expense ? '#34D399' : '#FB7185'}
                />
                <Text style={styles.inspectorRowLabel}>Daily Net</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={[
                    styles.inspectorRowValue,
                    {
                      color:
                        activeDetail.income >= activeDetail.expense ? '#34D399' : '#FB7185',
                    },
                  ]}
                >
                  {activeDetail.income >= activeDetail.expense ? '+' : '-'}
                  {formatMoney(Math.abs(activeDetail.income - activeDetail.expense), currency)}
                </Text>
                <Text
                  style={[
                    styles.inspectorSurplusBadge,
                    {
                      color:
                        activeDetail.income >= activeDetail.expense ? '#34D399' : '#FB7185',
                    },
                  ]}
                >
                  {activeDetail.income >= activeDetail.expense ? 'Surplus' : 'Deficit'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 6. Chart Visualization: Dual Side-by-Side Bars */}
      <View style={styles.chartWrapper}>
        <View style={styles.chartGridLines} pointerEvents="none">
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
        </View>

        <View style={styles.barsContainer}>
          {activeBars.map((bar) => {
            const isSelected = activeDetail?.id === bar.id;
            const incRatio = bar.income / maxScaleValue;
            const expRatio = bar.expense / maxScaleValue;

            const incHeight = Math.max(
              bar.income > 0 ? 8 : 4,
              Math.round(incRatio * CHART_BAR_HEIGHT)
            );
            const expHeight = Math.max(
              bar.expense > 0 ? 8 : 4,
              Math.round(expRatio * CHART_BAR_HEIGHT)
            );

            return (
              <TouchableOpacity
                key={bar.id}
                style={[styles.barCol, isSelected && styles.barColSelected]}
                activeOpacity={0.75}
                onPress={() => setSelectedBarId(bar.id)}
              >
                <View style={styles.dualBarsBox}>
                  {/* Green Income Bar */}
                  <View style={styles.singleBarTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: incHeight,
                          backgroundColor:
                            bar.income > 0 ? '#34D399' : 'rgba(255, 255, 255, 0.04)',
                        },
                      ]}
                    />
                  </View>

                  {/* Red Expense Bar */}
                  <View style={styles.singleBarTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: expHeight,
                          backgroundColor:
                            bar.expense > 0 ? '#FB7185' : 'rgba(255, 255, 255, 0.04)',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Day / Week Labels Below Bars */}
                <View style={styles.labelCol}>
                  <Text
                    style={[styles.barLabel, isSelected && styles.barLabelSelected]}
                    numberOfLines={1}
                  >
                    {bar.label}
                  </Text>
                  <Text
                    style={[
                      styles.barSubLabel,
                      isSelected && styles.barSubLabelSelected,
                      bar.isToday && styles.barTodayLabel,
                    ]}
                    numberOfLines={1}
                  >
                    {bar.subLabel}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 7. Period Total Summary: Spacious Inflow & Outflow Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={[styles.summaryDot, { backgroundColor: '#34D399' }]} />
            <Text style={styles.summaryLabel}>TOTAL INFLOW</Text>
          </View>
          <Text
            style={[styles.summaryAmount, { color: '#34D399' }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            +{formatMoney(totalIncome, currency)}
          </Text>
          <Text style={styles.summarySub}>
            {activeBars.filter((b) => b.income > 0).length} active periods
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={[styles.summaryDot, { backgroundColor: '#FB7185' }]} />
            <Text style={styles.summaryLabel}>TOTAL OUTFLOW</Text>
          </View>
          <Text
            style={[styles.summaryAmount, { color: '#FB7185' }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            -{formatMoney(totalExpense, currency)}
          </Text>
          <Text style={styles.summarySub}>
            {activeBars.filter((b) => b.expense > 0).length} active periods
          </Text>
        </View>
      </View>

      {/* 8. Net Cashflow Status Indicator */}
      <View
        style={[
          styles.netStatusBox,
          {
            backgroundColor: isNetPositive
              ? 'rgba(52, 211, 153, 0.08)'
              : 'rgba(251, 113, 133, 0.08)',
            borderColor: isNetPositive
              ? 'rgba(52, 211, 153, 0.22)'
              : 'rgba(251, 113, 133, 0.22)',
          },
        ]}
      >
        <View style={styles.netStatusLeft}>
          <Ionicons
            name={isNetPositive ? 'shield-checkmark-outline' : 'warning-outline'}
            size={18}
            color={isNetPositive ? '#34D399' : '#FB7185'}
          />
          <View style={styles.netStatusTextCol}>
            <Text style={styles.netStatusTitle}>
              {isNetPositive ? 'Net Cashflow Surplus' : 'Net Cashflow Deficit'}
            </Text>
            
          </View>
        </View>
        <Text
          style={[styles.netStatusAmount, { color: isNetPositive ? '#34D399' : '#FB7185' }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {isNetPositive ? '+' : '-'}
          {formatMoney(Math.abs(netCashflow), currency)}
        </Text>
      </View>

      {/* 9. Shared Calendar Modal Trigger */}
      <SharedCalendarModal
        visible={calendarVisible}
        selectedDate={period === '7d' ? targetEndDate : selectedMonth}
        mode={period === '7d' ? 'day' : 'month'}
        themeColor={COLORS.finance}
        title={period === '7d' ? 'Select Date Window' : 'Select Month'}
        subtitle={
          period === '7d'
            ? 'Pick a date to anchor your 7-day cashflow window'
            : 'Choose a month to inspect weekly cashflow'
        }
        onClose={() => setCalendarVisible(false)}
        onSelectDate={handleCalendarDateSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0B1521',
    borderRadius: RADIUS.xxl,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 16,
  },

  // 1. Header (Spacious, Roomy, Never Cramped)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    flexShrink: 0,
  },
  headerTitleCol: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
    fontWeight: '600',
    lineHeight: 16,
  },

  // 2. Dedicated Period Switcher Bar (Full Width Segmented Control)
  periodSwitchBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  periodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  periodTabActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  periodTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  periodTabTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },

  // 3. Calendar Full Card (Dedicated, Full-Width)
  calendarFullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    gap: 12,
  },
  calendarCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  calendarCardIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    flexShrink: 0,
  },
  calendarCardTextCol: {
    flex: 1,
    minWidth: 0,
  },
  calendarCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  calendarCardValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
    letterSpacing: -0.2,
  },

  // 4. Stepper Nav Row (Separate, below calendar, 50/50 split)
  stepperNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  navBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    opacity: 0.35,
  },
  navBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.finance,
  },

  // 4. Legend
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // 5. Inspector Card
  inspectorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  inspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectorDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  inspectorDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  inspectorList: {
    gap: 7,
  },
  inspectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectorRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inspectorRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  inspectorRowValue: {
    fontSize: 13.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  inspectorDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 2,
  },
  inspectorSurplusBadge: {
    fontSize: 11,
    fontWeight: '600',
  },

  // 6. Chart Layout
  chartWrapper: {
    height: CHART_BAR_HEIGHT + 58,
    position: 'relative',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  chartGridLines: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: CHART_BAR_HEIGHT,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_BAR_HEIGHT + 48,
    paddingHorizontal: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    paddingHorizontal: 2,
  },
  barColSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderRadius: RADIUS.md,
  },
  dualBarsBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
    height: CHART_BAR_HEIGHT,
  },
  singleBarTrack: {
    flex: 1,
    maxWidth: 14,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderRadius: RADIUS.xs,
    minHeight: 4,
  },
  labelCol: {
    alignItems: 'center',
    marginTop: 8,
    gap: 2,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  barLabelSelected: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  barSubLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    fontVariant: ['tabular-nums'],
  },
  barSubLabelSelected: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  barTodayLabel: {
    color: '#34D399',
    fontWeight: '800',
  },

  // 7. Summary Cards Grid
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  summarySub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  // 8. Net Status Box
  netStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 12,
  },
  netStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  netStatusTextCol: {
    flex: 1,
    minWidth: 0,
  },
  netStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  netStatusDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  netStatusAmount: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
});
