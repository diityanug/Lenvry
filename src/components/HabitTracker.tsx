import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, Modal, TextInput, FlatList, KeyboardAvoidingView, 
  Platform, Keyboard, ScrollView, TouchableWithoutFeedback
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

interface Habit {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  streak: number;
}

const DEFAULT_CATEGORIES = ['Ibadah', 'Belajar', 'Produktivitas'];

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  
  const [activeFilter, setActiveFilter] = useState<string>('Semua');

  const [modalVisible, setModalVisible] = useState(false);
  const [categoryInputVisible, setCategoryInputVisible] = useState(false);
  
  const [confirmConfig, setConfirmConfig] = useState({
    visible: false,
    title: '',
    message: '',
    isDestructive: true,
    confirmText: 'Hapus',
    onConfirm: () => {}
  });
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [newCategoryText, setNewCategoryText] = useState('');

  const filteredHabits = activeFilter === 'Semua' 
    ? habits 
    : habits.filter(h => h.category === activeFilter);

  const completedCount = filteredHabits.filter(h => h.completed).length;
  const progressPercent = filteredHabits.length > 0 ? (completedCount / filteredHabits.length) * 100 : 0;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem('@lenvry_habits');
      const storedCategories = await AsyncStorage.getItem('@lenvry_habit_categories');
      
      if (storedHabits !== null) setHabits(JSON.parse(storedHabits));
      if (storedCategories !== null) {
        const parsedCategories = JSON.parse(storedCategories);
        setCategories(parsedCategories);
        if (parsedCategories.length > 0) setCategory(parsedCategories[0]);
      }
    } catch (e) {
      console.error('Gagal memuat data habit', e);
    }
  };

  const saveHabit = async () => {
    if (!title.trim() || !category) {
      showDialog("Data Kosong", "Nama kebiasaan dan kategori tidak boleh kosong!", false, "Oke", closeDialog);
      return;
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      title: title.trim(),
      category,
      completed: false,
      streak: 0,
    };

    const updatedHabits = [...habits, newHabit];
    setHabits(updatedHabits);
    await AsyncStorage.setItem('@lenvry_habits', JSON.stringify(updatedHabits));
      
    setTitle(''); 
    Keyboard.dismiss();
    setModalVisible(false);
  };

  const toggleHabit = async (id: string) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === id) {
        const isNowCompleted = !habit.completed;
        return { 
          ...habit, 
          completed: isNowCompleted,
          streak: isNowCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1)
        };
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
    showDialog("Hapus Kebiasaan?", "Apakah kamu yakin ingin menghapus kebiasaan ini dari rutinitasmu?", true, "Hapus", async () => {
      const updatedHabits = habits.filter(h => h.id !== id);
      setHabits(updatedHabits);
      await AsyncStorage.setItem('@lenvry_habits', JSON.stringify(updatedHabits));
      closeDialog();
    });
  };

  const addCategory = async () => {
    if (!newCategoryText.trim()) return;
    if (categories.includes(newCategoryText.trim())) {
      showDialog("Kategori Sudah Ada", "Kategori ini sudah pernah kamu buat. Gunakan nama lain.", false, "Oke", closeDialog);
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
    showDialog("Hapus Kategori?", `Hapus kategori "${catToDelete}"? (Kebiasaan yang sudah ada tidak akan terhapus)`, true, "Hapus", async () => {
      const updatedCategories = categories.filter(c => c !== catToDelete);
      setCategories(updatedCategories);
      
      if (category === catToDelete) {
        setCategory(updatedCategories.length > 0 ? updatedCategories[0] : '');
      }
      if (activeFilter === catToDelete) {
        setActiveFilter('Semua');
      }
      
      await AsyncStorage.setItem('@lenvry_habit_categories', JSON.stringify(updatedCategories));
      closeDialog();
    });
  };

  const getCategoryIcon = (cat: string) => {
    const lowerCat = cat.toLowerCase();
    if (lowerCat.includes('ibadah') || lowerCat.includes('doa') || lowerCat.includes('ngaji')) return 'praying-hands';
    if (lowerCat.includes('belajar') || lowerCat.includes('buku')) return 'book-open';
    if (lowerCat.includes('kerja') || lowerCat.includes('produktif')) return 'laptop-code';
    if (lowerCat.includes('olahraga') || lowerCat.includes('gym')) return 'dumbbell';
    if (lowerCat.includes('makan') || lowerCat.includes('diet')) return 'utensils';
    return 'star';
  };

  const filterOptions = ['Semua', ...categories];

  const renderHabitItem = ({ item }: { item: Habit }) => (
    <View style={[styles.habitCard, item.completed && styles.habitCardCompleted]}>
      <View style={[styles.habitIconContainer, item.completed && styles.habitIconContainerCompleted]}>
        <FontAwesome5 name={getCategoryIcon(item.category)} size={16} color={item.completed ? "#A1A1AA" : "#D4FF00"} />
      </View>
      <View style={styles.habitInfo}>
        <Text style={[styles.habitTitle, item.completed && styles.habitTitleCompleted]} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.habitSubtitle}>{item.category} <Text style={styles.statDot}>•</Text> 🔥 {item.streak} Streak</Text>
      </View>
      <TouchableOpacity onPress={() => toggleHabit(item.id)} style={[styles.checkButton, item.completed && styles.checkButtonActive]}>
        <Ionicons name="checkmark" size={18} color={item.completed ? "#09090B" : "transparent"} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteHabit(item.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={18} color="#FF453A" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" translucent={true} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Habits</Text>
          <Text style={styles.slogan}>Bangun rutinitas, bentuk identitas.</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterOptions.map((cat, index) => {
            const isLast = index === filterOptions.length - 1;
            return (
              <TouchableOpacity 
                key={`filter-${cat}`}
                style={[
                  styles.filterChip, 
                  activeFilter === cat && styles.filterChipActive,
                  isLast && { marginRight: 0 }
                ]}
                onPress={() => setActiveFilter(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, activeFilter === cat && styles.filterChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            Progress {activeFilter !== 'Semua' ? `(${activeFilter})` : 'Hari Ini'}
          </Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{completedCount} / {filteredHabits.length} Selesai</Text>
          </View>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>
      
      <FlatList
        data={filteredHabits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabitItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={48} color="#2A2A2A" />
            <Text style={styles.emptyText}>
              {activeFilter === 'Semua' ? 'Belum ada kebiasaan.' : `Belum ada kebiasaan ${activeFilter}.`}
            </Text>
            <Text style={styles.emptySubText}>Klik tombol + di bawah untuk memulai.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color="#09090B" />
      </TouchableOpacity>

      {/* --- MODAL 1: ADD HABIT --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlayDismissArea} />
          </TouchableWithoutFeedback>
          
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kebiasaan Baru</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#3F3F46" />
              </TouchableOpacity>
            </View>
            
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>NAMA KEBIASAAN</Text>
              <TextInput style={styles.input} placeholder="Contoh: Tahajud, Baca Buku..." placeholderTextColor="#52525B" value={title} onChangeText={setTitle} autoCapitalize="words" />

              <View style={styles.categoryHeader}>
                <Text style={styles.inputLabel}>KATEGORI (Tahan untuk hapus)</Text>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingRight: 48 }}>
                {categories.map((cat) => (
                  <TouchableOpacity 
                    key={cat}
                    style={[styles.chip, category === cat && styles.chipActive]}
                    onPress={() => setCategory(cat)}
                    onLongPress={() => deleteCategory(cat)}
                  >
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.chipAdd} onPress={() => setCategoryInputVisible(true)}>
                  <Text style={styles.chipAddText}>+ Baru</Text>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity style={styles.saveButton} onPress={saveHabit} activeOpacity={0.8}>
                <Text style={styles.saveButtonText}>SIMPAN HABIT</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- MODAL 2: INPUT KATEGORI BARU --- */}
      <Modal animationType="fade" transparent={true} visible={categoryInputVisible} onRequestClose={() => setCategoryInputVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.centerOverlay}>
          <View style={styles.dialogBox}>
            <View style={styles.dialogIconBox}>
              <Ionicons name="pricetag" size={28} color="#09090B" />
            </View>
            <Text style={styles.dialogTitle}>Kategori Baru</Text>
            <Text style={styles.dialogSubtitle}>Masukkan nama kategori kebiasaan baru</Text>
            
            <TextInput 
              style={styles.dialogInput} 
              placeholder="Contoh: Skincare..." 
              placeholderTextColor="#52525B" 
              value={newCategoryText} 
              onChangeText={setNewCategoryText}
              autoFocus={true}
            />

            <View style={styles.dialogActionRow}>
              <TouchableOpacity style={styles.dialogBtnCancel} onPress={() => setCategoryInputVisible(false)}>
                <Text style={styles.dialogBtnCancelText}>BATAL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogBtnConfirm} onPress={addCategory}>
                <Text style={styles.dialogBtnConfirmText}>SIMPAN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- MODAL 3: CUSTOM CONFIRM DIALOG --- */}
      <Modal animationType="fade" transparent={true} visible={confirmConfig.visible} onRequestClose={closeDialog}>
        <View style={styles.centerOverlay}>
          <View style={styles.dialogBox}>
            <View style={[styles.dialogIconBox, confirmConfig.isDestructive ? styles.iconBoxDestructive : styles.iconBoxNeutral]}>
              <Ionicons name={confirmConfig.isDestructive ? "warning" : "information-circle"} size={32} color={confirmConfig.isDestructive ? "#FF453A" : "#09090B"} />
            </View>
            <Text style={styles.dialogTitle}>{confirmConfig.title}</Text>
            <Text style={styles.dialogSubtitle}>{confirmConfig.message}</Text>
            
            <View style={styles.dialogActionRow}>
              <TouchableOpacity style={styles.dialogBtnCancel} onPress={closeDialog}>
                <Text style={styles.dialogBtnCancelText}>BATAL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dialogBtnConfirm, confirmConfig.isDestructive ? styles.btnDestructive : styles.btnNeutral]} onPress={confirmConfig.onConfirm}>
                <Text style={[styles.dialogBtnConfirmText, confirmConfig.isDestructive ? styles.textDestructive : styles.textNeutral]}>{confirmConfig.confirmText.toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#09090B', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, marginTop: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FAFAFA', letterSpacing: -0.5 },
  slogan: { fontSize: 13, color: '#A1A1AA', marginTop: 4, fontWeight: '500' },
  
  filterContainer: { marginBottom: 24, marginHorizontal: -20 },
  filterScroll: { paddingHorizontal: 20 },
  filterChip: { backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, marginRight: 10 },
  filterChipActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  filterChipText: { color: '#A1A1AA', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#09090B', fontWeight: 'bold' },

  card: { backgroundColor: '#18181B', borderRadius: 20, padding: 20, marginBottom: 28, borderWidth: 1, borderColor: '#27272A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#FAFAFA' },
  progressBadge: { backgroundColor: 'rgba(212, 255, 0, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  progressText: { fontSize: 12, fontWeight: 'bold', color: '#D4FF00' },
  progressBarBackground: { height: 6, backgroundColor: '#27272A', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#D4FF00', borderRadius: 4 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#FAFAFA', fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySubText: { color: '#71717A', fontSize: 13, marginTop: 8 },
  
  habitCard: { backgroundColor: '#18181B', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#27272A', flexDirection: 'row', alignItems: 'center' },
  habitCardCompleted: { backgroundColor: '#09090B', borderColor: '#18181B', opacity: 0.8 },
  habitIconContainer: { backgroundColor: 'rgba(212, 255, 0, 0.1)', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  habitIconContainerCompleted: { backgroundColor: '#18181B' },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 16, fontWeight: 'bold', color: '#FAFAFA', marginBottom: 4 },
  habitTitleCompleted: { textDecorationLine: 'line-through', color: '#71717A' },
  habitSubtitle: { fontSize: 12, color: '#A1A1AA', fontWeight: '500' },
  statDot: { color: '#3F3F46', marginHorizontal: 4 },
  checkButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#18181B', borderWidth: 2, borderColor: '#3F3F46', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  checkButtonActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  deleteButton: { padding: 4 },
  
  fab: { position: 'absolute', bottom: 32, right: 24, backgroundColor: '#D4FF00', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#D4FF00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalOverlayDismissArea: { flex: 1 },
  modalContent: { backgroundColor: '#18181B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%', borderWidth: 1, borderColor: '#27272A' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#3F3F46', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FAFAFA' },
  
  inputLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#09090B', color: '#FAFAFA', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, marginBottom: 24, fontSize: 15, borderWidth: 1, borderColor: '#27272A' },
  
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipScroll: { flexDirection: 'row', flexGrow: 0, marginBottom: 32, marginHorizontal: -24, paddingHorizontal: 24 },
  chip: { backgroundColor: '#09090B', borderWidth: 1, borderColor: '#27272A', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginRight: 10 },
  chipActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  chipText: { color: '#A1A1AA', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#09090B', fontWeight: 'bold' },
  chipAdd: { backgroundColor: '#18181B', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#3F3F46', borderStyle: 'dashed' },
  chipAddText: { color: '#FAFAFA', fontSize: 13, fontWeight: '600' },

  saveButton: { backgroundColor: '#D4FF00', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  saveButtonText: { color: '#09090B', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },

  centerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialogBox: { backgroundColor: '#18181B', width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#27272A', alignItems: 'center' },
  dialogIconBox: { backgroundColor: '#D4FF00', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  iconBoxDestructive: { backgroundColor: 'rgba(255, 69, 58, 0.15)' },
  iconBoxNeutral: { backgroundColor: '#D4FF00' },
  dialogTitle: { fontSize: 20, fontWeight: 'bold', color: '#FAFAFA', marginBottom: 12, textAlign: 'center' },
  dialogSubtitle: { fontSize: 14, color: '#A1A1AA', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  dialogInput: { backgroundColor: '#09090B', color: '#FAFAFA', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, marginBottom: 28, fontSize: 15, borderWidth: 1, borderColor: '#27272A', textAlign: 'center', width: '100%' },
  
  dialogActionRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  dialogBtnCancel: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#27272A', marginRight: 12, alignItems: 'center' },
  dialogBtnCancelText: { color: '#FAFAFA', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
  dialogBtnConfirm: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  dialogBtnConfirmText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
  btnDestructive: { backgroundColor: 'rgba(255, 69, 58, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.3)' },
  textDestructive: { color: '#FF453A' },
  btnNeutral: { backgroundColor: '#D4FF00' },
  textNeutral: { color: '#09090B' },
});