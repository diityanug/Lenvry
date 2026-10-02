import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import { StickyNote, STICKY_COLORS } from '../../types/notes';

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
      </View>

      {/* Content */}
      {notes.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyCard}
          onPress={onCreateNote}
          activeOpacity={0.75}
        >
          <View style={styles.emptyIconWrap}>
            <Ionicons name="pencil" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.emptyTitle}>No pinned notes yet</Text>
          <Text style={styles.emptySub}>
            Tap here to write shopping lists, casual ideas, or undated plans.
          </Text>
        </TouchableOpacity>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {notes.map((note) => {
            const colorKey = note.color || 'amber';
            const palette = STICKY_COLORS[colorKey] || STICKY_COLORS.amber;
            const isChecklist = note.type === 'checklist';
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

                {/* Card Header: Title on left, Pin on right */}
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {note.title}
                  </Text>
                  <Ionicons name="pin" size={13} color={palette.accent} />
                </View>

                {/* Content Body Preview */}
                <View style={styles.cardBody}>
                  {isChecklist ? (
                    <View style={styles.checklistPreview}>
                      {(note.checklist || []).slice(0, 3).map((item) => (
                        <View key={item.id} style={styles.checkItemRow}>
                          <Ionicons
                            name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                            size={13}
                            color={item.done ? palette.accent : COLORS.textMuted}
                            style={{ marginRight: 6 }}
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
                    <Text style={styles.descText} numberOfLines={4}>
                      {note.description?.trim() ? note.description : 'No description'}
                    </Text>
                  )}
                </View>

                {/* Footer (No % symbol) */}
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
                      <Text style={styles.tapToOpenText}>Tap to open</Text>
                      <Ionicons name="chevron-forward" size={11} color={COLORS.textMuted} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Quick Add Sticky Button at end of scroll */}
          <TouchableOpacity
            style={styles.addMoreCard}
            onPress={onCreateNote}
            activeOpacity={0.7}
          >
            <View style={styles.addMoreIconWrap}>
              <Ionicons name="add" size={22} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.addMoreText}>Add Note</Text>
          </TouchableOpacity>
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
    marginBottom: 10,
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
    minHeight: 175,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    backgroundColor: COLORS.bgCard,
    padding: 13,
    paddingTop: 11,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  topAccentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  checklistPreview: {
    gap: 6,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkItemText: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
  },
  checkItemTextDone: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  moreText: {
    fontSize: 10.5,
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
    fontSize: 12.5,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  checklistFooter: {
    gap: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    fontWeight: '600',
  },
  tapToOpenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tapToOpenText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  addMoreCard: {
    width: 110,
    minHeight: 175,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.borderLight,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  addMoreIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addMoreText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
});
