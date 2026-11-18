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
import { Ionicons } from '@expo/vector-icons';

import { Workout } from '../types/fitness';
import { formatDateKey } from '../constants/date';
import { TAB_BAR_HEIGHT } from '../constants/tabBar';
import { COLORS } from '../constants/theme';
import { RoutinePreset } from '../constants/fitness';
import DateStrip from '../components/Fitness/DateStrip';
import HeroMetrics from '../components/Fitness/HeroMetrics';
import CategoryFilter from '../components/Fitness/CategoryFilter';
import WorkoutCard from '../components/Fitness/WorkoutCard';
import { SharedCalendarModal } from '../components/Shared/CalendarModal';
import AddWorkoutModal from '../components/Fitness/AddWorkoutModal';
import WorkoutHistoryModal from '../components/Fitness/WorkoutHistoryModal';
import RoutinePresetsModal from '../components/Fitness/RoutinePresetsModal';
import AppAlertModal, { AppAlertConfig } from '../components/Common/AppAlertModal';
import { HeaderActionButton } from '../components/Common/AppButtons';
import { ErrorBoundary } from '../components/Shared/ErrorBoundary';
import { fitnessStyles as styles } from '../styles/fitnessStyles';
import { hapticSuccess } from '../utils/haptics';
import { useFitnessStore } from '../stores';
import { useActiveDate } from '../hooks/useDayRollover';
import { generateId } from '../utils/id';

export default function FitnessScreen() {
  const workouts = useFitnessStore((s) => s.workouts);
  const loadFitness = useFitnessStore((s) => s.loadFitness);
  const addWorkout = useFitnessStore((s) => s.addWorkout);
  const updateWorkout = useFitnessStore((s) => s.updateWorkout);
  const deleteWorkoutFromStore = useFitnessStore((s) => s.deleteWorkout);
  const setWorkouts = useFitnessStore((s) => s.setWorkouts);

  const [modalVisible, setModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [routineModalVisible, setRoutineModalVisible] = useState(false);
  const [prefillWorkout, setPrefillWorkout] = useState<Workout | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const loadWorkouts = useCallback(() => {
    loadFitness();
  }, [loadFitness]);

  const { selectedDate, setSelectedDate, todayDate } = useActiveDate(loadWorkouts);

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
  const todayDateKey = formatDateKey(todayDate);
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
    try {
      if (data.id) {
        const existing = workouts.find((w) => w.id === data.id);
        await updateWorkout({
          id: data.id,
          exercise: data.exercise.trim(),
          category: data.category,
          sets: data.sets,
          reps: data.reps,
          weight: data.weight,
          date: existing?.date || currentDateKey,
        });
      } else {
        const newWorkout: Workout = {
          id: generateId('workout'),
          exercise: data.exercise.trim(),
          category: data.category,
          sets: data.sets,
          reps: data.reps,
          weight: data.weight,
          date: currentDateKey,
        };
        await addWorkout(newWorkout);
      }

      hapticSuccess();
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
    setPrefillWorkout({
      ...item,
      id: '',
    });
    setModalVisible(true);
  };

  const handleSelectRoutine = async (routine: RoutinePreset) => {
    const newItems: Workout[] = routine.exercises.map((ex) => ({
      id: generateId('workout'),
      exercise: ex.exercise,
      category: ex.category,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight,
      date: currentDateKey,
    }));

    try {
      await setWorkouts([...newItems, ...workouts]);
      hapticSuccess();
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
        await deleteWorkoutFromStore(id);
      }
    );
  };

  return (
    <ErrorBoundary fallbackTitle="Fitness Encountered an Issue">
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgCanvas }]} edges={['top']}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.title}>Fitness</Text>
            <Text style={styles.slogan}>Track your workout sessions</Text>
          </View>

          <View style={styles.headerRightActions}>
            <HeaderActionButton
              label="Presets"
              icon="flash"
              variant="secondary"
              iconColor={COLORS.warning}
              onPress={() => setRoutineModalVisible(true)}
              accessibilityLabel="Workout Presets"
            />

            <HeaderActionButton
              label="Add"
              color={COLORS.fitness}
              onPress={() => {
                setPrefillWorkout(null);
                setModalVisible(true);
              }}
              accessibilityLabel="Add Workout"
            />
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
                todayDate={todayDate}
                onSelectDate={setSelectedDate}
                onOpenCalendar={() => setCalendarModalVisible(true)}
              />

              <HeroMetrics selectedDate={selectedDate} workouts={currentDayWorkouts} />

              <CategoryFilter activeFilter={activeFilter} onSelectCategory={setActiveFilter} />

              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>{"TODAY'S EXERCISES"}</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{filteredWorkouts.length}</Text>
                  </View>
                </View>
              </View>

              {workouts.length > 0 && (
                <TouchableOpacity
                  style={styles.historyActionBar}
                  onPress={() => setHistoryModalVisible(true)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="time-outline" size={16} color={COLORS.warning} />
                  <Text style={styles.historyActionBarText}>
                    View All Logged Workouts ({workouts.length})
                  </Text>
                </TouchableOpacity>
              )}
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
                {currentDateKey > todayDateKey
                  ? 'No workout planned for this date.'
                  : 'No workouts recorded yet.'}
              </Text>
              <Text style={styles.emptySubText}>
                {currentDateKey > todayDateKey
                  ? 'Tap "Add" or "Presets" above to schedule a session.'
                  : 'Tap "Add" or "Presets" above to record your sets and load.'}
              </Text>
            </View>
          }
        />

        <SharedCalendarModal
          visible={calendarModalVisible}
          selectedDate={selectedDate}
          themeColor={COLORS.fitness}
          title="Select Workout Date"
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
    </ErrorBoundary>
  );
}
