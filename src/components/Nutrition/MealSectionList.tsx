import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MealType, NutritionLog, MEAL_TYPE_CONFIG } from '../../types/nutrition';
import { COLORS, RADIUS } from '../../constants/theme';

interface MealSectionListProps {
  logs: NutritionLog[];
  onOpenAddForMeal: (mealType: MealType) => void;
  onDeleteLog: (id: string) => void;
  onEditLog?: (item: NutritionLog) => void;
  onCopyYesterdayMeal?: (mealType: MealType) => void;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MealSectionList = ({
  logs,
  onOpenAddForMeal,
  onDeleteLog,
  onEditLog,
  onCopyYesterdayMeal,
}: MealSectionListProps) => {
  const getCleanPortionText = (item: NutritionLog) => {
    const desc = item.servingDescription?.trim() || '';
    if (
      !desc ||
      desc.toLowerCase().includes('portion') ||
      desc.toLowerCase().includes('porsi') ||
      desc.includes(`${item.portionGrams}g`)
    ) {
      return `Portion: ${item.portionGrams}g`;
    }
    return `${desc} (${item.portionGrams}g)`;
  };

  return (
    <View style={{ marginBottom: 20 }}>
      {MEAL_TYPES.map((type) => {
        const config = MEAL_TYPE_CONFIG[type];
        const mealLogs = logs.filter((l) => l.mealType === type);
        const mealTotalCals = mealLogs.reduce((sum, l) => sum + l.calories, 0);

        return (
          <View key={type} style={mealStyles.card}>
            {/* Meal Header */}
            <View style={mealStyles.headerRow}>
              <View style={mealStyles.titleGroup}>
                <View style={mealStyles.iconWrap}>
                  <Ionicons name={config.icon as any} size={18} color={COLORS.nutrition} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={mealStyles.mealLabel}>{config.label}</Text>
                  <Text style={mealStyles.caloriesSub}>{mealTotalCals.toLocaleString('en-US')} kcal total</Text>
                </View>
              </View>

              {onCopyYesterdayMeal && (
                <TouchableOpacity
                  style={mealStyles.copyBtn}
                  onPress={() => onCopyYesterdayMeal(type)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="copy-outline" size={13} color={COLORS.textSecondary} />
                  <Text style={mealStyles.copyBtnText}>Copy Yesterday</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* List of items logged for this meal */}
            {mealLogs.length > 0 && (
              <View style={mealStyles.logsList}>
                {mealLogs.map((item) => {
                  const protein = Math.round(item.protein);
                  const carbs = Math.round(item.carbs);
                  const fat = Math.round(item.fat);

                  return (
                    <View key={item.id} style={mealStyles.logItemCard}>
                      {/* Top Row: Food Name + Calories & Actions */}
                      <View style={mealStyles.logItemHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={mealStyles.foodNameText}>
                            {item.foodName}
                          </Text>
                          <Text style={mealStyles.portionSubText}>
                            {getCleanPortionText(item)}
                          </Text>
                        </View>

                        <View style={mealStyles.logRightGroup}>
                          <Text style={mealStyles.caloriesValText}>
                            {item.calories} <Text style={mealStyles.kcalUnit}>kcal</Text>
                          </Text>

                          <View style={mealStyles.actionIconsGroup}>
                            {onEditLog && (
                              <TouchableOpacity
                                style={mealStyles.iconBtn}
                                onPress={() => onEditLog(item)}
                                activeOpacity={0.7}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons name="create-outline" size={14} color={COLORS.textSecondary} />
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={[mealStyles.iconBtn, mealStyles.deleteIconBtn]}
                              onPress={() => onDeleteLog(item.id)}
                              activeOpacity={0.7}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      {/* Bottom Row: Clear Macro Badges (Protein, Carbs, Fat) */}
                      <View style={mealStyles.macroBadgesRow}>
                        <View style={[mealStyles.macroPill, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
                          <Text style={[mealStyles.macroPillLabel, { color: COLORS.protein }]}>Protein:</Text>
                          <Text style={[mealStyles.macroPillValue, { color: COLORS.protein }]}>{protein}g</Text>
                        </View>

                        <View style={[mealStyles.macroPill, { backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.25)' }]}>
                          <Text style={[mealStyles.macroPillLabel, { color: COLORS.carbs }]}>Carbs:</Text>
                          <Text style={[mealStyles.macroPillValue, { color: COLORS.carbs }]}>{carbs}g</Text>
                        </View>

                        <View style={[mealStyles.macroPill, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.25)' }]}>
                          <Text style={[mealStyles.macroPillLabel, { color: COLORS.fat }]}>Fat:</Text>
                          <Text style={[mealStyles.macroPillValue, { color: COLORS.fat }]}>{fat}g</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Bottom Add button under category card */}
            <TouchableOpacity
              style={mealStyles.bottomAddBtn}
              onPress={() => onOpenAddForMeal(type)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={15} color={COLORS.nutrition} />
              <Text style={mealStyles.bottomAddBtnText}>
                Add {config.label}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const mealStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  mealLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  caloriesSub: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.nutrition,
    marginTop: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  copyBtnText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  logsList: {
    gap: 10,
    marginBottom: 12,
  },
  logItemCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  foodNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 19,
    marginBottom: 2,
  },
  portionSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  logRightGroup: {
    alignItems: 'flex-end',
  },
  caloriesValText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.nutrition,
    marginBottom: 4,
  },
  kcalUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  actionIconsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteIconBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  macroBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    gap: 3,
  },
  macroPillLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  macroPillValue: {
    fontSize: 10,
    fontWeight: '800',
  },
  bottomAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    gap: 6,
  },
  bottomAddBtnText: {
    color: COLORS.nutrition,
    fontSize: 12,
    fontWeight: '700',
  },
});
