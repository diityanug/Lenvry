import React, { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
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
  onUpdateNotes: (habitId: string, notes: string[]) => void;
  customCategoryIcons?: Record<string, { icon: string; color: string; bg: string }>;
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
  Faith: {
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.22)',
    accent: COLORS.accentUSD,
    icon: 'moon-outline',
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
  Productivity: {
    bg: 'rgba(234, 179, 8, 0.08)',
    border: 'rgba(234, 179, 8, 0.22)',
    accent: '#EAB308',
    icon: 'flash-outline',
  },
  Learning: {
    bg: 'rgba(99, 102, 241, 0.08)',
    border: 'rgba(99, 102, 241, 0.22)',
    accent: COLORS.accent,
    icon: 'book-outline',
  },
};

const getCategoryTheme = (
  category: string,
  customIcons?: Record<string, { icon: string; color: string; bg: string }>
) => {
  if (customIcons && customIcons[category]) {
    const item = customIcons[category];
    return {
      bg: item.bg || 'rgba(56, 189, 248, 0.08)',
      border: item.bg ? item.bg.replace('0.16', '0.25') : 'rgba(56, 189, 248, 0.22)',
      accent: item.color || COLORS.accent,
      icon: (item.icon as keyof typeof Ionicons.glyphMap) || 'sparkles-outline',
    };
  }
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
  onUpdateNotes,
  customCategoryIcons,
}: HabitCardProps) {
  const [detailVisible, setDetailVisible] = useState(false);
  // notes = [item.description (from AddHabitModal), ...extra notes added inline]
  const [notes, setNotes] = useState<string[]>(() => {
    const base = item.description ? [item.description] : [];
    const extra = item.extraNotes || [];
    // Merge: if extraNotes already contains description (migrated), skip dup
    return [...base, ...extra.filter((n) => n !== item.description)];
  });
  const [draftNote, setDraftNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  // popup state
  const [notePopupIndex, setNotePopupIndex] = useState<number>(-1);
  const [editDraft, setEditDraft] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const theme = getCategoryTheme(item.category, customCategoryIcons);

  const priorityColor =
    item.priority === 'high'
      ? COLORS.danger
      : item.priority === 'medium'
      ? COLORS.warning
      : COLORS.success;

  const subtasksCount = item.subtasks?.length || 0;
  const completedSubtasksCount = item.subtasks?.filter((s) => s.completed).length || 0;

  // Extra notes = everything beyond the first (which mirrors description)
  const getExtraNotes = (list: string[]) => list.slice(1);

  const saveNote = () => {
    const trimmed = draftNote.trim();
    if (!trimmed) {
      setAddingNote(false);
      setDraftNote('');
      return;
    }
    const updated = [...notes, trimmed];
    setNotes(updated);
    onUpdateNotes(item.id, getExtraNotes(updated));
    setDraftNote('');
    setAddingNote(false);
  };

  const removeNote = (index: number) => {
    const updated = notes.filter((_, i) => i !== index);
    setNotes(updated);
    onUpdateNotes(item.id, getExtraNotes(updated));
  };

  const openNotePopup = (index: number) => {
    setEditDraft(notes[index]);
    setNotePopupIndex(index);
  };

  const closeNotePopup = () => {
    setNotePopupIndex(-1);
    setEditDraft('');
    setIsEditingNote(false);
  };

  const saveEditedNote = () => {
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    const updated = notes.map((n, i) => (i === notePopupIndex ? trimmed : n));
    setNotes(updated);
    onUpdateNotes(item.id, getExtraNotes(updated));
    setIsEditingNote(false);
    // keep popup open in view mode so user can see saved result
  };

  const totalNotes = notes.length;

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
        {/* Card Header: Icon + Category/Priority Tag + Edit/Delete Actions */}
        <View style={cardStyles.header}>
          <View style={cardStyles.headerLeftGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDetailVisible(true)}
              style={[
                cardStyles.iconWrapper,
                { backgroundColor: isCompleted ? 'rgba(255,255,255,0.06)' : theme.bg, borderColor: isCompleted ? COLORS.border : theme.border },
              ]}
            >
              <Ionicons name={theme.icon} size={22} color={isCompleted ? COLORS.textMuted : theme.accent} />
            </TouchableOpacity>

            <View style={cardStyles.headerMeta}>
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
              {totalCompletedCount > 0 && (
                <Text style={cardStyles.streakText}>
                  🔥 {totalCompletedCount} {totalCompletedCount === 1 ? 'day completed' : 'days completed'}
                </Text>
              )}
            </View>
          </View>

          <View style={cardStyles.headerActionGroup}>
            <TouchableOpacity
              onPress={() => onEdit(item)}
              style={cardStyles.actionHeaderBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={17} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              style={cardStyles.actionHeaderBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content body — tap anywhere to open detail */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setDetailVisible(true)}
          style={cardStyles.bodyTouchable}
        >
          {/* Main Habit Title */}
          <Text
            style={[cardStyles.title, isCompleted && cardStyles.titleCompleted]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* Badges Row */}
          <View style={cardStyles.badgeContainer}>
            {item.frequency && item.frequency !== 'once' && (
              <View style={[cardStyles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
                <Ionicons name="repeat" size={12} color={COLORS.success} style={{ marginRight: 4 }} />
                <Text style={[cardStyles.badgeText, { color: COLORS.success }]}>
                  {item.frequency === 'daily'
                    ? 'Daily'
                    : item.frequency === 'weekdays'
                    ? 'Weekdays'
                    : 'Custom Days'}
                </Text>
              </View>
            )}

            {item.timeSlot && item.timeSlot !== 'Anytime' && (
              <View style={[cardStyles.badge, { backgroundColor: 'rgba(56, 189, 248, 0.14)' }]}>
                <Ionicons name="time-outline" size={12} color={COLORS.accentUSD} style={{ marginRight: 4 }} />
                <Text style={[cardStyles.badgeText, { color: COLORS.accentUSD }]}>
                  {item.timeSlot}
                </Text>
              </View>
            )}

            {item.reminderTime ? (
              <View style={[cardStyles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
                <Ionicons name="alarm-outline" size={12} color={COLORS.warning} style={{ marginRight: 4 }} />
                <Text style={[cardStyles.badgeText, { color: COLORS.warning }]}>
                  {item.reminderTime}
                </Text>
              </View>
            ) : null}

            {subtasksCount > 0 && (
              <View style={[cardStyles.badge, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                <Ionicons name="checkbox-outline" size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                <Text style={cardStyles.badgeText}>
                  {completedSubtasksCount}/{subtasksCount} done
                </Text>
              </View>
            )}

            {totalNotes > 0 && (
              <View style={[cardStyles.badge, { backgroundColor: 'rgba(168, 85, 247, 0.14)' }]}>
                <Ionicons name="document-text-outline" size={12} color="#A855F7" style={{ marginRight: 4 }} />
                <Text style={[cardStyles.badgeText, { color: '#A855F7' }]}>
                  {totalNotes === 1 ? '1 Note' : `${totalNotes} Notes`}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={[cardStyles.divider, { backgroundColor: isCompleted ? COLORS.border : theme.border }]} />

        {/* Check / Complete Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
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
            name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={18}
            color={isCompleted ? '#08090C' : COLORS.textPrimary}
            style={{ marginRight: 8 }}
          />
          <Text style={[cardStyles.actionButtonText, { color: isCompleted ? '#08090C' : COLORS.textPrimary }]}>
            {isCompleted ? 'Completed (Tap to undo)' : 'Mark as Done'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Detail Modal ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailVisible}
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={cardStyles.modalOverlay}>
          <View style={cardStyles.modalBox}>
            {/* Modal header */}
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
                  style={cardStyles.modalIconBtn}
                >
                  <Ionicons name="create-outline" size={16} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setAddingNote(false);
                    setDraftNote('');
                    setDetailVisible(false);
                  }}
                  activeOpacity={0.7}
                  style={cardStyles.modalIconBtn}
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
              keyboardShouldPersistTaps="handled"
            >
              {/* ── NOTES / DESCRIPTIONS ── */}
              <View style={cardStyles.modalSection}>
                <View style={cardStyles.notesSectionHeader}>
                  <Text style={cardStyles.modalSectionLabel}>NOTES</Text>
                  {!addingNote && (
                    <TouchableOpacity
                      onPress={() => setAddingNote(true)}
                      activeOpacity={0.75}
                      style={cardStyles.addNoteBtn}
                    >
                      <Ionicons name="add" size={13} color={theme.accent} />
                      <Text style={[cardStyles.addNoteBtnText, { color: theme.accent }]}>
                        Add Another
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Existing notes */}
                {notes.length === 0 && !addingNote ? (
                  <TouchableOpacity
                    onPress={() => setAddingNote(true)}
                    activeOpacity={0.75}
                    style={cardStyles.emptyNoteBox}
                  >
                    <Ionicons name="document-text-outline" size={20} color={COLORS.textMuted} />
                    <Text style={cardStyles.emptyNoteText}>
                      {"There's no notes yet."}{'\n'}Tap to add.
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ gap: 8 }}>
                    {notes.map((note, idx) => (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.75}
                        onPress={() => openNotePopup(idx)}
                        style={cardStyles.noteItem}
                      >
                        <View style={cardStyles.noteNumberWrap}>
                          <Text style={[cardStyles.noteNumber, { color: theme.accent }]}>
                            {idx + 1}
                          </Text>
                        </View>
                        <Text style={cardStyles.noteText} numberOfLines={3}>{note}</Text>
                        <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Add note input */}
                {addingNote && (
                  <View style={cardStyles.addNoteInputWrap}>
                    <View style={cardStyles.noteNumberWrap}>
                      <Text style={[cardStyles.noteNumber, { color: theme.accent }]}>
                        {notes.length + 1}
                      </Text>
                    </View>
                    <TextInput
                      style={cardStyles.addNoteInput}
                      placeholder=""
                      placeholderTextColor={COLORS.textMuted}
                      value={draftNote}
                      onChangeText={setDraftNote}
                      multiline
                      autoFocus
                    />
                    <View style={{ gap: 4 }}>
                      <TouchableOpacity onPress={saveNote} style={cardStyles.noteSaveBtn}>
                        <Ionicons name="checkmark" size={14} color="#08090C" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setAddingNote(false);
                          setDraftNote('');
                        }}
                        style={cardStyles.noteCancelBtn}
                      >
                        <Ionicons name="close" size={14} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Inline add button below existing notes */}
                {notes.length > 0 && !addingNote && (
                  <TouchableOpacity
                    onPress={() => setAddingNote(true)}
                    activeOpacity={0.75}
                    style={[cardStyles.addNoteInlineBtn, { borderColor: theme.border }]}
                  >
                    <Ionicons name="add-circle-outline" size={14} color={theme.accent} style={{ marginRight: 6 }} />
                    <Text style={[cardStyles.addNoteInlineBtnText, { color: theme.accent }]}>
                      Add Another Notes {notes.length + 1}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ── CHECKLIST ── */}
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

              {/* ── DETAILS ── */}
              <View style={cardStyles.modalSection}>
                <Text style={cardStyles.modalSectionLabel}>DETAILS</Text>
                <View style={{ gap: 6 }}>
                  <Text style={cardStyles.metaDetailText}>
                    Priority:{' '}
                    <Text style={{ color: priorityColor, fontWeight: '700' }}>
                      {(item.priority || 'medium').toUpperCase()}
                    </Text>
                  </Text>
                  <Text style={cardStyles.metaDetailText}>
                    Frequency:{' '}
                    <Text style={{ color: COLORS.textPrimary, fontWeight: '600' }}>
                      {item.frequency || 'once'}
                    </Text>
                  </Text>
                  {item.reminderTime ? (
                    <Text style={cardStyles.metaDetailText}>
                      Reminder:{' '}
                      <Text style={{ color: COLORS.success, fontWeight: '600' }}>
                        {item.reminderTime}
                      </Text>
                    </Text>
                  ) : null}
                </View>
              </View>
            </ScrollView>

            {/* Check Button */}
            <TouchableOpacity
              onPress={() => onToggle(item.id)}
              activeOpacity={0.8}
              style={[
                cardStyles.modalCheckBtn,
                { backgroundColor: isCompleted ? COLORS.success : theme.accent },
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

      {/* ── Note Popup Modal ── */}
      <Modal
        animationType="fade"
        transparent
        visible={notePopupIndex >= 0}
        onRequestClose={closeNotePopup}
      >
        <TouchableOpacity
          style={cardStyles.popupOverlay}
          activeOpacity={1}
          onPress={() => {
            if (isEditingNote) setIsEditingNote(false);
            else closeNotePopup();
          }}
        >
          <TouchableOpacity activeOpacity={1} style={cardStyles.popupBox}>
            {/* Header */}
            <View style={cardStyles.popupHeader}>
              <View style={cardStyles.noteNumberWrap}>
                <Text style={[cardStyles.noteNumber, { color: theme.accent }]}>
                  {notePopupIndex + 1}
                </Text>
              </View>
              <Text style={[cardStyles.popupHeaderTitle, { color: theme.accent }]}>
                Notes {notePopupIndex + 1}
              </Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* Edit icon — only in view mode */}
                {!isEditingNote && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditDraft(notePopupIndex >= 0 ? notes[notePopupIndex] : '');
                      setIsEditingNote(true);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={cardStyles.popupEditIconBtn}
                  >
                    <Ionicons name="create-outline" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
                {/* Delete icon — only for extra notes (idx > 0) in view mode */}
                {!isEditingNote && notePopupIndex > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      removeNote(notePopupIndex);
                      closeNotePopup();
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={cardStyles.popupDeleteIconBtn}
                  >
                    <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
                {/* Close */}
                <TouchableOpacity
                  onPress={closeNotePopup}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* VIEW MODE */}
            {!isEditingNote ? (
              <View style={cardStyles.popupViewContent}>
                <Text style={cardStyles.popupViewText}>
                  {notePopupIndex >= 0 ? notes[notePopupIndex] : ''}
                </Text>
              </View>
            ) : (
              /* EDIT MODE */
              <>
                <TextInput
                  style={cardStyles.popupTextInput}
                  value={editDraft}
                  onChangeText={setEditDraft}
                  multiline
                  placeholder=""
                  placeholderTextColor={COLORS.textMuted}
                  textAlignVertical="top"
                  scrollEnabled
                  autoFocus
                />
                <View style={cardStyles.popupActions}>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    onPress={() => {
                      setIsEditingNote(false);
                      setEditDraft('');
                    }}
                    activeOpacity={0.75}
                    style={cardStyles.popupCancelBtn}
                  >
                    <Text style={cardStyles.popupCancelBtnText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={saveEditedNote}
                    activeOpacity={0.8}
                    style={[cardStyles.popupSaveBtn, { backgroundColor: theme.accent }]}
                  >
                    <Ionicons name="checkmark" size={14} color="#08090C" style={{ marginRight: 4 }} />
                    <Text style={cardStyles.popupSaveBtnText}>Simpan</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerMeta: {
    flex: 1,
  },
  headerActionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionHeaderBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  priorityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
  },
  bodyTouchable: {
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 23,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  titleCompleted: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 13,
    minHeight: 48,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalBox: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 38 : 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.borderLight,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  modalTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  modalIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 18,
  },
  modalScroll: {
    maxHeight: 460,
  },
  modalSection: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  modalSectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // ── Notes ──
  notesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addNoteBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyNoteBox: {
    alignItems: 'center',
    paddingVertical: 22,
    gap: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  emptyNoteText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteNumberWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 21,
    fontWeight: '500',
  },
  addNoteInputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addNoteInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  noteSaveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNoteInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    minHeight: 46,
  },
  addNoteInlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Subtasks ──
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 46,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  subtaskText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  subtaskCompletedText: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },

  // ── Meta details ──
  metaDetailText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 22,
  },

  // ── Check button ──
  modalCheckBtn: {
    marginTop: 16,
    width: '100%',
    paddingVertical: 16,
    minHeight: 52,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCheckBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#08090C',
    letterSpacing: 0.3,
  },

  // ── Note Popup ──
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popupBox: {
    width: '100%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  popupHeaderTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  popupTextInput: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
    minHeight: 140,
    maxHeight: 280,
    marginBottom: 16,
  },
  popupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popupDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  popupDeleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  popupCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  popupCancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  popupSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  popupSaveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#08090C',
  },
  // view-only content area
  popupViewContent: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    minHeight: 100,
    maxHeight: 300,
  },
  popupViewText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
    fontWeight: '500',
  },
  // icon-only buttons in popup header
  popupEditIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupDeleteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});