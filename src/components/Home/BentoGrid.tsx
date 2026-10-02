import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/theme';
import { homeStyles as styles } from '../../styles/homeStyles';

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
  const nutritionPercent =
    calorieTarget > 0 ? Math.min(100, Math.round((todayCaloriesConsumed / calorieTarget) * 100)) : 0;

  // Format expense with compact readable format so it never cuts off
  const formatExpensesShort = (amount: number) => {
    if (amount === 0) return 'Rp 0';
    if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}B`;
    if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 100_000) return `Rp ${Math.round(amount / 1_000)}k`;
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <View style={styles.overviewSection}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>DAILY OVERVIEW</Text>
      </View>
      <View style={styles.grid2x2}>
        {/* Habits / Activities Card */}
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
              <Ionicons name="checkbox-outline" size={18} color={COLORS.success} />
            </View>
            <View style={styles.pillarBadge}>
              <Text style={styles.pillarBadgeText}>
                {habitTotalCount > 0 ? `${habitPercent}%` : '0%'}
              </Text>
            </View>
          </View>
          <Text style={styles.pillarLabel}>Activities</Text>
          <Text style={styles.pillarValue}>
            {habitTotalCount > 0 ? `${habitCompletedCount} / ${habitTotalCount}` : '0 / 0'}
          </Text>
          <View style={styles.pillarProgressTrack}>
            <View
              style={[
                styles.pillarProgressFill,
                { width: `${habitPercent}%`, backgroundColor: COLORS.success },
              ]}
            />
          </View>
          <Text style={styles.pillarSub} numberOfLines={1} ellipsizeMode="tail">
            {habitTotalCount > 0
              ? `${habitCompletedCount} of ${habitTotalCount} completed`
              : 'No activities scheduled'}
          </Text>
        </TouchableOpacity>

        {/* Fitness / Workout Card */}
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
              <Ionicons name="barbell-outline" size={18} color={COLORS.warning} />
            </View>
            <View style={styles.pillarBadge}>
              <Text style={styles.pillarBadgeText}>
                {todayWorkoutCount > 0 ? 'Active' : 'Rest'}
              </Text>
            </View>
          </View>
          <Text style={styles.pillarLabel}>Workout</Text>
          <Text style={styles.pillarValue} numberOfLines={1}>
            {todayWorkoutCount > 0 ? `${todayWorkoutCount} Done` : 'Rest Day'}
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
          <Text style={styles.pillarSub} numberOfLines={1} ellipsizeMode="tail">
            {todayWorkoutCount > 0 ? todayWorkoutTitle : 'No workouts record'}
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
              <Ionicons name="restaurant-outline" size={18} color={COLORS.nutrition} />
            </View>
            <View style={styles.pillarBadge}>
              <Text style={styles.pillarBadgeText}>
                {`${nutritionPercent}%`}
              </Text>
            </View>
          </View>
          <Text style={styles.pillarLabel}>Nutrition</Text>
          <Text style={styles.pillarValue} numberOfLines={1}>
            {todayCaloriesConsumed.toLocaleString('en-US')}
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
          <Text style={styles.pillarSub} numberOfLines={1} ellipsizeMode="tail">
            {calorieTarget ? `Target: ${calorieTarget.toLocaleString('en-US')} kcal` : 'Daily calorie goal'}
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
              <Ionicons name="wallet-outline" size={18} color={COLORS.accentUSD} />
            </View>
            <View style={styles.pillarBadge}>
              <Text style={styles.pillarBadgeText}>
                Today
              </Text>
            </View>
          </View>
          <Text style={styles.pillarLabel}>Spending</Text>
          <Text style={styles.pillarValue} numberOfLines={1}>
            {formatExpensesShort(todayExpenses)}
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
          <Text style={styles.pillarSub} numberOfLines={1} ellipsizeMode="tail">
            {todayExpenses > 0 ? 'Total expenses' : 'No expenses'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}