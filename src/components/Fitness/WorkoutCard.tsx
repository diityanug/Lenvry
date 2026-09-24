import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../../types/fitness';
import { getCategoryIcon } from '../../constants/fitness';
import { fitnessStyles as styles } from '../../styles/fitnessStyles';

interface WorkoutCardProps {
  item: Workout;
  onDelete: (id: string) => void;
}

export default function WorkoutCard({ item, onDelete }: WorkoutCardProps) {
  const isCardio = item.category === 'Cardio' || item.category === 'Kardio';

  return (
    <View style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutIconContainer}>
          <Ionicons name={getCategoryIcon(item.category) as any} size={20} color="#FF6B00" />
        </View>
        <View style={styles.workoutTitleContainer}>
          <Text style={styles.workoutExercise} numberOfLines={1}>{item.exercise}</Text>
          <Text style={styles.workoutCategory}>{item.category}</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.workoutDeleteButton} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color="#FF453A" />
        </TouchableOpacity>
      </View>

      <View style={styles.workoutDetailsRow}>
        <Text style={styles.workoutPill}>{item.sets} <Text style={styles.workoutUnit}>Sets</Text></Text>
        <Text style={styles.workoutDot}>•</Text>
        <Text style={styles.workoutPill}>{item.reps} <Text style={styles.workoutUnit}>Reps</Text></Text>

        {!isCardio && (
          <>
            <Text style={styles.workoutDot}>•</Text>
            <Text style={[styles.workoutPill, styles.workoutHighlight]}>
              {item.weight} <Text style={styles.workoutUnit}>kg</Text>
            </Text>
          </>
        )}
      </View>
    </View>
  );
}