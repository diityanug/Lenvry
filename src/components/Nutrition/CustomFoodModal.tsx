import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodCategory, FoodItem } from '../../types/nutrition';
import { nutritionStyles as styles } from '../../styles/nutritionStyles';
import { COLORS } from '../../constants/theme';

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
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={props.onClose}
      statusBarTranslucent={true}
    >
      {visible ? <CustomFoodContent {...props} /> : null}
    </Modal>
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const newFood: FoodItem = {
      id: `custom_${Date.now()}`,
      name: trimmed,
      indonesianName: trimmed,
      category,
      calories: Math.max(0, parseFloat(calories) || 0),
      protein: Math.max(0, parseFloat(protein) || 0),
      carbs: Math.max(0, parseFloat(carbs) || 0),
      fat: Math.max(0, parseFloat(fat) || 0),
      defaultServingGrams: Math.max(1, parseInt(servingGrams, 10) || 100),
      defaultServingText: servingText.trim() || '1 Serving (100g)',
      isCustom: true,
    };

    onSaveCustomFood(newFood);
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    onClose();
  };

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={styles.dismissArea} onPress={handleDismiss} />

      <View style={styles.modalContent}>
        <View style={styles.modalHandle} />

          <View style={styles.modalHeaderRow}>
            <View>
              <Text style={styles.modalTitle}>Add Custom Food</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Math.max(16, keyboardHeight + 16) }}
          >
            {/* Food Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>FOOD NAME</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Betawi Nasi Uduk, Whey Isolate Gold..."
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
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
                onChangeText={setCalories}
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
                  onChangeText={setProtein}
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
                  onChangeText={setCarbs}
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
                  onChangeText={setFat}
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
        </View>
      </View>
    );
  }
