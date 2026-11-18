import React, { useState, useCallback } from 'react';
import {
  Text,
  View,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  FoodItem,
  MealType,
  NutritionLog,
  NutritionTarget,
} from '../types/nutrition';
import { formatDateKey } from '../constants/date';
import { MacroSummaryCard } from '../components/Nutrition/MacroSummaryCard';
import { WaterTrackerCard } from '../components/Nutrition/WaterTrackerCard';
import { MealSectionList } from '../components/Nutrition/MealSectionList';
import { FoodSearchModal } from '../components/Nutrition/FoodSearchModal';
import { CustomFoodModal } from '../components/Nutrition/CustomFoodModal';
import { TargetModal } from '../components/Nutrition/TargetModal';
import { SharedCalendarModal } from '../components/Shared/CalendarModal';
import { EditPortionModal } from '../components/Nutrition/EditPortionModal';
import { saveCustomFoodToDb } from '../services/nutritionDatabaseService';
import AppAlertModal, { AppAlertConfig } from '../components/Common/AppAlertModal';
import { HeaderActionButton } from '../components/Common/AppButtons';
import { TAB_BAR_HEIGHT } from '../constants/tabBar';
import { COLORS } from '../constants/theme';
import { ErrorBoundary } from '../components/Shared/ErrorBoundary';
import { nutritionStyles as styles } from '../styles/nutritionStyles';
import { useNutritionStore } from '../stores';
import { useActiveDate } from '../hooks/useDayRollover';
import { generateId } from '../utils/id';

