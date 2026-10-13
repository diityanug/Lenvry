import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { NOTE_CATEGORIES, NoteCategory, StickyNote } from '../../types/notes';

interface StickyNotesSectionProps {
  notes: StickyNote[];
  onSelectNote: (note: StickyNote) => void;
  onCreateNote: () => void;
}

const CATEGORY_THEMES: Record<
  NoteCategory,
  {
    bg: string;
    ink: string;
    icon: string;
    tileBg: string;
    iconColor: string;
    label: string;
  }
> = {
  Personal: {
    bg: '#FDA4AF',
    ink: '#4C0519',
    icon: 'shield-checkmark',
    tileBg: 'rgba(255, 255, 255, 0.32)',
    iconColor: '#BE123C',
    label: 'Personal',
  },
  Finance: {
    bg: '#6EE7B7',
    ink: '#022C22',
    icon: 'wallet',
    tileBg: 'rgba(255, 255, 255, 0.32)',
    iconColor: '#047857',
    label: 'Finance',
  },
  Work: {
    bg: '#7DD3FC',
    ink: '#082F49',
    icon: 'briefcase',
    tileBg: 'rgba(255, 255, 255, 0.32)',
    iconColor: '#0369A1',
    label: 'Work',
  },
  Ideas: {
    bg: '#D8B4FE',
    ink: '#3B0764',
    icon: 'bulb',
    tileBg: 'rgba(255, 255, 255, 0.32)',
    iconColor: '#7E22CE',
    label: 'Ideas',
  },
  Lists: {
    bg: '#FDBA74',
    ink: '#431407',
    icon: 'checkbox',
    tileBg: 'rgba(255, 255, 255, 0.32)',
    iconColor: '#C2410C',
    label: 'Lists',
  },
  General: {
    bg: '#FDE047',
    ink: '#422006',
    icon: 'document-text',
    tileBg: 'rgba(255, 255, 255, 0.32)',
    iconColor: '#B45309',
    label: 'General',
  },
};

const COLOR_OVERRIDES: Record<string, { bg: string; ink: string; tileBg: string; iconColor: string }> = {
  amber: { bg: '#FDE047', ink: '#422006', tileBg: 'rgba(255, 255, 255, 0.32)', iconColor: '#B45309' },
  blue: { bg: '#7DD3FC', ink: '#082F49', tileBg: 'rgba(255, 255, 255, 0.32)', iconColor: '#0369A1' },
  emerald: { bg: '#6EE7B7', ink: '#022C22', tileBg: 'rgba(255, 255, 255, 0.32)', iconColor: '#047857' },
  rose: { bg: '#FDA4AF', ink: '#4C0519', tileBg: 'rgba(255, 255, 255, 0.32)', iconColor: '#BE123C' },
  purple: { bg: '#D8B4FE', ink: '#3B0764', tileBg: 'rgba(255, 255, 255, 0.32)', iconColor: '#7E22CE' },
};

function getNoteCardTheme(category?: NoteCategory, colorKey?: string) {
  const cat = (category || 'General') as NoteCategory;
  const base = CATEGORY_THEMES[cat] || CATEGORY_THEMES.General;
  if (colorKey && COLOR_OVERRIDES[colorKey] && (!category || category === 'General')) {
    const override = COLOR_OVERRIDES[colorKey];
    return {
      ...base,
      bg: override.bg,
      ink: override.ink,
      tileBg: override.tileBg,
      iconColor: override.iconColor,
    };
  }
  return base;
}

export default function StickyNotesSection({
  notes,
  onSelectNote,
  onCreateNote,
}: StickyNotesSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categoriesList = ['All', 'Personal', 'Finance', 'General', 'Work', 'Ideas', 'Lists'];

  // Personal and Finance notes are sensitive / private: they only appear under their own category tabs
  const filteredNotes =
    activeCategory === 'All'
      ? notes.filter((n) => n.category !== 'Personal' && n.category !== 'Finance')
      : notes.filter((n) => (n.category || 'General') === activeCategory);

  const allNotesCount = notes.filter((n) => n.category !== 'Personal' && n.category !== 'Finance').length;

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
              ? allNotesCount
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
                  {catKey === 'Personal' ? 'Personal' : catKey === 'Finance' ? 'Finance' : catKey} ({count})
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
            const theme = getNoteCardTheme(note.category, note.color);
            const isChecklist = note.type === 'checklist';
            const totalItems = note.checklist?.length || 0;
            const completedItems = note.checklist?.filter((item) => item.done).length || 0;
            const isSensitive = note.category === 'Personal';
            const hasEntries = Array.isArray(note.entries) && note.entries.length > 0;

            return (
              <TouchableOpacity
                key={note.id}
                style={[styles.stickyCard, { backgroundColor: theme.bg }]}
                onPress={() => onSelectNote(note)}
                activeOpacity={0.88}
              >
                {/* Background Watermark Tile: Category signature icon */}
                <View style={[styles.watermarkTile, { backgroundColor: theme.tileBg }]}>
                  <Ionicons
                    name={theme.icon as any}
                    size={48}
                    color={theme.iconColor}
                    style={styles.watermarkIcon}
                  />
                </View>

                {/* Top Header Row: Category Eyebrow & Circular Arrow Button */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.eyebrowBadge}>
                    <Text style={[styles.eyebrowText, { color: theme.ink }]}>
                      {theme.label}
                    </Text>
                  </View>
                  <View style={styles.arrowCircleBtn}>
                    <Ionicons
                      name="arrow-up"
                      size={14}
                      color={theme.ink}
                      style={{ transform: [{ rotate: '45deg' }] }}
                    />
                  </View>
                </View>

                {/* Foreground Title (clean & prominent in front) */}
                <View style={styles.titleContainer}>
                  <Text style={[styles.cardTitle, { color: theme.ink }]} numberOfLines={3}>
                    {note.title}
                  </Text>
                </View>

                {/* Bottom Row: Metadata Pills */}
                <View style={styles.bottomMetaRow}>
                  <View style={[styles.metaPill, { backgroundColor: 'rgba(255, 255, 255, 0.45)' }]}>
                    <Ionicons
                      name={(isChecklist ? 'checkbox-outline' : hasEntries ? 'albums-outline' : 'document-text-outline') as any}
                      size={11}
                      color={theme.ink}
                      style={{ opacity: 0.8 }}
                    />
                    <Text style={[styles.metaPillText, { color: theme.ink }]}>
                      {isChecklist
                        ? `${completedItems}/${totalItems} Done`
                        : hasEntries
                        ? `${note.entries?.length} Entries`
                        : 'Note'}
                    </Text>
                  </View>
                  {isSensitive && (
                    <View style={[styles.metaPill, { backgroundColor: 'rgba(255, 255, 255, 0.45)' }]}>
                      <Ionicons name="lock-closed" size={10} color={theme.ink} style={{ opacity: 0.8 }} />
                      <Text style={[styles.metaPillText, { color: theme.ink }]}>Private</Text>
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
    width: 215,
    height: 195,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  watermarkTile: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 90,
    height: 90,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  watermarkIcon: {
    opacity: 0.85,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  eyebrowBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  arrowCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
    zIndex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 24,
    maxWidth: '82%',
  },
  bottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 1,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
