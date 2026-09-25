import React from 'react';
import {
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDisplayDate } from '../../constants/habits';

interface AddHabitModalProps {
  visible: boolean;
  selectedDate: Date;
  title: string;
  category: string;
  categories: string[];
  onChangeTitle: (text: string) => void;
  onChangeCategory: (cat: string) => void;
  onSave: () => void;
  onClose: () => void;
  onOpenAddCategory: () => void;
  onDeleteCategory: (cat: string) => void;
}

export default function AddHabitModal({
  visible,
  selectedDate,
  title,
  category,
  categories,
  onChangeTitle,
  onChangeCategory,
  onSave,
  onClose,
  onOpenAddCategory,
  onDeleteCategory,
}: AddHabitModalProps) {
  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={habitModalStyles.overlay}
      >
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={habitModalStyles.dismissArea} />
        </TouchableWithoutFeedback>

        <View style={habitModalStyles.content}>
          <View style={habitModalStyles.handle} />

          {/* Header */}
          <View style={habitModalStyles.headerRow}>
            <View>
              <Text style={habitModalStyles.headerTitle}>New Habit</Text>
              <Text style={habitModalStyles.headerSubtitle}>Set a consistent target for your day</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={26} color="#52525B" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Scheduled Date Indicator */}
            <View style={habitModalStyles.schedulePill}>
              <Ionicons name="calendar-outline" size={14} color="#8E97FD" style={{ marginRight: 6 }} />
              <Text style={habitModalStyles.scheduleLabel}>Target Date:</Text>
              <Text style={habitModalStyles.scheduleDate}>{formatDisplayDate(selectedDate)}</Text>
            </View>

            {/* Habit Title Input */}
            <View style={habitModalStyles.sectionCard}>
              <Text style={habitModalStyles.sectionLabel}>HABIT NAME</Text>
              <TextInput
                style={habitModalStyles.input}
                placeholder="e.g. Read 20 Pages, Meditate, Drink 2L..."
                placeholderTextColor="#52525B"
                value={title}
                onChangeText={onChangeTitle}
                autoCapitalize="words"
              />
            </View>

            {/* Categories */}
            <View style={habitModalStyles.sectionCard}>
              <View style={habitModalStyles.catHeaderRow}>
                <Text style={habitModalStyles.sectionLabel}>CATEGORY</Text>
                <Text style={habitModalStyles.catHint}>Hold tag to delete</Text>
              </View>

              <View style={habitModalStyles.categoriesWrap}>
                {categories.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        habitModalStyles.categoryChip,
                        isSelected && habitModalStyles.categoryChipActive,
                      ]}
                      onPress={() => onChangeCategory(cat)}
                      onLongPress={() => onDeleteCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          habitModalStyles.categoryChipText,
                          isSelected && habitModalStyles.categoryChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={habitModalStyles.addCategoryChip}
                  onPress={onOpenAddCategory}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={15} color="#8E97FD" />
                  <Text style={habitModalStyles.addCategoryText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={habitModalStyles.saveButton} onPress={onSave} activeOpacity={0.85}>
              <Text style={habitModalStyles.saveButtonText}>CREATE HABIT</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const habitModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#3F3F46',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerTitle: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },
  schedulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 14,
  },
  scheduleLabel: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  scheduleDate: {
    color: '#FAFAFA',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#09090B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  catHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  catHint: {
    color: '#52525B',
    fontSize: 10,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FAFAFA',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    fontWeight: '600',
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#18181B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  categoryChipActive: {
    backgroundColor: '#8E97FD',
    borderColor: '#8E97FD',
  },
  categoryChipText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#09090B',
    fontWeight: '800',
  },
  addCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 151, 253, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142, 151, 253, 0.3)',
    borderStyle: 'dashed',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addCategoryText: {
    color: '#8E97FD',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#8E97FD',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  saveButtonText: {
    color: '#09090B',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});