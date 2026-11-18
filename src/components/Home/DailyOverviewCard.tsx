import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { COLORS } from '../../constants/theme';
import { homeStyles as styles } from '../../styles/homeStyles';

interface DailyOverviewCardProps {
  habitCompletedCount: number;
  habitTotalCount: number;
  todayWorkoutCount: number;
  todayExpenses: number;
  todayCaloriesConsumed?: number;
  calorieTarget?: number;
}

const RING_SIZE = 108;
const RING_STROKE = 9;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatExpensesShort(amount: number) {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Rp 0';
  if (rounded >= 1_000_000_000) return `Rp ${(rounded / 1_000_000_000).toFixed(1)}B`;
  if (rounded >= 1_000_000) return `Rp ${(rounded / 1_000_000).toFixed(1)}M`;
  if (rounded >= 100_000) return `Rp ${Math.round(rounded / 1_000)}k`;
  if (rounded >= 10_000 && rounded % 1_000 === 0) return `Rp ${rounded / 1_000}k`;
  return `Rp ${rounded.toLocaleString('id-ID')}`;
}

export default function DailyOverviewCard({
  habitCompletedCount,
  habitTotalCount,
  todayWorkoutCount,
  todayExpenses,
  todayCaloriesConsumed = 0,
  calorieTarget = 2000,
}: DailyOverviewCardProps) {
  const habitPercent =
    habitTotalCount > 0 ? Math.round((habitCompletedCount / habitTotalCount) * 100) : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - Math.min(100, habitPercent) / 100);

  const workoutColor = COLORS.fitness;
  const calorieColor = COLORS.nutrition;
  const spendColor = COLORS.finance;

  return (
    <View style={styles.heroCard}>
      {/* Whisper warm glow behind completion ring */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="heroRingGlow" cx="20%" cy="50%" r="58%">
              <Stop offset="0%" stopColor={COLORS.habit} stopOpacity={0.14} />
              <Stop offset="55%" stopColor={COLORS.nutrition} stopOpacity={0.04} />
              <Stop offset="100%" stopColor={COLORS.nutrition} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroRingGlow)" />
        </Svg>
      </View>

      <View style={styles.heroBody}>
        {/* Activities (daily habits) completion ring */}
        <View style={styles.ringColumn}>
          <TouchableOpacity
            style={styles.ringWrap}
            onPress={() => router.push('/habits' as Href)}
            activeOpacity={0.8}
          >
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Defs>
                <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={COLORS.habit} />
                  <Stop offset="100%" stopColor={COLORS.nutrition} />
                </LinearGradient>
              </Defs>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={COLORS.border}
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="url(#ringGradient)"
                strokeWidth={RING_STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                strokeDashoffset={dashOffset}
                rotation={-90}
                originX={RING_SIZE / 2}
                originY={RING_SIZE / 2}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={[styles.ringPercent, { color: COLORS.textPrimary }]}>
                {habitPercent}%
              </Text>
              <Text style={styles.ringCaption}>activities</Text>
            </View>
          </TouchableOpacity>

          {/* What the ring is measuring */}
          <Text style={styles.ringLabel} numberOfLines={1}>
            {habitCompletedCount} of {habitTotalCount} done
          </Text>
        </View>

        {/* Three pillar metrics: calm obsidian tiles with warm ivory values */}
        <View style={styles.heroStats}>
          <TouchableOpacity
            style={styles.heroStat}
            onPress={() => router.push('/fitness' as Href)}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.heroStatIcon,
                {
                  backgroundColor: COLORS.fitnessLight,
                  borderColor: 'rgba(217, 163, 94, 0.28)',
                },
              ]}
            >
              <Ionicons name="barbell" size={16} color={workoutColor} />
            </View>
            <View style={styles.heroStatTextWrap}>
              <Text style={[styles.heroStatValue, { color: COLORS.textPrimary }]} numberOfLines={1}>
                {todayWorkoutCount > 0 ? `${todayWorkoutCount}` : 'Rest'}
                <Text style={styles.heroStatValueMuted}>
                  {todayWorkoutCount > 0 ? '  done' : '  day'}
                </Text>
              </Text>
              <Text style={styles.heroStatLabel} numberOfLines={1}>
                Workout
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroStat}
            onPress={() => router.push('/nutrition' as Href)}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.heroStatIcon,
                {
                  backgroundColor: COLORS.nutritionLight,
                  borderColor: 'rgba(93, 184, 166, 0.28)',
                },
              ]}
            >
              <Ionicons name="flame" size={16} color={calorieColor} />
            </View>
            <View style={styles.heroStatTextWrap}>
              <Text style={[styles.heroStatValue, { color: COLORS.textPrimary }]} numberOfLines={1}>
                {todayCaloriesConsumed.toLocaleString('en-US')}
                <Text style={styles.heroStatValueMuted}>
                  {`  / ${calorieTarget.toLocaleString('en-US')}`}
                </Text>
              </Text>
              <Text style={styles.heroStatLabel} numberOfLines={1}>
                Calories · kcal
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroStat}
            onPress={() => router.push('/finance' as Href)}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.heroStatIcon,
                {
                  backgroundColor: COLORS.financeLight,
                  borderColor: 'rgba(107, 147, 214, 0.28)',
                },
              ]}
            >
              <Ionicons name="wallet" size={16} color={spendColor} />
            </View>
            <View style={styles.heroStatTextWrap}>
              <Text style={[styles.heroStatValue, { color: COLORS.textPrimary }]} numberOfLines={1}>
                {formatExpensesShort(todayExpenses)}
              </Text>
              <Text style={styles.heroStatLabel} numberOfLines={1}>
                Spent today
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
