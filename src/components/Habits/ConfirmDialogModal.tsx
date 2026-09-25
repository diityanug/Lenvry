import React from 'react';
import { Text, View, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { ConfirmConfig } from '../../types/habits';
import { habitStyles as styles } from '../../styles/habitStyles';

interface ConfirmDialogModalProps {
  config: ConfirmConfig;
  onClose: () => void;
}

export default function ConfirmDialogModal({ config, onClose }: ConfirmDialogModalProps) {
  return (
    <Modal animationType="fade" transparent={true} visible={config.visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlayCenter}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContentSmall}>
              <Text style={styles.modalTitleCenter}>{config.title}</Text>
              <Text style={styles.modalSubtitleCenter}>{config.message}</Text>
              <View style={styles.dialogActionRow}>
                <TouchableOpacity style={styles.dialogBtnCancel} onPress={onClose} activeOpacity={0.7}>
                  <Text style={styles.dialogBtnCancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dialogBtnConfirm, config.isDestructive ? styles.btnDestructive : styles.btnNeutral]} 
                  onPress={config.onConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dialogBtnConfirmText, config.isDestructive ? styles.textDestructive : styles.textNeutral]}>
                    {config.confirmText.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}