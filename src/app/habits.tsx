import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import AppAlertModal, { AppAlertConfig } from '../components/Common/AppAlertModal';
import AddCategoryModal from '../components/Habits/AddCategoryModal';
import AddHabitModal from '../components/Habits/AddHabitModal';
import CalendarModal from '../components/Habits/CalendarModal';
import CategoryFilter from '../components/Habits/CategoryFilter';
import DateNavigator from '../components/Habits/DateNavigator';
import HabitCard from '../components/Habits/HabitCard';
import ProgressCard from '../components/Habits/ProgressCard';
import { DEFAULT_CATEGORIES, formatDateKey } from '../constants/habits';
import { TAB_BAR_HEIGHT } from '../constants/tabBar';
import { habitStyles as styles } from '../styles/habitStyles';
import { Habit } from '../types/habits';

export default function HabitTrackerScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [modalVisible, setModalVisible] = useState(false);
  const [categoryInputVisible, setCategoryInputVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [newCategoryText, setNewCategoryText] = useState('');

  const todayDateKey = formatDateKey(new Date());
  const currentDateKey = formatDateKey(selectedDate);
  const isTodayActive = currentDateKey === todayDateKey;

  const currentDayHabits = habits.filter((h) => h.date === currentDateKey);
  const filteredHabits = activeFilter === 'All' 
    ? currentDayHabits 
    : currentDayHabits.filter((h) => h.category === activeFilter);

  const completedCount = filteredHabits.filter((h) => h.completed).length;
  const progressPercent = filteredHabits.length > 0 ? (completedCount / filteredHabits.length) * 100 : 0;

  useEffect(() => {
    loadData();
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

  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };

  const saveHabit = async () => {
    if (!title.trim() || !category) {
      showAlert('warning', 'Missing Data', 'Habit name and category cannot be empty.');
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
    const updatedHabits = habits.map((habit) => {
      if (habit.id === id) {
        return { ...habit, completed: !habit.completed };
      }
      return habit;
    });
    setHabits(updatedHabits);
    await AsyncStorage.setItem('@lenvry_habits', JSON.stringify(updatedHabits));
  };

  const deleteHabit = (id: string) => {
    showAlert(
      'danger',
      'Delete Habit?',
      'Are you sure you want to remove this habit for this date?',
      'DELETE',
      'CANCEL',
      async () => {
        const updatedHabits = habits.filter((h) => h.id !== id);
        setHabits(updatedHabits);
        await AsyncStorage.setItem('@lenvry_habits', JSON.stringify(updatedHabits));
      }
    );
  };

  const addCategory = async () => {
    if (!newCategoryText.trim()) return;
    if (categories.includes(newCategoryText.trim())) {
      showAlert('warning', 'Category Exists', 'This category already exists. Choose a different name.'); 
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
    showAlert(
      'danger',
      'Delete Category?',
      `Remove category "${catToDelete}"?`,
      'DELETE',
      'CANCEL',
      async () => {
        const updatedCategories = categories.filter((c) => c !== catToDelete);
        setCategories(updatedCategories);
        if (category === catToDelete) setCategory(updatedCategories.length > 0 ? updatedCategories[0] : '');
        if (activeFilter === catToDelete) setActiveFilter('All');
        await AsyncStorage.setItem('@lenvry_habit_categories', JSON.stringify(updatedCategories));
      }
    );
  };

  const getTotalCompletedCount = (habitTitle: string) => {
    return habits.filter((h) => h.title.toLowerCase() === habitTitle.toLowerCase() && h.completed).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" translucent={true} />
      
      {/* Header dengan Tombol Add Terintegrasi */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.headerTitleBold}>Habits</Text>
          <Text style={styles.headerSubtitleLight}>Build Consistency, Shape Your Future</Text>
        </View>

        <TouchableOpacity 
          style={styles.headerAddBtn} 
          onPress={() => setModalVisible(true)} 
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#09090B" />
          <Text style={styles.headerAddBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 36 }}
      >
        {/* Navigasi Tanggal */}
        <DateNavigator 
          selectedDate={selectedDate}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          onOpenCalendar={() => setCalendarModalVisible(true)}
        />

        {/* Shortcut Kembali ke Hari Ini */}
        {!isTodayActive && (
          <TouchableOpacity 
            style={styles.todayBanner} 
            onPress={handleGoToToday}
            activeOpacity={0.8}
          >
            <Ionicons name="return-up-back" size={15} color="#8E97FD" style={{ marginRight: 6 }} />
            <Text style={styles.todayBannerText}>Tap to jump back to Today</Text>
          </TouchableOpacity>
        )}

        {/* Filter Kategori */}
        <CategoryFilter 
          categories={categories}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
        />

        {/* Kartu Ringkasan Progres */}
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

        {/* Daftar Habit Grid Kotak */}
        {filteredHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={56} color="#27272A" />
            <Text style={styles.emptyText}>No habits scheduled for this date.</Text>
            <Text style={styles.emptySubText}>Tap Add in the top right to start a habit.</Text>
          </View>
        ) : (
          <View style={styles.habitGridWrap}>
            {filteredHabits.map((item) => (
              <HabitCard
                key={item.id}
                item={item}
                totalCompletedCount={getTotalCompletedCount(item.title)}
                onToggle={toggleHabitForDate}
                onDelete={deleteHabit}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Kalender */}
      <CalendarModal
        visible={calendarModalVisible}
        selectedDate={selectedDate}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDate={(d) => {
          setSelectedDate(d);
          setCalendarModalVisible(false);
        }}
      />

      {/* Modal Tambah Habit */}
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

      {/* Modal Tambah Kategori */}
      <AddCategoryModal 
        visible={categoryInputVisible}
        value={newCategoryText}
        onChangeText={setNewCategoryText}
        onSave={addCategory}
        onClose={() => setCategoryInputVisible(false)}
      />

      <AppAlertModal config={alertConfig} onClose={closeAlert} />
    </SafeAreaView>
  );
}