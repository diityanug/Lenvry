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
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS, RADIUS } from '../../constants/theme';
import AppAlertModal, { AppAlertConfig } from '../Common/AppAlertModal';
import {
  StickyNote,
  StickyNoteColor,
  ChecklistItem,
  STICKY_COLORS,
  NoteCategory,
  NOTE_CATEGORIES,
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
  const [category, setCategory] = useState<NoteCategory>(note?.category || 'General');
  const [color, setColor] = useState<StickyNoteColor>(note?.color || 'amber');
  const [description, setDescription] = useState(note?.description || '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(note?.checklist || []);
  const [newItemText, setNewItemText] = useState('');
  const [error, setError] = useState('');
  const [copiedToast, setCopiedToast] = useState('');

  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const palette = STICKY_COLORS[color] || STICKY_COLORS.amber;
  const categoryConfig = NOTE_CATEGORIES[category] || NOTE_CATEGORIES.General;

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleCopyText = async (textToCopy: string) => {
    if (!textToCopy) return;
    await Clipboard.setStringAsync(textToCopy);
    setCopiedToast('Copied to clipboard!');
    setTimeout(() => setCopiedToast(''), 2000);
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
      category,
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
    setAlertConfig({
      visible: true,
      type: 'danger',
      title: 'Delete Note',
      message: `Are you sure you want to delete "${note.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        onDelete(note.id);
        onClose();
      },
    });
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
                  {isExisting && onDelete && (
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

              {/* Toast for Quick Copy */}
              {Boolean(copiedToast) && (
                <View style={styles.toastBox}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                  <Text style={styles.toastText}>{copiedToast}</Text>
                </View>
              )}

              {/* ======================================================== */}
              {/* VIEW ONLY MODE */}
              {/* ======================================================== */}
              {!isEditMode ? (
                <View style={{ flexShrink: 1 }}>
                  {/* Category & Date Header */}
                  <View style={styles.viewBadgeRow}>
                    <View style={[styles.categoryTag, { backgroundColor: categoryConfig.color + '22', borderColor: categoryConfig.color + '55' }]}>
                      <Ionicons name={categoryConfig.icon as any} size={13} color={categoryConfig.color} />
                      <Text style={[styles.categoryTagText, { color: categoryConfig.color }]}>
                        {categoryConfig.label}
                      </Text>
                    </View>

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
                    {/* Note Description in View Mode */}
                    {Boolean(description?.trim()) && (
                      <View style={styles.viewDescBox}>
                        <View style={styles.descBoxHeader}>
                          <Text style={styles.viewDescHeaderLabel}>Content</Text>
                          <TouchableOpacity
                            style={styles.copyBtn}
                            onPress={() => handleCopyText(description.trim())}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="copy-outline" size={13} color={palette.accent} />
                            <Text style={[styles.copyBtnText, { color: palette.accent }]}>Copy</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.viewDescText} selectable={true}>
                          {description}
                        </Text>
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
                            <View key={item.id} style={styles.viewCheckItemWrapper}>
                              <TouchableOpacity
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

                              <TouchableOpacity
                                onPress={() => handleCopyText(item.text)}
                                style={styles.copyItemIconBtn}
                                activeOpacity={0.6}
                              >
                                <Ionicons name="copy-outline" size={14} color={COLORS.textMuted} />
                              </TouchableOpacity>
                            </View>
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
                  {/* Category Picker Selector */}
                  <Text style={styles.inputLabel}>CATEGORY</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryPickerRow}
                  >
                    {(Object.keys(NOTE_CATEGORIES) as NoteCategory[]).map((catKey) => {
                      const cfg = NOTE_CATEGORIES[catKey];
                      const isSel = category === catKey;
                      return (
                        <TouchableOpacity
                          key={catKey}
                          style={[
                            styles.categoryPill,
                            { borderColor: isSel ? cfg.color : COLORS.border },
                            isSel && { backgroundColor: cfg.color + '22' },
                          ]}
                          onPress={() => setCategory(catKey)}
                          activeOpacity={0.75}
                        >
                          <Ionicons
                            name={cfg.icon as any}
                            size={14}
                            color={isSel ? cfg.color : COLORS.textMuted}
                          />
                          <Text
                            style={[
                              styles.categoryPillText,
                              { color: isSel ? cfg.color : COLORS.textMuted },
                              isSel && { fontWeight: '700' },
                            ]}
                          >
                            {cfg.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Color Picker Palette */}
                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>CARD COLOR</Text>
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
                    placeholder={category === 'Personal' ? 'e.g. WiFi Password, Email Credentials' : 'e.g. Monthly Grocery, Project Ideas'}
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
                      {type === 'checklist' ? 'DESCRIPTION' : 'NOTE CONTENT'}
                    </Text>
                    <TextInput
                      style={[
                        styles.descInput,
                        type === 'text' && { minHeight: 110 },
                      ]}
                      placeholder={
                        category === 'Personal'
                          ? 'e.g. Email: user@email.com\nPass: **********'
                          : type === 'checklist'
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

      {/* Custom Alert Modal for Delete */}
      <AppAlertModal
        config={alertConfig}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
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
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  toastText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
  },
  categoryPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    backgroundColor: COLORS.bgCardSub,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '700',
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
  descBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  viewDescHeaderLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  copyBtnText: {
    fontSize: 10,
    fontWeight: '700',
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
  viewCheckItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  viewCheckItemRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copyItemIconBtn: {
    padding: 4,
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
    gap: 10,
    marginBottom: 14,
  },
  colorCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  typeSwitcher: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCardSub,
  },
  typeBtnActive: {
    backgroundColor: COLORS.bgCard,
  },
  typeBtnText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  titleInput: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    marginTop: -8,
    marginBottom: 10,
  },
  scrollArea: {
    maxHeight: 220,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  descInput: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 14,
    minHeight: 60,
  },
  checklistSection: {
    marginBottom: 10,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
  },
  checklistContainer: {
    gap: 4,
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkboxTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  itemTextDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  deleteItemBtn: {
    padding: 2,
  },
  emptyItemsNotice: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 13,
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
    marginTop: 14,
  },
  btnCancelEdit: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelEditText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
});
