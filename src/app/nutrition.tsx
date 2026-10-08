import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Text,
  View,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import {
  FoodItem,
  MealType,
  NutritionLog,
  NutritionTarget,
  WaterLog,
  DEFAULT_NUTRITION_TARGET,
} from '../types/nutrition';
import { MacroSummaryCard } from '../components/Nutrition/MacroSummaryCard';
import { WaterTrackerCard } from '../components/Nutrition/WaterTrackerCard';
import { MealSectionList } from '../components/Nutrition/MealSectionList';
import { FoodSearchModal } from '../components/Nutrition/FoodSearchModal';
import { CustomFoodModal } from '../components/Nutrition/CustomFoodModal';
import { TargetModal } from '../components/Nutrition/TargetModal';
import { CalendarModal } from '../components/Nutrition/CalendarModal';
import { EditPortionModal } from '../components/Nutrition/EditPortionModal';
import AppAlertModal, { AppAlertConfig } from '../components/Common/AppAlertModal';
import { TAB_BAR_HEIGHT } from '../constants/tabBar';
import { COLORS } from '../constants/theme';
import { nutritionStyles as styles } from '../styles/nutritionStyles';

const NUTRITION_LOGS_KEY = '@wakemove_nutrition_logs';
const NUTRITION_TARGETS_KEY = '@wakemove_nutrition_targets';
const CUSTOM_FOODS_KEY = '@wakemove_custom_foods';
const WATER_LOGS_KEY = '@wakemove_water_logs';

