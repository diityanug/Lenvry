import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform, Keyboard,
  Alert, ScrollView, TouchableWithoutFeedback, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// --- TYPES ---
interface FoodItem {
  id: string; name: string; calories: number; protein: number; carbs: number; fat: number; serving: string;
}
interface ConsumedFood extends FoodItem {
  logId: string; timestamp: string;
}
interface Ingredient {
  id: string; name: string; calories: number; protein: number; carbs: number; fat: number;
}
interface SelectedIngredient {
  rowId: string; ingredientId: string; grams: string;
}

// --- DATABASE LAUK MATANG (Estimasi 100g) ---
const INGREDIENT_DATABASE: Ingredient[] = [
  { id: 'i1', name: 'Nasi Putih', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: 'i2', name: 'Mie Goreng', calories: 280, protein: 8, carbs: 40, fat: 10 },
  { id: 'i4', name: 'Ayam Goreng Tepung', calories: 320, protein: 14, carbs: 16, fat: 21 },
  { id: 'i5', name: 'Ayam Bakar', calories: 200, protein: 20, carbs: 10, fat: 9 },
  { id: 'i8', name: 'Telur Dadar/Ceplok', calories: 200, protein: 14, carbs: 2, fat: 15 },
  { id: 'i10', name: 'Tempe Goreng', calories: 250, protein: 15, carbs: 10, fat: 18 },
  { id: 'i12', name: 'Sayur Sop/Bening', calories: 40, protein: 2, carbs: 5, fat: 1 },
  { id: 'i15', name: 'Sambal', calories: 150, protein: 2, carbs: 10, fat: 12 },
  { id: 'i16', name: 'Kerupuk', calories: 400, protein: 3, carbs: 65, fat: 15 },
];

const TARGET_CALORIES = 2200;
const TARGET_PROTEIN = 120;
const TARGET_CARBS = 250;
const TARGET_FAT = 70;

