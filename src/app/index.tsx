import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, SafeAreaView, ScrollView, 
  TouchableOpacity, StatusBar, Modal, Alert, Platform 
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);

  const today = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });

  // Mockup fungsi Backup
  const handleBackup = () => {
    Alert.alert(
      "Fitur Segera Hadir", 
      "Nantinya fitur ini akan mengekspor semua data latihan dan keuanganmu menjadi file yang bisa disimpan di HP untuk dipindahkan ke perangkat lain."
    );
  };

  // Mockup fungsi Restore
  const handleRestore = () => {
    Alert.alert(
      "Fitur Segera Hadir", 
      "Nantinya kamu bisa memilih file backup dari HP lamamu untuk mengembalikan semua data ke aplikasi ini."
    );
  };

  const handleResetData = () => {
    Alert.alert(
      "Reset Semua Data?",
      "Apakah kamu yakin ingin menghapus semua data? Tindakan ini tidak bisa dibatalkan.",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Ya, Hapus", 
          style: "destructive", 
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              await AsyncStorage.multiRemove(keys);
              Alert.alert("Berhasil", "Semua data telah dikosongkan.");
              setSettingsModalVisible(false);
            } catch (error) {
              Alert.alert("Error", "Terjadi kesalahan saat menghapus data.");
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" translucent={true} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header & Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Halo, Aditya</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          
          {/* Ubah Icon Person menjadi Settings */}
          <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsModalVisible(true)} activeOpacity={0.8}>
            <Ionicons name="settings-sharp" size={22} color="#121212" />
          </TouchableOpacity>
        </View>

        {/* Highlight / Pengingat Utama */}
        <View style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <View style={styles.focusIconBg}>
              <Ionicons name="flame" size={18} color="#FF453A" />
            </View>
            <Text style={styles.focusTitle}>Fokus Hari Ini</Text>
          </View>
          <Text style={styles.focusTask}>
            Jangan lupa selesaikan jadwal <Text style={{color: '#FFF', fontWeight: 'bold'}}>Push Day</Text> dan catat pengeluaran makan siangmu!
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Ringkasan WakeMove</Text>

        {/* Grid Summary */}
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/gym' as Href)} activeOpacity={0.8}>
            <View style={styles.cardTop}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 255, 0, 0.1)' }]}>
                <FontAwesome5 name="dumbbell" size={18} color="#D4FF00" />
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
            <Text style={styles.cardTitle}>Gym Tracker</Text>
            <Text style={styles.cardDesc}>Jadwal hari ini: Push Day (4 Latihan)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/habit' as Href)} activeOpacity={0.8}>
            <View style={styles.cardTop}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}>
                <FontAwesome5 name="check-square" size={18} color="#4ADE80" />
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
            <Text style={styles.cardTitle}>Habit Tracker</Text>
            <Text style={styles.cardDesc}>2 dari 5 kebiasaan harian selesai.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/finance' as Href)} activeOpacity={0.8}>
            <View style={styles.cardTop}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(96, 165, 250, 0.1)' }]}>
                <FontAwesome5 name="wallet" size={18} color="#60A5FA" />
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
            <Text style={styles.cardTitle}>Finance Tracker</Text>
            <Text style={styles.cardDesc}>Pengeluaran hari ini: Rp 45.000</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- MODAL PENGATURAN --- */}
      <Modal animationType="slide" transparent={true} visible={isSettingsModalVisible} onRequestClose={() => setSettingsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pengaturan</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#3F3F46" />
              </TouchableOpacity>
            </View>

            {/* Menu Backup & Restore */}
            <View style={styles.settingsGroup}>
              <Text style={styles.sectionLabel}>MANAJEMEN DATA</Text>
              
              <TouchableOpacity style={styles.menuItem} onPress={handleBackup} activeOpacity={0.7}>
                <View style={styles.menuIconBox}>
                  <Ionicons name="cloud-upload-outline" size={22} color="#D4FF00" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>Backup Data</Text>
                  <Text style={styles.menuItemDesc}>Simpan data ke perangkat ini</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#3F3F46" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleRestore} activeOpacity={0.7}>
                <View style={styles.menuIconBox}>
                  <Ionicons name="cloud-download-outline" size={22} color="#4ADE80" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>Restore Data</Text>
                  <Text style={styles.menuItemDesc}>Pulihkan dari file backup</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#3F3F46" />
              </TouchableOpacity>
            </View>

            {/* Area Setting / Danger Zone */}
            <View style={styles.settingsGroup}>
              <Text style={styles.sectionLabel}>ZONA BERBAHAYA</Text>
              <TouchableOpacity style={styles.resetButton} onPress={handleResetData} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={20} color="#FF453A" style={{ marginRight: 8 }} />
                <Text style={styles.resetButtonText}>Reset Semua Data Aplikasi</Text>
              </TouchableOpacity>
              <Text style={styles.resetWarning}>
                Menghapus seluruh catatan (Gym, Habit, Finance) di perangkat ini secara permanen.
              </Text>
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
    backgroundColor: '#0D0D0D',
    // SOLUSI HEADER TERLALU KEATAS: 
    // Di Android akan otomatis menambah padding setinggi status bar, di iOS 0 (karena SafeAreaView iOS sudah handle)
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24, // Sedikit jarak tambahan dari ujung status bar
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    marginTop: 4,
  },
  settingsBtn: {
    backgroundColor: '#D4FF00',
    width: 44,
    height: 44,
    borderRadius: 14, // Dibuat sedikit kotak membulat agar lebih terlihat seperti tombol gear
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  focusIconBg: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  focusTitle: {
    color: '#FF453A',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  focusTask: {
    color: '#A1A1AA',
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  gridContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#888',
  },

  // --- STYLE UNTUK MODAL PENGATURAN ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#3F3F46',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FAFAFA',
  },
  settingsGroup: {
    marginBottom: 32,
  },
  sectionLabel: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090B',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  menuIconBox: {
    backgroundColor: '#18181B',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  menuItemDesc: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  resetButtonText: {
    color: '#FF453A',
    fontSize: 15,
    fontWeight: 'bold',
  },
  resetWarning: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
  }
});