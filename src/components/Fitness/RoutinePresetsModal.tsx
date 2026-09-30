import React from 'react';
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ROUTINE_PRESETS, RoutinePreset, getCategoryIcon } from '../../constants/fitness';
import { COLORS, RADIUS } from '../../constants/theme';

interface RoutinePresetsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectRoutine: (routine: RoutinePreset) => void;
}

export default function RoutinePresetsModal({
  visible,
  onClose,
  onSelectRoutine,
}: RoutinePresetsModalProps) {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.overlay} />
      </TouchableWithoutFeedback>

      <View style={modalStyles.content}>
        <View style={modalStyles.handle} />

        <View style={modalStyles.headerRow}>
          <View>
            <Text style={modalStyles.title}>Workout Routines</Text>

          </View>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {ROUTINE_PRESETS.map((routine) => (
            <TouchableOpacity
              key={routine.name}
              style={modalStyles.routineCard}
              onPress={() => onSelectRoutine(routine)}
              activeOpacity={0.8}
            >
              <View style={modalStyles.routineHeader}>
                <View style={modalStyles.iconBadge}>
                  <Ionicons name={getCategoryIcon(routine.category) as any} size={18} color={COLORS.warning} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={modalStyles.routineName}>{routine.name}</Text>
                  <Text style={modalStyles.routineDesc}>{routine.description}</Text>
                </View>
                <View style={modalStyles.addBtn}>
                  <Ionicons name="add-circle" size={22} color={COLORS.warning} />
                </View>
              </View>

              <View style={modalStyles.exercisesList}>
                {routine.exercises.map((ex, idx) => (
                  <View key={idx} style={modalStyles.exerciseChip}>
                    <Text style={modalStyles.exerciseChipText}>
                      • {ex.exercise} ({ex.sets}x{ex.reps} @ {ex.weight}kg)
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  content: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  routineCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  routineDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  addBtn: {
    paddingLeft: 8,
  },
  exercisesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  exerciseChip: {
    backgroundColor: COLORS.bgCard,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exerciseChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
});
