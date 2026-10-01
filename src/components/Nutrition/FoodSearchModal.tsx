import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  Keyboard,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodCategory, FoodItem, MealType, NutritionLog } from '../../types/nutrition';
import {
  searchFoodItems,
  calculateNutrientsForWeight,
} from '../../constants/nutritionDatabase';
import { nutritionStyles as styles } from '../../styles/nutritionStyles';
import { COLORS } from '../../constants/theme';

interface FoodSearchModalProps {
  visible: boolean;
  selectedDateStr: string;
  defaultMealType: MealType;
  customFoods: FoodItem[];
  onClose: () => void;
  onLogFood: (log: Omit<NutritionLog, 'id' | 'createdAt'>) => void;
  onOpenCreateCustom: () => void;
}

const CATEGORIES: { key: 'All' | FoodCategory; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'Staples', label: 'Staples' },
  { key: 'Proteins', label: 'Proteins' },
  { key: 'Vegetables', label: 'Vegetables' },
  { key: 'Fruits', label: 'Fruits' },
  { key: 'Dairy & Drinks', label: 'Drinks' },
  { key: 'Snacks', label: 'Snacks' },
  { key: 'Custom', label: 'My Foods' },
];

const MEALS: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'dinner', label: 'Dinner' },
  { type: 'snack', label: 'Snacks' },
];

export const FoodSearchModal = ({
  visible,
  ...props
}: FoodSearchModalProps) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={props.onClose}
      statusBarTranslucent={true}
    >
      {visible ? <FoodSearchContent {...props} /> : null}
    </Modal>
  );
};

