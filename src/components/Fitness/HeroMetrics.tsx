import React from 'react';
import { Text, View } from 'react-native';
import { Workout } from '../../types/fitness';
import { fitnessStyles as styles } from '../../styles/fitnessStyles';

interface HeroMetricsProps {
  selectedDate: Date;
  workouts: Workout[];
}

export default function HeroMetrics({ selectedDate, workouts }: HeroMetricsProps) {
  const dayVolume = workouts.reduce((total, item) => {
    return total + (parseInt(item.sets || '0', 10) * parseInt(item.reps || '0', 10) * parseFloat(item.weight || '0'));
  }, 0);
  const daySets = workouts.reduce((total, item) => total + parseInt(item.sets || '0', 10), 0);
  const dayReps = workouts.reduce((total, item) => total + parseInt(item.reps || '0', 10), 0);

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroTitle}>Total Training Volume</Text>
        <Text style={styles.heroDateBadge}>{formattedDate}</Text>
      </View>
      <View style={styles.volumeRow}>
        <Text style={styles.volumeText}>{dayVolume.toLocaleString('en-US')}</Text>
        <Text style={styles.volumeUnit}>kg Vol</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Exercises</Text>
          <Text style={styles.statValue}>{workouts.length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Sets</Text>
          <Text style={styles.statValue}>{daySets}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Reps</Text>
          <Text style={styles.statValue}>{dayReps}</Text>
        </View>
      </View>
    </View>
  );
}