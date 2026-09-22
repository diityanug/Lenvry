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
  
  // Filter State
  const [activeFilter, setActiveFilter] = useState<string>('Semua');

  // Modals Visibility State
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryInputVisible, setCategoryInputVisible] = useState(false);
  
  // Custom Confirm Dialog State
  const [confirmConfig, setConfirmConfig] = useState({
    visible: false,
    title: '',
    message: '',
    isDestructive: true,
    confirmText: 'Hapus',
    onConfirm: () => {}
  });
  
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [newCategoryText, setNewCategoryText] = useState('');

  // Perhitungan Data berdasarkan Filter Aktif
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

  // --- LOGIKA CUSTOM DIALOG (Alert/Confirm) ---
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
      
      // Jika kategori yang dihapus sedang dipilih di form, reset pilihan
      if (category === catToDelete) {
        setCategory(updatedCategories.length > 0 ? updatedCategories[0] : '');
      }
      // Jika kategori yang dihapus sedang aktif sebagai filter, kembalikan ke 'Semua'
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

  const renderHabitItem = ({ item }: { item: Habit }) => (
    <View style={[styles.habitCard, item.completed && styles.habitCardCompleted]}>
      <View style={styles.habitIconContainer}>
        <FontAwesome5 name={getCategoryIcon(item.category)} size={16} color={item.completed ? "#121212" : "#D4FF00"} />
      </View>
      <View style={styles.habitInfo}>
        <Text style={[styles.habitTitle, item.completed && styles.habitTitleCompleted]}>{item.title}</Text>
        <Text style={styles.habitSubtitle}>{item.category} • 🔥 {item.streak} Streak</Text>
      </View>
      <TouchableOpacity onPress={() => toggleHabit(item.id)} style={[styles.checkButton, item.completed && styles.checkButtonActive]}>
        <Ionicons name="checkmark-done" size={20} color={item.completed ? "#121212" : "#2A2A2A"} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteHabit(item.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color="#FF453A" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Habits</Text>
        <Text style={styles.slogan}>Bangun rutinitas, bentuk identitas.</Text>
      </View>

      {/* FILTER CATEGORY SCROLL */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === 'Semua' && styles.filterChipActive]}
            onPress={() => setActiveFilter('Semua')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'Semua' && styles.filterChipTextActive]}>Semua</Text>
          </TouchableOpacity>
          
          {categories.map((cat) => (
            <TouchableOpacity 
              key={`filter-${cat}`}
              style={[styles.filterChip, activeFilter === cat && styles.filterChipActive]}
              onPress={() => setActiveFilter(cat)}
            >
              <Text style={[styles.filterChipText, activeFilter === cat && styles.filterChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            Progress {activeFilter !== 'Semua' ? `(${activeFilter})` : 'Hari Ini'}
          </Text>
          <Text style={styles.progressText}>{completedCount} / {filteredHabits.length} Selesai</Text>
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
            <Ionicons name="leaf-outline" size={60} color="#2A2A2A" />
            <Text style={styles.emptyText}>
              {activeFilter === 'Semua' ? 'Belum ada kebiasaan.' : `Belum ada kebiasaan ${activeFilter}.`}
            </Text>
            <Text style={styles.emptySubText}>Tambahkan rutinitas harianmu di sini.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity style={styles.floatingButton} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
        <FontAwesome5 name="plus" size={16} color="#121212" style={{ marginRight: 8 }} />
        <Text style={styles.floatingButtonText}>TAMBAH HABIT</Text>
      </TouchableOpacity>

      {/* ================= MODAL 1: ADD HABIT (BOTTOM SHEET) ================= */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlayDismissArea} />
          </TouchableWithoutFeedback>
          
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kebiasaan Baru</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>NAMA KEBIASAAN</Text>
            <TextInput style={styles.input} placeholder="Contoh: Tahajud, Baca Buku..." placeholderTextColor="#666" value={title} onChangeText={setTitle} />

            <View style={styles.categoryHeader}>
              <Text style={styles.inputLabel}>KATEGORI (Tahan untuk hapus)</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
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
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 2: INPUT KATEGORI BARU (CENTER DIALOG) ================= */}
      <Modal animationType="fade" transparent={true} visible={categoryInputVisible} onRequestClose={() => setCategoryInputVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.centerOverlay}>
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>Kategori Baru</Text>
            <Text style={styles.dialogSubtitle}>Masukkan nama kategori kebiasaan baru</Text>
            
            <TextInput 
              style={styles.dialogInput} 
              placeholder="ex: Workout, Skincare..." 
              placeholderTextColor="#666" 
              value={newCategoryText} 
              onChangeText={setNewCategoryText}
              autoFocus={true}
            />

            <View style={styles.dialogActionRow}>
              <TouchableOpacity style={styles.dialogBtnCancel} onPress={() => setCategoryInputVisible(false)}>
                <Text style={styles.dialogBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogBtnConfirm} onPress={addCategory}>
                <Text style={styles.dialogBtnConfirmText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 3: CUSTOM CONFIRM DIALOG ================= */}
      <Modal animationType="fade" transparent={true} visible={confirmConfig.visible} onRequestClose={closeDialog}>
        <View style={styles.centerOverlay}>
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>{confirmConfig.title}</Text>
            <Text style={styles.dialogSubtitle}>{confirmConfig.message}</Text>
            
            <View style={styles.dialogActionRow}>
              <TouchableOpacity style={styles.dialogBtnCancel} onPress={closeDialog}>
                <Text style={styles.dialogBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dialogBtnConfirm, confirmConfig.isDestructive ? styles.btnDestructive : styles.btnNeutral]} onPress={confirmConfig.onConfirm}>
                <Text style={[styles.dialogBtnConfirmText, confirmConfig.isDestructive ? styles.textDestructive : styles.textNeutral]}>{confirmConfig.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20, paddingTop: 50 },
  header: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: '#D4FF00', letterSpacing: 0.5 },
  slogan: { fontSize: 14, color: '#A1A1AA', marginTop: 2, fontWeight: '500' },
  
  /* --- FILTER STYLES --- */
  filterContainer: { height: 44, marginBottom: 16 },
  filterScroll: { paddingRight: 20 },
  filterChip: { backgroundColor: '#1E1E1E', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#2A2A2A', justifyContent: 'center' },
  filterChipActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  filterChipText: { color: '#A1A1AA', fontSize: 13, fontWeight: 'bold' },
  filterChipTextActive: { color: '#121212' },

  card: { backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  progressText: { fontSize: 14, fontWeight: 'bold', color: '#D4FF00' },
  progressBarBackground: { height: 8, backgroundColor: '#2A2A2A', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#D4FF00', borderRadius: 4 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubText: { color: '#666', textAlign: 'center', marginTop: 8, fontSize: 14, paddingHorizontal: 20 },
  
  habitCard: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A', flexDirection: 'row', alignItems: 'center' },
  habitCardCompleted: { backgroundColor: 'rgba(212, 255, 0, 0.05)', borderColor: 'rgba(212, 255, 0, 0.3)' },
  habitIconContainer: { backgroundColor: '#2A2A2A', width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  habitTitleCompleted: { textDecorationLine: 'line-through', color: '#A1A1AA' },
  habitSubtitle: { fontSize: 12, color: '#A1A1AA', fontWeight: '500' },
  checkButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#121212', borderWidth: 2, borderColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkButtonActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  deleteButton: { padding: 4 },
  
  floatingButton: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#D4FF00', paddingVertical: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  floatingButtonText: { color: '#121212', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalOverlayDismissArea: { flex: 1 },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  inputLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1, marginLeft: 4 },
  input: { backgroundColor: '#121212', color: '#FFF', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipScroll: { flexDirection: 'row', flexGrow: 0, marginBottom: 20 },
  chip: { backgroundColor: '#121212', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  chipActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  chipText: { color: '#A1A1AA', fontSize: 13, fontWeight: 'bold' },
  chipTextActive: { color: '#121212' },
  chipAdd: { backgroundColor: 'transparent', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#D4FF00', borderStyle: 'dashed' },
  chipAddText: { color: '#D4FF00', fontSize: 13, fontWeight: 'bold' },

  saveButton: { backgroundColor: '#D4FF00', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#121212', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  centerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialogBox: { backgroundColor: '#1E1E1E', width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#2A2A2A' },
  dialogTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  dialogSubtitle: { fontSize: 14, color: '#A1A1AA', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  dialogInput: { backgroundColor: '#121212', color: '#FFF', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, marginBottom: 24, fontSize: 16, borderWidth: 1, borderColor: '#2A2A2A', textAlign: 'center' },
  
  dialogActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dialogBtnCancel: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#2A2A2A', marginRight: 10, alignItems: 'center' },
  dialogBtnCancelText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  dialogBtnConfirm: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#D4FF00', alignItems: 'center' },
  dialogBtnConfirmText: { color: '#121212', fontSize: 15, fontWeight: 'bold' },
  btnDestructive: { backgroundColor: 'rgba(255, 69, 58, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.3)' },
  textDestructive: { color: '#FF453A' },
  btnNeutral: { backgroundColor: '#D4FF00' },
  textNeutral: { color: '#121212' },
});