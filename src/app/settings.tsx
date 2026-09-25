import React, { useState, useCallback } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { settingsStyles as styles } from '../styles/settingsStyles';
import { TAB_BAR_HEIGHT } from '../constants/tabBar';
import { exportBackup, importRestore, clearAllAppData } from '../services/backupService';
import AppAlertModal, { AppAlertConfig } from '../components/Common/AppAlertModal';

const USERNAME_KEY = '@wakemove_user_name';

export default function SettingsScreen() {
  const [userName, setUserName] = useState('');
  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

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

  const loadUserData = async () => {
    try {
      const stored = await AsyncStorage.getItem(USERNAME_KEY);
      if (stored) {
        setUserName(stored);
      }
    } catch (e) {
      console.error('Failed to load user name', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const handleSaveName = async () => {
    const trimmed = userName.trim();
    if (!trimmed) {
      showAlert('warning', 'Empty Name', 'Please provide a valid display name.');
      return;
    }
    try {
      await AsyncStorage.setItem(USERNAME_KEY, trimmed);
      Keyboard.dismiss();
      showAlert('success', 'Profile Updated', 'Your profile name has been saved.');
    } catch (e) {
      showAlert('danger', 'Error', 'Failed to save profile name.');
    }
  };

  const handleResetSuccess = () => {
    setUserName('User');
    showAlert('danger', 'Data Cleared', 'All local application records have been reset.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" translucent={true} />

      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Preferences & Local Data Management</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>User Profile</Text>
          <View style={styles.card}>
            <View style={styles.profileInputRow}>
              <TextInput
                style={styles.profileInput}
                value={userName}
                onChangeText={setUserName}
                placeholder="Enter display name..."
                placeholderTextColor="#52525B"
                maxLength={20}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName} activeOpacity={0.8}>
                <Text style={styles.saveBtnText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data Management</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemSpacing]}
              onPress={exportBackup}
              activeOpacity={0.7}
            >
              <View style={styles.iconBox}>
                <Ionicons name="cloud-upload-outline" size={20} color="#D4FF00" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Backup Data</Text>
                <Text style={styles.menuDesc}>Export JSON archive to storage</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#3F3F46" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => importRestore(loadUserData)}
              activeOpacity={0.7}
            >
              <View style={styles.iconBox}>
                <Ionicons name="cloud-download-outline" size={20} color="#8E97FD" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Restore Data</Text>
                <Text style={styles.menuDesc}>Import and overwrite from backup file</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#3F3F46" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATA MAINTENANCE</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() =>
                showAlert(
                  'danger',
                  'Wipe All App Data?',
                  'This action permanently deletes all workouts, habits, and financial ledgers.',
                  'WIPE DATA',
                  'CANCEL',
                  () => clearAllAppData(handleResetSuccess)
                )
              }
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color="#FF453A" />
              <Text style={styles.resetButtonText}>Clear All Data</Text>
            </TouchableOpacity>
            <Text style={styles.resetWarning}>
              Permanently deletes all fitness routines, habit history, and financial ledgers on this device.
            </Text>
          </View>
        </View>
      </ScrollView>

      <AppAlertModal config={alertConfig} onClose={closeAlert} />
    </SafeAreaView>
  );
}