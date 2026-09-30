import React, { useState, useMemo } from 'react';
import {
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../../types/fitness';
import { getCategoryIcon } from '../../constants/fitness';
import { COLORS } from '../../constants/theme';
import { fitnessStyles as styles } from '../../styles/fitnessStyles';

interface WorkoutHistoryModalProps {
  visible: boolean;
  workouts: Workout[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onClone?: (workout: Workout) => void;
}

export default function WorkoutHistoryModal({
  visible,
  workouts,
  onClose,
  onDelete,
  onClone,
}: WorkoutHistoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Categories list for filter
  const categories = useMemo(() => {
    const cats = Array.from(new Set(workouts.map((w) => w.category).filter(Boolean)));
    return ['All', ...cats];
  }, [workouts]);

  // Filtered workouts
  const filteredList = useMemo(() => {
    let result = [...workouts].sort((a, b) => (b.date > a.date ? 1 : -1));

    if (selectedCategory !== 'All') {
      result = result.filter((w) => w.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const tokens = searchQuery.toLowerCase().trim().split(/\s+/);
      result = result.filter((w) => {
        const str = `${w.exercise} ${w.category} ${w.date}`.toLowerCase();
        return tokens.every((token) => str.includes(token));
      });
    }

    return result;
  }, [workouts, selectedCategory, searchQuery]);

  // Format date helper
  const formatDateLabel = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      if (!year || !month || !day) return dateStr;
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
          <View style={styles.modalDismissArea} />
        </TouchableWithoutFeedback>

        <View style={styles.historyModalContent}>
          {/* Top Drag Handle */}
          <View style={styles.modalHandle} />

          {/* Fixed Header Section */}
          <View style={styles.historyFixedHeader}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.modalTitle}>Workout History</Text>
                <View style={styles.countBadge}>
                  <Text style={[styles.countBadgeText, { color: COLORS.warning }]}>
                    {filteredList.length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.historySearchBox}>
              <Ionicons name="search-outline" size={17} color={COLORS.textMuted} />
              <TextInput
                style={styles.historySearchInput}
                placeholder="Search exercise, muscle, date..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Chips Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.historyCatScroll}
              contentContainerStyle={{ paddingRight: 24 }}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.historyCatChip,
                    selectedCategory === cat && styles.historyCatChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.historyCatText,
                      selectedCategory === cat && styles.historyCatTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Workouts History List */}
          <FlatList
            data={filteredList}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 60 }}
            renderItem={({ item }) => {
              const isCardio = item.category === 'Cardio' || item.category === 'Kardio';
              return (
                <View style={styles.workoutCard}>
                  <View style={styles.workoutHeader}>
                    <View style={styles.workoutIconContainer}>
                      <Ionicons
                        name={getCategoryIcon(item.category) as any}
                        size={18}
                        color={COLORS.warning}
                      />
                    </View>
                    <View style={styles.workoutTitleContainer}>
                      <Text style={styles.workoutExercise} numberOfLines={1}>
                        {item.exercise}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.workoutCategory}>{item.category}</Text>
                        <Text style={styles.workoutDot}>•</Text>
                        <Text style={styles.historyDateBadge}>{formatDateLabel(item.date)}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {onClone && (
                        <TouchableOpacity
                          onPress={() => {
                            onClone(item);
                            onClose();
                          }}
                          style={styles.historyActionBtn}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="copy-outline" size={13} color={COLORS.textSecondary} />
                          <Text style={styles.historyActionBtnText}>Copy</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => onDelete(item.id)}
                        style={[styles.historyActionBtn, styles.historyDeleteBtn]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.workoutDetailsRow}>
                    {isCardio ? (
                      <>
                        <View style={styles.workoutStatPill}>
                          <Ionicons name="time-outline" size={12} color={COLORS.warning} style={{ marginRight: 4 }} />
                          <Text style={styles.workoutPill}>
                            {item.sets || '0'} <Text style={styles.workoutUnit}>Mins</Text>
                          </Text>
                        </View>

                        {parseFloat(item.reps || '0') > 0 && (
                          <>
                            <Text style={styles.workoutDot}>•</Text>
                            <View style={styles.workoutStatPill}>
                              <Ionicons name="speedometer-outline" size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                              <Text style={styles.workoutPill}>
                                {item.reps} <Text style={styles.workoutUnit}>km</Text>
                              </Text>
                            </View>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <View style={styles.workoutStatPill}>
                          <Text style={styles.workoutPill}>
                            {item.sets} <Text style={styles.workoutUnit}>Sets</Text>
                          </Text>
                        </View>
                        <Text style={styles.workoutDot}>•</Text>
                        <View style={styles.workoutStatPill}>
                          <Text style={styles.workoutPill}>
                            {item.reps} <Text style={styles.workoutUnit}>Reps</Text>
                          </Text>
                        </View>

                        <Text style={styles.workoutDot}>•</Text>
                        <View style={[styles.workoutStatPill, styles.workoutStatPillHighlight]}>
                          <Ionicons name="barbell-outline" size={12} color={COLORS.warning} style={{ marginRight: 4 }} />
                          <Text style={[styles.workoutPill, styles.workoutHighlight]}>
                            {item.weight} <Text style={styles.workoutUnit}>kg</Text>
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyHistoryState}>
                <Ionicons name="barbell-outline" size={36} color={COLORS.textMuted} />
                <Text style={styles.emptyHistoryTitle}>No workouts found</Text>
                <Text style={styles.emptyHistorySubtitle}>
                  Try clearing search or logging a workout session.
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}
