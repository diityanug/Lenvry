import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../types/habits';
import { COLORS, RADIUS } from '../../constants/theme';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';

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

const buildNotesList = (habit: Habit): string[] => {
  const base = habit.description ? [habit.description] : [];
  const extra = habit.extraNotes || [];
  return [...base, ...extra.filter((n) => n !== habit.description)];
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
  const keyboardHeight = useKeyboardHeight();
  const detailScrollRef = useRef<ScrollView>(null);

  const [detailVisible, setDetailVisible] = useState(false);
  const [draftNote, setDraftNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [notePopupIndex, setNotePopupIndex] = useState<number>(-1);
  const [editDraft, setEditDraft] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const notes = buildNotesList(item);
  const theme = getCategoryTheme(item.category, customCategoryIcons);

  // Auto-scroll to note input when adding a note or when keyboard opens
  useEffect(() => {
    if (addingNote) {
      const timer = setTimeout(() => {
        detailScrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [addingNote, keyboardHeight]);

  const priorityColor =
    item.priority === 'high'
      ? COLORS.danger
      : item.priority === 'medium'
      ? COLORS.warning
      : COLORS.success;

  const priorityLabel =
    item.priority === 'high' ? 'High' : item.priority === 'medium' ? 'Medium' : 'Low';

  const frequencyLabel =
    item.frequency === 'daily'
      ? 'Daily'
      : item.frequency === 'weekdays'
      ? 'Weekdays'
      : item.frequency === 'custom_days'
      ? 'Custom Days'
      : 'Once';

  const subtasksCount = item.subtasks?.length || 0;
  const completedSubtasksCount = item.subtasks?.filter((s) => s.completed).length || 0;

  // Extra notes beyond base description
  const getExtraNotes = (list: string[]) => (item.description ? list.slice(1) : list);

  // Unified save handler for both adding and editing notes
  const handleSaveNote = (mode: 'add' | 'edit') => {
    const raw = mode === 'add' ? draftNote : editDraft;
    const trimmed = raw.trim();
    if (!trimmed) {
      if (mode === 'add') {
        setAddingNote(false);
        setDraftNote('');
      }
      return;
    }

    const updated =
      mode === 'add'
        ? [...notes, trimmed]
        : notes.map((n, i) => (i === notePopupIndex ? trimmed : n));

    onUpdateNotes(item.id, getExtraNotes(updated));
    Keyboard.dismiss();

    if (mode === 'add') {
      setDraftNote('');
      setAddingNote(false);
    } else {
      setIsEditingNote(false);
    }
  };

  const removeNote = (index: number) => {
    const updated = notes.filter((_, i) => i !== index);
    onUpdateNotes(item.id, getExtraNotes(updated));
  };

  const openNotePopup = (index: number) => {
    setEditDraft(notes[index]);
    setIsEditingNote(false);
    setNotePopupIndex(index);
  };

  const closeNotePopup = () => {
    Keyboard.dismiss();
    setNotePopupIndex(-1);
    setEditDraft('');
    setIsEditingNote(false);
  };

  // Step-back handler for inner note popup modal
  const handleBackOrCloseNotePopup = () => {
    if (isEditingNote) {
      Keyboard.dismiss();
      setEditDraft(notes[notePopupIndex] || '');
      setIsEditingNote(false);
      return;
    }
    closeNotePopup();
  };

  // Step-back handler for detail modal
  const handleBackOrCloseDetail = () => {
    if (addingNote) {
      Keyboard.dismiss();
      setAddingNote(false);
      setDraftNote('');
      return;
    }
    setDetailVisible(false);
  };

  return (
    <>
      {/* Cover Card: Category + Title + Complete Toggle */}
      <View
        style={[
          cardStyles.card,
          {
            backgroundColor: isCompleted ? COLORS.bgCardSub : theme.bg,
            borderColor: isCompleted ? COLORS.border : theme.border,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setDetailVisible(true)}
          style={cardStyles.coverMainArea}
        >
          <View
            style={[
              cardStyles.iconWrapper,
              {
                backgroundColor: isCompleted ? 'rgba(255,255,255,0.05)' : theme.bg,
                borderColor: isCompleted ? COLORS.border : theme.border,
              },
            ]}
          >
            <Ionicons
              name={theme.icon}
              size={20}
              color={isCompleted ? COLORS.textMuted : theme.accent}
            />
          </View>

          <View style={cardStyles.coverTextGroup}>
            <Text
              style={[
                cardStyles.categoryName,
                { color: isCompleted ? COLORS.textMuted : theme.accent },
              ]}
              numberOfLines={1}
            >
              {item.category.toUpperCase()}
            </Text>
            <Text
              style={[cardStyles.title, isCompleted && cardStyles.titleCompleted]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => onToggle(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[
            cardStyles.checkBtn,
            {
              backgroundColor: isCompleted ? theme.accent : 'rgba(255,255,255,0.04)',
              borderColor: isCompleted ? theme.accent : COLORS.borderLight,
            },
          ]}
        >
          <Ionicons
            name="checkmark"
            size={18}
            color={isCompleted ? '#08090C' : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailVisible}
        onRequestClose={handleBackOrCloseDetail}
      >
        <View style={cardStyles.modalOverlay}>
          <View style={cardStyles.modalBox}>
            {/* Modal Header */}
            <View style={cardStyles.modalHeader}>
              <View
                style={[
                  cardStyles.modalTag,
                  { backgroundColor: theme.bg, borderColor: theme.border },
                ]}
              >
                <Ionicons
                  name={theme.icon}
                  size={13}
                  color={theme.accent}
                  style={{ marginRight: 6 }}
                />
                <Text style={[cardStyles.modalTagText, { color: theme.accent }]}>
                  {item.category.toUpperCase()}
                </Text>
              </View>

              <View style={cardStyles.modalHeaderActions}>
                <TouchableOpacity
                  onPress={() => onEdit(item)}
                  activeOpacity={0.7}
                  style={cardStyles.modalIconBtn}
                >
                  <Ionicons name="create-outline" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onDelete(item.id)}
                  activeOpacity={0.7}
                  style={cardStyles.modalIconBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setAddingNote(false);
                    setDraftNote('');
                    setDetailVisible(false);
                  }}
                  activeOpacity={0.7}
                  style={cardStyles.modalIconBtn}
                >
                  <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              ref={detailScrollRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              contentContainerStyle={[
                cardStyles.modalScrollContent,
                { paddingBottom: Math.max(24, keyboardHeight + 24) },
              ]}
            >
              {/* Title & Completion Status Banner */}
              <Text style={cardStyles.modalTitle}>{item.title}</Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onToggle(item.id)}
                style={[
                  cardStyles.statusBanner,
                  {
                    backgroundColor: isCompleted ? theme.accent : COLORS.bgCardSub,
                    borderColor: isCompleted ? theme.accent : COLORS.borderLight,
                  },
                ]}
              >
                <Ionicons
                  name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={isCompleted ? '#08090C' : COLORS.textPrimary}
                />
                <Text
                  style={[
                    cardStyles.statusBannerText,
                    { color: isCompleted ? '#08090C' : COLORS.textPrimary },
                  ]}
                >
                  {isCompleted ? 'Completed Today (Tap to undo)' : 'Mark as Completed'}
                </Text>
              </TouchableOpacity>

              <View style={cardStyles.sectionDivider} />

              {/* View-Only Overview Section */}
              <Text style={cardStyles.sectionTitle}>OVERVIEW</Text>
              <View style={cardStyles.metaList}>
                <View style={cardStyles.metaItemRow}>
                  <View style={cardStyles.metaLabelWrap}>
                    <Ionicons name="flag-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={cardStyles.metaLabel}>Priority</Text>
                  </View>
                  <View style={cardStyles.priorityValueWrap}>
                    <View style={[cardStyles.priorityDot, { backgroundColor: priorityColor }]} />
                    <Text style={[cardStyles.metaValue, { color: priorityColor }]}>
                      {priorityLabel}
                    </Text>
                  </View>
                </View>

                <View style={cardStyles.metaItemRow}>
                  <View style={cardStyles.metaLabelWrap}>
                    <Ionicons name="repeat-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={cardStyles.metaLabel}>Frequency</Text>
                  </View>
                  <Text style={cardStyles.metaValue}>{frequencyLabel}</Text>
                </View>

                <View style={cardStyles.metaItemRow}>
                  <View style={cardStyles.metaLabelWrap}>
                    <Ionicons name="sunny-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={cardStyles.metaLabel}>Time of Day</Text>
                  </View>
                  <Text style={cardStyles.metaValue}>{item.timeSlot || 'Anytime'}</Text>
                </View>

                <View style={cardStyles.metaItemRow}>
                  <View style={cardStyles.metaLabelWrap}>
                    <Ionicons name="alarm-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={cardStyles.metaLabel}>Reminder</Text>
                  </View>
                  <Text style={cardStyles.metaValue}>{item.reminderTime || 'Off'}</Text>
                </View>

                <View style={cardStyles.metaItemRow}>
                  <View style={cardStyles.metaLabelWrap}>
                    <Ionicons name="flame-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={cardStyles.metaLabel}>Total Completed</Text>
                  </View>
                  <Text style={cardStyles.metaValue}>
                    {totalCompletedCount} {totalCompletedCount === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              </View>

              {/* Checklist Section */}
              {subtasksCount > 0 && (
                <>
                  <View style={cardStyles.sectionDivider} />
                  <Text style={cardStyles.sectionTitle}>
                    CHECKLIST ({completedSubtasksCount}/{subtasksCount})
                  </Text>

                  <View style={cardStyles.checklistContainer}>
                    {item.subtasks?.map((sub) => (
                      <TouchableOpacity
                        key={sub.id}
                        style={cardStyles.subtaskRow}
                        onPress={() => onToggleSubtask(item.id, sub.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            cardStyles.checkbox,
                            sub.completed && {
                              backgroundColor: theme.accent,
                              borderColor: theme.accent,
                            },
                          ]}
                        >
                          {sub.completed && (
                            <Ionicons name="checkmark" size={12} color="#08090C" />
                          )}
                        </View>
                        <Text
                          style={[
                            cardStyles.subtaskText,
                            sub.completed && cardStyles.subtaskCompletedText,
                          ]}
                        >
                          {sub.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={cardStyles.sectionDivider} />

              {/* Notes Section */}
              <Text style={cardStyles.sectionTitle}>NOTES</Text>

              {notes.length > 0 ? (
                <View style={cardStyles.notesList}>
                  {notes.map((note, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={cardStyles.noteRow}
                      onPress={() => openNotePopup(idx)}
                      activeOpacity={0.75}
                    >
                      <View style={[cardStyles.noteAccentBar, { backgroundColor: theme.accent }]} />
                      <View style={cardStyles.noteContentWrap}>
                        <Text style={cardStyles.noteIndexLabel}>Note #{idx + 1}</Text>
                        <Text style={cardStyles.notePreviewText} numberOfLines={3}>
                          {note}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeNote(idx)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={cardStyles.noteRemoveBtn}
                      >
                        <Ionicons name="trash-outline" size={15} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                !addingNote && (
                  <Text style={cardStyles.emptyNotesText}>
                    No notes added for this habit yet.
                  </Text>
                )
              )}

              {addingNote ? (
                <View
                  style={cardStyles.noteEditorWrap}
                  onLayout={() => {
                    detailScrollRef.current?.scrollToEnd({ animated: true });
                  }}
                >
                  <TextInput
                    style={cardStyles.noteInput}
                    placeholder="Write a note..."
                    placeholderTextColor={COLORS.textMuted}
                    value={draftNote}
                    onChangeText={setDraftNote}
                    onFocus={() => {
                      setTimeout(() => {
                        detailScrollRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                    multiline
                    autoFocus
                  />
                  <View style={cardStyles.noteEditorActions}>
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setAddingNote(false);
                        setDraftNote('');
                      }}
                      style={cardStyles.noteCancelBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={cardStyles.noteCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSaveNote('add')}
                      style={[cardStyles.noteSaveBtn, { backgroundColor: theme.accent }]}
                      activeOpacity={0.8}
                    >
                      <Text style={cardStyles.noteSaveText}>Save Note</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setAddingNote(true)}
                  activeOpacity={0.75}
                  style={cardStyles.addNoteBtn}
                >
                  <Ionicons name="add-circle-outline" size={16} color={theme.accent} />
                  <Text style={[cardStyles.addNoteBtnText, { color: theme.accent }]}>
                    Add Note
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Inner Note View / Edit Modal (nested so closing returns to Detail Modal) */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={notePopupIndex >= 0}
          onRequestClose={handleBackOrCloseNotePopup}
        >
          <ScrollView
            contentContainerStyle={[
              cardStyles.popupOverlay,
              { paddingBottom: Math.max(20, keyboardHeight + 20) },
            ]}
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={cardStyles.popupBox}>
              {/* Popup Header */}
              <View style={cardStyles.popupHeader}>
                <View style={cardStyles.popupTitleRow}>
                  <View
                    style={[
                      cardStyles.popupIconBadge,
                      { backgroundColor: theme.bg, borderColor: theme.border },
                    ]}
                  >
                    <Ionicons name="document-text-outline" size={14} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={cardStyles.popupLabel}>
                      {isEditingNote ? 'EDITING NOTE' : `NOTE #${notePopupIndex + 1}`}
                    </Text>
                    <Text style={cardStyles.popupSubLabel} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleBackOrCloseNotePopup}
                  style={cardStyles.modalIconBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={cardStyles.popupDivider} />

              {/* View-Only vs Edit Mode */}
              {!isEditingNote ? (
                <>
                  <ScrollView
                    style={cardStyles.popupReaderScroll}
                    contentContainerStyle={cardStyles.popupReaderContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={cardStyles.popupReaderText} selectable>
                      {notePopupIndex >= 0 ? notes[notePopupIndex] : ''}
                    </Text>
                  </ScrollView>

                  <View style={cardStyles.popupFooter}>
                    <TouchableOpacity
                      onPress={() => {
                        const idx = notePopupIndex;
                        closeNotePopup();
                        removeNote(idx);
                      }}
                      style={cardStyles.popupDeleteBtn}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                      <Text style={cardStyles.popupDeleteText}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setIsEditingNote(true)}
                      style={[cardStyles.popupPrimaryBtn, { backgroundColor: theme.accent }]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="create-outline" size={15} color="#08090C" />
                      <Text style={cardStyles.popupPrimaryText}>Edit Note</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <TextInput
                    style={cardStyles.popupTextInput}
                    value={editDraft}
                    onChangeText={setEditDraft}
                    multiline
                    autoFocus
                    placeholder="Write your note here..."
                    placeholderTextColor={COLORS.textMuted}
                  />

                  <View style={cardStyles.popupFooter}>
                    <TouchableOpacity
                      onPress={handleBackOrCloseNotePopup}
                      style={cardStyles.noteCancelBtn}
                      activeOpacity={0.75}
                    >
                      <Text style={cardStyles.noteCancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSaveNote('edit')}
                      style={[cardStyles.popupPrimaryBtn, { backgroundColor: theme.accent }]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark" size={16} color="#08090C" />
                      <Text style={cardStyles.popupPrimaryText}>Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </Modal>
      </Modal>
    </>
  );
}

const cardStyles = StyleSheet.create({
  // Cover Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  coverMainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  coverTextGroup: {
    flex: 1,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Detail Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  modalIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.bgCardSub,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 28,
    marginBottom: 14,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.9,
    marginBottom: 12,
  },

  // View-Only Overview Rows
  metaList: {
    gap: 12,
  },
  metaItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  priorityValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // Checklist
  checklistContainer: {
    gap: 10,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  subtaskCompletedText: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },

  // Notes List
  notesList: {
    gap: 10,
    marginBottom: 12,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.bgCardSub,
  },
  noteAccentBar: {
    width: 3,
    borderRadius: 2,
    alignSelf: 'stretch',
    marginRight: 10,
  },
  noteContentWrap: {
    flex: 1,
    marginRight: 8,
  },
  noteIndexLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  notePreviewText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  noteRemoveBtn: {
    padding: 4,
  },
  emptyNotesText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderLight,
  },
  addNoteBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noteEditorWrap: {
    marginTop: 4,
  },
  noteInput: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: 12,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    minHeight: 88,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  noteEditorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  noteCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCancelText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  noteSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteSaveText: {
    fontSize: 13,
    color: '#08090C',
    fontWeight: '700',
  },

  // Note View/Edit Popup
  popupOverlay: {
    flexGrow: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  popupBox: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    width: '100%',
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  popupIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  popupSubLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  popupDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  popupReaderScroll: {
    maxHeight: 320,
  },
  popupReaderContent: {
    paddingVertical: 4,
  },
  popupReaderText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  popupTextInput: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: 12,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 150,
    maxHeight: 280,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  popupFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  popupDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  popupDeleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  popupPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  popupPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#08090C',
  },
});