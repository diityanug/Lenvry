import React from 'react';
import { 
  Text, View, Modal, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { habitStyles as styles } from '../../styles/habitStyles';

interface AddCategoryModalProps {
  visible: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function AddCategoryModal({ visible, value, onChangeText, onSave, onClose }: AddCategoryModalProps) {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlayCenter}>
        <View style={styles.modalContentSmall}>
          <Text style={styles.modalTitleCenter}>New Category</Text>
          <Text style={styles.modalSubtitleCenter}>Enter a name for your custom habit category</Text>
          <TextInput 
            style={styles.inputCenter} 
            placeholder="e.g. Wellness, Career..." 
            placeholderTextColor="#52525B" 
            value={value} 
            onChangeText={onChangeText} 
            autoFocus={true} 
          />
          <View style={styles.dialogActionRow}>
            <TouchableOpacity style={styles.dialogBtnCancel} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.dialogBtnCancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dialogBtnConfirm, styles.btnNeutral]} onPress={onSave} activeOpacity={0.8}>
              <Text style={[styles.dialogBtnConfirmText, styles.textNeutral]}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}