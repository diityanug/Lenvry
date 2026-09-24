import React from 'react';
import { 
  Text, View, Modal, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, Keyboard, ScrollView, TouchableWithoutFeedback 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDisplayDate } from '../../constants/habits';
import { habitStyles as styles } from '../../styles/habitStyles';

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
  onDeleteCategory
}: AddHabitModalProps) {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlayDismissArea} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>New Habit</Text>
              <Text style={styles.modalSubtitle}>Scheduled for: {formatDisplayDate(selectedDate)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={26} color="#52525B" />
            </TouchableOpacity>
          </View>
          
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>HABIT TITLE</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Read 20 Pages, Meditate..." 
              placeholderTextColor="#52525B" 
              value={title} 
              onChangeText={onChangeTitle} 
              autoCapitalize="words" 
            />

            <View style={styles.categoryHeader}>
              <Text style={styles.inputLabel}>CATEGORY (Hold to delete)</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingRight: 48 }}>
              {categories.map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.chipModal, category === cat && styles.chipModalActive]}
                  onPress={() => onChangeCategory(cat)}
                  onLongPress={() => onDeleteCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipModalText, category === cat && styles.chipModalTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.chipAdd} onPress={onOpenAddCategory} activeOpacity={0.7}>
                <Text style={styles.chipAddText}>+ New</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={onSave} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>SAVE HABIT</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}