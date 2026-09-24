import React from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { habitStyles as styles } from '../../styles/habitStyles';

interface CategoryFilterProps {
  categories: string[];
  activeFilter: string;
  onSelectFilter: (category: string) => void;
}

export default function CategoryFilter({ categories, activeFilter, onSelectFilter }: CategoryFilterProps) {
  const options = ['All', ...categories];

  return (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {options.map((cat, index) => {
          const isLast = index === options.length - 1;
          const isActive = activeFilter === cat;

          return (
            <TouchableOpacity 
              key={`filter-${cat}`}
              style={[styles.filterChip, isActive && styles.filterChipActive, isLast && { marginRight: 0 }]}
              onPress={() => onSelectFilter(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}