export default function NutritionTracker() {
  const [logs, setLogs] = useState<ConsumedFood[]>([]);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeTab, setActiveTab] = useState<'search' | 'new'>('search');
  const [newFoodName, setNewFoodName] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  
  // State untuk Fitur AI Scan
  const [isScanning, setIsScanning] = useState(false);

  const totalCalories = logs.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = logs.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = logs.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = logs.reduce((sum, item) => sum + item.fat, 0);

  const allFoods = [...customFoods]; // Disederhanakan untuk contoh
  const filteredFoods = allFoods.filter(food => food.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const draftTotals = selectedIngredients.reduce((acc, row) => {
    const ing = INGREDIENT_DATABASE.find(i => i.id === row.ingredientId);
    if (!ing) return acc;
    const factor = (parseFloat(row.grams) || 0) / 100;
    return {
      calories: acc.calories + ing.calories * factor,
      protein: acc.protein + ing.protein * factor,
      carbs: acc.carbs + ing.carbs * factor,
      fat: acc.fat + ing.fat * factor,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => { loadLogs(); loadCustomFoods(); }, []);

  const loadLogs = async () => {
    const stored = await AsyncStorage.getItem('@lenvry_nutrition_logs');
    if (stored) setLogs(JSON.parse(stored));
  };

  const loadCustomFoods = async () => {
    const stored = await AsyncStorage.getItem('@lenvry_custom_foods');
    if (stored) setCustomFoods(JSON.parse(stored));
  };

  const addFoodToLog = async (food: FoodItem) => {
    const newLog: ConsumedFood = { ...food, logId: Date.now().toString(), timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) };
    const updated = [newLog, ...logs];
    setLogs(updated); await AsyncStorage.setItem('@lenvry_nutrition_logs', JSON.stringify(updated));
    setSearchQuery(''); Keyboard.dismiss(); setModalVisible(false);
  };

  const deleteLog = async (logId: string) => {
    const updated = logs.filter(log => log.logId !== logId);
    setLogs(updated); await AsyncStorage.setItem('@lenvry_nutrition_logs', JSON.stringify(updated));
  };

  const addIngredientRow = (ingredientId: string) => {
    setSelectedIngredients(prev => [...prev, { rowId: Date.now().toString(), ingredientId, grams: '100' }]);
  };
  const updateIngredientGrams = (rowId: string, grams: string) => {
    setSelectedIngredients(prev => prev.map(r => (r.rowId === rowId ? { ...r, grams } : r)));
  };
  const removeIngredientRow = (rowId: string) => {
    setSelectedIngredients(prev => prev.filter(r => r.rowId !== rowId));
  };

  const confirmNewFood = async () => {
    if (!newFoodName.trim() || selectedIngredients.length === 0) { Alert.alert('Error', 'Isi nama dan minimal 1 lauk.'); return; }
    const totalGrams = selectedIngredients.reduce((sum, r) => sum + (parseFloat(r.grams) || 0), 0);
    const newFood: FoodItem = {
      id: 'c' + Date.now().toString(), name: newFoodName.trim(), serving: `${Math.round(totalGrams)}g`,
      calories: Math.round(draftTotals.calories), protein: Math.round(draftTotals.protein * 10) / 10,
      carbs: Math.round(draftTotals.carbs * 10) / 10, fat: Math.round(draftTotals.fat * 10) / 10,
    };
    const updated = [newFood, ...customFoods];
    setCustomFoods(updated); await AsyncStorage.setItem('@lenvry_custom_foods', JSON.stringify(updated));
    await addFoodToLog(newFood);
    setSelectedIngredients([]); setNewFoodName(''); setActiveTab('search');
  };

  // ==========================================
  // FITUR AI SCAN PIRING (MOCKUP / TEMPLATE)
  // ==========================================
  const scanPiring = async () => {
    // 1. Minta izin akses galeri/kamera
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Izin Ditolak", "Butuh akses galeri untuk scan makanan.");
      return;
    }

    // 2. Buka Image Picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Kompres ukuran agar cepat dikirim ke API
      base64: true, // Butuh base64 untuk dikirim ke API Gemini
    });

    if (!result.canceled && result.assets[0].base64) {
      setIsScanning(true);
      
      // 3. DI SINI TEMPAT MEMANGGIL API AI GEMINI/OPENAI
      // Karena kita belum pasang API Key beneran, ini simulasi *loading* 2 detik
      // Seolah-olah AI sedang menganalisis gambar...
      
      setTimeout(() => {
        // Hasil dari AI ditaruh ke form secara otomatis
        setNewFoodName("Makan Siang (Hasil Scan AI) 🤖");
        
        // Misal AI mendeteksi gambar tersebut berisi Nasi, Ayam Tepung, dan Sayur
        setSelectedIngredients([
          { rowId: Date.now().toString() + '1', ingredientId: 'i1', grams: '150' }, // Nasi 150g
          { rowId: Date.now().toString() + '2', ingredientId: 'i4', grams: '120' }, // Ayam Tepung 120g
          { rowId: Date.now().toString() + '3', ingredientId: 'i12', grams: '80' }  // Sayur Sop 80g
        ]);
        
        setIsScanning(false);
        Alert.alert('AI Scan Berhasil!', 'AI mendeteksi Nasi Putih, Ayam Goreng, dan Sayur Sop dari fotomu.');
      }, 2500);
    }
  };

  const closeModal = () => { setModalVisible(false); setActiveTab('search'); setSelectedIngredients([]); setNewFoodName(''); };

  const MacroCard = ({ label, current, target, color }: { label: string, current: number, target: number, color: string }) => {
    const progress = Math.min((current / target) * 100, 100);
    return (
      <View style={styles.macroCard}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={[styles.macroValue, { color }]}>{Math.round(current)}<Text style={styles.macroTarget}>/{target}g</Text></Text>
        <View style={styles.macroBarBg}><View style={[styles.macroBarFill, { width: `${progress}%`, backgroundColor: color }]} /></View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.header}>
        <View><Text style={styles.greeting}>Lenvry</Text><Text style={styles.title}>Nutrition</Text></View>
        <TouchableOpacity style={styles.profileBtn}><Ionicons name="person" size={18} color="#121212" /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.heroCard}>
          <Text style={styles.balanceLabel}>KALORI KONSUMSI</Text>
          <View style={styles.calRow}>
            <Text style={styles.balanceAmount}>{totalCalories}</Text>
            <Text style={styles.summaryUnit}> / {TARGET_CALORIES} kcal</Text>
          </View>
          <View style={styles.sisaChip}><Text style={styles.sisaChipText}>Sisa {Math.max(TARGET_CALORIES - totalCalories, 0)} kcal</Text></View>
        </View>

        <View style={styles.macrosRow}>
          <MacroCard label="PROTEIN" current={totalProtein} target={TARGET_PROTEIN} color="#4ADE80" />
          <MacroCard label="KARBO" current={totalCarbs} target={TARGET_CARBS} color="#60A5FA" />
          <MacroCard label="LEMAK" current={totalFat} target={TARGET_FAT} color="#FBBF24" />
        </View>

        <Text style={styles.sectionTitle}>Makanan Hari Ini</Text>
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color="#2A2A2A" />
            <Text style={styles.emptyText}>Belum ada makanan tercatat.</Text>
            <Text style={styles.emptySubText}>Bahan bakar untuk pergerakanmu hari ini.</Text>
          </View>
        ) : (
          logs.map((item) => (
            <View key={item.logId} style={styles.logCard}>
              <View style={styles.iconContainer}><Ionicons name="fast-food" size={20} color="#D4FF00" /></View>
              <View style={styles.logInfo}>
                <Text style={styles.logName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.logDetails}>P: {item.protein}g • K: {item.carbs}g • L: {item.fat}g</Text>
                <Text style={styles.logTime}>{item.serving} — {item.timestamp}</Text>
              </View>
              <View style={styles.logRight}>
                <Text style={styles.logCal}>{item.calories} <Text style={{fontSize: 10, color: '#888'}}>kcal</Text></Text>
                <TouchableOpacity onPress={() => deleteLog(item.logId)} style={styles.deleteBtn}><Ionicons name="trash" size={16} color="#FF453A" /></TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.floatingButton} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
        <FontAwesome5 name="plus" size={16} color="#121212" style={{ marginRight: 8 }} />
        <Text style={styles.floatingButtonText}>CATAT MAKANAN</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View style={styles.modalOverlayDismissArea} /></TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catat Makanan</Text>
              <TouchableOpacity onPress={closeModal}><Text style={styles.closeText}>Tutup</Text></TouchableOpacity>
            </View>

            <View style={styles.tabRow}>
              <TouchableOpacity style={[styles.tabButton, activeTab === 'search' && styles.tabButtonActive]} onPress={() => setActiveTab('search')}>
                <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>Riwayat Menu</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabButton, activeTab === 'new' && styles.tabButtonActive]} onPress={() => setActiveTab('new')}>
                <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>Buat & Scan Piring</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'search' ? (
              <>
                <View style={styles.searchBox}>
                  <Ionicons name="search" size={20} color="#888" style={{ marginRight: 10 }} />
                  <TextInput style={styles.searchInput} placeholder="Cari menu kreasimu sebelumnya..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
                </View>
                <FlatList data={filteredFoods} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.dbItem} onPress={() => addFoodToLog(item)}>
                      <View style={{flex: 1}}><Text style={styles.dbItemName}>{item.name}</Text><Text style={styles.dbItemDesc}>{item.serving} • P:{item.protein} K:{item.carbs} L:{item.fat}</Text></View>
                      <View style={{alignItems: 'flex-end'}}><Text style={styles.dbItemCal}>{item.calories} <Text style={{fontSize:10, color:'#888'}}>kcal</Text></Text></View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={styles.emptySearch}>Belum ada riwayat menu kreasi.</Text>}
                />
              </>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                
                {/* --- TOMBOL SCAN AI --- */}
                <TouchableOpacity style={styles.scanButton} onPress={scanPiring} disabled={isScanning}>
                  {isScanning ? (
                    <ActivityIndicator color="#D4FF00" size="small" style={{marginRight: 8}} />
                  ) : (
                    <Ionicons name="scan-circle" size={24} color="#D4FF00" style={{marginRight: 8}} />
                  )}
                  <Text style={styles.scanButtonText}>
                    {isScanning ? "AI SEDANG MENGANALISIS..." : "AUTO-SCAN DARI FOTO PIRING"}
                  </Text>
                </TouchableOpacity>
                {/* ---------------------- */}

                <Text style={styles.inputLabel}>NAMA KOMBO MAKANAN</Text>
                <TextInput style={styles.input} placeholder="Contoh: Makan Siang Warteg" placeholderTextColor="#666" value={newFoodName} onChangeText={setNewFoodName} />

                <Text style={styles.inputLabel}>ISI PIRINGMU (ESTIMASI 100g = 1 PORSI/POTONG)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ingredientPicker}>
                  {INGREDIENT_DATABASE.map(ing => (
                    <TouchableOpacity key={ing.id} style={styles.ingredientChip} onPress={() => addIngredientRow(ing.id)}>
                      <Ionicons name="add" size={14} color="#D4FF00" style={{ marginRight: 4 }} />
                      <Text style={styles.ingredientChipText}>{ing.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {selectedIngredients.length > 0 && (
                  <View style={styles.ingredientListBox}>
                    {selectedIngredients.map(row => {
                      const ing = INGREDIENT_DATABASE.find(i => i.id === row.ingredientId);
                      return (
                        <View key={row.rowId} style={styles.ingredientRow}>
                          <Text style={styles.ingredientRowName} numberOfLines={1}>{ing?.name}</Text>
                          <TextInput style={styles.ingredientGramInput} keyboardType="numeric" value={row.grams} onChangeText={(v) => updateIngredientGrams(row.rowId, v)} />
                          <Text style={styles.ingredientGramUnit}>g</Text>
                          <TouchableOpacity onPress={() => removeIngredientRow(row.rowId)} style={{padding:4}}><Ionicons name="close-circle" size={20} color="#FF453A" /></TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={styles.totalBox}>
                  <Text style={styles.draftLabel}>Total Kandungan Gizi:</Text>
                  <View style={styles.totalRow}>
                    <View style={styles.totalItem}><Text style={[styles.totalValue, {color: '#D4FF00'}]}>{Math.round(draftTotals.calories)}</Text><Text style={styles.totalLabel}>KCAL</Text></View>
                    <View style={styles.totalItem}><Text style={[styles.totalValue, {color: '#4ADE80'}]}>{Math.round(draftTotals.protein * 10) / 10}g</Text><Text style={styles.totalLabel}>PROTEIN</Text></View>
                    <View style={styles.totalItem}><Text style={[styles.totalValue, {color: '#60A5FA'}]}>{Math.round(draftTotals.carbs * 10) / 10}g</Text><Text style={styles.totalLabel}>KARBO</Text></View>
                    <View style={styles.totalItem}><Text style={[styles.totalValue, {color: '#FBBF24'}]}>{Math.round(draftTotals.fat * 10) / 10}g</Text><Text style={styles.totalLabel}>LEMAK</Text></View>
                  </View>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={confirmNewFood}>
                  <Text style={styles.saveButtonText}>SIMPAN MENU & CATAT</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', paddingHorizontal: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  greeting: { fontSize: 14, color: '#888', fontWeight: '600', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', marginTop: 2 },
  profileBtn: { backgroundColor: '#D4FF00', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  heroCard: { backgroundColor: '#1A1A1A', borderRadius: 24, padding: 24, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  balanceLabel: { color: '#888', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 8 },
  calRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  balanceAmount: { color: '#FFF', fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  summaryUnit: { fontSize: 16, color: '#888', fontWeight: 'bold' },
  sisaChip: { backgroundColor: 'rgba(212, 255, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212, 255, 0, 0.2)' },
  sisaChipText: { color: '#D4FF00', fontSize: 12, fontWeight: 'bold' },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  macroCard: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 14, marginHorizontal: 4, borderWidth: 1, borderColor: '#2A2A2A' },
  macroLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  macroValue: { fontSize: 16, fontWeight: '900', marginBottom: 10 },
  macroTarget: { fontSize: 11, color: '#666', fontWeight: 'bold' },
  macroBarBg: { height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubText: { color: '#666', textAlign: 'center', marginTop: 8, fontSize: 13 },
  logCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  iconContainer: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(212, 255, 0, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  logInfo: { flex: 1 },
  logName: { fontSize: 15, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  logDetails: { fontSize: 12, color: '#A1A1AA', marginBottom: 4 },
  logTime: { fontSize: 11, color: '#666' },
  logRight: { alignItems: 'flex-end', justifyContent: 'space-between', height: 44 },
  logCal: { fontSize: 15, fontWeight: '900', color: '#D4FF00' },
  deleteBtn: { padding: 4 },
  floatingButton: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#D4FF00', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#D4FF00', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  floatingButtonText: { color: '#121212', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalOverlayDismissArea: { flex: 1 },
  modalContent: { backgroundColor: '#121212', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '90%', borderWidth: 1, borderColor: '#2A2A2A' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  closeText: { color: '#D4FF00', fontWeight: 'bold', fontSize: 14 },
  tabRow: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 16, padding: 4, marginBottom: 24 },
  tabButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  tabButtonActive: { backgroundColor: 'rgba(212, 255, 0, 0.2)' },
  tabText: { color: '#888', fontSize: 13, fontWeight: 'bold' },
  tabTextActive: { color: '#D4FF00' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 16 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 15, paddingVertical: 16 },
  emptySearch: { color: '#666', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  dbItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  dbItemName: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  dbItemDesc: { color: '#888', fontSize: 12 },
  dbItemCal: { color: '#D4FF00', fontSize: 16, fontWeight: '900' },
  
  // SCAN BUTTON
  scanButton: { flexDirection: 'row', backgroundColor: 'rgba(212, 255, 0, 0.1)', borderWidth: 1, borderColor: '#D4FF00', paddingVertical: 14, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  scanButtonText: { color: '#D4FF00', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  inputLabel: { color: '#888', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 20, fontSize: 14 },
  ingredientPicker: { flexDirection: 'row', flexGrow: 0, marginBottom: 20 },
  ingredientChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  ingredientChipText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  ingredientListBox: { marginBottom: 20, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  ingredientRowName: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  ingredientGramInput: { width: 60, color: '#D4FF00', fontSize: 16, fontWeight: 'bold', textAlign: 'right', paddingVertical: 4, backgroundColor: '#121212', borderRadius: 8, paddingHorizontal: 8 },
  ingredientGramUnit: { color: '#888', fontSize: 14, marginLeft: 6, marginRight: 12 },
  totalBox: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 24 },
  draftLabel: { color: '#888', fontSize: 12, marginBottom: 16, fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalItem: { alignItems: 'center', flex: 1 },
  totalValue: { fontSize: 16, fontWeight: '900' },
  totalLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  saveButton: { backgroundColor: '#D4FF00', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#D4FF00', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  saveButtonText: { color: '#121212', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
});