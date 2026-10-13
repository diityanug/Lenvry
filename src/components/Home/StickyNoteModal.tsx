import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import {
  ChecklistItem,
  NOTE_CATEGORIES,
  NoteCategory,
  NoteEntry,
  STICKY_COLORS,
  StickyNote,
  StickyNoteColor,
} from '../../types/notes';
import AppAlertModal, { AppAlertConfig } from '../Common/AppAlertModal';


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
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
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
  const [entries, setEntries] = useState<NoteEntry[]>(
    note?.entries && note.entries.length > 0
      ? note.entries
      : note?.description?.trim() && (note?.category === 'Personal' || note?.category === 'Finance')
      ? [{ id: 'entry-1', title: 'Credential / Info', content: note.description.trim() }]
      : []
  );
  const [isRevealed, setIsRevealed] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(note?.checklist || []);
  const [newItemText, setNewItemText] = useState('');
  const [error, setError] = useState('');
  const [copiedToast, setCopiedToast] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const editScrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const isMultiEntryCategory = category === 'Personal' || category === 'Finance';
  const palette = STICKY_COLORS[color] || STICKY_COLORS.amber;
  const categoryConfig = NOTE_CATEGORIES[category] || NOTE_CATEGORIES.General;

  const scrollToBottom = () => {
    setTimeout(() => {
      editScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const handleAddEntry = () => {
    const newEntry: NoteEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      title: '',
      content: '',
    };
    setEntries((prev) => [...prev, newEntry]);
    scrollToBottom();
  };

  const handleUpdateEntry = (id: string, field: 'title' | 'content', value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleCopyText = async (textToCopy: string) => {
    if (!textToCopy) return;
    await Clipboard.setStringAsync(textToCopy);
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
    scrollToBottom();
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSave = () => {
    let trimmedTitle = title.trim();
    const currentChecklist = [...checklist];

    // Auto-append unsubmitted checklist input if present
    if (type === 'checklist' && newItemText.trim()) {
      const autoItem: ChecklistItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        text: newItemText.trim(),
        done: false,
      };
      currentChecklist.push(autoItem);
      setChecklist(currentChecklist);
      setNewItemText('');
    }

    // Filter out blank entries
    const validEntries = entries
      .map((e) => ({ ...e, title: e.title.trim(), content: e.content.trim() }))
      .filter((e) => e.title || e.content);

    // If multi-entry category has entries but no single description, join summary for backwards compatibility
    let finalDescription = description.trim();
    if (isMultiEntryCategory && validEntries.length > 0 && !finalDescription) {
      finalDescription = validEntries
        .map((e) => (e.title ? `${e.title}: ${e.content}` : e.content))
        .join('\n\n');
    }

    // Never block user if title was left empty: use smart fallback
    if (!trimmedTitle) {
      if (currentChecklist.length > 0 && currentChecklist[0]?.text?.trim()) {
        trimmedTitle = currentChecklist[0].text.trim().slice(0, 32);
      } else if (validEntries.length > 0 && (validEntries[0].title || validEntries[0].content)) {
        trimmedTitle = (validEntries[0].title || validEntries[0].content).slice(0, 32);
      } else if (finalDescription) {
        trimmedTitle = finalDescription.split('\n')[0].slice(0, 32);
      } else {
        trimmedTitle = `${category} Note`;
      }
    }

    const noteToSave: StickyNote = {
      id: note?.id || Date.now().toString(),
      title: trimmedTitle,
      type,
      category,
      color,
      description: finalDescription,
      entries: validEntries.length > 0 ? validEntries : undefined,
      checklist: currentChecklist,
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
    <View style={styles.overlay}>
      {/* Tap outside to dismiss modal */}
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.dismissArea} />
      </TouchableWithoutFeedback>

      <View
        style={[
          styles.modalSheet,
          {
            backgroundColor: COLORS.bgCard,
            borderTopColor: palette.border,
            borderLeftColor: palette.border,
            borderRightColor: palette.border,
          },
        ]}
      >
        {/* Top Sheet Drag Handle */}
        <View style={[styles.modalHandle, { backgroundColor: palette.accent + '44' }]} />

          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={[styles.pinCircle, { backgroundColor: palette.headerBg }]}>
                <Ionicons name="pin" size={17} color={palette.accent} />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {!isEditMode
                    ? 'Note Details'
                    : isExisting
                    ? 'Edit Note'
                    : 'New Pinned Note'}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {isExisting && onDelete && (
                <TouchableOpacity
                  onPress={handleDeletePrompt}
                  style={styles.iconBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={onClose}
                style={styles.iconBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
            <View style={styles.viewModeContainer}>
              {/* Category & Date Header */}
              <View style={styles.viewBadgeRow}>
                <View
                  style={[
                    styles.categoryTag,
                    {
                      backgroundColor: categoryConfig.color + '22',
                      borderColor: categoryConfig.color + '55',
                    },
                  ]}
                >
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
                        year: 'numeric',
                      })
                    : 'Today'}
                </Text>
              </View>

              <View style={styles.viewTitleRow}>
                <Text style={styles.viewTitle}>{title}</Text>
                {category === 'Personal' && (
                  <TouchableOpacity
                    style={[
                      styles.eyeToggleBtn,
                      {
                        borderColor: palette.accent + '55',
                        backgroundColor: palette.accent + '15',
                      },
                    ]}
                    onPress={() => setIsRevealed((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isRevealed ? 'eye-outline' : 'eye-off-outline'}
                      size={15}
                      color={palette.accent}
                    />
                    <Text style={[styles.eyeToggleBtnText, { color: palette.accent }]}>
                      {isRevealed ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                style={styles.viewScrollArea}
                contentContainerStyle={styles.viewScrollContent}
                showsVerticalScrollIndicator={true}
              >
                {/* Multi-entry List for Personal / Finance or Custom Entries */}
                {isMultiEntryCategory && entries.length > 0 ? (
                  <View style={{ gap: 12, marginBottom: 16 }}>
                    {entries.map((entry, idx) => (
                      <View key={entry.id || idx} style={styles.viewDescBox}>
                        <View style={styles.descBoxHeader}>
                          <Text style={styles.viewDescHeaderLabel}>
                            {entry.title?.trim() ? entry.title : `Field #${idx + 1}`}
                          </Text>
                          <TouchableOpacity
                            style={styles.copyBtn}
                            onPress={() => handleCopyText(entry.content || '')}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="copy-outline" size={13} color={palette.accent} />
                            <Text style={[styles.copyBtnText, { color: palette.accent }]}>Copy</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.viewDescText} selectable={true}>
                          {category === 'Personal' && !isRevealed ? '****' : entry.content || '-'}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : Boolean(description?.trim()) ? (
                  /* Single Note Description in View Mode */
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
                      {category === 'Personal' && !isRevealed
                        ? '****'
                        : description}
                    </Text>
                  </View>
                ) : null}

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
                              size={23}
                              color={item.done ? palette.accent : COLORS.textMuted}
                            />
                            <Text
                              style={[
                                styles.itemText,
                                item.done && styles.itemTextDone,
                              ]}
                            >
                              {category === 'Personal' && !isRevealed ? '****' : item.text}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleCopyText(item.text)}
                            style={styles.copyItemIconBtn}
                            activeOpacity={0.6}
                          >
                            <Ionicons name="copy-outline" size={16} color={COLORS.textMuted} />
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

            /* EDIT MODE */
            <View style={styles.editModeContainer}>
              <ScrollView
                ref={editScrollViewRef}
                style={styles.editScrollArea}
                contentContainerStyle={[
                  styles.editScrollContent,
                  { paddingBottom: Math.max(28, keyboardHeight + 28) },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                nestedScrollEnabled={true}
              >
                {/* Category Picker Selector */}
                <Text style={styles.inputLabel}>CATEGORY</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  nestedScrollEnabled={true}
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
                          size={15}
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
                <View style={styles.colorSection}>
                  <Text style={styles.inputLabel}>CARD COLOR</Text>
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
                          {isSelected && <Ionicons name="checkmark" size={16} color="#08090C" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Type Switcher (Checklist vs Text) */}
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
                      size={16}
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
                      size={16}
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
                  placeholder={
                    category === 'Personal'
                      ? 'e.g. Social Accounts etc.'
                      : category === 'Finance'
                      ? 'e.g. Monthly Budget etc.'
                      : 'e.g. Grocery List etc'
                  }
                  placeholderTextColor={COLORS.textMuted}
                  value={title}
                  onChangeText={(val) => {
                    setTitle(val);
                    if (error) setError('');
                  }}
                />
                {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}

                {/* Description or Multi-Entry Section */}
                {isMultiEntryCategory ? (
                  <View style={styles.multiEntrySection}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.inputLabel}>
                        {category === 'Finance' ? 'BUDGET & FINANCIAL ENTRIES' : 'CREDENTIAL & DETAIL ENTRIES'}
                      </Text>
                      <TouchableOpacity
                        style={[styles.addEntryHeaderBtn, { borderColor: palette.accent }]}
                        onPress={handleAddEntry}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="add" size={14} color={palette.accent} />
                        <Text style={[styles.addEntryHeaderBtnText, { color: palette.accent }]}>
                          Add
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {entries.length === 0 ? (
                      <TouchableOpacity
                        style={[styles.emptyEntryBox, { borderColor: palette.accent + '44' }]}
                        onPress={handleAddEntry}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add-circle-outline" size={22} color={palette.accent} />
                        <Text style={[styles.emptyEntryText, { color: palette.accent }]}>
                          {category === 'Finance'
                            ? 'Tap to add item'
                            : 'Tap to add item'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ gap: 12 }}>
                        {entries.map((entry, idx) => (
                          <View key={entry.id || idx} style={styles.entryEditCard}>
                            <View style={styles.entryEditHeader}>
                              <TextInput
                                style={styles.entryTitleInput}
                                placeholder={
                                  category === 'Finance'
                                    ? `Field #${idx + 1} (e.g. Food, Electricity)`
                                    : `Field #${idx + 1} (e.g. Facebook, WiFi)`
                                }
                                placeholderTextColor={COLORS.textMuted}
                                value={entry.title}
                                onChangeText={(val) => handleUpdateEntry(entry.id, 'title', val)}
                              />
                              <TouchableOpacity
                                onPress={() => handleDeleteEntry(entry.id)}
                                style={styles.deleteEntryBtn}
                                activeOpacity={0.6}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons name="close-circle-outline" size={20} color={COLORS.danger} />
                              </TouchableOpacity>
                            </View>
                            <TextInput
                              style={styles.entryContentInput}
                              placeholder={
                                category === 'Finance'
                                  ? 'e.g. Target: Rp 500.000 / bln, Rekening: BCA...'
                                  : 'e.g. User: name@email.com\nPass: **********'
                              }
                              placeholderTextColor={COLORS.textMuted}
                              value={entry.content}
                              onChangeText={(val) => handleUpdateEntry(entry.id, 'content', val)}
                              multiline={true}
                              textAlignVertical="top"
                            />
                          </View>
                        ))}

                        <TouchableOpacity
                          style={[styles.addEntryDashedBtn, { borderColor: palette.accent + '66' }]}
                          onPress={handleAddEntry}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="add" size={16} color={palette.accent} />
                          <Text style={[styles.addEntryDashedBtnText, { color: palette.accent }]}>
                            Add Another Field ({entries.length})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={styles.inputLabel}>
                       {type === 'checklist' ? 'DESCRIPTION' : 'NOTE CONTENT'}
                    </Text>
                    <TextInput
                      style={[
                        styles.descInput,
                        type === 'text' && { minHeight: 120 },
                      ]}
                      placeholder={
                        type === 'checklist'
                          ? 'e.g. store name, ideas, etc.'
                          : 'Write your thoughts, plans, or notes here...'
                      }
                      placeholderTextColor={COLORS.textMuted}
                      value={description}
                      onChangeText={setDescription}
                      multiline={true}
                      textAlignVertical="top"
                    />
                  </View>
                )}

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
                            onPress={() => handleDeleteChecklistItem(item.id)}
                            style={styles.deleteItemBtn}
                            activeOpacity={0.6}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close-circle-outline" size={19} color={COLORS.textMuted} />
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
                        placeholder="Add new checklist item."
                        placeholderTextColor={COLORS.textMuted}
                        value={newItemText}
                        onChangeText={setNewItemText}
                        onFocus={scrollToBottom}
                        returnKeyType="done"
                        onSubmitEditing={handleAddChecklistItem}
                      />
                      <TouchableOpacity
                        style={[styles.addItemBtn, { backgroundColor: palette.accent }]}
                        onPress={handleAddChecklistItem}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={22} color="#08090C" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

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
                    <Ionicons
                      name={isExisting ? 'checkmark-circle' : 'pin'}
                      size={16}
                      color="#08090C"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.btnPrimaryText}>
                      {isExisting ? 'Save Changes' : 'Pin Note'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </View>

      {/* Custom Alert Modal for Delete */}
      <AppAlertModal
        config={alertConfig}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 9, 0.78)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    // A definite height is required: the view/edit containers and their ScrollViews use flex: 1,
    // which collapses to 0 when the parent only has maxHeight (content-sized).
    height: '85%',
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 20,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  toastText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '700',
  },

  // View Mode
  viewModeContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  viewBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewDateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  viewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  viewTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
  },
  viewScrollArea: {
    flex: 1,
  },
  viewScrollContent: {
    paddingBottom: 20,
  },
  viewDescBox: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    minHeight: 120,
  },
  descBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewDescHeaderLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewDescText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  viewChecklistSection: {
    marginBottom: 12,
  },
  viewProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  viewCheckItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  viewCheckItemRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copyItemIconBtn: {
    padding: 6,
  },
  viewActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },

  // Edit Mode
  editModeContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  editScrollArea: {
    flex: 1,
  },
  editScrollContent: {
    paddingTop: 4,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    backgroundColor: COLORS.bgCardSub,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  colorSection: {
    marginBottom: 16,
  },
  colorPickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  typeSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    backgroundColor: COLORS.bgCardSub,
    padding: 4,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    borderColor: 'transparent',
  },
  typeBtnActive: {
    backgroundColor: COLORS.bgCard,
  },
  typeBtnText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    marginTop: -10,
    marginBottom: 12,
  },
  descInput: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 120,
  },

  // Multi Entry Section (Personal & Finance)
  multiEntrySection: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addEntryHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    backgroundColor: COLORS.bgCardSub,
  },
  addEntryHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyEntryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
  },
  emptyEntryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  entryEditCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 10,
  },
  entryEditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  entryTitleInput: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  deleteEntryBtn: {
    padding: 4,
  },
  entryContentInput: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 64,
  },
  addEntryDashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: COLORS.bgCardSub,
  },
  addEntryDashedBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Checklist in Edit Mode
  checklistSection: {
    marginBottom: 16,
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
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
  },
  checklistContainer: {
    gap: 6,
    marginVertical: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkboxTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemText: {
    fontSize: 14.5,
    color: COLORS.textPrimary,
    lineHeight: 21,
    fontWeight: '500',
  },
  itemTextDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  deleteItemBtn: {
    padding: 4,
  },
  emptyItemsNotice: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 14,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  addItemBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Edit Action Row (Buttons)
  editActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  btnCancelEdit: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
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
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCardSub,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
  },
  btnPrimaryText: {
    color: '#08090C',
    fontSize: 14,
    fontWeight: '800',
  },
  eyeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  eyeToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
