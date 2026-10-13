import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RecurringBill,
  formatMoney,
  getCategoryTheme,
  hexToRgba,
} from '../../../types/finance';
import { COLORS } from '../../../constants/theme';
import { useKeyboardHeight } from '../../../hooks/useKeyboardHeight';
import {
  cardStyles,
  ACCENT,
  INK,
  BILL_CATEGORIES,
  BILL_CATEGORY_THEMES,
  PRESET_BILLS,
  getOrdinal,
} from '../../../styles/recurringBillsStyles';

interface AddRecurringBillModalProps {
  visible: boolean;
  currency: 'IDR' | 'USD';
  onClose: () => void;
  onSave: (bill: Omit<RecurringBill, 'id'>) => void;
}

export const AddRecurringBillModal = ({
  visible,
  currency,
  onClose,
  onSave,
}: AddRecurringBillModalProps) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(BILL_CATEGORIES[0]);
  const [dueDateDay, setDueDateDay] = useState('1');
  const keyboardHeight = useKeyboardHeight();

  const handleClose = () => {
    setName('');
    setAmount('');
    setSelectedCategory(BILL_CATEGORIES[0]);
    setDueDateDay('1');
    onClose();
  };

  const handleSelectPreset = (preset: typeof PRESET_BILLS[number]) => {
    setName(preset.name);
    setSelectedCategory(preset.category);
    if (currency === 'IDR' && preset.defaultAmount) {
      setAmount(preset.defaultAmount);
    } else if (currency === 'USD' && preset.defaultAmountUSD) {
      setAmount(preset.defaultAmountUSD);
    }
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
    const parsedDay = Math.max(1, Math.min(31, parseInt(dueDateDay, 10) || 1));

    if (!trimmedName || parsedAmount <= 0) return;

    onSave({
      name: trimmedName,
      amount: parsedAmount,
      category: selectedCategory,
      dueDateDay: parsedDay,
      currency,
    });

    handleClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={cardStyles.modalOverlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={cardStyles.modalDismissArea} />
        </TouchableWithoutFeedback>

        <View style={cardStyles.modalContent}>
          <View style={cardStyles.modalHandle} />

          <View style={cardStyles.modalHeaderRow}>
            <View style={cardStyles.modalTitleWrap}>
              <View style={cardStyles.modalTitleIcon}>
                <Ionicons name="add-circle-outline" size={20} color={ACCENT} />
              </View>
              <View style={cardStyles.modalTitleTextWrap}>
                <Text style={cardStyles.modalTitle} numberOfLines={1}>
                  Add Recurring Bill
                </Text>
                <Text style={cardStyles.modalSubTitle} numberOfLines={1}>
                  Track a bill or subscription
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={cardStyles.modalCloseBtn}
            >
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            contentContainerStyle={[
              cardStyles.modalScrollContent,
              { paddingBottom: Math.max(28, keyboardHeight + 28) },
            ]}
          >
            {/* Quick Templates */}
            <View style={cardStyles.presetHeaderRow}>
              <Text style={cardStyles.formSectionLabel} numberOfLines={1}>
                SUGGESTIONS / PRESETS
              </Text>
              <Text style={cardStyles.presetHint} numberOfLines={1}>
                Tap to auto-fill
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={cardStyles.presetScrollContent}
              style={cardStyles.presetScroll}
            >
              {PRESET_BILLS.map((preset) => {
                const isSelected = name === preset.name;
                return (
                  <TouchableOpacity
                    key={preset.name}
                    style={[
                      cardStyles.presetChip,
                      { borderColor: hexToRgba(preset.color, 0.28) },
                      isSelected && { backgroundColor: preset.color, borderColor: preset.color },
                    ]}
                    onPress={() => handleSelectPreset(preset)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        cardStyles.presetIconWrap,
                        { backgroundColor: hexToRgba(preset.color, 0.18) },
                        isSelected && cardStyles.presetIconWrapActive,
                      ]}
                    >
                      <Ionicons
                        name={preset.icon as any}
                        size={15}
                        color={isSelected ? INK : preset.color}
                      />
                    </View>
                    <View style={cardStyles.presetTextWrap}>
                      <Text
                        style={[
                          cardStyles.presetChipText,
                          isSelected && cardStyles.presetChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {preset.name}
                      </Text>
                      <Text
                        style={[
                          cardStyles.presetSubText,
                          isSelected && cardStyles.presetSubTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {currency === 'IDR' && preset.defaultAmount
                          ? formatMoney(parseFloat(preset.defaultAmount), 'IDR')
                          : currency === 'USD' && preset.defaultAmountUSD
                          ? formatMoney(parseFloat(preset.defaultAmountUSD), 'USD')
                          : preset.category}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Form Group: Name */}
            <View style={cardStyles.formGroup}>
              <Text style={cardStyles.inputLabel} numberOfLines={1}>
                NAME
              </Text>
              <TextInput
                style={cardStyles.inputField}
                placeholder="e.g. Netflix, Wi-Fi, Rent"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Form Group: Amount */}
            <View style={cardStyles.formGroup}>
              <Text style={cardStyles.inputLabel} numberOfLines={1}>
                AMOUNT ({currency})
              </Text>
              <TextInput
                style={cardStyles.inputField}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Form Group: Category with Icons */}
            <View style={cardStyles.formGroup}>
              <Text style={cardStyles.inputLabel} numberOfLines={1}>
                CATEGORY
              </Text>
              <View style={cardStyles.categoriesWrap}>
                {BILL_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const catTheme = BILL_CATEGORY_THEMES[cat] || {
                    icon: 'receipt-outline',
                    color: ACCENT,
                  };
                  const palette = getCategoryTheme(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        cardStyles.catChip,
                        { backgroundColor: palette.bg, borderColor: palette.border },
                        isSelected && cardStyles.catChipActive,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={catTheme.icon}
                        size={15}
                        color={isSelected ? INK : catTheme.color}
                        style={cardStyles.catChipIcon}
                      />
                      <Text
                        style={[
                          cardStyles.catChipText,
                          { color: palette.color },
                          isSelected && cardStyles.catChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Form Group: Due Day */}
            <View style={cardStyles.formGroup}>
              <View style={cardStyles.inputLabelRow}>
                <Text style={[cardStyles.inputLabel, cardStyles.inputLabelInline]} numberOfLines={1}>
                  DUE DAY OF MONTH
                </Text>
                <Text style={cardStyles.dueDayPreview} numberOfLines={1}>
                  Every {getOrdinal(Math.max(1, Math.min(31, parseInt(dueDateDay, 10) || 1)))}
                </Text>
              </View>

              {/* Quick Select Day Chips */}
              <View style={cardStyles.quickDayRow}>
                {[1, 5, 10, 15, 20, 25, 28].map((d) => {
                  const isDaySelected = parseInt(dueDateDay, 10) === d;
                  return (
                    <TouchableOpacity
                      key={`day-${d}`}
                      style={[
                        cardStyles.quickDayPill,
                        isDaySelected && cardStyles.quickDayPillActive,
                      ]}
                      onPress={() => setDueDateDay(d.toString())}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          cardStyles.quickDayPillText,
                          isDaySelected && cardStyles.quickDayPillTextActive,
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Save CTA */}
            <TouchableOpacity
              style={[
                cardStyles.saveCtaBtn,
                (!name.trim() || !amount) && { opacity: 0.6 },
              ]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={!name.trim() || !amount}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={INK} style={{ marginRight: 8 }} />
              <Text style={cardStyles.saveCtaBtnText} numberOfLines={1}>
                SAVE BILL
              </Text>
            </TouchableOpacity>

            <View style={cardStyles.saveNoteRow}>
              <Ionicons name="information-circle-outline" size={13} color={COLORS.textMuted} />
              <Text style={cardStyles.saveNoteText} numberOfLines={2}>
                Bills are tracked per month and reset automatically.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
