import React, { useState, useEffect } from 'react';
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
  Dada: ['Bench Press', 'Incline Bench Press', 'Dumbbell Press', 'Chest Fly', 'Push Up', 'Dips', 'Cable Crossover', 'Decline Bench Press'],
  Punggung: ['Deadlift', 'Pull Up', 'Lat Pulldown', 'Barbell Row', 'Dumbbell Row', 'T-Bar Row', 'Seated Cable Row', 'Hyperextension'],
  Kaki: ['Squat', 'Leg Press', 'Leg Extension', 'Leg Curl', 'Lunges', 'Calf Raise', 'Romanian Deadlift', 'Hip Thrust'],
  Bahu: ['Overhead Press', 'Dumbbell Shoulder Press', 'Lateral Raise', 'Front Raise', 'Rear Delt Fly', 'Arnold Press', 'Upright Row', 'Shrug'],
  Lengan: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Tricep Pushdown', 'Tricep Extension', 'Skull Crusher', 'Preacher Curl', 'Close Grip Bench Press'],
  Inti: ['Plank', 'Sit Up', 'Crunch', 'Leg Raise', 'Russian Twist', 'Hanging Leg Raise', 'Cable Crunch', 'Ab Wheel Rollout'],
  Kardio: ['Treadmill', 'Sepeda Statis', 'Rowing Machine', 'Jump Rope', 'Elliptical', 'Stair Climber', 'Burpees', 'HIIT'],
};

