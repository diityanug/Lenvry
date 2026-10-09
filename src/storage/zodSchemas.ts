import { z } from 'zod';
import { DEFAULT_CATEGORIES } from '../constants/habits';
import { DEFAULT_NUTRITION_TARGET } from '../types/nutrition';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../types/settings';
import { NOTE_CATEGORIES } from '../types/notes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const safeNum = (fallback = 0) =>
  z
    .unknown()
    .transform((val) => {
      if (typeof val === 'number' && Number.isFinite(val)) return val;
      const parsed = Number(val);
      return Number.isFinite(parsed) ? parsed : fallback;
    });

const safeStr = (fallback = '') =>
  z
    .unknown()
    .transform((val) => {
      if (typeof val === 'string') return val;
      if (typeof val === 'number' || typeof val === 'boolean') return String(val);
      return fallback;
    });

const safeOptStr = () =>
  z
    .unknown()
    .transform((val) => {
      if (typeof val === 'string' && val.trim().length > 0) return val;
      if (typeof val === 'number' || typeof val === 'boolean') return String(val);
      return undefined;
    });

const safeBool = (fallback = false) =>
  z
    .unknown()
    .transform((val) => (typeof val === 'boolean' ? val : fallback));

let uidCounter = 0;
const genUid = (prefix: string) => {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${uidCounter.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
};

const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// SubTask & Habit Schemas
// ---------------------------------------------------------------------------
export const SubTaskSchema = z.object({
  id: safeStr().transform((v) => v || genUid('sub')),
  title: safeStr(''),
  completed: safeBool(false),
});

export const HabitSchema = z.object({
  id: safeStr().transform((v) => v || genUid('habit')),
  title: safeStr('Untitled').transform((v) => v.trim() || 'Untitled'),
  category: safeStr(DEFAULT_CATEGORIES[0]).transform((v) => v.trim() || DEFAULT_CATEGORIES[0]),
  completed: safeBool(false),
  date: safeStr().transform((v) => v || getTodayKey()),
  description: safeOptStr(),
  priority: z.enum(['low', 'medium', 'high']).catch('medium'),
  timeSlot: z.enum(['Anytime', 'Morning', 'Afternoon', 'Evening']).catch('Anytime'),
  reminderTime: safeOptStr(),
  reminderSound: safeOptStr(),
  notificationId: safeOptStr(),
  frequency: z.enum(['once', 'daily', 'weekdays', 'custom_days']).catch('once'),
  repeatDays: z
    .array(z.unknown())
    .catch([])
    .transform((arr) =>
      arr
        .map((d) => (typeof d === 'number' ? d : Number(d)))
        .filter((d) => Number.isFinite(d) && d >= 0 && d <= 6)
    ),
  completedDates: z
    .array(z.unknown())
    .catch([])
    .transform((arr) => arr.filter((x): x is string => typeof x === 'string')),
  subtasks: z
    .array(z.unknown())
    .catch([])
    .transform((arr) =>
      arr.map((item) => {
        const res = SubTaskSchema.safeParse(item);
        return res.success ? res.data : { id: genUid('sub'), title: '', completed: false };
      })
    ),
  extraNotes: z
    .array(z.unknown())
    .catch([])
    .transform((arr) => arr.filter((x): x is string => typeof x === 'string')),
});

// ---------------------------------------------------------------------------
// Finance Schemas
// ---------------------------------------------------------------------------
export const SubAccountSchema = z.object({
  id: safeStr().transform((v) => v || genUid('sub')),
  name: safeStr('Main').transform((v) => v.trim() || 'Main'),
});

export const AccountSchema = z.object({
  id: safeStr().transform((v) => v || genUid('acc')),
  name: safeStr('Account').transform((v) => v.trim() || 'Account'),
  description: safeOptStr(),
  type: z.enum(['Bank', 'E-Wallet', 'Cash', 'Investment', 'Credit Card', 'E-Money']).catch('Cash'),
  currency: z.enum(['IDR', 'USD']).catch('IDR'),
  subAccounts: z
    .array(z.unknown())
    .catch([])
    .transform((arr) => {
      const parsed = arr.map((item) => {
        const res = SubAccountSchema.safeParse(item);
        return res.success ? res.data : { id: genUid('sub'), name: 'Main' };
      });
      return parsed.length > 0 ? parsed : [{ id: genUid('sub'), name: 'Main' }];
    }),
});

export const TransactionSchema = z.object({
  id: safeStr().transform((v) => v || genUid('tx')),
  type: z.enum(['income', 'expense', 'transfer']).catch('expense'),
  amount: safeNum(0),
  description: safeStr(''),
  category: safeStr('Others').transform((v) => v.trim() || 'Others'),
  date: safeStr().transform((v) => v || new Date().toISOString()),
  accountId: safeStr(''),
  subAccountId: safeStr(''),
  toAccountId: safeOptStr(),
  toSubAccountId: safeOptStr(),
});

export const CategoryBudgetSchema = z.object({
  category: safeStr(''),
  limit: safeNum(0),
});

export const CategoryCustomIconSchema = z.object({
  category: safeStr(''),
  icon: safeStr(''),
  color: safeOptStr(),
  bg: safeOptStr(),
});

export const RecurringBillSchema = z.object({
  id: safeStr().transform((v) => v || genUid('bill')),
  name: safeStr('Bill').transform((v) => v.trim() || 'Bill'),
  amount: safeNum(0),
  category: safeStr('Bills & Utilities').transform((v) => v.trim() || 'Bills & Utilities'),
  dueDateDay: safeNum(1).transform((v) => Math.min(31, Math.max(1, Math.round(v)))),
  currency: z.enum(['IDR', 'USD']).catch('IDR'),
});

// ---------------------------------------------------------------------------
// Fitness Schemas
// ---------------------------------------------------------------------------
export const WorkoutSchema = z.object({
  id: safeStr().transform((v) => v || genUid('workout')),
  exercise: safeStr('Exercise').transform((v) => v.trim() || 'Exercise'),
  category: safeStr('Others').transform((v) => v.trim() || 'Others'),
  sets: safeStr(''),
  reps: safeStr(''),
  weight: safeStr(''),
  date: safeStr().transform((v) => v || getTodayKey()),
});

// ---------------------------------------------------------------------------
// Nutrition Schemas
// ---------------------------------------------------------------------------
export const NutritionLogSchema = z.object({
  id: safeStr().transform((v) => v || genUid('log')),
  date: safeStr().transform((v) => v || getTodayKey()),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).catch('snack'),
  foodId: safeOptStr(),
  foodName: safeStr('Food').transform((v) => v.trim() || 'Food'),
  portionGrams: safeNum(0),
  servingDescription: safeStr(''),
  calories: safeNum(0),
  protein: safeNum(0),
  carbs: safeNum(0),
  fat: safeNum(0),
  createdAt: safeStr().transform((v) => v || new Date().toISOString()),
});

