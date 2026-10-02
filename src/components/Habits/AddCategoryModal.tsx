import React, { useState } from 'react';
import {
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import { AVAILABLE_HABIT_ICONS, HabitCategoryIconItem } from '../../constants/habits';

interface AddCategoryModalProps {
  visible: boolean;
  onSave: (categoryName: string, iconConfig?: HabitCategoryIconItem) => void;
  onClose: () => void;
}

export default function AddCategoryModal({
  visible,
  onSave,
  onClose,
}: AddCategoryModalProps) {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      {visible ? <AddCategoryContent onSave={onSave} onClose={onClose} /> : null}
    </Modal>
  );
}

function AddCategoryContent({
  onSave,
  onClose,
}: {
  onSave: (categoryName: string, iconConfig?: HabitCategoryIconItem) => void;
  onClose: () => void;
}) {
  const [localText, setLocalText] = useState('');
  const [selectedIconItem, setSelectedIconItem] = useState<HabitCategoryIconItem>(AVAILABLE_HABIT_ICONS[0]);
  const [error, setError] = useState('');

  const handleDismissOverlay = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = () => {
    const trimmed = localText.trim();
    if (!trimmed) {
      setError('Please enter a category name.');
      return;
    }
    Keyboard.dismiss();
    onSave(trimmed, selectedIconItem);
  };

  // Group icons into clean rows of 4 for consistent spacing & column alignment
  const ICONS_PER_ROW = 4;
  const iconRows: HabitCategoryIconItem[][] = [];
  for (let i = 0; i < AVAILABLE_HABIT_ICONS.length; i += ICONS_PER_ROW) {
    iconRows.push(AVAILABLE_HABIT_ICONS.slice(i, i + ICONS_PER_ROW));
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={handleDismissOverlay}>
        <View style={modalStyles.overlayCenter}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={modalStyles.card}>
              {/* Category Icon & Title Header */}
              <View style={[modalStyles.iconWrap, { backgroundColor: selectedIconItem.bg, borderColor: selectedIconItem.color }]}>
                <Ionicons name={selectedIconItem.icon as any} size={28} color={selectedIconItem.color} />
              </View>

              <Text style={modalStyles.titleCenter}>New Category</Text>
              <Text style={modalStyles.subtitleCenter}>
                Pick an icon and give your category a distinctive name.
              </Text>

              {/* Category Name Input */}
              <Text style={modalStyles.inputLabel}>CATEGORY NAME</Text>
              <TextInput
                style={[
                  modalStyles.inputField,
                  Boolean(error) && { borderColor: COLORS.danger },
                ]}
                placeholder="e.g. Prayer, Wellness, Reading..."
                placeholderTextColor={COLORS.textMuted}
                value={localText}
                onChangeText={(t) => {
                  setLocalText(t);
                  if (error) setError('');
                }}
                autoFocus={true}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />

              {error ? (
                <View style={modalStyles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                  <Text style={modalStyles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Icon Selector Section */}
              <View style={modalStyles.sectionHeaderRow}>
                <Text style={modalStyles.inputLabel}>SELECT ICON</Text>
                <Text style={modalStyles.countBadgeText}>{AVAILABLE_HABIT_ICONS.length} ICONS</Text>
              </View>

              <View style={modalStyles.iconScrollContainer}>
                <ScrollView
                  style={modalStyles.iconScrollView}
                  contentContainerStyle={modalStyles.iconScrollContent}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {iconRows.map((row, rowIdx) => (
                    <View key={`row-${rowIdx}`} style={modalStyles.iconRow}>
                      {row.map((item) => {
                        const isSelected = selectedIconItem.icon === item.icon;
                        return (
                          <TouchableOpacity
                            key={item.icon}
                            style={[
                              modalStyles.iconPickBtn,
                              {
                                backgroundColor: isSelected ? item.color : item.bg,
                                borderColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)',
                              },
                            ]}
                            onPress={() => setSelectedIconItem(item)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={item.icon as any}
                              size={22}
                              color={isSelected ? '#08090C' : item.color}
                            />
                            <Text
                              style={[
                                modalStyles.iconLabelText,
                                { color: isSelected ? '#08090C' : COLORS.textMuted },
                              ]}
                              numberOfLines={1}
                            >
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      {/* Empty placeholders to preserve grid alignment if last row has fewer items */}
                      {Array.from({ length: ICONS_PER_ROW - row.length }).map((_, idx) => (
                        <View key={`empty-${idx}`} style={{ flex: 1, marginHorizontal: 4 }} />
                      ))}
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Bottom Actions */}
              <View style={modalStyles.actionRow}>
                <TouchableOpacity
                  style={modalStyles.btnCancel}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={modalStyles.btnCancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={modalStyles.btnConfirm}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <Text style={modalStyles.btnConfirmText}>SAVE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const modalStyles = StyleSheet.create({
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 22,
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  titleCenter: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitleCenter: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputField: {
    backgroundColor: COLORS.bgCardSub,
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    fontWeight: '600',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  iconScrollContainer: {
    height: 250,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 18,
  },
  iconScrollView: {
    flex: 1,
  },
  iconScrollContent: {
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 28, // generous space at bottom so icons don't hit the border line!
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  iconPickBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    minHeight: 52,
  },
  iconLabelText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: COLORS.bgCardSub,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnCancelText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  btnConfirm: {
    flex: 1,
    backgroundColor: COLORS.success,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  btnConfirmText: {
    color: '#08090C',
    fontSize: 13,
    fontWeight: '800',
  },
});