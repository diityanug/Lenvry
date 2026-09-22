import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform, Keyboard,
  Alert, ActivityIndicator, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

// --- TYPES ---
interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

interface ConsumedFood extends FoodItem {
  logId: string;
  timestamp: string;
}

interface DraftNutrition {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

// --- MOCK DATABASE MAKANAN (Bisa ditambah/di-fetch dari API nantinya) ---
const FOOD_DATABASE: FoodItem[] = [
  { id: 'f1', name: 'Nasi Putih', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: '100g' },
  { id: 'f2', name: 'Dada Ayam Rebus', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g' },
  { id: 'f3', name: 'Telur Rebus', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, serving: '1 Butir' },
  { id: 'f4', name: 'Tempe Goreng', calories: 193, protein: 11, carbs: 12, fat: 13, serving: '100g' },
  { id: 'f5', name: 'Pisang', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: '1 Buah Sedang' },
  { id: 'f6', name: 'Nasi Goreng', calories: 250, protein: 10, carbs: 35, fat: 8, serving: '1 Porsi' },
  { id: 'f7', name: 'Susu Sapi (Full Cream)', calories: 150, protein: 8, carbs: 12, fat: 8, serving: '250ml' },
  { id: 'f8', name: 'Mie Instan (Goreng)', calories: 380, protein: 8, carbs: 54, fat: 14, serving: '1 Bungkus' },
];

// --- DAILY TARGETS (Bisa di-setting user nantinya) ---
const TARGET_CALORIES = 2200;
const TARGET_PROTEIN = 120;
const TARGET_CARBS = 250;
const TARGET_FAT = 70;

// Ganti dengan URL backend/proxy milikmu yang memanggil Anthropic API di sisi server.
// JANGAN panggil api.anthropic.com langsung dari app dengan API key tertanam di client.
const AI_ESTIMATE_ENDPOINT = 'https://your-backend.example.com/api/estimate-nutrition';

export default function NutritionTracker() {
  const [logs, setLogs] = useState<ConsumedFood[]>([]);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeTab, setActiveTab] = useState<'search' | 'new'>('search');
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodServing, setNewFoodServing] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [draftFood, setDraftFood] = useState<DraftNutrition | null>(null);

  // Kalkulasi Total Nutrisi Hari Ini
  const totalCalories = logs.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = logs.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = logs.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = logs.reduce((sum, item) => sum + item.fat, 0);

  // Gabungan database bawaan + database custom hasil input user
  const allFoods = [...FOOD_DATABASE, ...customFoods];

