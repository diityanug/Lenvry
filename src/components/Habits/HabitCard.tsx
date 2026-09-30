import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../types/habits';
import { COLORS, RADIUS } from '../../constants/theme';

interface HabitCardProps {
  item: Habit;
  isCompleted: boolean;
  totalCompletedCount: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: Habit) => void;
  onToggleSubtask: (habitId: string, subtaskId: string) => void;
}

const CATEGORY_THEMES: Record<
  string,
  { bg: string; border: string; accent: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Health: {
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.22)',
    accent: COLORS.success,
    icon: 'fitness-outline',
  },
  Fitness: {
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.22)',
    accent: COLORS.warning,
    icon: 'barbell-outline',
  },
  Work: {
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.22)',
    accent: COLORS.accentUSD,
    icon: 'briefcase-outline',
  },
  Study: {
    bg: 'rgba(99, 102, 241, 0.08)',
    border: 'rgba(99, 102, 241, 0.22)',
    accent: COLORS.accent,
    icon: 'book-outline',
  },
  Mindfulness: {
    bg: 'rgba(168, 85, 247, 0.08)',
    border: 'rgba(168, 85, 247, 0.22)',
    accent: '#A855F7',
    icon: 'leaf-outline',
  },
};

const getCategoryTheme = (category: string) => {
  if (CATEGORY_THEMES[category]) return CATEGORY_THEMES[category];

  const PALETTE = [
    {
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.22)',
      accent: COLORS.success,
      icon: 'sparkles-outline' as const,
    },
    {
      bg: 'rgba(56, 189, 248, 0.08)',
      border: 'rgba(56, 189, 248, 0.22)',
      accent: COLORS.accentUSD,
      icon: 'compass-outline' as const,
    },
    {
      bg: 'rgba(99, 102, 241, 0.08)',
      border: 'rgba(99, 102, 241, 0.22)',
      accent: COLORS.accent,
      icon: 'flash-outline' as const,
    },
    {
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.22)',
      accent: COLORS.warning,
      icon: 'flame-outline' as const,
    },
  ];

  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

