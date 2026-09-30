import React from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GYM_CATEGORIES, getCategoryIcon } from '../../constants/fitness';
import { fitnessStyles as styles } from '../../styles/fitnessStyles';
import { COLORS } from '../../constants/theme';

interface CategoryFilterProps {
  activeFilter: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({ activeFilter, onSelectCategory }: CategoryFilterProps) {
  const categories = ['All', ...GYM_CATEGORIES];

  return (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {categories.map((cat, index) => {
          const isLast = index === categories.length - 1;
          const isActive = activeFilter === cat;

          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                isActive && styles.filterChipActive,
                isLast && { marginRight: 0 },
              ]}
              onPress={() => onSelectCategory(cat)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={getCategoryIcon(cat) as any}
                size={14}
                color={isActive ? COLORS.textInverse : COLORS.textSecondary}
                style={styles.filterIcon}
              />
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}