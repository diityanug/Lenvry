import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../../constants/theme';
import { hexToRgba } from '../../../types/finance';

interface FormCategorySelectorProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenAddCategory: () => void;
  onDeleteCategory?: (cat: string) => void;
  getCategoryTheme: (cat: string) => { icon: any; color: string; bg: string; border: string };
  type: 'expense' | 'income';
}

export const FormCategorySelector = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenAddCategory,
  onDeleteCategory,
  getCategoryTheme,
  type,
}: FormCategorySelectorProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>CATEGORY</Text>
        <TouchableOpacity
          onPress={onOpenAddCategory}
          style={styles.addCategoryBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={14} color={COLORS.finance} />
          <Text style={styles.addCategoryText}>Add Category</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryGrid}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const theme = getCategoryTheme(cat);

          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                isSelected && {
                  backgroundColor: theme.bg,
                  borderColor: theme.color,
                },
              ]}
              onPress={() => onSelectCategory(cat)}
              onLongPress={() => onDeleteCategory?.(cat)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.categoryIconWrap,
                  { backgroundColor: hexToRgba(theme.color, 0.16) },
                  isSelected && { backgroundColor: theme.color },
                ]}
              >
                <Ionicons
                  name={theme.icon}
                  size={15}
                  color={isSelected ? '#08090C' : theme.color}
                />
              </View>
              <Text
                style={[
                  styles.categoryLabel,
                  isSelected && { color: COLORS.textPrimary, fontWeight: '700' },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.finance,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    width: '23%',
    minHeight: 86,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 4,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  categoryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 10.5,
    lineHeight: 13.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
});
