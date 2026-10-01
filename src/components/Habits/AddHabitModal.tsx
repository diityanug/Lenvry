import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DAYS_OF_WEEK, formatDisplayDate } from '../../constants/habits';
import { COLORS, RADIUS } from '../../constants/theme';
import { FrequencyType, Habit, PriorityLevel, SubTask, TimeSlot } from '../../types/habits';
import TimePickerModal from './TimePickerModal';
import NotificationSoundModal from './NotificationSoundModal';
import {
  SOUND_OPTIONS,
  playSoundPreview,
  stopSoundPreview,
} from '../../services/habitNotificationService';

interface AddHabitModalProps {
  visible: boolean;
  selectedDate: Date;
  categories: string[];
  initialHabit?: Habit | null;
  onSave: (habitData: {
    id?: string;
    title: string;
    category: string;
    description?: string;
    priority?: PriorityLevel;
    timeSlot?: TimeSlot;
    reminderTime?: string;
    reminderSound?: string;
    frequency?: FrequencyType;
    repeatDays?: number[];
    subtasks?: SubTask[];
  }) => void;
  onClose: () => void;
  onOpenAddCategory: () => void;
  onDeleteCategory: (cat: string) => void;
}

const PRESET_HABITS = [
  { title: 'Drink 2L Water', category: 'Health' },
  { title: 'Read 20 Pages', category: 'Study' },
  { title: 'Meditate 10 Mins', category: 'Mindfulness' },
  { title: 'Morning Walk', category: 'Fitness' },
  { title: 'Deep Work Session', category: 'Work' },
  { title: 'Sleep 8 Hours', category: 'Health' },
];

export default function AddHabitModal({
  visible,
  selectedDate,
  categories,
  initialHabit,
  onSave,
  onClose,
  onOpenAddCategory,
  onDeleteCategory,
}: AddHabitModalProps) {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      {visible ? (
        <AddHabitContent
          key={initialHabit ? initialHabit.id : 'new'}
          selectedDate={selectedDate}
          categories={categories}
          initialHabit={initialHabit}
          onSave={onSave}
          onClose={onClose}
          onOpenAddCategory={onOpenAddCategory}
          onDeleteCategory={onDeleteCategory}
        />
      ) : null}
    </Modal>
  );
}

