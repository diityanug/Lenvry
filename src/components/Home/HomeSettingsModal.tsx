import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { homeStyles as styles } from '../../styles/homeStyles';
import { COLORS } from '../../constants/theme';
import { exportBackup, importRestore, clearAllAppData } from '../../services/backupService';
import AppAlertModal, { AppAlertConfig } from '../Common/AppAlertModal';

const USERNAME_KEY = '@wakemove_user_name';

interface HomeSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  currentUserName: string;
  onUserNameUpdated: (name: string) => void;
  onDataResetOrRestored: () => void;
}

export default function HomeSettingsModal({
  visible,
  onClose,
  currentUserName,
  onUserNameUpdated,
  onDataResetOrRestored,
}: HomeSettingsModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      {visible ? (
        <HomeSettingsContent
          onClose={onClose}
          currentUserName={currentUserName}
          onUserNameUpdated={onUserNameUpdated}
          onDataResetOrRestored={onDataResetOrRestored}
        />
      ) : null}
    </Modal>
  );
}

function HomeSettingsContent({
  onClose,
  currentUserName,
  onUserNameUpdated,
  onDataResetOrRestored,
}: Omit<HomeSettingsModalProps, 'visible'>) {
  const [userName, setUserName] = useState(currentUserName);
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

  const handleSaveName = async () => {
    const trimmed = userName.trim();
    if (!trimmed) {
      showAlert('warning', 'Empty Name', 'Please provide a valid display name.');
      return;
    }
    try {
      await AsyncStorage.setItem(USERNAME_KEY, trimmed);
      Keyboard.dismiss();
      onUserNameUpdated(trimmed);
      showAlert('success', 'Profile Updated', 'Your profile name has been saved.');
    } catch {
      showAlert('danger', 'Error', 'Failed to save profile name.');
    }
  };

  const handleBackup = async () => {
    const res = await exportBackup();
    if (!res.success && res.message) {
      showAlert('danger', 'Backup Failed', res.message);
    }
  };

  const handleRestore = async () => {
    const res = await importRestore(() => {
      onDataResetOrRestored();
    });
    if (res.success) {
      showAlert('success', 'Data Restored', 'All application data was restored successfully.');
    } else if (!res.canceled && res.message) {
      showAlert('danger', 'Restore Failed', res.message);
    }
  };

  const handlePromptClearData = () => {
    showAlert(
      'danger',
      'Wipe All App Data?',
      'This action permanently deletes all workouts, habits, nutrition logs, and financial records.',
      'WIPE DATA',
      'CANCEL',
      async () => {
        const res = await clearAllAppData();
        if (res.success) {
          setUserName('User');
          onUserNameUpdated('User');
          onDataResetOrRestored();
          setTimeout(() => {
            showAlert('success', 'Data Cleared', 'All local application records have been reset.');
          }, 150);
        } else {
          setTimeout(() => {
            showAlert('danger', 'Error', res.message || 'Failed to reset application data.');
          }, 150);
        }
      }
    );
  };

  const handleDismissOverlay = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <>
      <View style={styles.modalOverlay}>
        <Pressable
          style={styles.dismissArea}
          onPress={handleDismissOverlay}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Settings & Preferences</Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                  Manage profile and offline data backup
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              bounces={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Profile Section */}
              <View style={styles.settingsGroup}>
                <Text style={styles.inputGroupLabel}>Display Name</Text>
                <View style={styles.profileInputRow}>
                  <TextInput
                    style={styles.profileInput}
                    value={userName}
                    onChangeText={setUserName}
                    placeholder="Enter display name..."
                    placeholderTextColor={COLORS.textMuted}
                    maxLength={20}
                    autoCorrect={false}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                  />
                  <TouchableOpacity
                    style={styles.saveNameBtn}
                    onPress={handleSaveName}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveNameBtnText}>SAVE</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Data Management Section */}
              <View style={styles.settingsGroup}>
                <Text style={styles.inputGroupLabel}>Data Archive & Sync</Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleBackup}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconBox}>
                    <Ionicons name="cloud-upload-outline" size={18} color={COLORS.finance} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>Backup Data</Text>
                    <Text style={styles.menuItemDesc}>Export JSON archive to storage</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleRestore}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconBox}>
                    <Ionicons name="cloud-download-outline" size={18} color={COLORS.accent} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>Restore Data</Text>
                    <Text style={styles.menuItemDesc}>Import and overwrite from backup file</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Danger Zone */}
              <View style={styles.settingsGroup}>
                <Text style={[styles.inputGroupLabel, { color: COLORS.danger }]}>Maintenance</Text>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handlePromptClearData}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  <Text style={styles.resetButtonText}>Clear All Data</Text>
                </TouchableOpacity>
                <Text style={styles.resetWarning}>
                  Permanently deletes all fitness routines, nutrition logs, habits, and financial ledgers on this device.
                </Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>

      <AppAlertModal config={alertConfig} onClose={closeAlert} />
    </>
  );
}
