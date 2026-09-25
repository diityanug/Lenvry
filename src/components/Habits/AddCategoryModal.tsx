import React from 'react';
import {
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddCategoryModalProps {
  visible: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function AddCategoryModal({
  visible,
  value,
  onChangeText,
  onSave,
  onClose,
}: AddCategoryModalProps) {
  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={modalStyles.overlayCenter}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={modalStyles.cardSmall}>
                <View style={modalStyles.iconWrap}>
                  <Ionicons name="pricetag-outline" size={20} color="#8E97FD" />
                </View>

                <Text style={modalStyles.titleCenter}>New Category</Text>
                <Text style={modalStyles.subtitleCenter}>
                  Organize your routine with a personalized category tag.
                </Text>

                <TextInput
                  style={modalStyles.inputField}
                  placeholder="e.g. Wellness, Career, Mindset..."
                  placeholderTextColor="#52525B"
                  value={value}
                  onChangeText={onChangeText}
                  autoFocus={true}
                />

                <View style={modalStyles.actionRow}>
                  <TouchableOpacity style={modalStyles.btnCancel} onPress={onClose} activeOpacity={0.7}>
                    <Text style={modalStyles.btnCancelText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={modalStyles.btnConfirm} onPress={onSave} activeOpacity={0.85}>
                    <Text style={modalStyles.btnConfirmText}>SAVE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardSmall: {
    backgroundColor: '#18181B',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(142, 151, 253, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(142, 151, 253, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  titleCenter: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FAFAFA',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleCenter: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 16,
  },
  inputField: {
    backgroundColor: '#09090B',
    color: '#FAFAFA',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 18,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#27272A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#FAFAFA',
    fontSize: 12,
    fontWeight: '700',
  },
  btnConfirm: {
    flex: 1,
    backgroundColor: '#8E97FD',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnConfirmText: {
    color: '#09090B',
    fontSize: 12,
    fontWeight: '800',
  },
});