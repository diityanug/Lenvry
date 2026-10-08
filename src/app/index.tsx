import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  AppState,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Href, useFocusEffect } from 'expo-router';
import { readManyStored, updateStored } from '../storage';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import {
  formatDateKey,
  isHabitActiveForDate,
  isHabitCompletedForDate,
  HABIT_DEFAULT_CATEGORY_CONFIG,
} from '../constants/habits';
import { TAB_BAR_HEIGHT } from '../constants/tabBar';
import { COLORS } from '../constants/theme';
import { homeStyles as styles } from '../styles/homeStyles';
import DailyOverviewCard from '../components/Home/DailyOverviewCard';
import HomeSettingsModal from '../components/Home/HomeSettingsModal';
import StickyNotesSection from '../components/Home/StickyNotesSection';
import StickyNoteModal from '../components/Home/StickyNoteModal';
import { Habit } from '../types/habits';
import { DEFAULT_NUTRITION_TARGET } from '../types/nutrition';
import { StickyNote } from '../types/notes';

function getGreeting(hour = new Date().getHours()) {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const [userName, setUserName] = useState('User');
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isStickyModalVisible, setIsStickyModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<StickyNote | null>(null);

  const [todayExpenses, setTodayExpenses] = useState(0);
  const [habitCompletedCount, setHabitCompletedCount] = useState(0);
  const [habitTotalCount, setHabitTotalCount] = useState(0);
  const [todayHabits, setTodayHabits] = useState<Habit[]>([]);
  const [todayWorkoutCount, setTodayWorkoutCount] = useState(0);

  const [todayCaloriesConsumed, setTodayCaloriesConsumed] = useState(0);
  const [calorieTarget, setCalorieTarget] = useState(DEFAULT_NUTRITION_TARGET.calories);

  const [notes, setNotes] = useState<StickyNote[]>([]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const greeting = getGreeting();

  const fetchDashboardData = async () => {
    try {
      const data = await readManyStored([
        'userName',
        'financeTransactions',
        'habits',
        'fitnessWorkouts',
        'nutritionLogs',
        'nutritionTargets',
        'generalNotes',
      ]);

      if (data.userName) {
        setUserName(data.userName);
      }

      const todayDateObj = new Date();
      const habitKey = formatDateKey(todayDateObj);
      const dateIsoKey = todayDateObj.toISOString().split('T')[0];

      // Finance
      setTodayExpenses(
        (data.financeTransactions ?? [])
          .filter((t) => {
            const d = new Date(t.date);
            return (
              d.getFullYear() === todayDateObj.getFullYear() &&
              d.getMonth() === todayDateObj.getMonth() &&
              d.getDate() === todayDateObj.getDate() &&
              t.type === 'expense'
            );
          })
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      );

      // Habits
      const currentDayHabits = (data.habits ?? []).filter((h) =>
        isHabitActiveForDate(h, todayDateObj)
      );
      setTodayHabits(currentDayHabits);
      setHabitTotalCount(currentDayHabits.length);
      setHabitCompletedCount(
        currentDayHabits.filter((h) => isHabitCompletedForDate(h, habitKey)).length
      );

      // Fitness
      setTodayWorkoutCount((data.fitnessWorkouts ?? []).filter((w) => w.date === dateIsoKey).length);

      // Nutrition
      const todayLogs = (data.nutritionLogs ?? []).filter((log) => log.date === dateIsoKey);
      setTodayCaloriesConsumed(todayLogs.reduce((sum, item) => sum + (item.calories || 0), 0));

      if (data.nutritionTargets?.calories) {
        setCalorieTarget(data.nutritionTargets.calories);
      }

      // General Sticky Notes & Plans
      setNotes(data.generalNotes ?? []);
    } catch (e) {
      console.error('Failed to sync dashboard metrics:', e);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchDashboardData();
      }
    });

    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
    const msToMidnight = Math.max(1000, midnight.getTime() - now.getTime());

    const timer = setTimeout(() => {
      fetchDashboardData();
    }, msToMidnight);

    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const handleOpenCreateNote = () => {
    setSelectedNote(null);
    setIsStickyModalVisible(true);
  };

  const handleSelectNote = (note: StickyNote) => {
    setSelectedNote(note);
    setIsStickyModalVisible(true);
  };

  const handleSaveStickyNote = async (savedNote: StickyNote) => {
    try {
      const updated = await updateStored('generalNotes', (current) =>
        current.some((n) => n.id === savedNote.id)
          ? current.map((n) => (n.id === savedNote.id ? savedNote : n))
          : [savedNote, ...current]
      );
      setNotes(updated);
    } catch (e) {
      console.error('Failed to save sticky note:', e);
    }
  };

  const handleDeleteStickyNote = async (id: string) => {
    try {
      const updated = await updateStored('generalNotes', (current) =>
        current.filter((n) => n.id !== id)
      );
      setNotes(updated);
    } catch (e) {
      console.error('Failed to delete sticky note:', e);
    }
  };

  const toggleHabitOnHome = async (id: string) => {
    try {
      const habitKey = formatDateKey(new Date());

      await updateStored('habits', (current) =>
        current.map((h) => {
          if (h.id !== id) return h;

          const isFreqOnce = !h.frequency || h.frequency === 'once';
          const dates = h.completedDates ?? [];

          if (isFreqOnce) {
            const nextCompleted = !h.completed;
            const nextDates = nextCompleted
              ? Array.from(new Set([...dates, habitKey]))
              : dates.filter((d) => d !== habitKey);
            return {
              ...h,
              completed: nextCompleted,
              completedDates: nextDates,
            };
          }

          const exists = dates.includes(habitKey);
          const nextDates = exists ? dates.filter((d) => d !== habitKey) : [...dates, habitKey];
          return {
            ...h,
            completed: nextDates.includes(habitKey),
            completedDates: nextDates,
          };
        })
      );

      fetchDashboardData();
    } catch (e) {
      console.error('Failed to toggle habit from home', e);
    }
  };

  const todayDateObj = new Date();
  const habitKey = formatDateKey(todayDateObj);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgCanvas }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgCanvas} translucent={true} />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="ambientGlow" cx="50%" cy="0%" r="75%">
              <Stop offset="0%" stopColor={COLORS.accent} stopOpacity={0.12} />
              <Stop offset="50%" stopColor={COLORS.accent} stopOpacity={0.04} />
              <Stop offset="100%" stopColor={COLORS.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambientGlow)" />
        </Svg>
      </View>

      {/* User Profile Header */}
      <View style={styles.headerRow}>
        <View style={styles.userProfile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginRight: 10 }}>
            <View style={styles.dateRow}>
              <Text style={styles.greetingSubtext}>{greeting}</Text>
              <Text style={styles.bulletDot}>•</Text>
              <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.dateText}>{today}</Text>
            </View>
            <Text
              style={styles.userNameHeading}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.75}
            >
              {userName}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => setIsSettingsVisible(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="settings-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: TAB_BAR_HEIGHT + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Overview */}
        <DailyOverviewCard
          habitCompletedCount={habitCompletedCount}
          habitTotalCount={habitTotalCount}
          todayWorkoutCount={todayWorkoutCount}
          todayExpenses={todayExpenses}
          todayCaloriesConsumed={todayCaloriesConsumed}
          calorieTarget={calorieTarget}
        />

        {/* Pinned Sticky Notes */}
        <StickyNotesSection
          notes={notes}
          onSelectNote={handleSelectNote}
          onCreateNote={handleOpenCreateNote}
        />

        {/* Today's Activities Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitleText}>{"TODAY'S ACTIVITIES"}</Text>
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
            <View style={styles.emptyCardIconWrap}>
              <Ionicons name="sparkles-outline" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.emptyCardTitle}>No activities scheduled for today</Text>
            <Text style={styles.emptyCardSub}>Tap here to manage your habits & daily tasks</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.habitsPreviewCard}>
            {todayHabits.slice(0, 3).map((habit, idx) => {
              const isDone = isHabitCompletedForDate(habit, habitKey);
              const isLast = idx === Math.min(todayHabits.length, 3) - 1;
              const catCfg =
                HABIT_DEFAULT_CATEGORY_CONFIG[habit.category] || {
                  icon: 'pricetag-outline',
                  label: habit.category,
                  color: COLORS.textSecondary,
                  bg: 'rgba(148, 163, 184, 0.12)',
                };
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[styles.habitItemRow, !isLast && styles.habitItemBorder]}
                  onPress={() => toggleHabitOnHome(habit.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.habitIconChip,
                      { backgroundColor: catCfg.bg, borderColor: catCfg.color + '40' },
                    ]}
                  >
                    <Ionicons name={catCfg.icon as any} size={17} color={catCfg.color} />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text
                      style={[styles.habitItemTitle, isDone && styles.habitItemTitleDone]}
                      numberOfLines={1}
                    >
                      {habit.title}
                    </Text>
                    <Text style={styles.habitItemMeta} numberOfLines={1}>
                      <Text style={{ color: catCfg.color, fontWeight: '700' }}>
                        {habit.category}
                      </Text>
                      {habit.timeSlot && habit.timeSlot !== 'Anytime' ? ` • ${habit.timeSlot}` : ''}
                    </Text>
                  </View>
                  {habit.priority === 'high' && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityBadgeText}>HIGH</Text>
                    </View>
                  )}
                  <Ionicons
                    name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={isDone ? COLORS.success : COLORS.textMuted}
                    style={{ marginLeft: 12 }}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Settings Modal */}
      <HomeSettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        currentUserName={userName}
        onUserNameUpdated={(newName) => setUserName(newName)}
        onDataResetOrRestored={fetchDashboardData}
      />

      {/* Pinned Sticky Note Detail & Editor Modal */}
      <StickyNoteModal
        visible={isStickyModalVisible}
        note={selectedNote}
        onClose={() => setIsStickyModalVisible(false)}
        onSave={handleSaveStickyNote}
        onDelete={handleDeleteStickyNote}
      />
    </SafeAreaView>
  );
}
