import React from 'react';
import {
  View, Text, Modal, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { homeStyles as styles } from '../../styles/homeStyles';

interface SettingsModalProps {
  visible: boolean;
  tempName: string;
  onChangeTempName: (name: string) => void;
  onSaveName: () => void;
  onBackup: () => void;
  onRestore: () => void;
  onReset: () => void;
  onClose: () => void;
}

export default function SettingsModal({
  visible,
  tempName,
  onChangeTempName,
  onSaveName,
  onBackup,
  onRestore,
  onReset,
  onClose,
}: SettingsModalProps) {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.dismissArea} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color="#52525B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.settingsGroup}>
              <Text style={styles.inputGroupLabel}>USER PROFILE</Text>
              <View style={styles.profileInputRow}>
                <TextInput
                  style={styles.profileInput}
                  value={tempName}
                  onChangeText={onChangeTempName}
                  placeholder="Enter name..."
                  placeholderTextColor="#52525B"
                  maxLength={20}
                />
                <TouchableOpacity style={styles.saveNameBtn} onPress={onSaveName}>
                  <Text style={styles.saveNameBtnText}>SAVE</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={styles.inputGroupLabel}>DATA MANAGEMENT</Text>
              <TouchableOpacity style={styles.menuItem} onPress={onBackup} activeOpacity={0.7}>
                <View style={styles.menuIconBox}>
                  <Ionicons name="cloud-upload-outline" size={20} color="#D4FF00" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>Backup Data</Text>
                  <Text style={styles.menuItemDesc}>Export JSON archive to storage</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#3F3F46" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={onRestore} activeOpacity={0.7}>
                <View style={styles.menuIconBox}>
                  <Ionicons name="cloud-download-outline" size={20} color="#8E97FD" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>Restore Data</Text>
                  <Text style={styles.menuItemDesc}>Import and overwrite from backup file</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#3F3F46" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={styles.inputGroupLabel}>DANGER ZONE</Text>
              <TouchableOpacity style={styles.resetButton} onPress={onReset} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={18} color="#FF453A" style={{ marginRight: 8 }} />
                <Text style={styles.resetButtonText}>Wipe All App Data</Text>
              </TouchableOpacity>
              <Text style={styles.resetWarning}>
                Permanently deletes all fitness routines, habit history, and financial ledgers on this device.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}