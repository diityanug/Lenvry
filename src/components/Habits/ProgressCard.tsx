import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';

interface ProgressCardProps {
  completedCount: number;
  totalCount: number;
  progressPercent: number;
}

export default function ProgressCard({ completedCount, totalCount, progressPercent }: ProgressCardProps) {
  const roundedPercent = Math.round(progressPercent);

  const getStatusText = () => {
    if (totalCount === 0) return 'No targets scheduled for this date.';
    if (roundedPercent === 100) return 'All daily targets accomplished!';
    if (roundedPercent >= 50) return `${completedCount} of ${totalCount} completed. Over halfway there!`;
    if (completedCount > 0) return `${completedCount} of ${totalCount} completed. Keep going!`;
    return 'Start your first habit today.';
  };

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.titleRow}>
          <View style={cardStyles.iconWrap}>
            <Ionicons
              name={roundedPercent === 100 ? 'trophy' : 'flame'}
              size={15}
              color={roundedPercent === 100 ? COLORS.warning : COLORS.success}
            />
          </View>
          <Text style={cardStyles.title}>Daily Momentum</Text>
        </View>

        <View style={cardStyles.badgeWrap}>
          <Text style={cardStyles.badgeCount}>
            {completedCount}/{totalCount}
          </Text>
          <View style={cardStyles.badgePill}>
            <Text style={cardStyles.badgePercent}>{roundedPercent}%</Text>
          </View>
        </View>
      </View>

      <Text style={cardStyles.subtitle}>{getStatusText()}</Text>

      <View style={cardStyles.track}>
        <View
          style={[
            cardStyles.fill,
            {
              width: `${Math.min(roundedPercent, 100)}%`,
              backgroundColor: roundedPercent === 100 ? COLORS.success : COLORS.success,
            },
          ]}
        />
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  badgePill: {
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  badgePercent: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.success,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  track: {
    height: 6,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});