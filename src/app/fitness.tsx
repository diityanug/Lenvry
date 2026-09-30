import React, { useState, useCallback } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { Workout } from '../types/fitness';
import { TAB_BAR_HEIGHT } from '../constants/tabBar';
import { COLORS } from '../constants/theme';
import { RoutinePreset } from '../constants/fitness';
import DateStrip from '../components/Fitness/DateStrip';
import HeroMetrics from '../components/Fitness/HeroMetrics';
import CategoryFilter from '../components/Fitness/CategoryFilter';
import WorkoutCard from '../components/Fitness/WorkoutCard';
import CalendarModal from '../components/Fitness/CalendarModal';
import AddWorkoutModal from '../components/Fitness/AddWorkoutModal';
import WorkoutHistoryModal from '../components/Fitness/WorkoutHistoryModal';
import RoutinePresetsModal from '../components/Fitness/RoutinePresetsModal';
import AppAlertModal, { AppAlertConfig } from '../components/Common/AppAlertModal';
import { fitnessStyles as styles } from '../styles/fitnessStyles';

export default function FitnessScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [modalVisible, setModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [routineModalVisible, setRoutineModalVisible] = useState(false);
  const [prefillWorkout, setPrefillWorkout] = useState<Workout | null>(null);

  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const [activeFilter, setActiveFilter] = useState('All');

  const loadWorkouts = useCallback(async () => {
    try {
      const storedWorkouts = await AsyncStorage.getItem('@fitness_workouts');
      if (storedWorkouts !== null) {
        setWorkouts(JSON.parse(storedWorkouts));
      }
    } catch (e) {
      console.error('Failed to load fitness data:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
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

  const currentDateKey = selectedDate.toISOString().split('T')[0];
  const currentDayWorkouts = workouts.filter((w) => w.date === currentDateKey);
  const filteredWorkouts =
    activeFilter === 'All'
      ? currentDayWorkouts
      : currentDayWorkouts.filter((w) => w.category === activeFilter);

  const saveWorkout = async (data: {
    id?: string;
    exercise: string;
    category: string;
    sets: string;
    reps: string;
    weight: string;
  }) => {
    let updatedWorkouts: Workout[];

    if (data.id) {
      // Edit existing workout
      updatedWorkouts = workouts.map((w) =>
        w.id === data.id
          ? {
              ...w,
              exercise: data.exercise.trim(),
              category: data.category,
              sets: data.sets,
              reps: data.reps,
              weight: data.weight,
            }
          : w
      );
    } else {
      // Create new workout
      const newWorkout: Workout = {
        id: new Date().getTime().toString() + Math.random().toString().slice(2, 6),
        exercise: data.exercise.trim(),
        category: data.category,
        sets: data.sets,
        reps: data.reps,
        weight: data.weight,
        date: currentDateKey,
      };
      updatedWorkouts = [newWorkout, ...workouts];
    }

    try {
      await AsyncStorage.setItem('@fitness_workouts', JSON.stringify(updatedWorkouts));
      setWorkouts(updatedWorkouts);
      Keyboard.dismiss();
      setModalVisible(false);
      setPrefillWorkout(null);
    } catch (e) {
      console.error('Failed to save workout session:', e);
    }
  };

  const handleEditWorkout = (item: Workout) => {
    setPrefillWorkout(item);
    setModalVisible(true);
  };

  const handleCloneWorkout = (item: Workout) => {
    // Clone creates a new workout without ID
    setPrefillWorkout({
      ...item,
      id: '',
    });
    setModalVisible(true);
  };

  const handleSelectRoutine = async (routine: RoutinePreset) => {
    const now = new Date().getTime();
    const newItems: Workout[] = routine.exercises.map((ex, index) => ({
      id: (now + index).toString(),
      exercise: ex.exercise,
      category: ex.category,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight,
      date: currentDateKey,
    }));

    const updatedWorkouts = [...newItems, ...workouts];
    try {
      await AsyncStorage.setItem('@fitness_workouts', JSON.stringify(updatedWorkouts));
      setWorkouts(updatedWorkouts);
      setRoutineModalVisible(false);
      showAlert('success', 'Routine Loaded', `Added ${routine.exercises.length} exercises from ${routine.name}.`);
    } catch (e) {
      console.error('Failed to add routine:', e);
    }
  };

  const deleteWorkout = (id: string) => {
    showAlert(
      'danger',
      'Delete Record?',
      'This exercise log will be permanently removed.',
      'DELETE',
      'CANCEL',
      async () => {
        const updatedWorkouts = workouts.filter((w) => w.id !== id);
        setWorkouts(updatedWorkouts);
        await AsyncStorage.setItem('@fitness_workouts', JSON.stringify(updatedWorkouts));
      }
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgCanvas }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgCanvas} translucent={true} />

      {/* HEADER WITH HISTORY & ADD BUTTONS */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.title}>Fitness</Text>
          <Text style={styles.slogan}>Track your workout sessions</Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={[styles.headerAddBtn, { backgroundColor: COLORS.bgCardSub, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 }]}
            onPress={() => setRoutineModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={14} color={COLORS.warning} />
            <Text style={[styles.headerAddBtnText, { color: COLORS.textPrimary }]}>Presets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => {
              setPrefillWorkout(null);
              setModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#08090C" />
            <Text style={styles.headerAddBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredWorkouts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 36 }}
        ListHeaderComponent={
          <>
            <DateStrip
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onOpenCalendar={() => setCalendarModalVisible(true)}
            />

            <HeroMetrics selectedDate={selectedDate} workouts={currentDayWorkouts} />

            <CategoryFilter activeFilter={activeFilter} onSelectCategory={setActiveFilter} />

            {/* SECTION TITLE & BADGE */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>{"TODAY'S EXERCISES"}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{filteredWorkouts.length}</Text>
                </View>
              </View>

              {workouts.length > 0 && (
                <TouchableOpacity
                  onPress={() => setHistoryModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.warning }}>
                    View All ({workouts.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <WorkoutCard
            item={item}
            onDelete={deleteWorkout}
            onEdit={handleEditWorkout}
            onClone={handleCloneWorkout}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="barbell-outline" size={32} color={COLORS.warning} />
            </View>
            <Text style={styles.emptyText}>
              {selectedDate > new Date()
                ? 'No workout planned for this date.'
                : 'No workouts recorded yet.'}
            </Text>
            <Text style={styles.emptySubText}>
              {selectedDate > new Date()
                ? 'Tap "Add" or "Presets" above to schedule a session.'
                : 'Tap "Add" or "Presets" above to record your sets and load.'}
            </Text>
          </View>
        }
      />

      <CalendarModal
        visible={calendarModalVisible}
        selectedDate={selectedDate}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDate={setSelectedDate}
      />

      <AddWorkoutModal
        visible={modalVisible}
        selectedDate={selectedDate}
        initialData={prefillWorkout}
        onClose={() => {
          setModalVisible(false);
          setPrefillWorkout(null);
        }}
        onSave={saveWorkout}
      />

      <RoutinePresetsModal
        visible={routineModalVisible}
        onClose={() => setRoutineModalVisible(false)}
        onSelectRoutine={handleSelectRoutine}
      />

      <WorkoutHistoryModal
        visible={historyModalVisible}
        workouts={workouts}
        onClose={() => setHistoryModalVisible(false)}
        onDelete={deleteWorkout}
        onClone={handleCloneWorkout}
      />

      <AppAlertModal config={alertConfig} onClose={closeAlert} />
    </SafeAreaView>
  );
}