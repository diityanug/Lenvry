import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
}

export default function LearningTrackerSection({
  courses,
  onSelectCourse,
  onCreateCourse,
}: LearningTrackerSectionProps) {
  const [selectedFilter, setSelectedFilter] = useState<'All' | LearningStatus>('All');

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

  return (
    <View style={styles.container}>
      {/* Section Header (Rule 3: Title only, no button in same row) */}
      <View style={styles.sectionHeaderBlock}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="school" size={14} color={COLORS.accent} />
          </View>
          <Text style={styles.sectionTitleText}>LEARNING TRACKER</Text>
        </View>
      </View>

      {/* HIGHLIGHTED STATS BANNER (In Progress, Completed & Hours Studied) */}
      <View style={styles.statsBanner}>
        {/* Metric 1: In Progress */}
        <View style={[styles.statCard, styles.statCardInProgress]}>
          <View style={styles.statCardTopRow}>
            <Ionicons name="play-circle" size={13} color="#38BDF8" />
            <Text style={[styles.statCardLabel, { color: '#38BDF8' }]}>IN PROGRESS</Text>
          </View>
          <Text style={[styles.statCardValue, { color: '#38BDF8' }]}>
            {stats.inProgress}
          </Text>
        </View>

        {/* Metric 2: Completed */}
        <View style={[styles.statCard, styles.statCardCompleted]}>
          <View style={styles.statCardTopRow}>
            <Ionicons name="checkmark-circle" size={13} color="#10B981" />
            <Text style={[styles.statCardLabel, { color: '#10B981' }]}>COMPLETED</Text>
          </View>
          <Text style={[styles.statCardValue, { color: '#10B981' }]}>
            {stats.completed}
          </Text>
        </View>

        {/* Metric 3: Hours Studied */}
        <View style={[styles.statCard, styles.statCardHours]}>
          <View style={styles.statCardTopRow}>
            <Ionicons name="time" size={13} color="#A78BFA" />
            <Text style={[styles.statCardLabel, { color: '#A78BFA' }]}>STUDIED</Text>
          </View>
          <Text style={[styles.statCardValue, { color: '#A78BFA' }]}>
            {stats.totalHours % 1 === 0 ? stats.totalHours : stats.totalHours.toFixed(1)}
            <Text style={styles.statCardUnit}> hrs</Text>
          </Text>
        </View>
      </View>

      {/* Dedicated Add Course Action Bar */}
      <TouchableOpacity
        style={styles.addCourseBar}
        onPress={onCreateCourse}
        activeOpacity={0.75}
      >
        <Ionicons name="add-circle" size={18} color={COLORS.accentHover} />
        <Text style={styles.addCourseBarText}>Track New Course</Text>
      </TouchableOpacity>

      {/* Category Filter Tabs (Single-row horizontal scroll, balanced & symmetrical) */}
      {courses.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsScroll}
          style={styles.filterScrollView}
        >
          {(['All', 'In Progress', 'Completed', 'Not Started', 'On Hold'] as const).map((tab) => {
            const isSelected = selectedFilter === tab;
            const count =
              tab === 'All'
                ? courses.length
                : courses.filter((c) => c.status === tab).length;
            const tabLabel = tab === 'On Hold' ? 'Pending' : tab;

            const tabIcon =
              tab === 'All'
                ? 'grid-outline'
                : tab === 'In Progress'
                ? 'play-circle-outline'
                : tab === 'Completed'
                ? 'checkmark-circle-outline'
                : tab === 'Not Started'
                ? 'time-outline'
                : 'pause-circle-outline';

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, isSelected && styles.filterTabActive]}
                onPress={() => setSelectedFilter(tab)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tabIcon as any}
                  size={12}
                  color={isSelected ? COLORS.accentHover : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    isSelected && styles.filterTabTextActive,
                  ]}
                >
                  {tabLabel}
                </Text>
                <View
                  style={[
                    styles.filterBadge,
                    isSelected && styles.filterBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      isSelected && styles.filterBadgeTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Course Cards List (Clean Cover Cards) */}
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
            // Theme selection based on color or provider
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
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.courseCoverCard,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => onSelectCourse(course)}
                activeOpacity={0.78}
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
                        <Stop offset="0%" stopColor={theme.primary} stopOpacity={0.22} />
                        <Stop offset="65%" stopColor={theme.primary} stopOpacity={0.05} />
                        <Stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
                      </RadialGradient>
                    </Defs>
                    <Rect
                      x="0"
                      y="0"
                      width="100%"
                      height="100%"
                      fill={`url(#glow_${course.id})`}
                      rx={RADIUS.xl}
                    />
                  </Svg>
                </View>

                {/* Cover Meta Row: Provider, Level, and Status Badge */}
                <View style={styles.cardMetaRow}>
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
                      <Ionicons name="cube-outline" size={11} color={theme.accent} />
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

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: statusConfig.bg,
                        borderColor: statusConfig.color + '45',
                      },
                    ]}
                  >
                    <Ionicons
                      name={statusConfig.icon as any}
                      size={11}
                      color={statusConfig.color}
                    />
                    <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Course Title */}
                <Text
                  style={[
                    styles.courseTitle,
                    isCompleted && styles.courseTitleCompleted,
                  ]}
                  numberOfLines={2}
                >
                  {course.title}
                </Text>

                {/* Cover Footer Row: Hours Studied & View Details Hint */}
                <View style={styles.cardFooterRow}>
                  <View style={styles.hoursBadge}>
                    <Ionicons name="time" size={13} color={theme.accent} />
                    <Text style={styles.hoursBadgeText}>
                      <Text style={[styles.hoursBadgeVal, { color: theme.ink }]}>
                        {course.hours}
                      </Text>{' '}
                      hrs studied
                    </Text>
                  </View>

                  <View style={styles.viewDetailHint}>
                    <Text style={[styles.viewDetailHintText, { color: theme.badgeText }]}>
                      View Details
                    </Text>
                    <Ionicons name="chevron-forward" size={13} color={theme.badgeText} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  sectionHeaderBlock: {
    marginBottom: 12,
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
    marginTop: 4,
  },
  // 3-Metric Highlight Stats Banner
  statsBanner: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardInProgress: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  statCardActiveInProgress: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: '#38BDF8',
  },
  statCardCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  statCardActiveCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10B981',
  },
  statCardHours: {
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  statCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 6,
  },
  statCardLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  statCardUnit: {
    fontSize: 11,
    fontWeight: '700',
  },

  addCourseBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    borderRadius: RADIUS.lg,
    paddingVertical: 11,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  addCourseBarText: {
    color: COLORS.accentHover,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  filterScrollView: {
    marginBottom: 14,
  },
  filterTabsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 1,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
  },
  filterTabText: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: COLORS.accentHover,
    fontWeight: '800',
  },
  filterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.full,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  filterBadgeText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  filterBadgeTextActive: {
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
    gap: 12,
  },
  courseCoverCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    padding: 15,
    paddingTop: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
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
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  courseTitle: {
    color: COLORS.textPrimary,
    fontSize: 15.5,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  courseTitleCompleted: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
    opacity: 0.85,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  hoursBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  hoursBadgeVal: {
    fontWeight: '800',
  },
  viewDetailHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewDetailHintText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
