import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  Linking,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS, RADIUS } from '../../constants/theme';
import AppAlertModal, { AppAlertConfig } from '../Common/AppAlertModal';
import {
  LearningCourse,
  LearningStatus,
  CourseLevel,
  CourseColor,
  LEARNING_STATUS_CONFIG,
  COURSE_LEVEL_CONFIG,
  COURSE_PROVIDERS,
  COURSE_COLORS,
  COURSE_COLOR_KEYS,
  PROVIDER_DEFAULT_COLORS,
} from '../../types/learning';

interface LearningCourseModalProps {
  visible: boolean;
  course: LearningCourse | null;
  onClose: () => void;
  onSave: (course: LearningCourse) => void;
  onDelete?: (id: string) => void;
}

const getTodayFormattedDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function LearningCourseModal({
  visible,
  course,
  onClose,
  onSave,
  onDelete,
}: LearningCourseModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      {visible ? (
        <LearningCourseModalContent
          key={course ? course.id : 'new-course'}
          course={course}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      ) : null}
    </Modal>
  );
}

function LearningCourseModalContent({
  course,
  onClose,
  onSave,
  onDelete,
}: {
  course: LearningCourse | null;
  onClose: () => void;
  onSave: (course: LearningCourse) => void;
  onDelete?: (id: string) => void;
}) {
  const isExisting = Boolean(course);

  const [title, setTitle] = useState(course?.title || '');
  const [status, setStatus] = useState<LearningStatus>(course?.status || 'In Progress');
  const [provider, setProvider] = useState(course?.provider || 'Udemy');
  const [customProvider, setCustomProvider] = useState(
    course?.provider && !COURSE_PROVIDERS.includes(course.provider as any)
      ? course.provider
      : ''
  );
  const [level, setLevel] = useState<CourseLevel>(course?.level || 'Beginner');
  const [hours, setHours] = useState(course ? String(course.hours || 0) : '0');
  const [startDate, setStartDate] = useState(course?.startDate || getTodayFormattedDate());
  const [link, setLink] = useState(course?.link || '');
  const [notes, setNotes] = useState(course?.notes || '');
  const [color, setColor] = useState<CourseColor>(
    course?.color || (course?.provider && PROVIDER_DEFAULT_COLORS[course.provider]) || 'violet'
  );
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const scrollRef = useRef<ScrollView>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handlePasteLink = async () => {
    try {
      const clipText = await Clipboard.getStringAsync();
      if (clipText && (clipText.startsWith('http://') || clipText.startsWith('https://'))) {
        setLink(clipText.trim());
        showToast('Link pasted from clipboard!');
      } else if (clipText) {
        setLink(`https://${clipText.trim()}`);
        showToast('Pasted and prepended https://');
      } else {
        showToast('Clipboard is empty');
      }
    } catch {
      showToast('Could not access clipboard');
    }
  };

  const handleTestLink = async () => {
    const trimmed = link.trim();
    if (!trimmed) return;
    const url = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showToast('Invalid URL format');
      }
    } catch {
      showToast('Could not open link');
    }
  };

  const handleAddHours = (increment: number) => {
    const current = parseFloat(hours) || 0;
    const next = Math.max(0, current + increment);
    setHours(String(Number(next.toFixed(1))));
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please provide a course title');
      return;
    }

    const finalProvider = (customProvider.trim() || provider || 'Udemy').trim();
    const parsedHours = Math.max(0, parseFloat(hours) || 0);

    let cleanLink = link.trim();
    if (cleanLink && !cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
      cleanLink = `https://${cleanLink}`;
    }

    const courseToSave: LearningCourse = {
      id: course?.id || `course_${Date.now()}`,
      title: trimmedTitle,
      status,
      provider: finalProvider,
      level,
      hours: parsedHours,
      startDate: startDate.trim() || getTodayFormattedDate(),
      link: cleanLink || undefined,
      notes: notes.trim() || undefined,
      color,
      createdAt: course?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    Keyboard.dismiss();
    onSave(courseToSave);
    onClose();
  };

  const handleDeletePrompt = () => {
    if (!course || !onDelete) return;
    setAlertConfig({
      visible: true,
      type: 'danger',
      title: 'Delete Course',
      message: `Are you sure you want to delete "${course.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        onDelete(course.id);
        onClose();
      },
    });
  };

  const statusTheme = LEARNING_STATUS_CONFIG[status];

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.dismissArea} onPress={handleDismiss} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidWrapper}
      >
        <View style={styles.modalSheet}>
          {/* Sheet Handle */}
          <View style={styles.modalHandle} />

          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={[styles.badgeIconBox, { backgroundColor: statusTheme.bg }]}>
                <Ionicons name="school" size={18} color={statusTheme.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>
                  {isExisting ? 'Edit Course' : 'Add Learning Course'}
                </Text>
                <Text style={styles.headerSub}>
                  {course ? `${course.provider} • ${course.level}` : 'Track progress, syllabus & study hours'}
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

          {/* Toast Message */}
          {Boolean(toastMessage) && (
            <View style={styles.toastBox}>
              <Ionicons name="information-circle" size={14} color={COLORS.accent} />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}

          {/* Form Scroll Area */}
          <ScrollView
            ref={scrollRef}
            style={styles.formScrollArea}
            contentContainerStyle={[
              styles.formScrollContent,
              { paddingBottom: Math.max(36, keyboardHeight + 36) },
            ]}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            nestedScrollEnabled={true}
          >
            {/* 1. Course Name */}
            <Text style={styles.inputLabel}>COURSE NAME *</Text>
            <TextInput
              style={[styles.inputField, Boolean(error) && { borderColor: COLORS.danger }]}
              placeholder="e.g. Master React Native & Expo 2026"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={(val) => {
                setTitle(val);
                if (error) setError('');
              }}
            />
            {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}

            {/* 2. Provider / Platform */}
            <Text style={styles.inputLabel}>PLATFORM / PROVIDER</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScrollRow}
            >
              {COURSE_PROVIDERS.map((prov) => {
                const isSelected = provider === prov && !customProvider;
                return (
                  <TouchableOpacity
                    key={prov}
                    style={[
                      styles.chipPill,
                      isSelected && styles.chipPillActive,
                    ]}
                    onPress={() => {
                      setProvider(prov);
                      if (prov !== 'Other') {
                        setCustomProvider('');
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.chipPillText,
                        isSelected && styles.chipPillTextActive,
                      ]}
                    >
                      {prov}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Custom Provider Input if selected "Other" or custom name */}
            {(provider === 'Other' || Boolean(customProvider)) && (
              <TextInput
                style={[styles.inputField, { marginTop: 8, fontSize: 13 }]}
                placeholder="Enter custom provider name (e.g. BuildWithAngga, Codepolitan)..."
                placeholderTextColor={COLORS.textMuted}
                value={customProvider}
                onChangeText={setCustomProvider}
              />
            )}

            {/* 3. Status Selector */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>LEARNING STATUS</Text>
            <View style={styles.statusGrid}>
              {(Object.keys(LEARNING_STATUS_CONFIG) as LearningStatus[]).map((st) => {
                const cfg = LEARNING_STATUS_CONFIG[st];
                const isSelected = status === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusCard,
                      {
                        borderColor: isSelected ? cfg.color : COLORS.border,
                        backgroundColor: isSelected ? cfg.bg : COLORS.bgCardSub,
                      },
                    ]}
                    onPress={() => setStatus(st)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={cfg.icon as any}
                      size={17}
                      color={isSelected ? cfg.color : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.statusCardText,
                        { color: isSelected ? cfg.color : COLORS.textSecondary },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. Level Selector */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>DIFFICULTY LEVEL</Text>
            <View style={styles.levelRow}>
              {(Object.keys(COURSE_LEVEL_CONFIG) as CourseLevel[]).map((lvl) => {
                const cfg = COURSE_LEVEL_CONFIG[lvl];
                const isSelected = level === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.levelPill,
                      {
                        borderColor: isSelected ? cfg.color : COLORS.border,
                        backgroundColor: isSelected ? cfg.bg : COLORS.bgCardSub,
                      },
                    ]}
                    onPress={() => setLevel(lvl)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.levelPillText,
                        { color: isSelected ? cfg.color : COLORS.textMuted },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 5. Card Color Theme */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>CARD THEME COLOR</Text>
            <View style={styles.colorPickerRow}>
              {COURSE_COLOR_KEYS.map((c) => {
                const pal = COURSE_COLORS[c];
                const isSelected = color === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: pal.primary },
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

            {/* 6. Study Hours & Start Date in a 2-Column Row */}
            <View style={styles.twoColumnRow}>
              {/* Study Hours */}
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>STUDY HOURS</Text>
                <View style={styles.hoursInputWrap}>
                  <Ionicons name="time-outline" size={17} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.hoursTextInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    value={hours}
                    onChangeText={setHours}
                  />
                  <Text style={styles.hoursUnitText}>hrs</Text>
                </View>

                {/* Quick Add Hour Chips */}
                <View style={styles.quickHourRow}>
                  <TouchableOpacity
                    style={styles.quickHourBtn}
                    onPress={() => handleAddHours(1)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickHourBtnText}>+1h</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickHourBtn}
                    onPress={() => handleAddHours(5)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickHourBtnText}>+5h</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickHourBtn}
                    onPress={() => handleAddHours(10)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickHourBtnText}>+10h</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Start Date */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.inputLabel}>START DATE</Text>
                  <TouchableOpacity
                    onPress={() => setStartDate(getTodayFormattedDate())}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.todayShortcutText}>Today</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dateInputWrap}>
                  <Ionicons name="calendar-outline" size={17} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.dateTextInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textMuted}
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
              </View>
            </View>

            {/* 6. Course Link (URL) */}
            <View style={{ marginTop: 14 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.inputLabel}>COURSE LINK (URL)</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={handlePasteLink} activeOpacity={0.7}>
                    <Text style={styles.linkActionText}>Paste</Text>
                  </TouchableOpacity>
                  {Boolean(link.trim()) && (
                    <TouchableOpacity onPress={handleTestLink} activeOpacity={0.7}>
                      <Text style={[styles.linkActionText, { color: COLORS.accent }]}>Open Link</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.linkInputContainer}>
                <Ionicons name="link-outline" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.linkTextInput}
                  placeholder="https://www.udemy.com/course/..."
                  placeholderTextColor={COLORS.textMuted}
                  value={link}
                  onChangeText={setLink}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* 7. Notes & Key Takeaways */}
            <View style={{ marginTop: 14 }}>
              <Text style={styles.inputLabel}>NOTES & KEY TAKEAWAYS</Text>
              <TextInput
                style={styles.notesInputField}
                placeholder="Log your progress, key milestones, syllabus bookmarks, or key concepts..."
                placeholderTextColor={COLORS.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline={true}
                textAlignVertical="top"
                onFocus={scrollToBottom}
              />
            </View>
          </ScrollView>

          {/* Bottom Action Row */}
          <View style={styles.modalActionRow}>
            {isExisting && (
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.btnPrimary, !isExisting && { flex: 1 }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isExisting ? 'checkmark-circle' : 'add-circle'}
                size={18}
                color="#08090C"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.btnPrimaryText}>
                {isExisting ? 'Save Changes' : 'Add Course'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

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
  keyboardAvoidWrapper: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalSheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
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
    backgroundColor: COLORS.borderLight,
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
  badgeIconBox: {
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
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  toastText: {
    color: COLORS.accentHover,
    fontSize: 12,
    fontWeight: '700',
  },
  formScrollArea: {
    flexShrink: 1,
  },
  formScrollContent: {
    paddingTop: 4,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    marginTop: 4,
    marginBottom: 4,
  },
  chipsScrollRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chipPill: {
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipPillActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
  },
  chipPillText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipPillTextActive: {
    color: COLORS.accentHover,
    fontWeight: '800',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusCard: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  statusCardText: {
    fontSize: 12,
    fontWeight: '600',
  },
  levelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  colorPickerRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 2,
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
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  hoursInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  hoursTextInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 4,
  },
  hoursUnitText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  quickHourRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  quickHourBtn: {
    flex: 1,
    backgroundColor: COLORS.bgCardSub,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  quickHourBtnText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  todayShortcutText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  dateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  dateTextInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkActionText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  linkInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  linkTextInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  notesInputField: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    minHeight: 88,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  btnSecondary: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
  },
  btnPrimaryText: {
    color: '#08090C',
    fontSize: 14,
    fontWeight: '800',
  },
});
