import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import { homeStyles as styles } from '../../styles/homeStyles';

interface BentoGridProps {
  habitCompletedCount: number;
  habitTotalCount: number;
  todayWorkoutTitle: string;
  todayWorkoutSub: string;
  todayWorkoutCount: number;
  todayExpenses: number;
}

export default function BentoGrid({
  habitCompletedCount,
  habitTotalCount,
  todayWorkoutTitle,
  todayWorkoutSub,
  todayWorkoutCount,
  todayExpenses,
}: BentoGridProps) {
  const habitPercent = habitTotalCount > 0 ? Math.round((habitCompletedCount / habitTotalCount) * 100) : 0;
  const formattedExpenses = `Rp ${todayExpenses.toLocaleString('id-ID')}`;

  return (
    <>
      <Text style={styles.sectionLabel}>TODAY'S OVERVIEW</Text>
      <View style={styles.bentoContainer}>
        {/* Habit Card */}
        <TouchableOpacity
          style={styles.bentoCardLarge}
          onPress={() => router.push('/habits' as Href)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.badgeIcon, { backgroundColor: 'rgba(142, 151, 253, 0.15)' }]}>
              <Ionicons name="checkbox" size={16} color="#8E97FD" />
            </View>
            <Text style={styles.badgeTextMuted}>Daily Habits</Text>
          </View>
          <View style={styles.bentoBody}>
            <Text style={styles.metricLarge}>{habitPercent}%</Text>
            <Text style={styles.metricSub}>
              {habitTotalCount > 0
                ? `${habitCompletedCount} of ${habitTotalCount} habits completed`
                : 'No habits scheduled for today'}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${habitPercent}%` }]} />
          </View>
        </TouchableOpacity>

        {/* Fitness & Finance Bento Row */}
        <View style={styles.bentoRow}>
          {/* Fitness */}
          <TouchableOpacity
            style={styles.bentoCardHalf}
            onPress={() => router.push('/fitness' as Href)}
            activeOpacity={0.8}
          >
            <View>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.badgeIcon, { backgroundColor: 'rgba(212, 255, 0, 0.15)' }]}>
                  <FontAwesome5 name="dumbbell" size={13} color="#D4FF00" />
                </View>
                <Ionicons name="chevron-forward" size={14} color="#52525B" />
              </View>
              <Text style={styles.bentoTitle} numberOfLines={1}>{todayWorkoutTitle}</Text>
              <Text style={styles.bentoSubtitle} numberOfLines={2}>{todayWorkoutSub}</Text>
            </View>
            <View style={[styles.statusPill, todayWorkoutCount === 0 && { backgroundColor: '#27272A' }]}>
              <Text style={[styles.statusPillText, todayWorkoutCount === 0 && { color: '#A1A1AA' }]}>
                {todayWorkoutCount > 0 ? 'LOGGED' : 'REST'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Finance */}
          <TouchableOpacity
            style={styles.bentoCardHalf}
            onPress={() => router.push('/finance' as Href)}
            activeOpacity={0.8}
          >
            <View>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.badgeIcon, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
                  <FontAwesome5 name="wallet" size={13} color="#60A5FA" />
                </View>
                <Ionicons name="chevron-forward" size={14} color="#52525B" />
              </View>
              <Text style={styles.bentoTitle} numberOfLines={1}>{formattedExpenses}</Text>
              <Text style={styles.bentoSubtitle} numberOfLines={1}>Today's Spending</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: todayExpenses > 0 ? '#271718' : '#1C2838' }]}>
              <Text style={[styles.statusPillText, { color: todayExpenses > 0 ? '#FF453A' : '#60A5FA' }]}>
                {todayExpenses > 0 ? 'ACTIVE' : 'NO SPEND'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}