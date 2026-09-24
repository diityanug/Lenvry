import React from 'react';
import { Text, View } from 'react-native';
import { habitStyles as styles } from '../../styles/habitStyles';

interface ProgressCardProps {
  completedCount: number;
  totalCount: number;
  progressPercent: number;
}

export default function ProgressCard({ completedCount, totalCount, progressPercent }: ProgressCardProps) {
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Daily Progress</Text>
        <View style={styles.progressBadge}>
          <Text style={styles.progressBadgeText}>{completedCount} / {totalCount}</Text>
        </View>
      </View>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>
    </View>
  );
}