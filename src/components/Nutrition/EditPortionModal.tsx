import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NutritionLog } from '../../types/nutrition';
import { COLORS, RADIUS } from '../../constants/theme';

interface EditPortionModalProps {
  visible: boolean;
  logItem: NutritionLog | null;
  onClose: () => void;
  onSave: (updatedLog: NutritionLog) => void;
}

export const EditPortionModal = ({
  visible,
  logItem,
  onClose,
  onSave,
}: EditPortionModalProps) => {
  if (!logItem) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <EditPortionContent logItem={logItem} onClose={onClose} onSave={onSave} />
    </Modal>
  );
};

function EditPortionContent({
  logItem,
  onClose,
  onSave,
}: {
  logItem: NutritionLog;
  onClose: () => void;
  onSave: (updatedLog: NutritionLog) => void;
}) {
  const baseGrams = Math.max(1, logItem.portionGrams || 100);
  const calPerGram = logItem.calories / baseGrams;
  const pPerGram = logItem.protein / baseGrams;
  const cPerGram = logItem.carbs / baseGrams;
  const fPerGram = logItem.fat / baseGrams;

  const [portionText, setPortionText] = useState(logItem.portionGrams.toString());

  const currentGrams = Math.max(1, parseInt(portionText, 10) || 1);
  const liveCals = Math.round(currentGrams * calPerGram);
  const liveP = Math.round(currentGrams * pPerGram * 10) / 10;
  const liveC = Math.round(currentGrams * cPerGram * 10) / 10;
  const liveF = Math.round(currentGrams * fPerGram * 10) / 10;

  const handleSave = () => {
    Keyboard.dismiss();
    onSave({
      ...logItem,
      portionGrams: currentGrams,
      servingDescription: `${currentGrams}g portion`,
      calories: liveCals,
      protein: liveP,
      carbs: liveC,
      fat: liveF,
    });
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.dismissArea} onPress={onClose} />

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.content}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Edit Portion Size</Text>
              <Text style={styles.subtitle}>{logItem.foodName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Portion Input Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.label}>PORTION WEIGHT (Gr.)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                keyboardType="numeric"
                value={portionText}
                onChangeText={setPortionText}
              />
              <Text style={styles.gramsLabel}>g</Text>
            </View>

            {/* Live Nutrients Card */}
            <View style={styles.liveNutrientsBox}>
              <View style={styles.liveNutrientItem}>
                <Text style={styles.liveNutrientLabel}>CALORIES</Text>
                <Text style={[styles.liveNutrientVal, { color: COLORS.nutrition }]}>{liveCals} kcal</Text>
              </View>

              <View style={styles.liveNutrientItem}>
                <Text style={styles.liveNutrientLabel}>PROTEIN</Text>
                <Text style={[styles.liveNutrientVal, { color: COLORS.protein }]}>{liveP}g</Text>
              </View>

              <View style={styles.liveNutrientItem}>
                <Text style={styles.liveNutrientLabel}>CARBS</Text>
                <Text style={[styles.liveNutrientVal, { color: COLORS.carbs }]}>{liveC}g</Text>
              </View>

              <View style={styles.liveNutrientItem}>
                <Text style={styles.liveNutrientLabel}>FAT</Text>
                <Text style={[styles.liveNutrientVal, { color: COLORS.fat }]}>{liveF}g</Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>UPDATE PORTION</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '700',
  },
  gramsLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  liveNutrientsBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
  },
  liveNutrientItem: {
    alignItems: 'center',
  },
  liveNutrientLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  liveNutrientVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: COLORS.nutrition,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#08090C',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
