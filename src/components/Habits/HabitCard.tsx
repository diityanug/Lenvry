import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../types/habits';

interface HabitCardProps {
  item: Habit;
  totalCompletedCount: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_THEMES: Record<
  string,
  { bg: string; border: string; accent: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Health: {
    bg: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.22)',
    accent: '#34D399',
    icon: 'fitness-outline',
  },
  Fitness: {
    bg: 'rgba(251, 146, 60, 0.08)',
    border: 'rgba(251, 146, 60, 0.22)',
    accent: '#FB923C',
    icon: 'barbell-outline',
  },
  Work: {
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.22)',
    accent: '#38BDF8',
    icon: 'briefcase-outline',
  },
  Study: {
    bg: 'rgba(129, 140, 248, 0.08)',
    border: 'rgba(129, 140, 248, 0.22)',
    accent: '#818CF8',
    icon: 'book-outline',
  },
  Mindfulness: {
    bg: 'rgba(167, 139, 250, 0.08)',
    border: 'rgba(167, 139, 250, 0.22)',
    accent: '#A78BFA',
    icon: 'leaf-outline',
  },
};

const getCategoryTheme = (category: string) => {
  if (CATEGORY_THEMES[category]) return CATEGORY_THEMES[category];

  const PALETTE = [
    { bg: 'rgba(142, 151, 253, 0.08)', border: 'rgba(142, 151, 253, 0.22)', accent: '#8E97FD', icon: 'flash-outline' as const },
    { bg: 'rgba(56, 189, 248, 0.08)', border: 'rgba(56, 189, 248, 0.22)', accent: '#38BDF8', icon: 'compass-outline' as const },
    { bg: 'rgba(52, 211, 153, 0.08)', border: 'rgba(52, 211, 153, 0.22)', accent: '#34D399', icon: 'sparkles-outline' as const },
    { bg: 'rgba(244, 114, 182, 0.08)', border: 'rgba(244, 114, 182, 0.22)', accent: '#F472B6', icon: 'star-outline' as const },
    { bg: 'rgba(251, 146, 60, 0.08)', border: 'rgba(251, 146, 60, 0.22)', accent: '#FB923C', icon: 'flame-outline' as const },
  ];

  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

export default function HabitCard({
  item,
  totalCompletedCount,
  onToggle,
  onDelete,
}: HabitCardProps) {
  const isCompleted = item.completed;
  const theme = getCategoryTheme(item.category);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onToggle(item.id)}
      style={[
        cardStyles.card,
        {
          backgroundColor: isCompleted ? '#121215' : theme.bg,
          borderColor: isCompleted ? '#27272A' : theme.border,
        },
      ]}
    >
      <View style={cardStyles.topRow}>
        <View
          style={[
            cardStyles.categoryTag,
            { backgroundColor: isCompleted ? '#1E1E22' : 'rgba(0,0,0,0.45)' },
          ]}
        >
          <Ionicons
            name={theme.icon}
            size={11}
            color={isCompleted ? '#52525B' : theme.accent}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[cardStyles.categoryText, { color: isCompleted ? '#71717A' : theme.accent }]}
            numberOfLines={1}
          >
            {item.category.toUpperCase()}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={14} color="#52525B" />
        </TouchableOpacity>
      </View>

      <View style={cardStyles.centerBody}>
        <Text
          style={[cardStyles.title, isCompleted && cardStyles.titleCompleted]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </View>

      <View style={cardStyles.bottomRow}>
        <View style={cardStyles.metricWrap}>
          <Text style={[cardStyles.metricNumber, isCompleted && { color: theme.accent }]}>
            {totalCompletedCount}
          </Text>
          <Text style={cardStyles.metricLabel}>logs</Text>
        </View>

        <View
          style={[
            cardStyles.checkbox,
            { borderColor: isCompleted ? theme.accent : '#3F3F46' },
            isCompleted && { backgroundColor: theme.accent },
          ]}
        >
          {isCompleted && <Ionicons name="checkmark" size={13} color="#09090B" />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    width: '48.5%',
    aspectRatio: 1,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    maxWidth: '82%',
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerBody: {
    marginVertical: 4,
  },
  title: {
    color: '#FAFAFA',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  titleCompleted: {
    color: '#52525B',
    textDecorationLine: 'line-through',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  metricWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  metricNumber: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#09090B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});