import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  isHabitCompletedForDate,
  HABIT_DEFAULT_CATEGORY_CONFIG,
} from '../../constants/habits';
import { TAB_BAR_HEIGHT } from '../../constants/tabBar';
import { COLORS } from '../../constants/theme';
import { ErrorBoundary } from '../Shared/ErrorBoundary';
import { homeStyles as styles } from '../../styles/homeStyles';
import DailyOverviewCard from './DailyOverviewCard';
import HomeSettingsModal from './HomeSettingsModal';
import StickyNotesSection from './StickyNotesSection';
import StickyNoteModal from './StickyNoteModal';
import LearningTrackerSection from './LearningTrackerSection';
import LearningCourseModal from './LearningCourseModal';
import { StickyNote } from '../../types/notes';
import { LearningCourse } from '../../types/learning';
import { useHomeDashboard } from '../../hooks/useHomeDashboard';

function getGreeting(hour = new Date().getHours()) {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const [activeTab, setActiveTab] = useState<'today' | 'growth'>('today');
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isStickyModalVisible, setIsStickyModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<StickyNote | null>(null);
  const [isCourseModalVisible, setIsCourseModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<LearningCourse | null>(null);

  const {
    userName,
    setUserName,
    todayExpenses,
    habitCompletedCount,
    habitTotalCount,
    todayHabits,
    todayWorkoutCount,
    todayCaloriesConsumed,
    calorieTarget,
    notes,
    courses,
    fetchDashboardData,
    toggleHabitOnHome,
    handleSaveStickyNote,
    handleDeleteStickyNote,
    handleSaveCourse,
    handleDeleteCourse,
    todayDateObj,
    habitKey,
  } = useHomeDashboard();

  const today = todayDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const greeting = getGreeting(todayDateObj.getHours());

  const handleOpenNoteModal = (note: StickyNote | null = null) => {
    setSelectedNote(note);
    setIsStickyModalVisible(true);
  };

  const handleOpenCourseModal = (course: LearningCourse | null = null) => {
    setSelectedCourse(course);
    setIsCourseModalVisible(true);
  };

  return (
    <ErrorBoundary fallbackTitle="Home Encountered an Issue">
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgCanvas }]} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgCanvas} translucent={true} />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="ambientGlow" cx="50%" cy="0%" r="75%">
              <Stop offset="0%" stopColor={COLORS.accent} stopOpacity={0.12} />
              <Stop offset="50%" stopColor={COLORS.accent} stopOpacity={0.04} />
              <Stop offset="100%" stopColor={COLORS.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambientGlow)" />
        </Svg>
      </View>

      {/* User Profile Header */}
      <View style={styles.headerRow}>
        <View style={styles.userProfile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginRight: 10 }}>
            <View style={styles.dateRow}>
              <Text style={styles.greetingSubtext}>{greeting}</Text>
              <Text style={styles.bulletDot}>•</Text>
              <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.dateText}>{today}</Text>
            </View>
            <Text
              style={styles.userNameHeading}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.75}
            >
              {userName}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => setIsSettingsVisible(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="settings-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Segmented Navigation Tab */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentedTab, activeTab === 'today' && styles.segmentedTabActive]}
          onPress={() => setActiveTab('today')}
          activeOpacity={0.75}
        >
          <Ionicons
            name={activeTab === 'today' ? 'sunny' : 'sunny-outline'}
            size={15}
            color={activeTab === 'today' ? COLORS.accentHover : COLORS.textMuted}
          />
          <Text style={[styles.segmentedTabText, activeTab === 'today' && styles.segmentedTabTextActive]}>
            Today
          </Text>
          {habitTotalCount > 0 && (
            <View style={[styles.segmentedBadge, activeTab === 'today' && styles.segmentedBadgeActive]}>
              <Text style={[styles.segmentedBadgeText, activeTab === 'today' && styles.segmentedBadgeTextActive]}>
                {habitCompletedCount}/{habitTotalCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentedTab, activeTab === 'growth' && styles.segmentedTabActive]}
          onPress={() => setActiveTab('growth')}
          activeOpacity={0.75}
        >
          <Ionicons
            name={activeTab === 'growth' ? 'bulb' : 'bulb-outline'}
            size={15}
            color={activeTab === 'growth' ? COLORS.accentHover : COLORS.textMuted}
          />
          <Text style={[styles.segmentedTabText, activeTab === 'growth' && styles.segmentedTabTextActive]}>
            Notes & Growth
          </Text>
          {(notes.length > 0 || courses.length > 0) && (
            <View style={[styles.segmentedBadge, activeTab === 'growth' && styles.segmentedBadgeActive]}>
              <Text style={[styles.segmentedBadgeText, activeTab === 'growth' && styles.segmentedBadgeTextActive]}>
                {notes.length + courses.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: TAB_BAR_HEIGHT + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'today' ? (
          <Animated.View entering={FadeIn.duration(180)}>
            {/* Daily Overview */}
            <DailyOverviewCard
              habitCompletedCount={habitCompletedCount}
              habitTotalCount={habitTotalCount}
              todayWorkoutCount={todayWorkoutCount}
              todayExpenses={todayExpenses}
              todayCaloriesConsumed={todayCaloriesConsumed}
              calorieTarget={calorieTarget}
            />

            {/* Today's Activities Section Header */}
            <View style={styles.sectionHeaderBlock}>
              <Text style={styles.sectionTitleText}>{"TODAY'S ACTIVITIES"}</Text>
              <Text style={styles.sectionSubtitleText}>
                {habitCompletedCount} of {habitTotalCount} activities completed
              </Text>
            </View>

            {todayHabits.length === 0 ? (
              <TouchableOpacity
                style={styles.emptyCard}
                onPress={() => router.push('/habits' as Href)}
                activeOpacity={0.8}
              >
                <View style={styles.emptyCardIconWrap}>
                  <Ionicons name="sparkles-outline" size={24} color={COLORS.accent} />
                </View>
                <Text style={styles.emptyCardTitle}>No activities scheduled for today</Text>
                <Text style={styles.emptyCardSub}>Tap here to manage your habits & daily tasks</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <View style={styles.habitsPreviewCard}>
                  {todayHabits.slice(0, 4).map((habit, idx) => {
                    const isDone = isHabitCompletedForDate(habit, habitKey);
                    const isLast = idx === Math.min(todayHabits.length, 4) - 1;
                    const catCfg =
                      HABIT_DEFAULT_CATEGORY_CONFIG[habit.category] || {
                        icon: 'pricetag-outline',
                        label: habit.category,
                        color: COLORS.textSecondary,
                        bg: 'rgba(148, 163, 184, 0.12)',
                      };
                    return (
                      <TouchableOpacity
                        key={habit.id}
                        style={[styles.habitItemRow, !isLast && styles.habitItemBorder]}
                        onPress={() => toggleHabitOnHome(habit.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.habitIconChip,
                            { backgroundColor: catCfg.bg, borderColor: catCfg.color + '40' },
                          ]}
                        >
                          <Ionicons name={catCfg.icon as any} size={17} color={catCfg.color} />
                        </View>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text
                            style={[styles.habitItemTitle, isDone && styles.habitItemTitleDone]}
                            numberOfLines={1}
                          >
                            {habit.title}
                          </Text>
                          <Text style={styles.habitItemMeta} numberOfLines={1}>
                            <Text style={{ color: catCfg.color, fontWeight: '700' }}>
                              {habit.category}
                            </Text>
                            {habit.timeSlot && habit.timeSlot !== 'Anytime' ? ` • ${habit.timeSlot}` : ''}
                          </Text>
                        </View>
                        {habit.priority === 'high' && (
                          <View style={styles.priorityBadge}>
                            <Text style={styles.priorityBadgeText}>HIGH</Text>
                          </View>
                        )}
                        <Ionicons
                          name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                          size={24}
                          color={isDone ? COLORS.success : COLORS.textMuted}
                          style={{ marginLeft: 12 }}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Footer Action Button */}
                <TouchableOpacity
                  style={styles.sectionFooterBtn}
                  onPress={() => router.push('/habits' as Href)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.sectionFooterBtnText}>
                    View All Activities ({habitTotalCount})
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.accentHover} />
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(180)}>
            {/* Pinned Sticky Notes */}
            <StickyNotesSection
              notes={notes}
              onSelectNote={handleOpenNoteModal}
              onCreateNote={() => handleOpenNoteModal(null)}
            />

            {/* Learning Tracker Section */}
            <LearningTrackerSection
              courses={courses}
              onSelectCourse={handleOpenCourseModal}
              onCreateCourse={() => handleOpenCourseModal(null)}
            />
          </Animated.View>
        )}
      </ScrollView>

      {/* Settings Modal */}
      <HomeSettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        currentUserName={userName}
        onUserNameUpdated={(newName) => setUserName(newName)}
        onDataResetOrRestored={fetchDashboardData}
      />

      {/* Pinned Sticky Note Detail & Editor Modal */}
      <StickyNoteModal
        visible={isStickyModalVisible}
        note={selectedNote}
        onClose={() => setIsStickyModalVisible(false)}
        onSave={(updatedNote) => {
          setSelectedNote(updatedNote);
          handleSaveStickyNote(updatedNote);
        }}
        onDelete={handleDeleteStickyNote}
      />

      {/* Learning Course Editor Modal */}
      <LearningCourseModal
        visible={isCourseModalVisible}
        course={selectedCourse}
        onClose={() => setIsCourseModalVisible(false)}
        onSave={handleSaveCourse}
        onDelete={handleDeleteCourse}
      />
    </SafeAreaView>
  </ErrorBoundary>
  );
}

export default HomeScreen;