function AddHabitContent({
  selectedDate,
  categories,
  initialHabit,
  onSave,
  onClose,
  onOpenAddCategory,
  onDeleteCategory,
}: Omit<AddHabitModalProps, 'visible'>) {
  const isEditing = !!initialHabit;

  const [localTitle, setLocalTitle] = useState(initialHabit?.title || '');
  const [localCategory, setLocalCategory] = useState(
    initialHabit?.category || categories[0] || 'Health'
  );
  const [localDescription, setLocalDescription] = useState(initialHabit?.description || '');
  const [localPriority, setLocalPriority] = useState<PriorityLevel>(initialHabit?.priority || 'medium');
  const [localFrequency, setLocalFrequency] = useState<FrequencyType>(initialHabit?.frequency || 'once');
  const [localTimeSlot, setLocalTimeSlot] = useState<TimeSlot>(initialHabit?.timeSlot || 'Anytime');
  const [localReminder, setLocalReminder] = useState<string>(initialHabit?.reminderTime || '');
  const [localSound, setLocalSound] = useState<string>(initialHabit?.reminderSound || 'chime');
  const [soundModalVisible, setSoundModalVisible] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [localRepeatDays, setLocalRepeatDays] = useState<number[]>(
    initialHabit?.repeatDays || [1, 2, 3, 4, 5]
  );
  const [localSubtasks, setLocalSubtasks] = useState<SubTask[]>(initialHabit?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  const handleSelectPreset = (preset: { title: string; category: string }) => {
    setLocalTitle(preset.title);
    if (categories.includes(preset.category)) {
      setLocalCategory(preset.category);
    }
    setErrorMessage('');
  };

  const toggleRepeatDay = (dayValue: number) => {
    if (localRepeatDays.includes(dayValue)) {
      if (localRepeatDays.length === 1) return; // keep at least 1 day
      setLocalRepeatDays(localRepeatDays.filter((d) => d !== dayValue));
    } else {
      setLocalRepeatDays([...localRepeatDays, dayValue].sort());
    }
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    const item: SubTask = {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      title: trimmed,
      completed: false,
    };
    setLocalSubtasks([...localSubtasks, item]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setLocalSubtasks(localSubtasks.filter((s) => s.id !== id));
  };

  const handleSave = () => {
    const trimmedTitle = localTitle.trim();
    if (!trimmedTitle) {
      setErrorMessage('Please enter a habit name.');
      return;
    }
    if (!localCategory) {
      setErrorMessage('Please select a category.');
      return;
    }

    Keyboard.dismiss();
    onSave({
      id: initialHabit?.id,
      title: trimmedTitle,
      category: localCategory,
      description: localDescription.trim() || undefined,
      priority: localPriority,
      frequency: localFrequency,
      timeSlot: localTimeSlot,
      reminderTime: localReminder.trim() || undefined,
      reminderSound: localSound,
      repeatDays: localFrequency === 'custom_days' ? localRepeatDays : undefined,
      subtasks: localSubtasks,
    });
  };

  const handleDismissArea = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <>
      <View style={habitModalStyles.overlay}>
        <TouchableWithoutFeedback onPress={handleDismissArea}>
          <View style={habitModalStyles.dismissArea} />
        </TouchableWithoutFeedback>

        <View style={habitModalStyles.content}>
          <View style={habitModalStyles.handle} />

          {/* Header */}
          <View style={habitModalStyles.headerRow}>
            <Text style={habitModalStyles.headerTitle}>
              {isEditing ? 'Edit Habit / Task' : 'New Habit / Task'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Math.max(16, keyboardHeight + 16) }}
          >
            {/* Target Date Pill */}
            <View style={habitModalStyles.schedulePill}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.success} style={{ marginRight: 6 }} />
              <Text style={habitModalStyles.scheduleLabel}>Created Date:</Text>
              <Text style={habitModalStyles.scheduleDate}>{formatDisplayDate(selectedDate)}</Text>
            </View>

            {/* Quick Presets (Only when creating) */}
            {!isEditing && (
              <View style={{ marginBottom: 12 }}>
                <Text style={habitModalStyles.sectionLabel}>QUICK SUGGESTIONS</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingRight: 16 }}
                >
                  {PRESET_HABITS.map((p) => {
                    const isActive = localTitle === p.title;
                    return (
                      <TouchableOpacity
                        key={p.title}
                        style={[
                          habitModalStyles.presetChip,
                          isActive && habitModalStyles.presetChipActive,
                        ]}
                        onPress={() => handleSelectPreset(p)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isActive ? 'checkmark-circle' : 'add-circle-outline'}
                          size={13}
                          color={isActive ? '#08090C' : COLORS.success}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            habitModalStyles.presetChipText,
                            isActive && habitModalStyles.presetChipTextActive,
                          ]}
                        >
                          {p.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Habit Name Input */}
            <View style={habitModalStyles.sectionCard}>
              <Text style={habitModalStyles.sectionLabel}>NAME / TITLE</Text>
              <TextInput
                style={habitModalStyles.input}
                placeholder="e.g. Read 20 Pages, Drink Water, Submit Project..."
                placeholderTextColor={COLORS.textMuted}
                value={localTitle}
                onChangeText={(val) => {
                  setLocalTitle(val);
                  if (errorMessage) setErrorMessage('');
                }}
                autoCapitalize="words"
              />
              {errorMessage ? (
                <View style={habitModalStyles.errorRow}>
                  <Ionicons name="alert-circle" size={13} color={COLORS.danger} />
                  <Text style={habitModalStyles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}
            </View>

            {/* Frequency (Recurring Settings) */}
            <View style={habitModalStyles.sectionCard}>
              <Text style={habitModalStyles.sectionLabel}>RECURRING FREQUENCY</Text>
              <View style={habitModalStyles.rowWrap}>
                {[
                  { label: 'One-time', value: 'once' },
                  { label: 'Daily', value: 'daily' },
                  { label: 'Weekdays', value: 'weekdays' },
                  { label: 'Custom Days', value: 'custom_days' },
                ].map((item) => {
                  const isSelected = localFrequency === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        habitModalStyles.chipBtn,
                        isSelected && habitModalStyles.chipBtnActive,
                      ]}
                      onPress={() => setLocalFrequency(item.value as FrequencyType)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          habitModalStyles.chipBtnText,
                          isSelected && habitModalStyles.chipBtnTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom repeat days selection */}
              {localFrequency === 'custom_days' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={habitModalStyles.subSectionLabel}>REPEAT ON DAYS:</Text>
                  <View style={habitModalStyles.daysRow}>
                    {DAYS_OF_WEEK.map((d) => {
                      const isDaySelected = localRepeatDays.includes(d.value);
                      return (
                        <TouchableOpacity
                          key={d.value}
                          style={[
                            habitModalStyles.dayCircle,
                            isDaySelected && habitModalStyles.dayCircleActive,
                          ]}
                          onPress={() => toggleRepeatDay(d.value)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              habitModalStyles.dayCircleText,
                              isDaySelected && habitModalStyles.dayCircleTextActive,
                            ]}
                          >
                            {d.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Priority & Time Slot */}
            <View style={habitModalStyles.sectionCard}>
              <Text style={habitModalStyles.sectionLabel}>PRIORITY & TIME OF DAY</Text>
              
              <Text style={habitModalStyles.subSectionLabel}>PRIORITY LEVEL</Text>
              <View style={habitModalStyles.rowWrap}>
                {[
                  { label: 'Low', value: 'low', color: COLORS.success },
                  { label: 'Medium', value: 'medium', color: COLORS.warning },
                  { label: 'High', value: 'high', color: COLORS.danger },
                ].map((p) => {
                  const isSelected = localPriority === p.value;
                  return (
                    <TouchableOpacity
                      key={p.value}
                      style={[
                        habitModalStyles.chipBtn,
                        isSelected && { backgroundColor: p.color, borderColor: p.color },
                      ]}
                      onPress={() => setLocalPriority(p.value as PriorityLevel)}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          habitModalStyles.priorityDot,
                          { backgroundColor: isSelected ? '#08090C' : p.color },
                        ]}
                      />
                      <Text
                        style={[
                          habitModalStyles.chipBtnText,
                          isSelected && habitModalStyles.chipBtnTextActive,
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[habitModalStyles.subSectionLabel, { marginTop: 12 }]}>TIME SLOT</Text>
              <View style={habitModalStyles.rowWrap}>
                {['Anytime', 'Morning', 'Afternoon', 'Evening'].map((slot) => {
                  const isSelected = localTimeSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        habitModalStyles.chipBtn,
                        isSelected && habitModalStyles.chipBtnActive,
                      ]}
                      onPress={() => setLocalTimeSlot(slot as TimeSlot)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          habitModalStyles.chipBtnText,
                          isSelected && habitModalStyles.chipBtnTextActive,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[habitModalStyles.subSectionLabel, { marginTop: 12 }]}>REMINDER TIME (OPTIONAL)</Text>
              <TouchableOpacity
                style={habitModalStyles.timePickerTrigger}
                onPress={() => setTimePickerVisible(true)}
                activeOpacity={0.7}
              >
                <View style={habitModalStyles.timePickerLeft}>
                  <View style={[
                    habitModalStyles.timePickerIconBox,
                    localReminder ? habitModalStyles.timePickerIconBoxActive : null,
                  ]}>
                    <Ionicons
                      name={localReminder ? 'alarm' : 'alarm-outline'}
                      size={16}
                      color={localReminder ? COLORS.success : COLORS.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      habitModalStyles.timePickerValue,
                      !localReminder && habitModalStyles.timePickerValuePlaceholder,
                    ]}>
                      {localReminder || 'Set reminder time (e.g. 07:30 AM)'}
                    </Text>
                    <Text style={habitModalStyles.timePickerSubtext}>
                      {localReminder ? 'Tap to change reminder time' : 'No reminder configured'}
                    </Text>
                  </View>
                </View>

                <View style={habitModalStyles.timePickerRight}>
                  {localReminder ? (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setLocalReminder('');
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={habitModalStyles.timePickerClearBtn}
                    >
                      <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                  )}
                </View>
              </TouchableOpacity>

              {localReminder ? (
                <View style={habitModalStyles.soundSelectorContainer}>
                  <Text style={[habitModalStyles.subSectionLabel, { marginTop: 12 }]}>REMINDER RINGTONE</Text>
                  <View style={habitModalStyles.soundRow}>
                    <TouchableOpacity
                      style={habitModalStyles.soundMainBtn}
                      onPress={() => setSoundModalVisible(true)}
                      activeOpacity={0.75}
                    >
                      <View style={habitModalStyles.soundIconBox}>
                        <Ionicons name="musical-notes" size={15} color={COLORS.success} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={habitModalStyles.soundNameText}>
                          {SOUND_OPTIONS.find((s) => s.id === localSound)?.name || 'Crystal Chime'}
                        </Text>
                        <Text style={habitModalStyles.soundSubtext}>Tap to change ringtone or test sound</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        habitModalStyles.soundTestBtn,
                        previewPlaying && habitModalStyles.soundTestBtnActive,
                      ]}
                      onPress={async () => {
                        if (previewPlaying) {
                          stopSoundPreview();
                          setPreviewPlaying(false);
                        } else {
                          setPreviewPlaying(true);
                          const played = await playSoundPreview(localSound, () => setPreviewPlaying(false));
                          if (!played) setPreviewPlaying(false);
                        }
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons
                        name={previewPlaying ? 'pause' : 'volume-high-outline'}
                        size={16}
                        color={previewPlaying ? '#08090C' : COLORS.textPrimary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Checklist / Sub-tasks */}
            <View style={habitModalStyles.sectionCard}>
              <Text style={habitModalStyles.sectionLabel}>CHECKLIST / SUB-TASKS</Text>
              
              {localSubtasks.map((st) => (
                <View key={st.id} style={habitModalStyles.subtaskItemRow}>
                  <Ionicons name="git-commit-outline" size={14} color={COLORS.success} />
                  <Text style={habitModalStyles.subtaskItemTitle}>{st.title}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveSubtask(st.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={habitModalStyles.addSubtaskRow}>
                <TextInput
                  style={[habitModalStyles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Add sub-task..."
                  placeholderTextColor={COLORS.textMuted}
                  value={newSubtaskTitle}
                  onChangeText={setNewSubtaskTitle}
                  onSubmitEditing={handleAddSubtask}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={habitModalStyles.addSubtaskBtn}
                  onPress={handleAddSubtask}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={18} color="#08090C" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Description Input */}
            <View style={habitModalStyles.sectionCard}>
              <Text style={habitModalStyles.sectionLabel}>DESCRIPTION & NOTES</Text>
              <TextInput
                style={[habitModalStyles.input, habitModalStyles.descriptionInput]}
                placeholder="Notes, targets, details..."
                placeholderTextColor={COLORS.textMuted}
                value={localDescription}
                onChangeText={setLocalDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Categories */}
            <View style={habitModalStyles.sectionCard}>
              <View style={habitModalStyles.catHeaderRow}>
                <Text style={habitModalStyles.sectionLabel}>CATEGORY</Text>
              </View>

              <View style={habitModalStyles.categoriesWrap}>
                {categories.map((cat) => {
                  const isSelected = localCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        habitModalStyles.categoryChip,
                        isSelected && habitModalStyles.categoryChipActive,
                      ]}
                      onPress={() => {
                        setLocalCategory(cat);
                        setErrorMessage('');
                      }}
                      onLongPress={() => onDeleteCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          habitModalStyles.categoryChipText,
                          isSelected && habitModalStyles.categoryChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={habitModalStyles.addCategoryChip}
                  onPress={onOpenAddCategory}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={14} color={COLORS.success} />
                  <Text style={habitModalStyles.addCategoryText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={habitModalStyles.saveButton}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={habitModalStyles.saveButtonText}>
                {isEditing ? 'UPDATE HABIT' : 'CREATE HABIT'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <TimePickerModal
        visible={timePickerVisible}
        initialTime={localReminder}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(timeStr) => {
          setLocalReminder(timeStr);
          setTimePickerVisible(false);
        }}
        onClear={() => {
          setLocalReminder('');
          setTimePickerVisible(false);
        }}
      />

      <NotificationSoundModal
        visible={soundModalVisible}
        selectedSoundId={localSound}
        onSelectSound={(soundId) => setLocalSound(soundId)}
        onClose={() => {
          stopSoundPreview();
          setPreviewPlaying(false);
          setSoundModalVisible(false);
        }}
      />
    </>
  );
}

const habitModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 28,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  schedulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  scheduleLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  scheduleDate: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  subSectionLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  catHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '600',
  },
  descriptionInput: {
    height: 70,
    paddingTop: 10,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipBtnActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  chipBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  chipBtnTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  dayCircleText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  dayCircleTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  subtaskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  subtaskItemTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  addSubtaskBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: COLORS.bgCard,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  categoryChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  addCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successSoft,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderStyle: 'dashed',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: RADIUS.sm,
  },
  addCategoryText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  saveButtonText: {
    color: '#08090C',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  presetChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#08090C',
    fontWeight: '800',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  timePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  timePickerIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timePickerIconBoxActive: {
    backgroundColor: COLORS.successSoft,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  timePickerValue: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '700',
  },
  timePickerValuePlaceholder: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  timePickerSubtext: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  timePickerRight: {
    marginLeft: 8,
  },
  timePickerClearBtn: {
    padding: 2,
  },
  soundSelectorContainer: {
    marginTop: 4,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soundMainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  soundIconBox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundNameText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  soundSubtext: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  soundTestBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundTestBtnActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
});