export default function GymTracker() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState('Semua');
  
  const [exercise, setExercise] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(GYM_CATEGORIES[0]);
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const filteredWorkouts = activeFilter === 'Semua' 
    ? workouts 
    : workouts.filter(w => w.category === activeFilter);

  const totalVolume = filteredWorkouts.reduce((total, item) => {
    return total + (parseInt(item.sets || '0') * parseInt(item.reps || '0') * parseFloat(item.weight || '0'));
  }, 0);

  useEffect(() => {
    loadWorkouts();
  }, []);

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
    if (!exercise || !sets || !reps || !weight || !selectedCategory) {
      Alert.alert('Data Belum Lengkap', 'Pastikan semua kolom sudah diisi.');
      return;
    }

    const newWorkout: Workout = {
      id: Date.now().toString(),
      exercise: exercise.trim(),
      category: selectedCategory,
      sets,
      reps,
      weight,
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
          <Ionicons name={getCategoryIcon(item.category) as any} size={16} color="#121212" />
        </View>
        <View style={styles.logTitleContainer}>
          <Text style={styles.logExercise}>{item.exercise}</Text>
          <Text style={styles.logCategory}>{item.category}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteWorkout(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="#FF453A" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.logDetailsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SETS</Text>
          <Text style={styles.statValue}>{item.sets}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>REPS</Text>
          <Text style={styles.statValue}>{item.reps}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>BEBAN</Text>
          <Text style={styles.statValue}>{item.weight} <Text style={styles.statUnit}>kg</Text></Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>WakeMove</Text>
          <Text style={styles.slogan}>No More Sitting Empty.</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="person-circle" size={40} color="#1DB954" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['Semua', ...GYM_CATEGORIES].map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.filterChip, activeFilter === cat && styles.filterChipActive]}
              onPress={() => setActiveFilter(cat)}
            >
              <Ionicons 
                name={getCategoryIcon(cat) as any} 
                size={14} 
                color={activeFilter === cat ? '#121212' : '#A1A1AA'} 
                style={styles.filterIcon}
              />
              <Text style={[styles.filterText, activeFilter === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>30-Day Streak</Text>
          <Text style={styles.volumeText}>{totalVolume.toLocaleString('id-ID')} kg Vol.</Text>
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
            <Ionicons name="barbell-outline" size={64} color="#1E1E1E" />
            <Text style={styles.emptyText}>Belum ada latihan.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
        <Ionicons name="play" size={24} color="#121212" style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.dismissArea} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catat Angkatan</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              keyboardShouldPersistTaps="handled" 
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.inputLabel}>NAMA GERAKAN</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Contoh: Bench Press, Squat..." 
                placeholderTextColor="#666" 
                value={exercise} 
                onChangeText={setExercise}
                autoCapitalize="words" 
              />

              <Text style={styles.inputLabel}>KATEGORI</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {GYM_CATEGORIES.map(cat => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Ionicons 
                      name={getCategoryIcon(cat) as any} 
                      size={16} 
                      color={selectedCategory === cat ? '#121212' : '#A1A1AA'} 
                      style={styles.categoryIcon}
                    />
                    <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>SARAN GERAKAN</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionScroll}>
                {EXERCISE_SUGGESTIONS[selectedCategory].map(name => (
                  <TouchableOpacity 
                    key={name} 
                    style={styles.suggestionChip}
                    onPress={() => setExercise(name)}
                  >
                    <Text style={styles.suggestionText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <View style={styles.rowInput}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SETS</Text>
                  <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={sets} onChangeText={setSets} maxLength={2} />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>REPS</Text>
                  <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={reps} onChangeText={setReps} maxLength={3} />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>BEBAN (KG)</Text>
                  <TextInput style={styles.input} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" value={weight} onChangeText={setWeight} maxLength={4} />
                </View>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={saveWorkout} activeOpacity={0.8}>
                <Text style={styles.saveButtonText}>SIMPAN</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 16, paddingTop: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '900', color: '#1DB954', letterSpacing: -0.5 },
  slogan: { fontSize: 14, color: '#A1A1AA', marginTop: 4, fontWeight: '700' },
  profileBtn: { padding: 4 },
  
  filterContainer: { marginBottom: 24 },
  filterScroll: { paddingRight: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 32, marginRight: 8 },
  filterChipActive: { backgroundColor: '#1DB954' },
  filterIcon: { marginRight: 6 },
  filterText: { color: '#A1A1AA', fontSize: 14, fontWeight: '900' },
  filterTextActive: { color: '#121212' },

  card: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 24, marginBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  volumeText: { fontSize: 14, fontWeight: '900', color: '#1DB954', backgroundColor: 'rgba(29, 185, 84, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  cardSubtitle: { fontSize: 14, color: '#A1A1AA', marginBottom: 16, fontWeight: '700' },
  progressBarBackground: { height: 8, backgroundColor: '#2A2A2A', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#1DB954', borderRadius: 4 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  dateText: { fontSize: 14, color: '#A1A1AA', fontWeight: '700' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 48 },
  emptyText: { color: '#666666', fontSize: 16, fontWeight: '900', marginTop: 16 },
  
  logCard: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 16, marginBottom: 12 },
  logHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logIconContainer: { backgroundColor: '#1DB954', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logTitleContainer: { flex: 1 },
  logExercise: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  logCategory: { fontSize: 12, color: '#A1A1AA', fontWeight: '700', marginTop: 2 },
  deleteButton: { padding: 8 },
  
  logDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#121212', borderRadius: 8, padding: 16 },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { color: '#A1A1AA', fontSize: 12, fontWeight: '900', marginBottom: 4, letterSpacing: 0.5 },
  statValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  statUnit: { fontSize: 12, color: '#A1A1AA', fontWeight: '700' },
  
  fab: { position: 'absolute', bottom: 32, right: 24, backgroundColor: '#1DB954', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#1DB954', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  
  inputLabel: { color: '#A1A1AA', fontSize: 12, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: '#121212', color: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 8, marginBottom: 24, fontSize: 16, fontWeight: '700' },
  
  categoryScroll: { flexDirection: 'row', flexGrow: 0, marginBottom: 24 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 32, marginRight: 8 },
  categoryChipActive: { backgroundColor: '#1DB954' },
  categoryIcon: { marginRight: 6 },
  categoryText: { color: '#A1A1AA', fontSize: 14, fontWeight: '900' },
  categoryTextActive: { color: '#121212' },

  suggestionScroll: { flexDirection: 'row', flexGrow: 0, marginBottom: 24 },
  suggestionChip: { backgroundColor: '#121212', borderWidth: 1, borderColor: '#2A2A2A', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 32, marginRight: 8 },
  suggestionText: { color: '#1DB954', fontSize: 13, fontWeight: '900' },

  rowInput: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { flex: 1, marginHorizontal: 4 },
  
  saveButton: { backgroundColor: '#1DB954', paddingVertical: 16, borderRadius: 32, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#121212', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
});