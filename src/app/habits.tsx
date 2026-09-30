import React, { useState, useCallback, useEffect } from 'react';
import {
  Keyboard,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import AppAlertModal, { AppAlertConfig } from '../components/Common/AppAlertModal';
import AddCategoryModal from '../components/Habits/AddCategoryModal';
import AddHabitModal from '../components/Habits/AddHabitModal';
import CalendarModal from '../components/Habits/CalendarModal';
import CategoryFilter from '../components/Habits/CategoryFilter';
import DateNavigator from '../components/Habits/DateNavigator';
import HabitCard from '../components/Habits/HabitCard';
import ProgressCard from '../components/Habits/ProgressCard';
import NotificationSoundModal from '../components/Habits/NotificationSoundModal';
import {
  initializeNotifications,
  scheduleHabitReminder,
  cancelHabitReminder,
} from '../services/habitNotificationService';
import {
  DEFAULT_CATEGORIES,
  formatDateKey,
  isHabitActiveForDate,
  isHabitCompletedForDate,
} from '../constants/habits';
import { TAB_BAR_HEIGHT } from '../constants/tabBar';
import { COLORS } from '../constants/theme';
import { habitStyles as styles } from '../styles/habitStyles';
import { FrequencyType, Habit, PriorityLevel, SubTask, TimeSlot } from '../types/habits';

export default function HabitTrackerScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [categoryInputVisible, setCategoryInputVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [soundSettingsVisible, setSoundSettingsVisible] = useState(false);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const todayDateKey = formatDateKey(new Date());
  const currentDateKey = formatDateKey(selectedDate);
  const isTodayActive = currentDateKey === todayDateKey;

  // Filter habits active for selectedDate
  const currentDayHabits = habits.filter((h) => isHabitActiveForDate(h, selectedDate));

  const filteredHabits =
    activeFilter === 'All'
      ? currentDayHabits
      : currentDayHabits.filter((h) => h.category === activeFilter);

  // Completed count for progress
  const completedCount = filteredHabits.filter((h) =>
    isHabitCompletedForDate(h, currentDateKey)
  ).length;

  const progressPercent =
    filteredHabits.length > 0 ? (completedCount / filteredHabits.length) * 100 : 0;

  const loadData = useCallback(async () => {
    try {
      const [storedHabits, storedCategories] = await AsyncStorage.multiGet([
        '@lenvry_habits',
        '@lenvry_habit_categories',
      ]).then((pairs) => pairs.map((p) => p[1]));

      if (storedHabits !== null) {
        const parsed: Habit[] = JSON.parse(storedHabits).map((h: any) => ({
          ...h,
          date: h.date || formatDateKey(new Date()),
          completed: typeof h.completed === 'boolean' ? h.completed : false,
          frequency: h.frequency || 'once',
          priority: h.priority || 'medium',
          timeSlot: h.timeSlot || 'Anytime',
          completedDates: Array.isArray(h.completedDates) ? h.completedDates : [],
          subtasks: Array.isArray(h.subtasks) ? h.subtasks : [],
        }));
        setHabits(parsed);
      }
      if (storedCategories !== null) {
        const parsedCategories = JSON.parse(storedCategories);
        setCategories(parsedCategories);
      }
    } catch (e) {
      console.error('Failed to load habit data', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const showAlert = (
    type: AppAlertConfig['type'],
    title: string,
    message: string,
    confirmText = 'OK',
    cancelText?: string,
    onConfirm?: () => void
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };

  const handleOpenAdd = () => {
    setEditingHabit(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (habitToEdit: Habit) => {
    setEditingHabit(habitToEdit);
    setModalVisible(true);
  };

  const saveHabit = async (habitData: {
    id?: string;
    title: string;
    category: string;
    description?: string;
    priority?: PriorityLevel;
    timeSlot?: TimeSlot;
    reminderTime?: string;
    reminderSound?: string;
    frequency?: FrequencyType;
    repeatDays?: number[];
    subtasks?: SubTask[];
  }) => {
    if (!habitData.title.trim() || !habitData.category) {
      showAlert('warning', 'Missing Data', 'Habit name and category cannot be empty.');
      return;
    }

    let updatedHabits: Habit[];

    if (habitData.id) {
      // Edit existing habit
      const existing = habits.find((h) => h.id === habitData.id);
      let targetHabit: Habit = {
        ...existing!,
        title: habitData.title.trim(),
        category: habitData.category,
        description: habitData.description?.trim() || undefined,
        priority: habitData.priority || 'medium',
        timeSlot: habitData.timeSlot || 'Anytime',
        reminderTime: habitData.reminderTime || undefined,
        reminderSound: habitData.reminderSound,
        frequency: habitData.frequency || 'once',
        repeatDays: habitData.repeatDays,
        subtasks: habitData.subtasks || [],
      };

      if (targetHabit.reminderTime) {
        targetHabit.notificationId = await scheduleHabitReminder(targetHabit);
      } else if (existing?.notificationId) {
        await cancelHabitReminder(existing.notificationId);
        targetHabit.notificationId = undefined;
      }

      updatedHabits = habits.map((h) => (h.id === habitData.id ? targetHabit : h));
    } else {
      // Create new habit
      let newHabit: Habit = {
        id: new Date().getTime().toString(),
        title: habitData.title.trim(),
        category: habitData.category,
        completed: false,
        date: currentDateKey,
        description: habitData.description?.trim() || undefined,
        priority: habitData.priority || 'medium',
        timeSlot: habitData.timeSlot || 'Anytime',
        reminderTime: habitData.reminderTime || undefined,
        reminderSound: habitData.reminderSound,
        frequency: habitData.frequency || 'once',
        repeatDays: habitData.repeatDays,
        completedDates: [],
        subtasks: habitData.subtasks || [],
      };

      if (newHabit.reminderTime) {
        newHabit.notificationId = await scheduleHabitReminder(newHabit);
      }

      updatedHabits = [...habits, newHabit];
    }

    setHabits(updatedHabits);
    await AsyncStorage.setItem('@lenvry_habits', JSON.stringify(updatedHabits));

    Keyboard.dismiss();
    setModalVisible(false);
    setEditingHabit(null);
  };

  const toggleHabitForDate = async (id: string) => {
    const updatedHabits = habits.map((habit) => {
      if (habit.id === id) {
        const isFreqOnce = !habit.frequency || habit.frequency === 'once';

        if (isFreqOnce) {
          const nextCompleted = !habit.completed;
          const currentDates = Array.isArray(habit.completedDates) ? habit.completedDates : [];
          const nextDates = nextCompleted
            ? Array.from(new Set([...currentDates, currentDateKey]))
            : currentDates.filter((d) => d !== currentDateKey);

          return {
            ...habit,
            completed: nextCompleted,
            completedDates: nextDates,
          };
        } else {
          // Recurring habit: toggle date in completedDates
          const dates = Array.isArray(habit.completedDates) ? habit.completedDates : [];
          const exists = dates.includes(currentDateKey);
          const nextDates = exists
            ? dates.filter((d) => d !== currentDateKey)
            : [...dates, currentDateKey];

          return {
            ...habit,
            completed: nextDates.includes(todayDateKey),
            completedDates: nextDates,
          };
        }
      }
      return habit;
    });

    setHabits(updatedHabits);
    await AsyncStorage.setItem('@lenvry_habits', JSON.stringify(updatedHabits));
  };

  const toggleSubtask = async (habitId: string, subtaskId: string) => {
    const updatedHabits = habits.map((habit) => {
      if (habit.id === habitId && habit.subtasks) {
        const updatedSubtasks = habit.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...habit, subtasks: updatedSubtasks };
      }
      return habit;
    });

    setHabits(updatedHabits);
    await AsyncStorage.setItem('@lenvry_habits', JSON.stringify(updatedHabits));
  };

  const deleteHabit = (id: string) => {
    showAlert(
      'danger',
      'Delete Habit / Task?',
      'Are you sure you want to remove this habit?',
      'DELETE',
      'CANCEL',
      async () => {
        const target = habits.find((h) => h.id === id);
        if (target?.notificationId) {
          await cancelHabitReminder(target.notificationId);
        }
        const updatedHabits = habits.filter((h) => h.id !== id);
        setHabits(updatedHabits);
        await AsyncStorage.setItem('@lenvry_habits', JSON.stringify(updatedHabits));
      }
    );
  };

  const addCategory = async (newCategoryName: string) => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      showAlert(
        'warning',
        'Category Exists',
        'This category already exists. Choose a different name.'
      );
      return;
    }
    const updatedCategories = [...categories, trimmed];
    setCategories(updatedCategories);
    await AsyncStorage.setItem('@lenvry_habit_categories', JSON.stringify(updatedCategories));
    setCategoryInputVisible(false);
  };

  const deleteCategory = (catToDelete: string) => {
    showAlert(
      'danger',
      'Delete Category?',
      `Remove category "${catToDelete}"?`,
      'DELETE',
      'CANCEL',
      async () => {
        const updatedCategories = categories.filter((c) => c !== catToDelete);
        setCategories(updatedCategories);
        if (activeFilter === catToDelete) setActiveFilter('All');
        await AsyncStorage.setItem(
          '@lenvry_habit_categories',
          JSON.stringify(updatedCategories)
        );
      }
    );
  };

  const getTotalCompletedCount = (habitTitle: string) => {
    return habits.filter((h) => {
      if (h.title.toLowerCase() !== habitTitle.toLowerCase()) return false;
      return isHabitCompletedForDate(h, currentDateKey);
    }).length;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgCanvas }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgCanvas} translucent={true} />

      {/* Header with Notification Settings and Add Button */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.headerTitleBold}>Daily Activities</Text>
          <Text style={styles.headerSubtitleLight}>Build Consistency, Shape Your Future</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: COLORS.bgCard,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => setSoundSettingsVisible(true)}
            activeOpacity={0.75}
            accessibilityLabel="Notification Sound Settings"
          >
            <Ionicons name="notifications-outline" size={17} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={handleOpenAdd}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#08090C" />
            <Text style={styles.headerAddBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 36 }}
      >
        {/* Date Navigator */}
        <DateNavigator
          selectedDate={selectedDate}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          onOpenCalendar={() => setCalendarModalVisible(true)}
        />

        {/* Shortcut Back to Today */}
        {!isTodayActive && (
          <TouchableOpacity
            style={styles.todayBanner}
            onPress={handleGoToToday}
            activeOpacity={0.8}
          >
            <Ionicons
              name="return-up-back"
              size={14}
              color={COLORS.success}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.todayBannerText}>Tap to jump back to Today</Text>
          </TouchableOpacity>
        )}

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
        />

        {/* Progress Card */}
        <ProgressCard
          completedCount={completedCount}
          totalCount={filteredHabits.length}
          progressPercent={progressPercent}
        />

        {/* Section List Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            DAILY TARGETS ({completedCount}/{filteredHabits.length})
          </Text>
          <Text style={styles.sectionHint}>Tap checkmark to complete</Text>
        </View>

        {/* Habit Grid */}
        {filteredHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={48} color={COLORS.borderLight} />
            <Text style={styles.emptyText}>No habits scheduled for this date.</Text>
            <Text style={styles.emptySubText}>Tap Add in the top right to start a habit.</Text>
          </View>
        ) : (
          <View style={styles.habitGridWrap}>
            {filteredHabits.map((item) => {
              const isCompleted = isHabitCompletedForDate(item, currentDateKey);
              return (
                <HabitCard
                  key={item.id}
                  item={item}
                  isCompleted={isCompleted}
                  totalCompletedCount={getTotalCompletedCount(item.title)}
                  onToggle={toggleHabitForDate}
                  onDelete={deleteHabit}
                  onEdit={handleOpenEdit}
                  onToggleSubtask={toggleSubtask}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Calendar Modal */}
      <CalendarModal
        visible={calendarModalVisible}
        selectedDate={selectedDate}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDate={(d) => {
          setSelectedDate(d);
          setCalendarModalVisible(false);
        }}
      />

      {/* Add / Edit Habit Modal */}
      <AddHabitModal
        visible={modalVisible}
        selectedDate={selectedDate}
        categories={categories}
        initialHabit={editingHabit}
        onSave={saveHabit}
        onClose={() => {
          setModalVisible(false);
          setEditingHabit(null);
        }}
        onOpenAddCategory={() => setCategoryInputVisible(true)}
        onDeleteCategory={deleteCategory}
      />

      {/* Add Category Modal */}
      <AddCategoryModal
        visible={categoryInputVisible}
        onSave={addCategory}
        onClose={() => setCategoryInputVisible(false)}
      />

      {/* Notification & Sound Settings Modal */}
      <NotificationSoundModal
        visible={soundSettingsVisible}
        selectedSoundId="chime"
        onSelectSound={() => {}}
        onClose={() => setSoundSettingsVisible(false)}
      />

      <AppAlertModal config={alertConfig} onClose={closeAlert} />
    </SafeAreaView>
  );
}