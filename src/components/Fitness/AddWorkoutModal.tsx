import React, { useRef, useEffect } from 'react';
import {
  Text, View, Modal, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Keyboard, ScrollView, TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GYM_CATEGORIES, EXERCISE_SUGGESTIONS } from '../../constants/fitness';
import { fitnessStyles as styles } from '../../styles/fitnessStyles';

interface AddWorkoutModalProps {
  visible: boolean;
  selectedDate: Date;
  selectedCategory: string;
  exercise: string;
  sets: string;
  reps: string;
  weight: string;
  onClose: () => void;
  onSave: () => void;
  onChangeCategory: (cat: string) => void;
  onChangeExercise: (text: string) => void;
  onChangeSets: (text: string) => void;
  onChangeReps: (text: string) => void;
  onChangeWeight: (text: string) => void;
}

export default function AddWorkoutModal({
  visible, selectedDate, selectedCategory, exercise, sets, reps, weight,
  onClose, onSave, onChangeCategory, onChangeExercise, onChangeSets, onChangeReps, onChangeWeight
}: AddWorkoutModalProps) {
  const suggestionScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (suggestionScrollRef.current) {
      suggestionScrollRef.current.scrollTo({ x: 0, animated: false });
    }
  }, [selectedCategory]);

  const isCardio = selectedCategory === 'Cardio' || selectedCategory === 'Kardio';
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={styles.modalDismissArea} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Log Workout</Text>
              <Text style={styles.modalSubtitle}>Session Date: {formattedDate}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={26} color="#52525B" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.formLabel}>TARGET CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelectionScroll} contentContainerStyle={{ paddingRight: 48 }}>
              {GYM_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categorySelectionChip, selectedCategory === cat && styles.categorySelectionChipActive]}
                  onPress={() => onChangeCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categorySelectionText, selectedCategory === cat && styles.categorySelectionTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.formLabel}>EXERCISE NAME</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Incline Bench Press, Romanian Deadlift..."
              placeholderTextColor="#52525B"
              value={exercise}
              onChangeText={onChangeExercise}
              autoCapitalize="words"
            />

            {EXERCISE_SUGGESTIONS[selectedCategory] && EXERCISE_SUGGESTIONS[selectedCategory].length > 0 && (
              <>
                <Text style={styles.formLabel}>EXERCISE SUGGESTIONS</Text>
                <ScrollView
                  ref={suggestionScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.suggestionSelectionScroll}
                  contentContainerStyle={{ paddingRight: 48 }}
                >
                  {EXERCISE_SUGGESTIONS[selectedCategory].map(name => (
                    <TouchableOpacity
                      key={name}
                      style={styles.suggestionSelectionChip}
                      onPress={() => onChangeExercise(name)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionSelectionText}>{name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.rowNumberInputs}>
              <View style={styles.inputGroupCol}>
                <Text style={styles.formLabel}>SETS</Text>
                <TextInput
                  style={styles.formNumberInput}
                  placeholder="0"
                  placeholderTextColor="#52525B"
                  keyboardType="numeric"
                  value={sets}
                  onChangeText={onChangeSets}
                  maxLength={2}
                />
              </View>
              <View style={styles.inputGroupCol}>
                <Text style={styles.formLabel}>REPS</Text>
                <TextInput
                  style={styles.formNumberInput}
                  placeholder="0"
                  placeholderTextColor="#52525B"
                  keyboardType="numeric"
                  value={reps}
                  onChangeText={onChangeReps}
                  maxLength={3}
                />
              </View>

              {!isCardio && (
                <View style={styles.inputGroupCol}>
                  <Text style={styles.formLabel}>WEIGHT (KG)</Text>
                  <TextInput
                    style={styles.formNumberInput}
                    placeholder="0"
                    placeholderTextColor="#52525B"
                    keyboardType="numeric"
                    value={weight}
                    onChangeText={onChangeWeight}
                    maxLength={4}
                  />
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.primaryActionButton} onPress={onSave} activeOpacity={0.8}>
              <Text style={styles.primaryActionButtonText}>SAVE EXERCISE</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}