  // Filter Database saat user ngetik pencarian
  const filteredFoods = allFoods.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadLogs();
    loadCustomFoods();
  }, []);

  const loadLogs = async () => {
    try {
      const storedLogs = await AsyncStorage.getItem('@lenvry_nutrition_logs');
      if (storedLogs !== null) {
        setLogs(JSON.parse(storedLogs));
      }
    } catch (e) {
      console.error('Gagal memuat log makanan', e);
    }
  };

  const loadCustomFoods = async () => {
    try {
      const storedCustom = await AsyncStorage.getItem('@lenvry_custom_foods');
      if (storedCustom !== null) {
        setCustomFoods(JSON.parse(storedCustom));
      }
    } catch (e) {
      console.error('Gagal memuat makanan custom', e);
    }
  };

  const addFoodToLog = async (food: FoodItem) => {
    const newLog: ConsumedFood = {
      ...food,
      logId: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    await AsyncStorage.setItem('@lenvry_nutrition_logs', JSON.stringify(updatedLogs));
    
    setSearchQuery('');
    Keyboard.dismiss();
    setModalVisible(false);
  };

  const deleteLog = async (logId: string) => {
    const updatedLogs = logs.filter(log => log.logId !== logId);
    setLogs(updatedLogs);
    await AsyncStorage.setItem('@lenvry_nutrition_logs', JSON.stringify(updatedLogs));
  };

  // Panggil backend proxy untuk minta estimasi nutrisi dari nama makanan
  const estimateNutritionWithAI = async () => {
    if (!newFoodName.trim()) {
      Alert.alert('Nama Kosong', 'Isi dulu nama makanannya.');
      return;
    }

    setEstimating(true);
    try {
      const response = await fetch(AI_ESTIMATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFoodName.trim(),
          serving: newFoodServing.trim() || '1 porsi',
        }),
      });

      if (!response.ok) throw new Error('Request gagal');

      const data = await response.json();

      setDraftFood({
        calories: String(Math.round(data.calories ?? 0)),
        protein: String(data.protein ?? 0),
        carbs: String(data.carbs ?? 0),
        fat: String(data.fat ?? 0),
      });
    } catch (e) {
      console.error('Estimasi AI gagal', e);
      Alert.alert('Estimasi Gagal', 'Tidak bisa mengambil estimasi otomatis. Isi nilainya manual di bawah.');
      setDraftFood({ calories: '0', protein: '0', carbs: '0', fat: '0' });
    } finally {
      setEstimating(false);
    }
  };

  // Simpan hasil draft (dari AI atau manual) sebagai makanan baru + langsung log
  const confirmDraftFood = async () => {
    if (!draftFood || !newFoodName.trim()) return;

    const newFood: FoodItem = {
      id: 'c' + Date.now().toString(),
      name: newFoodName.trim(),
      serving: newFoodServing.trim() || '1 porsi',
      calories: parseFloat(draftFood.calories) || 0,
      protein: parseFloat(draftFood.protein) || 0,
      carbs: parseFloat(draftFood.carbs) || 0,
      fat: parseFloat(draftFood.fat) || 0,
    };

    const updatedCustom = [newFood, ...customFoods];
    setCustomFoods(updatedCustom);
    await AsyncStorage.setItem('@lenvry_custom_foods', JSON.stringify(updatedCustom));

    await addFoodToLog(newFood);

    setDraftFood(null);
    setNewFoodName('');
    setNewFoodServing('');
    setActiveTab('search');
  };

  const closeModal = () => {
    setModalVisible(false);
    setActiveTab('search');
    setDraftFood(null);
    setNewFoodName('');
    setNewFoodServing('');
  };

  // Komponen Kartu Nutrisi Kecil (Protein, Karbo, Lemak)
  const MacroCard = ({ label, current, target, color }: { label: string, current: number, target: number, color: string }) => {
    const progress = Math.min((current / target) * 100, 100);
    return (
      <View style={styles.macroCard}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={[styles.macroValue, { color }]}>{Math.round(current)}<Text style={styles.macroTarget}> / {target}g</Text></Text>
        <View style={styles.macroBarBg}>
          <View style={[styles.macroBarFill, { width: `${progress}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  const renderFoodLog = ({ item }: { item: ConsumedFood }) => (
    <View style={styles.logCard}>
      <View style={styles.logInfo}>
        <Text style={styles.logName}>{item.name}</Text>
        <Text style={styles.logDetails}>
          {item.calories} kcal • P: {item.protein}g • K: {item.carbs}g • L: {item.fat}g
        </Text>
        <Text style={styles.logTime}>{item.serving} — Pukul {item.timestamp}</Text>
      </View>
      <TouchableOpacity onPress={() => deleteLog(item.logId)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color="#FF453A" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition</Text>
        <Text style={styles.slogan}>Bahan bakar untuk pergerakanmu.</Text>
      </View>

      {/* SUMMARY KCal */}
      <View style={styles.summaryCard}>
        <View style={styles.kcalRingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>KALORI MASUK</Text>
            <Text style={styles.summaryValue}>{totalCalories} <Text style={styles.summaryUnit}>kcal</Text></Text>
            <Text style={styles.summarySisa}>
              Sisa {Math.max(TARGET_CALORIES - totalCalories, 0)} kcal dari target {TARGET_CALORIES}
            </Text>
          </View>
          <View style={styles.iconCircle}>
            <Ionicons name="flame" size={32} color="#121212" />
          </View>
        </View>
      </View>

      {/* MACROS (Protein, Carbs, Fat) */}
      <View style={styles.macrosRow}>
        <MacroCard label="PROTEIN" current={totalProtein} target={TARGET_PROTEIN} color="#4ADE80" />
        <MacroCard label="KARBO" current={totalCarbs} target={TARGET_CARBS} color="#60A5FA" />
        <MacroCard label="LEMAK" current={totalFat} target={TARGET_FAT} color="#FBBF24" />
      </View>

      <Text style={styles.sectionTitle}>Makanan Hari Ini</Text>
      
      <FlatList
        data={logs}
        keyExtractor={(item) => item.logId}
        renderItem={renderFoodLog}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={60} color="#2A2A2A" />
            <Text style={styles.emptyText}>Belum ada makanan tercatat.</Text>
            <Text style={styles.emptySubText}>Yuk catat apa yang kamu makan hari ini!</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.floatingButton} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
        <FontAwesome5 name="plus" size={16} color="#121212" style={{ marginRight: 8 }} />
        <Text style={styles.floatingButtonText}>CATAT MAKANAN</Text>
      </TouchableOpacity>

      {/* MODAL PENCARIAN / TAMBAH MAKANAN */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catat Makanan</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.tabRow}>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'search' && styles.tabButtonActive]}
                onPress={() => setActiveTab('search')}
              >
                <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>Cari Database</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'new' && styles.tabButtonActive]}
                onPress={() => setActiveTab('new')}
              >
                <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>Tambah Menu Baru</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'search' ? (
              <>
                <View style={styles.searchBox}>
                  <Ionicons name="search" size={20} color="#A1A1AA" style={{ marginRight: 10 }} />
                  <TextInput 
                    style={styles.searchInput} 
                    placeholder="Ketik nama makanan (ex: Dada Ayam)..." 
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus={true}
                  />
                </View>

                <FlatList
                  data={filteredFoods}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: 400 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.dbItem} onPress={() => addFoodToLog(item)}>
                      <View>
                        <Text style={styles.dbItemName}>{item.name}</Text>
                        <Text style={styles.dbItemDesc}>{item.serving} • {item.calories} kcal</Text>
                      </View>
                      <Ionicons name="add-circle" size={28} color="#D4FF00" />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptySearch}>Makanan tidak ditemukan di database lokal.</Text>
                  }
                />
              </>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>NAMA MAKANAN</Text>
                <TextInput 
                  style={styles.newInput} 
                  placeholder="Contoh: Gado-gado" 
                  placeholderTextColor="#666"
                  value={newFoodName}
                  onChangeText={setNewFoodName}
                />

                <Text style={styles.inputLabel}>PORSI (OPSIONAL)</Text>
                <TextInput 
                  style={styles.newInput} 
                  placeholder="Contoh: 1 piring, 100g" 
                  placeholderTextColor="#666"
                  value={newFoodServing}
                  onChangeText={setNewFoodServing}
                />

                <TouchableOpacity 
                  style={styles.aiButton} 
                  onPress={estimateNutritionWithAI}
                  disabled={estimating}
                  activeOpacity={0.8}
                >
                  {estimating ? (
                    <ActivityIndicator color="#121212" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={18} color="#121212" style={{ marginRight: 8 }} />
                      <Text style={styles.aiButtonText}>Estimasi dengan AI</Text>
                    </>
                  )}
                </TouchableOpacity>

                {draftFood && (
                  <View style={styles.draftBox}>
                    <Text style={styles.draftLabel}>Hasil estimasi (bisa diedit sebelum disimpan):</Text>

                    <View style={styles.draftRow}>
                      <View style={styles.draftField}>
                        <Text style={styles.inputLabel}>KALORI</Text>
                        <TextInput 
                          style={styles.newInput} 
                          keyboardType="numeric" 
                          value={draftFood.calories} 
                          onChangeText={(v) => setDraftFood({ ...draftFood, calories: v })} 
                        />
                      </View>
                      <View style={styles.draftField}>
                        <Text style={styles.inputLabel}>PROTEIN (G)</Text>
                        <TextInput 
                          style={styles.newInput} 
                          keyboardType="numeric" 
                          value={draftFood.protein} 
                          onChangeText={(v) => setDraftFood({ ...draftFood, protein: v })} 
                        />
                      </View>
                    </View>

                    <View style={styles.draftRow}>
                      <View style={styles.draftField}>
                        <Text style={styles.inputLabel}>KARBO (G)</Text>
                        <TextInput 
                          style={styles.newInput} 
                          keyboardType="numeric" 
                          value={draftFood.carbs} 
                          onChangeText={(v) => setDraftFood({ ...draftFood, carbs: v })} 
                        />
                      </View>
                      <View style={styles.draftField}>
                        <Text style={styles.inputLabel}>LEMAK (G)</Text>
                        <TextInput 
                          style={styles.newInput} 
                          keyboardType="numeric" 
                          value={draftFood.fat} 
                          onChangeText={(v) => setDraftFood({ ...draftFood, fat: v })} 
                        />
                      </View>
                    </View>

                    <TouchableOpacity style={styles.confirmButton} onPress={confirmDraftFood} activeOpacity={0.8}>
                      <Text style={styles.confirmButtonText}>TAMBAHKAN KE LOG</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20, paddingTop: 50 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#D4FF00', letterSpacing: 0.5 },
  slogan: { fontSize: 14, color: '#A1A1AA', marginTop: 2, fontWeight: '500' },
  
  summaryCard: { backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  kcalRingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  summaryValue: { color: '#FFF', fontSize: 32, fontWeight: '900', marginBottom: 4 },
  summaryUnit: { fontSize: 16, color: '#D4FF00' },
  summarySisa: { color: '#888', fontSize: 12 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#D4FF00', justifyContent: 'center', alignItems: 'center' },

  macrosRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  macroCard: { flex: 1, backgroundColor: '#1E1E1E', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#2A2A2A', marginHorizontal: 4 },
  macroLabel: { color: '#A1A1AA', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  macroValue: { fontSize: 16, fontWeight: '900', marginBottom: 8 },
  macroTarget: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  macroBarBg: { height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 3 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubText: { color: '#666', textAlign: 'center', marginTop: 8, fontSize: 14 },
  
  logCard: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A', flexDirection: 'row', alignItems: 'center' },
  logInfo: { flex: 1 },
  logName: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  logDetails: { fontSize: 12, color: '#D4FF00', fontWeight: 'bold', marginBottom: 4 },
  logTime: { fontSize: 11, color: '#A1A1AA' },
  deleteBtn: { padding: 8 },
  
  floatingButton: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#D4FF00', paddingVertical: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  floatingButtonText: { color: '#121212', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, minHeight: '60%', maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },

  tabRow: { flexDirection: 'row', backgroundColor: '#121212', borderRadius: 14, padding: 4, marginBottom: 16 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabButtonActive: { backgroundColor: '#D4FF00' },
  tabText: { color: '#A1A1AA', fontSize: 13, fontWeight: 'bold' },
  tabTextActive: { color: '#121212' },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 16 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16, paddingVertical: 14 },
  
  dbItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#121212', padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  dbItemName: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  dbItemDesc: { color: '#A1A1AA', fontSize: 12 },
  emptySearch: { color: '#666', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },

  inputLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 8 },
  newInput: { backgroundColor: '#121212', color: '#FFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 16, fontSize: 15 },

  aiButton: { flexDirection: 'row', backgroundColor: '#D4FF00', paddingVertical: 14, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  aiButtonText: { color: '#121212', fontSize: 14, fontWeight: '900' },

  draftBox: { backgroundColor: '#121212', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 24 },
  draftLabel: { color: '#A1A1AA', fontSize: 12, marginBottom: 12 },
  draftRow: { flexDirection: 'row', marginHorizontal: -6 },
  draftField: { flex: 1, marginHorizontal: 6 },

  confirmButton: { backgroundColor: '#4ADE80', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  confirmButtonText: { color: '#121212', fontSize: 14, fontWeight: '900' },
});