export default function HabitCard({
  item,
  isCompleted,
  totalCompletedCount,
  onToggle,
  onDelete,
  onEdit,
  onToggleSubtask,
}: HabitCardProps) {
  const [detailVisible, setDetailVisible] = useState(false);
  const theme = getCategoryTheme(item.category);

  const priorityColor =
    item.priority === 'high'
      ? COLORS.danger
      : item.priority === 'medium'
      ? COLORS.warning
      : COLORS.success;

  const subtasksCount = item.subtasks?.length || 0;
  const completedSubtasksCount = item.subtasks?.filter((s) => s.completed).length || 0;

  return (
    <>
      <View
        style={[
          cardStyles.card,
          {
            backgroundColor: isCompleted ? COLORS.bgCardSub : theme.bg,
            borderColor: isCompleted ? COLORS.border : theme.border,
          },
        ]}
      >
        {/* Header with Icon, Edit, Delete */}
        <View style={cardStyles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDetailVisible(true)}
            style={[cardStyles.iconWrapper, { backgroundColor: isCompleted ? 'rgba(255,255,255,0.05)' : theme.bg }]}
          >
            <Ionicons name={theme.icon} size={18} color={isCompleted ? COLORS.textMuted : theme.accent} />
          </TouchableOpacity>
          
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              onPress={() => onEdit(item)}
              style={cardStyles.actionHeaderBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={15} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              style={cardStyles.actionHeaderBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={15} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content clickable area to open details */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setDetailVisible(true)}
          style={cardStyles.bodyTouchable}
        >
          {/* Category & Priority Row */}
          <View style={cardStyles.metaRow}>
            <Text style={[cardStyles.categoryName, { color: isCompleted ? COLORS.textMuted : theme.accent }]}>
              {item.category.toUpperCase()}
            </Text>
            {item.priority && (
              <View style={[cardStyles.priorityPill, { borderColor: priorityColor }]}>
                <View style={[cardStyles.priorityDot, { backgroundColor: priorityColor }]} />
                <Text style={[cardStyles.priorityText, { color: priorityColor }]}>
                  {item.priority.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text
            style={[cardStyles.title, isCompleted && cardStyles.titleCompleted]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* Badges / Meta Chips */}
          <View style={cardStyles.badgeContainer}>
            {item.frequency && item.frequency !== 'once' && (
              <View style={[cardStyles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="repeat" size={10} color={COLORS.success} style={{ marginRight: 3 }} />
                <Text style={[cardStyles.badgeText, { color: COLORS.success }]}>
                  {item.frequency === 'daily'
                    ? 'Daily'
                    : item.frequency === 'weekdays'
                    ? 'Weekdays'
                    : 'Custom'}
                </Text>
              </View>
            )}

            {item.timeSlot && item.timeSlot !== 'Anytime' && (
              <View style={[cardStyles.badge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Ionicons name="time-outline" size={10} color={COLORS.accentUSD} style={{ marginRight: 3 }} />
                <Text style={[cardStyles.badgeText, { color: COLORS.accentUSD }]}>
                  {item.timeSlot}
                </Text>
              </View>
            )}

            {subtasksCount > 0 && (
              <View style={[cardStyles.badge, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                <Ionicons name="checkbox-outline" size={10} color={COLORS.textSecondary} style={{ marginRight: 3 }} />
                <Text style={cardStyles.badgeText}>
                  {completedSubtasksCount}/{subtasksCount}
                </Text>
              </View>
            )}

            {item.description ? (
              <View style={[cardStyles.badge, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                <Text style={cardStyles.badgeText}>Notes</Text>
              </View>
            ) : null}
          </View>

          <View style={cardStyles.spacer} />
        </TouchableOpacity>

        <View style={[cardStyles.divider, { backgroundColor: isCompleted ? COLORS.border : theme.border }]} />

        {/* Action Check Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggle(item.id)}
          style={[
            cardStyles.actionButton,
            {
              backgroundColor: isCompleted ? theme.accent : COLORS.bgCardSub,
              borderColor: isCompleted ? theme.accent : COLORS.borderLight,
            },
          ]}
        >
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'checkmark-outline'}
            size={14}
            color={isCompleted ? '#08090C' : COLORS.textPrimary}
            style={{ marginRight: 5 }}
          />
          <Text style={[cardStyles.actionButtonText, { color: isCompleted ? '#08090C' : COLORS.textPrimary }]}>
            {isCompleted ? 'Done' : 'Check'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Detail & Subtasks Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={detailVisible}
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={cardStyles.modalOverlay}>
          <View style={cardStyles.modalBox}>
            <View style={cardStyles.modalHeader}>
              <View style={[cardStyles.modalTag, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Ionicons name={theme.icon} size={12} color={theme.accent} style={{ marginRight: 5 }} />
                <Text style={[cardStyles.modalTagText, { color: theme.accent }]}>
                  {item.category.toUpperCase()}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setDetailVisible(false);
                    onEdit(item);
                  }}
                  activeOpacity={0.7}
                  style={cardStyles.modalEditBtn}
                >
                  <Ionicons name="create-outline" size={16} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDetailVisible(false)}
                  activeOpacity={0.7}
                  style={cardStyles.modalCloseBtn}
                >
                  <Ionicons name="close" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={cardStyles.modalTitle}>{item.title}</Text>

            <ScrollView
              style={cardStyles.modalScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* Description */}
              {item.description ? (
                <View style={cardStyles.modalSection}>
                  <Text style={cardStyles.modalSectionLabel}>DESCRIPTION</Text>
                  <Text style={cardStyles.modalDescText}>{item.description}</Text>
                </View>
              ) : null}

              {/* Subtasks checklist inside Modal */}
              {item.subtasks && item.subtasks.length > 0 ? (
                <View style={cardStyles.modalSection}>
                  <Text style={cardStyles.modalSectionLabel}>
                    CHECKLIST ({completedSubtasksCount}/{subtasksCount})
                  </Text>
                  {item.subtasks.map((st) => (
                    <TouchableOpacity
                      key={st.id}
                      style={cardStyles.subtaskRow}
                      onPress={() => onToggleSubtask(item.id, st.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={st.completed ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={st.completed ? COLORS.success : COLORS.textMuted}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[
                          cardStyles.subtaskText,
                          st.completed && cardStyles.subtaskCompletedText,
                        ]}
                      >
                        {st.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              {/* Extra Meta details */}
              <View style={cardStyles.modalSection}>
                <Text style={cardStyles.modalSectionLabel}>DETAILS</Text>
                <View style={{ gap: 6 }}>
                  <Text style={cardStyles.metaDetailText}>
                    Priority: <Text style={{ color: priorityColor, fontWeight: '700' }}>{(item.priority || 'medium').toUpperCase()}</Text>
                  </Text>
                  <Text style={cardStyles.metaDetailText}>
                    Frequency: <Text style={{ color: COLORS.textPrimary, fontWeight: '600' }}>{item.frequency || 'once'}</Text>
                  </Text>
                  {item.reminderTime ? (
                    <Text style={cardStyles.metaDetailText}>
                      Reminder Time: <Text style={{ color: COLORS.success, fontWeight: '600' }}>{item.reminderTime}</Text>
                    </Text>
                  ) : null}
                </View>
              </View>
            </ScrollView>

            {/* Modal Check / Toggle Button */}
            <TouchableOpacity
              onPress={() => onToggle(item.id)}
              activeOpacity={0.8}
              style={[
                cardStyles.modalCheckBtn,
                {
                  backgroundColor: isCompleted ? COLORS.success : theme.accent,
                },
              ]}
            >
              <Ionicons
                name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={18}
                color="#08090C"
                style={{ marginRight: 6 }}
              />
              <Text style={cardStyles.modalCheckBtnText}>
                {isCompleted ? 'Completed (Tap to undo)' : 'Mark as Done'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    width: '48.5%',
    borderRadius: RADIUS.xl,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    minHeight: 220,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionHeaderBtn: {
    padding: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  priorityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: '800',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 19,
    marginBottom: 10,
  },
  titleCompleted: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  spacer: {
    flex: 1,
  },
  bodyTouchable: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  modalTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 22,
    marginBottom: 14,
  },
  modalScroll: {
    maxHeight: 320,
  },
  modalSection: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  modalSectionLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  modalDescText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  subtaskText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  subtaskCompletedText: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  metaDetailText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  modalCheckBtn: {
    marginTop: 14,
    width: '100%',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCheckBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#08090C',
  },
});