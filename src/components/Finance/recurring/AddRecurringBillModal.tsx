import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
  ScrollView,
  Keyboard,
  BackHandler,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import {
  RecurringBill,
  formatMoney,
  getCategoryTheme,
  hexToRgba,
} from '../../../types/finance';
import { MONTHS, SHORT_MONTHS } from '../../../constants/date';
import { COLORS } from '../../../constants/theme';
import { useKeyboardHeight } from '../../../hooks/useKeyboardHeight';
import { CalculatorKeypad } from '../CalculatorKeypad';
import {
  evaluateArithmetic,
  evaluateArithmeticStr,
  formatCalculatedDisplay,
  formatExpression,
  hasMathOperators,
  MAX_NOMINAL_VALUE,
} from '../../../utils/math';
import { hapticLight } from '../../../utils/haptics';
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
  initialDate?: Date;
  onClose: () => void;
  onSave: (bill: Omit<RecurringBill, 'id'>) => void;
}

export const AddRecurringBillModal = ({
  visible,
  currency,
  initialDate,
  onClose,
  onSave,
}: AddRecurringBillModalProps) => {
  const initDate = initialDate || new Date();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(BILL_CATEGORIES[0]);
  const [dueDateDay, setDueDateDay] = useState('1');
  const [startMonth, setStartMonth] = useState(initDate.getMonth());
  const [startYear, setStartYear] = useState(initDate.getFullYear());
  const [durationMonths, setDurationMonths] = useState<number>(0); // 0 = Ongoing
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDurationInput, setCustomDurationInput] = useState('');
  const keyboardHeight = useKeyboardHeight();

  const evaluatedAmountStr = React.useMemo(() => evaluateArithmeticStr(amount, currency), [amount, currency]);
  const isAmountMath = React.useMemo(() => hasMathOperators(amount), [amount]);
  const formattedDisplayAmount = formatCalculatedDisplay(evaluatedAmountStr, currency);

  const openAmountKeypad = () => {
    Keyboard.dismiss();
    setIsKeypadOpen(true);
  };

  const handleClose = () => {
    setIsKeypadOpen(false);
    setName('');
    setAmount('');
    setSelectedCategory(BILL_CATEGORIES[0]);
    setDueDateDay('1');
    const d = initialDate || new Date();
    setStartMonth(d.getMonth());
    setStartYear(d.getFullYear());
    setDurationMonths(0);
    setIsCustomDuration(false);
    setCustomDurationInput('');
    onClose();
  };

  const handleSelectPreset = (preset: typeof PRESET_BILLS[number]) => {
    setName(preset.name);
    setSelectedCategory(preset.category);
    if (currency === 'IDR' && preset.defaultAmount) {
      setAmount(formatExpression(preset.defaultAmount, 'IDR'));
    } else if (currency === 'USD' && preset.defaultAmountUSD) {
      setAmount(formatExpression(preset.defaultAmountUSD, 'USD'));
    }
  };

  const handleSave = () => {
    setIsKeypadOpen(false);
    const trimmedName = name.trim();
    const evaluated = evaluateArithmetic(amount, currency);
    const parsedAmount = Math.min(MAX_NOMINAL_VALUE, Math.max(0, evaluated));
    const parsedDay = Math.max(1, Math.min(31, parseInt(dueDateDay, 10) || 1));

    if (!trimmedName || parsedAmount <= 0) return;

    onSave({
      name: trimmedName,
      amount: parsedAmount,
      category: selectedCategory,
      dueDateDay: parsedDay,
      currency,
      startMonth,
      startYear,
      durationMonths: durationMonths > 0 ? durationMonths : undefined,
    });

    handleClose();
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    if (isKeypadOpen) {
      setIsKeypadOpen(false);
      return;
    }
    handleClose();
  };

  const handleRequestClose = () => {
    Keyboard.dismiss();
    if (isKeypadOpen) {
      setIsKeypadOpen(false);
      return;
    }
    handleClose();
  };

  // Intercept smartphone back button or edge back swipe gesture:
  // Dismiss calculator keypad first before closing the modal
  React.useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      if (isKeypadOpen) {
        setIsKeypadOpen(false);
        return true; // Event consumed, prevents closing the modal
      }
      return false; // Allow standard modal close
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [visible, isKeypadOpen]);

  // Swipe-down gesture detector on keypad area to smoothly dismiss it
  const keypadPanResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy > 15 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 30 || gestureState.vy > 0.4) {
            setIsKeypadOpen(false);
          }
        },
      }),
    []
  );

  // Preview range calculations
  const endTotalMonths = startYear * 12 + startMonth + (durationMonths > 0 ? durationMonths - 1 : 0);
  const endMonth = ((endTotalMonths % 12) + 12) % 12;
  const endYear = Math.floor(endTotalMonths / 12);

  const stopTotalMonths = endTotalMonths + 1;
  const stopMonth = ((stopTotalMonths % 12) + 12) % 12;
  const stopYear = Math.floor(stopTotalMonths / 12);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleRequestClose}
      statusBarTranslucent={true}
    >
      <View style={cardStyles.modalOverlay}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
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
              onPress={handleDismiss}
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
            onScrollBeginDrag={() => setIsKeypadOpen(false)}
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
                onFocus={() => setIsKeypadOpen(false)}
              />
            </View>

            {/* Form Group: Amount */}
            <View style={cardStyles.formGroup}>
              <Text style={cardStyles.inputLabel} numberOfLines={1}>
                AMOUNT ({currency})
              </Text>
              <TouchableOpacity
                style={[
                  cardStyles.amountCard,
                  isKeypadOpen && cardStyles.amountCardActive,
                ]}
                onPress={openAmountKeypad}
                activeOpacity={0.85}
              >
                <View style={cardStyles.amountCardRow}>
                  <Text style={cardStyles.amountCardPrefix}>
                    {currency === 'USD' ? '$' : 'Rp'}
                  </Text>
                  <TextInput
                    style={[
                      cardStyles.amountCardInput,
                      { fontSize: amount.length > 20 ? 17 : amount.length > 14 ? 20 : 22 },
                    ]}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    showSoftInputOnFocus={false}
                    value={amount}
                    onFocus={openAmountKeypad}
                    onPressIn={openAmountKeypad}
                    editable={true}
                  />
                  {amount !== '' && (
                    <TouchableOpacity
                      style={cardStyles.clearInputBtn}
                      onPress={() => {
                        hapticLight();
                        setAmount('');
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Sub-amount / Math Calculation Line */}
                <View style={cardStyles.amountPreviewContainer}>
                  {isAmountMath ? (
                    <Text style={cardStyles.amountPreviewText} numberOfLines={1}>
                      = {currency === 'USD' ? '$' : 'Rp'} {formattedDisplayAmount}
                    </Text>
                  ) : amount ? (
                    <Text style={cardStyles.amountPreviewTextMuted} numberOfLines={1}>
                      {currency === 'USD' ? '$' : 'Rp'} {formattedDisplayAmount}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
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

            {/* Form Group: Start Period (Month & Year) */}
            <View style={cardStyles.formGroup}>
              <View style={cardStyles.inputLabelRow}>
                <Text style={[cardStyles.inputLabel, cardStyles.inputLabelInline]} numberOfLines={1}>
                  START PERIOD (MONTH & YEAR)
                </Text>
                <Text style={cardStyles.dueDayPreview} numberOfLines={1}>
                  Starts {SHORT_MONTHS[startMonth]} {startYear}
                </Text>
              </View>

              <View style={cardStyles.periodPickerCard}>
                <TouchableOpacity
                  style={cardStyles.periodNavBtn}
                  onPress={() => {
                    if (startMonth === 0) {
                      setStartMonth(11);
                      setStartYear((y) => y - 1);
                    } else {
                      setStartMonth((m) => m - 1);
                    }
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>

                <View style={cardStyles.periodCenterCol}>
                  <Text style={cardStyles.periodMonthText}>
                    {MONTHS[startMonth]} {startYear}
                  </Text>
                  <Text style={cardStyles.periodSubText}>
                    First month bill will appear
                  </Text>
                </View>

                <TouchableOpacity
                  style={cardStyles.periodNavBtn}
                  onPress={() => {
                    if (startMonth === 11) {
                      setStartMonth(0);
                      setStartYear((y) => y + 1);
                    } else {
                      setStartMonth((m) => m + 1);
                    }
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Group: Duration / Active Months */}
            <View style={cardStyles.formGroup}>
              <View style={cardStyles.inputLabelRow}>
                <Text style={[cardStyles.inputLabel, cardStyles.inputLabelInline]} numberOfLines={1}>
                  SUBSCRIPTION DURATION
                </Text>
                <Text style={cardStyles.dueDayPreview} numberOfLines={1}>
                  {durationMonths === 0 ? 'Ongoing' : `${durationMonths} Month${durationMonths > 1 ? 's' : ''}`}
                </Text>
              </View>

              {/* Duration Pills */}
              <View style={cardStyles.durationPillsWrap}>
                {[
                  { label: 'Ongoing', val: 0 },
                  { label: '1 Mo', val: 1 },
                  { label: '2 Mos', val: 2 },
                  { label: '3 Mos', val: 3 },
                  { label: '6 Mos', val: 6 },
                  { label: '12 Mos', val: 12 },
                ].map((item) => {
                  const isSelected = !isCustomDuration && durationMonths === item.val;
                  return (
                    <TouchableOpacity
                      key={`dur-${item.val}`}
                      style={[
                        cardStyles.durationPill,
                        isSelected && cardStyles.durationPillActive,
                      ]}
                      onPress={() => {
                        setIsCustomDuration(false);
                        setDurationMonths(item.val);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          cardStyles.durationPillText,
                          isSelected && cardStyles.durationPillTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Custom Option */}
                <TouchableOpacity
                  style={[
                    cardStyles.durationPill,
                    isCustomDuration && cardStyles.durationPillActive,
                  ]}
                  onPress={() => {
                    setIsCustomDuration(true);
                    const parsed = parseInt(customDurationInput, 10);
                    if (parsed > 0) setDurationMonths(parsed);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      cardStyles.durationPillText,
                      isCustomDuration && cardStyles.durationPillTextActive,
                    ]}
                  >
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>

              {/* If custom is selected, show numeric input */}
              {isCustomDuration && (
                <View style={cardStyles.customDurationRow}>
                  <Text style={cardStyles.customDurationLabel}>Number of months:</Text>
                  <TextInput
                    style={cardStyles.customDurationInput}
                    placeholder="e.g. 4"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={customDurationInput}
                    onFocus={() => setIsKeypadOpen(false)}
                    onChangeText={(text) => {
                      const clean = text.replace(/[^0-9]/g, '');
                      setCustomDurationInput(clean);
                      const parsed = parseInt(clean, 10);
                      setDurationMonths(parsed > 0 ? parsed : 0);
                    }}
                  />
                </View>
              )}

              {/* Duration Live Explanation Banner */}
              <View style={cardStyles.durationPreviewBox}>
                <Ionicons
                  name={durationMonths === 0 ? 'infinite-outline' : 'calendar-outline'}
                  size={15}
                  color={ACCENT}
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text style={cardStyles.durationPreviewText}>
                  {durationMonths === 0
                    ? `Repeats monthly starting ${SHORT_MONTHS[startMonth]} ${startYear} until stopped.`
                    : `Active for ${durationMonths} month${durationMonths > 1 ? 's' : ''}: ${SHORT_MONTHS[startMonth]} ${startYear}${
                        durationMonths > 1 ? ` – ${SHORT_MONTHS[endMonth]} ${endYear}` : ''
                      }.\nWill automatically stop appearing in ${SHORT_MONTHS[stopMonth]} ${stopYear}.`}
                </Text>
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

          {/* Custom In-App Calculator Keypad (Docked at Bottom) */}
          {isKeypadOpen && (
            <Animated.View
              entering={SlideInDown.duration(220)}
              exiting={SlideOutDown.duration(180)}
              style={cardStyles.keypadWrapper}
              {...keypadPanResponder.panHandlers}
            >
              <CalculatorKeypad
                value={amount}
                onChangeValue={setAmount}
                onDone={() => setIsKeypadOpen(false)}
                accentColor={ACCENT}
                currency={currency}
              />
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
};
