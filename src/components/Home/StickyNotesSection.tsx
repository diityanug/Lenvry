import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import { StickyNote, NoteCategory, NOTE_CATEGORIES } from '../../types/notes';

interface StickyNotesSectionProps {
  notes: StickyNote[];
  onSelectNote: (note: StickyNote) => void;
  onCreateNote: () => void;
}

// Vivid "paper" treatment for the home note cards.
// On a dark canvas, saturated note cards pop far more than dark ones.
const NOTE_PAPER: Record<string, { paper: string; deep: string; ink: string }> = {
  amber: { paper: '#FBBF24', deep: '#B45309', ink: '#3A2400' },
  blue: { paper: '#5EB6F7', deep: '#1D4ED8', ink: '#06203D' },
  emerald: { paper: '#3FD79B', deep: '#047857', ink: '#00301C' },
  rose: { paper: '#FB7F97', deep: '#BE123C', ink: '#42060F' },
  purple: { paper: '#C08CFA', deep: '#7E22CE', ink: '#26064A' },
};

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

            const count = isAll
              ? notes.length
              : notes.filter((n) => (n.category || 'General') === catKey).length;

            if (count === 0 && !isAll && !isSelected) return null;

            const pillColor = catConfig ? catConfig.color : COLORS.accentHover;

            return (
              <TouchableOpacity
                key={catKey}
                style={[
                  styles.filterPill,
                  isSelected
                    ? { backgroundColor: pillColor, borderColor: pillColor }
                    : { backgroundColor: pillColor + '1A', borderColor: pillColor + '38' },
                ]}
                onPress={() => setActiveCategory(catKey)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={(catConfig ? catConfig.icon : 'grid-outline') as any}
                  size={13}
                  color={isSelected ? '#0B0B0F' : pillColor}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#0B0B0F' : COLORS.textSecondary },
                    isSelected && styles.filterPillTextActive,
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
        <TouchableOpacity style={styles.emptyCard} onPress={onCreateNote} activeOpacity={0.75}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="pencil" size={20} color="#FBBF24" />
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
            const paper = NOTE_PAPER[colorKey] || NOTE_PAPER.amber;
            const isChecklist = note.type === 'checklist';
            const catConfig = NOTE_CATEGORIES[note.category || 'General'] || NOTE_CATEGORIES.General;
            const totalItems = note.checklist?.length || 0;
            const completedItems = note.checklist?.filter((item) => item.done).length || 0;
            const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            return (
              <TouchableOpacity
                key={note.id}
                style={[styles.stickyCard, { backgroundColor: paper.paper }]}
                onPress={() => onSelectNote(note)}
                activeOpacity={0.85}
              >
                {/* Card Header: Category badge & Pin */}
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: 'rgba(0, 0, 0, 0.13)' }]}>
                    <Ionicons name={catConfig.icon as any} size={11} color={paper.ink} />
                    <Text style={[styles.categoryBadgeText, { color: paper.ink }]}>
                      {catConfig.id}
                    </Text>
                  </View>
                  <Ionicons name="pin" size={13} color={paper.ink} style={{ opacity: 0.65 }} />
                </View>

                {/* Title */}
                <Text style={[styles.cardTitle, { color: paper.ink }]} numberOfLines={1}>
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
                            size={13}
                            color={paper.ink}
                            style={{ marginRight: 6, opacity: item.done ? 1 : 0.5 }}
                          />
                          <Text
                            style={[
                              styles.checkItemText,
                              { color: paper.ink, opacity: item.done ? 0.5 : 0.9 },
                              item.done && styles.checkItemTextDone,
                            ]}
                            numberOfLines={1}
                          >
                            {item.text}
                          </Text>
                        </View>
                      ))}
                      {totalItems > 3 && (
                        <Text style={[styles.moreText, { color: paper.ink }]}>
                          +{totalItems - 3} more items
                        </Text>
                      )}
                      {totalItems === 0 && (
                        <Text style={[styles.emptyItemsText, { color: paper.ink }]}>
                          Empty checklist
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text
                      style={[styles.descText, { color: paper.ink, opacity: 0.9 }]}
                      numberOfLines={3}
                    >
                      {note.description?.trim() ? note.description : 'No description'}
                    </Text>
                  )}
                </View>

                {/* Footer */}
                <View style={[styles.cardFooter, { borderTopColor: 'rgba(0, 0, 0, 0.14)' }]}>
                  {isChecklist && totalItems > 0 ? (
                    <View style={styles.checklistFooter}>
                      <View style={[styles.progressTrack, { backgroundColor: 'rgba(0, 0, 0, 0.16)' }]}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${pct}%`, backgroundColor: paper.deep },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressLabel, { color: paper.ink }]}>
                        {completedItems} of {totalItems} completed
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.tapToOpenRow}>
                      <Text style={[styles.tapToOpenText, { color: paper.ink }]}>
                        Tap to view / copy
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={12}
                        color={paper.ink}
                        style={{ opacity: 0.65 }}
                      />
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
    marginBottom: 34,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  countBadge: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  countBadgeText: {
    color: COLORS.accentHover,
    fontSize: 10,
    fontWeight: '800',
  },
  addNoteBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  addNoteBtnHeaderText: {
    color: COLORS.accentHover,
    fontSize: 11.5,
    fontWeight: '700',
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  filterPillTextActive: {
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 5,
    textAlign: 'center',
  },
  emptySub: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingRight: 10,
    gap: 14,
  },
  stickyCard: {
    width: 202,
    minHeight: 200,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  cardBody: {
    flex: 1,
    marginBottom: 12,
  },
  checklistPreview: {
    gap: 6,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkItemText: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  checkItemTextDone: {
    textDecorationLine: 'line-through',
  },
  moreText: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    opacity: 0.85,
  },
  emptyItemsText: {
    fontSize: 11.5,
    fontStyle: 'italic',
    opacity: 0.65,
  },
  descText: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 10,
  },
  checklistFooter: {
    gap: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    opacity: 0.75,
  },
  tapToOpenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tapToOpenText: {
    fontSize: 10.5,
    fontWeight: '700',
    opacity: 0.7,
  },
});
