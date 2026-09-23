import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, Modal, TextInput, FlatList, Alert, KeyboardAvoidingView, 
  Platform, Keyboard, ScrollView, TouchableWithoutFeedback 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface Workout {
  id: string;
  exercise: string;
  category: string;
  sets: string;
  reps: string;
  weight: string;
  date: string;
}

const GYM_CATEGORIES = ['Dada', 'Punggung', 'Kaki', 'Bahu', 'Lengan', 'Inti', 'Kardio'];

const EXERCISE_SUGGESTIONS: Record<string, string[]> = {
  Dada: ['Bench Press', 'Incline Bench Press', 'Dumbbell Press', 'Chest Fly', 'Push Up', 'Dips', 'Cable Crossover'],
  Punggung: ['Deadlift', 'Pull Up', 'Lat Pulldown', 'Barbell Row', 'Dumbbell Row', 'Seated Cable Row'],
  Kaki: ['Squat', 'Leg Press', 'Leg Extension', 'Leg Curl', 'Lunges', 'Romanian Deadlift', 'Hip Thrust'],
  Bahu: ['Overhead Press', 'Dumbbell Shoulder Press', 'Lateral Raise', 'Front Raise', 'Rear Delt Fly'],
  Lengan: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Tricep Pushdown', 'Skull Crusher'],
  Inti: ['Plank', 'Sit Up', 'Crunch', 'Leg Raise', 'Russian Twist', 'Cable Crunch'],
  Kardio: ['Treadmill', 'Sepeda Statis', 'Rowing Machine', 'Jump Rope', 'HIIT'],
};

