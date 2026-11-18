import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NutritionTarget } from '../../types/nutrition';
import { nutritionStyles as styles } from '../../styles/nutritionStyles';
import { COLORS } from '../../constants/theme';
import { BottomSheetModalHost, BottomSheetSurface } from '../Common/BottomSheetModal';
import { KEEP_KEYBOARD_SCROLL_PROPS, useKeyboardAwareSheet } from '../../hooks/useKeyboardHeight';

interface TargetModalProps {
  visible: boolean;
  target: NutritionTarget;
  onClose: () => void;
  onSaveTarget: (target: NutritionTarget) => void;
}

export const TargetModal = ({
  visible,
  ...props
}: TargetModalProps) => {
  return (
    <BottomSheetModalHost visible={visible} onRequestClose={props.onClose}>
      {visible ? <TargetModalContent {...props} /> : null}
    </BottomSheetModalHost>
  );
};

function TargetModalContent({
  target,
  onClose,
  onSaveTarget,
}: Omit<TargetModalProps, 'visible'>) {
  const [calories, setCalories] = useState(target.calories.toString());
  const [protein, setProtein] = useState(target.protein.toString());
  const [carbs, setCarbs] = useState(target.carbs.toString());
  const [fat, setFat] = useState(target.fat.toString());
  const { keyboardOverlap, scrollBottomPadding, onOverlayLayout } = useKeyboardAwareSheet(28);

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleApplyPreset = (preset: { cals: number; p: number; c: number; f: number }) => {
    setCalories(preset.cals.toString());
    setProtein(preset.p.toString());
    setCarbs(preset.c.toString());
    setFat(preset.f.toString());
  };

  const handleSave = () => {
    const newTarget: NutritionTarget = {
      calories: Math.max(500, parseInt(calories, 10) || 2000),
      protein: Math.max(10, parseInt(protein, 10) || 120),
      carbs: Math.max(10, parseInt(carbs, 10) || 200),
      fat: Math.max(10, parseInt(fat, 10) || 60),
    };
    onSaveTarget(newTarget);
    onClose();
  };

  return (
    <BottomSheetSurface
      overlayStyle={styles.modalOverlay}
      sheetStyle={styles.modalContent}
      keyboardOverlap={keyboardOverlap}
      onOverlayLayout={onOverlayLayout}
      onBackdropPress={handleDismiss}
    >
      <View style={styles.modalHandle} />

          <View style={styles.modalHeaderRow}>
            <View>
              <Text style={styles.modalTitle}>Daily Goals</Text>
            </View>
            <TouchableOpacity onPress={handleDismiss} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            {...KEEP_KEYBOARD_SCROLL_PROPS}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
          >
            {/* Quick Presets */}
            <Text style={styles.formLabel}>QUICK PRESETS</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: COLORS.bgCardSub,
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                onPress={() => handleApplyPreset({ cals: 1800, p: 140, c: 175, f: 50 })}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.textPrimary }}>Fat Loss</Text>
                <Text style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>1,800 kcal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: COLORS.bgCardSub,
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                onPress={() => handleApplyPreset({ cals: 2100, p: 130, c: 240, f: 65 })}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.textPrimary }}>Maintain</Text>
                <Text style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>2,100 kcal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: COLORS.bgCardSub,
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                onPress={() => handleApplyPreset({ cals: 2600, p: 160, c: 320, f: 75 })}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.textPrimary }}>Bulking</Text>
                <Text style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>2,600 kcal</Text>
              </TouchableOpacity>
            </View>

            {/* Daily Calorie Goal */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>CALORIE BUDGET (KCAL)</Text>
              <TextInput
                style={styles.formInput}
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />
            </View>

            {/* Macros (Protein, Carbs, Fat) */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>PROTEIN (G)</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={protein}
                  onChangeText={setProtein}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>CARBS (G)</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={carbs}
                  onChangeText={setCarbs}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>FAT (G)</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={fat}
                  onChangeText={setFat}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.logSaveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.logSaveBtnText}>SAVE DAILY GOALS</Text>
            </TouchableOpacity>
          </ScrollView>
    </BottomSheetSurface>
  );
}
