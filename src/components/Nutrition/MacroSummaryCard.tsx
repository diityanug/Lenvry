import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NutritionTarget } from '../../types/nutrition';
import { nutritionStyles as styles } from '../../styles/nutritionStyles';
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
  const caloriePercent = Math.min(100, Math.round((totalCalories / Math.max(1, target.calories)) * 100));
  const remainingCalories = target.calories - totalCalories;
  const isOver = remainingCalories < 0;

  const proteinPercent = Math.min(100, Math.round((totalProtein / Math.max(1, target.protein)) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbs / Math.max(1, target.carbs)) * 100));
  const fatPercent = Math.min(100, Math.round((totalFat / Math.max(1, target.fat)) * 100));

  // Compute Macro Split ratio (% of total macro energy)
  const pCal = totalProtein * 4;
  const cCal = totalCarbs * 4;
  const fCal = totalFat * 9;
  const macroCalSum = Math.max(1, pCal + cCal + fCal);

  const pRatio = Math.round((pCal / macroCalSum) * 100);
  const cRatio = Math.round((cCal / macroCalSum) * 100);
  const fRatio = Math.round((fCal / macroCalSum) * 100);

  return (
    <View style={styles.heroCard}>
      {/* Top Header: Total Calories vs Target & Remaining */}
      <View style={styles.heroTopRow}>
        <View style={styles.calorieMainCol}>
          <Text style={styles.calorieLabel}>DAILY CALORIE</Text>
          <View style={styles.calorieBigRow}>
            <Text style={styles.calorieNumber}>{totalCalories.toLocaleString('en-US')}</Text>
            <Text style={styles.calorieTargetSub}>/ {target.calories.toLocaleString('en-US')} kcal</Text>
          </View>
        </View>

        <View style={styles.calorieRemainingBox}>
          <Text style={styles.remainingLabel}>
            {isOver ? 'OVER BUDGET' : 'REMAINING'}
          </Text>
          <Text
            style={[
              styles.remainingNumber,
              isOver && { color: COLORS.danger },
            ]}
          >
            {Math.abs(remainingCalories).toLocaleString('en-US')} kcal
          </Text>
        </View>
      </View>

      {/* Calorie Progress Bar */}
      <View style={styles.calorieBarTrack}>
        <View
          style={[
            styles.calorieBarFill,
            {
              width: `${caloriePercent}%`,
              backgroundColor: isOver ? COLORS.danger : COLORS.nutrition,
            },
          ]}
        />
      </View>

      {/* Macro Breakdown Row (Protein, Carbs, Fat) */}
      <View style={styles.macroRow}>
        {/* Protein */}
        <View style={styles.macroCol}>
          <View style={styles.macroHeaderRow}>
            <Text style={styles.macroName}>Protein</Text>
            <Text style={styles.macroTargetText}>{target.protein}g</Text>
          </View>
          <Text style={styles.macroAmountText}>{Math.round(totalProtein)}g</Text>
          <View style={styles.macroBarTrack}>
            <View
              style={[
                styles.macroBarFill,
                { width: `${proteinPercent}%`, backgroundColor: COLORS.protein },
              ]}
            />
          </View>
        </View>

        {/* Carbs */}
        <View style={styles.macroCol}>
          <View style={styles.macroHeaderRow}>
            <Text style={styles.macroName}>Carbs</Text>
            <Text style={styles.macroTargetText}>{target.carbs}g</Text>
          </View>
          <Text style={styles.macroAmountText}>{Math.round(totalCarbs)}g</Text>
          <View style={styles.macroBarTrack}>
            <View
              style={[
                styles.macroBarFill,
                { width: `${carbsPercent}%`, backgroundColor: COLORS.carbs },
              ]}
            />
          </View>
        </View>

        {/* Fat */}
        <View style={styles.macroCol}>
          <View style={styles.macroHeaderRow}>
            <Text style={styles.macroName}>Fat</Text>
            <Text style={styles.macroTargetText}>{target.fat}g</Text>
          </View>
          <Text style={styles.macroAmountText}>{Math.round(totalFat)}g</Text>
          <View style={styles.macroBarTrack}>
            <View
              style={[
                styles.macroBarFill,
                { width: `${fatPercent}%`, backgroundColor: COLORS.fat },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Macro Ratio Split Summary */}
      {totalCalories > 0 && (
        <View style={cardStyles.ratioBarRow}>
          <Text style={cardStyles.ratioLabel}>ENERGY RATIO:</Text>
          <Text style={[cardStyles.ratioItem, { color: COLORS.protein }]}>
            Protein: {pRatio}%
          </Text>
          <Text style={cardStyles.ratioDot}>•</Text>
          <Text style={[cardStyles.ratioItem, { color: COLORS.carbs }]}>
            Calorie: {cRatio}%
          </Text>
          <Text style={cardStyles.ratioDot}>•</Text>
          <Text style={[cardStyles.ratioItem, { color: COLORS.fat }]}>
            Fat: {fRatio}%
          </Text>
        </View>
      )}
    </View>
  );
};

const cardStyles = StyleSheet.create({
  ratioBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCardSub,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.xs,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  ratioLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginRight: 4,
  },
  ratioItem: {
    fontSize: 11,
    fontWeight: '700',
  },
  ratioDot: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
});
