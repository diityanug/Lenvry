import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Keyboard,
  Linking,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS, RADIUS } from '../../constants/theme';
import AppAlertModal, { AppAlertConfig } from '../Common/AppAlertModal';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
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
  const [isEditMode, setIsEditMode] = useState<boolean>(!isExisting);

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
  const keyboardHeight = useKeyboardHeight();

  const [alertConfig, setAlertConfig] = useState<AppAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const scrollRef = useRef<ScrollView>(null);

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

  const handleCopyLink = async () => {
    const trimmed = link.trim();
    if (!trimmed) return;
    await Clipboard.setStringAsync(trimmed);
    showToast('Course link copied to clipboard!');
  };

  const handleAddHours = (increment: number, autoSave = false) => {
    const current = parseFloat(hours) || 0;
    const next = Math.max(0, current + increment);
    const nextFormatted = Number(next.toFixed(1));
    setHours(String(nextFormatted));

    if (autoSave && course) {
      onSave({
        ...course,
        hours: nextFormatted,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Logged +${increment}h study time!`);
    }
  };

  const handleSelectStatus = (newStatus: LearningStatus, autoSave = false) => {
    setStatus(newStatus);
    if (autoSave && course) {
      onSave({
        ...course,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    }
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
    if (isExisting) {
      setIsEditMode(false);
    } else {
      onClose();
    }
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
  const colorKey: CourseColor =
    color ||
    (course?.provider && PROVIDER_DEFAULT_COLORS[course.provider]) ||
    'violet';
  const theme = COURSE_COLORS[colorKey] || COURSE_COLORS.violet;
  const levelConfig = COURSE_LEVEL_CONFIG[level] || COURSE_LEVEL_CONFIG.Beginner;

  // Render Detail View if existing course and not in edit mode
  if (!isEditMode && course) {
    return (
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={styles.dismissArea} />
        </TouchableWithoutFeedback>

        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={[styles.badgeIconBox, { backgroundColor: statusTheme.bg }]}>
                <Ionicons name="school" size={18} color={statusTheme.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Course Details</Text>
                <Text style={styles.headerSub}>
                  {course.provider} • {course.level}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {onDelete && (
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

          {/* Floating Toast Notification (Zero layout shift) */}
          {Boolean(toastMessage) && (
            <View pointerEvents="none" style={styles.toastContainer}>
              <View style={styles.toastBox}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.accentHover} />
                <Text style={styles.toastText}>{toastMessage}</Text>
              </View>
            </View>
          )}

          {/* Details Scroll Content */}
          <ScrollView
            style={styles.formScrollArea}
            contentContainerStyle={styles.detailScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Cover Summary Card */}
            <View
              style={[
                styles.detailCoverCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={[styles.cardAccentStripe, { backgroundColor: theme.primary }]} />

              <View style={styles.detailMetaRow}>
                <View style={styles.badgeGroup}>
                  <View style={[styles.providerBadge, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
                    <Ionicons name="cube-outline" size={11} color={theme.accent} />
                    <Text style={[styles.providerBadgeText, { color: theme.badgeText }]}>
                      {course.provider}
                    </Text>
                  </View>
                  <View style={[styles.levelBadge, { backgroundColor: levelConfig.bg, borderColor: levelConfig.color + '45' }]}>
                    <Text style={[styles.levelBadgeText, { color: levelConfig.color }]}>
                      {course.level}
                    </Text>
                  </View>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg, borderColor: statusTheme.color + '45' }]}>
                  <Ionicons name={statusTheme.icon as any} size={11} color={statusTheme.color} />
                  <Text style={[styles.statusBadgeText, { color: statusTheme.color }]}>
                    {statusTheme.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.detailCourseTitle}>{title}</Text>
            </View>

            {/* 2. Key Metrics Grid (2x2) */}
            <View style={styles.detailMetricsGrid}>
              {/* Study Hours Box with quick add chips */}
              <View style={styles.detailMetricBox}>
                <View style={styles.detailMetricHeader}>
                  <Ionicons name="time-outline" size={15} color={theme.accent} />
                  <Text style={styles.detailMetricLabel}>STUDY HOURS</Text>
                </View>
                <Text style={styles.detailMetricValue}>{hours} hrs</Text>
                <View style={styles.detailQuickHoursRow}>
                  <TouchableOpacity
                    style={styles.detailQuickHourBtn}
                    onPress={() => handleAddHours(0.5, true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.detailQuickHourText}>+30m</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.detailQuickHourBtn}
                    onPress={() => handleAddHours(1, true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.detailQuickHourText}>+1h</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.detailQuickHourBtn}
                    onPress={() => handleAddHours(2, true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.detailQuickHourText}>+2h</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Start Date Box */}
              <View style={styles.detailMetricBox}>
                <View style={styles.detailMetricHeader}>
                  <Ionicons name="calendar-outline" size={15} color={theme.accent} />
                  <Text style={styles.detailMetricLabel}>START DATE</Text>
                </View>
                <Text style={styles.detailMetricValue}>{startDate || 'Recently'}</Text>
                <Text style={styles.detailMetricSub}>
                  {course.createdAt
                    ? `Added ${new Date(course.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : 'Tracked course'}
                </Text>
              </View>
            </View>

            {/* 3. Course Status Selector (Quick update directly from details) */}
            <View style={styles.detailStatusSection}>
              <View style={styles.detailSectionHeader}>
                <Ionicons name="flag-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.detailSectionLabel}>COURSE STATUS</Text>
              </View>

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
                      onPress={() => handleSelectStatus(st, true)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={cfg.icon as any}
                        size={16}
                        color={isSelected ? cfg.color : COLORS.textMuted}
                      />
                      <Text
                        style={[
                          styles.statusCardText,
                          { color: isSelected ? cfg.color : COLORS.textSecondary },
                          isSelected && { fontWeight: '700' },
                        ]}
                        numberOfLines={1}
                      >
                        {cfg.label}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color={cfg.color}
                          style={{ marginLeft: 'auto' }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Course Link (if present) */}
            {Boolean(link.trim()) && (
              <View style={styles.detailLinkCard}>
                <View style={styles.detailLinkHeader}>
                  <Ionicons name="link-outline" size={15} color={COLORS.accent} />
                  <Text style={styles.detailLinkLabel}>COURSE LINK</Text>
                </View>
                <Text style={styles.detailLinkUrl} numberOfLines={1}>
                  {link}
                </Text>
                <View style={styles.detailLinkBtnRow}>
                  <TouchableOpacity
                    style={styles.detailOpenLinkBtn}
                    onPress={handleTestLink}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="open-outline" size={15} color="#08090C" />
                    <Text style={styles.detailOpenLinkBtnText}>Open Course</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailCopyLinkBtn}
                    onPress={handleCopyLink}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="copy-outline" size={15} color={COLORS.textPrimary} />
                    <Text style={styles.detailCopyLinkBtnText}>Copy Link</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 5. Notes & Key Takeaways (if present) */}
            {Boolean(notes.trim()) && (
              <View style={styles.detailNotesCard}>
                <View style={styles.detailNotesHeader}>
                  <Ionicons name="document-text-outline" size={15} color={theme.accent} />
                  <Text style={[styles.detailNotesLabel, { color: theme.accent }]}>
                    NOTES & KEY TAKEAWAYS
                  </Text>
                </View>
                <Text style={styles.detailNotesText}>{notes}</Text>
              </View>
            )}

            {/* 6. Action Row: Edit Course & Done */}
            <View style={styles.detailActionRow}>
              <TouchableOpacity
                style={styles.btnDetailEdit}
                onPress={() => setIsEditMode(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil" size={16} color={COLORS.textPrimary} />
                <Text style={styles.btnDetailEditText}>Edit Course</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnDetailDone}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={16} color="#08090C" />
                <Text style={styles.btnDetailDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <AppAlertModal
            config={alertConfig}
            onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.dismissArea} />
      </TouchableWithoutFeedback>

      <View style={styles.modalSheet}>
        {/* Sheet Handle */}
        <View style={styles.modalHandle} />

        {/* Header Bar */}
        <View style={styles.headerBar}>
          {isExisting ? (
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => setIsEditMode(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} />
              <View>
                <Text style={styles.headerTitle}>Edit Course</Text>
                <Text style={styles.headerSub}>Back to Details</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerLeft}>
              <View style={[styles.badgeIconBox, { backgroundColor: statusTheme.bg }]}>
                <Ionicons name="school" size={18} color={statusTheme.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Add Learning Course</Text>
                <Text style={styles.headerSub}>Track progress, syllabus & study hours</Text>
              </View>
            </View>
          )}

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

        {/* Floating Toast Notification (Zero layout shift) */}
        {Boolean(toastMessage) && (
          <View pointerEvents="none" style={styles.toastContainer}>
            <View style={styles.toastBox}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.accentHover} />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          </View>
        )}

        {/* Form Scroll Area */}
        <ScrollView
          ref={scrollRef}
          style={styles.formScrollArea}
          contentContainerStyle={[
            styles.formScrollContent,
            { paddingBottom: Math.max(28, keyboardHeight + 28) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
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
                    onPress={() => handleSelectStatus(st, false)}
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
          </ScrollView>
        </View>

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
    maxWidth: 520,
    alignSelf: 'center',
    height: '85%',
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: COLORS.borderLight,
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
  toastContainer: {
    position: 'absolute',
    top: 58,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  toastText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  formScrollArea: {
    flex: 1,
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

  // Detail View Styles
  detailScrollContent: {
    paddingTop: 4,
    paddingBottom: 24,
    gap: 14,
  },
  detailCoverCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    padding: 16,
    paddingTop: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccentStripe: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  detailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  providerBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  levelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  detailCourseTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  detailMetricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  detailMetricBox: {
    flex: 1,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  detailMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detailMetricLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  detailMetricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  detailMetricSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  detailQuickHoursRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  detailQuickHourBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.sm,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  detailQuickHourText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  detailStatusSection: {
    marginBottom: 14,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  detailSectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  detailLinkCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  detailLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detailLinkLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  detailLinkUrl: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  detailLinkBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  detailOpenLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
  },
  detailOpenLinkBtnText: {
    color: '#08090C',
    fontSize: 12.5,
    fontWeight: '800',
  },
  detailCopyLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailCopyLinkBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  detailNotesCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.accent,
    padding: 14,
  },
  detailNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detailNotesLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  detailNotesText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  detailActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  btnDetailEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnDetailEditText: {
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  btnDetailDone: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.lg,
    paddingVertical: 13,
  },
  btnDetailDoneText: {
    color: '#08090C',
    fontSize: 13.5,
    fontWeight: '800',
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
});
