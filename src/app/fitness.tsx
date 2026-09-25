import React, { useState, useEffect } from 'react';
import {
  Text, View, TouchableOpacity, SafeAreaView,
  StatusBar, FlatList, Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { Workout } from '../types/fitness';
import { GYM_CATEGORIES } from '../constants/fitness';
import { TAB_BAR_HEIGHT } from '../constants/tabBar';
import DateStrip from '../components/Fitness/DateStrip';
import HeroMetrics from '../components/Fitness/HeroMetrics';
import CategoryFilter from '../components/Fitness/CategoryFilter';
import WorkoutCard from '../components/Fitness/WorkoutCard';
import CalendarModal from '../components/Fitness/CalendarModal';
import AddWorkoutModal from '../components/Fitness/AddWorkoutModal';
import AppAlertModal, { AppAlertConfig } from '../components/Common/AppAlertModal';
import { fitnessStyles as styles } from '../styles/fitnessStyles';

export default function FitnessScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [modalVisible, setModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const [activeFilter, setActiveFilter] = useState('All');
  const [exercise, setExercise] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(GYM_CATEGORIES[0]);
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  useEffect(() => {
    loadWorkouts();
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

  const loadWorkouts = async () => {
    try {
      const storedWorkouts = await AsyncStorage.getItem('@fitness_workouts');
      if (storedWorkouts !== null) {
        setWorkouts(JSON.parse(storedWorkouts));
      }
    } catch (e) {
      console.error('Failed to load fitness data:', e);
    }
  };

  const currentDateKey = selectedDate.toISOString().split('T')[0];
  const currentDayWorkouts = workouts.filter((w) => w.date === currentDateKey);
  const filteredWorkouts = activeFilter === 'All'
    ? currentDayWorkouts
    : currentDayWorkouts.filter((w) => w.category === activeFilter);

  const saveWorkout = async () => {
    const isCardio = selectedCategory === 'Cardio';

    if (!exercise.trim() || !sets || !reps || (!isCardio && !weight)) {
      showAlert(
        'warning',
        'Incomplete Details',
        'Please enter the exercise name, sets, and repetitions before saving.'
      );
      return;
    }

    const newWorkout: Workout = {
      id: Date.now().toString(),
      exercise: exercise.trim(),
      category: selectedCategory,
      sets,
      reps,
      weight: isCardio ? '0' : weight,
      date: currentDateKey,
    };

    const updatedWorkouts = [newWorkout, ...workouts];

    try {
      await AsyncStorage.setItem('@fitness_workouts', JSON.stringify(updatedWorkouts));
      setWorkouts(updatedWorkouts);

      setExercise('');
      setSets('');
      setReps('');
      setWeight('');
      setSelectedCategory(GYM_CATEGORIES[0]);
      Keyboard.dismiss();
      setModalVisible(false);
    } catch (e) {
      console.error('Failed to save workout session:', e);
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" translucent={true} />

      <View style={styles.header}>
        <Text style={styles.title}>Fitness</Text>
        <Text style={styles.slogan}>Track Your Strength, Own Your Progress</Text>
      </View>

      <DateStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onOpenCalendar={() => setCalendarModalVisible(true)}
      />

      <HeroMetrics
        selectedDate={selectedDate}
        workouts={currentDayWorkouts}
      />

      <CategoryFilter
        activeFilter={activeFilter}
        onSelectCategory={setActiveFilter}
      />

      <FlatList
        data={filteredWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <WorkoutCard item={item} onDelete={deleteWorkout} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="barbell-outline" size={36} color="#FF6B00" />
            </View>
            <Text style={styles.emptyText}>
              {selectedDate > new Date() ? 'No workout planned for this date.' : 'No workouts recorded yet.'}
            </Text>
            <Text style={styles.emptySubText}>
              {selectedDate > new Date() ? 'Tap + to schedule your future training session.' : 'Tap the + button below to log your sets.'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 40 }}
      />

      <TouchableOpacity 
        style={[styles.fab, { bottom: TAB_BAR_HEIGHT + 16 }]} 
        onPress={() => setModalVisible(true)} 
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color="#09090B" />
      </TouchableOpacity>

      <CalendarModal
        visible={calendarModalVisible}
        selectedDate={selectedDate}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDate={setSelectedDate}
      />

      <AddWorkoutModal
        visible={modalVisible}
        selectedDate={selectedDate}
        selectedCategory={selectedCategory}
        exercise={exercise}
        sets={sets}
        reps={reps}
        weight={weight}
        onClose={() => setModalVisible(false)}
        onSave={saveWorkout}
        onChangeCategory={setSelectedCategory}
        onChangeExercise={setExercise}
        onChangeSets={setSets}
        onChangeReps={setReps}
        onChangeWeight={setWeight}
      />

      <AppAlertModal config={alertConfig} onClose={closeAlert} />
    </SafeAreaView>
  );
}