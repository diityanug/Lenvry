import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { homeStyles as styles } from '../../styles/homeStyles';
import { COLORS } from '../../constants/theme';
import { exportBackup, importRestore, clearAllAppData, exportTransactionsCsv } from '../../services/backupService';
import { syncFoodSeedIfNeeded } from '../../services/foodSeedSyncService';
import AppAlertModal, { AppAlertConfig } from '../Common/AppAlertModal';
import { BottomSheetModalHost, BottomSheetSurface } from '../Common/BottomSheetModal';
import { KEEP_KEYBOARD_SCROLL_PROPS, useKeyboardAwareSheet } from '../../hooks/useKeyboardHeight';

interface HomeSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  currentUserName: string;
  onUserNameUpdated: (name: string) => Promise<boolean> | void;
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
    <BottomSheetModalHost visible={visible} onRequestClose={onClose}>
      {visible ? (
        <HomeSettingsContent
          onClose={onClose}
          currentUserName={currentUserName}
          onUserNameUpdated={onUserNameUpdated}
          onDataResetOrRestored={onDataResetOrRestored}
        />
      ) : null}
    </BottomSheetModalHost>
  );
}

function HomeSettingsContent({
  onClose,
  currentUserName,
  onUserNameUpdated,
  onDataResetOrRestored,
}: Omit<HomeSettingsModalProps, 'visible'>) {
  const [userName, setUserName] = useState(currentUserName);
  const [isSyncingFoodSeed, setIsSyncingFoodSeed] = useState(false);
  const { keyboardOverlap, scrollBottomPadding, onOverlayLayout } = useKeyboardAwareSheet(28);

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
      const updated = await onUserNameUpdated(trimmed);
      if (updated === false) {
        showAlert('danger', 'Error', 'Failed to save profile name.');
        return;
      }
      Keyboard.dismiss();
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

  const handleExportCsv = async () => {
    const res = await exportTransactionsCsv();
    if (res.success) {
      showAlert('success', 'CSV Exported', `Exported ${res.count || 0} financial transactions to CSV.`);
    } else if (res.message) {
      showAlert('danger', 'Export Failed', res.message);
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

  const handleSyncFoodDatabase = async () => {
    if (isSyncingFoodSeed) return;
    setIsSyncingFoodSeed(true);
    try {
      const res = await syncFoodSeedIfNeeded({ force: true });
      if (res.status === 'updated') {
        showAlert(
          'success',
          'Food Database Updated',
          `Synced version ${res.currentVersion} (${res.itemCount.toLocaleString()} items).`
        );
      } else if (res.status === 'up_to_date') {
        showAlert(
          'info',
          'Already Up to Date',
          `Food database is on version ${res.currentVersion} (${res.itemCount.toLocaleString()} items).`
        );
      } else {
        showAlert(
          'warning',
          'Sync Failed',
          res.errorMessage || 'Unable to reach remote food database.'
        );
      }
    } finally {
      setIsSyncingFoodSeed(false);
    }
  };

  const handlePromptClearData = () => {
    showAlert(
      'danger',
      'Wipe All App Data?',
      'This action permanently deletes all records.',
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
      <BottomSheetSurface
        overlayStyle={styles.modalOverlay}
        sheetStyle={styles.modalContent}
        keyboardOverlap={keyboardOverlap}
        onOverlayLayout={onOverlayLayout}
        onBackdropPress={handleDismissOverlay}
      >
        <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Settings & Preferences</Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                  Manage profile and data backup
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
              {...KEEP_KEYBOARD_SCROLL_PROPS}
              bounces={false}
              contentContainerStyle={{
                paddingBottom: scrollBottomPadding,
              }}
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
                <Text style={styles.inputGroupLabel}>Sync</Text>

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
                  onPress={handleExportCsv}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconBox}>
                    <Ionicons name="document-text-outline" size={18} color="#10B981" />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>Export Transactions (CSV)</Text>
                    <Text style={styles.menuItemDesc}>Download spreadsheet for Excel / Sheets</Text>
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

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleSyncFoodDatabase}
                  disabled={isSyncingFoodSeed}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconBox}>
                    <Ionicons name="sync-outline" size={18} color={COLORS.nutrition} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>Sync Food Database</Text>
                    <Text style={styles.menuItemDesc}>
                      {isSyncingFoodSeed
                        ? 'Checking remote food seed...'
                        : 'Update nutrition items over the air'}
                    </Text>
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
                  Permanently deletes all records on this device.
                </Text>
              </View>
            </ScrollView>
      </BottomSheetSurface>

      <AppAlertModal config={alertConfig} onClose={closeAlert} />
    </>
  );
}
