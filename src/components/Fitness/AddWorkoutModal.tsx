import React, { useRef, useState, useEffect } from 'react';
import {
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GYM_CATEGORIES, EXERCISE_SUGGESTIONS } from '../../constants/fitness';
import { fitnessStyles as styles } from '../../styles/fitnessStyles';
import { COLORS } from '../../constants/theme';

interface AddWorkoutModalProps {
  visible: boolean;
  selectedDate: Date;
  initialData?: {
    id?: string;
    exercise: string;
    category: string;
    sets: string;
    reps: string;
    weight: string;
  } | null;
  onClose: () => void;
  onSave: (workoutData: {
    id?: string;
    exercise: string;
    category: string;
    sets: string;
    reps: string;
    weight: string;
  }) => void;
}

export default function AddWorkoutModal({
  visible,
  selectedDate,
  initialData,
  onClose,
  onSave,
}: AddWorkoutModalProps) {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      {visible ? (
        <AddWorkoutContent
          key={initialData?.id || 'new-workout'}
          selectedDate={selectedDate}
          initialData={initialData}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </Modal>
  );
}

function AddWorkoutContent({
  selectedDate,
  initialData,
  onClose,
  onSave,
}: {
  selectedDate: Date;
  initialData?: {
    id?: string;
    exercise: string;
    category: string;
    sets: string;
    reps: string;
    weight: string;
  } | null;
  onClose: () => void;
  onSave: (workoutData: {
    id?: string;
    exercise: string;
    category: string;
    sets: string;
    reps: string;
    weight: string;
  }) => void;
}) {
  const suggestionScrollRef = useRef<ScrollView>(null);

  const [exercise, setExercise] = useState(initialData?.exercise || '');
  const [selectedCategory, setSelectedCategory] = useState(
    initialData?.category || GYM_CATEGORIES[0]
  );
  const [sets, setSets] = useState(initialData?.sets || '3');
  const [reps, setReps] = useState(initialData?.reps || '10');
  const [weight, setWeight] = useState(initialData?.weight || '20');
  const [errorMessage, setErrorMessage] = useState('');
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

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    suggestionScrollRef.current?.scrollTo({ x: 0, animated: false });
  };

  const isCardio = selectedCategory === 'Cardio' || selectedCategory === 'Kardio';
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDismissOverlay = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSelectSuggestion = (name: string) => {
    setExercise(name);
    setErrorMessage('');
  };

  // Stepper handlers for Strength & Cardio
  const adjustSets = (delta: number) => {
    const current = parseInt(sets, 10) || (isCardio ? 20 : 3);
    const next = Math.max(1, Math.min(isCardio ? 300 : 50, current + delta));
    setSets(String(next));
  };

  const adjustReps = (delta: number) => {
    if (isCardio) {
      // Distance adjustment
      const current = parseFloat(reps) || 0;
      const next = Math.max(0, current + delta * 0.5);
      setReps(String(next % 1 === 0 ? next : next.toFixed(1)));
    } else {
      const current = parseInt(reps, 10) || 10;
      const next = Math.max(1, Math.min(200, current + delta));
      setReps(String(next));
    }
  };

  const adjustWeight = (delta: number) => {
    const current = parseFloat(weight) || 0;
    const next = Math.max(0, current + delta);
    setWeight(String(next % 1 === 0 ? next : next.toFixed(1)));
  };

  const handleSave = () => {
    const trimmed = exercise.trim();
    if (!trimmed) {
      setErrorMessage('Please enter or select an exercise name.');
      return;
    }

    if (isCardio) {
      const durationMins = parseInt(sets, 10);
      if (!durationMins || durationMins <= 0) {
        setErrorMessage('Please enter valid cardio duration in minutes.');
        return;
      }

      Keyboard.dismiss();
      onSave({
        id: initialData?.id,
        exercise: trimmed,
        category: selectedCategory,
        sets: String(durationMins), // stores duration in minutes
        reps: String(parseFloat(reps) || 0), // stores distance in km
        weight: '0',
      });
      return;
    }

    const numSets = parseInt(sets, 10);
    if (!numSets || numSets <= 0) {
      setErrorMessage('Please enter at least 1 set.');
      return;
    }

    const numReps = parseInt(reps, 10);
    if (!numReps || numReps <= 0) {
      setErrorMessage('Please enter valid repetitions.');
      return;
    }

    const numWeight = parseFloat(weight);
    if (isNaN(numWeight) || numWeight < 0) {
      setErrorMessage('Please enter valid weight (kg).');
      return;
    }

    Keyboard.dismiss();
    onSave({
      id: initialData?.id,
      exercise: trimmed,
      category: selectedCategory,
      sets: String(numSets),
      reps: String(numReps),
      weight: String(parseFloat(weight) || 0),
    });
  };

  return (
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback onPress={handleDismissOverlay}>
        <View style={styles.modalDismissArea} />
      </TouchableWithoutFeedback>

      <View style={styles.modalContent}>
        <View style={styles.modalHandle} />
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {initialData?.id ? 'Edit Workout' : 'Add Workout'}
              </Text>
              <Text style={styles.modalSubtitle}>Session Date: {formattedDate}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={{ paddingBottom: Math.max(16, keyboardHeight + 16) }}
          >
          {/* Category selector */}
          <Text style={styles.formLabel}>Focus Area</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.categorySelectionScroll, { marginHorizontal: -20 }]}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {GYM_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categorySelectionChip,
                  selectedCategory === cat && styles.categorySelectionChipActive,
                ]}
                onPress={() => handleSelectCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categorySelectionText,
                    selectedCategory === cat && styles.categorySelectionTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Exercise Name Input */}
          <Text style={styles.formLabel}>EXERCISE NAME</Text>
          <View style={styles.exerciseInputContainer}>
            <Ionicons
              name={isCardio ? 'heart' : 'barbell-outline'}
              size={18}
              color={COLORS.warning}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={styles.exerciseTextInput}
              placeholder={isCardio ? 'e.g. Treadmill Run, Stationary Bike...' : 'e.g. Bench Press, Lat Pulldown...'}
              placeholderTextColor={COLORS.textMuted}
              value={exercise}
              onChangeText={(t) => {
                setExercise(t);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize="words"
            />
            {exercise.length > 0 && (
              <TouchableOpacity onPress={() => setExercise('')}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Suggestions Chips */}
          {EXERCISE_SUGGESTIONS[selectedCategory] &&
            EXERCISE_SUGGESTIONS[selectedCategory].length > 0 && (
              <View style={{ marginBottom: 18 }}>
                <Text style={styles.formMiniLabel}>{selectedCategory.toUpperCase()} Suggestion </Text>
                <ScrollView
                  ref={suggestionScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={[styles.suggestionSelectionScroll, { marginHorizontal: -20 }]} // <-- Tambahkan margin negatif
                  contentContainerStyle={{ paddingHorizontal: 20 }} // <-- Ubah menjadi paddingHorizontal
                >
                  {EXERCISE_SUGGESTIONS[selectedCategory].map((name) => {
                    const isChosen = exercise.toLowerCase() === name.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={name}
                        style={[
                          styles.suggestionSelectionChip,
                          isChosen && styles.suggestionSelectionChipActive,
                        ]}
                        onPress={() => handleSelectSuggestion(name)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.suggestionSelectionText,
                            isChosen && styles.suggestionSelectionTextActive,
                          ]}
                        >
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Sets & Reps / Cardio Metrics Card */}
            <View style={styles.metricsCardGrid}>
              {/* CARD 1: SETS (Strength) or DURATION (Cardio) */}
              <View style={styles.metricCard}>
                <View style={styles.metricCardHeader}>
                  <Text style={styles.metricCardLabel}>{isCardio ? 'DURATION' : 'SETS'}</Text>
                  <Text style={styles.metricCardUnit}>{isCardio ? 'Minutes' : 'Total'}</Text>
                </View>

                <View style={styles.metricControlRow}>
                  <TouchableOpacity
                    style={styles.metricCircleBtn}
                    onPress={() => adjustSets(isCardio ? -5 : -1)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.metricNumberInput}
                    keyboardType="numeric"
                    value={sets}
                    onChangeText={(v) => setSets(v.replace(/[^0-9]/g, ''))}
                    maxLength={3}
                    selectTextOnFocus
                  />

                  <TouchableOpacity
                    style={styles.metricCircleBtn}
                    onPress={() => adjustSets(isCardio ? 5 : 1)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Quick Presets */}
                <View style={styles.metricPresetsRow}>
                  {(isCardio ? ['15', '20', '30', '45'] : ['3', '4', '5']).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.metricPresetChip,
                        sets === p && styles.metricPresetChipActive,
                      ]}
                      onPress={() => setSets(p)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.metricPresetChipText,
                          sets === p && styles.metricPresetChipTextActive,
                        ]}
                      >
                        {isCardio ? `${p}m` : p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* CARD 2: REPS (Strength) or DISTANCE (Cardio) */}
              <View style={styles.metricCard}>
                <View style={styles.metricCardHeader}>
                  <Text style={styles.metricCardLabel}>{isCardio ? 'DISTANCE' : 'REPS'}</Text>
                  <Text style={styles.metricCardUnit}>{isCardio ? 'Km (opt)' : 'Per Set'}</Text>
                </View>

                <View style={styles.metricControlRow}>
                  <TouchableOpacity
                    style={styles.metricCircleBtn}
                    onPress={() => adjustReps(isCardio ? -1 : -1)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.metricNumberInput}
                    keyboardType="numeric"
                    value={reps}
                    onChangeText={(v) => setReps(v.replace(/[^0-9.]/g, ''))}
                    maxLength={4}
                    selectTextOnFocus
                  />

                  <TouchableOpacity
                    style={styles.metricCircleBtn}
                    onPress={() => adjustReps(isCardio ? 1 : 1)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Quick Presets */}
                <View style={styles.metricPresetsRow}>
                  {(isCardio ? ['1', '2', '3', '5'] : ['8', '10', '12', '15']).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.metricPresetChip,
                        reps === p && styles.metricPresetChipActive,
                      ]}
                      onPress={() => setReps(p)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.metricPresetChipText,
                          reps === p && styles.metricPresetChipTextActive,
                        ]}
                      >
                        {isCardio ? `${p}k` : p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* WEIGHT INPUT - Full Width Card */}
            {!isCardio && (
              <View style={styles.weightCard}>
                <View style={styles.metricCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="barbell" size={15} color={COLORS.warning} />
                    <Text style={styles.metricCardLabel}>WEIGHT LOAD</Text>
                  </View>
                  <Text style={styles.weightBadgeUnit}>Kilograms (kg)</Text>
                </View>

                <View style={styles.weightControlRow}>
                  <TouchableOpacity
                    style={styles.weightAdjustBtn}
                    onPress={() => adjustWeight(-5)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.weightAdjustBtnText}>-5</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.metricCircleBtn}
                    onPress={() => adjustWeight(-1)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
                  </TouchableOpacity>

                  <View style={styles.weightDisplayWrap}>
                    <TextInput
                      style={styles.weightInput}
                      keyboardType="numeric"
                      value={weight}
                      onChangeText={(v) => setWeight(v.replace(/[^0-9.]/g, ''))}
                      maxLength={6}
                      selectTextOnFocus
                    />
                    <Text style={styles.weightUnitLabel}>KG</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.metricCircleBtn}
                    onPress={() => adjustWeight(1)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.weightAdjustBtn}
                    onPress={() => adjustWeight(5)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.weightAdjustBtnText}>+5</Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Weight Presets */}
                <View style={styles.weightPresetsRow}>
                  {['Bodyweight', '10 kg', '20 kg', '40 kg', '60 kg', '80 kg'].map((label) => {
                    const val = label === 'Bodyweight' ? '0' : label.replace(' kg', '');
                    const isActive = weight === val;
                    return (
                      <TouchableOpacity
                        key={label}
                        style={[
                          styles.weightPresetChip,
                          isActive && styles.weightPresetChipActive,
                        ]}
                        onPress={() => setWeight(val)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.weightPresetChipText,
                            isActive && styles.weightPresetChipTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Error Feedback */}
            {errorMessage ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={18} color="#08090C" />
              <Text style={styles.primaryActionButtonText}>SAVE TO SESSION</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    );
  }