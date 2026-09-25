import React from 'react';
import { Text, View, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fitnessStyles as styles } from '../../styles/fitnessStyles';

interface WarningModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function WarningModal({ visible, onClose }: WarningModalProps) {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlayCenter}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.warningBox}>
              <View style={styles.warningIconContainer}>
                <Ionicons name="alert" size={32} color="#FF6B00" />
              </View>
              <Text style={styles.warningTitle}>Incomplete Details</Text>
              <Text style={styles.warningMessage}>
                Please fill in the exercise name, sets, and target repetitions before saving this log.
              </Text>
              <TouchableOpacity style={[styles.primaryActionButton, { width: '100%' }]} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.primaryActionButtonText}>UNDERSTOOD</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}