import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Href, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { formatDateKey, isHabitActiveForDate, isHabitCompletedForDate } from '../constants/habits';
import { TAB_BAR_HEIGHT } from '../constants/tabBar';
import { COLORS } from '../constants/theme';
import { homeStyles as styles } from '../styles/homeStyles';
import BentoGrid from '../components/Home/BentoGrid';
import HomeSettingsModal from '../components/Home/HomeSettingsModal';
import { Habit } from '../types/habits';
import { NutritionLog, NutritionTarget, DEFAULT_NUTRITION_TARGET } from '../types/nutrition';

const USERNAME_KEY = '@wakemove_user_name';
const NUTRITION_LOGS_KEY = '@wakemove_nutrition_logs';
const NUTRITION_TARGETS_KEY = '@wakemove_nutrition_targets';

export default function HomeScreen() {
  const [userName, setUserName] = useState('User');
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const [todayExpenses, setTodayExpenses] = useState(0);
  const [habitCompletedCount, setHabitCompletedCount] = useState(0);
  const [habitTotalCount, setHabitTotalCount] = useState(0);
  const [todayHabits, setTodayHabits] = useState<Habit[]>([]);
  const [todayWorkoutCount, setTodayWorkoutCount] = useState(0);
  const [todayWorkoutTitle, setTodayWorkoutTitle] = useState('Rest Day');
  const [todayWorkoutSub, setTodayWorkoutSub] = useState('No workouts recorded');

  const [todayCaloriesConsumed, setTodayCaloriesConsumed] = useState(0);
  const [calorieTarget, setCalorieTarget] = useState(DEFAULT_NUTRITION_TARGET.calories);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const fetchDashboardData = async () => {
    try {
      const keys = [
        USERNAME_KEY,
        '@finance_tx',
        '@lenvry_habits',
        '@fitness_workouts',
        NUTRITION_LOGS_KEY,
        NUTRITION_TARGETS_KEY,
      ];
      const results = await AsyncStorage.multiGet(keys);
      const dataMap = Object.fromEntries(results);

      const storedName = dataMap[USERNAME_KEY];
      if (storedName) {
        setUserName(storedName);
      }

      const todayDateObj = new Date();
      const habitKey = formatDateKey(todayDateObj);
      const dateIsoKey = todayDateObj.toISOString().split('T')[0];

      // Finance
      const storedTx = dataMap['@finance_tx'];
      if (storedTx) {
        const txs: any[] = JSON.parse(storedTx);
        const exp = txs
          .filter((t) => {
            const d = new Date(t.date);
            return (
              d.getFullYear() === todayDateObj.getFullYear() &&
              d.getMonth() === todayDateObj.getMonth() &&
              d.getDate() === todayDateObj.getDate() &&
              t.type === 'expense'
            );
          })
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        setTodayExpenses(exp);
      } else {
        setTodayExpenses(0);
      }

      // Habits
      const storedHabits = dataMap['@lenvry_habits'];
      if (storedHabits) {
        const habits: Habit[] = JSON.parse(storedHabits);
        const currentDayHabits = habits.filter((h) => isHabitActiveForDate(h, todayDateObj));
        setTodayHabits(currentDayHabits);
        setHabitTotalCount(currentDayHabits.length);
        setHabitCompletedCount(
          currentDayHabits.filter((h) => isHabitCompletedForDate(h, habitKey)).length
        );
      } else {
        setTodayHabits([]);
        setHabitTotalCount(0);
        setHabitCompletedCount(0);
      }

      // Fitness
      const storedWorkouts = dataMap['@fitness_workouts'];
      if (storedWorkouts) {
        const workouts: any[] = JSON.parse(storedWorkouts);
        const todayW = workouts.filter((w) => w.date === dateIsoKey);
        setTodayWorkoutCount(todayW.length);
        if (todayW.length > 0) {
          setTodayWorkoutTitle(`${todayW.length} Exercises Done`);
          setTodayWorkoutSub(`${todayW[0].exercise} (${todayW[0].sets} Sets x ${todayW[0].reps})`);
        } else {
          setTodayWorkoutTitle('Rest Day');
          setTodayWorkoutSub('No workouts recorded');
        }
      } else {
        setTodayWorkoutCount(0);
        setTodayWorkoutTitle('Rest Day');
        setTodayWorkoutSub('No workouts recorded');
      }

      // Nutrition
      const storedLogs = dataMap[NUTRITION_LOGS_KEY];
      if (storedLogs) {
        const logs: NutritionLog[] = JSON.parse(storedLogs);
        const todayLogs = logs.filter((log) => log.date === dateIsoKey);
        const totalCals = todayLogs.reduce((sum, item) => sum + (item.calories || 0), 0);
        setTodayCaloriesConsumed(totalCals);
      } else {
        setTodayCaloriesConsumed(0);
      }

      const storedTargets = dataMap[NUTRITION_TARGETS_KEY];
      if (storedTargets) {
        const target: NutritionTarget = JSON.parse(storedTargets);
        if (target.calories) {
          setCalorieTarget(target.calories);
        }
      }
    } catch (e) {
      console.error('Failed to sync dashboard metrics:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const toggleHabitOnHome = async (id: string) => {
    try {
      const storedHabits = await AsyncStorage.getItem('@lenvry_habits');
      if (!storedHabits) return;
      const todayDateObj = new Date();
      const habitKey = formatDateKey(todayDateObj);
      const allHabits: Habit[] = JSON.parse(storedHabits);

      const updated = allHabits.map((h) => {
        if (h.id === id) {
          const isFreqOnce = !h.frequency || h.frequency === 'once';
          if (isFreqOnce) {
            const nextCompleted = !h.completed;
            const currentDates = Array.isArray(h.completedDates) ? h.completedDates : [];
            const nextDates = nextCompleted
              ? Array.from(new Set([...currentDates, habitKey]))
              : currentDates.filter((d) => d !== habitKey);
            return {
              ...h,
              completed: nextCompleted,
              completedDates: nextDates,
            };
          } else {
            const dates = Array.isArray(h.completedDates) ? h.completedDates : [];
            const exists = dates.includes(habitKey);
            const nextDates = exists
              ? dates.filter((d) => d !== habitKey)
              : [...dates, habitKey];
            return {
              ...h,
              completed: nextDates.includes(habitKey),
              completedDates: nextDates,
            };
          }
        }
        return h;
      });

      await AsyncStorage.setItem('@lenvry_habits', JSON.stringify(updated));
      fetchDashboardData();
    } catch (e) {
      console.error('Failed to toggle habit from home', e);
    }
  };

  const todayDateObj = new Date();
  const habitKey = formatDateKey(todayDateObj);

  const formatExpenseShort = (amount: number) => {
    if (amount === 0) return 'Rp 0';
    if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `Rp ${Math.round(amount / 1_000)}k`;
    return `Rp ${amount}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgCanvas }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgCanvas} translucent={true} />

      {/* User Profile Header */}
      <View style={styles.headerRow}>
        <View style={styles.userProfile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.greetingText} numberOfLines={1}>Hello, {userName}</Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.dateText}>{today}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => setIsSettingsVisible(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="settings-outline" size={19} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: TAB_BAR_HEIGHT + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2x2 Pillar Overview */}
        <BentoGrid
          habitCompletedCount={habitCompletedCount}
          habitTotalCount={habitTotalCount}
          todayWorkoutTitle={todayWorkoutTitle}
          todayWorkoutSub={todayWorkoutSub}
          todayWorkoutCount={todayWorkoutCount}
          todayExpenses={todayExpenses}
          todayCaloriesConsumed={todayCaloriesConsumed}
          calorieTarget={calorieTarget}
        />

        {/* Today's Habits Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitleText}>{"TODAY'S Activities"}</Text>
          <TouchableOpacity
            onPress={() => router.push('/habits' as Href)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.sectionActionText}>View All ({habitTotalCount})</Text>
          </TouchableOpacity>
        </View>

        {todayHabits.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyCard}
            onPress={() => router.push('/habits' as Href)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done-circle-outline" size={26} color={COLORS.textMuted} style={{ marginBottom: 6 }} />
            <Text style={styles.emptyCardTitle}>No Activities scheduled for today</Text>
            <Text style={styles.emptyCardSub}>Tap here to open Activities</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.habitsPreviewCard}>
            {todayHabits.slice(0, 4).map((habit, idx) => {
              const isDone = isHabitCompletedForDate(habit, habitKey);
              const isLast = idx === Math.min(todayHabits.length, 4) - 1;
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[styles.habitItemRow, !isLast && styles.habitItemBorder]}
                  onPress={() => toggleHabitOnHome(habit.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={isDone ? COLORS.success : COLORS.textMuted}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.habitItemTitle, isDone && styles.habitItemTitleDone]}
                      numberOfLines={1}
                    >
                      {habit.title}
                    </Text>
                    <Text style={styles.habitItemMeta}>
                      {habit.category}
                      {habit.timeSlot && habit.timeSlot !== 'Anytime' ? ` • ${habit.timeSlot}` : ''}
                    </Text>
                  </View>
                  {habit.priority === 'high' && (
                    <View style={styles.highPriorityDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Daily Summary Strip */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="pulse" size={14} color={COLORS.accentHover} />
            <Text style={styles.summaryTitle}>DAILY METRICS SUMMARY</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemValue}>
                {habitCompletedCount}/{habitTotalCount}
              </Text>
              <Text style={styles.summaryItemLabel}>Activities</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemValue}>{todayWorkoutCount}</Text>
              <Text style={styles.summaryItemLabel}>Workouts</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemValue}>
                {todayCaloriesConsumed > 0 ? `${todayCaloriesConsumed}` : '0'}
              </Text>
              <Text style={styles.summaryItemLabel}>Calories</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemValue}>
                {formatExpenseShort(todayExpenses)}
              </Text>
              <Text style={styles.summaryItemLabel}>Expenses</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Settings Modal Hosted Full on Home */}
      <HomeSettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        currentUserName={userName}
        onUserNameUpdated={(newName) => setUserName(newName)}
        onDataResetOrRestored={fetchDashboardData}
      />
    </SafeAreaView>
  );
}