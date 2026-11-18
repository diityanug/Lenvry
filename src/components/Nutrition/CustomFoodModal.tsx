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
import { FoodCategory, FoodItem } from '../../types/nutrition';
import { nutritionStyles as styles } from '../../styles/nutritionStyles';
import { COLORS } from '../../constants/theme';
import { BottomSheetModalHost, BottomSheetSurface } from '../Common/BottomSheetModal';
import { KEEP_KEYBOARD_SCROLL_PROPS, useKeyboardAwareSheet } from '../../hooks/useKeyboardHeight';
import { generateId } from '../../utils/id';
import { parseNonNegativeDecimal, sanitizeDecimalInput } from '../../utils/math';

interface CustomFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveCustomFood: (food: FoodItem) => void;
}

const CATEGORIES: { key: FoodCategory; label: string }[] = [
  { key: 'Staples', label: 'Staples' },
  { key: 'Proteins', label: 'Proteins' },
  { key: 'Vegetables', label: 'Vegetables' },
  { key: 'Fruits', label: 'Fruits' },
  { key: 'Dairy & Drinks', label: 'Drinks' },
  { key: 'Snacks', label: 'Snacks' },
];

export const CustomFoodModal = ({
  visible,
  ...props
}: CustomFoodModalProps) => {
  return (
    <BottomSheetModalHost visible={visible} onRequestClose={props.onClose}>
      {visible ? <CustomFoodContent {...props} /> : null}
    </BottomSheetModalHost>
  );
};

function CustomFoodContent({
  onClose,
  onSaveCustomFood,
}: Omit<CustomFoodModalProps, 'visible'>) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Staples');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [servingGrams, setServingGrams] = useState('100');
  const [servingText, setServingText] = useState('1 Serving');
  const [nameError, setNameError] = useState('');
  const { keyboardOverlap, scrollBottomPadding, onOverlayLayout } = useKeyboardAwareSheet(28);

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Please enter a food name.');
      return;
    }

    const newFood: FoodItem = {
      id: generateId('custom'),
      name: trimmed,
      indonesianName: trimmed,
      category,
      calories: parseNonNegativeDecimal(calories, 0),
      protein: parseNonNegativeDecimal(protein, 0),
      carbs: parseNonNegativeDecimal(carbs, 0),
      fat: parseNonNegativeDecimal(fat, 0),
      defaultServingGrams: Math.max(1, parseInt(servingGrams, 10) || 100),
      defaultServingText: servingText.trim() || '1 Serving (100g)',
      isCustom: true,
    };

    onSaveCustomFood(newFood);
    setName('');
    setNameError('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
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
              <Text style={styles.modalTitle}>Add Custom Food</Text>
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
            {/* Food Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>FOOD NAME</Text>
              <TextInput
                style={[styles.formInput, Boolean(nameError) && { borderColor: COLORS.danger }]}
                placeholder="e.g. Betawi Nasi Uduk, Whey Isolate Gold..."
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (nameError) setNameError('');
                }}
              />
              {Boolean(nameError) && (
                <Text style={{ color: COLORS.danger, fontSize: 12, fontWeight: '600', marginTop: 6 }}>
                  {nameError}
                </Text>
              )}
            </View>

            {/* Category Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 4 }}>
                {CATEGORIES.map((c) => {
                  const isSelected = category === c.key;
                  return (
                    <TouchableOpacity
                      key={c.key}
                      style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                      onPress={() => setCategory(c.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Calories (per 100g) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>CALORIES (KCAL PER 100G)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 150"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={calories}
                onChangeText={(v) => setCalories(sanitizeDecimalInput(v))}
              />
            </View>

            {/* Macros row (Protein, Carbs, Fat per 100g) */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>PROTEIN (G)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={protein}
                  onChangeText={(v) => setProtein(sanitizeDecimalInput(v))}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>CARBS (G)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={carbs}
                  onChangeText={(v) => setCarbs(sanitizeDecimalInput(v))}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>FAT (G)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={fat}
                  onChangeText={(v) => setFat(sanitizeDecimalInput(v))}
                />
              </View>
            </View>

            {/* Serving description & grams */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1.4 }]}>
                <Text style={styles.formLabel}>SERVING UNIT</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 1 Plate, 1 Bowl, 1 Scoop"
                  placeholderTextColor={COLORS.textMuted}
                  value={servingText}
                  onChangeText={setServingText}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>PORTION (GR)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="100"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={servingGrams}
                  onChangeText={setServingGrams}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.logSaveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.logSaveBtnText}>SAVE TO LIBRARY</Text>
            </TouchableOpacity>
          </ScrollView>
    </BottomSheetSurface>
  );
}
