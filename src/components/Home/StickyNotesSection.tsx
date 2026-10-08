import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import { StickyNote, STICKY_COLORS, NoteCategory, NOTE_CATEGORIES } from '../../types/notes';

interface StickyNotesSectionProps {
  notes: StickyNote[];
  onSelectNote: (note: StickyNote) => void;
  onCreateNote: () => void;
}

export default function StickyNotesSection({
  notes,
  onSelectNote,
  onCreateNote,
}: StickyNotesSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categoriesList = ['All', 'Personal', 'General', 'Work', 'Ideas', 'Lists'];

  const filteredNotes =
    activeCategory === 'All'
      ? notes
      : notes.filter((n) => (n.category || 'General') === activeCategory);

  return (
    <View style={styles.sectionContainer}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="pin" size={15} color={COLORS.accentHover} />
          <Text style={styles.sectionTitle}>PINNED NOTES</Text>
          {notes.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{notes.length}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={onCreateNote} style={styles.addNoteBtnHeader} activeOpacity={0.7}>
          <Ionicons name="add" size={14} color={COLORS.accentHover} />
          <Text style={styles.addNoteBtnHeaderText}>Add Note</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Bar */}
      {notes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilterContainer}
        >
          {categoriesList.map((catKey) => {
            const isAll = catKey === 'All';
            const catConfig = !isAll ? NOTE_CATEGORIES[catKey as NoteCategory] : null;
            const isSelected = activeCategory === catKey;

            // Count notes per category
            const count = isAll
              ? notes.length
              : notes.filter((n) => (n.category || 'General') === catKey).length;

            if (count === 0 && !isAll && !isSelected) return null;

            return (
              <TouchableOpacity
                key={catKey}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                  isSelected && catConfig && { borderColor: catConfig.color, backgroundColor: catConfig.color + '22' },
                ]}
                onPress={() => setActiveCategory(catKey)}
                activeOpacity={0.7}
              >
                {catConfig ? (
                  <Ionicons
                    name={catConfig.icon as any}
                    size={13}
                    color={isSelected ? catConfig.color : COLORS.textMuted}
                  />
                ) : (
                  <Ionicons
                    name="grid-outline"
                    size={13}
                    color={isSelected ? COLORS.accentHover : COLORS.textMuted}
                  />
                )}
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                    isSelected && catConfig && { color: catConfig.color },
                  ]}
                >
                  {catKey === 'Personal' ? 'Personal & Pass' : catKey} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Content */}
      {filteredNotes.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyCard}
          onPress={onCreateNote}
          activeOpacity={0.75}
        >
          <View style={styles.emptyIconWrap}>
            <Ionicons name="pencil" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.emptyTitle}>
            {notes.length === 0 ? 'No pinned notes yet' : `No notes in "${activeCategory}"`}
          </Text>
          <Text style={styles.emptySub}>
            Tap here to write shopping lists, casual ideas, or personal credentials.
          </Text>
        </TouchableOpacity>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredNotes.map((note) => {
            const colorKey = note.color || 'amber';
            const palette = STICKY_COLORS[colorKey] || STICKY_COLORS.amber;
            const isChecklist = note.type === 'checklist';
            const catConfig = NOTE_CATEGORIES[note.category || 'General'] || NOTE_CATEGORIES.General;
            const totalItems = note.checklist?.length || 0;
            const completedItems = note.checklist?.filter((item) => item.done).length || 0;
            const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            return (
              <TouchableOpacity
                key={note.id}
                style={[
                  styles.stickyCard,
                  {
                    borderColor: palette.border,
                  },
                ]}
                onPress={() => onSelectNote(note)}
                activeOpacity={0.8}
              >
                {/* Top Accent Strip */}
                <View style={[styles.topAccentStrip, { backgroundColor: palette.accent }]} />

                {/* Card Header: Category badge & Pin */}
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: catConfig.color + '22', borderColor: catConfig.color + '44' }]}>
                    <Ionicons name={catConfig.icon as any} size={11} color={catConfig.color} />
                    <Text style={[styles.categoryBadgeText, { color: catConfig.color }]}>
                      {catConfig.id}
                    </Text>
                  </View>
                  <Ionicons name="pin" size={12} color={palette.accent} />
                </View>

                {/* Title */}
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {note.title}
                </Text>

                {/* Content Body Preview */}
                <View style={styles.cardBody}>
                  {isChecklist ? (
                    <View style={styles.checklistPreview}>
                      {(note.checklist || []).slice(0, 3).map((item) => (
                        <View key={item.id} style={styles.checkItemRow}>
                          <Ionicons
                            name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                            size={12}
                            color={item.done ? palette.accent : COLORS.textMuted}
                            style={{ marginRight: 5 }}
                          />
                          <Text
                            style={[
                              styles.checkItemText,
                              item.done && styles.checkItemTextDone,
                            ]}
                            numberOfLines={1}
                          >
                            {item.text}
                          </Text>
                        </View>
                      ))}
                      {totalItems > 3 && (
                        <Text style={[styles.moreText, { color: palette.accent }]}>
                          +{totalItems - 3} more items
                        </Text>
                      )}
                      {totalItems === 0 && (
                        <Text style={styles.emptyItemsText}>Empty checklist</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.descText} numberOfLines={3}>
                      {note.description?.trim() ? note.description : 'No description'}
                    </Text>
                  )}
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                  {isChecklist && totalItems > 0 ? (
                    <View style={styles.checklistFooter}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${pct}%`,
                              backgroundColor: palette.accent,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressLabel}>
                        {completedItems} of {totalItems} completed
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.tapToOpenRow}>
                      <Text style={styles.tapToOpenText}>Tap to view/copy</Text>
                      <Ionicons name="chevron-forward" size={11} color={COLORS.textMuted} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  countBadge: {
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  addNoteBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addNoteBtnHeaderText: {
    color: COLORS.accentHover,
    fontSize: 11,
    fontWeight: '700',
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.accentHover,
  },
  filterPillText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: COLORS.accentHover,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.borderLight,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySub: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingRight: 10,
    gap: 12,
  },
  stickyCard: {
    width: 195,
    minHeight: 180,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    backgroundColor: COLORS.bgCard,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topAccentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  cardBody: {
    flex: 1,
    marginBottom: 8,
  },
  checklistPreview: {
    gap: 4,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkItemText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    flex: 1,
  },
  checkItemTextDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  moreText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyItemsText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  descText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 4,
  },
  checklistFooter: {
    gap: 4,
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  tapToOpenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tapToOpenText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
});