const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function NutritionScreen() {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [target, setTarget] = useState<NutritionTarget>(DEFAULT_NUTRITION_TARGET);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const lastTodayKeyRef = useRef(formatDateKey(new Date()));
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [targetModalVisible, setTargetModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState<NutritionLog | null>(null);

  const [activeMealType, setActiveMealType] = useState<MealType>('breakfast');

  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const syncDateToTodayIfOnToday = useCallback(() => {
    const now = new Date();
    const newTodayKey = formatDateKey(now);
    const oldTodayKey = lastTodayKeyRef.current;
    lastTodayKeyRef.current = newTodayKey;

    setSelectedDate((prevDate) => {
      const prevKey = formatDateKey(prevDate);
      if (prevKey === oldTodayKey) {
        return now;
      }
      return prevDate;
    });
  }, []);

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

  const loadNutritionData = useCallback(async () => {
    try {
      const keys = [
        NUTRITION_LOGS_KEY,
        CUSTOM_FOODS_KEY,
        NUTRITION_TARGETS_KEY,
        WATER_LOGS_KEY,
      ];
      const results = await AsyncStorage.multiGet(keys);
      const dataMap = Object.fromEntries(results);

      const storedLogs = dataMap[NUTRITION_LOGS_KEY];
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      }

      const storedCustom = dataMap[CUSTOM_FOODS_KEY];
      if (storedCustom) {
        setCustomFoods(JSON.parse(storedCustom));
      }

      const storedTargets = dataMap[NUTRITION_TARGETS_KEY];
      if (storedTargets) {
        setTarget(JSON.parse(storedTargets));
      }

      const storedWater = dataMap[WATER_LOGS_KEY];
      if (storedWater) {
        setWaterLogs(JSON.parse(storedWater));
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        syncDateToTodayIfOnToday();
        loadNutritionData();
      }
    });

    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
    const msToMidnight = Math.max(1000, midnight.getTime() - now.getTime());

    const timer = setTimeout(() => {
      syncDateToTodayIfOnToday();
      loadNutritionData();
    }, msToMidnight);

    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [syncDateToTodayIfOnToday, loadNutritionData]);

  useFocusEffect(
    useCallback(() => {
      syncDateToTodayIfOnToday();
      loadNutritionData();
    }, [syncDateToTodayIfOnToday, loadNutritionData])
  );

  const currentDateKey = formatDateKey(selectedDate);
  const todayKey = formatDateKey(new Date());
  const isToday = currentDateKey === todayKey;

  const currentDayLogs = logs.filter((l) => l.date === currentDateKey);

  // Compute daily totals
  const totalCalories = currentDayLogs.reduce((sum, l) => sum + l.calories, 0);
  const totalProtein = currentDayLogs.reduce((sum, l) => sum + l.protein, 0);
  const totalCarbs = currentDayLogs.reduce((sum, l) => sum + l.carbs, 0);
  const totalFat = currentDayLogs.reduce((sum, l) => sum + l.fat, 0);

  // Water intake for current date
  const currentWaterItem = waterLogs.find((w) => w.date === currentDateKey);
  const currentWaterMl = currentWaterItem?.amountMl || 0;
  const currentWaterTarget = currentWaterItem?.targetMl || 2000;

  // Date Navigation handlers
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Water handlers
  const handleAddWater = async (amount: number) => {
    const newAmount = currentWaterMl + amount;
    const updatedWaterLogs = waterLogs.filter((w) => w.date !== currentDateKey);
    updatedWaterLogs.push({
      date: currentDateKey,
      amountMl: newAmount,
      targetMl: currentWaterTarget,
    });

    setWaterLogs(updatedWaterLogs);
    await AsyncStorage.setItem(WATER_LOGS_KEY, JSON.stringify(updatedWaterLogs));
  };

  const handleResetWater = async () => {
    const updatedWaterLogs = waterLogs.filter((w) => w.date !== currentDateKey);
    setWaterLogs(updatedWaterLogs);
    await AsyncStorage.setItem(WATER_LOGS_KEY, JSON.stringify(updatedWaterLogs));
  };

  // Log food handler
  const handleLogFood = async (newLogData: Omit<NutritionLog, 'id' | 'createdAt'>) => {
    const newLog: NutritionLog = {
      ...newLogData,
      id: `log_${new Date().getTime()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newLog, ...logs];
    setLogs(updated);
    await AsyncStorage.setItem(NUTRITION_LOGS_KEY, JSON.stringify(updated));
  };

  // Update portion handler
  const handleUpdateLog = async (updatedLog: NutritionLog) => {
    const updated = logs.map((l) => (l.id === updatedLog.id ? updatedLog : l));
    setLogs(updated);
    await AsyncStorage.setItem(NUTRITION_LOGS_KEY, JSON.stringify(updated));
    setEditingLog(null);
  };

  // Copy yesterday's meals handler
  const handleCopyYesterdayMeal = async (mealType: MealType) => {
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);

    const yesterdayMealLogs = logs.filter(
      (l) => l.date === yesterdayKey && l.mealType === mealType
    );

    if (yesterdayMealLogs.length === 0) {
      showAlert('warning', 'No Entries Found', `No ${mealType} entries logged for yesterday.`);
      return;
    }

    const copiedEntries: NutritionLog[] = yesterdayMealLogs.map((l, idx) => ({
      ...l,
      id: `log_${new Date().getTime()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      date: currentDateKey,
      createdAt: new Date().toISOString(),
    }));

    const updated = [...copiedEntries, ...logs];
    setLogs(updated);
    await AsyncStorage.setItem(NUTRITION_LOGS_KEY, JSON.stringify(updated));
    showAlert('success', 'Meals Copied', `Copied ${copiedEntries.length} ${mealType} items from yesterday.`);
  };

  // Delete log handler
  const handleDeleteLog = (id: string) => {
    showAlert(
      'danger',
      'Delete Food Entry?',
      'Are you sure you want to remove this logged food entry?',
      'DELETE',
      'CANCEL',
      async () => {
        const updated = logs.filter((l) => l.id !== id);
        setLogs(updated);
        await AsyncStorage.setItem(NUTRITION_LOGS_KEY, JSON.stringify(updated));
      }
    );
  };

  // Custom food handler
  const handleSaveCustomFood = async (newFood: FoodItem) => {
    const updated = [newFood, ...customFoods];
    setCustomFoods(updated);
    await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(updated));
    showAlert('success', 'Food Saved', `${newFood.name} has been added to your local library.`);
  };

  // Target save handler
  const handleSaveTarget = async (newTarget: NutritionTarget) => {
    setTarget(newTarget);
    await AsyncStorage.setItem(NUTRITION_TARGETS_KEY, JSON.stringify(newTarget));
    showAlert('success', 'Goals Updated', 'Your daily calorie budget and macronutrient targets have been saved.');
  };

  const openAddForMeal = (mealType: MealType) => {
    setActiveMealType(mealType);
    setSearchModalVisible(true);
  };

  const displayDateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgCanvas }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgCanvas} translucent={true} />

      {/* Screen Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.title}>Meal</Text>
          <Text style={styles.slogan}>Track your daily meals</Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.targetBtn}
            onPress={() => setTargetModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="pie-chart-outline" size={15} color={COLORS.textSecondary} />
            <Text style={styles.targetBtnText}>Goals</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 36 }}
      >
        {/* Date Navigator Bar */}
        <View style={styles.dateNavRow}>
          <TouchableOpacity
            style={styles.dateNavBtn}
            onPress={handlePrevDay}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateCenterTouch}
            onPress={() => setCalendarModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={15} color={COLORS.nutrition} />
            <Text style={styles.dateNavText}>{displayDateStr}</Text>
            {isToday && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateNavBtn}
            onPress={handleNextDay}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Hero Macro Summary Card */}
        <MacroSummaryCard
          totalCalories={totalCalories}
          totalProtein={totalProtein}
          totalCarbs={totalCarbs}
          totalFat={totalFat}
          target={target}
        />

        {/* Water Intake Tracker Card */}
        <WaterTrackerCard
          amountMl={currentWaterMl}
          targetMl={currentWaterTarget}
          onAddWater={handleAddWater}
          onResetWater={handleResetWater}
        />

        {/* 4 Meal Category Sections */}
        <MealSectionList
          logs={currentDayLogs}
          onOpenAddForMeal={openAddForMeal}
          onDeleteLog={handleDeleteLog}
          onEditLog={setEditingLog}
          onCopyYesterdayMeal={handleCopyYesterdayMeal}
        />
      </ScrollView>

      {/* MODALS */}
      <FoodSearchModal
        key={`food_search_${activeMealType}_${searchModalVisible}`}
        visible={searchModalVisible}
        selectedDateStr={currentDateKey}
        defaultMealType={activeMealType}
        customFoods={customFoods}
        onClose={() => setSearchModalVisible(false)}
        onLogFood={handleLogFood}
        onOpenCreateCustom={() => {
          setSearchModalVisible(false);
          setCustomModalVisible(true);
        }}
      />

      <EditPortionModal
        visible={!!editingLog}
        logItem={editingLog}
        onClose={() => setEditingLog(null)}
        onSave={handleUpdateLog}
      />

      <CustomFoodModal
        visible={customModalVisible}
        onClose={() => setCustomModalVisible(false)}
        onSaveCustomFood={handleSaveCustomFood}
      />

      <TargetModal
        key={`target_modal_${target.calories}_${targetModalVisible}`}
        visible={targetModalVisible}
        target={target}
        onClose={() => setTargetModalVisible(false)}
        onSaveTarget={handleSaveTarget}
      />

      <CalendarModal
        key={`calendar_${selectedDate.getTime()}_${calendarModalVisible}`}
        visible={calendarModalVisible}
        selectedDate={selectedDate}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDate={(newDate) => {
          setSelectedDate(newDate);
          setCalendarModalVisible(false);
        }}
      />

      <AppAlertModal config={alertConfig} onClose={closeAlert} />
    </SafeAreaView>
  );
}
