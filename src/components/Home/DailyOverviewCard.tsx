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
  if (amount === 0) return 'Rp 0';
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 100_000) return `Rp ${Math.round(amount / 1_000)}k`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
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

  const workoutColor = COLORS.warning;
  const calorieColor = COLORS.nutrition;
  const spendColor = COLORS.accentUSD;

  return (
    <View style={styles.heroCard}>
      {/* Soft colour glow behind the ring */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="heroRingGlow" cx="20%" cy="50%" r="58%">
              <Stop offset="0%" stopColor={COLORS.nutrition} stopOpacity={0.22} />
              <Stop offset="55%" stopColor={COLORS.success} stopOpacity={0.07} />
              <Stop offset="100%" stopColor={COLORS.success} stopOpacity={0} />
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
                  <Stop offset="0%" stopColor={COLORS.success} />
                  <Stop offset="55%" stopColor={COLORS.nutrition} />
                  <Stop offset="100%" stopColor={COLORS.accentUSD} />
                </LinearGradient>
              </Defs>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="rgba(255, 255, 255, 0.09)"
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

        {/* Three coloured pillar metrics */}
        <View style={styles.heroStats}>
          <TouchableOpacity
            style={[styles.heroStat, { backgroundColor: 'rgba(245, 158, 11, 0.09)' }]}
            onPress={() => router.push('/fitness' as Href)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.heroStatIcon,
                {
                  backgroundColor: 'rgba(245, 158, 11, 0.18)',
                  borderColor: 'rgba(245, 158, 11, 0.42)',
                },
              ]}
            >
              <Ionicons name="barbell" size={16} color={workoutColor} />
            </View>
            <View style={styles.heroStatTextWrap}>
              <Text style={[styles.heroStatValue, { color: workoutColor }]} numberOfLines={1}>
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
            style={[styles.heroStat, { backgroundColor: 'rgba(45, 212, 191, 0.09)' }]}
            onPress={() => router.push('/nutrition' as Href)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.heroStatIcon,
                {
                  backgroundColor: 'rgba(45, 212, 191, 0.18)',
                  borderColor: 'rgba(45, 212, 191, 0.42)',
                },
              ]}
            >
              <Ionicons name="flame" size={16} color={calorieColor} />
            </View>
            <View style={styles.heroStatTextWrap}>
              <Text style={[styles.heroStatValue, { color: calorieColor }]} numberOfLines={1}>
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
            style={[styles.heroStat, { backgroundColor: 'rgba(56, 189, 248, 0.09)' }]}
            onPress={() => router.push('/finance' as Href)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.heroStatIcon,
                {
                  backgroundColor: 'rgba(56, 189, 248, 0.18)',
                  borderColor: 'rgba(56, 189, 248, 0.42)',
                },
              ]}
            >
              <Ionicons name="wallet" size={16} color={spendColor} />
            </View>
            <View style={styles.heroStatTextWrap}>
              <Text style={[styles.heroStatValue, { color: spendColor }]} numberOfLines={1}>
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
