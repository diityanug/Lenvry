import React, { useState, useEffect } from 'react';
import { 
  Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, Keyboard, ScrollView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { Habit, ConfirmConfig } from '../types/habits';
import { DEFAULT_CATEGORIES, formatDateKey } from '../constants/habits';
import DateNavigator from '../components/Habits/DateNavigator';
import ProgressCard from '../components/Habits/ProgressCard';
import CategoryFilter from '../components/Habits/CategoryFilter';
import MasonryCard from '../components/Habits/MasonryCard';
import AddHabitModal from '../components/Habits/AddHabitModal';
import AddCategoryModal from '../components/Habits/AddCategoryModal';
import ConfirmDialogModal from '../components/Habits/ConfirmDialogModal';
import { habitStyles as styles } from '../styles/habitStyles';

export default function HabitTrackerScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [modalVisible, setModalVisible] = useState(false);
  const [categoryInputVisible, setCategoryInputVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
    visible: false, title: '', message: '', isDestructive: true, confirmText: 'Delete', onConfirm: () => {}
  });

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [newCategoryText, setNewCategoryText] = useState('');

  const currentDateKey = formatDateKey(selectedDate);
  const currentDayHabits = habits.filter(h => h.date === currentDateKey);
  const filteredHabits = activeFilter === 'All' 
    ? currentDayHabits 
    : currentDayHabits.filter(h => h.category === activeFilter);

  const leftColumnData = filteredHabits.filter((_, i) => i % 2 === 0);
  const rightColumnData = filteredHabits.filter((_, i) => i % 2 !== 0);

  const completedCount = filteredHabits.filter(h => h.completed).length;
  const progressPercent = filteredHabits.length > 0 ? (completedCount / filteredHabits.length) * 100 : 0;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem('@lenvry_habits');
      const storedCategories = await AsyncStorage.getItem('@lenvry_habit_categories');
      
      if (storedHabits !== null) {
        const parsed = JSON.parse(storedHabits).map((h: any) => ({
          ...h,
          date: h.date || formatDateKey(new Date()),
          completed: typeof h.completed === 'boolean' ? h.completed : false,
        }));
        setHabits(parsed);
      }
      if (storedCategories !== null) {
        const parsedCategories = JSON.parse(storedCategories);
        setCategories(parsedCategories);
        if (parsedCategories.length > 0) setCategory(parsedCategories[0]);
      }
    } catch (e) {
      console.error('Failed to load habit data', e);
    }
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

  const saveHabit = async () => {
    if (!title.trim() || !category) {
      showDialog("Missing Data", "Habit name and category cannot be empty!", false, "OK", closeDialog);
      return;
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      title: title.trim(),
      category,
      completed: false,
      date: currentDateKey,
    };

    const updatedHabits = [...habits, newHabit];
    setHabits(updatedHabits);
    await AsyncStorage.setItem('@lenvry_habits', JSON.stringify(updatedHabits));
      
    setTitle(''); 
    Keyboard.dismiss(); 
    setModalVisible(false);
  };

  const toggleHabitForDate = async (id: string) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === id) {
        return { ...habit, completed: !habit.completed };
      }
      return habit;
    });
    setHabits(updatedHabits);
    await AsyncStorage.setItem('@lenvry_habits', JSON.stringify(updatedHabits));
  };

  const showDialog = (title: string, message: string, isDestructive: boolean, confirmText: string, onConfirm: () => void) => {
    setConfirmConfig({ visible: true, title, message, isDestructive, confirmText, onConfirm });
  };

  const closeDialog = () => setConfirmConfig(prev => ({ ...prev, visible: false }));

  const deleteHabit = (id: string) => {
    showDialog("Delete Habit?", "Are you sure you want to remove this habit for this date?", true, "Delete", async () => {
      const updatedHabits = habits.filter(h => h.id !== id);
      setHabits(updatedHabits);
      await AsyncStorage.setItem('@lenvry_habits', JSON.stringify(updatedHabits));
      closeDialog();
    });
  };

  const addCategory = async () => {
    if (!newCategoryText.trim()) return;
    if (categories.includes(newCategoryText.trim())) {
      showDialog("Category Exists", "This category already exists. Choose a different name.", false, "OK", closeDialog); 
      return;
    }
    const updatedCategories = [...categories, newCategoryText.trim()];
    setCategories(updatedCategories); 
    setCategory(newCategoryText.trim());
    await AsyncStorage.setItem('@lenvry_habit_categories', JSON.stringify(updatedCategories));
    setNewCategoryText(''); 
    setCategoryInputVisible(false);
  };

  const deleteCategory = (catToDelete: string) => {
    showDialog("Delete Category?", `Remove category "${catToDelete}"?`, true, "Delete", async () => {
      const updatedCategories = categories.filter(c => c !== catToDelete);
      setCategories(updatedCategories);
      if (category === catToDelete) setCategory(updatedCategories.length > 0 ? updatedCategories[0] : '');
      if (activeFilter === catToDelete) setActiveFilter('All');
      await AsyncStorage.setItem('@lenvry_habit_categories', JSON.stringify(updatedCategories));
      closeDialog();
    });
  };

  const getTotalCompletedCount = (habitTitle: string) => {
    return habits.filter(h => h.title.toLowerCase() === habitTitle.toLowerCase() && h.completed).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" translucent={true} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitleBold}>Habits</Text>
          <Text style={styles.headerSubtitleLight}>Build Consistency, Shape Your Future</Text>
        </View>
      </View>

      <DateNavigator 
        selectedDate={selectedDate}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
      />

      <CategoryFilter 
        categories={categories}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
      />

      <ProgressCard 
        completedCount={completedCount}
        totalCount={filteredHabits.length}
        progressPercent={progressPercent}
      />

      {filteredHabits.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={64} color="#27272A" />
          <Text style={styles.emptyText}>No habits scheduled for this date.</Text>
          <Text style={styles.emptySubText}>Tap the + button below to plan a new habit.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.helperText}>*Tap to complete, hold to delete</Text>
          <View style={styles.masonryContainer}>
            <View style={styles.masonryColumn}>
              {leftColumnData.map((item, index) => (
                <MasonryCard 
                  key={item.id}
                  item={item}
                  isLeftColumn={true}
                  arrayIndex={index}
                  totalCompletedCount={getTotalCompletedCount(item.title)}
                  onToggle={toggleHabitForDate}
                  onDelete={deleteHabit}
                />
              ))}
            </View>
            <View style={[styles.masonryColumn, { marginTop: 24 }]}>
              {rightColumnData.map((item, index) => (
                <MasonryCard 
                  key={item.id}
                  item={item}
                  isLeftColumn={false}
                  arrayIndex={index}
                  totalCompletedCount={getTotalCompletedCount(item.title)}
                  onToggle={toggleHabitForDate}
                  onDelete={deleteHabit}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <AddHabitModal 
        visible={modalVisible}
        selectedDate={selectedDate}
        title={title}
        category={category}
        categories={categories}
        onChangeTitle={setTitle}
        onChangeCategory={setCategory}
        onSave={saveHabit}
        onClose={() => setModalVisible(false)}
        onOpenAddCategory={() => setCategoryInputVisible(true)}
        onDeleteCategory={deleteCategory}
      />

      <AddCategoryModal 
        visible={categoryInputVisible}
        value={newCategoryText}
        onChangeText={setNewCategoryText}
        onSave={addCategory}
        onClose={() => setCategoryInputVisible(false)}
      />

      <ConfirmDialogModal 
        config={confirmConfig}
        onClose={closeDialog}
      />

    </SafeAreaView>
  );
}