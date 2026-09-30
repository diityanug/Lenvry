import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import { homeStyles as styles } from '../../styles/homeStyles';
import { COLORS } from '../../constants/theme';

interface BentoGridProps {
  habitCompletedCount: number;
  habitTotalCount: number;
  todayWorkoutTitle: string;
  todayWorkoutSub: string;
  todayWorkoutCount: number;
  todayExpenses: number;
  todayCaloriesConsumed?: number;
  calorieTarget?: number;
}

export default function BentoGrid({
  habitCompletedCount,
  habitTotalCount,
  todayWorkoutTitle,
  todayWorkoutSub,
  todayWorkoutCount,
  todayExpenses,
  todayCaloriesConsumed = 0,
  calorieTarget = 2000,
}: BentoGridProps) {
  const habitPercent =
    habitTotalCount > 0 ? Math.round((habitCompletedCount / habitTotalCount) * 100) : 0;
  const formattedExpenses = `Rp ${todayExpenses.toLocaleString('id-ID')}`;
  const nutritionPercent =
    calorieTarget > 0 ? Math.min(100, Math.round((todayCaloriesConsumed / calorieTarget) * 100)) : 0;

  return (
    <>
      <Text style={styles.sectionLabel}>OVERVIEW</Text>
      <View style={styles.grid2x2}>
        {/* Habits Card */}
        <TouchableOpacity
          style={styles.pillarCard}
          onPress={() => router.push('/habits' as Href)}
          activeOpacity={0.75}
        >
          <View style={styles.pillarTop}>
            <View
              style={[
                styles.pillarIconWrap,
                {
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  borderColor: 'rgba(16, 185, 129, 0.25)',
                },
              ]}
            >
              <Ionicons name="checkbox-outline" size={17} color={COLORS.success} />
            </View>
            <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
          </View>
          <Text style={styles.pillarLabel}>Activities</Text>
          <Text style={styles.pillarValue}>
            {habitTotalCount > 0 ? `${habitCompletedCount}/${habitTotalCount}` : '0'}
          </Text>
          <View style={styles.pillarProgressTrack}>
            <View
              style={[
                styles.pillarProgressFill,
                { width: `${habitPercent}%`, backgroundColor: COLORS.success },
              ]}
            />
          </View>
          <Text style={styles.pillarSub}>
            {habitTotalCount > 0 ? `${habitPercent}% completed` : 'No tasks today'}
          </Text>
        </TouchableOpacity>

        {/* Fitness Card */}
        <TouchableOpacity
          style={styles.pillarCard}
          onPress={() => router.push('/fitness' as Href)}
          activeOpacity={0.75}
        >
          <View style={styles.pillarTop}>
            <View
              style={[
                styles.pillarIconWrap,
                {
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  borderColor: 'rgba(245, 158, 11, 0.25)',
                },
              ]}
            >
              <Ionicons name="barbell-outline" size={17} color={COLORS.warning} />
            </View>
            <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
          </View>
          <Text style={styles.pillarLabel}>Workout</Text>
          <Text style={styles.pillarValue} numberOfLines={1}>
            {todayWorkoutCount > 0 ? `${todayWorkoutCount} Exercises` : 'Rest Day'}
          </Text>
          <View style={styles.pillarProgressTrack}>
            <View
              style={[
                styles.pillarProgressFill,
                {
                  width: todayWorkoutCount > 0 ? '100%' : '0%',
                  backgroundColor: COLORS.warning,
                },
              ]}
            />
          </View>
          <Text style={styles.pillarSub} numberOfLines={1}>
            {todayWorkoutCount > 0 ? todayWorkoutTitle : 'No workout today'}
          </Text>
        </TouchableOpacity>

        {/* Nutrition Card */}
        <TouchableOpacity
          style={styles.pillarCard}
          onPress={() => router.push('/nutrition' as Href)}
          activeOpacity={0.75}
        >
          <View style={styles.pillarTop}>
            <View
              style={[
                styles.pillarIconWrap,
                {
                  backgroundColor: 'rgba(45, 212, 191, 0.12)',
                  borderColor: 'rgba(45, 212, 191, 0.25)',
                },
              ]}
            >
              <Ionicons name="restaurant-outline" size={17} color={COLORS.nutrition} />
            </View>
            <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
          </View>
          <Text style={styles.pillarLabel}>Nutrition</Text>
          <Text style={styles.pillarValue} numberOfLines={1}>
            {todayCaloriesConsumed.toLocaleString('id-ID')}
            <Text style={styles.pillarUnit}> kcal</Text>
          </Text>
          <View style={styles.pillarProgressTrack}>
            <View
              style={[
                styles.pillarProgressFill,
                { width: `${nutritionPercent}%`, backgroundColor: COLORS.nutrition },
              ]}
            />
          </View>
          <Text style={styles.pillarSub} numberOfLines={1}>
            {calorieTarget ? `Goal ${calorieTarget.toLocaleString('id-ID')} kcal` : 'Daily intake'}
          </Text>
        </TouchableOpacity>

        {/* Finance Card */}
        <TouchableOpacity
          style={styles.pillarCard}
          onPress={() => router.push('/finance' as Href)}
          activeOpacity={0.75}
        >
          <View style={styles.pillarTop}>
            <View
              style={[
                styles.pillarIconWrap,
                {
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  borderColor: 'rgba(56, 189, 248, 0.25)',
                },
              ]}
            >
              <Ionicons name="wallet-outline" size={17} color={COLORS.accentUSD} />
            </View>
            <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
          </View>
          <Text style={styles.pillarLabel}>Expenses</Text>
          <Text style={styles.pillarValue} numberOfLines={1}>
            {todayExpenses > 0 ? formattedExpenses : 'Rp 0'}
          </Text>
          <View style={styles.pillarProgressTrack}>
            <View
              style={[
                styles.pillarProgressFill,
                {
                  width: todayExpenses > 0 ? '100%' : '0%',
                  backgroundColor: COLORS.accentUSD,
                },
              ]}
            />
          </View>
          <Text style={styles.pillarSub} numberOfLines={1}>
            {todayExpenses > 0 ? "Today's spending" : 'No expenses today'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}