export default function NutritionScreen() {
  const logs = useNutritionStore((s) => s.logs);
  const loadNutrition = useNutritionStore((s) => s.loadNutrition);
  const addLog = useNutritionStore((s) => s.addLog);
  const updateLog = useNutritionStore((s) => s.updateLog);
  const deleteLog = useNutritionStore((s) => s.deleteLog);
  const setLogs = useNutritionStore((s) => s.setLogs);
  const customFoods = useNutritionStore((s) => s.customFoods);
  const setCustomFoods = useNutritionStore((s) => s.setCustomFoods);
  const target = useNutritionStore((s) => s.target);
  const setTarget = useNutritionStore((s) => s.setTarget);
  const waterLogs = useNutritionStore((s) => s.waterLogs);
  const setWaterLogs = useNutritionStore((s) => s.setWaterLogs);

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

  const loadNutritionData = useCallback(() => {
    loadNutrition();
  }, [loadNutrition]);

  const { selectedDate, setSelectedDate, todayDate } = useActiveDate(loadNutritionData);

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

  const currentDateKey = formatDateKey(selectedDate);
  const todayKey = formatDateKey(todayDate);
  const isToday = currentDateKey === todayKey;

  const currentDayLogs = logs.filter((l) => l.date === currentDateKey);

  const totalCalories = currentDayLogs.reduce((sum, l) => sum + l.calories, 0);
  const totalProtein = currentDayLogs.reduce((sum, l) => sum + l.protein, 0);
  const totalCarbs = currentDayLogs.reduce((sum, l) => sum + l.carbs, 0);
  const totalFat = currentDayLogs.reduce((sum, l) => sum + l.fat, 0);

  const currentWaterItem = waterLogs.find((w) => w.date === currentDateKey);
  const currentWaterMl = currentWaterItem?.amountMl || 0;
  const currentWaterTarget = currentWaterItem?.targetMl || 2000;

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

  const handleAddWater = async (amount: number) => {
    const newAmount = Math.max(0, currentWaterMl + amount);
    await setWaterLogs([
      ...waterLogs.filter((w) => w.date !== currentDateKey),
      {
        date: currentDateKey,
        amountMl: newAmount,
        targetMl: currentWaterTarget,
      },
    ]);
  };

  const handleResetWater = async () => {
    await setWaterLogs(waterLogs.filter((w) => w.date !== currentDateKey));
  };

  const handleLogFood = async (newLogData: Omit<NutritionLog, 'id' | 'createdAt'>) => {
    const newLog: NutritionLog = {
      ...newLogData,
      id: generateId('log'),
      createdAt: new Date().toISOString(),
    };

    await addLog(newLog);
  };

  const handleUpdateLog = async (updatedLog: NutritionLog) => {
    await updateLog(updatedLog);
    setEditingLog(null);
  };

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

    const copiedEntries: NutritionLog[] = yesterdayMealLogs.map((l) => ({
      ...l,
      id: generateId('log'),
      date: currentDateKey,
      createdAt: new Date().toISOString(),
    }));

    await setLogs([...copiedEntries, ...logs]);
    showAlert('success', 'Meals Copied', `Copied ${copiedEntries.length} ${mealType} items from yesterday.`);
  };

  const handleDeleteLog = (id: string) => {
    showAlert(
      'danger',
      'Delete Food Entry?',
      'Are you sure you want to remove this logged food entry?',
      'DELETE',
      'CANCEL',
      async () => {
        await deleteLog(id);
      }
    );
  };

  const handleSaveCustomFood = async (newFood: FoodItem) => {
    try {
      await saveCustomFoodToDb(newFood);
    } catch (e) {
      console.warn('Failed to save custom food to SQLite:', e);
    }
    await setCustomFoods([newFood, ...customFoods]);
    showAlert('success', 'Food Saved', `${newFood.name} has been added to your local library.`);
  };

  const handleSaveTarget = async (newTarget: NutritionTarget) => {
    await setTarget(newTarget);
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
    <ErrorBoundary fallbackTitle="Nutrition Encountered an Issue">
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgCanvas }]} edges={['top']}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.title}>Meal</Text>
            <Text style={styles.slogan}>Track your daily meals</Text>
          </View>

          <View style={styles.headerRightActions}>
            <HeaderActionButton
              label="Goals"
              icon="pie-chart-outline"
              variant="secondary"
              onPress={() => setTargetModalVisible(true)}
              accessibilityLabel="Nutrition Goals"
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 36 }}
        >
          <View style={styles.dateNavRow}>
            <TouchableOpacity
              style={styles.dateNavBtn}
              onPress={handlePrevDay}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Previous Day"
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
              accessibilityRole="button"
              accessibilityLabel="Next Day"
            >
              <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <MacroSummaryCard
            totalCalories={totalCalories}
            totalProtein={totalProtein}
            totalCarbs={totalCarbs}
            totalFat={totalFat}
            target={target}
          />

          <WaterTrackerCard
            amountMl={currentWaterMl}
            targetMl={currentWaterTarget}
            onAddWater={handleAddWater}
            onResetWater={handleResetWater}
          />

          <MealSectionList
            logs={currentDayLogs}
            onOpenAddForMeal={openAddForMeal}
            onDeleteLog={handleDeleteLog}
            onEditLog={setEditingLog}
            onCopyYesterdayMeal={handleCopyYesterdayMeal}
          />
        </ScrollView>

        <FoodSearchModal
          key={`food_search_${activeMealType}_${searchModalVisible}`}
          visible={searchModalVisible}
          selectedDateStr={currentDateKey}
          defaultMealType={activeMealType}
          customFoods={customFoods}
          onClose={() => setSearchModalVisible(false)}
          onLogFood={handleLogFood}
          onOpenCreateCustom={() => {
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

        <SharedCalendarModal
          key={`calendar_${selectedDate.getTime()}_${calendarModalVisible}`}
          visible={calendarModalVisible}
          selectedDate={selectedDate}
          themeColor={COLORS.nutrition}
          title="Select Log Date"
          onClose={() => setCalendarModalVisible(false)}
          onSelectDate={(newDate: Date) => {
            setSelectedDate(newDate);
            setCalendarModalVisible(false);
          }}
        />

        <AppAlertModal config={alertConfig} onClose={closeAlert} />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
