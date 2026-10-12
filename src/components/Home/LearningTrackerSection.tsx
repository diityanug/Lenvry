import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { COLORS, RADIUS } from '../../constants/theme';
import {
  LearningCourse,
  LearningStatus,
  CourseColor,
  LEARNING_STATUS_CONFIG,
  COURSE_LEVEL_CONFIG,
  COURSE_COLORS,
  COURSE_COLOR_KEYS,
  PROVIDER_DEFAULT_COLORS,
} from '../../types/learning';

interface LearningTrackerSectionProps {
  courses: LearningCourse[];
  onSelectCourse: (course: LearningCourse) => void;
  onCreateCourse: () => void;
  onUpdateStatus: (id: string, status: LearningStatus) => void;
}

export default function LearningTrackerSection({
  courses,
  onSelectCourse,
  onCreateCourse,
  onUpdateStatus,
}: LearningTrackerSectionProps) {
  const [selectedFilter, setSelectedFilter] = useState<'All' | LearningStatus>('All');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const handleCopyLink = async (link: string) => {
    if (!link) return;
    await Clipboard.setStringAsync(link);
  };

  const handleOpenLink = async (link: string) => {
    if (!link) return;
    const url = link.startsWith('http://') || link.startsWith('https://') ? link : `https://${link}`;
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

  const stats = useMemo(() => {
    const total = courses.length;
    const inProgress = courses.filter((c) => c.status === 'In Progress').length;
    const completed = courses.filter((c) => c.status === 'Completed').length;
    const totalHours = courses.reduce((sum, c) => sum + (c.hours || 0), 0);
    return { total, inProgress, completed, totalHours };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (selectedFilter === 'All') return courses;
    return courses.filter((c) => c.status === selectedFilter);
  }, [courses, selectedFilter]);

  const handleToggleCompleted = (course: LearningCourse) => {
    const newStatus: LearningStatus =
      course.status === 'Completed' ? 'In Progress' : 'Completed';
    onUpdateStatus(course.id, newStatus);
  };

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      {Boolean(toastMessage) && (
        <View style={styles.toastBox}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <View style={styles.titleRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="school" size={14} color={COLORS.accent} />
            </View>
            <Text style={styles.sectionTitleText}>LEARNING TRACKER</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            {stats.inProgress} Active • {stats.completed} Done • {stats.totalHours.toFixed(1)}h Studied
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addCourseBtn}
          onPress={onCreateCourse}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#08090C" />
          <Text style={styles.addCourseBtnText}>Add Course</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      {courses.length > 0 && (
        <View style={styles.filterTabsRow}>
          {(['All', 'In Progress', 'Completed', 'Not Started'] as const).map((tab) => {
            const isSelected = selectedFilter === tab;
            const count =
              tab === 'All'
                ? courses.length
                : courses.filter((c) => c.status === tab).length;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, isSelected && styles.filterTabActive]}
                onPress={() => setSelectedFilter(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    isSelected && styles.filterTabTextActive,
                  ]}
                >
                  {tab} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Course Cards List */}
      {filteredCourses.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyCard}
          onPress={onCreateCourse}
          activeOpacity={0.8}
        >
          <View style={styles.emptyIconWrap}>
            <Ionicons name="school-outline" size={26} color={COLORS.accent} />
          </View>
          <Text style={styles.emptyTitle}>
            {courses.length === 0
              ? 'No learning courses tracked yet'
              : `No courses in "${selectedFilter}"`}
          </Text>
          <Text style={styles.emptySubtitle}>
            {courses.length === 0
              ? 'Tap here to track your online courses, bootcamps, and study hours'
              : 'Add new course or switch filter tab to see other courses'}
          </Text>
          <View style={styles.emptyActionBtn}>
            <Ionicons name="add-circle-outline" size={16} color={COLORS.accent} />
            <Text style={styles.emptyActionBtnText}>Add Course</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.courseCardsContainer}>
          {filteredCourses.map((course, idx) => {
            // Pick colorful theme based on course.color, provider default, or index rotation
            const colorKey: CourseColor =
              course.color ||
              PROVIDER_DEFAULT_COLORS[course.provider] ||
              COURSE_COLOR_KEYS[idx % COURSE_COLOR_KEYS.length];

            const theme = COURSE_COLORS[colorKey] || COURSE_COLORS.violet;

            const statusConfig =
              LEARNING_STATUS_CONFIG[course.status] ||
              LEARNING_STATUS_CONFIG['In Progress'];
            const levelConfig =
              COURSE_LEVEL_CONFIG[course.level] || COURSE_LEVEL_CONFIG.Beginner;
            const isCompleted = course.status === 'Completed';

            return (
              <View
                key={course.id}
                style={[
                  styles.courseCard,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                  },
                ]}
              >
                {/* Top Colored Accent Stripe */}
                <View
                  style={[
                    styles.cardAccentStripe,
                    { backgroundColor: theme.primary },
                  ]}
                />

                {/* Svg Soft Radial Glow in Card Corner */}
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                  <Svg width="100%" height="100%">
                    <Defs>
                      <RadialGradient
                        id={`glow_${course.id}`}
                        cx="90%"
                        cy="12%"
                        r="68%"
                      >
                        <Stop offset="0%" stopColor={theme.primary} stopOpacity={0.25} />
                        <Stop offset="65%" stopColor={theme.primary} stopOpacity={0.06} />
                        <Stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
                      </RadialGradient>
                    </Defs>
                    <Rect
                      x="0"
                      y="0"
                      width="100%"
                      height="100%"
                      fill={`url(#glow_${course.id})`}
                      rx={RADIUS.xxl}
                    />
                  </Svg>
                </View>

                {/* Meta Badges Header */}
                <View style={styles.cardMetaRow}>
                  {/* Provider & Level */}
                  <View style={styles.badgeGroup}>
                    <View
                      style={[
                        styles.providerBadge,
                        {
                          backgroundColor: theme.badgeBg,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Ionicons name="cube-outline" size={12} color={theme.accent} />
                      <Text style={[styles.providerBadgeText, { color: theme.badgeText }]}>
                        {course.provider}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.levelBadge,
                        {
                          backgroundColor: levelConfig.bg,
                          borderColor: levelConfig.color + '45',
                        },
                      ]}
                    >
                      <Text style={[styles.levelBadgeText, { color: levelConfig.color }]}>
                        {course.level}
                      </Text>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <TouchableOpacity
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: statusConfig.bg,
                        borderColor: statusConfig.color + '55',
                      },
                    ]}
                    onPress={() => handleToggleCompleted(course)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={statusConfig.icon as any}
                      size={13}
                      color={statusConfig.color}
                    />
                    <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Course Title */}
                <TouchableOpacity
                  onPress={() => onSelectCourse(course)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.courseTitle,
                      isCompleted && styles.courseTitleCompleted,
                    ]}
                    numberOfLines={2}
                  >
                    {course.title}
                  </Text>
                </TouchableOpacity>

                {/* Details Row (Hours & Start Date) */}
                <View style={styles.cardDetailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={13} color={theme.accent} />
                    <Text style={styles.detailItemText}>
                      <Text style={{ fontWeight: '800', color: theme.ink }}>
                        {course.hours}
                      </Text>{' '}
                      hrs
                    </Text>
                  </View>

                  <View style={[styles.detailDot, { backgroundColor: theme.primary + '88' }]} />

                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={13} color={theme.accent} />
                    <Text style={styles.detailItemText}>
                      Started {course.startDate || 'Recently'}
                    </Text>
                  </View>
                </View>

                {/* Course Link Section */}
                {Boolean(course.link?.trim()) && (
                  <View
                    style={[
                      styles.linkBar,
                      {
                        backgroundColor: theme.badgeBg,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.openLinkBtn}
                      onPress={() => handleOpenLink(course.link!)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="open-outline" size={14} color={theme.accent} />
                      <Text style={[styles.openLinkBtnText, { color: theme.badgeText }]} numberOfLines={1}>
                        Open Course Page
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.copyLinkIconBtn}
                      onPress={() => handleCopyLink(course.link!)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="copy-outline" size={14} color={theme.accent} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Notes Preview */}
                {Boolean(course.notes?.trim()) && (
                  <TouchableOpacity
                    style={[
                      styles.notesPreviewBox,
                      {
                        borderLeftColor: theme.primary,
                      },
                    ]}
                    onPress={() => onSelectCourse(course)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.notesHeader}>
                      <Ionicons name="document-text-outline" size={12} color={theme.accent} />
                      <Text style={[styles.notesHeaderLabel, { color: theme.accent }]}>NOTES</Text>
                    </View>
                    <Text style={styles.notesPreviewText} numberOfLines={2}>
                      {course.notes}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Card Footer Actions */}
                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                  <TouchableOpacity
                    style={[
                      styles.quickStatusToggleBtn,
                      isCompleted && styles.quickStatusToggleBtnCompleted,
                    ]}
                    onPress={() => handleToggleCompleted(course)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={isCompleted ? 'arrow-undo-outline' : 'checkmark-circle-outline'}
                      size={15}
                      color={isCompleted ? COLORS.textMuted : COLORS.success}
                    />
                    <Text
                      style={[
                        styles.quickStatusToggleText,
                        { color: isCompleted ? COLORS.textMuted : COLORS.success },
                      ]}
                    >
                      {isCompleted ? 'Mark Active' : 'Mark Completed'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.editBtn,
                      {
                        backgroundColor: theme.badgeBg,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => onSelectCourse(course)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="pencil" size={13} color={theme.badgeText} />
                    <Text style={[styles.editBtnText, { color: theme.badgeText }]}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 34,
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  toastText: {
    color: COLORS.accentHover,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 3,
  },
  addCourseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accent,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  addCourseBtnText: {
    color: '#08090C',
    fontSize: 12,
    fontWeight: '800',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  filterTab: {
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
  },
  filterTabText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: COLORS.accentHover,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 3,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
    maxWidth: 280,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyActionBtnText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  courseCardsContainer: {
    gap: 14,
  },
  courseCard: {
    borderRadius: RADIUS.xxl,
    borderWidth: 1.5,
    padding: 16,
    paddingTop: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 5,
  },
  cardAccentStripe: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  cardMetaRow: {
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
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  providerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4.5,
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
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  courseTitle: {
    color: COLORS.textPrimary,
    fontSize: 16.5,
    fontWeight: '800',
    lineHeight: 23,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  courseTitleCompleted: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
    opacity: 0.85,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailItemText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  detailDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
  },
  linkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  openLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  openLinkBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  copyLinkIconBtn: {
    padding: 3,
    marginLeft: 8,
  },
  notesPreviewBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderLeftWidth: 3,
    padding: 10,
    marginBottom: 12,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  notesHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  notesPreviewText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  quickStatusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: RADIUS.xs,
  },
  quickStatusToggleBtnCompleted: {
    opacity: 0.8,
  },
  quickStatusToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
