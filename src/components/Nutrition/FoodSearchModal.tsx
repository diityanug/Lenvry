import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodCategory, FoodItem, MealType, NutritionLog } from '../../types/nutrition';
import {
  searchFoodsAsync,
  calculateNutrientsForWeight,
} from '../../services/nutritionDatabaseService';
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

  // Async filter food items from SQLite database
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    searchFoodsAsync(searchQuery, selectedCategory, customFoods)
      .then((results) => {
        if (isMounted) {
          setFilteredFoods(results);
        }
      })
      .catch((err) => {
        console.warn('Failed to query SQLite foods:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedCategory, customFoods]);

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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ width: '100%', justifyContent: 'flex-end' }}
      >
        <View style={[styles.modalContent, selectedFood && styles.modalContentPortion]}>
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
                      <Text style={styles.foodSearchTitle}>
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
              contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 160 : 28 }}
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

                <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Food Info Header Card */}
              <View
                style={{
                  backgroundColor: COLORS.bgCardSub,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, flex: 1, marginRight: 8 }} numberOfLines={2}>
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
              <View style={{ marginBottom: 18 }}>
                <Text style={[styles.adjusterLabel, { marginBottom: 10 }]}>SELECT MEAL</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {MEALS.map((m) => {
                    const isActive = activeMeal === m.type;
                    return (
                      <TouchableOpacity
                        key={m.type}
                        onPress={() => setActiveMeal(m.type)}
                        style={[
                          {
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: COLORS.bgCardSub,
                            borderWidth: 1.5,
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
                            { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
                            isActive && { color: COLORS.nutrition, fontWeight: '800' },
                          ]}
                        >
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Gram Portion Adjuster Card */}
              <View style={styles.portionAdjusterCard}>
                <View style={styles.portionHeaderRow}>
                  <Text style={styles.adjusterLabel}>PORTION SIZE / WEIGHT</Text>
                  {isKeyboardVisible && (
                    <TouchableOpacity
                      onPress={() => Keyboard.dismiss()}
                      style={styles.doneKeyboardBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.doneKeyboardBtnText}>Done ✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Gram Controls: Stepper - Input - Stepper */}
                <View style={styles.gramControlRow}>
                  <TouchableOpacity
                    onPress={() => adjustGramsBy(-25)}
                    style={styles.stepperBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="remove" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>

                  <View style={styles.gramInputWrapper}>
                    <TextInput
                      style={styles.gramInputLarge}
                      keyboardType="numeric"
                      value={portionGramsText}
                      onChangeText={setPortionGramsText}
                      maxLength={5}
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                      selectTextOnFocus
                    />
                    <Text style={styles.gramUnitSuffix}>g</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => adjustGramsBy(25)}
                    style={styles.stepperBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="add" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Quick Preset Buttons */}
                <View style={styles.quickServingGrid}>
                  {[
                    { label: '0.5x', grams: Math.round(selectedFood.defaultServingGrams * 0.5), action: () => handleQuickServing(0.5) },
                    { label: '1x', grams: selectedFood.defaultServingGrams, action: () => handleQuickServing(1.0) },
                    { label: '1.5x', grams: Math.round(selectedFood.defaultServingGrams * 1.5), action: () => handleQuickServing(1.5) },
                    { label: '2x', grams: Math.round(selectedFood.defaultServingGrams * 2.0), action: () => handleQuickServing(2.0) },
                    { label: '100g', grams: 100, action: () => setPortionGramsText('100') },
                  ].map((preset) => {
                    const isPresetActive = currentGrams === preset.grams;
                    return (
                      <TouchableOpacity
                        key={preset.label}
                        style={[
                          styles.quickServingPill,
                          isPresetActive && styles.quickServingPillActive,
                        ]}
                        onPress={preset.action}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.quickServingPillText,
                            isPresetActive && styles.quickServingPillTextActive,
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Total Nutrition Facts Card */}
              <View style={styles.nutritionPreviewSection}>
                <Text style={styles.adjusterLabel}>TOTAL NUTRITION FACTS</Text>
                
                {/* Calories Banner */}
                <View style={styles.calorieBannerBox}>
                  <View>
                    <Text style={styles.calorieBannerValue}>{liveNutrients.calories}</Text>
                    <Text style={styles.calorieBannerSub}>
                      {currentGrams}g portion ({(currentGrams / selectedFood.defaultServingGrams).toFixed(1)}x serving)
                    </Text>
                  </View>
                  <Text style={styles.calorieBannerUnit}>TOTAL KCAL</Text>
                </View>

                {/* Macro Pills Row */}
                <View style={styles.macroColumnsRow}>
                  <View style={[styles.macroPillBox, { borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
                    <Text style={[styles.macroPillVal, { color: COLORS.protein }]}>
                      {liveNutrients.protein}g
                    </Text>
                    <Text style={styles.macroPillName}>Protein</Text>
                  </View>

                  <View style={[styles.macroPillBox, { borderColor: 'rgba(59, 130, 246, 0.25)' }]}>
                    <Text style={[styles.macroPillVal, { color: COLORS.carbs }]}>
                      {liveNutrients.carbs}g
                    </Text>
                    <Text style={styles.macroPillName}>Carbs</Text>
                  </View>

                  <View style={[styles.macroPillBox, { borderColor: 'rgba(234, 179, 8, 0.25)' }]}>
                    <Text style={[styles.macroPillVal, { color: COLORS.fat }]}>
                      {liveNutrients.fat}g
                    </Text>
                    <Text style={styles.macroPillName}>Fat</Text>
                  </View>
                </View>
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity
                style={styles.logSaveBtn}
                onPress={handleConfirmLog}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#08090C" style={{ marginRight: 6 }} />
                <Text style={styles.logSaveBtnText}>
                  LOG {currentGrams}G TO {activeMealLabel.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