function FoodSearchContent({
  selectedDateStr,
  defaultMealType,
  customFoods,
  onClose,
  onLogFood,
  onOpenCreateCustom,
}: Omit<FoodSearchModalProps, 'visible'>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | FoodCategory>('All');
  const [activeMeal, setActiveMeal] = useState<MealType>(defaultMealType);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionGramsText, setPortionGramsText] = useState('100');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Filter food items
  const filteredFoods = useMemo(() => {
    let list = searchFoodItems(searchQuery, customFoods);
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Custom') {
        list = list.filter((item) => item.isCustom);
      } else {
        list = list.filter((item) => item.category === selectedCategory);
      }
    }
    return list;
  }, [searchQuery, customFoods, selectedCategory]);

  const handleSelectFood = (item: FoodItem) => {
    Keyboard.dismiss();
    setSelectedFood(item);
    setPortionGramsText(item.defaultServingGrams.toString());
  };

  const currentGrams = Math.max(1, parseInt(portionGramsText, 10) || 100);
  const liveNutrients = selectedFood
    ? calculateNutrientsForWeight(selectedFood, currentGrams)
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const handleQuickServing = (multiplier: number) => {
    if (!selectedFood) return;
    const computed = Math.round(selectedFood.defaultServingGrams * multiplier);
    setPortionGramsText(computed.toString());
  };

  const adjustGramsBy = (delta: number) => {
    const nextVal = Math.max(5, currentGrams + delta);
    setPortionGramsText(nextVal.toString());
  };

  const handleConfirmLog = () => {
    if (!selectedFood) return;
    onLogFood({
      date: selectedDateStr,
      mealType: activeMeal,
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      portionGrams: currentGrams,
      servingDescription: `${currentGrams}g portion`,
      calories: liveNutrients.calories,
      protein: liveNutrients.protein,
      carbs: liveNutrients.carbs,
      fat: liveNutrients.fat,
    });
    setSelectedFood(null);
    setSearchQuery('');
    onClose();
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const activeMealLabel = MEALS.find((m) => m.type === activeMeal)?.label || 'Meal';

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={styles.dismissArea} onPress={handleDismiss} />

      <View style={styles.modalContent}>
        <View style={styles.modalHandle} />

          {/* VIEW MODE 1: SEARCH & SELECTION */}
          {!selectedFood ? (
            <>
              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Add Food</Text>
                  {!isKeyboardVisible && (
                    <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                      
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Meal Switcher Pills */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: isKeyboardVisible ? 8 : 14 }}>
                {MEALS.map((m) => {
                  const isActive = activeMeal === m.type;
                  return (
                    <TouchableOpacity
                      key={m.type}
                      onPress={() => setActiveMeal(m.type)}
                      style={[
                        {
                          flex: 1,
                          paddingVertical: isKeyboardVisible ? 5 : 8,
                          borderRadius: 10,
                          alignItems: 'center',
                          backgroundColor: COLORS.bgCardSub,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                        },
                        isActive && {
                          backgroundColor: COLORS.nutritionLight,
                          borderColor: COLORS.nutrition,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
                          isActive && { color: COLORS.nutrition, fontWeight: '800' },
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Search Bar & Custom Food Trigger */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: isKeyboardVisible ? 8 : 12 }}>
                <View style={[styles.searchBar, { flex: 1, marginBottom: 0 }]}>
                  <Ionicons name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search rice, chicken, eggs, beef, oats..."
                    placeholderTextColor={COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                      <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={onOpenCreateCustom}
                  style={{
                    backgroundColor: COLORS.bgCardSub,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 4,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={COLORS.nutrition} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.nutrition }}>Custom</Text>
                </TouchableOpacity>
              </View>

              {/* Category Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.categoryChipScroll, { flexShrink: 0 }, isKeyboardVisible && { marginBottom: 8 }]}
                contentContainerStyle={{ paddingRight: 16, paddingVertical: 4, alignItems: 'center' }}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory(cat.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Search Results List */}
              <FlatList
                data={filteredFoods}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                style={{
                  maxHeight: isKeyboardVisible ? windowHeight * 0.35 : windowHeight * 0.52,
                }}
                contentContainerStyle={{ paddingBottom: 16 }}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', paddingVertical: 36 }}>
                    <Ionicons name="restaurant-outline" size={36} color={COLORS.textMuted} />
                    <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 10 }}>
                      No Food Found
                    </Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                      Try another keyword or create a custom entry.
                    </Text>
                    <TouchableOpacity
                      onPress={onOpenCreateCustom}
                      style={{
                        marginTop: 14,
                        backgroundColor: COLORS.nutritionLight,
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: 'rgba(45, 212, 191, 0.3)',
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: COLORS.nutrition, fontSize: 12, fontWeight: '800' }}>
                        + Add Custom Food
                      </Text>
                    </TouchableOpacity>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.foodSearchRow}
                    onPress={() => handleSelectFood(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.foodSearchTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.foodSearchServing}>
                        Standard serving: {item.defaultServingText}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.foodSearchCals}>{item.calories} kcal</Text>
                      <Text style={styles.foodSearchMacros}>
                        P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          ) : (
            /* VIEW MODE 2: PORTION ADJUSTER & NUTRITION CALCULATION */
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              bounces={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* Back to list button */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <TouchableOpacity
                  onPress={() => setSelectedFood(null)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={18} color={COLORS.nutrition} />
                  <Text style={{ color: COLORS.nutrition, fontSize: 13, fontWeight: '700' }}>Choose Different Food</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Food Info Header Card */}
              <View
                style={{
                  backgroundColor: COLORS.bgCardSub,
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, flex: 1 }}>
                    {selectedFood.name}
                  </Text>
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>{selectedFood.category}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                  Standard serving: {selectedFood.defaultServingText} ({selectedFood.defaultServingGrams}g)
                </Text>
              </View>

              {/* Meal Target Selector */}
              <Text style={styles.adjusterLabel}>SELECT MEAL</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                {MEALS.map((m) => {
                  const isActive = activeMeal === m.type;
                  return (
                    <TouchableOpacity
                      key={m.type}
                      onPress={() => setActiveMeal(m.type)}
                      style={[
                        {
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 10,
                          alignItems: 'center',
                          backgroundColor: COLORS.bgCardSub,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                        },
                        isActive && {
                          backgroundColor: COLORS.nutritionLight,
                          borderColor: COLORS.nutrition,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
                          isActive && { color: COLORS.nutrition, fontWeight: '800' },
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Gram Portion Adjuster with Stepper */}
              <Text style={styles.adjusterLabel}>PORTION SIZE / WEIGHT</Text>
              <View style={styles.gramInputRow}>
                <TouchableOpacity
                  onPress={() => adjustGramsBy(-25)}
                  style={[styles.dateNavBtn, { width: 44, height: 44 }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>

                <TextInput
                  style={[styles.gramInput, { textAlign: 'center', fontSize: 18 }]}
                  keyboardType="numeric"
                  value={portionGramsText}
                  onChangeText={setPortionGramsText}
                  maxLength={5}
                />
                <Text style={styles.gramUnitText}>Grams</Text>

                <TouchableOpacity
                  onPress={() => adjustGramsBy(25)}
                  style={[styles.dateNavBtn, { width: 44, height: 44 }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Quick Preset Buttons */}
              <View style={styles.quickServingPills}>
                <TouchableOpacity
                  style={[styles.quickServingPill, currentGrams === Math.round(selectedFood.defaultServingGrams * 0.5) && styles.quickServingPillActive]}
                  onPress={() => handleQuickServing(0.5)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickServingPillText, currentGrams === Math.round(selectedFood.defaultServingGrams * 0.5) && styles.quickServingPillTextActive]}>
                    0.5 Serving
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickServingPill, currentGrams === selectedFood.defaultServingGrams && styles.quickServingPillActive]}
                  onPress={() => handleQuickServing(1.0)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickServingPillText, currentGrams === selectedFood.defaultServingGrams && styles.quickServingPillTextActive]}>
                    1 Serving
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickServingPill, currentGrams === Math.round(selectedFood.defaultServingGrams * 1.5) && styles.quickServingPillActive]}
                  onPress={() => handleQuickServing(1.5)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickServingPillText, currentGrams === Math.round(selectedFood.defaultServingGrams * 1.5) && styles.quickServingPillTextActive]}>
                    1.5 Serving
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickServingPill, currentGrams === 100 && styles.quickServingPillActive]}
                  onPress={() => setPortionGramsText('100')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickServingPillText, currentGrams === 100 && styles.quickServingPillTextActive]}>
                    100g
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Live Nutrient Preview Cards */}
              <Text style={[styles.adjusterLabel, { marginTop: 4 }]}>TOTAL NUTRITION FACTS</Text>
              <View style={styles.macroPreviewGrid}>
                <View style={styles.macroPreviewBox}>
                  <Text style={[styles.macroPreviewValue, { color: COLORS.nutrition }]}>
                    {liveNutrients.calories}
                  </Text>
                  <Text style={styles.macroPreviewLabel}>Calorie (kcal)</Text>
                </View>
                <View style={styles.macroPreviewBox}>
                  <Text style={[styles.macroPreviewValue, { color: COLORS.protein }]}>
                    {liveNutrients.protein}g
                  </Text>
                  <Text style={styles.macroPreviewLabel}>Protein</Text>
                </View>
                <View style={styles.macroPreviewBox}>
                  <Text style={[styles.macroPreviewValue, { color: COLORS.carbs }]}>
                    {liveNutrients.carbs}g
                  </Text>
                  <Text style={styles.macroPreviewLabel}>Carbs</Text>
                </View>
                <View style={styles.macroPreviewBox}>
                  <Text style={[styles.macroPreviewValue, { color: COLORS.fat }]}>
                    {liveNutrients.fat}g
                  </Text>
                  <Text style={styles.macroPreviewLabel}>Fat</Text>
                </View>
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity
                style={styles.logSaveBtn}
                onPress={handleConfirmLog}
                activeOpacity={0.85}
              >
                <Text style={styles.logSaveBtnText}>
                  LOG TO {activeMealLabel.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    );
  }
