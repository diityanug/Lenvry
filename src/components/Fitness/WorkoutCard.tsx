import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../../types/fitness';
import { getCategoryIcon } from '../../constants/fitness';
import { COLORS, RADIUS } from '../../constants/theme';
import { CardIconButton } from '../Common/AppButtons';

interface WorkoutCardProps {
  item: Workout;
  onDelete: (id: string) => void;
  onEdit?: (item: Workout) => void;
  onClone?: (item: Workout) => void;
}

export default function WorkoutCard({ item, onDelete, onEdit, onClone }: WorkoutCardProps) {
  const isCardio = item.category === 'Cardio';
  const exerciseVolume =
    (parseInt(item.sets || '0', 10) || 0) *
    (parseInt(item.reps || '0', 10) || 0) *
    (parseFloat(item.weight || '0') || 0);

  return (
    <View style={cardStyles.workoutCard}>
      {/* Top Header Row */}
      <View style={cardStyles.workoutHeader}>
        <View style={cardStyles.workoutIconContainer}>
          <Ionicons
            name={getCategoryIcon(item.category) as any}
            size={18}
            color={COLORS.warning}
          />
        </View>

        <View style={cardStyles.workoutTitleContainer}>
          <Text style={cardStyles.workoutExercise} numberOfLines={2}>
            {item.exercise}
          </Text>
          <View style={cardStyles.categoryBadge}>
            <Text style={cardStyles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
          </View>
        </View>

        {/* Compact Action Buttons */}
        <View style={cardStyles.actionButtonsGroup}>
          {onEdit && (
            <CardIconButton
              icon="create-outline"
              rounded={true}
              onPress={() => onEdit(item)}
              accessibilityLabel="Edit workout"
            />
          )}

          {onClone && (
            <CardIconButton
              icon="copy-outline"
              rounded={true}
              onPress={() => onClone(item)}
              accessibilityLabel="Duplicate workout"
            />
          )}

          <CardIconButton
            icon="trash-outline"
            tone="danger"
            rounded={true}
            onPress={() => onDelete(item.id)}
            accessibilityLabel="Delete workout"
          />
        </View>
      </View>

      {/* Stats Details Row */}
      <View style={cardStyles.workoutDetailsWrap}>
        {isCardio ? (
          <View style={cardStyles.statsRowFlex}>
            <View style={cardStyles.statChip}>
              <Ionicons name="time-outline" size={12} color={COLORS.warning} style={{ marginRight: 4 }} />
              <Text style={cardStyles.statChipText}>
                {item.sets || '0'} <Text style={cardStyles.statUnit}>Mins</Text>
              </Text>
            </View>

            {parseFloat(item.reps || '0') > 0 && (
              <View style={cardStyles.statChip}>
                <Ionicons name="speedometer-outline" size={12} color={COLORS.accentUSD} style={{ marginRight: 4 }} />
                <Text style={cardStyles.statChipText}>
                  {item.reps} <Text style={cardStyles.statUnit}>km</Text>
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={cardStyles.statsRowFlex}>
            <View style={cardStyles.statChip}>
              <Text style={cardStyles.statChipText}>
                {item.sets} <Text style={cardStyles.statUnit}>Sets</Text>
              </Text>
            </View>

            <View style={cardStyles.statChip}>
              <Text style={cardStyles.statChipText}>
                {item.reps} <Text style={cardStyles.statUnit}>Reps</Text>
              </Text>
            </View>

            <View style={[cardStyles.statChip, cardStyles.statChipHighlight]}>
              <Ionicons name="barbell-outline" size={12} color={COLORS.warning} style={{ marginRight: 4 }} />
              <Text style={[cardStyles.statChipText, { color: COLORS.warning, fontWeight: '700' }]}>
                {parseFloat((item.weight || '0').replace(',', '.')) <= 0 ? (
                  'Bodyweight'
                ) : (
                  <>
                    {item.weight} <Text style={cardStyles.statUnit}>kg</Text>
                  </>
                )}
              </Text>
            </View>

            {exerciseVolume > 0 && (
              <View style={[cardStyles.statChip, cardStyles.statChipVolume]}>
                <Ionicons name="flash-outline" size={11} color={COLORS.success} style={{ marginRight: 3 }} />
                <Text style={[cardStyles.statChipText, { color: COLORS.success, fontWeight: '700' }]}>
                  {exerciseVolume.toLocaleString('en-US')} <Text style={cardStyles.statUnit}>vol</Text>
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  workoutCard: {
    backgroundColor: COLORS.bgCard,
    padding: 14,
    borderRadius: RADIUS.xl,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutIconContainer: {
    backgroundColor: COLORS.warningSoft,
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    marginTop: 2,
  },
  workoutTitleContainer: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  workoutExercise: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 20,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bgCardSub,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteIconBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  workoutDetailsWrap: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsRowFlex: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statChipHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  statChipVolume: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  statChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
});