export default function GymTracker() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [warningVisible, setWarningVisible] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [exercise, setExercise] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(GYM_CATEGORIES[0]);
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const suggestionScrollRef = useRef<ScrollView>(null);

  const filteredWorkouts = activeFilter === 'Semua' 
    ? workouts 
    : workouts.filter(w => w.category === activeFilter);

  const totalVolume = filteredWorkouts.reduce((total, item) => {
    return total + (parseInt(item.sets || '0') * parseInt(item.reps || '0') * parseFloat(item.weight || '0'));
  }, 0);

  useEffect(() => {
    loadWorkouts();
  }, []);

  useEffect(() => {
    if (suggestionScrollRef.current) {
      suggestionScrollRef.current.scrollTo({ x: 0, animated: false });
    }
  }, [selectedCategory]);

  const loadWorkouts = async () => {
    try {
      const storedWorkouts = await AsyncStorage.getItem('@lenvry_workouts');
      if (storedWorkouts !== null) {
        setWorkouts(JSON.parse(storedWorkouts));
      }
    } catch (e) {
      console.error('Gagal memuat data', e);
    }
  };

  const saveWorkout = async () => {
    const isCardio = selectedCategory === 'Kardio';
    
    if (!exercise || !sets || !reps || (!isCardio && !weight)) {
      setWarningVisible(true);
      return;
    }

    const newWorkout: Workout = {
      id: Date.now().toString(),
      exercise: exercise.trim(),
      category: selectedCategory,
      sets,
      reps,
      weight: isCardio ? '0' : weight,
      date: new Date().toLocaleDateString(),
    };

    const updatedWorkouts = [newWorkout, ...workouts];

    try {
      await AsyncStorage.setItem('@lenvry_workouts', JSON.stringify(updatedWorkouts));
      setWorkouts(updatedWorkouts);
      
      setExercise(''); setSets(''); setReps(''); setWeight(''); setSelectedCategory(GYM_CATEGORIES[0]);
      Keyboard.dismiss();
      setModalVisible(false);
    } catch (e) {
      console.error('Gagal menyimpan data', e);
    }
  };

  const deleteWorkout = (id: string) => {
    Alert.alert(
      "Hapus Catatan?",
      "Catatan angkatan ini akan dihapus permanen.",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: async () => {
            const updatedWorkouts = workouts.filter(w => w.id !== id);
            setWorkouts(updatedWorkouts);
            await AsyncStorage.setItem('@lenvry_workouts', JSON.stringify(updatedWorkouts));
          } 
        }
      ]
    );
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Semua': return 'grid';
      case 'Dada': return 'body';
      case 'Punggung': return 'accessibility';
      case 'Kaki': return 'walk';
      case 'Bahu': return 'man';
      case 'Lengan': return 'barbell';
      case 'Inti': return 'fitness';
      case 'Kardio': return 'heart-circle';
      default: return 'barbell';
    }
  };

  const renderWorkoutItem = ({ item }: { item: Workout }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={styles.logIconContainer}>
          <Ionicons name={getCategoryIcon(item.category) as any} size={18} color="#D4FF00" />
        </View>
        <View style={styles.logTitleContainer}>
          <Text style={styles.logExercise} numberOfLines={1}>{item.exercise}</Text>
          <Text style={styles.logCategory}>{item.category}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteWorkout(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color="#FF453A" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.logDetailsRow}>
        <Text style={styles.statPill}>{item.sets} <Text style={styles.statUnit}>Sets</Text></Text>
        <Text style={styles.statDot}>•</Text>
        <Text style={styles.statPill}>{item.reps} <Text style={styles.statUnit}>Reps</Text></Text>
        
        {item.category !== 'Kardio' && (
          <>
            <Text style={styles.statDot}>•</Text>
            <Text style={[styles.statPill, styles.statHighlight]}>{item.weight} <Text style={styles.statUnitHighlight}>kg</Text></Text>
          </>
        )}
      </View>
    </View>
  );

  const filterOptions = ['Semua', ...GYM_CATEGORIES];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" translucent={true} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gym</Text>
          <Text style={styles.slogan}>No More Sitting Empty.</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterOptions.map((cat, index) => {
            const isLast = index === filterOptions.length - 1;
            return (
              <TouchableOpacity 
                key={cat} 
                style={[
                  styles.filterChip, 
                  activeFilter === cat && styles.filterChipActive,
                  isLast && { marginRight: 0 }
                ]}
                onPress={() => setActiveFilter(cat)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={getCategoryIcon(cat) as any} 
                  size={14} 
                  color={activeFilter === cat ? '#09090B' : '#A1A1AA'} 
                  style={styles.filterIcon}
                />
                <Text style={[styles.filterText, activeFilter === cat && styles.filterTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>30-Day Streak</Text>
          <View style={styles.volumeBadge}>
            <Text style={styles.volumeText}>{totalVolume.toLocaleString('id-ID')} kg Vol</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>Hari ke-1 dari 30 hari (Keep going!)</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: '3.3%' }]} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latihan Hari Ini</Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
        </Text>
      </View>
      
      <FlatList
        data={filteredWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={renderWorkoutItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color="#2A2A2A" />
            <Text style={styles.emptyText}>Belum ada latihan tercatat.</Text>
            <Text style={styles.emptySubText}>Klik tombol + di bawah untuk memulai.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color="#09090B" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.dismissArea} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catat Angkatan</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#3F3F46" />
              </TouchableOpacity>
            </View>
            
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              
              <Text style={styles.inputLabel}>KATEGORI</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingRight: 48 }}>
                {GYM_CATEGORIES.map(cat => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>NAMA GERAKAN</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Contoh: Bench Press, Squat..." 
                placeholderTextColor="#52525B" 
                value={exercise} 
                onChangeText={setExercise}
                autoCapitalize="words" 
              />

              <Text style={styles.inputLabel}>SARAN GERAKAN</Text>
              <ScrollView 
                ref={suggestionScrollRef}
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.suggestionScroll} 
                contentContainerStyle={{ paddingRight: 48 }}
              >
                {EXERCISE_SUGGESTIONS[selectedCategory].map(name => (
                  <TouchableOpacity key={name} style={styles.suggestionChip} onPress={() => setExercise(name)}>
                    <Text style={styles.suggestionText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <View style={styles.rowInput}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SETS</Text>
                  <TextInput style={styles.inputNumber} placeholder="0" placeholderTextColor="#52525B" keyboardType="numeric" value={sets} onChangeText={setSets} maxLength={2} />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>REPS</Text>
                  <TextInput style={styles.inputNumber} placeholder="0" placeholderTextColor="#52525B" keyboardType="numeric" value={reps} onChangeText={setReps} maxLength={3} />
                </View>
                
                {selectedCategory !== 'Kardio' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>BEBAN (KG)</Text>
                    <TextInput style={styles.inputNumber} placeholder="0" placeholderTextColor="#52525B" keyboardType="numeric" value={weight} onChangeText={setWeight} maxLength={4} />
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={saveWorkout} activeOpacity={0.8}>
                <Text style={styles.saveButtonText}>SIMPAN ANGKATAN</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={warningVisible} onRequestClose={() => setWarningVisible(false)}>
        <View style={styles.warningOverlay}>
          <View style={styles.warningContent}>
            <View style={styles.warningIconBox}>
              <Ionicons name="alert" size={32} color="#09090B" />
            </View>
            <Text style={styles.warningTitle}>Data Belum Lengkap</Text>
            <Text style={styles.warningMessage}>Pastikan kamu sudah mengisi nama gerakan, jumlah set, dan repetisi sebelum menyimpan.</Text>
            <TouchableOpacity style={styles.warningButton} onPress={() => setWarningVisible(false)}>
              <Text style={styles.warningButtonText}>MENGERTI</Text>
            </TouchableOpacity>
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
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, marginRight: 10 },
  filterChipActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  filterIcon: { marginRight: 6 },
  filterText: { color: '#A1A1AA', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#09090B', fontWeight: 'bold' },

  card: { backgroundColor: '#18181B', borderRadius: 20, padding: 20, marginBottom: 28, borderWidth: 1, borderColor: '#27272A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#FAFAFA' },
  volumeBadge: { backgroundColor: 'rgba(212, 255, 0, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  volumeText: { fontSize: 12, fontWeight: 'bold', color: '#D4FF00' },
  cardSubtitle: { fontSize: 13, color: '#A1A1AA', marginBottom: 16 },
  progressBarBackground: { height: 6, backgroundColor: '#27272A', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#D4FF00', borderRadius: 4 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FAFAFA' },
  dateText: { fontSize: 13, color: '#A1A1AA', fontWeight: '600', marginBottom: 2 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#FAFAFA', fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySubText: { color: '#71717A', fontSize: 13, marginTop: 8 },
  
  logCard: { backgroundColor: '#18181B', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#27272A' },
  logHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logIconContainer: { backgroundColor: 'rgba(212, 255, 0, 0.1)', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  logTitleContainer: { flex: 1 },
  logExercise: { fontSize: 16, fontWeight: 'bold', color: '#FAFAFA', marginBottom: 4 },
  logCategory: { fontSize: 12, color: '#A1A1AA', fontWeight: '500' },
  deleteButton: { padding: 8 },
  
  logDetailsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#09090B', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  statPill: { color: '#FAFAFA', fontSize: 14, fontWeight: 'bold' },
  statUnit: { fontSize: 12, color: '#71717A', fontWeight: 'normal' },
  statDot: { color: '#3F3F46', marginHorizontal: 12, fontSize: 16 },
  statHighlight: { color: '#D4FF00' },
  statUnitHighlight: { color: '#D4FF00', fontSize: 12, fontWeight: 'normal' },
  
  fab: { position: 'absolute', bottom: 32, right: 24, backgroundColor: '#D4FF00', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#D4FF00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  modalContent: { backgroundColor: '#18181B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%', borderWidth: 1, borderColor: '#27272A' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#3F3F46', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FAFAFA' },
  
  inputLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#09090B', color: '#FAFAFA', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, marginBottom: 24, fontSize: 15, borderWidth: 1, borderColor: '#27272A' },
  inputNumber: { backgroundColor: '#09090B', color: '#FAFAFA', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, fontSize: 18, fontWeight: 'bold', textAlign: 'center', borderWidth: 1, borderColor: '#27272A' },
  
  categoryScroll: { flexDirection: 'row', flexGrow: 0, marginBottom: 24, marginHorizontal: -24, paddingHorizontal: 24 },
  categoryChip: { backgroundColor: '#09090B', borderWidth: 1, borderColor: '#27272A', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginRight: 10 },
  categoryChipActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  categoryText: { color: '#A1A1AA', fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#09090B', fontWeight: 'bold' },

  suggestionScroll: { flexDirection: 'row', flexGrow: 0, marginBottom: 24, marginHorizontal: -24, paddingHorizontal: 24 },
  suggestionChip: { backgroundColor: '#27272A', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 8 },
  suggestionText: { color: '#FAFAFA', fontSize: 13, fontWeight: '500' },

  rowInput: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  inputGroup: { flex: 1, marginHorizontal: 6 },
  
  saveButton: { backgroundColor: '#D4FF00', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  saveButtonText: { color: '#09090B', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },

  warningOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  warningContent: { backgroundColor: '#18181B', borderRadius: 24, padding: 24, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#27272A' },
  warningIconBox: { backgroundColor: '#D4FF00', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  warningTitle: { color: '#FAFAFA', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  warningMessage: { color: '#A1A1AA', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  warningButton: { backgroundColor: '#27272A', paddingVertical: 16, borderRadius: 16, width: '100%', alignItems: 'center' },
  warningButtonText: { color: '#FAFAFA', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
});