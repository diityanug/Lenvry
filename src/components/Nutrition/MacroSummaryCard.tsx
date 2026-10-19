import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NutritionTarget } from '../../types/nutrition';
import { COLORS, RADIUS } from '../../constants/theme';

interface MacroSummaryCardProps {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  target: NutritionTarget;
}

export const MacroSummaryCard = ({
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  target,
}: MacroSummaryCardProps) => {
  const eatenCalories = Math.round(totalCalories);
  const remainingCalories = target.calories - eatenCalories;
  const isOver = remainingCalories < 0;
  const caloriePercent = Math.min(
    100,
    Math.max(0, Math.round((eatenCalories / Math.max(1, target.calories)) * 100))
  );

  const macros = [
    {
      key: 'protein',
      label: 'Protein',
      color: COLORS.protein,
      current: Math.round(totalProtein),
      goal: target.protein,
    },
    {
      key: 'carbs',
      label: 'Carbs',
      color: COLORS.carbs,
      current: Math.round(totalCarbs),
      goal: target.carbs,
    },
    {
      key: 'fat',
      label: 'Fat',
      color: COLORS.fat,
      current: Math.round(totalFat),
      goal: target.fat,
    },
  ];

  return (
    <View style={styles.card}>
      {/* Calories Header */}
      <Text style={styles.sectionLabel}>Daily Calories</Text>

      <View style={styles.calorieRow}>
        <View style={styles.calorieMain}>
          <Text style={styles.calorieValue}>{eatenCalories.toLocaleString('en-US')}</Text>
          <Text style={styles.calorieTarget}>/ {target.calories.toLocaleString('en-US')} kcal</Text>
        </View>

        <Text style={[styles.remainingText, isOver && styles.overText]}>
          {Math.abs(remainingCalories).toLocaleString('en-US')} kcal {isOver ? 'over' : 'left'}
        </Text>
      </View>

      {/* Calorie Progress Bar */}
      <View style={styles.calorieTrack}>
        <View
          style={[
            styles.calorieFill,
            {
              width: `${caloriePercent}%`,
              backgroundColor: isOver ? COLORS.danger : COLORS.nutrition,
            },
          ]}
        />
      </View>

      <View style={styles.divider} />

      {/* Macros Row (Flat, no nested cards) */}
      <View style={styles.macroRow}>
        {macros.map((m) => {
          const percent = Math.min(100, Math.max(0, Math.round((m.current / Math.max(1, m.goal)) * 100)));
          return (
            <View key={m.key} style={styles.macroItem}>
              <View style={styles.macroLabelRow}>
                <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                <Text style={styles.macroLabel}>{m.label}</Text>
              </View>

              <Text style={styles.macroValue}>
                {m.current}
                <Text style={styles.macroGoal}>/{m.goal}g</Text>
              </Text>

              <View style={styles.macroTrack}>
                <View
                  style={[
                    styles.macroFill,
                    { width: `${percent}%`, backgroundColor: m.color },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calorieMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  calorieValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  calorieTarget: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontVariant: ['tabular-nums'],
  },
  remainingText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.nutrition,
    fontVariant: ['tabular-nums'],
  },
  overText: {
    color: COLORS.danger,
  },
  calorieTrack: {
    height: 8,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  calorieFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 18,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  macroItem: {
    flex: 1,
  },
  macroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  macroDot: {
    width: 7,
    height: 7,
    borderRadius: RADIUS.full,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  macroGoal: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  macroTrack: {
    height: 5,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
});


