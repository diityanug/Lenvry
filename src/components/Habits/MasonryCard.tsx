import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Habit } from '../../types/habits';
import { MASONRY_STYLES, getCategoryIcon } from '../../constants/habits';
import { habitStyles as styles } from '../../styles/habitStyles';

interface MasonryCardProps {
  item: Habit;
  isLeftColumn: boolean;
  arrayIndex: number;
  totalCompletedCount: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MasonryCard({
  item,
  isLeftColumn,
  arrayIndex,
  totalCompletedCount,
  onToggle,
  onDelete
}: MasonryCardProps) {
  const globalIndex = isLeftColumn ? (arrayIndex * 2) : (arrayIndex * 2) + 1;
  const styleConfig = MASONRY_STYLES[globalIndex % MASONRY_STYLES.length];
  const isCompleted = item.completed;

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => onToggle(item.id)}
      onLongPress={() => onDelete(item.id)}
      style={[
        styles.masonryCard,
        { backgroundColor: styleConfig.bg, height: styleConfig.height },
        isCompleted && styles.masonryCardCompleted
      ]}
    >
      <View style={styles.cardIconWrapper}>
        <FontAwesome5 
          name={getCategoryIcon(item.category)} 
          size={54} 
          color={styleConfig.text} 
          style={{ opacity: isCompleted ? 0.3 : 0.8 }} 
        />
      </View>

      <View style={styles.cardTextWrapper}>
        <Text style={[styles.cardTitle, { color: styleConfig.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.cardSubtitle, { color: styleConfig.text }]}>
          {totalCompletedCount} Completed
        </Text>
      </View>

      {isCompleted && (
        <View style={styles.completedOverlay}>
          <Ionicons name="checkmark-circle" size={48} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}