export const FoodItemSchema = z.object({
  id: safeStr().transform((v) => v || genUid('food')),
  name: safeStr('Food').transform((v) => v.trim() || 'Food'),
  indonesianName: safeOptStr(),
  category: z
    .enum(['Staples', 'Proteins', 'Vegetables', 'Fruits', 'Dairy & Drinks', 'Snacks', 'Custom'])
    .catch('Custom'),
  calories: safeNum(0),
  protein: safeNum(0),
  carbs: safeNum(0),
  fat: safeNum(0),
  fiber: z
    .unknown()
    .optional()
    .transform((v) => (v === undefined ? undefined : safeNum(0).parse(v))),
  defaultServingText: safeStr('100 g'),
  defaultServingGrams: safeNum(100),
  isCustom: z
    .unknown()
    .optional()
    .transform((v) => (v === undefined ? undefined : safeBool(false).parse(v))),
});

export const NutritionTargetSchema = z.object({
  calories: safeNum(DEFAULT_NUTRITION_TARGET.calories),
  protein: safeNum(DEFAULT_NUTRITION_TARGET.protein),
  carbs: safeNum(DEFAULT_NUTRITION_TARGET.carbs),
  fat: safeNum(DEFAULT_NUTRITION_TARGET.fat),
});

export const WaterLogSchema = z.object({
  date: safeStr().transform((v) => v || getTodayKey()),
  amountMl: safeNum(0).transform((v) => Math.max(0, v)),
  targetMl: safeNum(2000).transform((v) => Math.max(0, v)),
});

// ---------------------------------------------------------------------------
// Notes Schemas
// ---------------------------------------------------------------------------
export const ChecklistItemSchema = z.object({
  id: safeStr().transform((v) => v || genUid('chk')),
  text: safeStr(''),
  done: safeBool(false),
});

const NOTE_CATEGORY_KEYS = Object.keys(NOTE_CATEGORIES) as [string, ...string[]];

export const StickyNoteSchema = z.object({
  id: safeStr().transform((v) => v || genUid('note')),
  title: safeStr('Note').transform((v) => v.trim() || 'Note'),
  type: z.enum(['text', 'checklist']).catch('text'),
  category: z.string().optional().refine(
    (val) => val === undefined || (NOTE_CATEGORY_KEYS as string[]).includes(val),
    { message: 'Invalid note category' }
  ).catch(undefined),
  description: safeStr(''),
  checklist: z
    .array(z.unknown())
    .catch([])
    .transform((arr) =>
      arr.map((item) => {
        const res = ChecklistItemSchema.safeParse(item);
        return res.success ? res.data : { id: genUid('chk'), text: '', done: false };
      })
    ),
  color: z.enum(['amber', 'blue', 'emerald', 'rose', 'purple']).catch('amber'),
  createdAt: safeStr().transform((v) => v || new Date().toISOString()),
  updatedAt: safeStr().transform((v) => v || new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Settings Schemas
// ---------------------------------------------------------------------------
export const NotificationSettingsSchema = z.object({
  enabled: safeBool(DEFAULT_NOTIFICATION_SETTINGS.enabled),
  defaultSound: safeStr(DEFAULT_NOTIFICATION_SETTINGS.defaultSound),
  vibrate: safeBool(DEFAULT_NOTIFICATION_SETTINGS.vibrate),
  fullScreenAlarm: safeBool(DEFAULT_NOTIFICATION_SETTINGS.fullScreenAlarm),
});
