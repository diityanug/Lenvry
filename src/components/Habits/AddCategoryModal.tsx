import React, { useState } from 'react';
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
import { COLORS, RADIUS } from '../../constants/theme';

interface AddCategoryModalProps {
  visible: boolean;
  onSave: (categoryName: string) => void;
  onClose: () => void;
}

export default function AddCategoryModal({
  visible,
  onSave,
  onClose,
}: AddCategoryModalProps) {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      {visible ? <AddCategoryContent onSave={onSave} onClose={onClose} /> : null}
    </Modal>
  );
}

function AddCategoryContent({
  onSave,
  onClose,
}: {
  onSave: (categoryName: string) => void;
  onClose: () => void;
}) {
  const [localText, setLocalText] = useState('');
  const [error, setError] = useState('');

  const handleDismissOverlay = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = () => {
    const trimmed = localText.trim();
    if (!trimmed) {
      setError('Please enter a category name.');
      return;
    }
    Keyboard.dismiss();
    onSave(trimmed);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 20 : 0}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={handleDismissOverlay}>
        <View style={modalStyles.overlayCenter}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={modalStyles.cardSmall}>
              <View style={modalStyles.iconWrap}>
                <Ionicons name="pricetag-outline" size={18} color={COLORS.success} />
              </View>

              <Text style={modalStyles.titleCenter}>New Category</Text>
              <Text style={modalStyles.subtitleCenter}>
                Organize your routine with a personalized category tag.
              </Text>

              <TextInput
                style={[
                  modalStyles.inputField,
                  Boolean(error) && { borderColor: COLORS.danger },
                ]}
                placeholder="e.g. Wellness, Career, Mindset..."
                placeholderTextColor={COLORS.textMuted}
                value={localText}
                onChangeText={(t) => {
                  setLocalText(t);
                  if (error) setError('');
                }}
                autoFocus={true}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />

              {error ? (
                <View style={modalStyles.errorRow}>
                  <Ionicons name="alert-circle" size={12} color={COLORS.danger} />
                  <Text style={modalStyles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={modalStyles.actionRow}>
                <TouchableOpacity
                  style={modalStyles.btnCancel}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={modalStyles.btnCancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={modalStyles.btnConfirm}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <Text style={modalStyles.btnConfirmText}>SAVE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const modalStyles = StyleSheet.create({
  overlayCenter: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardSmall: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 22,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.successSoft,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  titleCenter: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitleCenter: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 16,
  },
  inputField: {
    backgroundColor: COLORS.bgCardSub,
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    fontWeight: '600',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: COLORS.bgCardSub,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnCancelText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  btnConfirm: {
    flex: 1,
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  btnConfirmText: {
    color: '#08090C',
    fontSize: 12,
    fontWeight: '800',
  },
});