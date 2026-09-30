export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type FoodCategory =
  | 'Staples'
  | 'Proteins'
  | 'Vegetables'
  | 'Fruits'
  | 'Dairy & Drinks'
  | 'Snacks'
  | 'Custom';

export interface FoodItem {
  id: string;
  name: string;
  indonesianName?: string;
  category: FoodCategory;
  calories: number; // per 100g
  protein: number;  // grams per 100g
  carbs: number;    // grams per 100g
  fat: number;      // grams per 100g
  fiber?: number;   // grams per 100g
  defaultServingText: string;
  defaultServingGrams: number;
  isCustom?: boolean;
}

export interface NutritionLog {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  foodId?: string;
  foodName: string;
  portionGrams: number;
  servingDescription: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
}

export interface NutritionTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WaterLog {
  date: string; // YYYY-MM-DD
  amountMl: number;
  targetMl: number;
}

export const DEFAULT_NUTRITION_TARGET: NutritionTarget = {
  calories: 2000,
  protein: 130,
  carbs: 220,
  fat: 60,
};

export const MEAL_TYPE_CONFIG: Record<
  MealType,
  { label: string; subLabel: string; icon: string; defaultTargetPercent: number }
> = {
  breakfast: {
    label: 'Breakfast',
    subLabel: 'Morning Meal',
    icon: 'sunny-outline',
    defaultTargetPercent: 0.25,
  },
  lunch: {
    label: 'Lunch',
    subLabel: 'Midday Meal',
    icon: 'partly-sunny-outline',
    defaultTargetPercent: 0.35,
  },
  dinner: {
    label: 'Dinner',
    subLabel: 'Evening Meal',
    icon: 'moon-outline',
    defaultTargetPercent: 0.3,
  },
  snack: {
    label: 'Snacks & Extras',
    subLabel: 'Snacks',
    icon: 'cafe-outline',
    defaultTargetPercent: 0.1,
  },
};
