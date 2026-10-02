import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import {
  StickyNote,
  StickyNoteColor,
  ChecklistItem,
  STICKY_COLORS,
} from '../../types/notes';

interface StickyNoteModalProps {
  visible: boolean;
  note: StickyNote | null;
  onClose: () => void;
  onSave: (note: StickyNote) => void;
  onDelete?: (id: string) => void;
}

export default function StickyNoteModal({
  visible,
  note,
  onClose,
  onSave,
  onDelete,
}: StickyNoteModalProps) {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      {visible ? (
        <StickyNoteModalContent
          key={note ? note.id : 'new-sticky-note'}
          note={note}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      ) : null}
    </Modal>
  );
}

function StickyNoteModalContent({
  note,
  onClose,
  onSave,
  onDelete,
}: {
  note: StickyNote | null;
  onClose: () => void;
  onSave: (note: StickyNote) => void;
  onDelete?: (id: string) => void;
}) {
  const isExisting = Boolean(note);

  // If opening an existing note, start in View Only mode; if creating new, start in Edit mode
  const [isEditMode, setIsEditMode] = useState<boolean>(!isExisting);

  const [title, setTitle] = useState(note?.title || '');
  const [type, setType] = useState<'text' | 'checklist'>(note?.type || 'checklist');
  const [color, setColor] = useState<StickyNoteColor>(note?.color || 'amber');
  const [description, setDescription] = useState(note?.description || '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(note?.checklist || []);
  const [newItemText, setNewItemText] = useState('');
  const [error, setError] = useState('');

  const palette = STICKY_COLORS[color] || STICKY_COLORS.amber;

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  // Toggle item in View mode or Edit mode
  const handleToggleChecklistItem = (itemId: string) => {
    const updatedChecklist = checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    setChecklist(updatedChecklist);

    // If in View mode for an existing note, persist checklist changes immediately
    if (note && !isEditMode) {
      onSave({
        ...note,
        checklist: updatedChecklist,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleAddChecklistItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      text: trimmed,
      done: false,
    };
    setChecklist((prev) => [...prev, newItem]);
    setNewItemText('');
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a note title.');
      return;
    }

    const noteToSave: StickyNote = {
      id: note?.id || Date.now().toString(),
      title: trimmedTitle,
      type,
      color,
      description: description.trim(),
      checklist,
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    Keyboard.dismiss();
    onSave(noteToSave);
    if (isExisting) {
      setIsEditMode(false);
    } else {
      onClose();
    }
  };

  const handleDeletePrompt = () => {
    if (!note || !onDelete) return;
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(note.id);
            onClose();
          },
        },
      ]
    );
  };

  const totalItems = checklist.length;
  const completedItems = checklist.filter((item) => item.done).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: COLORS.bgCard,
                  borderColor: palette.border,
                },
              ]}
            >
              {/* Header Bar */}
              <View style={styles.headerBar}>
                <View style={styles.headerLeft}>
                  <View style={[styles.pinCircle, { backgroundColor: palette.headerBg }]}>
                    <Ionicons name="pin" size={16} color={palette.accent} />
                  </View>
                  <Text style={styles.headerTitle}>
                    {!isEditMode
                      ? 'Note Details'
                      : isExisting
                      ? 'Edit Note'
                      : 'New Pinned Note'}
                  </Text>
                </View>

                <View style={styles.headerActions}>
                  {isEditMode && isExisting && onDelete && (
                    <TouchableOpacity
                      onPress={handleDeletePrompt}
                      style={styles.iconBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.iconBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ======================================================== */}
              {/* VIEW ONLY MODE */}
              {/* ======================================================== */}
              {!isEditMode ? (
                <View style={{ flexShrink: 1 }}>
                  {/* Date & Title */}
                  <View style={styles.viewBadgeRow}>
                    <Text style={styles.viewDateText}>
                      {note?.createdAt
                        ? new Date(note.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Today'}
                    </Text>
                  </View>

                  <Text style={styles.viewTitle}>{title}</Text>

                  <ScrollView
                    style={styles.viewScrollArea}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                  >
                    {/* Optional Note Description in View Mode */}
                    {Boolean(description?.trim()) && (
                      <View style={styles.viewDescBox}>
                        <Text style={styles.viewDescText}>{description}</Text>
                      </View>
                    )}

                    {/* Checklist View */}
                    {type === 'checklist' && (
                      <View style={styles.viewChecklistSection}>
                        {totalItems > 0 && (
                          <View style={styles.viewProgressRow}>
                            <View style={styles.progressTrack}>
                              <View
                                style={[
                                  styles.progressFill,
                                  {
                                    width: `${progressPercent}%`,
                                    backgroundColor: palette.accent,
                                  },
                                ]}
                              />
                            </View>
                            <Text style={[styles.progressText, { color: palette.accent }]}>
                              {completedItems}/{totalItems} ({progressPercent}%)
                            </Text>
                          </View>
                        )}

                        <View style={styles.checklistContainer}>
                          {checklist.map((item) => (
                            <TouchableOpacity
                              key={item.id}
                              style={styles.viewCheckItemRow}
                              onPress={() => handleToggleChecklistItem(item.id)}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={item.done ? 'checkbox' : 'square-outline'}
                                size={20}
                                color={item.done ? palette.accent : COLORS.textMuted}
                              />
                              <Text
                                style={[
                                  styles.itemText,
                                  item.done && styles.itemTextDone,
                                ]}
                              >
                                {item.text}
                              </Text>
                            </TouchableOpacity>
                          ))}

                          {totalItems === 0 && (
                            <Text style={styles.emptyItemsNotice}>
                              No checklist items recorded yet.
                            </Text>
                          )}
                        </View>
                      </View>
                    )}

                    {type === 'text' && !description?.trim() && (
                      <Text style={styles.emptyItemsNotice}>No description provided.</Text>
                    )}
                  </ScrollView>

                  {/* View Mode Footer Actions */}
                  <View style={styles.viewActionRow}>
                    <TouchableOpacity
                      style={[styles.btnSecondary, { borderColor: palette.border }]}
                      onPress={() => setIsEditMode(true)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="pencil" size={15} color={palette.accent} style={{ marginRight: 6 }} />
                      <Text style={[styles.btnSecondaryText, { color: palette.accent }]}>Edit Note</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnPrimary, { backgroundColor: palette.accent }]}
                      onPress={onClose}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.btnPrimaryText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* ======================================================== */
                /* EDIT MODE */
                /* ======================================================== */
                <View style={{ flexShrink: 1 }}>
                  {/* Color Picker Palette */}
                  <View style={styles.colorPickerRow}>
                    {(['amber', 'blue', 'emerald', 'rose', 'purple'] as StickyNoteColor[]).map((c) => {
                      const p = STICKY_COLORS[c];
                      const isSelected = color === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.colorCircle,
                            { backgroundColor: p.accent },
                            isSelected && styles.colorCircleSelected,
                          ]}
                          onPress={() => setColor(c)}
                          activeOpacity={0.7}
                        >
                          {isSelected && <Ionicons name="checkmark" size={14} color="#08090C" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Type Switcher (Text vs Checklist) */}
                  <View style={styles.typeSwitcher}>
                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        type === 'checklist' && [styles.typeBtnActive, { borderColor: palette.accent }],
                      ]}
                      onPress={() => setType('checklist')}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="checkbox-outline"
                        size={15}
                        color={type === 'checklist' ? palette.accent : COLORS.textMuted}
                      />
                      <Text
                        style={[
                          styles.typeBtnText,
                          type === 'checklist' && { color: palette.accent, fontWeight: '700' },
                        ]}
                      >
                        Checklist
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        type === 'text' && [styles.typeBtnActive, { borderColor: palette.accent }],
                      ]}
                      onPress={() => setType('text')}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={15}
                        color={type === 'text' ? palette.accent : COLORS.textMuted}
                      />
                      <Text
                        style={[
                          styles.typeBtnText,
                          type === 'text' && { color: palette.accent, fontWeight: '700' },
                        ]}
                      >
                        Text Note
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Title Input */}
                  <Text style={styles.inputLabel}>NOTE TITLE</Text>
                  <TextInput
                    style={[styles.titleInput, Boolean(error) && { borderColor: COLORS.danger }]}
                    placeholder="e.g. Monthly Grocery etc."
                    placeholderTextColor={COLORS.textMuted}
                    value={title}
                    onChangeText={(val) => {
                      setTitle(val);
                      if (error) setError('');
                    }}
                    autoFocus={!isExisting}
                  />
                  {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}

                  <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Description Box */}
                    <Text style={styles.inputLabel}>
                      {type === 'checklist' ? 'DESCRIPTION (OPTIONAL)' : 'NOTE CONTENT'}
                    </Text>
                    <TextInput
                      style={[
                        styles.descInput,
                        type === 'text' && { minHeight: 110 },
                      ]}
                      placeholder={
                        type === 'checklist'
                          ? 'e.g. store name, budget, or any notes...'
                          : 'Write your thoughts, plans, or notes here...'
                      }
                      placeholderTextColor={COLORS.textMuted}
                      value={description}
                      onChangeText={setDescription}
                      multiline={true}
                      textAlignVertical="top"
                    />

                    {/* Checklist Section in Edit Mode */}
                    {type === 'checklist' && (
                      <View style={styles.checklistSection}>
                        <View style={styles.checklistHeader}>
                          <Text style={styles.inputLabel}>CHECKLIST ITEMS</Text>
                          {totalItems > 0 && (
                            <Text style={[styles.progressText, { color: palette.accent }]}>
                              {completedItems}/{totalItems} Completed
                            </Text>
                          )}
                        </View>

                        {/* Progress Bar */}
                        {totalItems > 0 && (
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${progressPercent}%`,
                                  backgroundColor: palette.accent,
                                },
                              ]}
                            />
                          </View>
                        )}

                        {/* Checklist Items List */}
                        <View style={styles.checklistContainer}>
                          {checklist.map((item) => (
                            <View key={item.id} style={styles.itemRow}>
                              <TouchableOpacity
                                onPress={() => handleToggleChecklistItem(item.id)}
                                style={styles.checkboxTouch}
                                activeOpacity={0.7}
                              >
                                <Ionicons
                                  name={item.done ? 'checkbox' : 'square-outline'}
                                  size={19}
                                  color={item.done ? palette.accent : COLORS.textMuted}
                                />
                                <Text
                                  style={[
                                    styles.itemText,
                                    item.done && styles.itemTextDone,
                                  ]}
                                >
                                  {item.text}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleDeleteChecklistItem(item.id)}
                                style={styles.deleteItemBtn}
                                activeOpacity={0.6}
                              >
                                <Ionicons name="close-circle-outline" size={18} color={COLORS.textMuted} />
                              </TouchableOpacity>
                            </View>
                          ))}

                          {totalItems === 0 && (
                            <Text style={styles.emptyItemsNotice}>
                              No items yet.
                            </Text>
                          )}
                        </View>

                        {/* Add Item Row */}
                        <View style={styles.addItemRow}>
                          <TextInput
                            style={styles.addItemInput}
                            placeholder="Add item"
                            placeholderTextColor={COLORS.textMuted}
                            value={newItemText}
                            onChangeText={setNewItemText}
                            returnKeyType="done"
                            onSubmitEditing={handleAddChecklistItem}
                          />
                          <TouchableOpacity
                            style={[styles.addItemBtn, { backgroundColor: palette.accent }]}
                            onPress={handleAddChecklistItem}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="add" size={20} color="#08090C" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </ScrollView>

                  {/* Edit Mode Bottom Actions */}
                  <View style={styles.editActionRow}>
                    {isExisting && (
                      <TouchableOpacity
                        style={styles.btnCancelEdit}
                        onPress={() => setIsEditMode(false)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.btnCancelEditText}>Cancel</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.btnPrimary,
                        { backgroundColor: palette.accent },
                        !isExisting && { flex: 1 },
                      ]}
                      onPress={handleSave}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.btnPrimaryText}>
                        {isExisting ? 'Save Changes' : 'Pin Note'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1.5,
    elevation: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  viewTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  viewScrollArea: {
    maxHeight: 260,
  },
  viewDescBox: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 12,
  },
  viewDescText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  viewChecklistSection: {
    marginBottom: 8,
  },
  viewProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  viewCheckItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  viewActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCardSub,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  btnPrimary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  btnPrimaryText: {
    color: '#08090C',
    fontSize: 13,
    fontWeight: '800',
  },
  colorPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
    paddingVertical: 2,
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeBtnActive: {
    backgroundColor: COLORS.bgCard,
  },
  typeBtnText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  titleInput: {
    backgroundColor: COLORS.bgCardSub,
    color: COLORS.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    fontSize: 14,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    marginTop: -6,
    marginBottom: 8,
    fontWeight: '600',
  },
  scrollArea: {
    maxHeight: 250,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  descInput: {
    backgroundColor: COLORS.bgCardSub,
    color: COLORS.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    fontSize: 13,
    lineHeight: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 50,
    marginBottom: 12,
  },
  checklistSection: {
    marginTop: 2,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.bgCardSub,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  checklistContainer: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  checkboxTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  itemText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  itemTextDone: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  deleteItemBtn: {
    padding: 2,
  },
  emptyItemsNotice: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addItemInput: {
    flex: 1,
    backgroundColor: COLORS.bgCardSub,
    color: COLORS.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addItemBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  btnCancelEdit: {
    flex: 1,
    backgroundColor: COLORS.bgCardSub,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnCancelEditText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
